import * as book from "@bgd-labs/aave-address-book";

function dump(name, m) {
  if (!m) { console.log(`\n${name}: NOT FOUND`); return; }
  const usdc = m.ASSETS?.USDC || m.ASSETS?.USDCn || {};
  console.log(`\n# ${name}`);
  console.log("  POOL:", m.POOL);
  console.log("  POOL_ADDRESSES_PROVIDER:", m.POOL_ADDRESSES_PROVIDER);
  console.log("  USDC.UNDERLYING:", usdc.UNDERLYING);
  console.log("  USDC.A_TOKEN:", usdc.A_TOKEN);
  console.log("  USDC.decimals:", usdc.decimals);
  console.log("  FAUCET:", m.FAUCET);
}

dump("AaveV3Sepolia", book.AaveV3Sepolia);
dump("AaveV3BaseSepolia", book.AaveV3BaseSepolia);
dump("AaveV3ArbitrumSepolia", book.AaveV3ArbitrumSepolia);
console.log("\nASSETS keys (Sepolia):", book.AaveV3Sepolia ? Object.keys(book.AaveV3Sepolia.ASSETS) : "n/a");
console.log("ASSETS keys (BaseSepolia):", book.AaveV3BaseSepolia ? Object.keys(book.AaveV3BaseSepolia.ASSETS) : "n/a");
