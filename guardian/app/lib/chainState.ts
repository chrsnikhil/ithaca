import "server-only";
import { ethers } from "ethers";
import { DEPLOYMENTS, FLEX_OWNER } from "./deployments";

// Reads GuardianVault state + its invest/protect history straight from Base Sepolia.
// Used as the source of truth for the dashboard AND the voice agent's get_portfolio when the
// autonomous daemon isn't reachable (e.g. on the serverless host), so the guardian always has
// real vault context to talk about.
const B = DEPLOYMENTS.baseSepolia;
const f6 = (x: bigint) => ethers.formatUnits(x, 6);
const provider = () => new ethers.JsonRpcProvider(B.readRpc);

export async function readChainState() {
  const p = provider();
  const vault = new ethers.Contract(B.GuardianVault, [
    "function position() view returns (uint256)",
    "function idle() view returns (uint256)",
  ], p);
  const usdc = new ethers.Contract(B.aaveUsdc, ["function balanceOf(address) view returns (uint256)"], p);
  const dp = new ethers.Contract(B.aaveDataProvider, [
    "function getReserveData(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40)",
  ], p);
  const [position, idle, havenBal, rd] = await Promise.all([
    vault.position().catch(() => 0n),
    vault.idle().catch(() => 0n),
    usdc.balanceOf(FLEX_OWNER).catch(() => 0n),
    dp.getReserveData(B.aaveUsdc).catch(() => null),
  ]);
  return {
    offline: true, source: "chain",
    idle: f6(idle), position: f6(position), havenBal: f6(havenBal),
    apr: rd ? (Number(rd[5]) / 1e27) * 100 : null,
    haven: FLEX_OWNER, vault: B.GuardianVault, chainId: B.chainId, venue: B.aaveVenue,
    explorerBase: B.explorerBase, dial: false, tick: null, policy: null, risk: null,
  };
}

export async function readChainFeed() {
  try {
    const p = provider();
    const latest = await p.getBlockNumber();
    const iface = new ethers.Interface([
      "event Invested(uint256 amount, uint256 position)",
      "event DeRisked(uint256 amount, uint256 position)",
      "event Protected(address indexed safeHaven, uint256 amount, uint256 nonce, uint256 protectedTotal)",
    ]);
    const logs = await p.getLogs({ address: B.GuardianVault, fromBlock: Math.max(0, latest - 9000), toBlock: latest });
    const map: Record<string, [string, string, string]> = {
      Invested: ["CALM", "INVEST", "Deployed idle USDC to Aave for yield"],
      DeRisked: ["ELEVATED", "DERISK", "Pulled the position back into the vault"],
      Protected: ["DANGER", "PROTECT", "Evacuated USDC to the safe haven"],
    };
    const blockTs: Record<number, number> = {};
    const items = [];
    for (const log of logs) {
      let parsed: ethers.LogDescription | null = null;
      try { parsed = iface.parseLog(log); } catch { continue; }
      if (!parsed || !map[parsed.name]) continue;
      if (!blockTs[log.blockNumber]) blockTs[log.blockNumber] = ((await p.getBlock(log.blockNumber))?.timestamp ?? 0) * 1000;
      const [tier, action, reason] = map[parsed.name];
      items.push({ ts: blockTs[log.blockNumber], tick: null, tier, action, reason, amountUsdc: f6(parsed.args.amount as bigint), txUrl: `${B.explorerBase}/tx/${log.transactionHash}` });
    }
    items.sort((a, b) => b.ts - a.ts);
    return { items, source: "chain" };
  } catch {
    return { items: [] };
  }
}
