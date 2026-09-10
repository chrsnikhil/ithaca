import "server-only";
import { discoverSubgraph, querySubgraph } from "./subgraphMcp";

// Server-side market ranking (mirrors graphscout's approach) so the Markets panel ALWAYS shows
// live data on the hosted app — even when the autonomous daemon isn't reachable. Reuses the app's
// Subgraph MCP client (The Graph). Cached briefly so polling doesn't hammer the gateway.
const MARKETS = [
  { id: "moonwell", name: "Moonwell (Base)", graphKey: "moonwell", apr: 8.0 },
  { id: "aave", name: "Aave v3", graphKey: "aave", apr: 5.0 },
  { id: "compound", name: "Compound", graphKey: "compound", apr: 6.0 },
];

const VERDICT_REL: Record<string, number> = { healthy: 95, watch: 55, elevated: 25, critical: 5, unknown: 45 };
const num = (x: unknown) => { const n = parseFloat(String(x ?? "")); return Number.isFinite(n) ? n : 0; };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const LENDING_Q = `{
  lendingProtocols(first:1){ name totalValueLockedUSD }
  financialsDailySnapshots(first:30, orderBy: timestamp, orderDirection: desc){ timestamp totalValueLockedUSD totalBorrowBalanceUSD totalDepositBalanceUSD }
}`;

type Assessed = {
  id: string; name: string; apr: number;
  verdict: string; tvlUSD: number | null; tvlChange7dPct: number | null; utilizationPct: number | null;
};

async function topSubgraphId(keyword: string): Promise<string | null> {
  const r = (await discoverSubgraph(keyword)) as { subgraphs?: { id: string }[] } | null;
  return r?.subgraphs?.[0]?.id ?? null;
}

async function assessOne(m: (typeof MARKETS)[number]): Promise<Assessed> {
  const base = { id: m.id, name: m.name, apr: m.apr };
  try {
    const sid = await topSubgraphId(m.graphKey);
    if (!sid) return { ...base, verdict: "unknown", tvlUSD: null, tvlChange7dPct: null, utilizationPct: null };
    const res = (await querySubgraph(sid, LENDING_Q)) as { data?: Record<string, unknown> } | Record<string, unknown>;
    const d = ((res as { data?: Record<string, unknown> })?.data ?? res) as Record<string, unknown>;
    const fin = (d?.financialsDailySnapshots as Record<string, unknown>[]) ?? [];
    const proto = (d?.lendingProtocols as Record<string, unknown>[])?.[0];
    const tvlVals = fin.map((s) => num(s.totalValueLockedUSD));
    const tvlUSD = tvlVals[0] || num(proto?.totalValueLockedUSD);
    const past7 = tvlVals[Math.min(7, tvlVals.length - 1)] || tvlUSD;
    const tvlChange7dPct = past7 ? round(((tvlUSD - past7) / past7) * 100) : 0;
    const latest = fin[0] ?? {};
    const dep = num(latest.totalDepositBalanceUSD), bor = num(latest.totalBorrowBalanceUSD);
    const utilizationPct = dep > 0 ? round((bor / dep) * 100) : 0;
    let verdict = "healthy";
    if (tvlChange7dPct <= -25 || utilizationPct >= 95) verdict = "elevated";
    else if (tvlChange7dPct <= -10 || utilizationPct >= 85) verdict = "watch";
    // data-quality guard: implausible TVL (units bug) → don't trust it
    if (tvlUSD > 1e12) return { ...base, verdict: "unknown", tvlUSD: null, tvlChange7dPct: null, utilizationPct };
    return { ...base, verdict, tvlUSD, tvlChange7dPct, utilizationPct };
  } catch {
    return { ...base, verdict: "unknown", tvlUSD: null, tvlChange7dPct: null, utilizationPct: null };
  }
}

let cache: { at: number; markets: unknown[] } | null = null;
const TTL = 60_000;

export async function computeMarkets(): Promise<unknown[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.markets;
  const assessed = await Promise.all(MARKETS.map(assessOne));
  const maxApr = Math.max(...assessed.map((a) => a.apr), 0.0001);
  const maxTvl = Math.max(...assessed.map((a) => a.tvlUSD || 0), 1);
  const scored = assessed
    .map((a) => {
      const output = clamp((a.apr / maxApr) * 100, 0, 100);
      const rel = VERDICT_REL[a.verdict] ?? 45;
      const liq = a.tvlUSD ? clamp((a.tvlUSD / maxTvl) * 100, 0, 100) : 50;
      // Conservative preset (from graphscout's picker): output25 cost15 time10 rel20 conf20 liq5 perf5
      const score = Math.round((output * 25 + 70 * 15 + 70 * 10 + rel * 20 + rel * 20 + liq * 5 + 50 * 5) / 100);
      return { ...a, score };
    })
    .sort((x, y) => y.score - x.score)
    .map((m, i) => ({ ...m, pick: i === 0, position: "0" }));
  cache = { at: Date.now(), markets: scored };
  return scored;
}
