const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const FLEX = "0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da";
const PROTECT_TX = process.env.PROTECT_TX || "0x0d5d018d335774fc56bd0da73e3dd498d5754a254cc2c75f7852cfcac16b3a67";
const RPCS = ["https://base-sepolia-rpc.publicnode.com", "https://sepolia.base.org"];

async function firstLiveProvider() {
  for (const url of RPCS) {
    try { const p = new ethers.JsonRpcProvider(url); await p.getBlockNumber(); console.log("RPC:", url); return p; }
    catch { /* try next */ }
  }
  throw new Error("no RPC");
}

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8")).baseSepolia;
  const p = await firstLiveProvider();

  const usdc = new ethers.Contract(dep.aaveUsdc, ["function balanceOf(address) view returns (uint256)"], p);
  const vault = new ethers.Contract(dep.GuardianVault, [
    "function position() view returns (uint256)",
    "function idle() view returns (uint256)",
  ], p);

  const [pos, idle, havenBal] = await Promise.all([
    vault.position(), vault.idle(), usdc.balanceOf(FLEX),
  ]);
  console.log("\nGuardianVault state (fresh RPC):");
  console.log("  position (in Aave):", ethers.formatUnits(pos, 6), "USDC");
  console.log("  idle (in vault):   ", ethers.formatUnits(idle, 6), "USDC");
  console.log("  safe haven (Flex): ", ethers.formatUnits(havenBal, 6), "USDC");
  console.log("  conservation:      ", ethers.formatUnits(pos + idle + havenBal, 6), "USDC (funded 1000)");

  // Confirm the protect tx actually transferred USDC to the Flex.
  const rc = await p.getTransactionReceipt(PROTECT_TX);
  const transfer = ethers.id("Transfer(address,address,uint256)");
  const flexTopic = ethers.zeroPadValue(FLEX.toLowerCase(), 32);
  const toFlex = rc.logs.filter((l) => l.address.toLowerCase() === dep.aaveUsdc.toLowerCase()
    && l.topics[0] === transfer && l.topics[2] === flexTopic);
  for (const l of toFlex) console.log("\nprotect tx -> USDC transfer to Flex:", ethers.formatUnits(BigInt(l.data), 6), "USDC");
}

main().catch((e) => { console.error(e); process.exit(1); });
