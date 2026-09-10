// Deployed Guardian contracts (owner = the Ledger Flex). See guardian-contracts/deployments.json.
export const FLEX_OWNER = "0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da";

export const DEPLOYMENTS = {
  arc: {
    chainId: 5042002,
    rpc: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    // GuardianVault v2 on Arc testnet (Flex-owned), invest venue = MockYieldVenue (USYC Teller
    // on mainnet). USDC is Arc's native gas token (6-dec ERC-20 view at 0x3600…).
    GuardianVault: "0xbEa47f1B7C1252EB2a7C758b27f28ea35ae6c193",
    venue: "0x7e2582E5Bef62Ad8c1EdD832E2b6AE6d5e0d2801",
    usdc: "0x3600000000000000000000000000000000000000",
    guardianOwner: FLEX_OWNER,
    // legacy v1 rescue vault (Ledger mandate demo):
    GuardVault: "0xB3c12a16Ae5B7681D1b9d3F66c1debe4c897b0aC",
    MockUSDC: "0x5262B9D3d8243A80F55ce6D9dA8B2019dA58f673",
    // Multi-market vault on Arc testnet (Flex-owned) — same autonomous vault as Base, deployed on
    // Circle's stablecoin L1. USDC is Arc's native gas token (6-dec ERC-20 at 0x3600…). On Arc
    // mainnet the MockYieldVenues swap for the USYC Teller (tokenized T-bill yield), no code change.
    GuardianVaultMulti: "0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808",
    multiMarkets: [
      { id: "moonwell", name: "Moonwell", venue: "0xE98eb72D66e282155A423F085A29e71d5c8fc015", apr: 8.0 },
      { id: "aave", name: "Aave v3", venue: "0x6dB0bA243F5e9713634B5D0706C7b28f83438Afb", apr: 5.0 },
      { id: "compound", name: "Compound", venue: "0x37Ac7B5b8a0a045496936A82D2c78dDFF125ca6E", apr: 6.0 },
    ],
    explorer: "https://testnet.arcscan.app",
  },
  baseSepolia: {
    chainId: 84532,
    rpc: "https://sepolia.base.org",
    // reliable read RPC (sepolia.base.org is load-balanced → stale reads)
    readRpc: "https://base-sepolia-rpc.publicnode.com",
    GuardVaultCCTP: "0xbEa47f1B7C1252EB2a7C758b27f28ea35ae6c193",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    // GuardianVault v2 (autonomous invest+protect), owned by the Ledger Flex + real Aave v3 addresses
    GuardianVault: "0x130E4D571eEa3928d11DC9d9c7C6561C55c6F2fd",
    aaveUsdc: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
    aaveVenue: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    aaveAToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
    aaveDataProvider: "0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b",
    explorerBase: "https://sepolia.basescan.org",
    // Multi-market vault (Flex-owned): the agent allocates across these markets, picking the best
    // risk-adjusted one via graphscout. Venues are MockYieldVenue stand-ins on testnet.
    GuardianVaultMulti: "0x81AEbF68946D62FDf088579A6F6F2c587015e28A",
    multiMarkets: [
      { id: "moonwell", name: "Moonwell (Base)", venue: "0xe423fF8fA6EC43E589f1516149CE71206F2eD99f", apr: 8.0 },
      { id: "aave", name: "Aave v3", venue: "0x3ee87617e93EcBd5404cccc22dB7542A8449b8CC", apr: 5.0 },
      { id: "compound", name: "Compound", venue: "0x53335188330e37A4a67c865A30D7Cc891692b751", apr: 6.0 },
    ],
  },
};
