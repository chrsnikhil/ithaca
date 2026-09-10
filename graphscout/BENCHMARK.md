# graphscout vs. the raw Subgraph MCP — benchmark

**Task:** answer *"is `<protocol>` risky right now?"* using live on-chain data from The Graph.

We measure the load that lands on the **agent** (the LLM) with each approach — because that's what determines cost, latency, and reliability in practice. Same underlying data source (The Graph); graphscout simply moves the discovery / schema-reading / query-authoring / interpretation *off the agent* and behind one semantic call.

## TL;DR

| Protocol | Raw MCP round-trips¹ | graphscout round-trips | Tokens the model must read (raw) | Tokens (graphscout) | Reduction | Decision-ready verdict? (raw / gs) |
|---|---|---|---|---|---|---|
| Aave (V2 Ethereum) | **3+** | **1** | **~23,400** | **~203** | **115× fewer** | no / **yes** |
| Compound (V2 Ethereum) | **3+** | **1** | **~16,400** | **~204** | **81× fewer** | no / **yes** |

**Average: ~98× fewer tokens for the model to read, 3× fewer agent round-trips (3 → 1), and a decision-ready risk verdict that the raw path doesn't produce at all.** Measured live via `src/benchmark.ts`.

¹ Each MCP round-trip is a separate model turn (call tool → read result → decide next). "3+" is conservative — it counts `search` + `get_schema` + one `execute_query` and **excludes** the query-authoring retries a real agent incurs when its first hand-written GraphQL is wrong.

## Method

**Baseline — raw Subgraph MCP** (what a capable agent must do itself):
1. `search_subgraphs_by_keyword` → find the subgraph.
2. `get_schema_by_subgraph_id` → **read the full SDL** to learn how to query it. This is the token bomb: Aave's schema alone is ~20K tokens.
3. Author a correct GraphQL query and `execute_query_by_subgraph_id` → get **raw rows**.
4. Then the agent *still* has to derive utilization, liquidation spikes, concentration, and trends from those rows and decide what "risky" means.

Tokens counted = the schema the model must read **+** the raw result it must interpret. Verdict = none (raw numbers only).

**graphscout:**
1. `assess_risk({ query })` → one call returns a structured, decision-ready assessment (score, verdict, findings with evidence, positives, metrics).

Tokens counted = that single compact response.

Token estimate ≈ bytes ÷ 4 (rough). graphscout makes the same primitive Graph calls **internally** — the point is that the agent no longer pays for them in round-trips, context, or reasoning.

## Why the difference matters

1. **Round-trips = model turns.** 3 → 1 means fewer LLM calls, lower latency, less to go wrong. In a voice agent (Guardian) that's the difference between a snappy answer and an awkward pause.
2. **~98× fewer tokens.** A ~20K-token schema never enters the agent's context. That's real money and a real context-window saving on every question.
3. **Decision-ready, not raw.** The raw path returns rows; the agent must still *become a DeFi analyst* to interpret them. graphscout returns a verdict with evidence — the semantic work is done.

## Intelligence graphscout adds that the raw rows don't contain

None of these are fields you can just query — they must be **derived**, and graphscout encodes how:

- **Utilization %** = totalBorrow / totalDeposit (and its 7d change).
- **Liquidation spike** = last-24h liquidation volume ÷ trailing daily baseline (a multiple).
- **Market concentration** = top market's share of protocol TVL.
- **TVL trend** = 7d / 30d change from daily snapshots.
- **Risk score & verdict** = a weighted synthesis of the above into `healthy / watch / elevated / critical` with per-factor findings.

A raw-MCP agent would have to re-implement all of this, correctly, for every protocol type.

## Latency (transparency)

Server-side wall-clock was comparable or faster for graphscout in these runs (e.g. Aave: ~1.2s vs ~3.6s), but we don't lead with latency — it varies with gateway load and graphscout does similar work internally. The durable wins are **round-trips, tokens, and decision-readiness**.

## Reproduce

```bash
GRAPH_API_KEY=your_studio_key npx tsx src/benchmark.ts
```

Numbers above were produced by that script against live subgraphs on The Graph's decentralized network.
