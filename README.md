# ITHACA

### The autonomous money that always comes home.

**ITHACA is a voice-first, self-custodial AI that grows your stablecoins across the best on-chain markets, and physically cannot lose them.** You talk to it, and it talks back. You sign one mandate on your Ledger, and that is the last thing you ever have to approve. From then on ITHACA senses risk in real time, deploys idle USDC into the safest paying market, rotates as conditions shift, and the instant danger hits it evacuates everything to a safe haven you approved, even fleeing cross-chain to Circle's Arc. The agent is boxed in by the contract itself, so a stolen key can annoy, **never steal**.

Built for **ETHOnline 2026** on three sponsors, **The Graph**, **Ledger**, and **Circle / Arc**, and live on-chain today.

<p>
  <b>LIVE:</b> <a href="https://guardian-rho-two.vercel.app">guardian-rho-two.vercel.app</a> &nbsp;·&nbsp;
  <b>Base Sepolia + Arc testnet</b> &nbsp;·&nbsp; <b>Self-custodial</b> &nbsp;·&nbsp; <b>Voice-controlled</b>
</p>

---

## Why ITHACA

In 2026 every wallet drowns you in data and every AI agent got a wallet, but none of them got brakes. Spend limits live in software and can be bypassed, so one hallucination or one leaked key and the money is gone. ITHACA is the safety layer nobody else shipped: a protection-first, state-aware, on-chain-enforced autonomous agent. Every other agent wallet is a gas pedal with a speed limiter. ITHACA is the first one with a nervous system and real brakes.

- **SEE.** It reads live on-chain risk through The Graph, through graphscout, our own intelligence layer.
- **HEAR.** You run the entire thing by voice. No dashboard, no buttons, no menus.
- **BOUND.** One Ledger-signed EIP-712 mandate defines exactly what the agent may ever do.
- **ACT and PROTECT.** It deploys, rotates, and evacuates on its own inside those bounds, 24/7, hands-off.

---

## What we built

### 1. graphscout, the intelligence layer on The Graph  ·  `/graphscout`
The raw Subgraph MCP hands an agent a firehose. It has to discover the subgraph, read a 20,000-token schema, hand-write GraphQL, then turn itself into a DeFi analyst just to make sense of the rows. graphscout collapses all of that into a single call, `assess_risk({ protocol })`, and hands back a decision-ready verdict: a score, a healthy / watch / elevated / critical rating, findings, and evidence. It derives what raw rows never say out loud, like utilization, liquidation spikes, market concentration, and TVL trend.

Benchmarked live against the raw Subgraph MCP (`graphscout/BENCHMARK.md`, reproducible via `src/benchmark.ts`):

| | Raw Subgraph MCP | graphscout | Win |
|---|---|---|---|
| Tokens the model reads (Aave) | ~23,400 | **~203** | **115x fewer** |
| Tokens the model reads (Compound) | ~16,400 | **~204** | **81x fewer** |
| Average token load | full firehose | **one verdict** | **~98x fewer** |
| Round-trips per decision | 3+ | **1** | **3x fewer** |
| Output | raw rows | **score + verdict + evidence** | decision-ready |

About 98x fewer tokens, one round-trip instead of three, and a verdict the raw path simply never produces. That is exactly what lets a voice agent answer in a beat instead of an awkward pause. graphscout also ships as a standalone MCP server, so any agent in Claude or Cursor can install it and get the same superpower.

### 2. Voice, the control layer  ·  `/guardian`
You do not click ITHACA, you talk to it. The whole interface is a full voice pipeline: Gemini Live for speech in, reasoning, and speech back, wired into an ElevenLabs interface with a live orb and waveform so you can watch it listen and think. Say "put my idle USDC to work" and it shows you graphscout's ranked markets, picks the safest, and moves the money. Say "get me out" and it runs. Face ID gates the arm. No forms, no buttons, no menus, this is what an agent is supposed to feel like.

