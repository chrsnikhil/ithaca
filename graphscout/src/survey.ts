/**
 * Breadth survey: run graphscout's assess_risk across MANY protocols (lending / DEX / yield /
 * staking, multiple chains) to show it generalizes — one recipe over Messari-standardized
 * subgraphs. Prints a markdown table + JSON. All live data.
 *   GRAPH_API_KEY=xxxx npx tsx src/survey.ts
 */
import { assessRisk } from "./intel.js";

const log = (...a: unknown[]) => console.error(...a);

const PROTOCOLS = [
  // lending
  "aave", "compound", "moonwell", "morpho", "spark", "venus", "benqi", "radiant", "silo finance",
  // dex
  "uniswap", "sushiswap", "curve", "balancer", "pancakeswap", "quickswap", "camelot",
  // yield / vaults
  "yearn", "beefy", "convex",
  // staking / LST
  "lido", "rocket pool", "frax",
];

const usdM = (n?: number) => (n == null ? "—" : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(1)}M`);
const pctS = (n?: number) => (n == null ? "—" : `${n > 0 ? "+" : ""}${n}%`);

async function one(q: string) {
  try {
    const a: any = await assessRisk(q);
    if (a?.error) return { q, error: a.error };
    return {
      q, protocol: a.protocol, network: a.network ?? "—", category: a.category,
      tvlUSD: a.metrics?.tvlUSD, tvl7d: a.metrics?.tvlChange7dPct, util: a.metrics?.utilizationPct,
      score: a.score, verdict: a.verdict, top: a.findings?.[0]?.detail ?? "",
      covered: a.metrics && Object.keys(a.metrics).length > 0,
    };
  } catch (e) { return { q, error: (e as Error).message }; }
}

async function main() {
  const results: any[] = [];
  const BATCH = 3;
  for (let i = 0; i < PROTOCOLS.length; i += BATCH) {
    const b = PROTOCOLS.slice(i, i + BATCH);
    results.push(...(await Promise.all(b.map(one))));
    log(`...${results.length}/${PROTOCOLS.length}`);
  }

  log("\n===== JSON =====");
  log(JSON.stringify(results, null, 1));

  const covered = results.filter((r) => !r.error && r.covered);
  log("\n===== MARKDOWN TABLE =====");
  log("| Query | Protocol | Chain | Type | TVL | TVL 7d | Util | Risk | Verdict |");
  log("|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    if (r.error) { log(`| ${r.q} | _(no standard subgraph)_ |  |  |  |  |  |  |  |`); continue; }
    log(`| ${r.q} | ${r.protocol} | ${r.network} | ${r.category} | ${usdM(r.tvlUSD)} | ${pctS(r.tvl7d)} | ${r.util != null ? r.util + "%" : "—"} | ${r.score} | ${r.verdict} |`);
  }
  log(`\nFull metric coverage: ${covered.length}/${results.length} protocols.`);
  const flags = covered.filter((r) => r.verdict !== "healthy");
  log(`Live risk signals surfaced (verdict != healthy): ${flags.length} — ${flags.map((r) => `${r.protocol} (${r.verdict})`).join(", ")}`);
  process.exit(0);
}
main().catch((e) => { log("SURVEY FAILED:", e); process.exit(1); });
