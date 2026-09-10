// One-time setup for the autonomous daemon (owner actions).
// Ensures the vault has idle USDC to invest, the agent + safe haven are set, and writes a
// signed Policy to policy.json. In production this Policy comes from the PWA /api/arm store
// (signed by Chris on the Ledger Flex); here the burner owner signs it so we can run headless.
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { connect } = require("./vault");

const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc";
const FLEX = process.env.SAFE_HAVEN || "0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da";
const TOPUP = BigInt(Math.round((Number(process.env.TOPUP_USDC || 500)) * 1e6));
const u = (n) => BigInt(Math.round(n * 1e6));

async function send(label, fn) {
  for (let i = 0; i < 4; i++) {
    try { const tx = await fn(); const rc = await tx.wait(1); console.log(`  ${label}: ${rc.hash}`); return rc; }
    catch (e) { console.log(`  ${label} retry ${i + 1}: ${(e.shortMessage || e.message || "").slice(0, 80)}`); await new Promise((r) => setTimeout(r, 3000)); }
  }
  throw new Error(`${label} failed`);
}

async function main() {
  const { wallet, vault, usdc, dep } = connect();
  console.log("owner/agent:", wallet.address, "\nvault:", dep.GuardianVault);

  // 1) best-effort top-up from the Aave faucet (has a per-address mint timelock; ok to skip)
  const faucet = new ethers.Contract(FAUCET, ["function mint(address,address,uint256) returns (uint256)"], wallet);
  try {
    await send("faucet.mint", () => faucet.mint(dep.aaveUsdc, wallet.address, TOPUP));
    await send("approve", () => usdc.approve(dep.GuardianVault, TOPUP));
    await send("deposit", () => vault.deposit(TOPUP));
  } catch (e) {
    console.log("  faucet top-up skipped:", (e.shortMessage || e.message || "").slice(0, 60));
  }

  // 2) ensure policy controls (idempotent)
  await send("setAgent", () => vault.setAgent(wallet.address));
  await send("setSafeHaven", () => vault.setSafeHaven(FLEX, true));

  // 3) make sure there's idle USDC for the daemon to invest — free any existing Aave position
  const [idle, position] = await Promise.all([vault.idle(), vault.position()]);
  console.log(`  vault idle=${ethers.formatUnits(idle, 6)} position=${ethers.formatUnits(position, 6)}`);
  if (idle < u(1) && position >= u(1)) {
    await send("deRisk (free idle)", () => vault.deRisk(position));
    console.log("  freed the existing Aave position into idle for the invest demo");
  }

  // 3) sign a fresh Policy (nonce 2, generous caps so the demo has full budget)
  const policy = {
    investCap: u(2000).toString(),
    venue: dep.aaveVenue,
    protectCap: u(2000).toString(),
    safeHaven: FLEX,
    expiry: (Math.floor(Date.now() / 1000) + 7 * 24 * 3600).toString(),
    nonce: "2",
  };
  const domain = { name: "Guardian", version: "1", chainId: dep.chainId, verifyingContract: dep.GuardianVault };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
    { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
    { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  const signature = await wallet.signTypedData(domain, types, policy);
  const signer = ethers.verifyTypedData(domain, types, policy, signature);
  fs.writeFileSync(path.join(__dirname, "policy.json"), JSON.stringify({ policy, signature, signer }, null, 2));
  console.log("\npolicy.json written. signer:", signer, "== owner:", signer.toLowerCase() === (await vault.owner()).toLowerCase());
}

main().catch((e) => { console.error(e); process.exit(1); });
