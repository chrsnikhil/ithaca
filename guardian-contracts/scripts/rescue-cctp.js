// Full cross-chain rescue: burn USDC on Base Sepolia via the GuardVaultCCTP (mandate-bounded),
// wait for Circle's IRIS attestation, then mint on Arc to the safe haven.
// Run: node scripts/rescue-cctp.js   (spans two chains, so raw ethers + explicit providers)
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PK = process.env.PRIVATE_KEY;
const BASE_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const ARC_RPC = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io";
const IRIS = "https://iris-api-sandbox.circle.com";
const BASE_DOMAIN = 6;
const MSG_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275"; // MessageTransmitterV2 (same on both)

const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8"));
const VAULT = dep.baseSepolia?.GuardVaultCCTP;
const USDC = dep.baseSepolia?.usdc;

const VAULT_ABI = [
  "function setAgent(address)",
  "function setSafeHaven(address,bool)",
  "function deposit(uint256)",
  "function rescue((uint256 maxAmount,address safeHaven,uint256 expiry,uint256 nonce) m, bytes sig, uint256 amount)",
];
const ERC20_ABI = ["function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"];
const MT_ABI = ["event MessageSent(bytes message)", "function receiveMessage(bytes message, bytes attestation) returns (bool)"];

const u = (n) => n * 1_000_000n; // 6-decimal USDC
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!VAULT) throw new Error("Deploy GuardVaultCCTP on Base first (scripts/deploy-cctp.js).");
  const base = new ethers.JsonRpcProvider(BASE_RPC);
  const arc = new ethers.JsonRpcProvider(ARC_RPC);
  const owner = new ethers.Wallet(PK, base); // owner = agent = burner (stands in for the Flex signer)
  const arcSigner = new ethers.Wallet(PK, arc);
  const haven = owner.address; // mint recipient on Arc (easy to verify)

  const vault = new ethers.Contract(VAULT, VAULT_ABI, owner);
  const usdc = new ethers.Contract(USDC, ERC20_ABI, owner);

  console.log(`owner/agent=${owner.address}  vault=${VAULT}  haven(on Arc)=${haven}`);

  // 1. policy + funding
  await (await vault.setAgent(owner.address)).wait();
  await (await vault.setSafeHaven(haven, true)).wait();
  await (await usdc.transfer(VAULT, u(5n))).wait(); // direct transfer -> vault holds USDC (rescue burns from its balance)
  console.log("vault funded with 5 USDC on Base (direct transfer)");
  // public Base RPC is load-balanced -> read-after-write lag; wait until the vault balance is visible
  const usdcRead = new ethers.Contract(USDC, ERC20_ABI, base);
  for (let i = 0; i < 30; i++) {
    const b = await usdcRead.balanceOf(VAULT);
    if (b >= u(3n)) { console.log(`vault USDC visible: ${ethers.formatUnits(b, 6)}`); break; }
    await sleep(2000);
  }

  // 2. owner signs the mandate (EIP-712) — exactly what the Flex will sign
  const domain = { name: "Guardian", version: "1", chainId: 84532, verifyingContract: VAULT };
  const types = { Mandate: [
    { name: "maxAmount", type: "uint256" }, { name: "safeHaven", type: "address" },
    { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" } ] };
  const mandate = { maxAmount: u(5n), safeHaven: haven, expiry: 4000000000n, nonce: 1n };
  const sig = await owner.signTypedData(domain, types, mandate);

  // 3. DANGER -> autonomous rescue: burn 3 USDC on Base, bound to the mandate
  console.log("rescuing 3 USDC (burn on Base -> Arc)...");
  let rc;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { const tx = await vault.rescue(mandate, sig, u(3n)); rc = await tx.wait(); break; }
    catch (e) {
      console.log(`  rescue attempt ${attempt} failed: ${(e.shortMessage || e.message || "").slice(0, 120)}`);
      if (attempt === 4) throw e;
      await sleep(5000);
    }
  }
  console.log(`burn tx: ${rc.hash}`);

  // 4. extract the CCTP message from the MessageSent log
  const mt = new ethers.Interface(MT_ABI);
  let message;
  for (const log of rc.logs) {
    try { const p = mt.parseLog(log); if (p && p.name === "MessageSent") { message = p.args.message; break; } } catch {}
  }
  if (!message) throw new Error("no MessageSent log found in burn tx");

  // 5. poll IRIS for the attestation
  console.log("waiting for Circle IRIS attestation...");
  let attestation, msgOut;
  for (let i = 0; i < 150; i++) {
    const r = await fetch(`${IRIS}/v2/messages/${BASE_DOMAIN}?transactionHash=${rc.hash}`);
    if (r.ok) {
      const j = await r.json();
      const m = j.messages?.[0];
      if (m && m.status === "complete" && m.attestation && m.attestation !== "PENDING") {
        attestation = m.attestation; msgOut = m.message || message; break;
      }
      if (m?.delayReason) console.log(`  IRIS delayReason: ${m.delayReason}`);
    }
    await sleep(5000);
  }
  if (!attestation) throw new Error("attestation did not arrive in time (try again; minFinalityThreshold may need 2000)");
  console.log("attestation received");

  // 6. mint on Arc
  const havenUsdcBefore = null; // (Arc USDC view differs; we confirm via the mint tx)
  const arcMT = new ethers.Contract(MSG_TRANSMITTER, MT_ABI, arcSigner);
  const mintTx = await arcMT.receiveMessage(msgOut, attestation);
  const mrc = await mintTx.wait();
  console.log(`✅ MINTED on Arc: ${mrc.hash}  (3 USDC delivered to safe haven ${haven})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
