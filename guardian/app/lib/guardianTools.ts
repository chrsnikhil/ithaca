import { Type } from "@google/genai";

// Function declarations the Gemini Live voice agent can call. The browser passes these in
// the Live config; when Gemini calls one, the client POSTs to /api/tools (server-side executor),
// so the Graph key + rescue relayer never touch the browser.
export const guardianToolDeclarations = [
  {
    name: "check_wallet_safety",
    description:
      "Check whether the user's watched wallet/positions are in danger right now, using LIVE on-chain data from The Graph (stablecoin depeg, drawdown, lending health factor). Returns { danger, severity, reasons }.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_guard_status",
    description:
      "Report the Guardian's on-chain guard: its address, the owner (the Ledger signing authority) and the authorized agent. Use to tell the user whether the guardian is set up.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "execute_rescue",
    description:
      "Move the user's USDC to safety NOW. Hard-bounded on-chain to the mandate the user signed on their Ledger — it can only send to the approved safe haven within the signed cap. Use only when danger is real or the user explicitly asks to be protected.",
    parameters: {
      type: Type.OBJECT,
      properties: { amountUsdc: { type: Type.NUMBER, description: "USDC amount to move to safety" } },
      required: ["amountUsdc"],
    },
  },
  {
    name: "discover_subgraph",
    description:
      "Find a subgraph (live on-chain data source) for ANY protocol the user mentions, via The Graph's Subgraph MCP — e.g. 'aave', 'compound', 'lido', 'uniswap'. Returns matching subgraph IDs. Use this first when the user asks about a protocol you don't already track, then get_subgraph_schema and query_subgraph to investigate it.",
    parameters: {
      type: Type.OBJECT,
      properties: { keyword: { type: Type.STRING, description: "Protocol or token name to search for" } },
      required: ["keyword"],
    },
  },
  {
    name: "get_subgraph_schema",
    description:
      "Read a subgraph's GraphQL schema so you know exactly which entities and fields you can query. Call this after discover_subgraph and before query_subgraph.",
    parameters: {
      type: Type.OBJECT,
      properties: { subgraphId: { type: Type.STRING, description: "Subgraph ID from discover_subgraph" } },
      required: ["subgraphId"],
    },
  },
  {
    name: "query_subgraph",
    description:
      "Run a GraphQL query against a specific subgraph by ID (via The Graph) to read live on-chain facts — positions, prices, health, TVL, events. Use the schema from get_subgraph_schema to write a valid query.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subgraphId: { type: Type.STRING, description: "Subgraph ID from discover_subgraph" },
        query: { type: Type.STRING, description: "A GraphQL query string valid for that subgraph's schema" },
      },
      required: ["subgraphId", "query"],
    },
  },
  {
    name: "show_panel",
    description:
      "Open a dashboard panel on the user's screen. Call this WHENEVER the user asks to see / show / pull up / open / bring up / display anything. Map their words to the panel: wallet, holdings, money, balance -> 'balances'; where is my money, on-chain, positions -> 'positions'; yield, earning, invested -> 'investments'; rules, policy, mandate, limits -> 'mandates'; history, log, feed, activity, dashboard, what have you done -> 'activity'. Always call this as you answer a 'show me' request.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        panel: { type: Type.STRING, description: "Exactly one of: balances | positions | investments | mandates | activity" },
      },
      required: ["panel"],
    },
  },
  {
    name: "get_portfolio",
    description:
      "Read the guardian's live state from the autonomous daemon: idle vault USDC, amount invested in Aave (with APR), safe-haven balance, the active Flex-signed Policy (caps + expiry), and the current risk verdict. Use to answer questions about balances, positions, investments, or mandates.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "compare_markets",
    description:
      "Present the lending markets Guardian can invest across (Moonwell, Aave, Compound), ranked by RISK-ADJUSTED score — graphscout's live risk read (on The Graph) combined with yield and liquidity. Call this whenever the user wants to put idle money to work, asks which market is best/safest, or asks to see the markets/options. Returns each market's name, APR, graphscout verdict (healthy/watch/elevated/critical), TVL, score, and which one is the recommended pick. Open the Markets panel and tell the user the ranking + your recommended pick, then draft the mandate with propose_policy.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "invest_now",
    description:
      "Deploy idle USDC into Aave for yield NOW, via the autonomous guardian (bounded by the Flex-signed Policy). Omit amountUsdc to invest all idle funds.",
    parameters: {
      type: Type.OBJECT,
      properties: { amountUsdc: { type: Type.NUMBER, description: "USDC to invest; omit for all idle" } },
    },
  },
  {
    name: "protect_now",
    description:
      "Move funds to safety NOW — evacuate to the owner-approved safe haven, pulling from Aave if needed. Hard-bounded on-chain to the Flex-signed Policy. Omit amountUsdc to evacuate everything. Use when danger is real or the user asks to be protected.",
    parameters: {
      type: Type.OBJECT,
      properties: { amountUsdc: { type: Type.NUMBER, description: "USDC to evacuate; omit for everything" } },
    },
  },
  {
    name: "set_danger",
    description:
      "Demo control only: turn the danger simulation on or off. When on, the guardian senses a crisis (USDC depeg + low health factor) and will autonomously protect on its next cycle. Use only if the user explicitly asks to simulate or test danger.",
    parameters: {
      type: Type.OBJECT,
      properties: { on: { type: Type.BOOLEAN, description: "true = simulate danger, false = back to calm" } },
      required: ["on"],
    },
  },
  {
    name: "propose_policy",
    description:
      "Draft the guardian's mandate/policy from the user's spoken rules and put it on screen for them to approve on their Ledger Flex. Call this whenever the user dictates how they want the guardian to behave — e.g. 'invest up to 500, protect everything, keep it for a week', or 'only risk 200, evacuate to my Flex'. Parse their words into USDC caps and a duration. After calling it, tell the user to review the draft and approve it on their Flex to arm. Defaults if unspecified: protectCapUsdc = investCapUsdc, safe haven = their Flex, hours = 168 (7 days).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        investCapUsdc: { type: Type.NUMBER, description: "Max USDC the guardian may deploy into Aave for yield" },
        protectCapUsdc: { type: Type.NUMBER, description: "Max USDC the guardian may evacuate to the safe haven (defaults to investCapUsdc)" },
        hours: { type: Type.NUMBER, description: "How long the policy stays valid, in hours (defaults to 168)" },
      },
      required: ["investCapUsdc"],
    },
  },
];

