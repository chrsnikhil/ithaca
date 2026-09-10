// Guardian's MULTI-MARKET autonomous brain. Every interval it:
//   1. RANKS the markets (picker.js) using graphscout's live risk read + yield + liquidity
//   2. DECIDES: deploy idle USDC into the best market, SWITCH (rebalance) when the held market
//      degrades or a clearly better one appears, EVACUATE (protect) to the safe haven on danger
//   3. ACTS on GuardianVaultMulti, bounded by the Flex-signed Policy
// Serves a live feed the PWA polls (/state includes the ranked markets + positions), plus
// voice/manual /command, a demo /dial, and /arm (Flex-signed policy).
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const fs = require("fs");
const { ethers } = require("ethers");
const { rankMarkets } = require("./picker");
const markets = require("./markets");
const { connect, loadPolicy, send, readState } = require("./vault-multi");
let fetchPortfolio, assessRisk;
try { ({ fetchPortfolio } = require("./graph")); ({ assessRisk } = require("./risk")); } catch { /* depeg sense optional */ }

const PORT = Number(process.env.MULTI_DAEMON_PORT || 8788);
const INTERVAL = Number(process.env.INTERVAL_MS || 20000);
const GRAPH_API_KEY = process.env.GRAPH_API_KEY;
const DAEMON_TOKEN = process.env.DAEMON_TOKEN || "";
const MIN = BigInt(Math.round(Number(process.env.MIN_ACTION_USDC || 1) * 1e6));
const REBAL_MIN_SCORE_GAP = Number(process.env.REBAL_MIN_SCORE_GAP || 8); // avoid churn
const usd = (x) => ethers.formatUnits(BigInt(x), 6);

let dial = process.env.DANGER_DIAL === "on";
let tickN = 0, running = false;
const startedAt = Date.now();
const activity = [];
let lastRanked = [], lastState = null, lastReason = null;

function record(e) {
  const entry = { ts: Date.now(), tick: tickN, ...e };
  activity.push(entry); if (activity.length > 200) activity.shift();
  try { fs.appendFileSync(path.join(__dirname, "activity-multi.jsonl"), JSON.stringify(entry) + "\n"); } catch {}
  console.log(`[t${entry.tick}] ${entry.action} — ${entry.reason}${entry.txUrl ? " " + entry.txUrl : ""}`);
  return entry;
}

// --- bounded actions ---
async function doInvest(ctx, policy, venue, amount, reason) {
  const r = await send(() => ctx.vault.invest(policy.tuple, policy.signature, venue, amount), { wait: false });
  return record({ action: "INVEST", venue, reason, amountUsdc: usd(amount), txUrl: r.url });
}
async function doRebalance(ctx, from, to, amount, reason) {
  const r = await send(() => ctx.vault.rebalance(from, to, amount), { wait: false });
  return record({ action: "REBALANCE", from, to, reason, amountUsdc: usd(amount), txUrl: r.url });
}
async function doProtect(ctx, policy, amount, reason) {
  const r = await send(() => ctx.vault.protect(policy.tuple, policy.signature, amount), { wait: false });
  return record({ action: "PROTECT", reason, amountUsdc: usd(amount), txUrl: r.url });
}

async function senseDepeg() {
  if (!fetchPortfolio || !assessRisk) return null;
  try {
    const pf = dial
      ? { positions: [{ symbol: "USDC", isStable: true, price: 0.94 }], healthFactor: 1.03 }
      : await fetchPortfolio({ apiKey: GRAPH_API_KEY });
    return assessRisk(pf);
  } catch { return null; }
}

