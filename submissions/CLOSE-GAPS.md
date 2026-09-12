# ITHACA — gap-closure runbook

Status of the four integrity gaps we set out to close for real.

| # | Gap | Status | Who |
|---|-----|--------|-----|
| 1 | Ledger broker wired to the wrong (single-market) vault | ✅ **CLOSED** | done in code |
| 2 | Verified Arc invest was on an agent-operated vault, not the Flex-owned Arc vault | ⏳ needs your Flex | you (optional) |
| 3 | CCTP round-trip not proven end-to-end | ✅ **CLOSED** (proven) | done |
| 4 | Ledger `wallet-cli ring` Key Ring backend | ✅ **CLOSED** (proven live on-device) | done |

Plus a credibility fix that's already done + deployed: the fake "confirmed on Sui" PayFlow overlay was removed from the app and the app was **redeployed to Vercel production**.

---

## ✅ #1 — Broker rewired to the multi-market vault (DONE)

`ledger-broker` now signs against **GuardianVaultMulti** (`0x81AEbF68946D62FDf088579A6F6F2c587015e28A`) with the correct multi-market ABI, and `rebalance` is now an in-scope capability:

- `src/broker.js`: `CAPABILITY_METHODS = {invest, deRisk, rebalance, protect}`; ABI = `invest(policy,sig,venue,amount)` / `deRisk(venue,amount)` / `rebalance(from,to,amount)` / `protect(policy,sig,amount)`.
- `.env.example`: `BROKER_VAULT` → the multi-vault.
- Tests updated to the new ABI + a rebalance case. **All 4 tests pass** (`cd ledger-broker && node --test test/broker.test.js`).

Nothing left to do here.

---

## ✅ #3 — CCTP round-trip proven end-to-end (DONE)

