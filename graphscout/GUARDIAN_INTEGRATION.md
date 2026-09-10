# graphscout × Guardian — real consumer, live on Base

graphscout isn't a demo in a vacuum: **[Guardian](../guardian)** (an autonomous, voice-first on-chain capital protector) uses it as its live **Base-mainnet risk lens**. This is the "AI use case with The Graph as load-bearing data" half of the story — Guardian's autonomous decisions are driven by graphscout, which is driven by The Graph.

## The chain

```
Guardian daemon  ──(MCP over stdio)──▶  graphscout  ──(MCP over SSE)──▶  Subgraph MCP  ──▶  The Graph  ──▶  Base mainnet
   (sense→decide→act)                 (protocol intelligence)          (primitive)                         (live indexed data)
```

Every loop, before it invests or when it senses trouble, Guardian's daemon calls graphscout's `assess_risk` on the Base lending market it's exposed to and **factors the verdict into its on-chain action** (invest / de-risk / protect). graphscout's verdict can only *raise* Guardian's risk severity, never lower it:

- `critical` → severity 3 → Guardian **evacuates** to the safe haven
- `elevated` → severity 2 → Guardian **de-risks** (pulls the position back)
- `watch` / `healthy` → noted in the feed, no forced action

Wiring: [`guardian-agent/graphscout-client.js`](../guardian-agent/graphscout-client.js) spawns graphscout over stdio (exactly how Claude Desktop / Cursor would) and [`guardian-agent/daemon.js`](../guardian-agent/daemon.js) consumes it in its `sense()` step. Best-effort — if graphscout is down, Guardian falls back to its own price/health sensing.

## Why Moonwell Base

Guardian invests on Base. On **Base testnet**, its own Aave position has no rich Graph data (the only "aave base" subgraph is a testnet deployment with a custom, sparse schema). So Guardian's live risk lens reads a **real Base-mainnet money market** via graphscout — **Moonwell**, the flagship Base lender, richly indexed on The Graph. (Compound V3 Base works too; set `VENUE_PROTOCOL` to switch.)

## It catches a real signal (live, Base mainnet)

`assess_risk("moonwell")` right now:

```json
{
  "protocol": "Moonwell Base",
  "network": "BASE",
  "category": "lending",
  "score": 28,
  "verdict": "watch",
  "findings": [
    { "factor": "tvl_trend",     "severity": "medium", "detail": "TVL fell -10.94% in 7d." },
    { "factor": "revenue_trend", "severity": "low",    "detail": "Protocol revenue down -95.98% in 7d." }
  ],
  "positives": ["Utilization healthy at 62.93%."],
  "metrics": { "tvlUSD": 49185318, "utilizationPct": 62.93, "marketCount": 21, "inactiveMarketCount": 3, "topMarketSharePct": 22.71 }
}
```

That's not a canned number — it's a **genuine risk signal on a live Base protocol** (a real ~11% TVL outflow), surfaced to Guardian as an actionable verdict. A `watch` correctly informs without over-reacting; had it been `elevated`/`critical`, Guardian would have de-risked or evacuated autonomously.

## graphscout vs. the raw Subgraph MCP — on Base

Same question ("is this Base market risky?"), measured live (`npm run benchmark moonwell`):

| | Raw Subgraph MCP | graphscout |
|---|---|---|
| Agent round-trips (model turns) | 3+ (search → schema → query → interpret) | **1** (`assess_risk`) |
| Tokens the model must read | **~16,454** (Moonwell's schema alone) | **~220** |
| Reduction | — | **~75× fewer** |
| Decision-ready verdict | ❌ raw rows | ✅ scored verdict + evidence |

For Guardian — a **voice** agent — this is the difference between a snappy spoken answer and a multi-second, multi-call stall while it ingests a 16K-token schema and hand-writes GraphQL. graphscout turns "monitor Base lending risk" into a single, cheap, decision-ready call.

## Reproduce

```bash
# graphscout assessing Base markets:
GRAPH_API_KEY=<studio key> npx tsx src/test-base.ts

# the Base benchmark above:
GRAPH_API_KEY=<studio key> npm run benchmark moonwell

# Guardian's daemon consuming graphscout as its Base lens:
cd ../guardian-agent && node test-graphscout.js
```
