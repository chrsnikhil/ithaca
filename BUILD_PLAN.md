# Guardian — Build Plan (ETHOnline 2026)

*Solo dev · ~8 working days · event ends Sept 16 (Arc mainnet also Sept 16; Arc track allows mainnet by Sept 30).*
Grounded in per-sponsor implementation research + an adversarial red-team. Companion doc: `SPONSOR_PAINPOINT.md`.

## What Guardian is
A consumer, self-custodial **defensive agent wallet** — an autonomous on-chain guardian (clay avatar + voice, already built as a Next.js PWA) that watches your DeFi positions, and when one is in danger, **moves your money to safety within bounds you pre-signed on your Ledger** — the "3am save while you sleep."

## The intent model (the unlock)
You sign a scoped **EIP-712 mandate** on the Ledger Flex **once**: *"rescue ≤ $X to Arc safe-haven when danger; agent may act autonomously within these bounds."* The agent then executes **autonomously within the mandate** (no per-tx tap → autonomy preserved). Anything **outside** the mandate (e.g., full evacuation) requires a **fresh Flex tap**. The on-chain guard enforces the bounds you signed — so you don't have to trust the agent, only the mandate (this also patches the "trust-me, the brain is off-chain" critique).

## Stack — Graph + Circle/Arc + Ledger (Chainlink = stretch)

| Layer | Sponsor | Implementation |
|---|---|---|
| **SEE** | The Graph | Backend polls **Token API** (balances/prices/OHLC, live/finalized) + queries an **Aave subgraph via Subgraph MCP** for health factor. Danger = drawdown >5% / depeg >0.5% / HF <1.1. Log every MCP tool call to a visible "Graph activity feed" (proves load-bearing). **Live data only — mocked data disqualifies.** |
| **THINK** | *(our own risk logic)* | Off-chain risk brain decides rescue/hold — **bounded by the Flex-signed mandate** so trust is minimized (the guard only permits what the mandate authorized). No third-party dependency. |
| **AUTHORIZE** | Ledger | **Flex signs the EIP-712 mandate** via the **Device Management Kit** (`@ledgerhq/device-management-kit` + `device-transport-kit-web-hid` + `device-signer-kit-ethereum` — NOT legacy `hw-app-eth`, being sunset): `signerEth.signTypedData(mandate)` → Flex tap → guard `ecrecover`s. **Key Ring** (`@ledgerhq/wallet-cli` → `ring init` once w/ Flex, then `ring encrypt/decrypt` headless) encrypts the agent's operational secret — the track's named "secrets that can't leak" requirement. Author an **ERC-7730 descriptor** for the `Mandate` struct + preview locally (Ledger `erc7730` CLI, no registry PR) so the **Trusted Display shows the readable mandate** = on-camera money-shot. **~2 days, fully real (no mocking).** |
| **GUARD** *(weakest link — build first)* | *(ZeroDev / ERC-7579, infra)* | Smart account holds funds; a **session-key permission validator + mandate/attestation check**. Agent may only call `rescue()` → safe-haven allowlist, within mandate caps. Out-of-bounds/unsigned → **reverts on-chain** (the demo money-shot). **Deploy the guard ON Arc** (so Arc hosts the product, not just the destination). |
| **ACT** | Circle / Arc | Rescue: Aave `withdraw()` → **CCTP V2** burn → **IRIS** attestation → mint on **Arc** → deposit safe vault → **verifiable receipt**. Arc = safe harbor (USDC-native gas). |
| **FACE** | (built) | Clay-guardian PWA + voice narrates; shows the Graph feed, the revert, the rescue, the receipt, the Flex tap. |

**Signing architecture:** funds in a smart account (owner = **Ledger**, which signs the mandate); agent = a **session key** bounded by the on-chain validator + the Ledger-signed mandate. Self-custodial + autonomous + hardware-rooted authority.

## The single rescue path (per red-team — don't build more)
Aave USDC supply on **Base Sepolia** → Graph detects HF danger → guard checks the Ledger mandate → `withdraw()` → **CCTP V2** (`depositForBurnWithHook`, **destDomain 26**, V2 selector `0x8e0250ee`, test `minFinalityThreshold` 1000 **and** 2000 on day 1) → IRIS poll → `receiveMessage` on **Arc** → deposit safe vault (**two-tx fallback, skip the atomic hook** — lower risk) → receipt. Say: *"v1 supports Aave; the guard is protocol-agnostic."*

## Demo money-shots
1. **Danger dial** — crash a mock market live (stated plainly; only the *trigger* is mocked, data is real).
2. Guardian detects (Graph feed lights up) → decides.
3. **A bypass/out-of-bounds attempt REVERTS on-chain** — "watch it refuse to move your money outside what you signed." *The revert IS the product.*
4. In-bounds rescue runs **autonomously** → USDC lands on Arc → **verifiable receipt**.
5. Big evacuation → **physical tap on the Flex** (Trusted Display shows the amount).
6. Clay guardian narrates throughout.

