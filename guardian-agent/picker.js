// Guardian's market-picking brain — a JS port of FlashArb's VenueComparator (multi-criteria
// venue scoring), adapted for DEFENSIVE allocation. Instead of "which venue gives the most
// arbitrage output", it answers "which market is the best RISK-ADJUSTED place for idle USDC":
//
//   score = yield (upside) × graphscout risk (reliability + confidence) × liquidity
//
// Conservative preset (reliability + confidence weighted highest, straight from VenueComparator)
// means a high-APR but shaky market (graphscout says `watch`/`elevated`) is correctly down-ranked
// below a slightly-lower-APR healthy one. graphscout is the sole risk oracle (protocol health via
// The Graph); no separate price oracle.
const graphscout = require("./graphscout-client");

// FlashArb VenueComparator.getConservativeWeights()
const CONSERVATIVE = { output: 25, cost: 15, time: 10, reliability: 20, confidence: 20, liquidity: 5, performance: 5 };

// graphscout verdict -> reliability sub-score (0-100)
const VERDICT_RELIABILITY = { healthy: 95, watch: 55, elevated: 25, critical: 5, unknown: 45 };

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Score a single market from its enriched inputs. All sub-scores are 0-100. */
function scoreMarket(m, maxApr, maxTvl, weights = CONSERVATIVE) {
  const output = maxApr > 0 ? clamp((m.apr / maxApr) * 100, 0, 100) : 50; // yield upside
  const reliability = VERDICT_RELIABILITY[m.verdict] ?? 45; // graphscout verdict
  // confidence: full graphscout coverage + low risk score = high; shallow coverage = low
  const confidence = m.covered ? clamp(100 - (m.riskScore ?? 0), 10, 100) : 30;
  const liquidity = maxTvl > 0 && m.tvlUSD ? clamp((m.tvlUSD / maxTvl) * 100, 0, 100) : 50;
  const performance = clamp(50 + (m.tvlChange7dPct ?? 0) * 2, 0, 100); // positive TVL trend = good
  const cost = 70, time = 70; // same chain -> neutral & equal across markets
  const w = weights;
  const score = (
    output * w.output + cost * w.cost + time * w.time +
    reliability * w.reliability + confidence * w.confidence +
    liquidity * w.liquidity + performance * w.performance
  ) / 100;
  return {
    ...m,
    subscores: { output: Math.round(output), reliability, confidence: Math.round(confidence), liquidity: Math.round(liquidity), performance: Math.round(performance) },
    score: Math.round(score),
  };
}

/**
 * Rank markets by risk-adjusted score. Each market: { id, name, venue, apr, graphKey }.
 * Enriches each with a live graphscout assessment, then scores + sorts (best first).
 */
async function rankMarkets(markets, weights = CONSERVATIVE) {
  const enriched = [];
  for (const m of markets) {
    let g = null;
    try { g = await graphscout.assessProtocol(m.graphKey || m.name); } catch { /* graphscout best-effort */ }
    enriched.push({
      ...m,
      verdict: g?.verdict ?? "unknown",
      riskScore: g?.score ?? null,
      tvlUSD: g?.metrics?.tvlUSD ?? null,
      tvlChange7dPct: g?.metrics?.tvlChange7dPct ?? null,
      covered: !!(g && g.metrics && Object.keys(g.metrics).length),
    });
  }
  const maxApr = Math.max(...enriched.map((m) => m.apr || 0), 0.0001);
  const maxTvl = Math.max(...enriched.map((m) => m.tvlUSD || 0), 1);
  return enriched.map((m) => scoreMarket(m, maxApr, maxTvl, weights)).sort((a, b) => b.score - a.score);
}

module.exports = { rankMarkets, scoreMarket, CONSERVATIVE, VERDICT_RELIABILITY };
