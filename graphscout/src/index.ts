#!/usr/bin/env node
/**
 * graphscout — a protocol-intelligence MCP server that sits ON TOP of The Graph's Subgraph MCP.
 *
 * The Graph's Subgraph MCP gives agents generic primitives (discover / schema / query).
 * graphscout adds the missing SEMANTIC layer: domain-level tools that let an agent reason
 * about a protocol — what it is, what makes it risky, how healthy it is, what's anomalous —
 * instead of hand-writing GraphQL and interpreting raw rows.
 *
 * stdio transport: install it in any MCP client (Claude Desktop, Cursor, or an app agent)
 * and set GRAPH_API_KEY in the client's env for that server.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  understandProtocol, identifyRiskFactors, getProtocolHealth,
  detectAnomalies, assessRisk, compareProtocols, inspectSchema, searchProtocols,
} from "./intel.js";

const server = new McpServer({ name: "graphscout", version: "0.1.0" });

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };
const asText = (obj: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });
const asError = (e: unknown): ToolResult => ({ content: [{ type: "text", text: `graphscout error: ${e instanceof Error ? e.message : String(e)}` }], isError: true });
const run = <A>(fn: (a: A) => Promise<unknown>) => async (a: A): Promise<ToolResult> => {
  try { return asText(await fn(a)); } catch (e) { return asError(e); }
};

const Q = z.string().min(1).describe("Protocol name or keyword, e.g. \"aave\", \"uniswap\", \"compound\", or a token symbol.");

server.registerTool(
  "understand_protocol",
  {
    title: "Understand a protocol",
    description:
      "Resolve a protocol to its live subgraph and return a semantic profile: what kind of protocol it is (lending / DEX / yield), a plain-English summary, the risk factors that matter for THAT kind of protocol, its key entities, and alternative subgraphs. Start here before analysing an unfamiliar protocol.",
    inputSchema: { query: Q },
  },
  run(({ query }: { query: string }) => understandProtocol(query)),
);

server.registerTool(
  "identify_risk_factors",
  {
    title: "Identify risk factors",
    description:
      "For a protocol, list the risk factors that matter for its category and mark which are currently OK vs elevated (with live evidence). Answers \"what should I watch on this protocol, and is any of it flashing right now?\"",
    inputSchema: { query: Q },
  },
  run(({ query }: { query: string }) => identifyRiskFactors(query)),
);

server.registerTool(
  "get_protocol_health",
  {
    title: "Get protocol health",
    description:
      "Return a structured live health snapshot: TVL and its 7d/30d trend, plus category-specific metrics (lending: utilization, deposits/borrows, liquidations, market concentration; others: active users). Live indexed data via The Graph.",
    inputSchema: { query: Q },
  },
  run(({ query }: { query: string }) => getProtocolHealth(query)),
);

server.registerTool(
  "detect_anomalies",
  {
    title: "Detect anomalies",
    description:
      "Compare a protocol's current behaviour to its recent history and flag anomalies — TVL flight, utilization spikes, liquidation surges, dangerous concentration. Returns only the things that are actually off.",
    inputSchema: { query: Q },
  },
  run(({ query }: { query: string }) => detectAnomalies(query)),
);

server.registerTool(
  "assess_risk",
  {
    title: "Assess risk",
    description:
      "The full pipeline in one call: resolve -> classify -> pull live metrics -> analyse -> a structured risk assessment with a 0-100 score, a verdict (healthy/watch/elevated/critical), specific findings with evidence, and positives. This is the tool to call for \"is <protocol> safe right now?\".",
    inputSchema: { query: Q },
  },
  run(({ query }: { query: string }) => assessRisk(query)),
);

server.registerTool(
  "compare_protocols",
  {
    title: "Compare protocols",
    description:
      "Compare two or more protocols side by side on TVL, TVL trend, utilization, and risk score/verdict. Good for \"which lending market is safer, aave or compound?\".",
    inputSchema: { protocols: z.array(z.string().min(1)).min(2).max(6).describe("Protocol names/keywords to compare.") },
  },
  run(({ protocols }: { protocols: string[] }) => compareProtocols(protocols)),
);

server.registerTool(
  "search_protocols",
  {
    title: "Search protocols / subgraphs",
    description: "Find subgraphs matching a keyword (protocol name or token). Returns candidate subgraph ids + names. Lower-level; prefer understand_protocol / assess_risk for analysis.",
    inputSchema: { query: Q, limit: z.number().int().min(1).max(20).optional() },
  },
  run(({ query, limit }: { query: string; limit?: number }) => searchProtocols(query, limit ?? 6)),
);

server.registerTool(
  "inspect_schema",
  {
    title: "Inspect a subgraph schema (distilled)",
    description: "Escape hatch: return a compact, distilled view of a specific subgraph's schema (entities, fields, entry points, example queries) so an agent can write a custom query for non-standard subgraphs.",
    inputSchema: { subgraph_id: z.string().min(1).describe("The subgraph id (from search_protocols / understand_protocol).") },
  },
  run(({ subgraph_id }: { subgraph_id: string }) => inspectSchema(subgraph_id)),
);

async function main() {
  if (!process.env.GRAPH_API_KEY) {
    console.error("[graphscout] warning: GRAPH_API_KEY is not set; every tool will error until it is.");
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[graphscout] MCP server ready on stdio.");
}

main().catch((e) => {
  console.error("[graphscout] fatal:", e);
  process.exit(1);
});
