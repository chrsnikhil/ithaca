const { Wallet, JsonRpcProvider, formatEther } = require("ethers");
const fs = require("fs");
const path = require("path");

// Generates a fresh BURNER testnet wallet and writes it into .env (private key never printed).
async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    console.log(".env already exists — leaving it untouched (delete it first for a new wallet).");
    return;
  }
  const w = Wallet.createRandom();
  const env = [
    "# Auto-generated BURNER testnet wallet. Throwaway only — never send real funds here.",
    `PRIVATE_KEY=${w.privateKey}`,
    "GUARD_OWNER=",
    "USDC_ADDRESS=",
    "ARC_TESTNET_RPC=https://rpc.testnet.arc.io",
    "BASE_SEPOLIA_RPC=https://sepolia.base.org",
    "",
  ].join("\n");
  fs.writeFileSync(envPath, env, { encoding: "utf8" });
  console.log("Wrote .env with a fresh burner key.");
  console.log("DEPLOYER ADDRESS: " + w.address);
  try {
    const provider = new JsonRpcProvider("https://rpc.testnet.arc.io");
    const bal = await provider.getBalance(w.address);
    console.log("Arc testnet balance: " + formatEther(bal) + "  (fund via faucet.circle.com)");
  } catch (e) {
    console.log("(couldn't query Arc balance: " + e.message + ")");
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
