/**
 * Thin client to The Graph's OFFICIAL hosted Subgraph MCP server.
 *
 * This is graphscout's PRIMITIVE layer — we deliberately do NOT reimplement subgraph
 * discovery / schema retrieval / query execution. The Graph already does that well.
 * graphscout's value is the protocol-INTELLIGENCE layer we build ON TOP of these calls
 * (see intel.ts). Architecture:
 *
 *      graphscout tools (understand / risk / health / anomalies / compare / assess)
 *                                   |
 *                       THIS FILE  (primitive access)
 *                                   |
 *                   Official Subgraph MCP  (subgraphs.mcp.thegraph.com/sse)
 *                                   |
 *                              The Graph -> on-chain data
 *
 * SSE transport, authed with a Gateway/Studio key (EventSource can't set headers, so we
 * inject Authorization via a custom fetch on the SSE GET and via requestInit on POSTs).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SSE_URL = "https://subgraphs.mcp.thegraph.com/sse";

function apiKey(): string {
  const k = process.env.GRAPH_API_KEY;
  if (!k) throw new Error("GRAPH_API_KEY not set (create one at https://thegraph.com/studio).");
  return k;
}

let clientPromise: Promise<Client> | undefined;

async function makeClient(): Promise<Client> {
  const key = apiKey();
  const authFetch = ((url: string | URL | Request, init?: RequestInit) =>
    fetch(url, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${key}` } })) as typeof fetch;
  const transport = new SSEClientTransport(new URL(SSE_URL), {
    eventSourceInit: { fetch: authFetch },
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  const client = new Client({ name: "graphscout", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = makeClient().catch((e) => {
      clientPromise = undefined; // let the next call retry a fresh connection
      throw e;
    });
  }
  return clientPromise;
}

function textOf(res: unknown): string {
  const content = (res as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (Array.isArray(content)) return content.map((c) => (c?.type === "text" ? c.text ?? "" : "")).join("\n");
  return typeof res === "string" ? res : JSON.stringify(res);
}

function parseMaybe(txt: string): unknown {
  try { return JSON.parse(txt); } catch { return txt; }
}

async function call(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    const client = await getClient();
    return textOf(await client.callTool({ name, arguments: args }));
  } catch (e) {
    clientPromise = undefined; // drop a dead connection so the next call reconnects
    throw e;
  }
}

/** PRIMITIVE: find subgraphs matching a keyword (protocol name, token, etc.). */
export async function mcpSearch(keyword: string): Promise<unknown> {
  return parseMaybe(await call("search_subgraphs_by_keyword", { keyword }));
}

/** PRIMITIVE: top subgraph deployments indexing a given contract address. */
export async function mcpTopByContract(contractAddress: string): Promise<unknown> {
  return parseMaybe(await call("get_top_subgraph_deployments", { contract_address: contractAddress }));
}

/** PRIMITIVE: a subgraph's GraphQL schema (SDL text). */
export async function mcpSchema(subgraphId: string): Promise<string> {
  return await call("get_schema_by_subgraph_id", { subgraph_id: subgraphId });
}

/** PRIMITIVE: run a GraphQL query against a subgraph by id. */
export async function mcpQuery(subgraphId: string, query: string, variables?: Record<string, unknown>): Promise<unknown> {
  const args: Record<string, unknown> = { subgraph_id: subgraphId, query };
  if (variables) args.variables = variables;
  return parseMaybe(await call("execute_query_by_subgraph_id", args));
}

/** Debug helper: list the tools the hosted MCP actually exposes. */
export async function mcpListTools(): Promise<unknown> {
  const client = await getClient();
  return await client.listTools();
}
