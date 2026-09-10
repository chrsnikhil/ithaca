import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { assessRisk, type Portfolio } from "../../lib/risk";
import { DEPLOYMENTS } from "../../lib/deployments";
import { loadArmed } from "../../lib/armStore";
import { discoverSubgraph, getSubgraphSchema, querySubgraph } from "../../lib/subgraphMcp";
import { stateView } from "../../lib/engine";
import { computeMarkets } from "../../lib/markets";

// Server-side executor for the Gemini voice agent's tool calls.
// Secrets (Graph key, rescue relayer key) stay here, never in the browser. Fully serverless:
// portfolio + markets are read on-chain / via The Graph; invest_now / protect_now are executed
// CLIENT-side (the browser holds the Flex-signed mandate) — those return an ack the agent narrates.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY = "https://gateway.thegraph.com/api/subgraphs/id";
const UNISWAP_V3 = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const TOKENS: Record<string, string> = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
};

async function tokenPriceUSD(symbol: string, apiKey: string): Promise<number> {
  const res = await fetch(`${GATEWAY}/${UNISWAP_V3}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query: `{ bundle(id:"1"){ ethPriceUSD } token(id:"${TOKENS[symbol]}"){ derivedETH } }`,
    }),
  });
  const j = await res.json();
  return parseFloat(j.data.token.derivedETH) * parseFloat(j.data.bundle.ethPriceUSD);
}

// LIVE Graph sensing -> risk verdict. `dangerMode` (demo "danger dial") injects a crisis
// while the underlying data feed stays live (only the trigger scenario is dialed).
async function checkWalletSafety(dangerMode: boolean) {
  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) return { error: "GRAPH_API_KEY not set" };
  const stables = ["USDC", "USDT", "DAI"];
  const prices = await Promise.all(stables.map((s) => tokenPriceUSD(s, apiKey).catch(() => 1)));
  const positions = stables.map((s, i) => ({ symbol: s, isStable: true, price: prices[i] }));
  const portfolio: Portfolio = dangerMode
    ? { positions: [{ symbol: "USDC", isStable: true, price: 0.94 }], healthFactor: 1.03 }
    : { positions };
  return { ...assessRisk(portfolio), prices: positions.map((p) => ({ [p.symbol]: p.price })), dangerMode };
}

async function guardStatus() {
  const p = new ethers.JsonRpcProvider(DEPLOYMENTS.arc.rpc);
  const v = new ethers.Contract(DEPLOYMENTS.arc.GuardVault, [
    "function owner() view returns (address)",
    "function agent() view returns (address)",
  ], p);
  return { address: DEPLOYMENTS.arc.GuardVault, owner: await v.owner(), agent: await v.agent(), explorer: `${DEPLOYMENTS.arc.explorer}/address/${DEPLOYMENTS.arc.GuardVault}` };
}

// Legacy Arc CCTP rescue (server-held mandate). Kept for the Arc track demo.
async function executeRescue(amountUsdc: number) {
  const armed = loadArmed();
  if (!armed) return { ok: false, reason: "guardian not armed — sign a mandate on your Ledger at /arm first" };
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) return { ok: false, reason: "no relayer key (AGENT_PRIVATE_KEY) configured on the server" };
  const provider = new ethers.JsonRpcProvider(DEPLOYMENTS.baseSepolia.rpc);
  const agent = new ethers.Wallet(pk, provider);
  const vault = new ethers.Contract(DEPLOYMENTS.baseSepolia.GuardVaultCCTP, [
    "function rescue((uint256 maxAmount,address safeHaven,uint256 expiry,uint256 nonce) m, bytes sig, uint256 amount)",
  ], agent);
  const m = armed.mandate;
  const amount = BigInt(Math.round(amountUsdc * 1e6));
  const tx = await vault.rescue([m.maxAmount, m.safeHaven, m.expiry, m.nonce], armed.signature, amount);
  const rc = await tx.wait();
  return { ok: true, txHash: rc?.hash };
}

export async function POST(req: NextRequest) {
  try {
    const { name, args } = await req.json();
    if (name === "check_wallet_safety") return Response.json(await checkWalletSafety(Boolean(args?.dangerMode ?? process.env.DANGER_DIAL === "on")));
    if (name === "get_guard_status") return Response.json(await guardStatus());
    if (name === "execute_rescue") return Response.json(await executeRescue(Number(args?.amountUsdc ?? 0)));
    // real multi-vault balances/positions + live market ranking, read serverless-side
    if (name === "get_portfolio") return Response.json(await stateView());
    if (name === "compare_markets") {
      const markets = (await computeMarkets()) as Array<{ pick?: boolean }>;
      return Response.json({ markets, pick: markets.find((m) => m.pick) ?? null });
    }
    // invest_now / protect_now execute CLIENT-side (the browser holds the Flex-signed mandate).
    // The client fires the action when the tool is called; here we just acknowledge so the agent
    // can narrate it. Name the ACTUAL pick so the agent never guesses the wrong market.
    if (name === "invest_now") {
      const markets = (await computeMarkets()) as Array<{ name: string; verdict?: string; pick?: boolean }>;
      const pick = markets.find((m) => m.pick);
      return Response.json({ ok: true, ack: true, pick: pick?.name ?? null, note: `Deploying idle USDC into ${pick?.name ?? "the best market"}${pick?.verdict ? ` (graphscout: ${pick.verdict})` : ""} now — executing on your device. Tell the user which market and that it's happening.` });
    }
    if (name === "protect_now") return Response.json({ ok: true, ack: true, note: "Evacuating everything to your safe haven now — executing on your device." });
    if (name === "set_danger") return Response.json({ ok: true, ack: true, danger: Boolean(args?.on) });
    if (name === "discover_subgraph") return Response.json({ result: await discoverSubgraph(String(args?.keyword ?? "")) });
    if (name === "get_subgraph_schema") return Response.json({ schema: await getSubgraphSchema(String(args?.subgraphId ?? "")) });
    if (name === "query_subgraph") return Response.json({ result: await querySubgraph(String(args?.subgraphId ?? ""), String(args?.query ?? ""), args?.variables) });
    return Response.json({ error: `unknown tool ${name}` }, { status: 400 });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
