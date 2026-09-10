// Live SEE-pipeline proof: gateway subgraph query -> normalize -> risk brain -> verdict.
const fs = require("fs");
const path = require("path");
const { assessRisk } = require("./risk");
const { fetchPortfolio } = require("./graph");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const apiKey = env.GRAPH_API_KEY;

(async () => {
  console.log("[Graph] live stablecoin prices via the gateway (proves data is real, not mocked):");
  const portfolio = await fetchPortfolio({ apiKey });
  for (const p of portfolio.positions) console.log(`   ${p.symbol}: $${p.price.toFixed(5)}`);

  const safe = assessRisk(portfolio);
  console.log("\n[risk brain] verdict on LIVE prices:", JSON.stringify(safe));

  // Simulate the "danger dial": inject a depeg scenario to show the trigger fires.
  const dialed = { positions: [{ symbol: "USDC", isStable: true, price: 0.94 }], healthFactor: 1.03 };
  console.log("[risk brain] verdict on DIALED danger:", JSON.stringify(assessRisk(dialed)));
})();
