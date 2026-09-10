// Live proof: graphscout-fed, Conservative venue scoring ranks Guardian's markets by
// RISK-ADJUSTED score — so a high-APR but `watch` market is correctly down-ranked.
//   node test-picker.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { rankMarkets } = require("./picker");
const markets = require("./markets");

(async () => {
  console.log("Ranking markets (yield x graphscout-risk x liquidity, Conservative)...\n");
  const ranked = await rankMarkets(markets);
  for (const m of ranked) {
    const tvl = m.tvlUSD ? `$${Math.round(m.tvlUSD / 1e6)}M` : "—";
    console.log(
      `  score ${String(m.score).padStart(3)}  ${m.name.padEnd(18)} apr ${m.apr}%  graphscout=${m.verdict}(${m.riskScore ?? "—"}) tvl ${tvl}` +
      `  [out ${m.subscores.output} rel ${m.subscores.reliability} conf ${m.subscores.confidence} liq ${m.subscores.liquidity} perf ${m.subscores.performance}]`,
    );
  }
  console.log(`\nPICK → ${ranked[0].name} (score ${ranked[0].score}, ${ranked[0].apr}% APR, graphscout ${ranked[0].verdict})`);
  process.exit(0);
})();
