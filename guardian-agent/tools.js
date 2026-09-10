// Guardian — protocol-AGNOSTIC on-chain tool registry (MCP-shaped).
// The guardian agent can read ANY on-chain state (any subgraph, any contract) and reason over it.
// The ONLY value-moving tool is execute_rescue, and it routes through the on-chain GuardVault,
// which hard-bounds it to the Flex-signed mandate. Read anything; move only within the mandate.
//
// Each tool: { name, description, parameters (JSON Schema), execute(args, ctx) }.
// ctx = { apiKey, rpcUrls: {chainId: url}, guard: {rpcUrl, address, agentPrivateKey?, mandate?, mandateSig?} }

const { querySubgraph, fetchTokenPriceUSD } = require("./graph");
const { assessRisk } = require("./risk");
const { ethers } = require("ethers");

function buildTools(ctx) {
  return [
    {
      name: "query_subgraph",
      description:
        "Query ANY protocol's live indexed data via a Graph subgraph (Aave, Compound, Morpho, Uniswap, Lido, GMX, ...). This is how the agent reads any protocol without hardcoding it.",
      parameters: {
        type: "object",
        properties: { subgraphId: { type: "string" }, query: { type: "string", description: "GraphQL query" } },
        required: ["subgraphId", "query"],
      },
      execute: (a) => querySubgraph(a.subgraphId, a.query, { apiKey: ctx.apiKey }),
    },
    {
      name: "get_token_price",
      description: "Live USD price of a token by symbol (USDC, USDT, DAI, ...), sourced from The Graph.",
      parameters: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] },
      execute: async (a) => ({ symbol: a.symbol, price: await fetchTokenPriceUSD(a.symbol, { apiKey: ctx.apiKey }) }),
    },
    {
      name: "read_contract",
      description:
        "Read ANY on-chain contract view/pure function on any chain. e.g. an Aave Pool's getUserAccountData(address) for a health factor, a vault's balanceOf, an oracle's latestAnswer — the agent supplies the ABI fragment, so it works for any protocol.",
      parameters: {
        type: "object",
        properties: {
          chainId: { type: "number" },
          address: { type: "string" },
          abi: { type: "array", items: { type: "string" }, description: "human-readable ABI fragment(s), e.g. ['function totalSupply() view returns (uint256)']" },
          fn: { type: "string" },
          args: { type: "array" },
        },
        required: ["chainId", "address", "abi", "fn"],
      },
      execute: async (a) => {
        const url = ctx.rpcUrls?.[a.chainId];
        if (!url) throw new Error(`no RPC configured for chain ${a.chainId}`);
        const provider = new ethers.JsonRpcProvider(url);
        const address = ethers.getAddress(a.address.toLowerCase()); // accept any casing, re-checksum
        const c = new ethers.Contract(address, a.abi, provider);
        const res = await c[a.fn](...(a.args || []));
        return { result: Array.isArray(res) ? res.map(String) : String(res) };
      },
    },
    {
      name: "assess_risk",
      description:
        "Run Guardian's risk brain over a normalized portfolio { positions:[{symbol,price,isStable,drawdownPct}], healthFactor? }. Returns { danger, severity, reasons }.",
      parameters: { type: "object", properties: { portfolio: { type: "object" } }, required: ["portfolio"] },
      execute: (a) => assessRisk(a.portfolio),
    },
    {
      name: "get_guard_status",
      description: "Read the live GuardVault on Arc: its owner (the Flex signing authority) and the authorized agent.",
      parameters: { type: "object", properties: {} },
      execute: async () => {
        const provider = new ethers.JsonRpcProvider(ctx.guard.rpcUrl);
        const v = new ethers.Contract(ctx.guard.address, [
          "function owner() view returns (address)",
          "function agent() view returns (address)",
        ], provider);
        return { address: ctx.guard.address, owner: await v.owner(), agent: await v.agent() };
      },
    },
    {
      name: "execute_rescue",
      description:
        "Move funds to safety via the GuardVault. THE ONLY value-moving tool. Hard-bounded on-chain to the Flex-signed mandate — reverts if outside the signed cap/haven/expiry. Even a compromised agent cannot exceed the mandate.",
      parameters: { type: "object", properties: { amount: { type: "string", description: "USDC amount, 6 decimals" } }, required: ["amount"] },
      execute: async (a) => {
        const g = ctx.guard;
        if (!g?.agentPrivateKey || !g?.mandate || !g?.mandateSig) throw new Error("guard not armed (need agent key + signed mandate)");
        const provider = new ethers.JsonRpcProvider(g.rpcUrl);
        const agent = new ethers.Wallet(g.agentPrivateKey, provider);
        const v = new ethers.Contract(g.address, [
          "function rescue((uint256,address,uint256,uint256) m, bytes sig, uint256 amount)",
        ], agent);
        const tx = await v.rescue(g.mandate, g.mandateSig, a.amount);
        const rc = await tx.wait();
        return { txHash: rc.hash };
      },
    },
  ];
}

module.exports = { buildTools };
