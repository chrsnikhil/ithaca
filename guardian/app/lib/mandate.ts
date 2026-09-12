"use client";

import type { Network } from "./deployments";

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
  // which chain this mandate was signed for. Absent on legacy/old stored mandates ⇒ "baseSepolia".
  network?: Network;
};

const KEY = "guardian.mandate";

export function loadMandate(): StoredMandate | null {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "null") as StoredMandate | null;
    if (!j?.policy?.expiry || !j.signature) return null;
    if (Number(j.policy.expiry) * 1000 < Date.now()) { localStorage.removeItem(KEY); return null; } // expired
    // back-compat: a mandate signed before the network toggle existed is a Base Sepolia mandate.
    return { ...j, network: j.network ?? "baseSepolia" };
  } catch { return null; }
}

export function saveMandate(m: StoredMandate) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {}
}

export function clearMandate() {
  try { localStorage.removeItem(KEY); } catch {}
}

// "Link this device": the Flex can only sign on desktop (iOS blocks WebHID/Web-Bluetooth), so to run
// the armed flow on a phone we carry the already-signed mandate over in a URL param. Desktop makes a
// link `…/?m=<base64(mandate JSON)>`; opening it on the phone imports the mandate into this device's
// localStorage, then strips the param from the URL. The signature is the capability (not the private
// key), so this only hands the phone the same bounded authority the Flex already approved.
export function importMandateFromURL(): boolean {
  try {
    const u = new URL(window.location.href);
    const enc = u.searchParams.get("m");
    if (!enc) return false;
    const obj = JSON.parse(decodeURIComponent(escape(atob(enc)))) as StoredMandate;
    if (obj?.policy?.expiry && obj.signature) localStorage.setItem(KEY, JSON.stringify(obj));
    u.searchParams.delete("m");
    window.history.replaceState(null, "", u.pathname + (u.search || "") + u.hash);
    return true;
  } catch { return false; }
}
