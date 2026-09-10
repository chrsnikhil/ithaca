// Guardian consumes graphscout — our protocol-intelligence MCP server — as its risk lens on
// the DeFi venues it's exposed to. This spawns graphscout over stdio (exactly how Claude
// Desktop / Cursor would) and calls its `assess_risk` tool, giving the daemon a decision-ready
// verdict instead of raw subgraph rows. Chain: Guardian -> graphscout -> Subgraph MCP -> The Graph.
//
// Best-effort: if graphscout isn't built or the call fails, this returns null and the daemon
// falls back to its own price/health sensing — never blocks the loop.
const path = require("path");

const SERVER = path.join(__dirname, "..", "graphscout", "dist", "index.js");
const TTL_MS = Number(process.env.GRAPHSCOUT_TTL_MS || 60000);
const cache = new Map(); // query -> { at, value }
let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
      const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [SERVER],
        env: { ...process.env }, // carries GRAPH_API_KEY through to graphscout
      });
      const client = new Client({ name: "guardian-daemon", version: "1.0.0" }, { capabilities: {} });
      await client.connect(transport);
      return client;
    })().catch((e) => { clientPromise = undefined; throw e; });
  }
  return clientPromise;
}

function parseResult(res) {
  const text = (res?.content ?? []).map((c) => (c?.type === "text" ? c.text || "" : "")).join("\n");
  try { const j = JSON.parse(text); return j?.error ? null : j; } catch { return null; }
}

/** Ask graphscout for a decision-ready risk assessment of a protocol (e.g. "aave"). */
async function assessProtocol(query) {
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  let value = null;
  try {
    const client = await getClient();
    value = parseResult(await client.callTool({ name: "assess_risk", arguments: { query } }));
  } catch {
    clientPromise = undefined; // drop a dead subprocess so the next call respawns
  }
  cache.set(query, { at: Date.now(), value });
  return value;
}

module.exports = { assessProtocol };
