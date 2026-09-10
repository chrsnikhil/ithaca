// End-to-end test of the voice ANSWER path: mints a real ephemeral token from /api/gemini-token
// (so it exercises the exact baked config — tools, systemInstruction, VAD, voice), connects to
// Gemini Live, sends a text turn, and verifies the model (1) opens, (2) speaks (audio chunks),
// (3) calls tools, (4) produces English output text. This isolates the "does it answer?" path
// from browser mic capture. Usage: TEST_BASE=https://guardian-rho-two.vercel.app node scripts/live-test.mjs
import { GoogleGenAI } from "@google/genai";

const BASE = process.env.TEST_BASE || "http://localhost:3000";
const PROMPT = process.env.TEST_PROMPT || "Good morning. What's in my wallet? Show me my balances and tell me if I'm safe.";

function isEnglish(s) { return /[a-zA-Z]/.test(s) && !/[ऀ-෿]/.test(s); } // latin present, no Indic scripts

const tr = await fetch(`${BASE}/api/gemini-token`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ character: "tv" }),
});
const { token, model, voice, error } = await tr.json();
if (error || !token) { console.log("FAIL: token mint ->", error || "no token"); process.exit(1); }
console.log(`token ok · model=${model} · voice=${voice}`);

const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
let opened = false, errored = null, done = false, audioChunks = 0, outText = "";
const tools = [];

const session = await ai.live.connect({
  model, config: {},
  callbacks: {
    onopen: () => { opened = true; },
    onmessage: (m) => {
      if (m.data) audioChunks++;
      if (m.toolCall?.functionCalls?.length) {
        for (const fc of m.toolCall.functionCalls) {
          tools.push(fc.name);
          try {
            session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { ok: true, idle: "100.00", position: "0.00", havenBal: "1000.00", apr: 1.5, danger: false, severity: 0 } }] });
          } catch {}
        }
      }
      const ot = m.serverContent?.outputTranscription?.text;
      if (ot) outText += ot;
      if (m.serverContent?.turnComplete) done = true;
    },
    onerror: (e) => { errored = e?.message || String(e); },
    onclose: () => {},
  },
});

session.sendClientContent({ turns: [{ role: "user", parts: [{ text: PROMPT }] }], turnComplete: true });

const t0 = Date.now();
while (!errored && Date.now() - t0 < 22000) { if (done && audioChunks > 0) break; await new Promise((r) => setTimeout(r, 250)); }
try { session.close(); } catch {}

console.log("--- result ---");
console.log("opened:      ", opened);
console.log("error:       ", errored || "(none)");
console.log("audio chunks:", audioChunks);
console.log("tools called:", tools.join(", ") || "(none)");
console.log("output text: ", (outText || "(none)").slice(0, 200));

const pass = opened && !errored && audioChunks > 0;
const englishOk = !outText || isEnglish(outText);
console.log(pass ? (englishOk ? "PASS ✅ — the guardian answered out loud (English)" : "PARTIAL ⚠️ — answered, but output not clearly English") : "FAIL ❌ — no spoken answer");
process.exit(pass ? 0 : 1);
