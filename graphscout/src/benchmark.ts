/**
 * Head-to-head: answering "is <protocol> risky right now?" with the RAW Subgraph MCP vs
 * with graphscout. Measures the load that lands on the AGENT: MCP round-trips (each is a
 * model turn), bytes/tokens the model must read, whether it must author GraphQL itself, and
 * whether the answer is decision-ready. All against LIVE data.
 *
 *   GRAPH_API_KEY=xxxx npx tsx src/benchmark.ts
 */
import { mcpSearch, mcpSchema, mcpQuery } from "./subgraph-mcp.js";
import { assessRisk } from "./intel.js";

const log = (...a: unknown[]) => console.error(...a);
const bytes = (x: unknown): number => Buffer.byteLength(typeof x === "string" ? x : JSON.stringify(x), "utf8");
const toks = (b: number): number => Math.round(b / 4); // rough chars->tokens
const firstId = (raw: unknown): string => {
  const list = (raw as { subgraphs?: any[] })?.subgraphs ?? (Array.isArray(raw) ? (raw as any[]) : []);
  return list?.[0]?.id ?? list?.[0]?.subgraphId ?? "";
};

// A correct risk query an agent would have to AUTHOR after reading the schema (Messari lending).
const RAW_LENDING_QUERY = `{
  lendingProtocols(first:1){ name network totalValueLockedUSD }
  financialsDailySnapshots(first:30, orderBy: timestamp, orderDirection: desc){ timestamp totalValueLockedUSD totalBorrowBalanceUSD totalDepositBalanceUSD }
  markets(first:300, orderBy: totalValueLockedUSD, orderDirection: desc){ name totalValueLockedUSD totalBorrowBalanceUSD isActive }
  liquidates(first:200, orderBy: timestamp, orderDirection: desc){ timestamp amountUSD }
}`;

interface Row {
  protocol: string;
  baseCalls: number; baseBytes: number; baseTokens: number; baseVerdict: boolean;
  gsCalls: number; gsBytes: number; gsTokens: number; gsVerdict: boolean;
  callsFactor: number; tokenFactor: number;
  baseMs: number; gsMs: number;
}

async function benchOne(p: string): Promise<Row> {
  // ---- BASELINE: raw Subgraph MCP path (what a capable agent must do itself) ----
  const b0 = Date.now();
  const search = await mcpSearch(p);              // round-trip 1
  const id = firstId(search);
  const schema = await mcpSchema(id);            // round-trip 2  (huge SDL the model must read)
  const raw = await mcpQuery(id, RAW_LENDING_QUERY); // round-trip 3 (agent-authored query)
  const baseMs = Date.now() - b0;
  const baseCalls = 3; // conservative: excludes query-authoring retries
  // the agent must READ the schema (to write the query) + the raw rows (to interpret):
  const baseBytes = bytes(schema) + bytes(raw);
  const baseVerdict = false; // raw rows only — no risk score/verdict; the agent must reason it out

  // ---- GRAPHSCOUT: one call, decision-ready ----
  const g0 = Date.now();
  const assessment = await assessRisk(p);        // round-trip 1
  const gsMs = Date.now() - g0;
  const gsBytes = bytes(assessment);
  const gsVerdict = !!(assessment as any)?.verdict;

  return {
    protocol: p,
    baseCalls, baseBytes, baseTokens: toks(baseBytes), baseVerdict,
    gsCalls: 1, gsBytes, gsTokens: toks(gsBytes), gsVerdict,
    callsFactor: baseCalls / 1,
    tokenFactor: Math.round((baseBytes / gsBytes) * 10) / 10,
    baseMs, gsMs,
  };
}

async function main() {
  // protocols from argv, else default to the Ethereum lenders; e.g. `tsx src/benchmark.ts moonwell`
  const protocols = process.argv.slice(2).length ? process.argv.slice(2) : ["aave", "compound"];
  const rows: Row[] = [];
  for (const p of protocols) {
    log(`benchmarking ${p} ...`);
    try { rows.push(await benchOne(p)); } catch (e) { log(`  ${p} failed:`, (e as Error).message); }
  }

  const avg = (f: (r: Row) => number) => Math.round((rows.reduce((a, r) => a + f(r), 0) / rows.length) * 10) / 10;

  log("\n===== RESULTS (JSON) =====");
  log(JSON.stringify({
    rows,
    averages: {
      baseTokens: avg((r) => r.baseTokens),
      gsTokens: avg((r) => r.gsTokens),
      tokenReductionFactor: avg((r) => r.tokenFactor),
      callsReductionFactor: avg((r) => r.callsFactor),
    },
  }, null, 2));

  log("\n===== MARKDOWN TABLE =====");
  log("| Protocol | Raw MCP round-trips | graphscout round-trips | Raw tokens (read) | graphscout tokens | Token reduction | Risk verdict? (raw / gs) |");
  log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    log(`| ${r.protocol} | ${r.baseCalls}+ | ${r.gsCalls} | ~${r.baseTokens.toLocaleString()} | ~${r.gsTokens.toLocaleString()} | ${r.tokenFactor}x fewer | ${r.baseVerdict ? "yes" : "no"} / ${r.gsVerdict ? "yes" : "no"} |`);
  }
  log(`\nAvg tokens the model must read: raw ~${avg((r) => r.baseTokens).toLocaleString()} -> graphscout ~${avg((r) => r.gsTokens).toLocaleString()} (${avg((r) => r.tokenFactor)}x fewer).`);
  log(`Agent-facing round-trips: raw >=3 -> graphscout 1.`);
  process.exit(0);
}
main().catch((e) => { log("BENCHMARK FAILED:", e); process.exit(1); });
