/**
 * The INTELLIGENCE layer. Combines the Subgraph MCP primitives (subgraph-mcp.ts) with the
 * semantic ontology (ontology.ts) to answer protocol-level questions an agent actually has:
 * what is this protocol, what makes it risky, how healthy is it right now, is anything
 * anomalous, how does it compare — and a single structured risk assessment on top.
 */
import { mcpSearch, mcpSchema, mcpQuery } from "./subgraph-mcp.js";
import { distill, formatDistilled, type Distilled } from "./distill.js";
import {
  RISK_FACTORS, CATEGORY_SUMMARY, detectProtocolEntity, isMessariStandard,
  categoryOf, pluralize, type Category, type RiskFactor,
} from "./ontology.js";

// ---------- small utils ----------
const num = (x: unknown): number => {
  const n = parseFloat(String(x ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const pct = (from: number, to: number): number => (from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100);
const round = (n: number, d = 2): number => Math.round(n * 10 ** d) / 10 ** d;
const usd = (n: number): string => {
  if (Math.abs(n) >= 1e9) return `$${round(n / 1e9)}B`;
  if (Math.abs(n) >= 1e6) return `$${round(n / 1e6)}M`;
  if (Math.abs(n) >= 1e3) return `$${round(n / 1e3)}K`;
  return `$${round(n)}`;
};

// ---------- resolve: name/keyword -> subgraph candidates ----------
export interface Candidate { subgraphId: string; name: string; ipfsHash?: string; }

function candidatesFrom(raw: unknown): Candidate[] {
  const list = (raw as { subgraphs?: unknown[] })?.subgraphs ?? (Array.isArray(raw) ? raw : []);
  return (list as any[]).map((s) => ({
    subgraphId: s?.id ?? s?.subgraphId ?? "",
    name: s?.metadata?.displayName ?? s?.displayName ?? s?.name ?? "(unnamed)",
    ipfsHash: s?.currentVersion?.subgraphDeployment?.ipfsHash ?? s?.ipfsHash,
  })).filter((c) => c.subgraphId);
}

const STOP = new Set(
  "the a an of for on in to my is are and or with by how much what which show me get find current latest safe risky risk health status right now this that protocol app".split(/\s+/),
);
function keywords(q: string): string[] {
  const toks = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && t.length > 2 && !STOP.has(t));
  const cands: string[] = [];
  if (toks.length) cands.push(toks.join(" "));
  for (const t of toks) if (!cands.includes(t)) cands.push(t);
  if (!cands.length) cands.push(q.trim());
  return cands.slice(0, 3);
}

export async function resolveProtocol(query: string, limit = 5): Promise<Candidate[]> {
  for (const kw of keywords(query)) {
    const cands = candidatesFrom(await mcpSearch(kw));
    if (cands.length) return cands.slice(0, limit);
  }
  return [];
}

// ---------- profile: subgraph -> schema classification ----------
export interface Profile {
  subgraphId: string;
  name: string;
  category: Category;
  messariStandard: boolean;
  protocolEntity?: string;
  distilled: Distilled;
}

export async function profile(subgraphId: string, name = ""): Promise<Profile> {
  const sdl = await mcpSchema(subgraphId);
  const distilled = distill(sdl);
  const protocolEntity = detectProtocolEntity(distilled);
  const messariStandard = isMessariStandard(distilled);
  const category = categoryOf(protocolEntity, distilled.entityNames);
  return { subgraphId, name, category, messariStandard, protocolEntity, distilled };
}

async function resolveAndProfile(query: string): Promise<Profile | null> {
  const cands = await resolveProtocol(query, 5);
  if (!cands.length) return null;
  return profile(cands[0].subgraphId, cands[0].name);
}

// ---------- health: run the archetype recipe -> structured metrics ----------
export interface Health {
  subgraphId: string;
  name: string;
  network?: string;
  category: Category;
  messariStandard: boolean;
  metrics: Record<string, number>;
  series: { tvl: { t: number; v: number }[] };
  notes: string[];
}

async function gql(id: string, query: string): Promise<any> {
  const res: any = await mcpQuery(id, query);
  if (res?.errors?.length) throw new Error("subgraph query error: " + JSON.stringify(res.errors).slice(0, 300));
  return res?.data ?? res;
}

function lendingQuery(protoField: string): string {
  return `{
    ${protoField}(first: 1) { name network totalValueLockedUSD cumulativeUniqueUsers cumulativeUniqueBorrowers }
    financialsDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
      timestamp totalValueLockedUSD totalBorrowBalanceUSD totalDepositBalanceUSD dailyProtocolSideRevenueUSD
    }
    markets(first: 300, orderBy: totalValueLockedUSD, orderDirection: desc) {
      name totalValueLockedUSD totalBorrowBalanceUSD totalDepositBalanceUSD isActive
    }
    liquidates(first: 200, orderBy: timestamp, orderDirection: desc) { timestamp amountUSD }
  }`;
}
function genericQuery(protoField: string): string {
  return `{
    ${protoField}(first: 1) { name network totalValueLockedUSD cumulativeUniqueUsers }
    financialsDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) { timestamp totalValueLockedUSD }
    usageMetricsDailySnapshots(first: 14, orderBy: timestamp, orderDirection: desc) { timestamp dailyActiveUsers dailyTransactionCount }
  }`;
}

/** Trend helper: series is newest-first. */
function trendPct(series: number[], daysAgo: number): number {
  if (series.length < 2) return 0;
  const now = series[0];
  const past = series[Math.min(daysAgo, series.length - 1)];
  return round(pct(past, now));
}

export async function getHealth(query: string): Promise<Health | { error: string; candidates?: Candidate[] }> {
  const p = await resolveAndProfile(query);
  if (!p) return { error: `No subgraph found for "${query}". Try the protocol's name (e.g. "aave", "uniswap").` };
  return healthFor(p);
}

export async function healthFor(p: Profile): Promise<Health> {
  const metrics: Record<string, number> = {};
  const notes: string[] = [];
  const protoField = p.protocolEntity ? pluralize(p.protocolEntity) : "protocols";
  let network: string | undefined;
  const tvlSeries: { t: number; v: number }[] = [];

  if (!p.messariStandard) {
    notes.push("Custom (non-standard) schema — deep metrics unavailable. Use inspect_schema + run_query for bespoke analysis.");
    return { subgraphId: p.subgraphId, name: p.name, category: p.category, messariStandard: false, metrics, series: { tvl: [] }, notes };
  }

  const data = await gql(p.subgraphId, p.category === "lending" ? lendingQuery(protoField) : genericQuery(protoField));
  const proto = data?.[protoField]?.[0];
  network = proto?.network;
  metrics.tvlUSD = num(proto?.totalValueLockedUSD);
  if (proto?.cumulativeUniqueUsers != null) metrics.cumulativeUsers = num(proto.cumulativeUniqueUsers);

  const fin: any[] = data?.financialsDailySnapshots ?? [];
  for (const s of fin) tvlSeries.push({ t: num(s.timestamp), v: num(s.totalValueLockedUSD) });
  const tvlVals = tvlSeries.map((s) => s.v);
  if (tvlVals.length) {
    metrics.tvlUSD = metrics.tvlUSD || tvlVals[0];
    metrics.tvlChange7dPct = trendPct(tvlVals, 7);
    metrics.tvlChange30dPct = trendPct(tvlVals, 29);
  }

  // Data-quality guard: some subgraphs report TVL in the wrong units (e.g. raw wei, or a bad
  // price), yielding absurd values. Never parrot an implausible number — flag and drop it.
  const TVL_MAX = 1e12; // > $1T for a single protocol is not real
  if (metrics.tvlUSD != null && (!Number.isFinite(metrics.tvlUSD) || metrics.tvlUSD > TVL_MAX)) {
    notes.push("TVL from this subgraph is implausible (likely a units bug) — excluded from analysis.");
    delete metrics.tvlUSD; delete metrics.tvlChange7dPct; delete metrics.tvlChange30dPct;
  }

  if (p.category === "lending") {
    const latest = fin[0] || {};
    const dep = num(latest.totalDepositBalanceUSD);
    const bor = num(latest.totalBorrowBalanceUSD);
    metrics.totalDepositUSD = dep;
    metrics.totalBorrowUSD = bor;
    metrics.utilizationPct = dep > 0 ? round((bor / dep) * 100) : 0;
    const borSeries = fin.map((s) => num(s.totalBorrowBalanceUSD));
    const depSeries = fin.map((s) => num(s.totalDepositBalanceUSD));
    if (depSeries[Math.min(7, depSeries.length - 1)] > 0) {
      const util7 = (borSeries[Math.min(7, borSeries.length - 1)] / depSeries[Math.min(7, depSeries.length - 1)]) * 100;
      metrics.utilizationChange7dPp = round(metrics.utilizationPct - util7);
    }
    const revVals = fin.map((s) => num(s.dailyProtocolSideRevenueUSD));
    if (revVals.length) { metrics.dailyRevenueUSD = round(revVals[0]); metrics.revenueChange7dPct = trendPct(revVals, 7); }

    const markets: any[] = data?.markets ?? [];
    const active = markets.filter((m) => m.isActive);
    metrics.marketCount = markets.length;
    metrics.inactiveMarketCount = markets.length - active.length;
    const mktTvls = markets.map((m) => num(m.totalValueLockedUSD));
    const totalMktTvl = mktTvls.reduce((a, b) => a + b, 0);
    metrics.topMarketSharePct = totalMktTvl > 0 ? round((Math.max(0, ...mktTvls) / totalMktTvl) * 100) : 0;

    const liqs: any[] = data?.liquidates ?? [];
    if (liqs.length) {
      const nowTs = Math.max(...liqs.map((l) => num(l.timestamp)), tvlSeries[0]?.t ?? 0);
      const dayAgo = nowTs - 86400;
      const last24 = liqs.filter((l) => num(l.timestamp) >= dayAgo).reduce((a, l) => a + num(l.amountUSD), 0);
      const spanDays = Math.max(1, (nowTs - Math.min(...liqs.map((l) => num(l.timestamp)))) / 86400);
      const baselineDaily = liqs.reduce((a, l) => a + num(l.amountUSD), 0) / spanDays;
      metrics.liquidations24hUSD = round(last24);
      metrics.liquidationsBaselineDailyUSD = round(baselineDaily);
      metrics.liquidationSpikeX = baselineDaily > 0 ? round(last24 / baselineDaily) : 0;
    }
  } else {
    const usage: any[] = data?.usageMetricsDailySnapshots ?? [];
    if (usage.length) {
      const au = usage.map((u) => num(u.dailyActiveUsers));
      metrics.dailyActiveUsers = au[0];
      metrics.activeUsersChange7dPct = trendPct(au, 7);
    }
  }

  return { subgraphId: p.subgraphId, name: p.name || proto?.name || p.name, network, category: p.category, messariStandard: true, metrics, series: { tvl: tvlSeries }, notes };
}

// ---------- risk scoring ----------
export interface RiskFinding { factor: string; label: string; severity: "low" | "medium" | "high"; detail: string; }
export interface RiskAssessment {
  protocol: string; subgraphId: string; category: Category; network?: string;
  score: number; verdict: "healthy" | "watch" | "elevated" | "critical";
  findings: RiskFinding[]; positives: string[]; metrics: Record<string, number>;
}

function assessFromHealth(h: Health): RiskAssessment {
  const findings: RiskFinding[] = [];
  const positives: string[] = [];
  const m = h.metrics;
  let score = 0; // 0 = healthy, higher = riskier

  const add = (factor: string, label: string, severity: RiskFinding["severity"], detail: string, weight: number) => {
    findings.push({ factor, label, severity, detail }); score += weight;
  };

  // TVL flight
  if (m.tvlChange7dPct != null) {
    if (m.tvlChange7dPct <= -25) add("tvl_trend", "TVL trend", "high", `TVL fell ${m.tvlChange7dPct}% in 7d (${usd(m.tvlUSD)}).`, 40);
    else if (m.tvlChange7dPct <= -10) add("tvl_trend", "TVL trend", "medium", `TVL fell ${m.tvlChange7dPct}% in 7d.`, 20);
    else if (m.tvlChange7dPct >= 3) positives.push(`TVL up ${m.tvlChange7dPct}% in 7d (${usd(m.tvlUSD)}).`);
    else positives.push(`TVL stable (${m.tvlChange7dPct}% 7d, ${usd(m.tvlUSD)}).`);
  }
  // Utilization (lending)
  if (m.utilizationPct != null) {
    if (m.utilizationPct >= 95) add("utilization", "Utilization", "high", `Utilization ${m.utilizationPct}% — almost no free liquidity for withdrawals.`, 35);
    else if (m.utilizationPct >= 85) add("utilization", "Utilization", "medium", `Utilization ${m.utilizationPct}% — liquidity getting tight.`, 18);
    else positives.push(`Utilization healthy at ${m.utilizationPct}%.`);
  }
  // Liquidation spike (lending)
  if (m.liquidationSpikeX != null && m.liquidations24hUSD != null) {
    if (m.liquidationSpikeX >= 3 && m.liquidations24hUSD > 0) add("liquidation_spike", "Liquidation spike", "high", `Liquidations ${m.liquidationSpikeX}x baseline in 24h (${usd(m.liquidations24hUSD)}).`, 30);
    else if (m.liquidationSpikeX >= 1.8 && m.liquidations24hUSD > 0) add("liquidation_spike", "Liquidation spike", "medium", `Liquidations elevated ${m.liquidationSpikeX}x baseline (${usd(m.liquidations24hUSD)}/24h).`, 15);
  }
  // Concentration
  if (m.topMarketSharePct != null && m.topMarketSharePct >= 60 && (m.marketCount ?? 0) > 1) {
    add("concentration", "Market concentration", m.topMarketSharePct >= 80 ? "high" : "medium", `Top market is ${m.topMarketSharePct}% of TVL — single-asset concentration.`, m.topMarketSharePct >= 80 ? 20 : 10);
  }
  // Usage (non-lending)
  if (m.activeUsersChange7dPct != null) {
    if (m.activeUsersChange7dPct <= -40) add("usage_trend", "Usage trend", "medium", `Daily active users down ${m.activeUsersChange7dPct}% in 7d.`, 15);
    else if (m.activeUsersChange7dPct >= 0) positives.push(`Active users steady (${m.activeUsersChange7dPct}% 7d).`);
  }
  // Revenue
  if (m.revenueChange7dPct != null && m.revenueChange7dPct <= -40) add("revenue_trend", "Revenue trend", "low", `Protocol revenue down ${m.revenueChange7dPct}% in 7d.`, 8);

  if (!h.messariStandard) {
    findings.push({ factor: "coverage", label: "Limited coverage", severity: "low", detail: "Custom schema — automated risk metrics unavailable." });
  }

  score = Math.min(100, Math.round(score));
  const verdict: RiskAssessment["verdict"] = score >= 70 ? "critical" : score >= 40 ? "elevated" : score >= 15 ? "watch" : "healthy";
  return { protocol: h.name, subgraphId: h.subgraphId, category: h.category, network: h.network, score, verdict, findings, positives, metrics: m };
}

// ---------- public tool functions ----------
export async function understandProtocol(query: string) {
  const cands = await resolveProtocol(query, 5);
  if (!cands.length) return { error: `No subgraph found for "${query}".` };
  const p = await profile(cands[0].subgraphId, cands[0].name);
  return {
    resolved: { name: p.name, subgraphId: p.subgraphId },
    category: p.category,
    summary: CATEGORY_SUMMARY[p.category],
    messariStandard: p.messariStandard,
    protocolEntity: p.protocolEntity,
    watchFor: RISK_FACTORS[p.category].map((r) => ({ factor: r.key, label: r.label, why: r.meaning })),
    keyEntities: p.distilled.entityNames.slice(0, 24),
    alternatives: cands.slice(1, 5).map((c) => ({ name: c.name, subgraphId: c.subgraphId })),
  };
}

export async function identifyRiskFactors(query: string) {
  const h = await getHealth(query);
  if ("error" in h) return h;
  const a = assessFromHealth(h);
  const applicable: RiskFactor[] = RISK_FACTORS[h.category];
  return {
    protocol: h.name, category: h.category,
    factors: applicable.map((f) => {
      const hit = a.findings.find((x) => x.factor === f.key);
      return { factor: f.key, label: f.label, meaning: f.meaning, status: hit ? hit.severity : "ok", detail: hit?.detail };
    }),
  };
}

export async function getProtocolHealth(query: string) {
  const h = await getHealth(query);
  return h;
}

export async function detectAnomalies(query: string) {
  const h = await getHealth(query);
  if ("error" in h) return h;
  const a = assessFromHealth(h);
  const anomalies = a.findings.filter((f) => f.severity !== "low");
  return { protocol: h.name, category: h.category, anomaliesFound: anomalies.length, anomalies, metrics: h.metrics };
}

export async function assessRisk(query: string) {
  const h = await getHealth(query);
  if ("error" in h) return h;
  return assessFromHealth(h);
}

export async function compareProtocols(queries: string[]) {
  const rows = await Promise.all(queries.map(async (q) => {
    const h = await getHealth(q);
    if ("error" in h) return { query: q, error: h.error };
    const a = assessFromHealth(h);
    return { protocol: h.name, category: h.category, tvlUSD: h.metrics.tvlUSD, tvlChange7dPct: h.metrics.tvlChange7dPct, utilizationPct: h.metrics.utilizationPct, riskScore: a.score, verdict: a.verdict };
  }));
  return { compared: rows };
}

// ---------- schema inspection (distilled passthrough) ----------
export async function inspectSchema(subgraphId: string) {
  const sdl = await mcpSchema(subgraphId);
  const d = distill(sdl);
  return { subgraphId, distilled: formatDistilled(d), entityNames: d.entityNames };
}

export async function searchProtocols(query: string, limit = 6) {
  const cands = await resolveProtocol(query, limit);
  return { matches: cands };
}

// text rendering for MCP responses
export { usd, round };
