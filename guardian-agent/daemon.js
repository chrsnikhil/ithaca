// Guardian — the always-on autonomous brain (runs like Talos: local now, Azure-deployable later).
// Every INTERVAL it SENSES risk via The Graph, DECIDES a tier, and ACTS on-chain within the
// Flex-signed Policy — invest when calm, de-risk when elevated, evacuate when in danger.
// Serves a live feed the PWA dashboard polls: /state /activity /health, and accepts voice
// commands (POST /command) + a demo danger toggle (POST /dial).
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const fs = require("fs");
const { ethers } = require("ethers");
const { assessRisk } = require("./risk");
const { fetchPortfolio } = require("./graph");
const { connect, loadPolicy, send } = require("./vault");
const graphscout = require("./graphscout-client");

const PORT = Number(process.env.DAEMON_PORT || 8787);
const INTERVAL = Number(process.env.INTERVAL_MS || 20000);
const GRAPH_API_KEY = process.env.GRAPH_API_KEY;
const MIN_ACTION = BigInt(Math.round(Number(process.env.MIN_ACTION_USDC || 1) * 1e6));
const DAEMON_TOKEN = process.env.DAEMON_TOKEN || ""; // if set, POST /command + /dial require x-daemon-token
// The Base lending market Guardian watches via graphscout. Defaults to Moonwell (the flagship
// Base-mainnet money market, richly indexed on The Graph) — on testnet Guardian's own Aave
// position has no live Graph data, so its real-time risk lens reads a live Base market.
const VENUE_PROTOCOL = process.env.VENUE_PROTOCOL || "moonwell";

// Optional: route signing through the Ledger capability broker instead of holding the key here.
// When BROKER_URL is set, the daemon owns NO private key — it asks the broker to sign the bounded
// vault action, and the broker (which vaults the key in the Ledger Key Ring) enforces scope.
const BROKER_URL = process.env.BROKER_URL || "";
const BROKER_TOKEN = process.env.BROKER_TOKEN || "";
const EXPLORER = process.env.EXPLORER_BASE || "https://sepolia.basescan.org";
async function brokerSign(method, args) {
  const body = JSON.stringify({ method, args, broadcast: true }, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  const r = await fetch(`${BROKER_URL}/capability/sign-vault-action`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-broker-token": BROKER_TOKEN }, body,
  });
  const j = await r.json();
  if (j.error) throw new Error("broker denied: " + j.error);
  return { hash: j.txHash, url: j.txHash ? `${EXPLORER}/tx/${j.txHash}` : undefined };
}
const DATA_PROVIDER = "0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b"; // Aave Protocol Data Provider (Base Sepolia)
const DP_ABI = ["function getReserveData(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40)"];
const usd = (x) => ethers.formatUnits(x, 6);

let dial = process.env.DANGER_DIAL === "on";
let tickN = 0;
let running = false;
const startedAt = Date.now();
const activity = [];
let lastRisk = null;
let lastState = null;

function record(entry) {
  const e = { ts: Date.now(), tick: tickN, ...entry };
  activity.push(e);
  if (activity.length > 200) activity.shift();
  try { fs.appendFileSync(path.join(__dirname, "activity.jsonl"), JSON.stringify(e) + "\n"); } catch {}
  console.log(`[t${e.tick}] ${e.tier}/${e.action} — ${e.reason}${e.txUrl ? " " + e.txUrl : ""}`);
  return e;
}

async function sense() {
  const portfolio = dial
    ? { positions: [{ symbol: "USDC", isStable: true, price: 0.94 }], healthFactor: 1.03, at: Date.now() }
    : await fetchPortfolio({ apiKey: GRAPH_API_KEY });
  const risk = assessRisk(portfolio);

  // graphscout — protocol-intelligence lens on the venue we're exposed to. Its verdict can
  // RAISE our severity (so degradation in Aave itself triggers de-risk/protect autonomously),
  // never lower it. Best-effort: null when unavailable -> we fall back to price/health sensing.
  let venue = null;
  try {
    const a = await graphscout.assessProtocol(VENUE_PROTOCOL);
    if (a && a.verdict) {
      venue = { protocol: a.protocol, verdict: a.verdict, score: a.score, source: "graphscout" };
      const bump = a.verdict === "critical" ? 3 : a.verdict === "elevated" ? 2 : 0;
      const note = `graphscout: ${a.protocol} ${a.verdict} (risk ${a.score}/100)`;
      if (bump > risk.severity) { risk.severity = bump; risk.danger = true; risk.reasons.push(note); }
      else if (a.verdict !== "healthy") { risk.reasons.push(note); }
    }
  } catch { /* graphscout best-effort */ }

  return { portfolio, risk, venue };
}

