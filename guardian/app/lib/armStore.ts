import fs from "fs";
import os from "os";
import path from "path";

// Persists the Flex-signed mandate so the rescue agent (/api/tools execute_rescue) can use it.
// On a serverless host (Vercel) the working dir is read-only, so we use the OS temp dir there
// (ephemeral — fine for a demo; the canonical v2 policy lives with the daemon).
const FILE = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), ".arm-mandate.json");

export type Armed = {
  mandate: { maxAmount: string; safeHaven: string; expiry: string; nonce: string };
  signature: string;
  signer: string;
  armedAt: number;
};

export function saveArmed(a: Armed) {
  fs.writeFileSync(FILE, JSON.stringify(a, null, 2));
}

export function loadArmed(): Armed | null {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Armed;
  } catch {
    return null;
  }
}
