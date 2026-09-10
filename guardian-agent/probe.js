// Probe the live Token API with the Studio key to lock the exact endpoint + response shape.
const fs = require("fs");
const path = require("path");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GRAPH_API_KEY;
const base = env.TOKEN_API_BASE || "https://token-api.thegraph.com";
const ADDR = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth — a wallet with plenty of tokens

const candidates = [
  `/balances/evm/${ADDR}?network_id=mainnet`,
  `/balances/evm/${ADDR}`,
  `/v1/evm/balances?address=${ADDR}&network=mainnet`,
  `/evm/balances?address=${ADDR}&network_id=mainnet`,
  `/health`,
];

(async () => {
  console.log("key present:", Boolean(key), "| base:", base, "\n");
  for (const c of candidates) {
    const url = base + c;
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
      const txt = (await r.text()).slice(0, 240);
      console.log(`${r.status}  ${c}\n   ${txt}\n`);
    } catch (e) {
      console.log(`ERR  ${c}: ${e.message}\n`);
    }
  }
})();
