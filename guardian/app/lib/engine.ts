import "server-only";
import { ethers } from "ethers";
import { computeMarkets } from "./markets";
import { vaultFor, type Policy, type Escalation } from "./vaultMulti";
import type { Network } from "./deployments";

// Guardian's autonomous BRAIN, ported from the daemon to run stateless inside Vercel. One tick:
//   rank the markets (graphscout) → read chain state → decide (protect on danger / invest idle /
//   rotate to the best market / hold) → execute within the Flex-signed Policy. The signed mandate
//   travels in each request (held client-side in the browser), so no server-side session is needed.
const MIN = 1_000_000n;          // 1 USDC — ignore dust
const REBAL_GAP = 8;             // min score improvement to justify a rotation (avoid churn)
const usd = (x: bigint) => ethers.formatUnits(x, 6);
const big = (u: number) => BigInt(Math.round(u * 1e6));

type Ranked = {
  id: string; name: string; apr: number; verdict: string; score: number; pick?: boolean;
  tvlUSD?: number | null; tvlChange7dPct?: number | null;
};
export type TickResult = {
  ok: boolean; action: string; reason: string; amountUsdc?: string; tx?: string; error?: string;
};

// The dashboard's state view: real multi-vault balances + the live market ranking, positions merged
// in. Shape matches what GuardianShell expects (position = total invested; apr = the pick's yield).
export async function stateView(haven?: string, network: Network = "baseSepolia") {
  const vault = vaultFor(network);
  const [st, ranked] = await Promise.all([
    vault.readMultiState(haven),
    computeMarkets() as Promise<Ranked[]>,
  ]);
  const markets = ranked.map((m) => ({
    ...m,
    venue: vault.venueOf(m.id),
    position: st.positions[m.id] ? usd(BigInt(st.positions[m.id])) : "0",
  }));
  return {
    source: "chain", vault: st.vault, chainId: st.chainId, explorerBase: st.explorerBase,
    idle: usd(BigInt(st.idle)), position: usd(BigInt(st.total)), havenBal: usd(BigInt(st.havenBal)),
    haven: st.haven, agent: st.agent, owner: st.owner,
    apr: ranked[0]?.apr ?? null, markets,
  };
}

// AUTONOMOUS tick — decide + act. `danger` is the client-side "simulate danger" flip (the demo's
// crisis trigger); a real critical verdict from graphscout evacuates too.
export async function runTick(policy: Policy, signature: string, danger = false, network: Network = "baseSepolia"): Promise<TickResult> {
  const vault = vaultFor(network);
  const v = vault.verifyPolicy(policy, signature);
  if (!v.ok) return { ok: false, action: "ERROR", reason: v.error || "bad policy", error: v.error };

  const [st, ranked] = await Promise.all([
    vault.readMultiState(policy.safeHaven),
    computeMarkets() as Promise<Ranked[]>,
  ]);
  const top = ranked[0];
  const topVenue = vault.venueOf(top.id);
  if (!topVenue) return { ok: false, action: "ERROR", reason: "no venue for the top market" };

  // where funds are currently held (largest position), plus its live rank
  const held = vault.MARKETS
    .map((m) => ({ m, pos: BigInt(st.positions[m.id] || "0"), rank: ranked.find((r) => r.id === m.id) }))
    .filter((x) => x.pos >= MIN)
    .sort((a, b) => (b.pos > a.pos ? 1 : -1))[0];

  const isDanger = danger || top.verdict === "critical" || held?.rank?.verdict === "critical";

  if (isDanger) {
    const amount = BigInt(st.total) + BigInt(st.idle);
    if (amount < MIN) return { ok: true, action: "HOLD", reason: "danger, but nothing to protect" };
    const r = await vault.protect(policy, signature, amount);
    return { ok: true, action: "PROTECT", amountUsdc: usd(amount), tx: r.url,
      reason: `Evacuating everything to your safe haven — ${danger ? "danger simulated" : `${top.name} critical`}` };
  }
  if (BigInt(st.idle) >= MIN) {
    // Contract rule is POINT-IN-TIME: totalPosition + amount ≤ investCap. Deploy only the headroom
    // (never the raw idle — yield/dust can push idle past the cap and revert OverInvestCap).
    const cap = BigInt(policy.investCap);
    const headroom = cap > BigInt(st.total) ? cap - BigInt(st.total) : 0n;
    const idleBI = BigInt(st.idle);
    const amount = idleBI < headroom ? idleBI : headroom;
    if (amount >= MIN) {
      const r = await vault.invest(policy, signature, topVenue, amount);
      return { ok: true, action: "INVEST", amountUsdc: usd(amount), tx: r.url,
        reason: `Deploying idle USDC into ${top.name} — best risk-adjusted (score ${top.score}, graphscout ${top.verdict})` };
    }
    // idle exists but we're already at the invest cap → fall through to rebalance/hold
  }
  if (held && held.m.id !== top.id && (held.rank!.verdict !== "healthy" || top.score - held.rank!.score >= REBAL_GAP)) {
    const r = await vault.rebalance(held.m.venue, topVenue, held.pos);
    return { ok: true, action: "REBALANCE", amountUsdc: usd(held.pos), tx: r.url,
      reason: `Switching ${held.m.name} (${held.rank!.verdict}, ${held.rank!.score}) → ${top.name} (${top.verdict}, ${top.score})` };
  }
  return { ok: true, action: "HOLD", reason: held ? `Holding ${held.m.name} — still the best market` : "No idle funds to deploy" };
}

