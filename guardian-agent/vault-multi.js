// ACT layer for GuardianVaultMulti — the multi-market vault. Same shape as vault.js but the
// Policy has no per-venue field (venue set is fixed at deploy) and actions take a venue address.
// Reads via publicnode (Base Sepolia's default RPC serves stale reads).
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC = process.env.BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com";
const EXPLORER = "https://sepolia.basescan.org/tx/";

const VAULT_ABI = [
  "function invest((uint256,uint256,address,uint256,uint256),bytes,address,uint256)",
  "function deRisk(address,uint256)",
  "function rebalance(address,address,uint256)",
  "function protect((uint256,uint256,address,uint256,uint256),bytes,uint256)",
  "function approveAndProtect((uint256,address,uint256,uint256),bytes,uint256)",
  "function positionOf(address) view returns (uint256)",
  "function totalPosition() view returns (uint256)",
  "function idle() view returns (uint256)",
  "function owner() view returns (address)",
  "function agent() view returns (address)",
];
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];

function loadDeployment() {
  const p = path.join(__dirname, "..", "guardian-contracts", "deployments.json");
  return JSON.parse(fs.readFileSync(p, "utf8")).baseSepolia;
}

// Flex-signed Policy for the multi vault: { investCap, protectCap, safeHaven, expiry, nonce }.
function loadPolicy() {
  const p = path.join(__dirname, "policy-multi.json");
  if (!fs.existsSync(p)) return null;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const t = [j.policy.investCap, j.policy.protectCap, j.policy.safeHaven, j.policy.expiry, j.policy.nonce];
  return { ...j, tuple: t };
}

function connect() {
  const pk = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY (or PRIVATE_KEY) not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(pk, provider);
  const dep = loadDeployment();
  if (!dep.GuardianVaultMulti) throw new Error("GuardianVaultMulti not in deployments.json");
  const vault = new ethers.Contract(dep.GuardianVaultMulti, VAULT_ABI, wallet);
  const usdc = new ethers.Contract(dep.usdc, USDC_ABI, wallet);
  return { provider, wallet, vault, usdc, dep };
}

async function send(fn, { tries = 4, wait = true } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const tx = await fn();
      if (!wait) return { hash: tx.hash, url: EXPLORER + tx.hash };
      const rc = await tx.wait(1);
      return { hash: rc.hash, url: EXPLORER + rc.hash };
    } catch (e) { last = e; await new Promise((r) => setTimeout(r, 3000)); }
  }
  throw last;
}

// Per-market positions + idle + total + haven balance.
async function readState(ctx, markets) {
  const c = ctx || connect();
  const policy = loadPolicy();
  const haven = policy?.policy?.safeHaven;
  const positions = {};
  for (const m of markets) {
    try { positions[m.id] = (await c.vault.positionOf(m.venue)).toString(); } catch { positions[m.id] = "0"; }
  }
  const [idle, total, havenBal, owner, agent] = await Promise.all([
    c.vault.idle(), c.vault.totalPosition(),
    haven ? c.usdc.balanceOf(haven) : Promise.resolve(0n), c.vault.owner(), c.vault.agent(),
  ]);
  return { idle: idle.toString(), total: total.toString(), positions, havenBal: havenBal.toString(), owner, agent, haven };
}

module.exports = { connect, loadDeployment, loadPolicy, send, readState, RPC, EXPLORER, VAULT_ABI };
