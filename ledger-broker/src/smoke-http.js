// End-to-end HTTP smoke: start the broker, then exercise it exactly as the daemon does.
const fs = require("fs"), os = require("os"), path = require("path");
const { ethers } = require("ethers");
const { createBroker } = require("./broker");
const { localEncrypt } = require("./secret-store");

const VAULT = "0x130E4D571eEa3928d11DC9d9c7C6561C55c6F2fd";
(async () => {
  const w = ethers.Wallet.createRandom();
  const blob = path.join(os.tmpdir(), "gb-smoke.json");
  fs.writeFileSync(blob, JSON.stringify(localEncrypt(w.privateKey, "p")));
  const broker = createBroker({ secret: { backend: "local", blob, pass: "p" }, rpc: "https://base-sepolia-rpc.publicnode.com", vault: VAULT });
  const server = broker.start(8798, "tok");
  await new Promise((r) => setTimeout(r, 300));
  const base = "http://127.0.0.1:8798";

  const health = await (await fetch(base + "/health")).json();
  console.log("health:", JSON.stringify(health));

  const un = await fetch(base + "/capability/sign-vault-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "deRisk", args: ["1000000"] }) });
  console.log("no-token ->", un.status, "(expect 401)");

  const ok = await (await fetch(base + "/capability/sign-vault-action", { method: "POST", headers: { "Content-Type": "application/json", "x-broker-token": "tok" }, body: JSON.stringify({ method: "deRisk", args: ["1000000"] }) })).json();
  const parsed = ethers.Transaction.from(ok.signedTx);
  console.log("deRisk granted:", ok.granted, "| targets vault:", parsed.to.toLowerCase() === VAULT.toLowerCase(), "| key leaked:", JSON.stringify(ok).includes(w.privateKey));

  const dj = await (await fetch(base + "/capability/sign-vault-action", { method: "POST", headers: { "Content-Type": "application/json", "x-broker-token": "tok" }, body: JSON.stringify({ method: "transfer", args: [] }) })).json();
  console.log("out-of-scope 'transfer' ->", dj.error);

  server.close();
  process.exit(0);
})();
