---
name: graphscout
description: Use when an AI agent needs to understand or assess an on-chain protocol (lending markets, DEXes, yield vaults) using live data from The Graph — classify a protocol, read its live health, spot anomalies, compare protocols, or answer "is <protocol> safe right now?". A protocol-intelligence layer on top of The Graph's Subgraph MCP.
---

# graphscout — protocol intelligence for agents

The Graph's Subgraph MCP gives you generic primitives (search / schema / query). **graphscout gives you protocol understanding.** Reach for graphscout instead of hand-writing GraphQL whenever the question is about what a protocol *is* or how *risky/healthy* it is.

## When to use which tool

- **"What is <protocol>? What should I watch?"** → `understand_protocol({ query })`
  Returns the protocol's category (lending / dex / yield), a plain-English summary, the risk factors that matter for that category, its key entities, and alternative subgraphs.

- **"Is <protocol> safe / risky right now?"** → `assess_risk({ query })`
  The one-shot answer: resolves → classifies → pulls live metrics → analyses → returns a 0–100 score, a verdict (`healthy` / `watch` / `elevated` / `critical`), findings with evidence, and positives.

- **"How healthy is <protocol>?"** → `get_protocol_health({ query })`
  Live snapshot: TVL + 7d/30d trend, and for lending: utilization, deposits/borrows, liquidations (24h vs baseline), market count, top-market concentration.

- **"Is anything off with <protocol>?"** → `detect_anomalies({ query })`
  Only the flags that are actually anomalous vs recent history.

- **"Which of these is safer?"** → `compare_protocols({ protocols: ["aave", "compound"] })`

- **"Which risk factors are elevated?"** → `identify_risk_factors({ query })`

- Lower-level, only if you need them: `search_protocols({ query })`, `inspect_schema({ subgraph_id })`.

`query` is a protocol name or keyword — `"aave"`, `"uniswap"`, `"compound"`, or a token symbol. You do **not** need a subgraph id; graphscout resolves it.

## Examples

- "Is Aave risky right now?" → `assess_risk({ query: "aave" })`
- "Compare Aave and Compound." → `compare_protocols({ protocols: ["aave", "compound"] })`
- "What kind of protocol is Curve and what should I watch?" → `understand_protocol({ query: "curve" })`
- "Has anything spiked on Aave in the last day?" → `detect_anomalies({ query: "aave" })`

## Notes

- All results are **live** on-chain data read through The Graph. Numbers are current; trends are computed from daily snapshots.
- Works best on protocols with Messari-standardized subgraphs (most major lending/DEX/yield protocols). For non-standard subgraphs, `assess_risk`/`get_protocol_health` note the limited coverage and you can fall back to `inspect_schema` + a custom query via the Subgraph MCP.
- Requires `GRAPH_API_KEY` (a free Subgraph Studio key) in the server's environment.
