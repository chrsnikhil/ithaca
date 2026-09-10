# guardian-ledger-broker — ETHOnline 2026 submission

**Track:** Ledger — *AI Agents x Ledger* ($3,500, "start something new")
**What it is:** a capability broker on the Ledger Key Ring that gives an autonomous agent scoped signing power without ever giving it the key — plus USB-less enrollment for headless hosts.

---

## How it maps to what the track asked for

> *"Agents that use secrets they cannot leak: a broker hands out scoped capabilities, never the API key."*

✅ **This is the whole project.** The broker owns the agent's fund-moving key (vaulted in the Ledger Key Ring) and exposes only `POST /capability/sign-vault-action`. It will sign **only** `invest`/`deRisk`/`protect`, **only** against the one configured Guardian vault, and **never returns the key**. Proven by tests: in-scope sign granted, out-of-scope method denied, key never present in any response. ([`test/broker.test.js`](./test/broker.test.js), 4/4)

> *"Bring the Key Ring to hosts with no USB port: enroll a VPS, a CI runner, or a hosted agent."*

✅ **[`src/enroll.mjs`](./src/enroll.mjs)** does device-less enrollment via the LKRP SDK's **software `addMember`** (verified from the SDK source: it has no `deviceId` param). The laptop (Ledger attached once) adds the headless host's software-generated member key; the host then decrypts device-free; the Ledger can revoke it later (device-gated key rotation).

> *"Both must be built on the Ledger Agent Stack, and in particular on the Ledger Key Ring CLI (`wallet-cli ring`)."*

✅ The production secret backend is the **Ledger Key Ring CLI** (`wallet-cli ring init/encrypt/decrypt`), with the password handled by Ledger's documented agent pattern (`WALLET_PASS` in the broker's env — the agent never sees it). ([`src/secret-store.js`](./src/secret-store.js))

> *"Human-in-the-loop agents where Ledger approves high-risk actions before funds move."*

✅ The Ledger is the root of trust: it roots the Key Ring (and can revoke any host), and Guardian's high-risk authority — the `Policy` that bounds amounts/venue/safe-haven — is an **EIP-712 mandate signed on the Flex** ([`../guardian-contracts`](../guardian-contracts)). The agent proposes; the Flex-signed mandate + the broker's scope enforce.

## Real consumer

**[Guardian](../guardian)** runs on this: with `BROKER_URL` set, its autonomous daemon holds **no private key** — it routes every `invest`/`deRisk`/`protect` through the broker ([`../guardian-agent/daemon.js`](../guardian-agent/daemon.js) `brokerSign`). The broker signs within scope; a compromised daemon can't exfiltrate the key or move funds off-mandate.

## Honest scope

The Key Ring protects the secret **at rest** + gives revocation; a minimal, hardened broker host is the only place the key is ever live. We don't claim an online key is unstealable — we claim it's **never in the agent**, **only usable within scope**, and **revocable from the Ledger**. The one truly unleakable key is the EIP-712 signer on the Flex.

## Run / verify

```bash
npm install && npm test          # scope-enforcement + no-key-leak proof (local backend)
cp .env.example .env && npm start # run the broker
node src/enroll.mjs gen-member    # USB-less enrollment (needs the LKRP SDK + a Flex on the laptop)
```

- **Docs:** [README.md](./README.md) · [SKILL.md](./SKILL.md)
- **Repo / demo video:** _(add on push)_
- **License:** MIT
