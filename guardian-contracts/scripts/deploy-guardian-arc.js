const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Arc's USDC ERC-20 view (6 decimals). Gas on Arc is ALSO paid in USDC — so the deployer
// needs testnet USDC from https://faucet.circle.com before this can run.
const ARC = {
  arcTestnet: { usdc: "0x3600000000000000000000000000000000000000" },
  arcMainnet: { usdc: process.env.ARC_MAINNET_USDC || "0x3600000000000000000000000000000000000000" },
};
const APR_BPS = Number(process.env.YIELD_APR_BPS || 500); // mock venue APR (5%)

async function main() {
  const c = ARC[network.name];
  if (!c) throw new Error(`deploy-guardian-arc is for arcTestnet/arcMainnet, not ${network.name}`);

  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`network: ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`deployer gas balance (native USDC, 18-dec view): ${ethers.formatEther(bal)}`);
  if (bal === 0n) {
    throw new Error(`deployer has 0 gas. Fund ${deployer.address} with testnet USDC at https://faucet.circle.com (gas on Arc is USDC), then re-run.`);
  }

  const owner = process.env.GUARDIAN_OWNER || deployer.address; // the Ledger Flex
  const agent = process.env.GUARDIAN_AGENT || deployer.address; // the daemon relayer (burner)
  const haven = process.env.GUARDIAN_HAVEN || owner;            // evacuation destination

  // 1) the Arc-native yield venue (stands in for the entitlement-gated USYC Teller on testnet)
  const MYV = await ethers.getContractFactory("MockYieldVenue");
  const venue = await MYV.deploy(c.usdc, APR_BPS);
  await venue.waitForDeployment();
  const venueAddr = await venue.getAddress();
  console.log(`MockYieldVenue: ${venueAddr}  (apr ${APR_BPS / 100}%)`);

  // 2) GuardianVault (unchanged) pointing at the Arc venue. venue IS the aToken (accruing receipt).
  const GV = await ethers.getContractFactory("GuardianVault");
  const v = await GV.deploy(owner, c.usdc, venueAddr, venueAddr, agent, haven);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log(`GuardianVault on ${network.name}: ${addr}`);
  console.log(`  owner=${owner} agent=${agent} haven=${haven}`);
  console.log(`  usdc=${c.usdc} venue=${venueAddr}`);

  const depPath = path.join(__dirname, "..", "deployments.json");
  const dep = fs.existsSync(depPath) ? JSON.parse(fs.readFileSync(depPath, "utf8")) : {};
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  dep[network.name] = {
    ...(dep[network.name] || {}),
    chainId,
    GuardianVault: addr,
    usdc: c.usdc,
    venue: venueAddr,
    aToken: venueAddr,
    yieldAprBps: APR_BPS,
    guardianOwner: owner,
    guardianAgent: agent,
    guardianHaven: haven,
    note: "MockYieldVenue stands in for USYC Teller (entitlement-gated) on testnet.",
  };
  fs.writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log("recorded to deployments.json");
}

main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
