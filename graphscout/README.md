# graphscout

**A protocol-intelligence layer on top of The Graph's Subgraph MCP.**

The Graph lets agents *access* on-chain data. graphscout makes that data *intelligible and actionable* for agents.

---

## The problem

The Graph's official [Subgraph MCP](https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/) is excellent, but it exposes **generic primitives**: search subgraphs, fetch a schema, run a GraphQL query. It hands an agent a universe of indexed data and says *"go figure out what you need."*

It does **not** know that:

- for a **lending** protocol, "risky" means utilization spiking, liquidations surging, or TVL fleeing;
- for a **DEX**, it means liquidity and volume collapsing;
- which of the hundreds of fields in a subgraph schema actually matter for *this kind* of protocol.

So the agent still has to juggle subgraph IDs, read thousand-line schemas, hand-write GraphQL, and interpret raw rows — every single time.

## What graphscout adds

graphscout sits **on top of** the Subgraph MCP and adds the missing **semantic layer** — domain-level tools an agent actually wants:

```
        AI agent (e.g. a risk-monitoring / portfolio copilot)
                              |
                       graphscout          <-- protocol intelligence
              understand / risk / health / anomalies / compare / assess
                              |
                  The Graph Subgraph MCP   <-- generic primitives
                              |
                        The Graph  ->  on-chain data
```

The leverage: most major protocols publish **Messari-standardized subgraphs** that share a common schema (`LendingProtocol` / `DexAmmProtocol`, `Market`, `FinancialsDailySnapshot`, `UsageMetricsDailySnapshot`, …). One recipe per archetype therefore generalizes across **dozens of real protocols** — that's what makes graphscout reusable infrastructure, not a per-protocol hack.

## Tools

| Tool | What it answers |
|------|-----------------|
| `understand_protocol` | What *kind* of protocol is this, and what should I watch on it? |
| `identify_risk_factors` | The risk factors that matter for its category — and which are flashing right now. |
| `get_protocol_health` | A live health snapshot: TVL + 7d/30d trend, utilization, deposits/borrows, liquidations, concentration, active users. |
| `detect_anomalies` | Only the things that are actually *off* vs recent history. |
| `assess_risk` | The full pipeline in one call → a 0–100 score, a verdict, findings with evidence, and positives. |
| `compare_protocols` | Two+ protocols side by side on TVL, trend, utilization, risk. |
| `search_protocols` | Lower-level: find candidate subgraphs by keyword. |
| `inspect_schema` | Escape hatch: a distilled schema for writing custom queries on non-standard subgraphs. |

All data is **live** and read through The Graph (Subgraph MCP + Gateway). No mocks.

## Install

```bash
npm install -g graphscout      # or run from source: npm install && npm run build
```

You need a Graph API key — create one free at [thegraph.com/studio](https://thegraph.com/studio) → **API Keys**.

### Use it in an MCP client (Claude Desktop, Cursor, …)

```json
{
  "mcpServers": {
    "graphscout": {
      "command": "graphscout",
      "env": { "GRAPH_API_KEY": "your_studio_key" }
    }
  }
}
```

From source, use `"command": "node"`, `"args": ["/abs/path/graphscout/dist/index.js"]`.

## Example

> **Agent:** "Is Aave risky right now?"

`assess_risk({ query: "aave" })` →

```json
{
  "protocol": "Aave V2 Ethereum",
  "category": "lending",
  "network": "MAINNET",
  "score": 8,
  "verdict": "healthy",
  "findings": [
    { "factor": "revenue_trend", "severity": "low", "detail": "Protocol revenue down -89.4% in 7d." }
  ],
  "positives": ["TVL stable (0.23% 7d, $97.57M).", "Utilization healthy at 14.31%."],
  "metrics": { "tvlUSD": 97573741, "utilizationPct": 14.31, "topMarketSharePct": 24.1, "marketCount": 37, "...": "..." }
}
```

The agent asked one question and got a structured, protocol-aware answer — instead of orchestrating a search → schema → query → interpret loop itself.

## Benchmark: ~98× fewer tokens, 3× fewer round-trips

Answering "is this protocol risky?" via the raw Subgraph MCP forces the agent to read the full schema (~20K tokens for Aave), author GraphQL, and interpret raw rows. graphscout returns a decision-ready verdict in one call. Measured live:

| Protocol | Raw MCP round-trips | graphscout | Tokens read (raw → gs) | Verdict? |
|---|---|---|---|---|
| Aave | 3+ | 1 | ~23,400 → ~203 (**115× fewer**) | no → **yes** |
| Compound | 3+ | 1 | ~16,400 → ~204 (**81× fewer**) | no → **yes** |

Full methodology and reproduction: [BENCHMARK.md](./BENCHMARK.md) (`npm run benchmark`).

## How it works

1. **Resolve** — a name/keyword → the best live subgraph (via the Subgraph MCP).
2. **Classify** — read the schema, detect the archetype from its entities (Messari-standard `LendingProtocol` / `DexAmmProtocol` / …).
3. **Pull** — run the archetype's metric recipe against live indexed data.
4. **Analyse** — compute trends, utilization, liquidation spikes, concentration; score the risk.
5. **Return** — structured intelligence an agent (or a human) can act on.

Non-standard subgraphs degrade gracefully: graphscout falls back to a distilled schema (`inspect_schema`) so the agent can write a bespoke query.

## Develop

```bash
npm run dev        # run the MCP server from source (stdio)
npm run selftest   # probe the live Subgraph MCP (search + schema)
npm run build      # tsc -> dist/
GRAPH_API_KEY=xxx npx tsx src/test-intel.ts   # exercise the intelligence on live Aave/Compound
GRAPH_API_KEY=xxx npx tsx src/smoke-mcp.ts    # spawn the built server and call it as a real MCP client
```

## Built on The Graph

- **Subgraph MCP** (`subgraphs.mcp.thegraph.com/sse`) — discovery, schema, query primitives.
- **The Graph Gateway** / **Subgraph Studio** — live indexed data, authed with your Studio API key.

## License

MIT
