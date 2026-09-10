const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// End-to-end proof on Arc: owner (stands in for the Ledger Flex) signs a mandate,
// the autonomous agent rescues WITHIN it, then an over-cap attempt REVERTS on-chain.
async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json")))[network.name];
  const [owner] = await ethers.getSigners(); // deployer = vault owner
  const u = (n) => n * 1_000_000n; // 6-decimal USDC

  const usdc = await ethers.getContractAt("MockUSDC", dep.MockUSDC);
  const vault = await ethers.getContractAt("GuardVault", dep.GuardVault);

  // autonomous agent = fresh key, funded with a little Arc gas
  const agent = ethers.Wallet.createRandom().connect(ethers.provider);
  await (await owner.sendTransaction({ to: agent.address, value: ethers.parseEther("1") })).wait();
  const haven = ethers.Wallet.createRandom().address;
  console.log(`owner=${owner.address}\nagent=${agent.address}\nhaven=${haven}`);

  // policy (owner): authorize the agent + the safe haven
  await (await vault.setAgent(agent.address)).wait();
  await (await vault.setSafeHaven(haven, true)).wait();

  // fund the vault with 100 USDC
  await (await usdc.approve(dep.GuardVault, u(100n))).wait();
  await (await vault.deposit(u(100n))).wait();
  console.log(`vault funded: ${await usdc.balanceOf(dep.GuardVault)} (6dp)`);

  // owner signs the mandate (EIP-712) — this is exactly what the Flex will sign
  const domain = { name: "Guardian", version: "1", chainId: dep.chainId, verifyingContract: dep.GuardVault };
  const types = {
    Mandate: [
      { name: "maxAmount", type: "uint256" },
      { name: "safeHaven", type: "address" },
      { name: "expiry", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };
  const mandate = { maxAmount: u(100n), safeHaven: haven, expiry: 4000000000n, nonce: 1n };
  const sig = await owner.signTypedData(domain, types, mandate);

  // DANGER detected -> agent autonomously rescues 60 USDC (within the mandate)
  await (await vault.connect(agent).rescue(mandate, sig, u(60n))).wait();
  console.log(`RESCUED 60 -> haven balance: ${await usdc.balanceOf(haven)} (6dp)`);

  // BYPASS attempt -> agent tries 50 more (60+50 > 100 cap) -> must revert
  try {
    await (await vault.connect(agent).rescue(mandate, sig, u(50n))).wait();
    console.log("BUG: over-cap did NOT revert");
  } catch (e) {
    console.log("BYPASS REVERTED on-chain (over-cap) — the money-shot works live on Arc");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
