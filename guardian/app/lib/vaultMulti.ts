import "server-only";
import { ethers } from "ethers";
import { DEPLOYMENTS, FLEX_OWNER, type Network } from "./deployments";

// Serverless ACT layer for GuardianVaultMulti — the multi-market vault. This is the daemon's
// "hands" ported to run inside Vercel API routes: verify the Flex-signed Policy/Escalation, then
// execute bounded actions with the agent relayer key (AGENT_PRIVATE_KEY, server-only). The vault
// itself re-verifies every signature on-chain, so a leaked agent key still can't exceed the mandate.
//
// NETWORK-AWARE: `vaultFor(network)` returns the same executor API bound to the chosen chain's
// Flex-owned vault (VAULT/RPC/EXPLORER/CHAIN_ID/MARKETS/DEFAULT_TOKEN/DOMAIN all derived from
// DEPLOYMENTS[network]). It defaults to "baseSepolia", so every caller that omits a network keeps
// the exact Base Sepolia behavior it had before.

export type Policy = { investCap: string; protectCap: string; safeHaven: string; expiry: string; nonce: string };
export type Escalation = { amount: string; safeHaven: string; expiry: string; nonce: string };
export type MultiState = {
  idle: string; total: string; positions: Record<string, string>;
  havenBal: string; haven: string; owner: string; agent: string;
  vault: string; chainId: number; explorerBase: string;
};

const VAULT_ABI = [
  "function invest((uint256,uint256,address,uint256,uint256),bytes,address,uint256)",
  "function deRisk(address,uint256)",
  "function rebalance(address,address,uint256)",
  "function protect((uint256,uint256,address,uint256,uint256),bytes,uint256)",
  "function approveAndProtect((uint256,address,uint256,uint256),bytes,uint256)",
  "function positionOf(address) view returns (uint256)",
  "function totalPosition() view returns (uint256)",
  "function idle() view returns (uint256)",
  "function owner() view returns (address)",
  "function agent() view returns (address)",
  "function usdc() view returns (address)",
];
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

const f6 = (x: bigint) => ethers.formatUnits(x, 6);
const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 160);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Resolve the per-network config from DEPLOYMENTS (no hardcoded addresses). Base reads via
// publicnode (sepolia.base.org is load-balanced → stale reads); Arc reads via its testnet RPC. The
// multi vault holds Base's Aave USDC on Base and Arc's native USDC on Arc.
function netCfg(network: Network) {
  if (network === "arc") {
    const A = DEPLOYMENTS.arc;
    return {
      RPC: process.env.ARC_RPC || A.rpc,
      EXPLORER: A.explorer,
      CHAIN_ID: A.chainId,
      VAULT: A.GuardianVaultMulti,
      MARKETS: A.multiMarkets,
      DEFAULT_TOKEN: A.usdc,
    };
  }
  const B = DEPLOYMENTS.baseSepolia;
  return {
    RPC: process.env.BASE_SEPOLIA_RPC || B.readRpc,
    EXPLORER: B.explorerBase,
    CHAIN_ID: B.chainId,
    VAULT: B.GuardianVaultMulti,
    MARKETS: B.multiMarkets,
    DEFAULT_TOKEN: B.aaveUsdc, // the token the multi vault actually holds (read via usdc() when possible)
  };
}

