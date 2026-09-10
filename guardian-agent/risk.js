// Guardian — risk assessment (the "brain" logic).
// Pure + deterministic so it's unit-testable and, later, portable into a confidential
// enclave if we ever revisit it. Downstream, any rescue it triggers is still hard-bounded
// by the Flex-signed mandate enforced on-chain — this only decides *whether* danger exists.
//
// Input: a normalized portfolio snapshot from The Graph (see graph.js):
//   { positions: [{ symbol, price?, isStable?, drawdownPct? }], healthFactor?, at? }
// Output: { danger, severity(0-4), reasons[], at }

const DEFAULTS = {
  drawdownPct: 0.05, // >5% drop over the lookback window
  depegPct: 0.005, // stablecoin off peg by >0.5%
  healthFactorFloor: 1.1, // lending health factor below this = danger
};

function assessRisk(portfolio, cfg = {}) {
  const c = { ...DEFAULTS, ...cfg };
  const reasons = [];
  let severity = 0;

  for (const p of portfolio.positions || []) {
    // 1. Stablecoin depeg
    if (p.isStable && typeof p.price === "number") {
      const off = Math.abs(p.price - 1);
      if (off > c.depegPct) {
        reasons.push(`${p.symbol} depeg: $${p.price.toFixed(4)} (off ${(off * 100).toFixed(2)}%)`);
        severity = Math.max(severity, 3);
      }
    }
    // 2. Drawdown
    if (typeof p.drawdownPct === "number" && p.drawdownPct >= c.drawdownPct) {
      reasons.push(`${p.symbol} drawdown ${(p.drawdownPct * 100).toFixed(1)}%`);
      severity = Math.max(severity, 2);
    }
  }

  // 3. Lending health factor (highest-severity trigger)
  if (typeof portfolio.healthFactor === "number" && portfolio.healthFactor < c.healthFactorFloor) {
    reasons.push(`health factor ${portfolio.healthFactor.toFixed(2)} < ${c.healthFactorFloor}`);
    severity = Math.max(severity, 4);
  }

  return { danger: reasons.length > 0, severity, reasons, at: portfolio.at ?? null };
}

module.exports = { assessRisk, DEFAULTS };
