/**
 * One-off: run a candidate Messari-lending query against a real subgraph to confirm the
 * exact field names and prove the end-to-end pipeline returns LIVE indexed data.
 *   GRAPH_API_KEY=xxxx npx tsx src/probe.ts <subgraphId>
 */
import { mcpQuery } from "./subgraph-mcp.js";

const log = (...a: unknown[]) => console.error(...a);

const LENDING_PROBE = `{
  lendingProtocols(first: 1) {
    name
    network
    totalValueLockedUSD
    cumulativeUniqueUsers
    cumulativeUniqueBorrowers
  }
  financialsDailySnapshots(first: 7, orderBy: timestamp, orderDirection: desc) {
    timestamp
    totalValueLockedUSD
    totalBorrowBalanceUSD
    totalDepositBalanceUSD
    dailyProtocolSideRevenueUSD
  }
  markets(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
    name
    inputToken { symbol }
    totalValueLockedUSD
    totalDepositBalanceUSD
    totalBorrowBalanceUSD
    maximumLTV
    liquidationThreshold
    isActive
  }
  liquidates(first: 5, orderBy: timestamp, orderDirection: desc) {
    timestamp
    amountUSD
  }
}`;

async function main() {
  const id = process.argv[2] || "C2zniPn45RnLDGzVeGZCx2Sw3GXrbc9gL4ZfL8B8Em2j"; // Aave V2 Ethereum
  log("querying subgraph:", id);
  const res = await mcpQuery(id, LENDING_PROBE);
  log(JSON.stringify(res, null, 2).slice(0, 2500));
  process.exit(0);
}
main().catch((e) => { log("PROBE FAILED:", e); process.exit(1); });