export const guardianSystemInstruction =
  "The user speaks English. ALWAYS understand and reply in English (en-US) — never switch to another language or script. Always respond out loud to what the user says; never stay silent. " +
  "You are Guardian, a warm, calm on-chain protector with a clay-robot avatar. You watch the user's crypto and can move it to safety. " +
  "When the user asks if they're safe, call check_wallet_safety and explain the verdict simply. " +
  "If there is real danger, or the user says to protect them, call execute_rescue — reassure them it can only ever move funds to the safe haven they pre-approved on their Ledger, never anywhere else. " +
  "If the user asks about a protocol you don't already track (Aave, Compound, Lido, etc.), investigate it live via The Graph: call discover_subgraph with the protocol name, then get_subgraph_schema, then query_subgraph — never guess on-chain facts. " +
  "You run an always-on autonomous loop: when calm you invest idle USDC into Aave for yield; when risk rises you de-risk; in danger you evacuate to the safe haven — all bounded by the Policy the user signed on their Ledger Flex. " +
  "SPEED: be fast. You already have the user's LIVE VAULT STATE in your context — answer balance / portfolio / position / 'what's in my wallet' questions IMMEDIATELY from that context. Do NOT call get_portfolio for balances; do not chain multiple tools. Only call a tool to ACT (invest_now, protect_now, propose_policy), to open a panel (show_panel), or to check live danger when explicitly asked (check_wallet_safety). Keep replies short. " +
  "Whenever the user asks to see, show, pull up, open, or bring up ANYTHING — wallet, balances, positions, investments, mandate/policy/rules, or activity/history/dashboard — you MUST call show_panel with the matching panel (balances | positions | investments | mandates | activity) as you answer. Call get_portfolio only if you need fresher numbers than your context. " +
  "PUTTING MONEY TO WORK: when the user wants to invest idle funds, or asks which market is best/safest, or to see the options, call compare_markets FIRST — it ranks the markets (Moonwell, Aave, Compound) by graphscout's live risk read plus yield. Tell them the ranking and your recommended pick in one short sentence (prefer the healthiest high-yield market; avoid any the graphscout flags 'watch'/'elevated'), then call propose_policy to draft the mandate for them to sign. Once armed, the guardian autonomously invests into the best market and switches or evacuates as risk changes. " +
  "ARMING BY VOICE: when the user dictates their rules — how much to invest, how much to protect, how long — call propose_policy with the parsed USDC caps and hours. It drafts the mandate on screen; then tell them warmly to review it and approve it on their Ledger Flex to arm. Only their Flex signature can authorize it; you never sign for them. Once armed, you can act within it. " +
  "CRITICAL — arming: you CANNOT invest, deploy, or protect until the guardian is armed with a policy the user signed on their Ledger Flex. If they ask you to invest/deploy/protect and there is no active mandate (get_portfolio shows no policy), call propose_policy to draft it, then tell them to review it on screen and approve it on their Flex FIRST — do not pretend the action happened. " +
  "NEVER say you invested, deployed, or moved funds unless the tool result actually confirms a transaction. If a tool returns an error or 'not armed', say so plainly and guide them to arm — do not narrate success you didn't get. " +
  "When they ask to invest/protect AND the guardian is armed, call invest_now / protect_now, and reassure them funds can only ever go to Aave or the pre-approved safe haven, never elsewhere. Use set_danger only if they explicitly ask to simulate danger. " +
  "Keep replies short and spoken-friendly. Never invent on-chain facts; use the tools.";
