const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const FAUCET = "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc";
const FLEX = "0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da"; // safe haven = Chris's Ledger Flex cold address
const EXPLORER = "https://sepolia.basescan.org/tx/";
const u = (n) => BigInt(Math.round(n * 1e6));

async function send(label, promiseFn) {
  for (let i = 0; i < 4; i++) {
    try {
      const tx = await promiseFn();
      const rc = await tx.wait(1);
      console.log(`  ${label}: ${EXPLORER}${rc.hash}`);
      return rc;
    } catch (e) {
      const msg = (e.shortMessage || e.message || "").slice(0, 100);
      console.log(`  ${label} retry ${i + 1}: ${msg}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error(`${label} failed after retries`);
}

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments.json"), "utf8"))[network.name];
  const [me] = await ethers.getSigners();
  console.log("burner (owner+agent for this proof):", me.address);
  console.log("GuardianVault:", dep.GuardianVault);

  const usdc = new ethers.Contract(dep.aaveUsdc, [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
  ], me);
  const vault = new ethers.Contract(dep.GuardianVault, [
    "function deposit(uint256)",
    "function setAgent(address)",
    "function setSafeHaven(address,bool)",
    "function invest((uint256,address,uint256,address,uint256,uint256),bytes,uint256)",
    "function deRisk(uint256)",
    "function protect((uint256,address,uint256,address,uint256,uint256),bytes,uint256)",
    "function position() view returns (uint256)",
    "function idle() view returns (uint256)",
  ], me);
  const faucet = new ethers.Contract(FAUCET, ["function mint(address,address,uint256) returns (uint256)"], me);

  console.log("\n1) fund via Aave faucet + deposit into the vault");
  await send("faucet.mint 1000 USDC", () => faucet.mint(dep.aaveUsdc, me.address, u(1000)));
  await send("approve vault", () => usdc.approve(dep.GuardianVault, u(1000)));
  await send("deposit 1000", () => vault.deposit(u(1000)));

  console.log("\n2) owner sets policy controls (agent + safe haven)");
  await send("setAgent(burner)", () => vault.setAgent(me.address));
  await send("setSafeHaven(Flex)", () => vault.setSafeHaven(FLEX, true));

  // Policy signed by the owner (burner here; the Flex on the demo instance)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
  const policy = { investCap: u(1000), venue: dep.aaveVenue, protectCap: u(1000), safeHaven: FLEX, expiry, nonce: 1n };
  const domain = { name: "Guardian", version: "1", chainId: dep.chainId, verifyingContract: dep.GuardianVault };
  const types = { Policy: [
    { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
    { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
    { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
  ] };
  const sig = await me.signTypedData(domain, types, policy);
  const P = [policy.investCap, policy.venue, policy.protectCap, policy.safeHaven, policy.expiry, policy.nonce];

  console.log("\n3) CALM -> invest 700 USDC into Aave");
  await send("invest 700", () => vault.invest(P, sig, u(700)));
  console.log(`   position=${await vault.position()} idle=${await vault.idle()}`);

  console.log("\n4) ELEVATED -> de-risk 200 back into the vault");
  await send("deRisk 200", () => vault.deRisk(u(200)));
  console.log(`   position=${await vault.position()} idle=${await vault.idle()}`);

  console.log("\n5) DANGER -> protect 600 to the safe haven (pulls the shortfall from Aave)");
  const havenBefore = await usdc.balanceOf(FLEX);
  await send("protect 600", () => vault.protect(P, sig, u(600)));
  const havenAfter = await usdc.balanceOf(FLEX);
  console.log(`   position=${await vault.position()} idle=${await vault.idle()}`);
  console.log(`   safe haven received: ${havenAfter - havenBefore} (raw 6-dp)`);

  console.log("\nDONE — invest + de-risk + protect all proven live on Base Sepolia.");
}

main().catch((e) => { console.error(e); process.exit(1); });
