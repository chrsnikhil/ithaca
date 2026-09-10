const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Aave-test USDC on Base Sepolia (same token the existing vault + faucet use, so funding works).
const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
// The three markets Guardian allocates across. On testnet each is a MockYieldVenue with its own
// APR; `key` is the real market graphscout assesses for risk (drives the picker).
const MARKETS = [
  { key: "moonwell", apr: 800 }, // 8% — highest yield, but graphscout currently flags it `watch`
  { key: "aave", apr: 500 }, // 5%
  { key: "compound", apr: 600 }, // 6%
];

async function main() {
  if (network.name !== "baseSepolia") throw new Error("run with --network baseSepolia");
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("deployer:", deployer.address, "ETH:", ethers.formatEther(bal));
  if (bal === 0n) throw new Error(`deployer has 0 Base Sepolia ETH — fund ${deployer.address} first`);

  const owner = process.env.GUARDIAN_OWNER || deployer.address; // Ledger Flex
  const agent = process.env.GUARDIAN_AGENT || deployer.address; // daemon relayer
  const haven = process.env.GUARDIAN_HAVEN || owner;

  const MYV = await ethers.getContractFactory("MockYieldVenue");
  const venues = [];
  for (const m of MARKETS) {
    const v = await MYV.deploy(USDC, m.apr);
    await v.waitForDeployment();
    const a = await v.getAddress();
    venues.push(a);
    console.log(`venue ${m.key} (${m.apr / 100}%): ${a}`);
  }

  const GV = await ethers.getContractFactory("GuardianVaultMulti");
  const vault = await GV.deploy(owner, USDC, venues, venues, agent, haven);
  await vault.waitForDeployment();
  const addr = await vault.getAddress();
  console.log(`\nGuardianVaultMulti: ${addr}`);
  console.log(`  owner=${owner} agent=${agent} haven=${haven}`);

  const depPath = path.join(__dirname, "..", "deployments.json");
  const dep = fs.existsSync(depPath) ? JSON.parse(fs.readFileSync(depPath, "utf8")) : {};
  dep[network.name] = {
    ...(dep[network.name] || {}),
    GuardianVaultMulti: addr,
    usdc: USDC,
    markets: MARKETS.map((m, i) => ({ ...m, venue: venues[i] })),
    guardianOwner: owner,
    guardianAgent: agent,
    guardianHaven: haven,
  };
  fs.writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log("recorded to deployments.json");
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
