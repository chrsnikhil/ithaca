// Confirms Guardian's daemon can consume graphscout (spawn over stdio, get a verdict).
//   node test-graphscout.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const graphscout = require("./graphscout-client");

(async () => {
  const venue = process.env.VENUE_PROTOCOL || "moonwell";
  console.log(`asking graphscout to assess '${venue}' (Guardian's Base venue lens)...`);
  const a = await graphscout.assessProtocol(venue);
  console.log(JSON.stringify(a, null, 2));
  console.log(a ? `\nOK: ${a.protocol} -> ${a.verdict} (risk ${a.score}/100)` : "\nnull (graphscout unavailable — daemon would fall back)");
  process.exit(0);
})();