async function readEnriched(ctx) {
  const policy = loadPolicy();
  const haven = policy?.policy?.safeHaven;
  const dp = new ethers.Contract(DATA_PROVIDER, DP_ABI, ctx.provider);
  const [position, idle, havenBal, rd] = await Promise.all([
    ctx.vault.position(), ctx.vault.idle(),
    haven ? ctx.usdc.balanceOf(haven) : Promise.resolve(0n),
    dp.getReserveData(ctx.dep.aaveUsdc).catch(() => null),
  ]);
  const apr = rd ? (Number(rd[5]) / 1e27) * 100 : null; // liquidityRate (ray) -> %
  return { position, idle, havenBal, haven, apr };
}

// --- the three bounded actions (shared by the autonomous loop and voice commands) ---
async function doInvest(ctx, policy, amount, reason, fast) {
  const r = BROKER_URL
    ? await brokerSign("invest", [policy.tuple, policy.signature, amount])
    : await send(() => ctx.vault.invest(policy.tuple, policy.signature, amount), { wait: !fast });
  return record({ tier: "CALM", action: "INVEST", reason, amountUsdc: usd(amount), txHash: r.hash, txUrl: r.url, severity: lastRisk?.severity ?? 0 });
}
async function doDeRisk(ctx, amount, reason, fast) {
  const r = BROKER_URL
    ? await brokerSign("deRisk", [amount])
    : await send(() => ctx.vault.deRisk(amount), { wait: !fast });
  return record({ tier: "ELEVATED", action: "DERISK", reason, amountUsdc: usd(amount), txHash: r.hash, txUrl: r.url, severity: lastRisk?.severity ?? 2 });
}
async function doProtect(ctx, policy, amount, reason, fast) {
  const r = BROKER_URL
    ? await brokerSign("protect", [policy.tuple, policy.signature, amount])
    : await send(() => ctx.vault.protect(policy.tuple, policy.signature, amount), { wait: !fast });
  return record({ tier: "DANGER", action: "PROTECT", reason, amountUsdc: usd(amount), txHash: r.hash, txUrl: r.url, severity: lastRisk?.severity ?? 3 });
}

async function tick() {
  if (running) return;
  running = true;
  tickN++;
  try {
    const { risk, venue } = await sense();
    lastRisk = { ...risk, dial, venue };
    const ctx = connect();
    const policy = loadPolicy();
    const en = await readEnriched(ctx);
    lastState = { position: usd(en.position), idle: usd(en.idle), havenBal: usd(en.havenBal), haven: en.haven, apr: en.apr, severity: risk.severity };

    if (!policy) { record({ tier: "SETUP", action: "HOLD", reason: "no signed Policy — arm the guardian first", severity: risk.severity }); return; }

    if (risk.severity >= 3) {
      const amount = en.idle + en.position;
      if (amount < MIN_ACTION) { record({ tier: "DANGER", action: "HOLD", reason: "danger, but nothing left to protect", severity: risk.severity }); return; }
      await doProtect(ctx, policy, amount, risk.reasons.join("; "));
    } else if (risk.severity === 2) {
      if (en.position < MIN_ACTION) { record({ tier: "ELEVATED", action: "HOLD", reason: "elevated, position already flat", severity: risk.severity }); return; }
      await doDeRisk(ctx, en.position, risk.reasons.join("; "));
    } else {
      if (en.idle < MIN_ACTION) { record({ tier: "CALM", action: "HOLD", reason: "calm; no idle funds to deploy", severity: risk.severity }); return; }
      await doInvest(ctx, policy, en.idle, "conditions calm — deploying idle USDC for yield");
    }
  } catch (e) {
    record({ tier: "ERROR", action: "NONE", reason: (e.shortMessage || e.message || String(e)).slice(0, 140), severity: lastRisk?.severity ?? 0 });
  } finally {
    running = false;
  }
}

// voice / manual command — run one bounded action now
async function command(action, amountUsdc) {
  if (running) return { ok: false, error: "guardian busy — try again in a moment" };
  running = true;
  try {
    const ctx = connect();
    const policy = loadPolicy();
    if (!policy) return { ok: false, error: "no signed policy — arm the guardian first" };
    const en = await readEnriched(ctx);
    const amt = amountUsdc != null ? BigInt(Math.round(Number(amountUsdc) * 1e6)) : null;
    if (action === "invest") {
      const a = amt ?? en.idle; if (a < MIN_ACTION) return { ok: false, error: "no idle USDC to invest" };
      const e = await doInvest(ctx, policy, a, "voice command — deploy to Aave", true); return { ok: true, action: "INVEST", amountUsdc: e.amountUsdc, tx: e.txUrl };
    }
    if (action === "protect") {
      const a = amt ?? (en.idle + en.position); if (a < MIN_ACTION) return { ok: false, error: "nothing to protect" };
      const e = await doProtect(ctx, policy, a, "voice command — evacuate to safe haven", true); return { ok: true, action: "PROTECT", amountUsdc: e.amountUsdc, tx: e.txUrl };
    }
    if (action === "derisk") {
      const a = amt ?? en.position; if (a < MIN_ACTION) return { ok: false, error: "no position to de-risk" };
      const e = await doDeRisk(ctx, a, "voice command — pull back to vault", true); return { ok: true, action: "DERISK", amountUsdc: e.amountUsdc, tx: e.txUrl };
    }
    return { ok: false, error: "unknown action" };
  } catch (e) {
    return { ok: false, error: (e.shortMessage || e.message || String(e)).slice(0, 140) };
  } finally {
    running = false;
  }
}