### 3. Ledger, the root of trust  ·  `/guardian-contracts`, `/ledger-broker`
Autonomy without a hardware anchor is a liability, so ITHACA makes the Ledger the root of trust.
- **Sign once, act forever inside the bounds.** One EIP-712 `Policy{investCap, protectCap, safeHaven, expiry}` signed on the Flex authorizes the entire autonomous policy. The agent gets a scoped, disposable, revocable hot key that only ever works inside that boundary, re-verified on-chain on every single action.
- **Hybrid authority.** Routine invest, rotate, and protect run on their own within the signed caps. A high-risk, out-of-bounds evacuation needs a fresh single-use Flex approval in the moment (`approveAndProtect`, a single-use on-chain `Escalation`).
- **USB and Bluetooth signing** through the Ledger Device Management Kit (WebHID and Web-BLE), with Face ID as a second factor.
- **A capability broker on the Ledger Key Ring** (`/ledger-broker`): the agent's key lives in the device-rooted Key Ring and the agent only ever receives scoped capabilities, never the raw key, with software enrollment for hosts that have no USB port.

### 4. Circle / Arc, the safe harbor  ·  `/guardian-contracts`
When a whole chain turns into the risk, ITHACA does not just retreat, it flees cross-chain to Arc, Circle's stablecoin L1.
- The same Flex-owned autonomous vault is deployed and live on Arc testnet.
- **A full CCTP V2 round trip, proven end to end.** Burn on Base, Circle IRIS attestation, mint on Arc. Both transactions are on-chain and linked below.
- **USYC-ready.** The vault is venue-agnostic, so on Arc mainnet the yield venue becomes Circle's USYC (tokenized T-bills) with no contract rewrite.
- USDC-native from end to end.

---

## Live and verifiable

Everything here is real and on-chain. Go check every move yourself.

| | |
|---|---|
| **Live app** | https://guardian-rho-two.vercel.app |
| **Base vault** (Flex-owned, multi-market) | `0x81AEbF68946D62FDf088579A6F6F2c587015e28A` |
| **Base autonomous invest tx** | `0x15558852a1a59a6ff24f1fca4d80e5ad0a936fc6bd8efd0f5ce7da1f54df6e9d` |
| **Arc vault** (Flex-owned) | `0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808` |
| **Arc autonomous invest tx** (Flex-signed, on the Flex-owned vault) | `0x39708f75f31ff36976ab7a983a16136a8f7d5b9ed8a724014baccec4a6455b4d` |
| **CCTP burn on Base** | `0x285c2773761185853fcd5113cb62a6a804a939fcae34246cd79267ee4da890ce` |
| **CCTP mint on Arc** (round trip complete) | `0x4ca0230462fbb86c19e6d1d8b6556e1bdcc75f9da7fbd0433d860d54df12951f` |
| **Ledger Flex owner** (root of trust) | `0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da` |
| **Agent** (bounded executor) | `0x975Bb943F18fe44333eF28D18865ca5A5D63c23D` |

