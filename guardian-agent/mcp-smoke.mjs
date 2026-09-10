import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GRAPH_API_KEY;
const authFetch = (url, init) => fetch(url, { ...init, headers: { ...(init && init.headers), Authorization: `Bearer ${key}` } });

async function attempt(label, transport) {
  const client = new Client({ name: "guardian", version: "1.0.0" }, { capabilities: {} });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    console.log(`[${label}] CONNECTED. tools: ${tools.tools.map((t) => t.name).join(", ")}`);
    const res = await client.callTool({ name: "search_subgraphs_by_keyword", arguments: { keyword: "aave" } });
    console.log(`[${label}] search(aave) ->`, JSON.stringify(res).slice(0, 300));
    await client.close();
    return true;
  } catch (e) {
    console.log(`[${label}] FAILED: ${(e?.message || String(e)).slice(0, 200)}`);
    try { await client.close(); } catch {}
    return false;
  }
}

(async () => {
  try {
    const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
    for (const url of ["https://subgraphs.mcp.thegraph.com/", "https://subgraphs.mcp.thegraph.com/mcp"]) {
      const t = new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { Authorization: `Bearer ${key}` } } });
      if (await attempt(`streamable ${url}`, t)) return;
    }
  } catch (e) { console.log("streamable import err:", e.message); }

  try {
    const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");
    const t = new SSEClientTransport(new URL("https://subgraphs.mcp.thegraph.com/sse"), { eventSourceInit: { fetch: authFetch }, requestInit: { headers: { Authorization: `Bearer ${key}` } } });
    if (await attempt("sse", t)) return;
  } catch (e) { console.log("sse import err:", e.message); }

  console.log("all transports failed");
})();
