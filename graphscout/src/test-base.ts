/**
 * Explore + assess the protocols GUARDIAN is actually exposed to on Base, so graphscout's risk
 * lens matches Guardian's real venue (Aave on Base) rather than a default Ethereum subgraph.
 *   GRAPH_API_KEY=xxxx npx tsx src/test-base.ts
 */
import { searchProtocols, assessRisk, getProtocolHealth } from "./intel.js";

const log = (...a: unknown[]) => console.error(...a);

async function main() {
  for (const q of ["aave v3 base", "aave base", "aave", "compound base", "moonwell", "uniswap v3 base"]) {
    const s: any = await searchProtocols(q, 6);
    log(`\n### search "${q}" ->`, (s.matches || []).map((m: any) => `${m.name} [${m.subgraphId.slice(0, 8)}…]`).join(" | ") || "(none)");
  }

  for (const q of ["aave v3 base", "moonwell", "compound base"]) {
    log(`\n===== assess_risk("${q}") =====`);
    log(JSON.stringify(await assessRisk(q), null, 2));
  }
  process.exit(0);
}
main().catch((e) => { log("FAILED:", e); process.exit(1); });
