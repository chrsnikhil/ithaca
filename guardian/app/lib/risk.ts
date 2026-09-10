// Guardian risk brain (TS port of guardian-agent/risk.js) — pure + deterministic.
export type Position = { symbol: string; price?: number; isStable?: boolean; drawdownPct?: number };
export type Portfolio = { positions?: Position[]; healthFactor?: number | null };

const D = { drawdownPct: 0.05, depegPct: 0.005, healthFactorFloor: 1.1 };

export function assessRisk(p: Portfolio, cfg: Partial<typeof D> = {}) {
  const c = { ...D, ...cfg };
  const reasons: string[] = [];
  let severity = 0;
  for (const pos of p.positions || []) {
    if (pos.isStable && typeof pos.price === "number") {
      const off = Math.abs(pos.price - 1);
      if (off > c.depegPct) {
        reasons.push(`${pos.symbol} depeg: $${pos.price.toFixed(4)} (off ${(off * 100).toFixed(2)}%)`);
        severity = Math.max(severity, 3);
      }
    }
    if (typeof pos.drawdownPct === "number" && pos.drawdownPct >= c.drawdownPct) {
      reasons.push(`${pos.symbol} drawdown ${(pos.drawdownPct * 100).toFixed(1)}%`);
      severity = Math.max(severity, 2);
    }
  }
  if (typeof p.healthFactor === "number" && p.healthFactor < c.healthFactorFloor) {
    reasons.push(`health factor ${p.healthFactor.toFixed(2)} < ${c.healthFactorFloor}`);
    severity = Math.max(severity, 4);
  }
  return { danger: reasons.length > 0, severity, reasons };
}