export function vaultFor(network: Network = "baseSepolia") {
  const { RPC, EXPLORER, CHAIN_ID, VAULT, MARKETS, DEFAULT_TOKEN } = netCfg(network);

  const venueOf = (id: string) => MARKETS.find((m) => m.id === id)?.venue ?? null;
  const marketByVenue = (v?: string) =>
    v ? MARKETS.find((m) => m.venue.toLowerCase() === v.toLowerCase()) ?? null : null;

  const DOMAIN = { name: "Guardian", version: "1", chainId: CHAIN_ID, verifyingContract: VAULT };
  const POLICY_TYPE = {
    Policy: [
      { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
      { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
    ],
  };
  const ESC_TYPE = {
    Escalation: [
      { name: "amount", type: "uint256" }, { name: "safeHaven", type: "address" },
      { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
    ],
  };

  function provider() { return new ethers.JsonRpcProvider(RPC); }
  function agentWallet() {
    const pk = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!pk) throw new Error("AGENT_PRIVATE_KEY not set on the server");
    return new ethers.Wallet(pk, provider());
  }
  const readVault = () => new ethers.Contract(VAULT, VAULT_ABI, provider());
  const writeVault = () => new ethers.Contract(VAULT, VAULT_ABI, agentWallet());

  // --- signature verification (defense in depth; the vault also verifies on-chain) ---
  function verifyPolicy(policy: Policy, signature: string): { ok: boolean; signer?: string; error?: string } {
    try {
      const recovered = ethers.verifyTypedData(DOMAIN, POLICY_TYPE, policy, signature);
      if (recovered.toLowerCase() !== FLEX_OWNER.toLowerCase())
        return { ok: false, signer: recovered, error: `signer ${recovered.slice(0, 10)}… is not the Flex owner` };
      if (Number(policy.expiry) * 1000 < Date.now())
        return { ok: false, signer: recovered, error: "mandate expired — re-arm on your Flex" };
      return { ok: true, signer: recovered };
    } catch (e) { return { ok: false, error: "bad signature: " + short(e) }; }
  }
  function verifyEscalation(e: Escalation, signature: string): { ok: boolean; signer?: string; error?: string } {
    try {
      const recovered = ethers.verifyTypedData(DOMAIN, ESC_TYPE, e, signature);
      if (recovered.toLowerCase() !== FLEX_OWNER.toLowerCase())
        return { ok: false, signer: recovered, error: `signer ${recovered.slice(0, 10)}… is not the Flex owner` };
      return { ok: true, signer: recovered };
    } catch (err) { return { ok: false, error: "bad signature: " + short(err) }; }
  }

  // --- reads ---
  async function readMultiState(haven?: string): Promise<MultiState> {
    const v = readVault();
    const positions: Record<string, string> = {};
    await Promise.all(MARKETS.map(async (m) => {
      try { positions[m.id] = (await v.positionOf(m.venue)).toString(); } catch { positions[m.id] = "0"; }
    }));
    const havenAddr = haven || FLEX_OWNER;
    let token = DEFAULT_TOKEN;
    try { token = await v.usdc(); } catch { /* fall back to the known token */ }
    const usdc = new ethers.Contract(token, ERC20_ABI, provider());
    const [idle, total, havenBal, owner, agent] = await Promise.all([
      v.idle().catch(() => 0n),
      v.totalPosition().catch(() => 0n),
      usdc.balanceOf(havenAddr).catch(() => 0n),
      v.owner().catch(() => FLEX_OWNER),
      v.agent().catch(() => ethers.ZeroAddress),
    ]);
    return {
      idle: idle.toString(), total: total.toString(), positions,
      havenBal: havenBal.toString(), haven: havenAddr, owner, agent,
      vault: VAULT, chainId: CHAIN_ID, explorerBase: EXPLORER,
    };
  }

  // The invest/protect history, straight from chain — so the deployed app's Activity feed is real
  // even with no daemon.
  async function readMultiFeed() {
    try {
      const p = provider();
      const latest = await p.getBlockNumber();
      const iface = new ethers.Interface([
        "event Invested(address indexed venue, uint256 amount, uint256 venuePosition)",
        "event DeRisked(address indexed venue, uint256 amount, uint256 venuePosition)",
        "event Rebalanced(address indexed fromVenue, address indexed toVenue, uint256 amount)",
        "event Protected(address indexed safeHaven, uint256 amount, uint256 nonce, uint256 protectedTotal)",
        "event Escalated(address indexed safeHaven, uint256 amount, uint256 nonce)",
      ]);
      const meta: Record<string, [string, string, (a: ethers.LogDescription) => string]> = {
        Invested: ["CALM", "INVEST", (a) => `Deployed into ${marketByVenue(a.args.venue as string)?.name ?? "a market"}`],
        DeRisked: ["ELEVATED", "DERISK", (a) => `Pulled back from ${marketByVenue(a.args.venue as string)?.name ?? "a market"}`],
        Rebalanced: ["ELEVATED", "REBALANCE", (a) => `Switched ${marketByVenue(a.args.fromVenue as string)?.name ?? "?"} → ${marketByVenue(a.args.toVenue as string)?.name ?? "?"}`],
        Protected: ["DANGER", "PROTECT", () => "Evacuated to your safe haven"],
        Escalated: ["DANGER", "ESCALATE", () => "High-risk evacuation approved on your Flex"],
      };
      const logs = await p.getLogs({ address: VAULT, fromBlock: Math.max(0, latest - 9000), toBlock: latest });
      const blockTs: Record<number, number> = {};
      const items: Array<Record<string, unknown>> = [];
      for (const log of logs) {
        let parsed: ethers.LogDescription | null = null;
        try { parsed = iface.parseLog(log); } catch { continue; }
        if (!parsed || !meta[parsed.name]) continue;
        if (!blockTs[log.blockNumber]) blockTs[log.blockNumber] = ((await p.getBlock(log.blockNumber))?.timestamp ?? 0) * 1000;
        const [tier, action, reasonFn] = meta[parsed.name];
        items.push({
          ts: blockTs[log.blockNumber], tick: null, tier, action, reason: reasonFn(parsed),
          amountUsdc: f6(parsed.args.amount as bigint), txUrl: `${EXPLORER}/tx/${log.transactionHash}`,
        });
      }
      items.sort((a, b) => (b.ts as number) - (a.ts as number));
      return { items, source: "chain" };
    } catch { return { items: [] }; }
  }

  // --- bounded actions (broadcast + best-effort wait for one confirmation) ---
  async function send(fn: () => Promise<ethers.ContractTransactionResponse>, tries = 2): Promise<{ hash: string; url: string }> {
    let last: unknown;
    for (let i = 0; i < tries; i++) {
      try {
        const tx = await fn();
        // wait for mining so the caller's next tick sees settled state (prevents double-acting on
        // a still-pending tx). Best effort — return the hash even if the wait times out.
        try { await Promise.race([tx.wait(1), new Promise((_, rej) => setTimeout(() => rej(new Error("wait-timeout")), 40000))]); } catch { /* broadcast already sent */ }
        return { hash: tx.hash, url: `${EXPLORER}/tx/${tx.hash}` };
      } catch (e) { last = e; await sleep(2000); } // fn() threw => broadcast failed => safe to retry
    }
    throw last;
  }

  const pt = (p: Policy) => [p.investCap, p.protectCap, p.safeHaven, p.expiry, p.nonce];
  const et = (e: Escalation) => [e.amount, e.safeHaven, e.expiry, e.nonce];

  const invest = (p: Policy, sig: string, venue: string, amount: bigint) =>
    send(() => writeVault().invest(pt(p), sig, venue, amount) as Promise<ethers.ContractTransactionResponse>);
  const deRisk = (venue: string, amount: bigint) =>
    send(() => writeVault().deRisk(venue, amount) as Promise<ethers.ContractTransactionResponse>);
  const rebalance = (from: string, to: string, amount: bigint) =>
    send(() => writeVault().rebalance(from, to, amount) as Promise<ethers.ContractTransactionResponse>);
  const protect = (p: Policy, sig: string, amount: bigint) =>
    send(() => writeVault().protect(pt(p), sig, amount) as Promise<ethers.ContractTransactionResponse>);
  const approveAndProtect = (e: Escalation, sig: string, amount: bigint) =>
    send(() => writeVault().approveAndProtect(et(e), sig, amount) as Promise<ethers.ContractTransactionResponse>);

  return {
    network, VAULT, CHAIN_ID, EXPLORER, MARKETS,
    venueOf, marketByVenue, provider, agentWallet,
    verifyPolicy, verifyEscalation, readMultiState, readMultiFeed,
    invest, deRisk, rebalance, protect, approveAndProtect,
  };
}