The Base burn `0x285c2773761185853fcd5113cb62a6a804a939fcae34246cd79267ee4da890ce` **was minted on Arc**. Proof: re-running `guardian-contracts/scripts/complete-mint.js` (which re-submits the same CCTP message to Arc's MessageTransmitterV2 `0xE737e5cE…`) reverts with **`"Nonce already used"`** — the destination has already consumed/minted this message. That is definitive on-chain proof of the full round trip.

- The submission docs (`arc.md`, `SUBMISSION.md`) now say "round-trip verified," not "burn proven / mint implemented."
- **Optional:** Arc testnet prunes historical logs, so the *exact* Arc mint tx can't be pulled with `eth_getLogs`. If you want the tx hash to cite, open **arcscan** → the agent address `0x975Bb943F18fe44333eF28D18865ca5A5D63c23D` (or the USDC recipient) and find the incoming CCTP mint of 3 USDC. Not required — the "Nonce already used" proof already stands.

---

## ✅ #4 — Ledger `wallet-cli ring` Key Ring backend (DONE, proven live on-device)

**Done Sept 13.** `wallet-cli ring init` was approved on the Flex (device-rooted trustchain `006e88b3…`), the agent key was encrypted under the Ledger Key Ring (`agent-key.enc`), and the broker booted on `SECRET_BACKEND=keyring`, decrypting the key through the Ledger to sign a scoped `deRisk` and correctly deny an out-of-scope `transfer`. The agent address recovered from the Key Ring is exactly `0x975Bb943…c23D`. A cross-platform fix was needed in `secret-store.js` so the `wallet-cli` `.cmd` shim resolves on Windows. Part B (USB-less LKRP enrollment) stays implemented-not-run because Ledger's own `@ledgerhq/ledger-key-ring-protocol` npm package currently 404s on a transitive dep, worth raising as feedback.

The original steps, for reference:

The code is written against the real Ledger SDKs; it has never been *run* because the SDKs aren't installed and the trustchain bootstrap needs the Flex once. Do this to turn it from "implemented" into "demonstrated" (this is the Ledger track's headline ask, so it's worth it).

**A. Prove the production Key Ring backend (agent key unleakable at rest):**
```bash
cd ledger-broker
npm i -g @ledgerhq/wallet-cli
wallet-cli ring init                                   # ONE-TIME — Flex attached, approve on device
printf '0xYOUR_AGENT_PRIVATE_KEY' > k.txt
wallet-cli ring encrypt -i k.txt -o agent-key.enc --key guardian-agent && rm k.txt
# .env:  SECRET_BACKEND=keyring   AGENT_KEY_BLOB=./agent-key.enc   WALLET_PASS=<you set this>   RING_KEY=guardian-agent
npm start                                              # broker boots, decrypts via the Key Ring, signs scoped actions
```
Capture for the demo: the `ring init` device approval + the broker booting with `SECRET_BACKEND=keyring` and printing `the fund-moving key is loaded from the keyring backend`.

**B. Bring the Key Ring to a host with no USB port (LKRP software `addMember`):**
```bash
cd ledger-broker
npm i @ledgerhq/ledger-key-ring-protocol
# [headless host] make its own member key — NO device:
node src/enroll.mjs gen-member                # prints <vpsPubkey>
# [laptop, Flex attached ONCE] software-add that host to the trustchain:
node src/enroll.mjs add <vpsPubkey> guardian-vps
# [headless host] join + decrypt, device-free from here on:
node src/enroll.mjs restore <rootId>
# [laptop] revoke anytime (device-gated rotation):
node src/enroll.mjs revoke <vpsPubkey>
```
Capture: the headless host generating its key with no Ledger, the laptop `add` with the Flex, and the host then decrypting the agent key — i.e. "a Ledger-less server joined the device-rooted trustchain." That is exactly "bring the Key Ring to hosts with no USB port."

> If a step throws on the LKRP import, it's the SDK version/peer-deps — `npm i @ledgerhq/ledger-key-ring-protocol@latest`; the code paths (`initMemberCredentials`/`getOrCreateTrustchain`/`addMember`/`restoreTrustchain`) are already wired in `src/enroll.mjs`.

---

## ⏳ #2 — Flex-signed invest on the Flex-owned Arc vault (needs your Flex + Arc USDC)

Today's verified Arc invest (`0xbd3df97…`) ran on an **agent-operated** vault; the **Flex-owned** Arc vault (`0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808`) is deployed but has no Flex-signed invest yet.

**Honest take:** the Arc story is already strong without this — Flex-owned vault deployed + a real agent invest on Arc + CCTP round-trip proven. So this is **optional polish**, and it's the most effort of the four because the app's arm flow is currently **Base-only** (`guardian/app/lib/vaultMulti.ts` + `useLedgerPolicy.ts` hardcode the Base chainId/vault). To get a Flex signature over the Arc domain (chainId `5042002`, verifyingContract `0x67ef85…`) you need one of:

- **Option A (cleanest, ~1–2 hr code, I can do it):** I parameterize the arm flow by network so the app can arm the **Arc** vault. Then you: switch the app to Arc, connect the Flex, arm the Arc vault, fund it with Arc USDC, and the agent invests — producing a real Flex-signed Arc invest tx. **Say the word and I'll wire it.**
- **Option B:** a standalone DMK-in-Node script that signs the Arc `Policy` on the Flex, then the agent invests. Doable but fiddlier than A.

**Recommendation:** given the deadline, either accept the already-strong Arc story (the submission is written to be honest about the proof-vault detail), or greenlight **Option A** and I'll wire it now.

---

## Before you submit (your critical path)

1. ✅ App redeployed to Vercel (PayFlow "Sui" gone) — **confirm** `guardian-rho-two.vercel.app` no longer shows the "Send payment" tile.
2. **Record the 2–4 min demo video** and paste the link into `SUBMISSION.md`, `the-graph.md`, `ledger.md`, `arc.md` (they say `TBD`).
3. **Submit on the ETHGlobal dashboard** before **Sun Sep 13, 12:00 pm EDT (9:30 pm IST)** — tick The Graph, Ledger, and Arc prizes; paste from the matching doc.
4. (Optional) run #4 for the Ledger headline; greenlight #2 Option A if you want the Arc polish.
