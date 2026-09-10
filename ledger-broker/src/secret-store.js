// Where the broker's secret (the agent's fund-moving private key) lives at rest. Two backends:
//
//   keyring  — the Ledger Key Ring (LKRP) via `wallet-cli ring`. The secret is encrypted under
//              keys tied to the owner's Ledger; a machine can only decrypt it if it is a member
//              of the device-rooted trustchain. Device-free AFTER a one-time `ring init`. The
//              decrypt password comes from WALLET_PASS in the broker's environment — the AGENT
//              never chooses, types, or sees it (Ledger's documented CI/agent pattern).
//
//   local    — AES-256-GCM under a passphrase (Node crypto). For dev/demo on a machine without
//              a Ledger, so the broker + scope-enforcement are fully testable. NOT device-rooted.
//
// Either way, the plaintext key exists ONLY inside the broker process, briefly, and is NEVER
// written to disk in the clear and NEVER returned over the capability API.
const crypto = require("crypto");
const fs = require("fs");
const { execFileSync } = require("child_process");

/** AES-256-GCM encrypt (local backend). Returns a JSON-serialisable envelope. */
function localEncrypt(plaintext, pass) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(pass, salt, 32);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
  return { v: 1, alg: "aes-256-gcm", salt: salt.toString("hex"), iv: iv.toString("hex"), tag: c.getAuthTag().toString("hex"), ct: ct.toString("hex") };
}

function localDecrypt(env, pass) {
  const key = crypto.scryptSync(pass, Buffer.from(env.salt, "hex"), 32);
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(env.iv, "hex"));
  d.setAuthTag(Buffer.from(env.tag, "hex"));
  return Buffer.concat([d.update(Buffer.from(env.ct, "hex")), d.final()]).toString("utf8");
}

// Ledger Key Ring decrypt: device-free after `ring init`, password from WALLET_PASS in the env.
function keyringDecrypt(blobPath, keyName) {
  if (!process.env.WALLET_PASS) {
    throw new Error("keyring backend needs WALLET_PASS in the environment (provisioned by you, never by the agent).");
  }
  // wallet-cli writes the plaintext to stdout when no -o is given.
  const out = execFileSync("wallet-cli", ["ring", "decrypt", "-i", blobPath, "--key", keyName], {
    encoding: "utf8",
    env: process.env, // carries WALLET_PASS
  });
  return out.trim();
}

/**
 * Load a secret into memory. cfg:
 *   { backend: "keyring", blob: "<path>.enc", key: "<ring key name>" }
 *   { backend: "local",   blob: "<path>.json", pass: "<passphrase>" }
 */
function loadSecret(cfg) {
  if (cfg.backend === "keyring") return keyringDecrypt(cfg.blob, cfg.key);
  const env = JSON.parse(fs.readFileSync(cfg.blob, "utf8"));
  return localDecrypt(env, cfg.pass);
}

module.exports = { loadSecret, localEncrypt, localDecrypt };
