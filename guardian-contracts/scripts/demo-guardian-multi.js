// Prove the full multi-venue loop LIVE on Base Sepolia: invest into the picker's chosen market,
// rebalance/switch to another, then protect to the safe haven — all bounded by one signed Policy.
// The market pick comes from Guardian's graphscout-fed picker (proven in guardian-agent/test-picker.js:
// Compound = best risk-adjusted). Uses a burner-owned proof vault so the Policy is signable here.
//   npx hardhat run scripts/demo-guardian-multi.js --network baseSepolia
const { ethers } = require("hardhat");

const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc";
const U = 1_000_000n, u = (n) => n * U;
const f = (x) => (Number(x) / 1e6).toFixed(4);

async function main() {
  const [dep] = await ethers.getSigners();
  // The proof uses a freely-mintable MockUSDC (the real Aave-test faucet is timelocked). The
  // Flex-owned PRODUCTION vault uses real Aave-test USDC; this only proves the on-chain mechanics.
  const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
  await usdc.waitForDeployment();
  await (await usdc.mint(dep.address, u(20n))).wait();
  const USDC = await usdc.getAddress();
  console.log("proof MockUSDC:", USDC, "| deployer USDC:", f(await usdc.balanceOf(dep.address)));

  // deploy 3 market venues + a burner-owned proof vault
  const MYV = await ethers.getContractFactory("MockYieldVenue");
  const moonwell = await (await MYV.deploy(USDC, 800)).waitForDeployment();
  const aave = await (await MYV.deploy(USDC, 500)).waitForDeployment();
  const compound = await (await MYV.deploy(USDC, 600)).waitForDeployment();
  const venues = [await moonwell.getAddress(), await aave.getAddress(), await compound.getAddress()];
  const haven = ethers.Wallet.createRandom().address;
  const vault = await (await ethers.getContractFactory("GuardianVaultMulti"))
    .deploy(dep.address, USDC, venues, venues, dep.address, haven);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("proof vault:", vaultAddr, "| venues moonwell/aave/compound:", venues.map((v) => v.slice(0, 8)).join(" "));

  // fund vault (5) + venue yield buffers (0.5 each)
  await (await usdc.transfer(vaultAddr, u(5n))).wait();
  for (const v of venues) { await (await usdc.approve(v, 500000n)).wait(); await (await (await ethers.getContractAt("MockYieldVenue", v)).fundYieldBuffer(500000n)).wait(); }

  // sign the Policy (owner = deployer here; the real vault is signed on the Flex)
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const domain = { name: "Guardian", version: "1", chainId, verifyingContract: vaultAddr };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
    { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  const p = { investCap: u(5n), protectCap: u(5n), safeHaven: haven, expiry: 2000000000n, nonce: 1n };
  const sig = await dep.signTypedData(domain, types, p);

  const compoundV = venues[2], aaveV = venues[1];
  console.log("\n-- PICK (graphscout picker): Compound (6%, healthy) over Moonwell (8%, watch) --");
  console.log("-- INVEST 5 USDC into Compound --");
  await (await vault.invest(p, sig, compoundV, u(5n))).wait();
  console.log("   Compound position:", f(await vault.positionOf(compoundV)), "| total:", f(await vault.totalPosition()));

  console.log("\n-- REBALANCE 5 USDC Compound -> Aave (switch markets) --");
  await (await vault.rebalance(compoundV, aaveV, u(5n))).wait();
  console.log("   Compound:", f(await vault.positionOf(compoundV)), "| Aave:", f(await vault.positionOf(aaveV)));

  console.log("\n-- DANGER: PROTECT 3 USDC to safe haven (auto-pulls from markets) --");
  await (await vault.protect(p, sig, u(3n))).wait();
  console.log("   haven balance:", f(await usdc.balanceOf(haven)), "| total position:", f(await vault.totalPosition()));

  console.log("\nPROVEN LIVE ON BASE: pick -> invest -> rebalance -> protect, bounded by the signed policy.");
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
