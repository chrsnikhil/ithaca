// Discover which models this key can use (esp. Live native-audio) + confirm a text call works.
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const key = env.GEMINI_API_KEY;

(async () => {
  const ai = new GoogleGenAI({ apiKey: key });

  // 1. list models -> find audio/live ones
  try {
    const names = [];
    const pager = await ai.models.list();
    for await (const m of pager) names.push(m.name);
    const audio = names.filter((n) => /live|native.?audio|audio|tts/i.test(n));
    console.log("AUDIO/LIVE models available to this key:");
    for (const n of audio) console.log("   " + n);
    const flash3 = names.filter((n) => /gemini-3.*flash/i.test(n)).slice(0, 6);
    console.log("3.x flash models:", flash3.join(", "));
  } catch (e) {
    console.log("models.list FAILED ->", (e.message || String(e)).slice(0, 200));
  }

  // 2. confirm a text call with the current flash model
  try {
    const r = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: "reply with the single word: ok" });
    console.log("generateContent(gemini-3.6-flash) OK ->", (r.text || "").trim().slice(0, 30));
  } catch (e) {
    console.log("generateContent(3.6) FAILED ->", (e.message || String(e)).slice(0, 200));
  }
})();
