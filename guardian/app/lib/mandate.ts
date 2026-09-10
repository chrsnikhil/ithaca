"use client";

// The Flex-signed mandate lives in the BROWSER (localStorage), not on any server. Serverless has
// no place to keep it, and it shouldn't need one: the signature IS the capability. The client hands
// {policy, signature} to /api/tick|act|escalate on each call; the server verifies + executes with
// the bounded agent key, and the vault re-checks the signature on-chain. So the deployed app arms +
// acts on its own — no daemon, no tunnel.
export type StoredMandate = {
  policy: { investCap: string; protectCap: string; safeHaven: string; expiry: string; nonce: string };
  signature: string;
  signer: string;
  armedAt: number;
};

const KEY = "guardian.mandate";

export function loadMandate(): StoredMandate | null {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null") as StoredMandate | null;
    if (!j?.policy?.expiry || !j.signature) return null;
    if (Number(j.policy.expiry) * 1000 < Date.now()) { localStorage.removeItem(KEY); return null; } // expired
    return j;
  } catch { return null; }
}

export function saveMandate(m: StoredMandate) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {}
}

export function clearMandate() {
  try { localStorage.removeItem(KEY); } catch {}
}
