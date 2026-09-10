/**
 * Smoke test: spawn the BUILT graphscout as a real MCP server over stdio, list its tools,
 * and call one — exactly how an MCP client (Claude Desktop / Cursor / Guardian) uses it.
 *   GRAPH_API_KEY=xxxx npx tsx src/smoke-mcp.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const log = (...a: unknown[]) => console.error(...a);

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath, // node
    args: ["dist/index.js"],
    env: { ...process.env } as Record<string, string>,
  });
  const client = new Client({ name: "smoke", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  const tools = await client.listTools();
  log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

  const res: any = await client.callTool({ name: "assess_risk", arguments: { query: "aave" } });
  const text = (res?.content ?? []).map((c: any) => c.text).join("\n");
  log("\nassess_risk('aave') via MCP:\n" + text.slice(0, 600));

  await client.close();
  process.exit(0);
}
main().catch((e) => { log("SMOKE FAILED:", e); process.exit(1); });
