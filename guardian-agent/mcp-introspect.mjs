import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GRAPH_API_KEY;
const authFetch = (url, init) => fetch(url, { ...init, headers: { ...(init && init.headers), Authorization: `Bearer ${key}` } });

const transport = new SSEClientTransport(new URL("https://subgraphs.mcp.thegraph.com/sse"), {
  eventSourceInit: { fetch: authFetch }, requestInit: { headers: { Authorization: `Bearer ${key}` } },
});
const client = new Client({ name: "guardian", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const { tools } = await client.listTools();
for (const t of tools) {
  console.log(`\n# ${t.name}`);
  console.log("  required:", JSON.stringify(t.inputSchema?.required || []));
  console.log("  props:", JSON.stringify(Object.keys(t.inputSchema?.properties || {})));
}

// Prove a real query end-to-end against the Uniswap v3 subgraph we already use.
const UNI = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
for (const argName of ["subgraph_id", "subgraphId", "id"]) {
  try {
    const res = await client.callTool({ name: "execute_query_by_subgraph_id", arguments: { [argName]: UNI, query: `{ bundle(id:"1"){ ethPriceUSD } }` } });
    console.log(`\nquery via arg "${argName}" ->`, JSON.stringify(res).slice(0, 220));
    break;
  } catch (e) { console.log(`\nquery via arg "${argName}" FAILED: ${(e?.message || String(e)).slice(0, 120)}`); }
}
await client.close();