async function tick() {
  if (running) return; running = true; tickN++;
  try {
    const ranked = await rankMarkets(markets);
    lastRanked = ranked;
    const ctx = connect();
    const policy = loadPolicy();
    const state = await readState(ctx, markets);
    lastState = state;
    const depeg = await senseDepeg();

    const top = ranked[0];
    const marketOf = (id) => markets.find((m) => m.id === id);
    // where funds are currently held (largest position)
    const heldEntry = markets
      .map((m) => ({ m, pos: BigInt(state.positions[m.id] || "0") }))
      .filter((x) => x.pos >= MIN)
      .sort((a, b) => (b.pos > a.pos ? 1 : -1))[0];
    const heldRank = heldEntry ? ranked.find((r) => r.id === heldEntry.m.id) : null;

    const danger = dial || (depeg && depeg.severity >= 3) || top.verdict === "critical" || heldRank?.verdict === "critical";

    if (!policy) { lastReason = "not armed"; record({ action: "HOLD", reason: "no signed policy — arm the guardian on your Flex" }); return; }

    if (danger) {
      const amount = BigInt(state.total) + BigInt(state.idle);
      if (amount < MIN) { record({ action: "HOLD", reason: "danger, but nothing to protect" }); return; }
      const why = dial ? "danger dial ON" : depeg?.severity >= 3 ? depeg.reasons.join("; ") : `${top.name} critical`;
      await doProtect(ctx, policy, amount, `evacuating to safe haven — ${why}`);
    } else if (BigInt(state.idle) >= MIN) {
      await doInvest(ctx, policy, top.venue, BigInt(state.idle), `deploying idle USDC into ${top.name} — best risk-adjusted (score ${top.score}, graphscout ${top.verdict})`);
    } else if (heldEntry && heldEntry.m.id !== top.id && (heldRank.verdict !== "healthy" || top.score - heldRank.score >= REBAL_MIN_SCORE_GAP)) {
      await doRebalance(ctx, heldEntry.m.venue, top.venue, heldEntry.pos,
        `switching ${heldEntry.m.name} (${heldRank.verdict}, score ${heldRank.score}) → ${top.name} (${top.verdict}, score ${top.score})`);
    } else {
      record({ action: "HOLD", reason: heldEntry ? `holding ${heldEntry.m.name} — still the best market` : "no idle funds to deploy" });
    }
  } catch (e) {
    record({ action: "ERROR", reason: (e.shortMessage || e.message || String(e)).slice(0, 160) });
  } finally { running = false; }
}

// voice/manual command
async function command(action, body = {}) {
  if (running) return { ok: false, error: "guardian busy" };
  running = true;
  try {
    const ctx = connect(); const policy = loadPolicy();
    if (!policy) return { ok: false, error: "not armed" };
    const state = await readState(ctx, markets);
    const ranked = await rankMarkets(markets); const top = ranked[0];
    if (action === "invest") { const a = BigInt(state.idle); if (a < MIN) return { ok: false, error: "no idle USDC" }; const e = await doInvest(ctx, policy, top.venue, a, "voice — deploy to best market"); return { ok: true, ...e }; }
    if (action === "protect") { const a = BigInt(state.total) + BigInt(state.idle); if (a < MIN) return { ok: false, error: "nothing to protect" }; const e = await doProtect(ctx, policy, a, "voice — evacuate to safe haven"); return { ok: true, ...e }; }
    if (action === "rebalance") {
      const held = markets.map((m) => ({ m, pos: BigInt(state.positions[m.id] || "0") })).filter((x) => x.pos >= MIN)[0];
      if (!held) return { ok: false, error: "no position to move" };
      const e = await doRebalance(ctx, held.m.venue, top.venue, held.pos, "voice — switch to best market"); return { ok: true, ...e };
    }
    return { ok: false, error: "unknown action" };
  } catch (e) { return { ok: false, error: (e.shortMessage || e.message || String(e)).slice(0, 160) }; }
  finally { running = false; }
}

