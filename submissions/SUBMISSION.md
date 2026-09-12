# ITHACA — ETHOnline 2026 Submission

> **Two housekeeping notes before you paste:**
> 1. **Demo video link is TBD** — Chris is recording it. Drop the URL into the `Demo video` fields across all four docs before submitting.
> 2. **Redeploy the app to Vercel** before final submission — a leftover "Sui" PayFlow overlay was just removed and the live build needs to be refreshed at https://guardian-rho-two.vercel.app.

---

## Project name
**ITHACA**

## Tagline
**Autonomous yield that always comes home. Sign once on your Ledger; a bounded AI grows your stablecoins and physically cannot lose them.**

## Short description (~50 words)
ITHACA is a voice-first, self-custodial, autonomous on-chain capital protector. You sign one mandate on a Ledger; after that an AI agent senses risk through The Graph, deploys idle USDC into the safest-paying market, rotates as conditions shift, and evacuates to a safe haven — even cross-chain to Arc — the instant danger hits. Every move is bounded on-chain, so a stolen agent key can annoy, never steal.

## Links
- **Live app:** https://guardian-rho-two.vercel.app
- **Public repo:** https://github.com/chrsnikhil/ithaca
- **Demo video:** _TBD — recording in progress_

---

## Full description

### What it does
Every wallet in 2026 drowns in data, and every AI agent finally got a wallet — but none got brakes. Spend limits live in software and are bypassable; one hallucination or one leaked key and the funds are gone. ITHACA is the missing safety layer: a protection-first, on-chain-enforced autonomous agent.

You **sign one mandate on a Ledger** — an EIP-712 `Policy` that says exactly how much may be invested, where funds may retreat to, and when the authority expires. After that, ITHACA runs hands-off:

- **SEES** — reads live on-chain risk through The Graph and ranks the safest-paying market.
- **ACTS** — deploys idle USDC into that market and rotates as conditions shift.
- **PROTECTS** — the instant danger hits, it evacuates everything to a safe haven you pre-approved, including fleeing cross-chain to Arc, Circle's stablecoin L1.

The agent is bounded on-chain: it holds only a scoped, disposable hot key. Steal that key and you still cannot send one dollar to an attacker — every fund-exit path requires a signature only the Ledger can produce, to an address only the Ledger approved. **A stolen key can annoy; it can never steal.**

You control all of it by voice. No dashboards, no buttons — you talk to ITHACA through a full Gemini Live voice pipeline.

### How it works
1. **Arm** — On desktop Chrome/Edge, connect a Ledger over USB (WebHID) or Bluetooth (Web-BLE). A WebAuthn platform authenticator (Face ID) gates the moment. The Ledger signs the EIP-712 `Policy` on path `44'/60'/0'/0/0`; the app verifies the recovered signer equals the Flex owner. The private key never leaves the device and the server never sees it.
2. **Sense** — ITHACA reads live DeFi state through The Graph and derives a risk verdict (utilization, liquidation-spike multiple, market concentration, TVL trend → a 0–100 weighted score with a `healthy / watch / elevated / critical` verdict). This is the `graphscout` method.
3. **Act** — Within the signed caps, the bounded agent invests, rotates, and de-risks autonomously. Every action is re-verified on-chain by the vault contract in the same transaction.
4. **Protect** — On danger inside the mandate's bounds it evacuates to the approved safe haven. For a high-risk, out-of-bounds evacuation it requires a **fresh, single-use escalation** signed on the Ledger in the moment (`approveAndProtect`, single-use on-chain) — human-in-the-loop exactly where it matters.
5. **Flee cross-chain** — When Base itself is the risk, ITHACA burns USDC via CCTP V2 and sends it to Arc.

---

## How it's made