// Arm the guardian with a Policy the owner signed on their Ledger Flex. Verifies the signature
// recovers to the vault's on-chain owner, then persists it as policy.json for the loop to use.
async function armPolicy(body) {
  const { policy, signature } = body || {};
  if (!policy || !signature) return { ok: false, error: "missing policy or signature" };
  const ctx = connect();
  const owner = await ctx.vault.owner();
  const domain = { name: "Guardian", version: "1", chainId: ctx.dep.chainId, verifyingContract: ctx.dep.GuardianVault };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
    { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
    { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  let recovered;
  try { recovered = ethers.verifyTypedData(domain, types, policy, signature); }
  catch (e) { return { ok: false, error: "bad signature: " + (e.shortMessage || e.message || String(e)).slice(0, 100) }; }
  if (recovered.toLowerCase() !== owner.toLowerCase()) return { ok: false, error: `signer ${recovered} is not the vault owner ${owner}` };
  fs.writeFileSync(path.join(__dirname, "policy.json"), JSON.stringify({ policy, signature, signer: recovered }, null, 2));
  record({ tier: "CONTROL", action: "ARM", reason: `armed by Flex ${recovered.slice(0, 8)}… — invest cap ${usd(BigInt(policy.investCap))}, protect cap ${usd(BigInt(policy.protectCap))} USDC`, severity: 0 });
  return { ok: true, signer: recovered, vault: ctx.dep.GuardianVault };
}

// --- HTTP feed for the dashboard ---
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function json(res, code, body) { cors(res); res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch { r({}); } }); }); }

function state() {
  const dep = (() => { try { return connect().dep; } catch { return {}; } })();
  const policy = loadPolicy();
  return {
    running: true, startedAt, tick: tickN, dial,
    vault: dep.GuardianVault, chainId: dep.chainId, venue: dep.aaveVenue,
    position: lastState?.position ?? null, idle: lastState?.idle ?? null,
    havenBal: lastState?.havenBal ?? null, haven: lastState?.haven ?? policy?.policy?.safeHaven ?? null,
    apr: lastState?.apr ?? null, risk: lastRisk,
    policy: policy ? { investCap: usd(policy.policy.investCap), protectCap: usd(policy.policy.protectCap), safeHaven: policy.policy.safeHaven, expiry: policy.policy.expiry, signer: policy.signer } : null,
    explorerBase: "https://sepolia.basescan.org",
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
  // Protect state-changing endpoints behind a shared secret when one is configured.
  if (req.method === "POST" && DAEMON_TOKEN && req.headers["x-daemon-token"] !== DAEMON_TOKEN) {
    return json(res, 401, { ok: false, error: "unauthorized" });
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/health") return json(res, 200, { ok: true, uptimeSec: Math.floor((Date.now() - startedAt) / 1000), tick: tickN });
  if (url.pathname === "/state") return json(res, 200, state());
  if (url.pathname === "/activity") return json(res, 200, { items: [...activity].reverse().slice(0, Number(url.searchParams.get("limit") || 50)) });
  if (url.pathname === "/dial" && req.method === "POST") {
    const b = await readBody(req); dial = Boolean(b.on);
    record({ tier: "CONTROL", action: "DIAL", reason: `danger dial ${dial ? "ON" : "OFF"}`, severity: dial ? 3 : 0 });
    return json(res, 200, { dial });
  }
  if (url.pathname === "/command" && req.method === "POST") {
    const b = await readBody(req);
    return json(res, 200, await command(String(b.action || ""), b.amountUsdc));
  }
  if (url.pathname === "/arm" && req.method === "POST") {
    return json(res, 200, await armPolicy(await readBody(req)));
  }
  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Guardian daemon on http://localhost:${PORT}  (interval ${INTERVAL}ms, dial ${dial ? "ON" : "OFF"})`);
  console.log(`  GET /state /activity /health   POST /dial {on}  /command {action,amountUsdc?}`);
  const loop = async () => { await tick(); setTimeout(loop, INTERVAL); };
  loop();
});
