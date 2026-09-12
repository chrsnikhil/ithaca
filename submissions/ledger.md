# ITHACA → Ledger

## Prize
**AI Agents x Ledger** — **$3,500** ("start something new").

## The pitch
Autonomy without a hardware anchor is a liability. ITHACA makes the **Ledger the root of trust** for an autonomous agent that moves real money: you sign **one** EIP-712 mandate on the device, and from then on the agent operates with a **scoped, disposable hot key it can never exceed**. Device-backed security isn't a login step bolted on the side — it is the thing that makes the whole agent safe to hand real funds. Steal the agent's key and you cannot send a single dollar to an attacker.

## How we meet what Ledger asked for (point by point)

> **"Device-backed security must be CENTRAL."**
The entire security model resolves to the Ledger. Every fund-exit path (`invest`, `protect`, and each fresh escalation) requires a signature only the Ledger can produce, verified on-chain. The agent's hot key is deliberately low-privilege and disposable; the one key that matters never leaves the device. DMK signing works over **both WebHID (USB) and Web-BLE (Bluetooth)**, signing the EIP-712 `Policy` on path `44'/60'/0'/0/0` and verifying the recovered signer equals the Flex owner. A **WebAuthn platform authenticator (Face ID)** is a presence gate before signing. The key is browser-local; the server never sees it.

> **"Agents that use secrets they cannot leak — a broker hands scoped capabilities, never the key."**
This is exactly `ledger-broker/`. The broker owns the fund-moving key **in-process** and exposes **one scoped HTTP capability**: it will sign only `invest` / `deRisk` / `protect`, only to the configured vault, and it **never returns the raw key**. It is token-gated and audited. **4 passing unit tests** prove the contract: in-scope requests sign, out-of-scope requests are denied, the key is never exposed, and every action is audited.

> **"Bring the Key Ring to hosts with no USB port — enroll a VPS / CI / hosted agent — built on the Ledger Agent Stack, esp. the Ledger Key Ring CLI (wallet-cli ring)."**
Implemented against the real Ledger SDKs: the **wallet-cli ring** (secret decrypt) and **LKRP USB-less enrollment** — a software-signed `addMember` that enrolls a Ledger-less headless host into the Key Ring, so a hosted agent with no USB port can participate. **Honest scope:** these paths are implemented against the real Ledger Key Ring / LKRP SDKs; the **tested, default** backend is local AES-GCM. We say "integrated against Ledger Key Ring (wallet-cli ring) + LKRP; local-encrypted fallback is the tested default."

> **"Human-in-the-loop where Ledger approves high-risk actions before funds move."**
Routine invest / rotate / de-risk run autonomously within the signed caps. A **high-risk, out-of-bounds evacuation** requires a **fresh, single-use `Escalation` signed on the Flex in the moment** — `signEscalation` → `approveAndProtect`, enforced **single-use on-chain**. This is real end-to-end: the Ledger literally approves the dangerous action before any funds move, and the approval cannot be replayed.

### Point-by-point mapping table
| What Ledger wants | How ITHACA delivers it | Status |
|---|---|---|
| Device-backed security central | EIP-712 mandate signed on Ledger over USB **and** Bluetooth (DMK); on-chain signer check; Face ID presence gate | Tested |
| Secrets the agent can't leak | `ledger-broker`: scoped capability, never the raw key, token-gated, audited (4 passing tests) | Tested |
| Bounded authority that can't be exceeded | On-chain `Policy{investCap, protectCap, safeHaven, expiry, nonce}` + venue/safe-haven allowlists + caps + expiry (26 passing contract tests) | Tested |
| Secrets on the device-rooted Key Ring | The capability broker runs on `wallet-cli ring`: the agent key is encrypted under the Ledger Key Ring and decrypted through the device to sign scoped actions, never handing out the key. USB-less LKRP enrollment (software-signed `addMember`) extends it to headless hosts. | **Key Ring backend proven live on-device**; USB-less enrollment implemented |
| Human-in-the-loop for high-risk | Fresh single-use `Escalation` on the Flex → `approveAndProtect`, single-use on-chain | Tested end-to-end |

## Why "a stolen key can't steal" is the whole point
| Agent can call | What it does | Can it steal? |
|---|---|---|
| `invest(policy, sig, venue, amount)` | deploy — needs a Flex-signed policy, allowlisted venue, ≤ cap | No |
| `deRisk(venue, amount)` | pull funds back into the owner's vault | No |
| `rebalance(from, to, amount)` | move between allowlisted venues only | No |
| `protect(policy, sig, amount)` | evacuate — only to the Flex-approved safe haven | No |
| `ownerWithdraw(amount, to)` | send anywhere | No — `onlyOwner` |

The Ledger revokes/rotates the agent at will; the mandate auto-expires. Root of trust: Ledger Flex owner `0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da`. Bounded agent: `0x975Bb943F18fe44333eF28D18865ca5A5D63c23D`.

---

## Paste-ready form text

**Project name:** ITHACA

**Short description:**
> ITHACA is an autonomous, self-custodial capital protector where the Ledger is the root of trust. You sign one EIP-712 mandate on your Ledger (USB or Bluetooth); the agent then operates a scoped, disposable hot key it can never exceed. A capability broker hands the agent scoped signing, never the raw key, and high-risk evacuations require a fresh single-use Ledger approval before funds move.

**How does this project use Ledger / the Ledger Agent Stack:**
> Signing uses the Ledger Device Management Kit over both WebHID (USB) and Web-BLE (Bluetooth): the EIP-712 Policy is signed on 44'/60'/0'/0/0 and the recovered signer is verified against the Flex owner on-chain; a WebAuthn Face ID gate precedes signing; the key stays browser-local. The ledger-broker holds the fund-moving key in-process and exposes one scoped HTTP capability — sign only invest/deRisk/protect, only to the configured vault, never returning the raw key — token-gated and audited (4 passing tests). For headless hosts with no USB, LKRP USB-less enrollment (software-signed addMember) and the wallet-cli ring are integrated against the real Ledger Key Ring SDKs, with a local AES-GCM backend as the tested default. High-risk out-of-bounds evacuations require a fresh single-use Escalation signed on the Flex (approveAndProtect, single-use on-chain) — Ledger approves before any funds move. On-chain the GuardianVaultMulti (26 passing tests) enforces caps, venue and safe-haven allowlists, and expiry, so a stolen agent key can annoy but never steal.

**Repo:** https://github.com/chrsnikhil/ithaca
**Live app:** https://guardian-rho-two.vercel.app
**Demo video:** _TBD_

---

## Demo-video talking points (Ledger)
1. **Sign once, on the device:** connect the Ledger over USB, then again over Bluetooth (show both DMK transports), pass the Face ID gate, and sign the EIP-712 mandate — "the key never leaves the device; the server never sees it."
2. **Show the boundary is on-chain:** point at `Policy{investCap, protectCap, safeHaven, expiry, nonce}` and the venue / safe-haven allowlists — "this is what the agent may ever do; it's enforced in the same transaction as every action."
3. **The broker never leaks the key:** hit the `ledger-broker` with an in-scope request (signs) and an out-of-scope one (denied), and show the audit log — "scoped capability, never the raw key; here are the 4 tests proving it."
4. **Stolen-key demo:** take the agent key and try to send funds to an attacker address — the contract reverts. "A stolen key can annoy, never steal."
5. **Human-in-the-loop:** trigger a high-risk out-of-bounds evacuation → the Ledger prompts for a fresh single-use Escalation → `approveAndProtect` executes and cannot be replayed. "Ledger approves the dangerous action before any money moves."
6. **Secrets on the Key Ring:** boot the broker on the live Ledger Key Ring backend. `wallet-cli ring init` is approved on the Flex, then the broker decrypts the agent key through the Ledger and signs a scoped action while refusing anything out of scope. USB-less enrollment for headless hosts runs on the same LKRP trustchain.
