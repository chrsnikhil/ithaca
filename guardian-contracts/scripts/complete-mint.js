// Complete a cross-chain rescue whose burn already happened: poll IRIS for the burn tx's
// attestation, then mint on Arc. No re-burn. Usage: node scripts/complete-mint.js [burnTxHash]
require("dotenv").config();
const { ethers } = require("ethers");

const PK = process.env.PRIVATE_KEY;
const ARC_RPC = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io";
const IRIS = "https://iris-api-sandbox.circle.com";
const BASE_DOMAIN = 6;
const MSG_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275"; // MessageTransmitterV2 on Arc
const BURN_TX = process.argv[2] || "0x285c2773761185853fcd5113cb62a6a804a939fcae34246cd79267ee4da890ce";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log("polling IRIS for burn tx:", BURN_TX);
  let message, attestation;
  for (let i = 0; i < 240; i++) {
    try {
      const r = await fetch(`${IRIS}/v2/messages/${BASE_DOMAIN}?transactionHash=${BURN_TX}`);
      if (r.ok) {
        const j = await r.json();
        const m = j.messages?.[0];
        if (m && m.status === "complete" && m.attestation && m.attestation !== "PENDING") {
          message = m.message; attestation = m.attestation; break;
        }
        console.log(`  [${i}] status=${m?.status || "none"} delayReason=${m?.delayReason || "-"}`);
      } else {
        console.log(`  [${i}] IRIS HTTP ${r.status}`);
      }
    } catch (e) { console.log(`  [${i}] ${e.message.slice(0, 80)}`); }
    await sleep(15000);
  }
  if (!attestation) throw new Error("attestation still not ready after the wait window — re-run this script (burn already happened, no USDC lost)");

  console.log("attestation ready -> minting on Arc...");
  const arc = new ethers.JsonRpcProvider(ARC_RPC);
  const signer = new ethers.Wallet(PK, arc);
  const mt = new ethers.Contract(MSG_TRANSMITTER, ["function receiveMessage(bytes message, bytes attestation) returns (bool)"], signer);
  const tx = await mt.receiveMessage(message, attestation);
  const rc = await tx.wait();
  console.log(`✅ MINTED on Arc: ${rc.hash} — cross-chain rescue COMPLETE (burned on Base, minted on Arc)`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
