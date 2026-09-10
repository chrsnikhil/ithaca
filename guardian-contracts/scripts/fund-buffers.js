// Top up each MockYieldVenue with a USDC yield buffer, so withdrawing an accrued (yield-inflated)
// position never reverts with "transfer amount exceeds balance". The mock only physically holds the
// supplied principal; accrued yield must be pre-funded to be payable on withdraw/evacuate/rebalance.
//   BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com npx hardhat run scripts/fund-buffers.js --network baseSepolia
const { ethers } = require("hardhat");

const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f"; // Aave-test USDC (the multi vault's token)
const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc"; // permissionless mint(token,to,amount)
const BUFFER = 10n * 1_000_000n; // 10 USDC per venue — years of headroom at these APRs

// The three MockYieldVenues behind GuardianVaultMulti (see app/lib/deployments.ts multiMarkets).
const VENUES = [
  { name: "Moonwell (Base)", venue: "0xe423fF8fA6EC43E589f1516149CE71206F2eD99f" },
  { name: "Aave v3", venue: "0x3ee87617e93EcBd5404cccc22dB7542A8449b8CC" },
  { name: "Compound", venue: "0x53335188330e37A4a67c865A30D7Cc891692b751" },
];

async function main() {
  const venues = VENUES;
  const usdc = await ethers.getContractAt(["function balanceOf(address) view returns (uint256)"], USDC);
  const faucet = await ethers.getContractAt(["function mint(address,address,uint256)"], FAUCET);
  const f = (x) => ethers.formatUnits(x, 6);

  for (const m of venues) {
    const before = await usdc.balanceOf(m.venue);
    try {
      const tx = await faucet.mint(USDC, m.venue, BUFFER);
      await tx.wait();
      const after = await usdc.balanceOf(m.venue);
      console.log(`${m.name} (${m.venue}): ${f(before)} → ${f(after)} USDC  [${tx.hash}]`);
    } catch (e) {
      console.log(`${m.name}: mint failed — ${(e.shortMessage || e.message || "").slice(0, 100)}`);
    }
  }
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
