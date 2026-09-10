---
name: guardian-ledger-broker
description: Use when an autonomous agent must sign a fund-moving transaction but should never hold the private key. The broker vaults the key in the Ledger Key Ring and grants only scoped capabilities — it signs a specific, allowlisted contract action on request and never returns the key.
---

# guardian-ledger-broker — scoped signing without the key

An agent should never hold a fund-moving key. Instead, ask the **broker** to perform a bounded action. The broker owns the key (Ledger Key Ring), enforces scope, and returns only the result.

## Capability

`POST http://127.0.0.1:8799/capability/sign-vault-action`
headers: `x-broker-token: <BROKER_TOKEN>`
body:
```json
{ "method": "invest" | "deRisk" | "protect", "args": [...], "broadcast": true }
```
- `method` must be one of the three Guardian vault actions — anything else is denied.
- The broker signs against the **one** configured vault only; it will not target any other address.
- Returns `{ "txHash": "0x…" }` (broadcast) or `{ "signedTx": "0x…" }` (sign-only). Never the key.

## When to use

- The agent needs to invest / de-risk / protect on-chain but runs in an untrusted or headless environment.
- You want a compromised agent to be *unable* to move funds off-mandate — the broker + the on-chain Policy contain it.

## Other endpoints

- `GET /health` — the agent address, the scoped vault, the allowed methods.
- `GET /audit` — the attributed log of every capability grant/denial.

## Setup

The key is provisioned into the Ledger Key Ring once (`wallet-cli ring init` + `ring encrypt`); headless hosts are enrolled without a USB device via `src/enroll.mjs`. See README.md.
