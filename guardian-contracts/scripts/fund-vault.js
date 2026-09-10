const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Fund the current GuardianVault with idle USDC (best-effort faucet mint -> plain transfer, which
// increases the vault's idle balance without needing approve/deposit).
const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc";
const AMT = BigInt(Math.round(Number(process.env.FUND_USDC || 100) * 1e6));

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8"))[network.name];
  const [me] = await ethers.getSigners();
  const usdc = new ethers.Contract(dep.aaveUsdc, [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)",
  ], me);
  const faucet = new ethers.Contract(FAUCET, ["function mint(address,address,uint256) returns (uint256)"], me);

  try { const tx = await faucet.mint(dep.aaveUsdc, me.address, AMT); await tx.wait(1); console.log("faucet minted", ethers.formatUnits(AMT, 6)); }
  catch (e) { console.log("faucet skipped:", (e.shortMessage || e.message || "").slice(0, 70)); }

  const bal = await usdc.balanceOf(me.address);
  console.log("burner USDC:", ethers.formatUnits(bal, 6));
  if (bal >= AMT) {
    const tx2 = await usdc.transfer(dep.GuardianVault, AMT); await tx2.wait(1);
    console.log(`transferred ${ethers.formatUnits(AMT, 6)} USDC -> vault ${dep.GuardianVault}`);
  } else {
    console.log("not enough USDC on the burner to fund; send some from the Flex to the vault instead");
  }
  console.log("vault idle now:", ethers.formatUnits(await usdc.balanceOf(dep.GuardianVault), 6));
}
main().catch((e) => { console.error(e); process.exit(1); });