// EXPLICIT commands (voice "put my money to work" / the panel buttons).
export async function runCommand(policy: Policy, signature: string, action: string, amountUsdc?: number, network: Network = "baseSepolia"): Promise<TickResult> {
  const vault = vaultFor(network);
  const v = vault.verifyPolicy(policy, signature);
  if (!v.ok) return { ok: false, action: "ERROR", reason: v.error || "bad policy", error: v.error };

  const [st, ranked] = await Promise.all([
    vault.readMultiState(policy.safeHaven),
    computeMarkets() as Promise<Ranked[]>,
  ]);
  const top = ranked[0];
  const topVenue = vault.venueOf(top.id)!;
  const heldOf = () => vault.MARKETS.map((m) => ({ m, pos: BigInt(st.positions[m.id] || "0") })).filter((x) => x.pos >= MIN)[0];

  if (action === "invest") {
    const idleBI = BigInt(st.idle);
    const cap = BigInt(policy.investCap);
    const headroom = cap > BigInt(st.total) ? cap - BigInt(st.total) : 0n; // point-in-time cap headroom
    let a = amountUsdc != null ? big(amountUsdc) : idleBI;
    if (a > idleBI) a = idleBI;       // can't deploy more than is idle
    if (a > headroom) a = headroom;   // totalPosition + a ≤ investCap
    if (a < MIN) return { ok: false, action: "ERROR", reason: headroom < MIN ? "already at your invest cap" : "no idle USDC to deploy" };
    const r = await vault.invest(policy, signature, topVenue, a);
    return { ok: true, action: "INVEST", amountUsdc: usd(a), tx: r.url, reason: `Deployed into ${top.name}` };
  }
  if (action === "protect") {
    const a = amountUsdc != null ? big(amountUsdc) : BigInt(st.total) + BigInt(st.idle);
    if (a < MIN) return { ok: false, action: "ERROR", reason: "nothing to protect" };
    const r = await vault.protect(policy, signature, a);
    return { ok: true, action: "PROTECT", amountUsdc: usd(a), tx: r.url, reason: "Evacuated to your safe haven" };
  }
  if (action === "derisk") {
    const h = heldOf();
    if (!h) return { ok: false, action: "ERROR", reason: "no position to pull back" };
    const r = await vault.deRisk(h.m.venue, h.pos);
    return { ok: true, action: "DERISK", amountUsdc: usd(h.pos), tx: r.url, reason: `Pulled ${h.m.name} back into the vault` };
  }
  if (action === "rebalance") {
    const h = heldOf();
    if (!h) return { ok: false, action: "ERROR", reason: "no position to move" };
    const r = await vault.rebalance(h.m.venue, topVenue, h.pos);
    return { ok: true, action: "REBALANCE", amountUsdc: usd(h.pos), tx: r.url, reason: `Switched to ${top.name}` };
  }
  return { ok: false, action: "ERROR", reason: "unknown action" };
}

// HIGH-RISK: a single-use, freshly Flex-approved evacuation beyond the standing mandate.
export async function runEscalation(escalation: Escalation, signature: string, amountUsdc?: number, network: Network = "baseSepolia"): Promise<TickResult> {
  const vault = vaultFor(network);
  const v = vault.verifyEscalation(escalation, signature);
  if (!v.ok) return { ok: false, action: "ERROR", reason: v.error || "bad escalation", error: v.error };
  const amt = amountUsdc != null ? big(amountUsdc) : BigInt(escalation.amount);
  const r = await vault.approveAndProtect(escalation, signature, amt);
  return { ok: true, action: "ESCALATE", amountUsdc: usd(amt), tx: r.url, reason: "High-risk evacuation approved on your Flex" };
}
