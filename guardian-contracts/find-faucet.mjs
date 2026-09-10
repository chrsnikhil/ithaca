import * as book from "@bgd-labs/aave-address-book";

const m = book.AaveV3BaseSepolia;
console.log("All AaveV3BaseSepolia keys:");
for (const k of Object.keys(m)) {
  const v = m[k];
  if (typeof v === "string") console.log(`  ${k}: ${v}`);
}
console.log("\nAny key containing FAUCET/faucet:");
for (const k of Object.keys(m)) {
  if (k.toLowerCase().includes("faucet")) console.log(`  ${k}:`, m[k]);
}
// Also check top-level exports for a faucet
console.log("\nExports containing 'Faucet':", Object.keys(book).filter((k) => k.toLowerCase().includes("faucet")).slice(0, 20));