Explorers: [Base Sepolia](https://sepolia.basescan.org) · [Arc testnet](https://testnet.arcscan.app)

---

## Demo

**Try it live.** Open [guardian-rho-two.vercel.app](https://guardian-rho-two.vercel.app) in desktop Chrome or Edge, arm on your Ledger over USB or Bluetooth with Face ID, then watch ITHACA read the markets, deploy into the safest one, and evacuate on danger, verifying every move on-chain.

**The walkthrough.** A self-contained cinematic deck of the whole story lives in [`guardian-demo/`](guardian-demo), 11 scenes, a procedural voxel world, one offline file.
- **Watch:** open `guardian-demo/index.html` in Chrome. Arrow keys or `1`-`0` to navigate, `N` for presenter notes, `T` for the rehearsal timer, `F` for fullscreen, `P` for a live FPS meter.
- **Record:** open `guardian-demo/index.html?auto=1&chrome=0`, press `F`, and screen-record. It auto-plays all 11 scenes and rests on the close.

**Demo video:** included with our ETHOnline 2026 submission.

---

## The security model, a stolen key cannot steal

The entire design rests on one idea: the agent key is deliberately low-privilege. Steal it, and here is the complete list of what you can do with it.

| Agent can call | What it does | Can it steal? |
|---|---|---|
| `invest(policy, sig, venue, amount)` | deploy, needs a Flex-signed policy, an allowlisted venue, at or under the cap | No |
| `deRisk(venue, amount)` | pull funds back into the owner's own vault | No |
| `rebalance(from, to, amount)` | move only between allowlisted venues | No |
| `protect(policy, sig, amount)` | evacuate only to the Flex-approved safe haven | No |
| `ownerWithdraw(amount, to)` | send anywhere | Blocked, `onlyOwner` |

A fully compromised agent key cannot send a single dollar to an attacker. Every fund-exit path needs a signature only the Ledger can produce, to an address only the Ledger already approved. The Ledger revokes or rotates the agent whenever it wants, and the mandate auto-expires. The one key that actually matters never leaves the device.

---

## Architecture

- **Serverless and self-custodial.** The mandate lives in your browser, and the deployed app arms and acts on its own through API routes with no central daemon. The signature is the capability, and the on-chain contract re-verifies every action.
- **On-chain enforcement.** `GuardianVaultMulti` (Solidity, 26 passing tests) enforces the caps, the venue allowlist, the safe-haven allowlist, single-use escalations, and expiry, all in the same transaction as the action itself.
- **Multi-chain.** Deployed and live on Base Sepolia and Arc testnet, ready for Arc mainnet.

```mermaid
flowchart LR
  U([You]):::u -->|voice| A
  G["graphscout · The Graph<br/>live risk, ~98x fewer tokens"]:::scout -->|decision-ready verdict| A
  L["Ledger Flex<br/>root of trust"]:::ledger -->|sign once · EIP-712 mandate| V
  A["ITHACA agent<br/>bounded, disposable key"]:::agent -->|invest / rotate / protect<br/>within the mandate| V
  V["GuardianVault<br/>on-chain enforcement<br/>Base + Arc"]:::vault -->|caps + venue allowlist| M[("Markets<br/>Aave · Compound · Moonwell")]
  V -->|danger: evacuate| H[["Safe haven"]]
  V -->|CCTP cross-chain| ARC[["Arc · USYC<br/>safe harbor"]]:::circle
  classDef u fill:#0b0f12,stroke:#35E0FF,color:#fff
  classDef agent fill:#0b0f12,stroke:#4C6FFF,color:#fff
  classDef scout fill:#0b0f12,stroke:#35E0FF,color:#fff
  classDef ledger fill:#0b0f12,stroke:#fff,color:#fff
  classDef vault fill:#0b0f12,stroke:#35E0FF,color:#fff
  classDef circle fill:#0b0f12,stroke:#4C6FFF,color:#fff
```

*The Graph gives it eyes. Ledger gives it a conscience. Circle and Arc give it a safe harbor. Your voice runs all of it.*

## Repo map
| Dir | What |
|---|---|
| `guardian/` | The voice-first PWA (Next.js 16 / React 19). Arm, watch, verify. Deployed on Vercel. |
| `guardian-contracts/` | Solidity vaults (`GuardianVaultMulti`, `GuardVaultCCTP`), 26 tests, deploy scripts for Base and Arc. |
| `guardian-agent/` | The autonomous brain (sense, decide, act) plus the graphscout client and market picker. |
| `graphscout/` | The Graph intelligence layer, the MCP server, and the live benchmark. |
| `ledger-broker/` | The Ledger Key Ring capability broker (scoped signing, software enrollment for USB-less hosts). |
| `guardian-demo/` | The cinematic demo deck (single file, offline, 11 scenes, 120fps). |
| `submissions/` | The ETHOnline 2026 submission copy, per-prize answers, and the gap-closure runbook. |

> **Note:** ITHACA is the product name. Internal modules keep the project's working prefix `guardian-`.

## Run it
```bash
# The app (voice PWA)
cd guardian && npm install && npm run dev        # localhost:3000

# Contracts (Base + Arc)
cd guardian-contracts && npm install && npx hardhat test

# graphscout benchmark (reproduce the ~98x result)
cd graphscout && npm install && GRAPH_API_KEY=<key> npx tsx src/benchmark.ts

# Demo deck: open guardian-demo/index.html in Chrome
#   arrows to navigate, N presenter notes, T timer, F fullscreen, P FPS meter
```
Each module ships a `.env.example` listing the keys it needs.

---

**ITHACA. Talk to it once, sign once, and it grows your money and brings it home.**  ·  ETHOnline 2026 · The Graph × Ledger × Circle / Arc