async function armPolicy(body) {
  const { policy, signature } = body || {};
  if (!policy || !signature) return { ok: false, error: "missing policy or signature" };
  const ctx = connect();
  const owner = await ctx.vault.owner();
  const domain = { name: "Guardian", version: "1", chainId: 84532, verifyingContract: await ctx.vault.getAddress() };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
    { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  let recovered;
  try { recovered = ethers.verifyTypedData(domain, types, policy, signature); }
  catch (e) { return { ok: false, error: "bad signature: " + (e.shortMessage || e.message || String(e)).slice(0, 100) }; }
  if (recovered.toLowerCase() !== owner.toLowerCase()) return { ok: false, error: `signer ${recovered} is not the vault owner ${owner}` };
  fs.writeFileSync(path.join(__dirname, "policy-multi.json"), JSON.stringify({ policy, signature, signer: recovered }, null, 2));
  record({ action: "ARM", reason: `armed by Flex ${recovered.slice(0, 8)}… — invest cap ${usd(policy.investCap)}, protect cap ${usd(policy.protectCap)}` });
  return { ok: true, signer: recovered };
}

// HIGH-RISK: execute a single-use, freshly-Flex-approved evacuation (approveAndProtect). The
// escalation was signed live on the Flex in the app; the agent just relays it on-chain.
async function escalate(body) {
  const { escalation, signature, amountUsdc } = body || {};
  if (!escalation || !signature) return { ok: false, error: "missing escalation or signature" };
  if (running) return { ok: false, error: "guardian busy" };
  running = true;
  try {
    const ctx = connect();
    const e = escalation;
    const tuple = [e.amount, e.safeHaven, e.expiry, e.nonce];
    const amt = amountUsdc != null ? BigInt(Math.round(Number(amountUsdc) * 1e6)) : BigInt(e.amount);
    const r = await send(() => ctx.vault.approveAndProtect(tuple, signature, amt), { wait: false });
    record({ action: "ESCALATE", reason: `high-risk evacuation approved on Flex → ${String(e.safeHaven).slice(0, 8)}…`, amountUsdc: usd(amt), txUrl: r.url });
    return { ok: true, action: "ESCALATE", amountUsdc: usd(amt), tx: r.url };
  } catch (err) {
    return { ok: false, error: (err.shortMessage || err.message || String(err)).slice(0, 160) };
  } finally { running = false; }
}

function marketsView() {
  return lastRanked.map((r) => ({
    id: r.id, name: r.name, apr: r.apr, score: r.score, verdict: r.verdict,
    riskScore: r.riskScore, tvlUSD: r.tvlUSD, tvlChange7dPct: r.tvlChange7dPct,
    position: lastState?.positions?.[r.id] ? usd(lastState.positions[r.id]) : "0",
    pick: lastRanked[0]?.id === r.id,
  }));
}
function stateView() {
  const policy = loadPolicy();
  const dep = (() => { try { return connect().dep; } catch { return {}; } })();
  return {
    running: true, startedAt, tick: tickN, dial,
    vault: dep.GuardianVaultMulti, chainId: 84532,
    idle: lastState ? usd(lastState.idle) : null, total: lastState ? usd(lastState.total) : null,
    havenBal: lastState ? usd(lastState.havenBal) : null, haven: lastState?.haven ?? null,
    markets: marketsView(),
    policy: policy ? { investCap: usd(policy.policy.investCap), protectCap: usd(policy.policy.protectCap), safeHaven: policy.policy.safeHaven, signer: policy.signer } : null,
    explorerBase: "https://sepolia.basescan.org",
  };
}

// --- HTTP ---
function cors(res) { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-daemon-token"); }
function json(res, code, body) { cors(res); res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch { r({}); } }); }); }

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
  if (req.method === "POST" && DAEMON_TOKEN && req.headers["x-daemon-token"] !== DAEMON_TOKEN) return json(res, 401, { ok: false, error: "unauthorized" });
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/health") return json(res, 200, { ok: true, tick: tickN, uptimeSec: Math.floor((Date.now() - startedAt) / 1000) });
  if (url.pathname === "/state") return json(res, 200, stateView());
  if (url.pathname === "/activity") return json(res, 200, { items: [...activity].reverse().slice(0, Number(url.searchParams.get("limit") || 50)) });
  if (url.pathname === "/dial" && req.method === "POST") { const b = await readBody(req); dial = Boolean(b.on); record({ action: "DIAL", reason: `danger dial ${dial ? "ON" : "OFF"}` }); return json(res, 200, { dial }); }
  if (url.pathname === "/command" && req.method === "POST") { const b = await readBody(req); return json(res, 200, await command(String(b.action || ""), b)); }
  if (url.pathname === "/arm" && req.method === "POST") return json(res, 200, await armPolicy(await readBody(req)));
  if (url.pathname === "/escalate" && req.method === "POST") return json(res, 200, await escalate(await readBody(req)));
  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Guardian MULTI daemon on http://localhost:${PORT} (interval ${INTERVAL}ms, ${markets.length} markets)`);
  const loop = async () => { await tick(); setTimeout(loop, INTERVAL); };
  loop();
});