## 8-day sequence (guard-first; Arc deadline-gated)
- **Day 0 (today):** ✅ Flex in-hand + set up; ✅ Arc testnet RPC live (chainId 5042002). Get keys: The Graph Market (Token API + MCP gateway key), Arc testnet faucet (`faucet.circle.com`), Base Sepolia. Confirm toolchain (Foundry). 
- **Day 1:** **Guard spike** (ZeroDev smart account + session-key validator + EIP-712 mandate check) — the weakest link, start here. Arc hello-world deploy (RPC `rpc.testnet.arc.io`, chainId **5042002**, explorer `testnet.arcscan.app`, confirm USDC-as-gas). Test CCTP `minFinalityThreshold` live.
- **Day 2:** Finish guard: `rescue()` → safe-haven allowlist, enforce mandate caps, **revert on out-of-bounds**. Deploy guard + safe vault **on Arc testnet**.
- **Day 3:** SEE layer — Token API polling + Subgraph MCP Aave HF query + danger detection + "Graph activity feed" UI. Stand up an Aave USDC position on Base Sepolia + the danger dial.
- **Day 4:** THINK + AUTHORIZE — brain decision → server-signed EIP-712 attestation; **Flex signs the mandate** (Ledger Device Management Kit / WebHID). Wire guard to accept mandate + attestation.
- **Day 5:** ACT — full rescue: Aave withdraw → CCTP burn (domain 26) → IRIS poll → mint on Arc → deposit vault (two-tx) → receipt. End-to-end autonomous rescue working.
- **Day 6:** Wire into the clay-guardian PWA (existing app): Graph feed, danger dial, rescue, receipt, Flex tap for big-move. Agentic-Economy extras: **ERC-8004** registration + a thin **x402** nanopayment (pay the risk oracle) on Arc.
- **Day 7:** Polish + harden: Ledger Key Ring secret, ERC-7730 clear-signing descriptor, demo hardening.
- **Day 8:** Record **backup demo video** (production build over **Pinggy** — dev server dies over tunnels). Rehearse revert + rescue + Flex tap twice. Write submission READMEs (Arc mainnet-migration steps; what's confidential; live-vs-mock disclosure).

## Real vs mock (honest)
- **Real:** Arc testnet deploy + USDC-gas, the guard + revert, Graph Token API + MCP (live), Aave position + withdraw, CCTP round-trip + IRIS receipt, Flex mandate signing (DMK) + Key Ring secret, ERC-8004 + x402.
- **Simplified/mocked:** the danger *trigger* (danger dial on a mock market — data itself stays live), atomic CCTP hook (two-tx fallback), Arc **mainnet** (be deployment-ready, swap config Sept 16, 1-day buffer), Substreams (use Token API instead).
- **Cut:** Guardian-as-an-MCP-server pillar, knowledge graph, multi-protocol, new voice engineering.

## Tracks (~$18k+ addressable, all genuine fits)
- **The Graph:** Best AI Use Case + Composable/Standardized (Token API + Subgraph MCP + live tool-call log).
- **Circle/Arc:** Launch on Arc→Mainnet ($3.5k) + Agentic Economy (ERC-8004 + x402 + autonomous USDC).
- **Ledger:** AI Agents x Ledger (hardware mandate signer via DMK + Key Ring) — **Flex confirmed in-hand.**

## Top gotchas (baked in)
- Arc CCTP **domain 26**; **dual USDC decimals** (18 native gas / 6 ERC-20) — silent math bugs; test `minFinalityThreshold` 1000 vs 2000 day 1; Arc mainnet RPC/chainId not yet published.
- Guard/session-key (ERC-7579) plumbing is fiddly → priority-1, day 1.
- Flex shipping to India → core stays hardware-free (mandate can fall back to a passkey/EOA signer); Ledger is the big-move tier + a bonus track, not a core dependency. **But Key Ring `ring init` needs the physical Flex once** — if it doesn't arrive, the Ledger track is off (core still demos via passkey mandate).
- **Ledger: WebHID = Chrome/Edge desktop only (NOT iOS Safari)** → "arm on the Flex" is a desktop step, the mobile PWA shows the autonomy (design the demo around it). Use the **Device Management Kit**, not legacy `hw-app-eth` (EIP-712 sunset). Track requires Agent Stack + **Key Ring CLI** specifically. Custom `Mandate` struct blind-signs unless you author+preview an **ERC-7730** descriptor.
- Demo over tunnel → production build + Pinggy + **backup video**.
- Never claim "first" anything — honest synthesis; rebuttals ready (DeFiSaver = single-dapp/trusted-executor; ZeroDev = "we compose ERC-7579"; incumbents = spend-first vs our defense-first).
