import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// The Graph's hosted Subgraph MCP server. This is Guardian's SECOND Graph product
// (alongside the direct Gateway queries in /api/tools): it lets the agent DISCOVER and
// query any of 15k+ subgraphs on the fly, so protection isn't limited to protocols we
// hardcoded. SSE transport, authed with the same Gateway/Studio key.
const SSE_URL = "https://subgraphs.mcp.thegraph.com/sse";

type Cached = typeof globalThis & { __guardianSgMcp?: Promise<Client> };

async function makeClient(): Promise<Client> {
  const key = process.env.GRAPH_API_KEY;
  if (!key) throw new Error("GRAPH_API_KEY not set");
  // EventSource can't set headers directly; inject auth via a custom fetch on the SSE GET,
  // and via requestInit for the message POSTs.
  const authFetch = ((url: string | URL | Request, init?: RequestInit) =>
    fetch(url, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${key}` } })) as typeof fetch;
  const transport = new SSEClientTransport(new URL(SSE_URL), {
    eventSourceInit: { fetch: authFetch },
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  const client = new Client({ name: "guardian", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

function getClient(): Promise<Client> {
  const g = globalThis as Cached;
  if (!g.__guardianSgMcp) {
    g.__guardianSgMcp = makeClient().catch((e) => {
      g.__guardianSgMcp = undefined; // let the next call retry a fresh connection
      throw e;
    });
  }
  return g.__guardianSgMcp;
}

function textOf(res: unknown): string {
  const content = (res as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (Array.isArray(content)) return content.map((c) => (c?.type === "text" ? c.text ?? "" : "")).join("\n");
  return typeof res === "string" ? res : JSON.stringify(res);
}

function parse(txt: string): unknown {
  try { return JSON.parse(txt); } catch { return txt; }
}

async function call(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    const client = await getClient();
    return textOf(await client.callTool({ name, arguments: args }));
  } catch (e) {
    (globalThis as Cached).__guardianSgMcp = undefined; // drop a dead connection so we reconnect
    throw e;
  }
}

/** Find subgraphs matching a protocol/keyword (e.g. "aave", "compound", "lido"). */
export async function discoverSubgraph(keyword: string): Promise<unknown> {
  return parse(await call("search_subgraphs_by_keyword", { keyword }));
}

/** Read a subgraph's GraphQL schema so the agent knows what it can query. */
export async function getSubgraphSchema(subgraphId: string): Promise<string> {
  return await call("get_schema_by_subgraph_id", { subgraph_id: subgraphId });
}

/** Run a GraphQL query against a specific subgraph by its ID. */
export async function querySubgraph(subgraphId: string, query: string, variables?: Record<string, unknown>): Promise<unknown> {
  const args: Record<string, unknown> = { subgraph_id: subgraphId, query };
  if (variables) args.variables = variables;
  return parse(await call("execute_query_by_subgraph_id", args));
}
