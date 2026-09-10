// Prove the Gemini Live session + tool-calling loop works end-to-end (text in, no mic needed).
const fs = require("fs");
const path = require("path");
const { GoogleGenAI, Modality, Type } = require("@google/genai");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GEMINI_API_KEY;
const model = env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-latest";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: "v1alpha" } });
  const q = [];
  let open = false, err = null;
  const session = await ai.live.connect({
    model,
    config: {
      responseModalities: [Modality.AUDIO],
      outputAudioTranscription: {},
      tools: [{ functionDeclarations: [
        { name: "check_wallet_safety", description: "Check whether the user's wallet is in danger using live on-chain data. Returns {danger, reasons}.", parameters: { type: Type.OBJECT, properties: {} } },
      ] }],
      systemInstruction: "You are Guardian, a calm on-chain protector. When the user asks if they're safe, CALL check_wallet_safety, then tell them the result in one short spoken sentence.",
    },
    callbacks: {
      onopen: () => { open = true; },
      onmessage: (m) => q.push(m),
      onerror: (e) => { err = e; },
      onclose: () => {},
    },
  });

  session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Am I safe right now?" }] }], turnComplete: true });

  let transcript = "", toolCalled = null, done = false, gotAudio = false;
  for (let i = 0; i < 80 && !done; i++) {
    while (q.length) {
      const m = q.shift();
      if (m.toolCall?.functionCalls?.length) {
        for (const fc of m.toolCall.functionCalls) {
          toolCalled = fc.name;
          session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { danger: false, reasons: [] } }] });
        }
      }
      if (m.data) gotAudio = true;
      const ot = m.serverContent?.outputTranscription?.text;
      if (ot) transcript += ot;
      if (m.serverContent?.turnComplete) done = true;
    }
    if (err) { console.log("ERROR:", err.message || err); break; }
    await sleep(500);
  }
  console.log("live session opened:", open);
  console.log("tool called by Gemini:", toolCalled);
  console.log("got audio out:", gotAudio);
  console.log("Guardian said:", transcript.trim().slice(0, 240));
  try { session.close(); } catch {}
})().catch((e) => { console.log("FATAL:", e.message || e); process.exit(1); });
