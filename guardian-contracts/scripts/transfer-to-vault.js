const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Transfer idle USDC from the burner to the vault (plain transfer -> increases vault.idle()).
// Reads balances via a reliable RPC (publicnode) to avoid Base Sepolia's stale-read lag.
const AMT = BigInt(Math.round(Number(process.env.FUND_USDC || 100) * 1e6));

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8"))[network.name];
  const [me] = await ethers.getSigners();
  const rp = new ethers.JsonRpcProvider("https://base-sepolia-rpc.publicnode.com");
  const usdcR = new ethers.Contract(dep.aaveUsdc, ["function balanceOf(address) view returns (uint256)"], rp);
  const bal = await usdcR.balanceOf(me.address);
  console.log("burner USDC (publicnode):", ethers.formatUnits(bal, 6));

  const usdc = new ethers.Contract(dep.aaveUsdc, ["function transfer(address,uint256) returns (bool)"], me);
  if (bal >= AMT) {
    for (let i = 0; i < 4; i++) {
      try { const tx = await usdc.transfer(dep.GuardianVault, AMT); const rc = await tx.wait(1); console.log("transferred, tx", rc.hash); break; }
      catch (e) { console.log("retry", i + 1, (e.shortMessage || e.message || "").slice(0, 70)); await new Promise((r) => setTimeout(r, 3000)); }
    }
  } else {
    console.log("burner lacks funds; send some from the Flex to", dep.GuardianVault);
  }
  console.log("vault idle now (publicnode):", ethers.formatUnits(await usdcR.balanceOf(dep.GuardianVault), 6));
}
main().catch((e) => { console.error(e); process.exit(1); });
