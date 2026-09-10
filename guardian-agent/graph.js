// Guardian SEE layer — live on-chain data via the canonical Graph Gateway (subgraph queries).
// Key: create at https://thegraph.com/studio (first-party). Auth: Authorization: Bearer <key>.
// NOTE: this network blocks token-api.thegraph.com (connection reset), so we use gateway
// subgraph queries — which is also the stronger "composable/standardized Graph products" fit.

const GATEWAY = "https://gateway.thegraph.com/api/subgraphs/id";

const SUBGRAPHS = {
  uniswapV3Mainnet: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
  // aaveV3Mainnet: "<id>",  // wired next for live health-factor sensing
};

const TOKENS = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
};

async function querySubgraph(subgraphId, query, { apiKey, variables } = {}) {
  if (!apiKey) throw new Error("Missing GRAPH_API_KEY — create one at thegraph.com/studio");
  const res = await fetch(`${GATEWAY}/${subgraphId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 200)}`);
  return json.data;
}

// Live USD price of a token from the Uniswap v3 subgraph (derivedETH * ethPriceUSD).
async function fetchTokenPriceUSD(symbol, { apiKey } = {}) {
  const id = TOKENS[symbol];
  if (!id) throw new Error(`unknown token ${symbol}`);
  const data = await querySubgraph(
    SUBGRAPHS.uniswapV3Mainnet,
    `{ bundle(id:"1"){ ethPriceUSD } token(id:"${id}"){ symbol derivedETH } }`,
    { apiKey }
  );
  return parseFloat(data.token.derivedETH) * parseFloat(data.bundle.ethPriceUSD);
}

// Build a portfolio snapshot for assessRisk() from live Graph data.
// (Live stablecoin prices now for depeg detection; Aave health-factor wired next.)
async function fetchPortfolio({ apiKey, stables = ["USDC", "USDT", "DAI"], healthFactor = null } = {}) {
  const positions = [];
  for (const s of stables) {
    positions.push({ symbol: s, isStable: true, price: await fetchTokenPriceUSD(s, { apiKey }), drawdownPct: null });
  }
  return { positions, healthFactor, at: null };
}

module.exports = { querySubgraph, fetchTokenPriceUSD, fetchPortfolio, GATEWAY, SUBGRAPHS, TOKENS };
