# ITHACA → Circle / Arc

## Prize
**Best DeFi / Onchain Finance Application** — **$3,500** (primary target).
**+ $2,500 stretch** if the *same* project is deployed to **Arc mainnet by Sep 30** (noted below as a stretch goal, not yet done).
**Secondary fit:** "Best Agentic Economy Application with Circle Agent Stack" — ITHACA is an autonomous agent that holds a wallet, manages risk, and settles in USDC. **Honest caveat: ITHACA does not use Circle's Agent Stack product**, so we target DeFi / Onchain Finance as the primary prize and mention the agentic-economy angle only as a thematic fit.

## The pitch
ITHACA is stablecoin-native onchain finance with a safety reflex. It's a self-custodial treasury that autonomously deploys idle **USDC** into yield, rotates as risk shifts, and — when a chain itself becomes the risk — **flees cross-chain to Arc**, Circle's stablecoin L1, over CCTP V2. The whole invest → rotate → protect → evacuate lifecycle is advanced programmable money: multi-step, on-chain-automated settlement, bounded by a hardware-signed mandate. This is what "treasury that protects itself" looks like on Arc.

## How we meet each requirement (point by point)

> **"Stablecoin-native DeFi on Arc (yield / treasury / payments / etc.)."**
ITHACA is a self-custodial **USDC treasury** with autonomous yield deployment and protection. The same `GuardianVaultMulti` design is **deployed on Arc testnet** (`0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808`). USDC is the unit of account throughout.

> **"Meaningful Arc + USDC use."**
A **Flex-signed autonomous invest is verified on Arc** (`0x39708f75f31ff36976ab7a983a16136a8f7d5b9ed8a724014baccec4a6455b4d`, status success, `from` = bounded agent `0x975Bb9…`) on the **Flex-owned** Arc vault `0x67ef85…`. The owner signed the Policy on the Ledger Flex, and the agent deployed USDC into an allowlisted Arc venue, bounded by that signature and re-checked on-chain.

> **"Advanced programmable money flows — onchain automation, multi-step settlement."**
The agent runs a full autonomous lifecycle bounded on-chain: **invest** (deploy USDC into an allowlisted venue ≤ cap), **rebalance/rotate** (move between allowlisted venues as risk shifts), **deRisk** (pull funds back to the vault), **protect** (evacuate to the Flex-approved safe haven), and **cross-chain evacuation** via CCTP V2. Every step is re-verified on-chain in the same transaction against caps, allowlists, and expiry.

> **"Functional MVP + architecture diagram."**
Functional MVP is live at https://guardian-rho-two.vercel.app with verifiable on-chain transactions on Base and Arc. Architecture diagram below and in `SUBMISSION.md`.

> **"Video demonstration + presentation + GitHub repo."**
Repo: https://github.com/chrsnikhil/ithaca · Demo video: _TBD_ · a cinematic presentation deck ships in `guardian-demo/`.

## Cross-chain rescue (CCTP V2) — stated precisely
`GuardVaultCCTP` (Base Sepolia `0xbEa47f1B7C1252EB2a7C758b27f28ea35ae6c193`) calls the real CCTP V2 `ITokenMessengerV2.depositForBurn` with `destinationDomain = 26` (Arc), and its `rescue()` is Flex-mandate-bounded. The full round trip is proven on-chain: USDC burned on Base (`0x285c2773761185853fcd5113cb62a6a804a939fcae34246cd79267ee4da890ce`), attested by Circle IRIS, then minted on Arc (`0x4ca0230462fbb86c19e6d1d8b6556e1bdcc75f9da7fbd0433d860d54df12951f`). Real USDC crossed Base to Arc, end to end.

## Yield venue — USYC is roadmap, labeled as such
On testnet the yield venues are `MockYieldVenue` stand-ins. Because the vault is **venue-agnostic**, on **Arc mainnet** the yield venue swaps to Circle's **USYC** (tokenized T-bills) through the same interface with no contract rewrite. **USYC is roadmap, not shipped** — do not read the testnet mocks as USYC.

## Architecture diagram
```
                       voice (Gemini Live)
                            │
      You ─────────────────▶│  sign once (Ledger Flex, EIP-712)
                            ▼
              ┌───────────────────────────┐
              │ ITHACA agent (bounded key) │──── senses risk via The Graph
              └───────────────────────────┘
                            │ invest / rotate / deRisk / protect  (USDC)
             ┌──────────────┴───────────────┐
             ▼                               ▼
   ┌────────────────────┐          ┌────────────────────┐
   │ Base Sepolia        │  CCTP V2 │ Arc testnet         │
   │ GuardianVaultMulti  │  burn →  │ GuardianVaultMulti  │
   │ 0x81AEbF…           │═════════▶│ 0x67ef85… (Flex)    │
   │ GuardVaultCCTP      │ dstDomain│ + agent-op vault    │
   │ 0xbEa47f…           │  = 26    │ (verified invest)   │
   └────────────────────┘          └─────────┬──────────┘
        │ danger: evacuate                    │ yield venue (interface)
        ▼                                     ▼
   Safe haven (allowlisted)          testnet: MockYieldVenue
                                     mainnet roadmap: USYC (T-bills)
```

