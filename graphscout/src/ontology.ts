/**
 * The SEMANTIC layer — graphscout's actual IP.
 *
 * The Subgraph MCP knows how to fetch rows; it does NOT know that for a lending protocol
 * "risky" means utilization/liquidations/TVL-flight, while for a DEX it means
 * liquidity/volume collapse. This file encodes that domain knowledge: protocol archetypes,
 * the risk factors that matter for each, and how to detect a protocol's archetype from its
 * schema.
 *
 * The leverage: most major protocols publish MESSARI-STANDARDIZED subgraphs that share a
 * common schema (Protocol/Market/FinancialsDailySnapshot/UsageMetricsDailySnapshot/...).
 * So one recipe per archetype generalizes across dozens of real protocols — that's what
 * makes this reusable infrastructure rather than a per-protocol hack.
 */
import type { Distilled } from "./distill.js";

export type Category = "lending" | "dex" | "yield" | "generic";

export interface RiskFactor {
  key: string;
  label: string;
  meaning: string;
  direction: "up_is_risk" | "down_is_risk" | "context";
}

export const CATEGORY_SUMMARY: Record<Category, string> = {
  lending: "A money market: users supply assets to earn yield and borrow against collateral. Health hinges on liquidity, utilization, and orderly liquidations.",
  dex: "An automated market maker: liquidity providers pool assets and traders swap against them. Health hinges on pooled liquidity and trading volume.",
  yield: "A yield aggregator / vault: deposits are routed into strategies. Health hinges on TVL retention and strategy performance.",
  generic: "A protocol indexed with the Messari standard schema. Health is read from shared TVL / usage / revenue metrics.",
};

export const RISK_FACTORS: Record<Category, RiskFactor[]> = {
  lending: [
    { key: "tvl_trend", label: "TVL trend", meaning: "Falling total value locked signals depositor flight and declining confidence.", direction: "down_is_risk" },
    { key: "utilization", label: "Utilization", meaning: "Borrowed / supplied. Very high utilization leaves little free liquidity for withdrawals.", direction: "up_is_risk" },
    { key: "liquidation_spike", label: "Liquidation spike", meaning: "A surge in liquidations means collateral is being seized — market stress / cascade risk.", direction: "up_is_risk" },
    { key: "concentration", label: "Market concentration", meaning: "TVL dominated by one asset means a single de-peg or exploit hits the whole protocol.", direction: "up_is_risk" },
    { key: "inactive_markets", label: "Inactive markets", meaning: "Paused/frozen markets can indicate risk mitigation already underway.", direction: "context" },
    { key: "revenue_trend", label: "Revenue trend", meaning: "Falling protocol revenue indicates declining usage.", direction: "down_is_risk" },
  ],
  dex: [
    { key: "tvl_trend", label: "Liquidity (TVL) trend", meaning: "Falling pooled liquidity worsens slippage and can precede an LP exodus.", direction: "down_is_risk" },
    { key: "usage_trend", label: "Usage trend", meaning: "Collapsing activity means fee income and price efficiency are drying up.", direction: "down_is_risk" },
    { key: "concentration", label: "Pool concentration", meaning: "Liquidity concentrated in one pool concentrates impermanent-loss and exploit risk.", direction: "up_is_risk" },
  ],
  yield: [
    { key: "tvl_trend", label: "TVL trend", meaning: "Falling deposits signal declining trust in the strategy.", direction: "down_is_risk" },
    { key: "usage_trend", label: "Usage trend", meaning: "Falling active users signals declining adoption.", direction: "down_is_risk" },
  ],
  generic: [
    { key: "tvl_trend", label: "TVL trend", meaning: "Falling total value locked signals declining confidence.", direction: "down_is_risk" },
    { key: "usage_trend", label: "Usage trend", meaning: "Falling active users / transactions signals declining adoption.", direction: "down_is_risk" },
  ],
};

const PROTOCOL_ENTITY_RE = /(Protocol|Aggregator)$/;

/** Messari standardized subgraphs expose exactly one *Protocol / *Aggregator root entity. */
export function detectProtocolEntity(d: Distilled): string | undefined {
  return (
    d.entityNames.find((n) => PROTOCOL_ENTITY_RE.test(n) && n !== "Protocol") ??
    (d.entityNames.includes("Protocol") ? "Protocol" : undefined)
  );
}

export function isMessariStandard(d: Distilled): boolean {
  return d.entityNames.includes("FinancialsDailySnapshot") && !!detectProtocolEntity(d);
}

export function categoryOf(protocolEntity: string | undefined, entityNames: string[]): Category {
  const n = protocolEntity ?? "";
  if (/Lending/i.test(n) || (entityNames.includes("Market") && entityNames.includes("Liquidate"))) return "lending";
  if (/Dex|Amm|Exchange/i.test(n) || entityNames.includes("LiquidityPool")) return "dex";
  if (/Yield|Aggregator/i.test(n) || entityNames.includes("Vault")) return "yield";
  return "generic";
}

/** The Graph auto-generates a plural query field per @entity: `Market` -> `markets`. */
export function pluralize(entity: string): string {
  return entity.charAt(0).toLowerCase() + entity.slice(1) + "s";
}
