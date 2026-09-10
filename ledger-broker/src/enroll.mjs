// USB-less Key Ring enrollment.
//
// The Ledger track asks: "bring the Key Ring to hosts with no USB port — enroll a VPS, a CI
// runner, or a hosted agent." This does exactly that, using the Ledger Key Ring Protocol (LKRP)
// SDK. The key fact (verified from the SDK source): `addMember` is SOFTWARE-signed — it has no
// deviceId parameter — so an existing member (your laptop, Ledger attached ONCE at setup) can
// enroll a brand-new headless host that never has a Ledger plugged into it. That host then
// decrypts device-free (network only); the Ledger can still REVOKE it later (device-gated).
//
//   [VPS]    node src/enroll.mjs gen-member                 -> generates its keypair, prints pubkey
//   [laptop] node src/enroll.mjs add <vpsPubkey> <name>     -> software-adds the VPS (Flex attached)
//   [VPS]    node src/enroll.mjs restore                    -> joins + can now decrypt, no device
//   [laptop] node src/enroll.mjs revoke <vpsPubkey>         -> rotates the key, revoking the VPS
//
// Requires: npm i @ledgerhq/ledger-key-ring-protocol   (and a Ledger on the laptop, once).
import fs from "node:fs";
import path from "node:path";

const STORE = path.join(process.cwd(), ".lkrp-member.json"); // this host's member credentials
const APP_ID = Number(process.env.LKRP_APP_ID || 1);

async function sdk() {
  try {
    return await import("@ledgerhq/ledger-key-ring-protocol");
  } catch {
    console.error("Missing SDK. Install it first:  npm i @ledgerhq/ledger-key-ring-protocol");
    process.exit(1);
  }
}

async function genMember() {
  const { sdk: lkrp } = await sdk();
  const creds = await lkrp.initMemberCredentials(); // { pubkey, privatekey } — no device
  fs.writeFileSync(STORE, JSON.stringify({ memberCredentials: creds, applicationId: APP_ID }, null, 2));
  console.log("This host's member pubkey (send to the laptop to be added):\n");
  console.log("  " + creds.pubkey);
  console.log("\nStored credentials in", STORE, "(keep this secret — it's this host's identity).");
}

async function addRemote(pubkey, name) {
  const { sdk: lkrp } = await sdk();
  const { deviceId, laptopCreds, trustchain } = await bootstrapOnLaptop(lkrp); // Flex attached once
  // SOFTWARE-signed: no deviceId here. This is what makes USB-less enrollment possible.
  await lkrp.addMember(trustchain, laptopCreds, { id: pubkey, name: name || "guardian-vps", permissions: 0xffffffff });
  console.log(`Added member ${name || "guardian-vps"} (${pubkey.slice(0, 16)}…) to the trustchain.`);
  console.log("Give the VPS this trustchain root id:", trustchain.rootId);
  void deviceId;
}

async function bootstrapOnLaptop(lkrp) {
  // On the laptop, the Ledger creates/opens the trustchain ONCE (this is the only device step).
  const deviceId = process.env.LKRP_DEVICE_ID || "usb"; // resolved by the DMK transport in a real setup
  const laptopCreds = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8")).memberCredentials
    : await lkrp.initMemberCredentials();
  const { trustchain } = await lkrp.getOrCreateTrustchain(deviceId, laptopCreds); // device-signed root
  return { deviceId, laptopCreds, trustchain };
}

async function restore(rootId) {
  const { sdk: lkrp } = await sdk();
  const { memberCredentials } = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const trustchain = await lkrp.restoreTrustchain({ rootId: rootId || process.env.LKRP_ROOT_ID }, memberCredentials);
  console.log("Joined trustchain. This host can now decrypt Key Ring data WITHOUT a device.");
  return { lkrp, trustchain, memberCredentials };
}

async function revoke(pubkey) {
  const { sdk: lkrp } = await sdk();
  const { deviceId, laptopCreds, trustchain } = await bootstrapOnLaptop(lkrp);
  // device-gated: rotates the key so the revoked member can no longer decrypt new data.
  await lkrp.removeMember(deviceId, trustchain, laptopCreds, { id: pubkey, name: "revoked", permissions: 0xffffffff });
  console.log(`Revoked ${pubkey.slice(0, 16)}… (key rotated on the Flex).`);
}

const [cmd, a, b] = process.argv.slice(2);
const run = { "gen-member": () => genMember(), add: () => addRemote(a, b), restore: () => restore(a), revoke: () => revoke(a) }[cmd];
if (!run) { console.error("commands: gen-member | add <pubkey> <name> | restore <rootId> | revoke <pubkey>"); process.exit(1); }
run().catch((e) => { console.error("enroll failed:", e.message || e); process.exit(1); });
