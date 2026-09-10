/**
 * Live probe (not a unit test): hits the real Subgraph MCP so we can see the ACTUAL
 * shape of search results and real subgraph schemas, and build the intelligence layer
 * against real field names instead of guesses.
 *
 * Run:  GRAPH_API_KEY=xxxx npx tsx src/selftest.ts [keyword]
 */
import { mcpListTools, mcpSearch, mcpSchema } from "./subgraph-mcp.js";
import { distill, formatDistilled } from "./distill.js";

const log = (...a: unknown[]) => console.error(...a);

function firstArray(x: unknown): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") {
    for (const k of ["results", "subgraphs", "data", "items"]) {
      const v = (x as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

async function main() {
  const keyword = process.argv[2] || "aave";

  log("== hosted MCP tools ==");
  try {
    const tools = (await mcpListTools()) as { tools?: Array<{ name: string }> };
    log((tools.tools ?? []).map((t) => t.name).join(", "));
  } catch (e) {
    log("listTools failed:", (e as Error).message);
  }

  log(`\n== search "${keyword}" ==`);
  const res = await mcpSearch(keyword);
  const arr = firstArray(res);
  log("result is array?", Array.isArray(res), "| count:", arr.length);
  log("raw (first 1200 chars):");
  log(JSON.stringify(res, null, 2).slice(0, 1200));

  const top = arr[0];
  if (top) {
    log("\n== top result keys ==");
    log(Object.keys(top).join(", "));
  }

  const id = top?.subgraphId ?? top?.subgraph_id ?? top?.id ?? top?.ipfsHash ?? top?.deploymentId;
  log("\nchosen subgraph id:", id);
  if (id) {
    log("\n== schema (first 700 chars) ==");
    const sdl = await mcpSchema(String(id));
    log(sdl.slice(0, 700));
    try {
      const d = distill(sdl);
      log("\n== entity names ==");
      log(d.entityNames.join(", "));
      log("\n== distilled (first 1800 chars) ==");
      log(formatDistilled(d).slice(0, 1800));
    } catch (e) {
      log("distill failed:", (e as Error).message);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  log("SELFTEST FAILED:", e);
  process.exit(1);
});
