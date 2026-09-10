// Prove the full GuardianVault loop LIVE on Arc testnet: invest -> de-risk -> protect, bounded
// by an EIP-712 Policy. Uses a burner-owned proof vault (owner=agent=deployer) so the Policy
// can be signed here — the Flex-owned vault is armed by Chris via /arm in the real demo.
//   npx hardhat run scripts/demo-guardian-arc.js --network arcTestnet
const { ethers } = require("hardhat");

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const ERC20 = [
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];
const U = 1_000_000n, u = (n) => n * U;
const f = (x) => (Number(x) / 1e6).toFixed(6);

async function main() {
  const [dep] = await ethers.getSigners();
  const usdc = await ethers.getContractAt(ERC20, USDC_ADDR);
  console.log("deployer/agent:", dep.address, "USDC:", f(await usdc.balanceOf(dep.address)));

  const venue = await (await ethers.getContractFactory("MockYieldVenue")).deploy(USDC_ADDR, 500);
  await venue.waitForDeployment(); const venueAddr = await venue.getAddress();
  const haven = ethers.Wallet.createRandom().address; // fresh, approved evacuation destination
  const vault = await (await ethers.getContractFactory("GuardianVault"))
    .deploy(dep.address, USDC_ADDR, venueAddr, venueAddr, dep.address, haven);
  await vault.waitForDeployment(); const vaultAddr = await vault.getAddress();
  console.log("proof vault:", vaultAddr, "venue:", venueAddr, "haven:", haven);

  // fund the vault (3 USDC) + a small yield buffer (0.5)
  await (await usdc.transfer(vaultAddr, u(3n))).wait();
  await (await usdc.approve(venueAddr, 500000n)).wait();
  await (await venue.fundYieldBuffer(500000n)).wait();

  // sign the Policy (owner = deployer here)
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const domain = { name: "Guardian", version: "1", chainId, verifyingContract: vaultAddr };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
    { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
    { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  const p = { investCap: u(3n), venue: venueAddr, protectCap: u(3n), safeHaven: haven, expiry: 2000000000n, nonce: 1n };
  const sig = await dep.signTypedData(domain, types, p);

  console.log("\n-- CALM: invest 3 USDC into the Arc yield venue --");
  await (await vault.invest(p, sig, u(3n))).wait();
  console.log("   position:", f(await vault.position()), "idle:", f(await vault.idle()));

  console.log("\n-- ELEVATED: de-risk 1 USDC back into the vault --");
  await (await vault.deRisk(u(1n))).wait();
  console.log("   position:", f(await vault.position()), "idle:", f(await vault.idle()));

  console.log("\n-- DANGER: protect 1.5 USDC to the safe haven --");
  await (await vault.protect(p, sig, 1500000n)).wait();
  console.log("   haven balance:", f(await usdc.balanceOf(haven)));
  console.log("   position:", f(await vault.position()), "idle:", f(await vault.idle()));

  console.log("\nPROVEN LIVE ON ARC: invest -> de-risk -> protect, all bounded by the signed policy.");
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
