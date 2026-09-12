# ITHACA → The Graph

## Prize
**Best AI Tooling or AI Use Case with The Graph (From Scratch)** — **$5,000** (From Scratch / net-new pool).

## The pitch
ITHACA hits **both sides** of this prize at once. The **tooling** is `graphscout`: a reusable, open-source **MCP server** that turns The Graph from a raw-data firehose into a single decision-ready call — installable in Claude Desktop or Cursor by anyone. The **AI use case** is ITHACA itself: an autonomous capital-protection agent that consumes graphscout to sense on-chain risk live and decide where money is safe. Lead with the reusable tooling; then show the agent that proves it does meaningful work.

The raw Subgraph MCP hands an agent a firehose — discover the subgraph, read a ~20K-token schema, hand-write GraphQL, then *become a DeFi analyst* to interpret raw rows. graphscout collapses that into one semantic call, `assess_risk({ protocol })`, returning a score, a `healthy/watch/elevated/critical` verdict, findings, and evidence. It derives what raw rows never state: utilization, liquidation-spike multiple, market concentration, and TVL trend.

## How we meet each requirement (point by point)

> **"The Graph must be load-bearing."**
It is the agent's only source of on-chain truth. graphscout has no other data feed; remove The Graph and ITHACA is blind. Risk sensing — the feature the entire product is built around — is graphscout reading The Graph.

> **"Consume LIVE data via a Graph provider (Subgraph Studio API key) — no mocks / static data."**
graphscout connects to The Graph's **official hosted Subgraph MCP** at `https://subgraphs.mcp.thegraph.com/sse`, authenticated with a real `GRAPH_API_KEY` issued from **Subgraph Studio**, and runs real GraphQL. **There are no mocks in graphscout.** The deployed app likewise reads The Graph live (hosted Subgraph MCP + Gateway GraphQL).

> **"Do meaningful work — reasoning / decisions / NL interface, not raw query printing."**
graphscout never prints raw rows. From live GraphQL it **derives** utilization, liquidation-spike multiple, market concentration, and TVL trend, then computes a **0–100 weighted risk score** and a **verdict** with supporting evidence. The autonomous agent then **acts on that decision** — it ranks markets and invests. And it is driven by a **voice / natural-language interface**: "Put my idle USDC to work" → ITHACA presents graphscout's ranked markets, picks the safest, and moves funds.

> **"Tooling must be REUSABLE infrastructure."**
graphscout is a standalone MCP server (`graphscout/src/index.ts`) exposing **8 tools**: `understand_protocol`, `identify_risk_factors`, `get_protocol_health`, `detect_anomalies`, `assess_risk`, `compare_protocols`, `search_protocols`, `inspect_schema`. Any MCP client can install it — the config for Claude Desktop / Cursor is in the README and `SKILL.md`. It is not welded to ITHACA; ITHACA is simply its first consumer.

> **"Open-source with README / SKILL.md."**
`graphscout/README.md` and `graphscout/SKILL.md` ship in the public repo, with install/config, tool reference, and the benchmark method.

> **"Public repo + 2–4 min demo video."**
Repo: https://github.com/chrsnikhil/ithaca · Demo video: _TBD_.

## The benchmark (state it honestly)
Reproducible via `graphscout/src/benchmark.ts` with a `GRAPH_API_KEY` (`graphscout/BENCHMARK.md`), comparing the raw Subgraph-MCP path against graphscout:

| | Raw Subgraph MCP | graphscout | Win |
|---|---|---|---|
| Tokens the model must read (Aave) | ~23,400 | ~203 | ~115× fewer |
| Tokens the model must read (Compound) | ~16,400 | ~204 | ~81× fewer |
| **Average token load** | — | — | **~98× fewer** |
| Agent round-trips per decision | 3 | 1 | 3× fewer |
| Output | raw rows | score + verdict + evidence | decision-ready |

**Honesty note for judges:** these numbers are computed **live** against live subgraph schema sizes, so they drift slightly run-to-run. The claim is the **method and the order of magnitude** (~98× average token reduction, 3→1 round-trips, and a decision-ready verdict the raw path never produces), not any exact integer.

---

## Paste-ready form text

**Project name:** ITHACA

**Short description:**
> ITHACA is a voice-first, self-custodial autonomous capital protector. Its intelligence layer, graphscout, is a reusable open-source MCP server that reads The Graph live and turns a ~20K-token subgraph firehose into one decision-ready risk verdict. The ITHACA agent consumes it to sense DeFi risk and autonomously move USDC to safety.

**How does this project use The Graph? / What did you build:**
> graphscout is a standalone MCP server (8 tools) that connects to The Graph's official hosted Subgraph MCP at subgraphs.mcp.thegraph.com/sse using a real Subgraph Studio GRAPH_API_KEY, runs live GraphQL, and derives utilization, liquidation-spike multiple, market concentration, and TVL trend into a 0–100 weighted risk score and a healthy/watch/elevated/critical verdict. No mocks. It is installable in Claude Desktop and Cursor as reusable infrastructure. ITHACA's autonomous daemon spawns graphscout as an MCP subprocess and calls assess_risk to rank markets before investing; the deployed app reads The Graph live with the same scoring method. Benchmark (reproducible via src/benchmark.ts): ~98x average token reduction vs the raw Subgraph MCP path and 3→1 round-trips, producing a verdict the raw path never yields.

**Repo:** https://github.com/chrsnikhil/ithaca
**Live app:** https://guardian-rho-two.vercel.app
**Demo video:** _TBD_

---

## Demo-video talking points (The Graph)
1. **Open with the pain:** show the raw Subgraph MCP dumping a ~20K-token schema — "an agent has to discover the subgraph, read this, hand-write GraphQL, then become a DeFi analyst just to get one answer."
2. **One call replaces all of it:** run `assess_risk({ protocol })` and show the decision-ready verdict — score, `healthy/watch/elevated/critical`, findings, evidence — derived from **live** GraphQL, not printed rows.
3. **Prove it's live:** show `GRAPH_API_KEY` from Subgraph Studio and the connection to `subgraphs.mcp.thegraph.com/sse`; say "no mocks — this is querying The Graph right now."
4. **Show it's reusable:** drop graphscout into Claude Desktop / Cursor from the README config and call a tool there — "this isn't buried in our app; any agent can install it."
5. **Run the benchmark live:** `npx tsx src/benchmark.ts` → ~98× fewer tokens, 3→1 round-trips. State honestly that the exact number drifts because it's measured live; the method is the win.
6. **Close on the use case:** by voice, "put my idle USDC to work" → ITHACA ranks Compound over Aave over Moonwell using graphscout and invests — the agent doing meaningful work on The Graph's data, verifiable on-chain.
