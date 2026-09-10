// Verify the Studio key against the canonical Graph Gateway (clean JSON, no shell quoting).
const fs = require("fs");
const path = require("path");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GRAPH_API_KEY;
const SUBGRAPH = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"; // Uniswap v3 mainnet (well-known)

async function q(url, label) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: "{ _meta { block { number } } }" }),
    });
    console.log(`[${label}] ${r.status}  ${(await r.text()).slice(0, 200)}`);
  } catch (e) {
    console.log(`[${label}] ERR ${e.message}`);
  }
}

(async () => {
  await q(`https://gateway.thegraph.com/api/subgraphs/id/${SUBGRAPH}`, "header-auth");
  // fallback format: key in the path
  await q(`https://gateway.thegraph.com/api/${key}/subgraphs/id/${SUBGRAPH}`, "path-auth");
})();
