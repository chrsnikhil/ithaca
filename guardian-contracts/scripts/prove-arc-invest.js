// Prove the autonomous invest loop LIVE on Arc testnet — a burner-owned proof vault (owner=agent=
// deployer) so we get a real Arc invest tx without needing the Flex. Mirrors the Base proof.
const { ethers, network } = require("hardhat");

const USDC = "0x3600000000000000000000000000000000000000"; // Arc native USDC (6-dec ERC-20 view)
const CHAIN_ID = 5042002;

async function main() {
  if (network.name !== "arcTestnet") throw new Error("run with --network arcTestnet");
  const [d] = await ethers.getSigners();
  const f = (x) => ethers.formatUnits(x, 6);
  const usdc = await ethers.getContractAt(["function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"], USDC);
  console.log("deployer/owner/agent:", d.address, "| USDC:", f(await usdc.balanceOf(d.address)));

  // 1. deploy a burner-owned proof vault (owner=agent=deployer)
  const MYV = await ethers.getContractFactory("MockYieldVenue");
  const venues = [];
  for (const apr of [800, 500, 600]) { const v = await MYV.deploy(USDC, apr); await v.waitForDeployment(); venues.push(await v.getAddress()); }
  const GV = await ethers.getContractFactory("GuardianVaultMulti");
  const vault = await GV.deploy(d.address, USDC, venues, venues, d.address, d.address);
  await vault.waitForDeployment();
  const V = await vault.getAddress();
  console.log("proof vault (Arc):", V, "| venues:", venues.join(", "));

  // 2. fund the vault with 10 USDC
  const amount = 10n * 1_000_000n;
  await (await usdc.transfer(V, amount)).wait();
  console.log("funded vault:", f(await usdc.balanceOf(V)), "USDC");

  // 3. sign a Policy on the deployer key (= owner) for THIS vault's domain
  const domain = { name: "Guardian", version: "1", chainId: CHAIN_ID, verifyingContract: V };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
    { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  const policy = { investCap: amount.toString(), protectCap: amount.toString(), safeHaven: d.address, expiry: (Math.floor(Date.now() / 1000) + 86400).toString(), nonce: "1" };
  const signature = await d.signTypedData(domain, types, policy);
  console.log("policy signed by owner:", ethers.verifyTypedData(domain, types, policy, signature) === d.address ? "✓" : "✗");

  // 4. autonomous invest into the top venue (compound, index 2) — the real Arc invest tx
  const tuple = [policy.investCap, policy.protectCap, policy.safeHaven, policy.expiry, policy.nonce];
  const tx = await vault.invest(tuple, signature, venues[2], amount);
  const rc = await tx.wait();
  console.log("\nAUTONOMOUS INVEST ON ARC — tx:", rc.hash);
  console.log("  https://testnet.arcscan.app/tx/" + rc.hash);
  console.log("  vault totalPosition:", f(await vault.totalPosition()), "| idle:", f(await vault.idle()));
}
main().catch((e) => { console.error(e.shortMessage || e.message || e); process.exit(1); });
