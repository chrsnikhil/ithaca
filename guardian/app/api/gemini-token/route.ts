import { GoogleGenAI, Modality } from "@google/genai";
import { guardianToolDeclarations, guardianSystemInstruction } from "../../lib/guardianTools";
import { stateView } from "../../lib/engine";

// Mints a short-lived ephemeral token so the browser can open a Gemini Live session WITHOUT ever
// seeing GEMINI_API_KEY. CRITICAL: with ephemeral tokens the session config is LOCKED here via
// liveConnectConstraints — client-provided systemInstruction/tools are ignored. So we bake the
// tools AND a live vault snapshot into the token's system instruction server-side; the browser
// just connects with the token and its config applies.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-latest";

// A distinct Gemini prebuilt voice per character.
const VOICES: Record<string, string> = {
  tv: "Charon",      // Guardian — deep, steady
  dog: "Puck",       // Biscuit — upbeat
  bungirl: "Aoede",  // Juno — breezy
  ginger: "Kore",    // Ginger — firm
  alien: "Zephyr",   // Nova — bright
};

// Real multi-vault balances + live market ranking, read serverless-side (no daemon).
async function liveState(): Promise<Record<string, unknown> | null> {
  try { return await stateView(); } catch { return null; }
}

async function buildSystemInstruction(): Promise<string> {
  const s = await liveState();
  if (!s) return guardianSystemInstruction;
  const policy = s.policy as { investCap: string; protectCap: string; safeHaven: string } | null;
  const risk = s.risk as { reasons?: string[] } | null;
  const apr = typeof s.apr === "number" ? s.apr : null;
  const lines = [
    "",
    "LIVE VAULT STATE — read on-chain just now. You DO have full access to the user's finances; these are their real numbers, and you can always read fresh ones or act with your tools. Never say you lack access — call the tool instead.",
    `- Idle in the vault: ${s.idle ?? "?"} USDC.`,
    `- Invested in Aave v3: ${s.position ?? "?"} USDC${apr != null ? ` earning ~${apr.toFixed(2)}% APR` : ""}.`,
    `- Safe haven holds: ${s.havenBal ?? "?"} USDC.`,
  ];
  if (policy) lines.push(`- Flex-signed policy: invest cap ${policy.investCap} USDC, protect cap ${policy.protectCap} USDC, safe haven ${policy.safeHaven}.`);
  if (risk?.reasons?.length) lines.push(`- Current risk flags: ${risk.reasons.join("; ")}.`);
  const mkts = s.markets as Array<{ name: string; apr: number; verdict: string; score: number; pick?: boolean; position?: string }> | undefined;
  if (Array.isArray(mkts) && mkts.length) {
    lines.push("MARKETS you can invest across (ranked now by graphscout's live risk-adjusted score — recommend the pick, steer away from any flagged watch/elevated/critical):");
    for (const m of mkts) lines.push(`- ${m.name}: ${m.apr}% APR, graphscout ${m.verdict}, score ${m.score}${m.pick ? " ★ recommended pick" : ""}${m.position && m.position !== "0.0" ? `, currently holding ${m.position} USDC` : ""}.`);
  }
  lines.push("Vault is on Base Sepolia. Tools: compare_markets (present the ranked markets + your pick and open the Markets panel — use when the user wants to put money to work or asks which market is best), get_portfolio (fresh balances/positions/mandate), check_wallet_safety (live risk via The Graph), invest_now / protect_now (act within the policy), propose_policy (draft the mandate to sign on the Flex), show_panel (open a panel on screen), discover_subgraph/query_subgraph (investigate any protocol).");
  return guardianSystemInstruction + "\n" + lines.join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not set on the server" }, { status: 500 });
  try {
    const body = await req.json().catch(() => ({}));
    const character = String(body?.character || "tv");
    const voiceName = VOICES[character] || VOICES.tv;

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const systemInstruction = await buildSystemInstruction();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            // PUSH-TO-TALK: automatic VAD OFF. The client marks turn boundaries explicitly via
            // activityStart (press) / activityEnd (release) — no VAD guessing, no echo issues.
            // (This applies because the config is locked in the token; client config is ignored.)
            realtimeInputConfig: {
              automaticActivityDetection: { disabled: true } as never,
            },
            tools: [{ functionDeclarations: guardianToolDeclarations }],
            systemInstruction,
            // warmth: the model matches the user's tone. (proactiveAudio stays OFF — it was
            // suppressing responses; affective dialog alone is safe + more natural.)
            enableAffectiveDialog: true,
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    return Response.json({ token: token.name, model: MODEL, voice: voiceName });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
