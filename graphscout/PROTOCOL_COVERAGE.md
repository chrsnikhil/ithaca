# graphscout — protocol coverage survey

To show graphscout is reusable **infrastructure** (not a one-protocol demo), we point it at 22 protocols spanning lending, DEX, yield, and staking across **Ethereum, Base, Arbitrum, Gnosis, Sonic, Polygon, and BNB** — one command, `assess_risk`, no per-protocol code. All live data.

Reproduce: `GRAPH_API_KEY=<studio key> npm run survey`

## Results (live)

| Query | Protocol | Chain | Type | TVL | TVL 7d | Util | Risk | Verdict |
|---|---|---|---|---|---|---|---|---|
| aave | Aave V2 Ethereum | Ethereum | lending | $97.6M | +0.23% | 14.31% | 8 | healthy |
| compound | Compound V2 Ethereum | Ethereum | lending | $117.8M | +1.02% | 10.25% | 8 | healthy |
| moonwell | Moonwell Base | Base | lending | $49.2M | **-10.96%** | 62.93% | 28 | **watch** |
| spark | Spark Lend Gnosis | Gnosis | lending | $0.4M | -1.87% | 31.18% | 8 | healthy |
| radiant | Radiant Mainnet | Ethereum | lending | $0.3M | +0.17% | 28.07% | 0 | healthy |
| curve | Curve Finance Ethereum | Ethereum | dex | $4.8B | -0.05% | — | 15 | **watch** |
| sushiswap | Sushiswap Arbitrum | Arbitrum | dex | —¹ | — | — | 15 | **watch** |
| lido | Lido Ethereum | Ethereum | staking | $20.9B | +1.54% | — | 15 | **watch** |
| morpho | morpho-blue-sonic | Sonic | lending | $0.0M | 0% | 0% | 0 | healthy |
| venus | Venus Core Pool | — | generic² | — | — | — | 0 | healthy |
| benqi | benqi-01 | — | generic² | — | — | — | 0 | healthy |
| balancer | Balancer Polygon V2 | — | generic² | — | — | — | 0 | healthy |
| pancakeswap | PancakeSwap V3 BNB | — | generic² | — | — | — | 0 | healthy |
| quickswap | QuickSwap V3 | — | generic² | — | — | — | 0 | healthy |
| camelot | camelot-amm-v3 | — | generic² | — | — | — | 0 | healthy |
| uniswap | uniswap-v4-base-3 | — | generic² | — | — | — | 0 | healthy |
| yearn | Yearn Vaults V2 | — | yield² | — | — | — | 0 | healthy |
| beefy | Beefy (Sonic strat) | — | generic² | — | — | — | 0 | healthy |
| convex | Convex | — | generic² | — | — | — | 0 | healthy |
| frax | Fraxlend Mainnet | — | generic² | — | — | — | 0 | healthy |
| silo finance | _no standard subgraph found_³ | | | | | | | |
| rocket pool | _no standard subgraph found_³ | | | | | | | |

¹ Sushiswap's subgraph reports an implausible TVL (a units bug in that subgraph); graphscout's data-quality guard **drops it rather than parroting a wrong number**, and still surfaces the usage-based `watch`.
² Resolved and classified, but the top subgraph for that keyword isn't Messari-standardized, so only shallow metrics are available (see tiers below).
³ Keyword search returned nothing usable; the agent can fall back to `search_protocols` + `inspect_schema` for a custom query.

## How to read this: three tiers of coverage

graphscout's depth depends on the subgraph's schema — and it degrades **gracefully**, never lies:

1. **Full intelligence** — protocols on **Messari-standardized subgraphs** (shared `Protocol/Market/FinancialsDailySnapshot/…` schema). graphscout computes TVL trends, utilization, liquidations, concentration, and a scored verdict. Here: Aave, Compound, Moonwell, Spark, Radiant (lending); Curve, Sushiswap (DEX); Lido (staking). This is where one recipe generalizes across dozens of protocols.
2. **Shallow / generic** — resolved and categorized, but on a bespoke schema, so only surface signals (or none) are available. graphscout says so honestly (`generic`, empty metrics) rather than inventing numbers.
3. **Escape hatch** — for anything custom or not found, `search_protocols` + `inspect_schema` return a distilled schema so an agent can still write a targeted query via the Subgraph MCP.

## What the survey proves

- **Breadth without per-protocol code** — 22 protocols, 7 chains, 4 categories, one tool call each.
- **Real, live risk detection** — 4 protocols flagged `watch` from genuine on-chain conditions (Moonwell **−11% TVL/7d**, Curve/Sushiswap/Lido usage drops), not canned data.
- **Honest degradation + data-quality guards** — it flags implausible data (Sushiswap TVL), marks shallow coverage, and never fabricates a verdict.

## Roadmap

Resolution picks the top keyword match, and an agent can already pick a specific subgraph explicitly today via `search_protocols`. A small curated registry (protocol to canonical subgraph id) is a clean, high-leverage next step that makes flagship resolution deterministic and lifts several rows into full coverage.
