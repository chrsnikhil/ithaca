// Guardian agent — protocol-agnostic, tool-calling.
// With an LLM key (Groq/OpenAI-compatible) it reasons and calls tools autonomously.
// Without one, it runs a deterministic demo that exercises the same tools live.
const fs = require("fs");
const path = require("path");
const { buildTools } = require("./tools");

function loadEnv() {
  const p = path.join(__dirname, ".env");
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs.readFileSync(p, "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}
function loadGuard() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "guardian-contracts", "deployments.json"), "utf8")).arcTestnet;
  } catch { return null; }
}
function makeCtx(env) {
  const g = loadGuard();
  return {
    apiKey: env.GRAPH_API_KEY,
    rpcUrls: {
      1: env.ETH_RPC || "https://ethereum-rpc.publicnode.com",
      8453: env.BASE_RPC || "https://base-rpc.publicnode.com",
      84532: "https://sepolia.base.org",
      5042002: env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.io",
    },
    guard: g ? { rpcUrl: "https://rpc.testnet.arc.io", address: g.GuardVault } : null,
  };
}

async function runDemo(tools, ctx) {
  const call = async (name, args) => {
    const t = tools.find((x) => x.name === name);
    process.stdout.write(`\n[tool] ${name}(${JSON.stringify(args).slice(0, 90)})\n`);
    try { const r = await t.execute(args, ctx); console.log("   ->", JSON.stringify(r).slice(0, 260)); return r; }
    catch (e) { console.log("   ! ", e.message.slice(0, 160)); return null; }
  };
  console.log("Guardian agent — deterministic demo (set LLM_API_KEY for the real reasoning loop).");
  console.log("Tools:", tools.map((t) => t.name).join(", "));

  await call("get_guard_status", {});
  const price = await call("get_token_price", { symbol: "USDC" });
  // generic contract read — proves it can read ANY contract (USDC.totalSupply on Ethereum)
  await call("read_contract", { chainId: 1, address: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48", abi: ["function totalSupply() view returns (uint256)"], fn: "totalSupply", args: [] });
  // generic subgraph read — proves it can read ANY protocol's data (Uniswap v3 TVL here)
  await call("query_subgraph", { subgraphId: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV", query: '{ factory(id:"0x1F98431c8aD98523631AE4a59f267346ea31F984"){ totalValueLockedUSD } }' });

  const portfolio = { positions: [{ symbol: "USDC", isStable: true, price: price?.price ?? 1 }], healthFactor: null };
  const verdict = await call("assess_risk", { portfolio });
  console.log("\nDECISION:", verdict?.danger ? "DANGER -> would call execute_rescue (bounded by the Flex mandate)" : "safe -> hold");
}

async function runLLM(tools, ctx, env, goal) {
  const base = env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
  const model = env.LLM_MODEL || "llama-3.3-70b-versatile";
  const toolSpec = tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const messages = [
    { role: "system", content: "You are Guardian, an autonomous defensive wallet agent. Use tools to read on-chain state (any protocol via subgraphs/contracts), assess risk, and ONLY if there is real danger call execute_rescue. execute_rescue is hard-bounded on-chain to the owner's Flex-signed mandate, so you cannot exceed it. Be concise; explain your decision." },
    { role: "user", content: goal || "Check whether the watched wallet is in danger and act if needed." },
  ];
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
      body: JSON.stringify({ model, messages, tools: toolSpec, tool_choice: "auto" }),
    });
    const j = await res.json();
    const msg = j.choices?.[0]?.message;
    if (!msg) return console.log("LLM error:", JSON.stringify(j).slice(0, 300));
    messages.push(msg);
    if (!msg.tool_calls?.length) return console.log("\nAGENT:", msg.content);
    for (const tc of msg.tool_calls) {
      const t = tools.find((x) => x.name === tc.function.name);
      let out;
      try { out = t ? await t.execute(JSON.parse(tc.function.arguments || "{}"), ctx) : { error: "unknown tool" }; }
      catch (e) { out = { error: e.message }; }
      console.log(`[tool] ${tc.function.name} -> ${JSON.stringify(out).slice(0, 160)}`);
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(out) });
    }
  }
}

(async () => {
  const env = loadEnv();
  const ctx = makeCtx(env);
  const tools = buildTools(ctx);
  if (env.LLM_API_KEY) { console.log(`LLM agent (${env.LLM_MODEL || "groq default"}):`); await runLLM(tools, ctx, env, process.argv[2]); }
  else await runDemo(tools, ctx);
})().catch((e) => { console.error(e); process.exit(1); });
