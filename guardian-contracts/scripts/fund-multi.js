// Fund the multi-vault with Aave-test USDC (Base Sepolia) so the armed guardian can invest.
//   BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com npx hardhat run scripts/fund-multi.js --network baseSepolia
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f"; // Aave-test USDC
const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc"; // permissionless mint(token,to,amount)
const AMOUNT = 100n * 1_000_000n; // 100 USDC

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8")).baseSepolia;
  const vault = dep.GuardianVaultMulti;
  const [signer] = await ethers.getSigners();
  const usdc = await ethers.getContractAt(["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"], USDC);
  const f = (x) => ethers.formatUnits(x, 6);

  console.log("vault:", vault, "| current USDC:", f(await usdc.balanceOf(vault)));

  // Try the faucet (mint straight to the vault). Falls back to sending from the signer if it holds any.
  try {
    const faucet = await ethers.getContractAt(["function mint(address,address,uint256)"], FAUCET);
    const tx = await faucet.mint(USDC, vault, AMOUNT);
    await tx.wait();
    console.log("minted 100 USDC to the vault via faucet:", tx.hash);
  } catch (e) {
    console.log("faucet mint failed:", (e.shortMessage || e.message || "").slice(0, 120));
    const bal = await usdc.balanceOf(signer.address);
    if (bal >= AMOUNT) {
      const tx = await usdc.transfer(vault, AMOUNT);
      await tx.wait();
      console.log("sent 100 USDC to the vault from the signer:", tx.hash);
    } else {
      console.log(`signer holds only ${f(bal)} USDC — faucet timelocked + signer short. Try the faucet later, or send USDC to ${vault} from a funded address.`);
    }
  }
  console.log("vault USDC now:", f(await usdc.balanceOf(vault)));
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
