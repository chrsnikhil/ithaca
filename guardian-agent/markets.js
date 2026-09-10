// Guardian's allowlisted markets (the multi-venue set the vault invests across).
// On testnet, `venue` is a deployed MockYieldVenue address (filled in after deploy);
// `graphKey` is the real market graphscout assesses for live risk; `apr` is the venue's yield.
// APRs are set so the risk/yield tradeoff is real: Moonwell offers the most yield but is the
// riskiest (graphscout currently flags it `watch`), so the Conservative picker should prefer a
// healthy market unless Moonwell is calm.
// venue = deployed MockYieldVenue on Base Sepolia (in the Flex-owned GuardianVaultMulti
// 0x930D564843a4062E13c1AeF8fD3f46A932BFA31E). graphKey = the real market graphscout assesses.
module.exports = [
  { id: "moonwell", name: "Moonwell (Base)", graphKey: "moonwell", apr: 8.0, venue: "0xe423fF8fA6EC43E589f1516149CE71206F2eD99f" },
  { id: "aave", name: "Aave v3", graphKey: "aave", apr: 5.0, venue: "0x3ee87617e93EcBd5404cccc22dB7542A8449b8CC" },
  { id: "compound", name: "Compound", graphKey: "compound", apr: 6.0, venue: "0x53335188330e37A4a67c865A30D7Cc891692b751" },
];
