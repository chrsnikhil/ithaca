// Guardian ACT layer — the on-chain actions the autonomous daemon triggers on the GuardianVault,
// always bounded by the Flex-signed Policy. Uses a reliable single-node RPC (publicnode) because
// Base Sepolia's default load-balanced RPC serves stale reads (false underflow reverts).
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC = process.env.BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com";
const EXPLORER = "https://sepolia.basescan.org/tx/";

const VAULT_ABI = [
  "function invest((uint256,address,uint256,address,uint256,uint256),bytes,uint256)",
  "function deRisk(uint256)",
  "function protect((uint256,address,uint256,address,uint256,uint256),bytes,uint256)",
  "function position() view returns (uint256)",
  "function idle() view returns (uint256)",
  "function owner() view returns (address)",
  "function agent() view returns (address)",
  "function deposit(uint256)",
  "function setAgent(address)",
  "function setSafeHaven(address,bool)",
];
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

function loadDeployment() {
  const p = path.join(__dirname, "..", "guardian-contracts", "deployments.json");
  return JSON.parse(fs.readFileSync(p, "utf8")).baseSepolia;
}

function loadPolicy() {
  const p = path.join(__dirname, "policy.json");
  if (!fs.existsSync(p)) return null;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  // tuple order the contract expects
  const t = [j.policy.investCap, j.policy.venue, j.policy.protectCap, j.policy.safeHaven, j.policy.expiry, j.policy.nonce];
  return { ...j, tuple: t };
}

function connect() {
  const pk = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("AGENT_PRIVATE_KEY (or PRIVATE_KEY) not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(pk, provider);
  const dep = loadDeployment();
  const vault = new ethers.Contract(dep.GuardianVault, VAULT_ABI, wallet);
  const usdc = new ethers.Contract(dep.aaveUsdc, USDC_ABI, wallet);
  return { provider, wallet, vault, usdc, dep };
}

async function send(fn, { tries = 4, wait = true } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const tx = await fn();
      // fast path: return the moment the tx is accepted by the node (no confirmation wait) —
      // makes voice-triggered actions feel instant. Confirmation happens on-chain regardless.
      if (!wait) return { hash: tx.hash, url: EXPLORER + tx.hash };
      const rc = await tx.wait(1);
      return { hash: rc.hash, url: EXPLORER + rc.hash };
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw last;
}

async function readState(ctx) {
  const { vault, usdc } = ctx || connect();
  const policy = loadPolicy();
  const haven = policy?.policy?.safeHaven;
  const [position, idle, havenBal, owner, agent] = await Promise.all([
    vault.position(), vault.idle(), haven ? usdc.balanceOf(haven) : Promise.resolve(0n), vault.owner(), vault.agent(),
  ]);
  return { position, idle, havenBal, owner, agent, haven };
}

module.exports = { connect, loadDeployment, loadPolicy, send, readState, RPC, EXPLORER, VAULT_ABI, USDC_ABI };
