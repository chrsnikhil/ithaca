const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deploy the multi-market Guardian vault on ARC TESTNET (Circle's stablecoin L1). USDC is Arc's
// NATIVE gas token, exposed as a 6-dec ERC-20 at 0x3600…0000 — that's the vault's underlying asset.
// On Arc MAINNET the MockYieldVenues swap for the USYC Teller (tokenized T-bill yield), no code change.
const USDC = "0x3600000000000000000000000000000000000000"; // Arc native USDC (ERC-20 view)
const MARKETS = [
  { key: "moonwell", apr: 800 },
  { key: "aave", apr: 500 },
  { key: "compound", apr: 600 },
];

async function main() {
  if (network.name !== "arcTestnet") throw new Error("run with --network arcTestnet");
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("deployer:", deployer.address, "gas balance:", ethers.formatEther(bal));
  if (bal === 0n) throw new Error(`deployer has 0 Arc gas — fund ${deployer.address} from faucet.circle.com`);

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
  console.log(`\nGuardianVaultMulti (Arc): ${addr}`);
  console.log(`  owner=${owner} agent=${agent} haven=${haven}`);

  const depPath = path.join(__dirname, "..", "deployments.json");
  const dep = fs.existsSync(depPath) ? JSON.parse(fs.readFileSync(depPath, "utf8")) : {};
  dep[network.name] = {
    ...(dep[network.name] || {}),
    chainId: 5042002,
    rpc: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    GuardianVaultMulti: addr,
    usdc: USDC,
    markets: MARKETS.map((m, i) => ({ ...m, venue: venues[i] })),
    guardianOwner: owner,
    guardianAgent: agent,
    guardianHaven: haven,
  };
  fs.writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log("recorded to deployments.json (arcTestnet)");
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
