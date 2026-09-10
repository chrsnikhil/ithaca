const { ethers } = require("hardhat");

const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";

async function main() {
  const [me] = await ethers.getSigners();
  const usdc = new ethers.Contract(USDC, ["function owner() view returns (address)"], me);
  let faucet;
  try { faucet = await usdc.owner(); console.log("USDC owner (likely faucet):", faucet); }
  catch (e) { console.log("no owner():", (e.shortMessage || e.message || "").slice(0, 80)); return; }

  // Aave testnet Faucet.mint(address token, address to, uint256 amount) — permissionless
  const amount = 1000n * 1000000n; // 1000 USDC
  const candidates = [
    "function mint(address,address,uint256) returns (uint256)",
    "function mint(address,uint256) returns (uint256)",
  ];
  for (const sig of candidates) {
    try {
      const c = new ethers.Contract(faucet, [sig], me);
      const fn = c.getFunction("mint");
      const args = sig.split(",").length === 3 ? [USDC, me.address, amount] : [USDC, amount];
      await fn.staticCall(...args);
      console.log("FAUCET MINTABLE via:", sig);
    } catch (e) {
      console.log("not via", sig, "-", (e.shortMessage || e.message || "").slice(0, 90));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
