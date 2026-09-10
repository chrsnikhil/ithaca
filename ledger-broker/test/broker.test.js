// Proves the broker's security property: it grants SCOPED capabilities, never the key, and
// refuses anything out of scope. Uses the local backend + a throwaway key (no device, no
// broadcast) so it runs anywhere.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ethers } = require("ethers");
const { createBroker } = require("../src/broker");
const { localEncrypt } = require("../src/secret-store");

const RPC = "https://base-sepolia-rpc.publicnode.com";
const VAULT = "0x130E4D571eEa3928d11DC9d9c7C6561C55c6F2fd"; // Guardian vault on Base Sepolia
const IFACE = new ethers.Interface([
  "function deRisk(uint256 amount)",
  "function invest((uint256,address,uint256,address,uint256,uint256), bytes, uint256)",
]);

function sealTempKey(pk, pass) {
  const p = path.join(os.tmpdir(), `gb-${Date.now()}-${Math.floor(pk.length)}.json`);
  fs.writeFileSync(p, JSON.stringify(localEncrypt(pk, pass)));
  return p;
}

function makeBroker() {
  const throwaway = ethers.Wallet.createRandom();
  const blob = sealTempKey(throwaway.privateKey, "test-pass");
  const broker = createBroker({ secret: { backend: "local", blob, pass: "test-pass" }, rpc: RPC, vault: VAULT });
  return { broker, throwaway };
}

test("grants an in-scope capability: signs a deRisk tx targeting the vault", async () => {
  const { broker } = makeBroker();
  const res = await broker.signVaultAction({ method: "deRisk", args: [1_000_000n] });
  assert.ok(res.signedTx, "should return a signed tx");
  const parsed = ethers.Transaction.from(res.signedTx);
  assert.strictEqual(parsed.to.toLowerCase(), VAULT.toLowerCase(), "tx must target the Guardian vault");
  const decoded = IFACE.parseTransaction({ data: parsed.data });
  assert.strictEqual(decoded.name, "deRisk", "must be the deRisk call");
  assert.strictEqual(decoded.args[0], 1_000_000n);
});

test("denies an out-of-scope method (never signs it)", async () => {
  const { broker } = makeBroker();
  await assert.rejects(
    () => broker.signVaultAction({ method: "transfer", args: ["0x000000000000000000000000000000000000dEaD", 1n] }),
    /capability denied/,
  );
});

test("never exposes the raw private key", async () => {
  const { broker, throwaway } = makeBroker();
  const res = await broker.signVaultAction({ method: "deRisk", args: [5n] });
  const blob = JSON.stringify(res);
  assert.ok(!blob.includes(throwaway.privateKey), "response must not contain the private key");
  assert.ok(!blob.toLowerCase().includes(throwaway.privateKey.slice(2).toLowerCase()), "not even key material");
  // the broker exposes only the derived address, never the key
  assert.strictEqual(broker.agentAddress, throwaway.address);
});

test("audit log records each capability grant/denial (attribution)", async () => {
  const { broker } = makeBroker();
  await broker.signVaultAction({ method: "deRisk", args: [1n] });
  await broker.signVaultAction({ method: "protect", args: [[0n, ethers.ZeroAddress, 0n, ethers.ZeroAddress, 0n, 0n], "0x", 1n] }).catch(() => {});
  await broker.signVaultAction({ method: "selfdestructibleEvil" }).catch(() => {});
  const denied = broker.audit.filter((a) => a.granted === false);
  const granted = broker.audit.filter((a) => a.granted === true);
  assert.ok(granted.length >= 1, "should have granted at least one");
  assert.ok(denied.length >= 1, "should have denied the out-of-scope method");
});
