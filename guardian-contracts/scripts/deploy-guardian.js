const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Real Aave v3 addresses (from @bgd-labs/aave-address-book).
const CFG = {
  baseSepolia: {
    usdc: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f", // Aave-test USDC
    venue: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27", // Aave v3 Pool
    aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC", // aBasSepUSDC
  },
};

async function main() {
  const c = CFG[network.name];
  if (!c) throw new Error(`no config for ${network.name}`);
  const [deployer] = await ethers.getSigners();
  // owner = the Ledger Flex (signs the Policy on-device). agent = the daemon relayer (burner).
  // initialHaven = where evacuations go (defaults to the owner/Flex). Set at construction so the
  // Flex owner needn't send any on-chain owner tx to arm — just sign the Policy off-chain.
  const owner = process.env.GUARDIAN_OWNER || deployer.address;
  const agent = process.env.GUARDIAN_AGENT || deployer.address;
  const haven = process.env.GUARDIAN_HAVEN || owner;

  const GV = await ethers.getContractFactory("GuardianVault");
  const v = await GV.deploy(owner, c.usdc, c.venue, c.aToken, agent, haven);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log(`GuardianVault on ${network.name}: ${addr}`);
  console.log(`  owner=${owner} agent=${agent} haven=${haven}`);
  console.log(`  usdc=${c.usdc} venue=${c.venue} aToken=${c.aToken}`);

  const depPath = path.join(__dirname, "..", "deployments.json");
  const dep = fs.existsSync(depPath) ? JSON.parse(fs.readFileSync(depPath, "utf8")) : {};
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  dep[network.name] = {
    ...(dep[network.name] || {}),
    chainId,
    GuardianVault: addr,
    aaveUsdc: c.usdc,
    aaveVenue: c.venue,
    aaveAToken: c.aToken,
    guardianOwner: owner,
    guardianAgent: agent,
    guardianHaven: haven,
  };
  fs.writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log("recorded to deployments.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