## Verified Arc / Circle facts
| Item | Value | Network | Explorer |
|---|---|---|---|
| GuardianVaultMulti (Flex-owned) | `0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808` | Arc testnet (5042002) | [arcscan](https://testnet.arcscan.app) |
| Arc autonomous invest tx (Flex-signed, Flex-owned vault) | `0x39708f75f31ff36976ab7a983a16136a8f7d5b9ed8a724014baccec4a6455b4d` | Arc testnet | [arcscan](https://testnet.arcscan.app) |
| GuardVaultCCTP (burn side) | `0xbEa47f1B7C1252EB2a7C758b27f28ea35ae6c193` | Base Sepolia (84532) | [basescan](https://sepolia.basescan.org) |
| GuardianVaultMulti | `0x81AEbF68946D62FDf088579A6F6F2c587015e28A` | Base Sepolia | [basescan](https://sepolia.basescan.org) |

## Stretch: Arc mainnet by Sep 30 (+$2,500)
The vault is venue-agnostic and already deployed to Arc testnet; the stretch is a same-project **Arc mainnet** deployment with the USYC venue wired through the existing interface before Sep 30. Tracked as a stretch goal — not claimed as done.

---

## Paste-ready form text

**Project name:** ITHACA

**Short description:**
> ITHACA is a self-custodial USDC treasury that autonomously earns yield and protects itself. It deploys idle USDC into the safest-paying market, rotates as risk shifts, and — when a chain itself becomes the risk — flees cross-chain to Arc over CCTP V2. Every step is bounded on-chain by a Ledger-signed mandate.

**How does this project use Arc / Circle / USDC:**
> ITHACA is stablecoin-native onchain finance on Arc. GuardianVaultMulti is deployed on Arc testnet (0x67ef85…, Flex-owned), and a Flex-signed autonomous USDC invest is verified on Arc (tx 0x39708f75…, from the bounded agent, on testnet.arcscan.app): the owner signed the Policy on the Ledger Flex and the agent deployed USDC into an allowlisted venue, bounded on-chain. Cross-chain rescue uses CCTP V2: GuardVaultCCTP on Base calls ITokenMessengerV2.depositForBurn with destinationDomain 26 (Arc), and the full round trip is proven, burned on Base (0x285c2773…) and minted on Arc (0x4ca02304…). The agent runs advanced programmable money flows, multi-step on-chain-automated settlement across invest, rotate, deRisk, protect, and cross-chain evacuation, all bounded by caps, venue and safe-haven allowlists, and expiry (26 passing contract tests). On Arc mainnet the yield venue becomes Circle's USYC (tokenized T-bills) through the venue-agnostic interface. USDC is the unit of account throughout.

**Repo:** https://github.com/chrsnikhil/ithaca
**Live app:** https://guardian-rho-two.vercel.app
**Demo video:** _TBD_

---

## Demo-video talking points (Circle / Arc)
1. **Frame it as treasury protection:** "a self-custodial USDC treasury that earns yield and, when a chain becomes the risk, evacuates itself cross-chain to Arc."
2. **Show the Arc deployment + Flex-signed invest:** open `testnet.arcscan.app`, show the Flex-owned Arc vault `0x67ef85…` and the Flex-signed autonomous invest tx `0x39708f…`. Say it plainly: the owner signed the Policy on the Flex, the agent deployed USDC, every step bounded on-chain.
3. **Walk the multi-step money flow:** invest → rotate to a safer venue → deRisk → protect, and show each is re-checked on-chain against caps and allowlists — "programmable money with brakes."
4. **CCTP cross-chain rescue:** show the burn on Base (`GuardVaultCCTP` `0xbEa47f…`, `depositForBurn`, `destinationDomain 26`) on basescan, then show the matching mint on Arc (`0x4ca02304…`) on arcscan. Real USDC crossed Base to Arc over CCTP V2, a full verified round trip.
5. **USYC as the mainnet payoff:** "testnet venues are mocks; because the vault is venue-agnostic, Arc mainnet swaps in Circle's USYC — tokenized T-bills — for real yield with no contract rewrite. That's the roadmap."
6. **Close on the stretch + honesty:** "primary target is Best DeFi/Onchain Finance; the +$2,500 stretch is the same project on Arc mainnet by Sep 30. It also fits the agentic-economy theme, though we don't use Circle's Agent Stack product."
