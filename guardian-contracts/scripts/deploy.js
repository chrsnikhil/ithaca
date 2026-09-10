const { ethers, network } = require("hardhat");

// Deploy GuardVault (+ a MockUSDC if no real USDC address is given) to the target network.
// Usage: npx hardhat run scripts/deploy.js --network arcTestnet
async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.GUARD_OWNER || deployer.address; // the Ledger Flex address in prod
  console.log(`Network: ${network.name} | Deployer: ${deployer.address} | Owner: ${owner}`);

  // Use the real USDC on the chain if provided; otherwise deploy a MockUSDC for testing.
  let usdcAddr = process.env.USDC_ADDRESS;
  if (!usdcAddr) {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddr = await usdc.getAddress();
    console.log(`MockUSDC deployed: ${usdcAddr}`);
  } else {
    console.log(`Using USDC: ${usdcAddr}`);
  }

  const GuardVault = await ethers.getContractFactory("GuardVault");
  const vault = await GuardVault.deploy(owner, usdcAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`\n✅ GuardVault deployed: ${vaultAddr}`);
  console.log(`   owner (mandate signer): ${owner}`);
  console.log(`   usdc: ${usdcAddr}`);
  console.log(`\nNext: owner calls setAgent(<relayer>) and setSafeHaven(<arc safe-haven>, true).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
