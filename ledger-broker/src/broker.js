#!/usr/bin/env node
// Guardian's capability broker.
//
// The problem (Ledger "AI Agents x Ledger" track): an autonomous agent needs a fund-moving key,
// but a key in the agent's process is a key that can leak. The broker inverts that: it owns the
// key (loaded from the Ledger Key Ring — see secret-store.js), and hands the agent only SCOPED
// CAPABILITIES. The agent can ask the broker to "sign a GuardianVaultMulti invest/deRisk/rebalance/
// protect", and nothing else. The broker will never sign a transaction to any other address, never call
// any other method, and never return the raw key. A fully compromised agent still can't move
// funds anywhere but through the on-chain-mandated Guardian actions.
//
//   agent (daemon)  ──POST /capability/sign-vault-action──▶  broker  ──signs with vaulted key──▶  chain
//                     (method + args, token-gated)          (scope-enforced, audited)
//
// Human-in-the-loop: the vaulted key is bounded further on-chain by the Flex-signed Policy, and
// the Ledger remains the root of trust for the Key Ring (revocable via `ring destroy` / member
// rotation). High-risk changes still require a fresh Flex signature (the mandate model).
const http = require("http");
const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
const { loadSecret } = require("./secret-store");

// The ONLY methods the broker will ever sign, and only against the ONE configured vault.
// Scoped to GuardianVaultMulti (the multi-market vault the agent actually drives): invest deploys
// into an allowlisted venue, rebalance rotates between venues, deRisk pulls a venue back, protect
// evacuates to the Flex-approved safe haven. Every one is on-chain-bounded by the Flex-signed Policy.
const CAPABILITY_METHODS = new Set(["invest", "deRisk", "rebalance", "protect"]);
const VAULT_ABI = [
  "function invest((uint256 investCap,uint256 protectCap,address safeHaven,uint256 expiry,uint256 nonce) p, bytes sig, address venue, uint256 amount)",
  "function deRisk(address venue, uint256 amount)",
  "function rebalance(address from, address to, uint256 amount)",
  "function protect((uint256 investCap,uint256 protectCap,address safeHaven,uint256 expiry,uint256 nonce) p, bytes sig, uint256 amount)",
];

/**
 * Build a broker instance. cfg:
 *   { secret: <secret-store cfg>, rpc, vault, auditPath? }
 * Returns { agentAddress, signVaultAction, audit, start }.
 */
function createBroker(cfg) {
  const pk = loadSecret(cfg.secret); // plaintext key exists ONLY here, in memory
  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const vaultAddr = ethers.getAddress(cfg.vault);
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const audit = [];

  function record(entry) {
    const e = { ts: new Date().toISOString(), agent: wallet.address, ...entry };
    audit.push(e);
    if (cfg.auditPath) { try { fs.appendFileSync(cfg.auditPath, JSON.stringify(e) + "\n"); } catch {} }
    return e;
  }

  // The one crown-jewel capability: sign (and optionally broadcast) a bounded vault action.
  async function signVaultAction({ method, args = [], broadcast = false }) {
    if (!CAPABILITY_METHODS.has(method)) {
      record({ capability: "sign-vault-action", method, granted: false, reason: "method not in scope" });
      throw new Error(`capability denied: "${method}" is not a Guardian vault action (allowed: ${[...CAPABILITY_METHODS].join(", ")})`);
    }
    // Encode the call. populateTransaction sets `to` = the configured vault; we assert it, so the
    // signer can never be tricked into targeting another contract.
    const tx = await vault[method].populateTransaction(...args);
    if (!tx.to || ethers.getAddress(tx.to) !== vaultAddr) {
      record({ capability: "sign-vault-action", method, granted: false, reason: "target is not the guardian vault" });
      throw new Error("capability denied: target is not the Guardian vault");
    }
    if (broadcast) {
      const sent = await wallet.sendTransaction(tx);
      const rc = await sent.wait();
      return record({ capability: "sign-vault-action", method, granted: true, broadcast: true, txHash: rc?.hash });
    }
    // Sign-only: build the tx explicitly (no eth_estimateGas, which would revert for the wrong
    // caller and isn't needed to produce a valid signed tx for the daemon to broadcast).
    const net = await provider.getNetwork();
    const nonce = await provider.getTransactionCount(wallet.address);
    const req = {
      to: tx.to, data: tx.data, nonce, chainId: net.chainId,
      gasLimit: cfg.gasLimit ?? 300000n, type: 2,
      maxFeePerGas: cfg.maxFeePerGas ?? 2_000_000_000n,
      maxPriorityFeePerGas: cfg.maxPriorityFeePerGas ?? 1_000_000_000n,
    };
    const signedTx = await wallet.signTransaction(req);
    record({ capability: "sign-vault-action", method, granted: true, broadcast: false });
    return { capability: "sign-vault-action", method, granted: true, signedTx };
  }

  function start(port, token) {
    const server = http.createServer(async (req, res) => {
      const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
      if (req.url === "/health") return send(200, { ok: true, agent: wallet.address, vault: vaultAddr, capabilities: [...CAPABILITY_METHODS] });
      if (req.url === "/audit") return send(200, { audit: audit.slice(-50) });
      // capability calls are gated by a shared token — the agent proves it's the local daemon,
      // but even with the token it can ONLY invoke the scoped capability.
      if (token && req.headers["x-broker-token"] !== token) return send(401, { error: "unauthorized" });
      if (req.method === "POST" && req.url === "/capability/sign-vault-action") {
        let b = ""; req.on("data", (c) => (b += c)); req.on("end", async () => {
          try { send(200, await signVaultAction(JSON.parse(b || "{}"))); }
          catch (e) { send(400, { error: e.message }); }
        });
        return;
      }
      send(404, { error: "not found" });
    });
    server.listen(port, "127.0.0.1", () => {
      console.log(`[broker] capability broker on http://127.0.0.1:${port}`);
      console.log(`[broker] agent address: ${wallet.address}`);
      console.log(`[broker] scoped to vault ${vaultAddr} — methods: ${[...CAPABILITY_METHODS].join(", ")}`);
      console.log(`[broker] the fund-moving key is loaded from the ${cfg.secret.backend} backend and never leaves this process.`);
    });
    return server;
  }

  return { agentAddress: wallet.address, signVaultAction, audit, start };
}

module.exports = { createBroker, CAPABILITY_METHODS };

// CLI entry: start the broker from env config.
if (require.main === module) {
  try { require("dotenv").config({ path: path.join(__dirname, "..", ".env") }); } catch {}
  const broker = createBroker({
    secret: process.env.SECRET_BACKEND === "keyring"
      ? { backend: "keyring", blob: process.env.AGENT_KEY_BLOB, key: process.env.RING_KEY || "guardian-agent" }
      : { backend: "local", blob: process.env.AGENT_KEY_BLOB, pass: process.env.LOCAL_PASS },
    rpc: process.env.BROKER_RPC,
    vault: process.env.BROKER_VAULT,
    auditPath: path.join(__dirname, "..", "audit.jsonl"),
  });
  broker.start(Number(process.env.BROKER_PORT || 8799), process.env.BROKER_TOKEN || "");
}