### Stack
- **Frontend / app:** Next.js 16, React 19, PWA. `guardian/`
- **Voice:** Gemini Live (STT + LLM + TTS), push-to-talk, built on the ElevenLabs UI kit (orb + live waveform + conversation). three.js avatars.
- **Agent runtime:** Node autonomous daemon (`guardian-agent/`) — sense → decide → act loop, market picker (`picker.js`), graphscout client.
- **Intelligence layer:** `graphscout/` — a TypeScript MCP server (`@modelcontextprotocol/sdk`) over The Graph.
- **Contracts:** Solidity 0.8.24, Hardhat, OpenZeppelin 5.6.1. **26 passing tests.** `guardian-contracts/`
- **Cross-chain:** Circle CCTP V2 (`ITokenMessengerV2.depositForBurn`).
- **Hardware root of trust:** Ledger Device Management Kit (`@ledgerhq/device-management-kit` + `device-signer-kit-ethereum` + `device-management-kit-transport-web-hid` + `-web-ble`). Capability broker in `ledger-broker/`.
- **Chain access:** ethers v6.

### Architecture
```
          voice (Gemini Live)
               │
   You ───────▶│
               ▼
   ┌───────────────────────────┐        ┌──────────────────────────────┐
   │ ITHACA agent               │        │ The Graph (LIVE)             │
   │ (bounded, disposable key)  │◀──────▶│ graphscout MCP server        │
   │  guardian-agent/           │ assess │  → hosted Subgraph MCP + SSE │
   └───────────────────────────┘  _risk │  → real GraphQL, derived risk │
               │                          └──────────────────────────────┘
   sign once   │ invest / rotate / deRisk / protect  (within mandate)
   EIP-712     ▼
 ┌─────────┐  ┌──────────────────────────────┐        ┌──────────────────┐
 │ Ledger  │─▶│ GuardianVaultMulti (Solidity)│        │ Markets          │
 │ Flex    │  │ on-chain enforcement:        │───────▶│ (allowlisted     │
 │ (root)  │  │ caps · venue allowlist ·     │        │  yield venues)   │
 └─────────┘  │ safe-haven allowlist ·       │        └──────────────────┘
    ▲ fresh   │ expiry · single-use escalate │
    │ single- │ Base 84532 + Arc 5042002     │──danger──▶ Safe haven
    │ use     └──────────────────────────────┘
    │ escalation                │
    └───────────────────────────┤ CCTP V2 burn (GuardVaultCCTP)
                                 ▼
                        Arc — cross-chain safe harbor
```

*The Graph gives it eyes · Ledger gives it a conscience · Circle/Arc gives it a safe harbor.*

### The three subsystems, precisely
- **graphscout (The Graph intelligence layer).** A real MCP server (`graphscout/src/index.ts`) exposing 8 tools: `understand_protocol`, `identify_risk_factors`, `get_protocol_health`, `detect_anomalies`, `assess_risk`, `compare_protocols`, `search_protocols`, `inspect_schema`. It connects to **The Graph's official hosted Subgraph MCP** at `https://subgraphs.mcp.thegraph.com/sse`, authenticated with a real `GRAPH_API_KEY` from Subgraph Studio, runs real GraphQL, and derives a decision-ready risk verdict. **No mocks.** The autonomous daemon spawns graphscout as an MCP subprocess and calls `assess_risk` to rank markets (`guardian-agent/picker.js`). It is reusable infrastructure — installable in Claude Desktop / Cursor — not a single-app feature.
- **Ledger (root of trust).** DMK signing over both WebHID (USB) and Web-BLE (Bluetooth), verifying the recovered signer equals the Flex owner. The `ledger-broker/` capability broker owns the fund-moving key in-process and exposes exactly one scoped HTTP capability — sign only `invest`/`deRisk`/`protect`, only to the configured vault, and it never returns the raw key; token-gated and audited (4 passing unit tests).
- **Circle / Arc (safe harbor).** `GuardVaultCCTP` performs a real CCTP V2 `depositForBurn` with `destinationDomain = 26` (Arc). The same vault design is deployed on Arc testnet. USDC-native throughout.

---

## Verified on-chain facts (all real, all testable)

**Networks:** Base Sepolia (chain ID **84532**) + Arc testnet (chain ID **5042002**).

