const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// CCTP V2 (burn side) + Circle USDC per source chain.
const CFG = {
  baseSepolia: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Circle USDC on Base Sepolia
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", // TokenMessengerV2
  },
};

async function main() {
  const c = CFG[network.name];
  if (!c) throw new Error(`no CCTP config for network ${network.name}`);
  const [deployer] = await ethers.getSigners();
  const owner = process.env.GUARD_OWNER || deployer.address; // the Ledger Flex in prod

  const GV = await ethers.getContractFactory("GuardVaultCCTP");
  const v = await GV.deploy(owner, c.usdc, c.tokenMessenger);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log(`✅ GuardVaultCCTP on ${network.name}: ${addr}`);
  console.log(`   owner=${owner}  usdc=${c.usdc}  tokenMessenger=${c.tokenMessenger}`);

  const depPath = path.join(__dirname, "..", "deployments.json");
  const dep = fs.existsSync(depPath) ? JSON.parse(fs.readFileSync(depPath, "utf8")) : {};
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  dep[network.name] = { ...(dep[network.name] || {}), chainId, GuardVaultCCTP: addr, usdc: c.usdc, tokenMessenger: c.tokenMessenger, owner };
  fs.writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log("recorded to deployments.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
