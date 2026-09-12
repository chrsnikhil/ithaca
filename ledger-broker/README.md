# guardian-ledger-broker

**A capability broker built on the Ledger Key Ring.** It holds an autonomous agent's fund-moving key — device-rooted, never on disk in plaintext — and hands the agent only **scoped capabilities**, never the raw key.

> Agents propose. The broker enforces. The Ledger is the root of trust.

---

## The problem

An autonomous agent that moves money needs a signing key. A key in the agent's process is a key that can leak — one prompt-injection or RCE and the funds are gone. Spend caps and allowlists that live in the agent (or a plain `.env`) are advisory: whoever holds the key can bypass them.

## The inversion

The broker **owns** the key and never gives it out. The agent can only ask for a **capability**:

```
agent (daemon) ──POST /capability/sign-vault-action──▶ broker ──signs w/ vaulted key──▶ chain
                  { method, args }  (token-gated)       (scope-enforced, audited)
```

The broker will sign **only** a Guardian `invest` / `deRisk` / `rebalance` / `protect`, **only** against the one configured vault. It refuses any other method and any other target, and it **never returns the key**. A fully compromised agent still cannot move funds anywhere except through the on-chain-mandated Guardian actions.

Three layers of defense stack:
1. **Key Ring** — the key is encrypted under the owner's Ledger; a host can only decrypt it if it's a member of the device-rooted trustchain (revocable).
2. **Broker scope** — even decrypted, the key only ever signs the 3 allowlisted methods on the 1 allowlisted vault.
3. **On-chain mandate** — the Flex-signed `Policy` bounds amounts, venue, and safe haven. (see [`../guardian-contracts`](../guardian-contracts))

## Secret backends

- **`keyring`** (production) — the Ledger Key Ring via `wallet-cli ring`. Device-free after a one-time `ring init`; the decrypt password comes from `WALLET_PASS` in the broker's env, which **you** provision — the agent never chooses, types, or sees it (Ledger's documented agent/CI pattern).
- **`local`** (dev/demo) — AES-256-GCM under a passphrase, so the broker and its scope enforcement run and test on any machine without a Ledger.

## Provision the key

**Production (Ledger Key Ring):**
```bash
npm i -g @ledgerhq/wallet-cli
wallet-cli ring init                                   # one-time, Ledger attached
printf '0xAGENT_PRIVATE_KEY' > k.txt
wallet-cli ring encrypt -i k.txt -o agent-key.enc --key guardian-agent && rm k.txt
# broker .env: SECRET_BACKEND=keyring, AGENT_KEY_BLOB=./agent-key.enc, WALLET_PASS=$(…)
```

**Dev (local):**
```bash
echo "0xAGENT_PRIVATE_KEY" | node src/seal.js agent-key.json "my-passphrase"
# broker .env: SECRET_BACKEND=local, AGENT_KEY_BLOB=./agent-key.json, LOCAL_PASS=my-passphrase
```

## Run

```bash
cp .env.example .env      # fill it in
npm start                 # capability broker on http://127.0.0.1:8799
```

Guardian's daemon consumes it by setting `BROKER_URL` + `BROKER_TOKEN` — then the daemon holds **no key at all** and routes every action through the broker (see [`../guardian-agent/daemon.js`](../guardian-agent/daemon.js), `brokerSign`).

## Bring the Key Ring to a host with no USB port

Enroll a headless VPS / CI runner into the Ledger trustchain **without ever attaching a Ledger to it** — using the LKRP SDK's software `addMember` (verified: no `deviceId` param):

```bash
# [VPS]    generate this host's own member key (no device):
node src/enroll.mjs gen-member                # prints its pubkey
# [laptop] with the Flex attached ONCE, software-add the VPS:
node src/enroll.mjs add <vpsPubkey> guardian-vps
# [VPS]    join + decrypt, device-free from here on:
node src/enroll.mjs restore <rootId>
# [laptop] revoke anytime (device-gated key rotation):
node src/enroll.mjs revoke <vpsPubkey>
```
(Requires `npm i @ledgerhq/ledger-key-ring-protocol` and a Ledger on the laptop, once.)

## Security model

The Key Ring makes the secret unleakable **at rest** and gives you revocation, and the broker is a small, hardened surface: the key is only ever live in memory there, briefly, during a scoped signature, and never in the agent. The broker's scope enforcement plus the on-chain mandate contain a compromised **agent**; the Key Ring plus a minimal broker host contain the **secret**. The one key that authorizes every fund exit, the EIP-712 signer, never leaves the Flex.

## Test

```bash
npm test   # proves: grants in-scope sign, denies out-of-scope, never returns the key, audits grants
```

## License
MIT