| Item | Address / hash | Network | Explorer |
|---|---|---|---|
| **Ledger Flex owner** (root of trust) | `0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da` | — | — |
| **Bounded agent** (executor) | `0x975Bb943F18fe44333eF28D18865ca5A5D63c23D` | — | — |
| **GuardianVaultMulti** | `0x81AEbF68946D62FDf088579A6F6F2c587015e28A` | Base Sepolia | [basescan](https://sepolia.basescan.org) |
| **GuardianVaultMulti** | `0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808` | Arc testnet | [arcscan](https://testnet.arcscan.app) |
| **GuardVaultCCTP** | `0xbEa47f1B7C1252EB2a7C758b27f28ea35ae6c193` | Base Sepolia | [basescan](https://sepolia.basescan.org) |
| **Base autonomous invest tx** (agent → Base multi-vault) | `0x15558852a1a59a6ff24f1fca4d80e5ad0a936fc6bd8efd0f5ce7da1f54df6e9d` | Base Sepolia | [basescan](https://sepolia.basescan.org) |
| **Arc autonomous invest tx** (agent → an Arc vault it operates) | `0xbd3df971d5043df3ca8523cc128dcab95402296600a94098e5a4d1d0dd08932d` | Arc testnet | [arcscan](https://testnet.arcscan.app) |

Both autonomous invest transactions were verified via RPC: status **success**, `from` = the bounded agent `0x975Bb9…`.

### The security model (why a stolen key can't steal)
`GuardianVaultMulti` enforces, in the same transaction as every action: an EIP-712 `Policy{investCap, protectCap, safeHaven, expiry, nonce}`, a **venue allowlist**, a **safe-haven allowlist**, a **point-in-time invest cap**, an **expiry**, and a **single-use escalation**. `ownerWithdraw` is `onlyOwner`.

| Agent can call | What it does | Can it steal? |
|---|---|---|
| `invest(policy, sig, venue, amount)` | deploy — needs a Flex-signed policy, allowlisted venue, ≤ cap | No |
| `deRisk(venue, amount)` | pull funds back into the owner's vault | No |
| `rebalance(from, to, amount)` | move between allowlisted venues only | No |
| `protect(policy, sig, amount)` | evacuate — only to the Flex-approved safe haven | No |
| `ownerWithdraw(amount, to)` | send anywhere | No — `onlyOwner` |

---

## Prizes targeted
1. **The Graph — "Best AI Tooling or AI Use Case with The Graph (From Scratch)"** ($5,000). See `the-graph.md`.
2. **Ledger — "AI Agents x Ledger"** ($3,500). See `ledger.md`.
3. **Circle / Arc — "Best DeFi / Onchain Finance Application"** ($3,500; +$2,500 stretch if the same project is on Arc **mainnet** by Sep 30). Secondary fit: "Best Agentic Economy Application with Circle Agent Stack" (noted as secondary — ITHACA does **not** use Circle's Agent Stack product). See `arc.md`.

---

## Honest scope (read before demoing)
We lead with what is tested and verified. These are stated precisely so judges who test claims find them true:
- **The Graph:** the graphscout **MCP server** is invoked by the autonomous daemon. The deployed Vercel app reads The Graph **live** (hosted Subgraph MCP + Gateway GraphQL) and ranks markets with graphscout's **same scoring method** — it does not itself spawn the MCP server. Benchmark numbers are computed **live** against live schema sizes, so they drift slightly run-to-run; the method (~98× average token reduction, 3→1 round-trips, a verdict the raw path never produces), not the exact integer, is the claim.
- **CCTP:** full round trip proven on-chain. USDC burned on Base (`0x285c2773…`), attested by Circle IRIS, minted on Arc (`0x4ca0230462fbb86c19e6d1d8b6556e1bdcc75f9da7fbd0433d860d54df12951f`). Real USDC crossed Base to Arc, end to end.
- **Arc invest:** the verified Arc autonomous invest ran on an **agent-operated** vault on Arc. The **Flex-owned** Arc vault `0x67ef85…` is deployed. We do not imply the verified invest went through the Flex-owned vault.
- **Yield venues:** on testnet the venues are `MockYieldVenue` stand-ins. **USYC** (tokenized T-bills) is the Arc-**mainnet** roadmap via the venue-agnostic interface — labeled roadmap, not shipped.
- **Ledger Key Ring:** the capability broker runs on the live `wallet-cli ring` backend. The agent key is encrypted under the device-rooted Key Ring and decrypted through the Ledger to sign scoped actions, proven on-device. USB-less enrollment (LKRP software-signed `addMember`) is implemented on the same trustchain.
- **No x402.** There is no x402 payment flow in ITHACA; we do not claim one.
