require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PK = process.env.PRIVATE_KEY;
const accounts = PK ? [PK] : [];

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  networks: {
    // Arc testnet — USDC-native gas, chainId 5042002 (0x4cef52)
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts,
    },
    // Arc mainnet — live ~Sep 16 2026, chainId 5042 (0x13b2). RPC/addresses TBD at launch.
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC || "https://rpc.arc.network",
      chainId: 5042,
      accounts,
    },
    // Base Sepolia — where the guarded Aave position lives in v1
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      chainId: 84532,
      accounts,
    },
  },
};
