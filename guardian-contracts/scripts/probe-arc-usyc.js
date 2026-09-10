// Probe Arc testnet: does USYC (Circle's RWA yield token) + its Teller exist, and what do they
// look like? Decides whether the Arc "invest" tier can route USDC->USYC for real yield, or
// whether we deploy a mock yield venue instead. Read-only.
//   node scripts/probe-arc-usyc.js
const { ethers } = require("ethers");

const RPC = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.network";
const ADDR = {
  USDC: "0x3600000000000000000000000000000000000000",
  USYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
  Teller: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A",
  Entitlements: "0xcc205224862c7641930c87679e98999d23c26113",
};
const ERC20 = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];
// candidate Teller functions seen on USYC/Hashnote tellers
const TELLER_SIGS = [
  "function buy(uint256 amount) returns (uint256)",
  "function sell(uint256 amount) returns (uint256)",
  "function buyFor(uint256 amount, address to) returns (uint256)",
  "function sellFor(uint256 amount, address to) returns (uint256)",
  "function buyPreview(uint256 amount) view returns (uint256)",
  "function sellPreview(uint256 amount) view returns (uint256)",
];

async function main() {
  const p = new ethers.JsonRpcProvider(RPC);
  const net = await p.getNetwork();
  console.log("Arc testnet chainId:", net.chainId.toString(), "(expect 5042002)");

  for (const [name, addr] of Object.entries(ADDR)) {
    const code = await p.getCode(addr);
    const has = code && code !== "0x";
    console.log(`\n${name} ${addr}\n  hasCode: ${has} (bytes ${(code.length - 2) / 2})`);
    if (has && (name === "USDC" || name === "USYC")) {
      const c = new ethers.Contract(addr, ERC20, p);
      for (const fn of ["symbol", "decimals", "totalSupply"]) {
        try { console.log(`  ${fn}: ${(await c[fn]()).toString()}`); } catch (e) { console.log(`  ${fn}: <fail ${e.shortMessage || e.message}>`); }
      }
    }
  }

  // Probe the Teller: which candidate functions actually exist? (staticcall with dummy args;
  // "function not found" reverts differently from "reverted on logic".)
  console.log(`\nTeller function probe (${ADDR.Teller}):`);
  for (const sig of TELLER_SIGS) {
    const iface = new ethers.Interface([sig]);
    const fn = iface.getFunction(sig.split(" ")[1].split("(")[0]);
    const data = iface.encodeFunctionData(fn, fn.inputs.map((i) => (i.type === "address" ? ethers.ZeroAddress : 1n)));
    try {
      await p.call({ to: ADDR.Teller, data });
      console.log(`  ${fn.name}: callable (exists)`);
    } catch (e) {
      const msg = (e.shortMessage || e.message || "").slice(0, 80);
      // a revert usually means the fn EXISTS but reverted on our dummy args; empty return = missing
      console.log(`  ${fn.name}: ${/revert|execution reverted/i.test(msg) ? "exists (reverted on dummy args)" : "likely missing"} [${msg}]`);
    }
  }
}
main().catch((e) => { console.error("PROBE FAILED:", e.shortMessage || e.message || e); process.exit(1); });
