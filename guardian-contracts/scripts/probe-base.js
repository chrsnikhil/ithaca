const { ethers } = require("hardhat");

// Aave-test USDC on Base Sepolia
const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";

async function main() {
  const [me] = await ethers.getSigners();
  console.log("burner:", me.address);
  console.log("ETH:", ethers.formatEther(await ethers.provider.getBalance(me.address)));

  const usdc = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ], me);
  console.log("USDC:", (await usdc.balanceOf(me.address)).toString(), await usdc.symbol(), "d=", await usdc.decimals());

  // Probe for a public faucet mint. Aave testnet reserve tokens vary; try common signatures.
  for (const sig of ["function mint(address,uint256) returns (bool)", "function mint(uint256) returns (bool)"]) {
    try {
      const c = new ethers.Contract(USDC, [sig], me);
      const fn = c.getFunction("mint");
      const args = sig.includes(",") ? [me.address, 1000n * 1000000n] : [1000n * 1000000n];
      await fn.staticCall(...args);
      console.log("MINTABLE via:", sig);
    } catch (e) {
      console.log("not via", sig, "-", (e.shortMessage || e.message || "").slice(0, 80));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
