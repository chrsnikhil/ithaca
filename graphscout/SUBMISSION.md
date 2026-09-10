# graphscout — ETHOnline 2026 submission

**Track:** The Graph — *Best AI Tooling or AI Use Case with The Graph*
**Pool:** Start Fresh (net-new, built during the event)
**Category:** AI tooling — a reusable MCP server that makes The Graph easier to use from AI environments.

---

## One-liner

**The Graph lets agents *access* on-chain data. graphscout makes that data *intelligible and actionable* for agents** — a protocol-intelligence MCP layer built on top of The Graph's official Subgraph MCP.

## The problem it solves

The Graph's Subgraph MCP is powerful but **generic**: search / schema / query. To answer a real question like *"is Aave risky right now?"* an agent must discover the subgraph, **read a ~20,000-token schema**, hand-author GraphQL, run it, and then *become a DeFi analyst* to interpret raw rows — every time, for every protocol. The primitive knows how to fetch data; it doesn't know what "risky" *means*.

## What we built

A stdio **MCP server** that adds the missing **semantic layer** — domain-level tools any MCP agent (Claude, Cursor, or an app) can install:

| Tool | Answers |
|---|---|
| `understand_protocol` | What kind of protocol is this, and what should I watch on it? |
| `identify_risk_factors` | Which risk factors matter here — and which are flashing now? |
| `get_protocol_health` | Live snapshot: TVL + trend, utilization, deposits/borrows, liquidations, concentration. |
| `detect_anomalies` | Only what's actually off vs recent history. |
| `assess_risk` | One call → 0–100 score, verdict, findings with evidence, positives. |
| `compare_protocols` | Two+ protocols side by side. |
| `search_protocols` / `inspect_schema` | Lower-level discovery + a distilled-schema escape hatch. |

It rides on a **protocol-type ontology** (lending / DEX / yield archetypes with their real risk factors) keyed to **Messari-standardized subgraphs** — so one recipe generalizes across dozens of real protocols. That's what makes it reusable infrastructure, not a per-protocol script.

## How it uses The Graph (load-bearing, live)

- **The Graph's official Subgraph MCP** (`subgraphs.mcp.thegraph.com/sse`) is the primitive layer for discovery, schema, and query execution.
- **The Graph Gateway / Subgraph Studio** API key authenticates every call.
- All data is **live** from The Graph's decentralized network — **no mocks, no static datasets** (a track requirement).

```
        AI agent  (Guardian, or any Claude/Cursor agent)
                          |
                     graphscout          <-- our contribution: protocol intelligence
        understand / risk / health / anomalies / compare / assess
                          |
              The Graph Subgraph MCP     <-- The Graph's primitive
                          |
                    The Graph  ->  on-chain data
```

## Proof it's better than the raw primitive (measured live)

`npm run benchmark` — answering "is `<protocol>` risky?" on Aave & Compound:

| | Raw Subgraph MCP | graphscout |
|---|---|---|
| Agent round-trips (model turns) | 3+ | **1** |
| Tokens the model must read | ~23,400 / ~16,400 | **~203 / ~204** |
| Reduction | — | **~98× fewer** |
| Decision-ready verdict | ❌ raw rows | ✅ scored verdict |

graphscout also computes metrics that **aren't directly queryable** — utilization, liquidation-spike multiple, market concentration, TVL trends, and the risk score itself. A raw-MCP agent would have to re-derive all of that correctly per protocol. Full methodology: [BENCHMARK.md](./BENCHMARK.md).

## Meaningful work with the data (not raw passthrough)

graphscout reasons over the data: classifies the protocol, selects the metrics that matter for that class, computes derived risk signals, detects anomalies vs history, and produces a structured assessment with a verdict and evidence — satisfying the track's "reasoning / decisions / automation, not just printing a query result."

## Real-world consumer

**[Guardian](../guardian)** — an autonomous, voice-first on-chain capital-protector — uses graphscout as its protocol-intelligence layer: before it invests or when it senses trouble, Guardian's autonomous daemon calls `assess_risk` on the venue it's exposed to and factors the verdict into its decision. graphscout is reusable infrastructure; Guardian is its first consumer.

## Run it

```bash
npm install && npm run build
# in an MCP client config:
#   "graphscout": { "command": "graphscout", "env": { "GRAPH_API_KEY": "<studio key>" } }

# or exercise it directly:
GRAPH_API_KEY=<studio key> npm run test:intel   # live intelligence on Aave/Compound
GRAPH_API_KEY=<studio key> npm run smoke         # runs it as a real MCP server
GRAPH_API_KEY=<studio key> npm run benchmark     # the numbers above
```

- **Docs:** [README.md](./README.md) · [SKILL.md](./SKILL.md) · [BENCHMARK.md](./BENCHMARK.md) · [PROTOCOL_COVERAGE.md](./PROTOCOL_COVERAGE.md) (22 protocols, 7 chains, live) · [GUARDIAN_INTEGRATION.md](./GUARDIAN_INTEGRATION.md) (real consumer on Base)
- **Repo:** _(public GitHub URL — add on push)_
- **Demo video:** _(2–4 min — add link)_
- **License:** MIT
