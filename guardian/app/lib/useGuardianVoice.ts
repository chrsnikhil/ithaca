"use client";
import { useCallback, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
// System instruction + tools are baked into the ephemeral token server-side (/api/gemini-token),
// because ephemeral tokens lock the session config — client-provided config is ignored.

export type VoiceState = "idle" | "connecting" | "ready" | "listening" | "thinking" | "talking";

function b64FromBytes(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function bytesFromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}

// Minimal shapes (the SDK's Live message types vary by version)
type LiveMessage = {
  data?: string;
  toolCall?: { functionCalls?: { id: string; name: string; args?: Record<string, unknown> }[] };
  serverContent?: {
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
  };
};

// Tools the client resolves itself (no server round-trip) — opening a panel, drafting a policy
// for on-device signing. onClientTool returns the result sent back to the model.
const CLIENT_TOOLS = new Set(["show_panel", "propose_policy"]);

export function useGuardianVoice(opts?: {
  onTool?: (name: string, args: Record<string, unknown>, result: unknown) => void;
  onClientTool?: (name: string, args: Record<string, unknown>) => Promise<unknown> | unknown;
  character?: string;
}) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [state, setState] = useState<VoiceState>("idle");
  const [userText, setUserText] = useState("");
  const [guardianText, setGuardianText] = useState("");
  const [transcript, setTranscript] = useState<{ role: "you" | "guardian"; text: string }[]>([]);
  const uTurnRef = useRef(""); // current user utterance (this turn)
  const gTurnRef = useRef(""); // current guardian reply (this turn)
  const sessionRef = useRef<Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const outCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null); // legacy capture (fallback path)
  const captureNodeRef = useRef<AudioWorkletNode | null>(null); // worklet capture
  const playbackNodeRef = useRef<AudioWorkletNode | null>(null); // worklet playback (jitter buffer); null → fallback playChunk
  const nextStartRef = useRef(0); // legacy playback scheduler (fallback path)
  const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // worklet path: talking→ready when audio stops
  const holdingRef = useRef(false); // push-to-talk: mic streams only while held
  const wdRef = useRef<ReturnType<typeof setInterval> | null>(null); // mic keep-alive watchdog
  const speakingRef = useRef(false); // half-duplex: true while the guardian is speaking (mic paused)

  // Fallback playback path (ScriptProcessor-era): hand-schedule AudioBufferSourceNodes.
  // Used only when the AudioWorklet modules fail to load.
  const playChunk = useCallback((b64: string) => {
    const out = outCtxRef.current;
    if (!out) return;
    const pcm = new Int16Array(bytesFromB64(b64).buffer);
    const buf = out.createBuffer(1, pcm.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const src = out.createBufferSource();
    src.buffer = buf;
    src.connect(out.destination);
    const start = Math.max(out.currentTime, nextStartRef.current);
    src.start(start);
    nextStartRef.current = start + buf.duration;
    speakingRef.current = true; // half-duplex: mic paused while speaking
    setState("talking");
    src.onended = () => {
      if (nextStartRef.current <= (outCtxRef.current?.currentTime ?? 0) + 0.06) { speakingRef.current = false; setState("ready"); }
    };
  }, []);

  // Worklet playback path: hand the Int16 PCM to the jitter-buffer worklet (audio thread),
  // which plays it gaplessly. State returns to 'ready' via a small trailing timer once the
  // model stops sending audio (replaces the old per-source onended bookkeeping).
  const enqueueChunk = useCallback((b64: string) => {
    const node = playbackNodeRef.current;
    if (!node) return;
    const bytes = bytesFromB64(b64);
    try { node.port.postMessage(bytes.buffer, [bytes.buffer]); } catch { return; }
    speakingRef.current = true; // half-duplex: mic paused while speaking
    setState("talking");
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    talkTimerRef.current = setTimeout(() => {
      talkTimerRef.current = null;
      speakingRef.current = false; // guardian done → resume mic
      setState((s) => (s === "talking" ? "ready" : s));
    }, 600);
  }, []);

  const handleTool = useCallback(async (fc: { id: string; name: string; args?: Record<string, unknown> }) => {
    let response: unknown;
    if (CLIENT_TOOLS.has(fc.name)) {
      try { response = (await optsRef.current?.onClientTool?.(fc.name, fc.args || {})) ?? { ok: true }; }
      catch (e) { response = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
    } else {
      try {
        const r = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fc.name, args: fc.args || {} }),
        });
        response = await r.json();
      } catch (e) {
        response = { error: e instanceof Error ? e.message : String(e) };
      }
    }
    try { optsRef.current?.onTool?.(fc.name, fc.args || {}, response); } catch {}
    sessionRef.current?.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: response as Record<string, unknown> }] });
  }, []);

  // Create the audio contexts (idempotent; recreates if a prior session closed them).
  const ensureAudio = useCallback(() => {
    if (!outCtxRef.current || outCtxRef.current.state === "closed")
      outCtxRef.current = new AudioContext({ sampleRate: 24000, latencyHint: "interactive" });
    if (!micCtxRef.current || micCtxRef.current.state === "closed")
      micCtxRef.current = new AudioContext({ sampleRate: 16000, latencyHint: "interactive" });
    return { out: outCtxRef.current, mic: micCtxRef.current };
  }, []);

  // iOS Safari/Chrome (WebKit) only unlock audio if AudioContext.resume() runs SYNCHRONOUSLY
  // inside a user gesture. connect() resumes after an await (token fetch) — too late on iOS.
  // GuardianShell calls prime() first thing on pointer-down so the contexts unlock in the tap.
  const prime = useCallback(() => {
    const { out, mic } = ensureAudio();
    try { out.resume(); } catch {}
    try { mic.resume(); } catch {}
  }, [ensureAudio]);

  const connect = useCallback(async () => {
    setState("connecting");
    setUserText("");
    setGuardianText("");
    setTranscript([]);
    uTurnRef.current = "";
    gTurnRef.current = "";
    try {
      const tr = await fetch("/api/gemini-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ character: optsRef.current?.character || "tv" }) });
      const { token, model, error } = await tr.json();
      if (error || !token) { setGuardianText("Auth error: " + (error || "no token")); setState("idle"); return; }

      const { out, mic } = ensureAudio();
      try { await out.resume(); await mic.resume(); } catch {}
      nextStartRef.current = 0;
      playbackNodeRef.current = null;

      // Prefer AudioWorklet (dedicated audio thread → low latency, gapless jitter-buffered
      // playback). If either module fails to load, fall back to the legacy
      // ScriptProcessor/AudioBufferSource paths so voice keeps working everywhere.
      let useWorklets = false;
      try {
        if (micCtxRef.current.audioWorklet && outCtxRef.current.audioWorklet) {
          await Promise.all([
            micCtxRef.current.audioWorklet.addModule("/worklets/capture-worklet.js"),
            outCtxRef.current.audioWorklet.addModule("/worklets/playback-worklet.js"),
          ]);
          const playbackNode = new AudioWorkletNode(outCtxRef.current, "playback");
          playbackNode.connect(outCtxRef.current.destination);
          playbackNodeRef.current = playbackNode;
          useWorklets = true;
        }
      } catch {
        useWorklets = false;
        playbackNodeRef.current = null;
      }

      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
      // Config (modalities, transcriptions, tools, systemInstruction) is locked into the token
      // server-side — connect with just the token. Push-to-talk still works via the mic-audio
      // gate (we only stream while held) + audioStreamEnd on release.
      const session = await ai.live.connect({
        model,
        config: {},
        callbacks: {
          onopen: () => { console.log("[voice] session OPEN — listening"); setState("ready"); },
          onmessage: (msg: unknown) => {
            const m = msg as LiveMessage;
            if (m.toolCall?.functionCalls?.length) {
              setState("thinking");
              m.toolCall.functionCalls.forEach(handleTool);
            }
            if (m.data) {
              if (playbackNodeRef.current) enqueueChunk(m.data);
              else playChunk(m.data);
            }
            const it = m.serverContent?.inputTranscription?.text;
            if (it) { uTurnRef.current += it; setUserText(uTurnRef.current); }
            const ot = m.serverContent?.outputTranscription?.text;
            if (ot) { gTurnRef.current += ot; setGuardianText(gTurnRef.current); }
            if (m.serverContent?.interrupted) {
              // Crisp barge-in: drop everything queued for playback immediately.
              try { playbackNodeRef.current?.port.postMessage({ cmd: "flush" }); } catch {}
              if (talkTimerRef.current) { clearTimeout(talkTimerRef.current); talkTimerRef.current = null; }
              nextStartRef.current = 0;
              speakingRef.current = false; // resume mic
              setState(holdingRef.current ? "listening" : "ready");
            }
            if (m.serverContent?.turnComplete) {
              // turn finished — commit this turn to the transcript, return to listening (never stuck
              // on "thinking"), and re-resume the mic in case the context auto-suspended after the reply.
              console.log("[voice] turnComplete -> ready");
              const u = uTurnRef.current.trim(), g = gTurnRef.current.trim();
              if (u || g) setTranscript((tr) => {
                const add: { role: "you" | "guardian"; text: string }[] = [];
                if (u) add.push({ role: "you", text: u });
                if (g) add.push({ role: "guardian", text: g });
                return [...tr, ...add].slice(-50);
              });
              uTurnRef.current = ""; gTurnRef.current = "";
              setUserText(""); setGuardianText("");
              if (talkTimerRef.current) { clearTimeout(talkTimerRef.current); talkTimerRef.current = null; }
              setState((s) => (s === "talking" ? s : "ready"));
              setTimeout(() => setState((s) => (s === "talking" ? s : "ready")), 400);
              try { micCtxRef.current?.resume(); } catch {}
            }
          },
          onerror: (e: unknown) => { console.warn("[voice] session ERROR:", e); setGuardianText("Error: " + (e instanceof Error ? e.message : String(e))); },
          onclose: (e: unknown) => { console.log("[voice] session CLOSED:", e); setState("idle"); },
        },
      });
      sessionRef.current = session;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const micCtx = micCtxRef.current;
      const source = micCtx.createMediaStreamSource(stream);
      if (useWorklets) {
        // Worklet capture: Int16 conversion + batching happens on the audio thread; the main
        // thread only base64s ~128ms buffers. Stream continuously — the server-side tuned VAD
        // decides turns (Arca route).
        const captureNode = new AudioWorkletNode(micCtx, "capture");
        captureNodeRef.current = captureNode;
        let sent = 0;
        captureNode.port.onmessage = (ev: MessageEvent) => {
          if (!holdingRef.current) return; // push-to-talk: only stream while the button is held
          const buf = ev.data as ArrayBuffer;
          try {
            sessionRef.current?.sendRealtimeInput({ audio: { data: b64FromBytes(new Uint8Array(buf)), mimeType: "audio/pcm;rate=16000" } });
            if (++sent % 40 === 0) console.log("[voice] mic chunks sent:", sent);
          } catch (e) { console.warn("[voice] sendRealtimeInput failed:", e); }
        };
        source.connect(captureNode);
        // Silent sink: keeps the worklet's process() pulled WITHOUT echoing the mic to the
        // speakers (routing mic->destination created a feedback loop that made the echo-canceller
        // suppress the user's voice after the first turn).
        const sink = micCtx.createGain();
        sink.gain.value = 0;
        captureNode.connect(sink);
        sink.connect(micCtx.destination);
        console.log("[voice] worklet capture wired");
      } else {
        // Fallback capture (deprecated ScriptProcessor) — kept so voice works on browsers
        // where the worklet modules can't load.
        const proc = micCtx.createScriptProcessor(4096, 1, 1);
        procRef.current = proc;
        let sentF = 0;
        proc.onaudioprocess = (ev) => {
          if (!holdingRef.current) return; // push-to-talk: only stream while the button is held
          // stream continuously — the server-side tuned VAD decides turns (Arca route)
          const f32 = ev.inputBuffer.getChannelData(0);
          const i16 = new Int16Array(f32.length);
          for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); i16[i] = s < 0 ? s * 32768 : s * 32767; }
          try {
            sessionRef.current?.sendRealtimeInput({ audio: { data: b64FromBytes(new Uint8Array(i16.buffer)), mimeType: "audio/pcm;rate=16000" } });
            if (++sentF % 20 === 0) console.log("[voice] mic chunks sent (fallback):", sentF);
          } catch (e) { console.warn("[voice] sendRealtimeInput failed:", e); }
        };
        source.connect(proc);
        // silent sink (no mic->speaker feedback); a ScriptProcessor still needs a downstream pull
        const sink = micCtx.createGain();
        sink.gain.value = 0;
        proc.connect(sink);
        sink.connect(micCtx.destination);
        console.log("[voice] fallback capture wired");
      }

      // Keep-alive: browsers can auto-suspend an AudioContext once its output is silent, which
      // stops the capture worklet after the first reply. Resume the mic context if it drifts.
      if (wdRef.current) clearInterval(wdRef.current);
      wdRef.current = setInterval(() => {
        const mc = micCtxRef.current;
        if (mc && mc.state !== "running") { console.log("[voice] mic ctx", mc.state, "→ resuming"); mc.resume().catch(() => {}); }
      }, 2000);
    } catch (e) {
      setGuardianText("Failed to start: " + (e instanceof Error ? e.message : String(e)));
      setState("idle");
    }
  }, [handleTool, playChunk, enqueueChunk, ensureAudio]);

  // Push-to-talk: begin capturing on press. Marks the start of the user's turn.
  // Push-to-talk: press begins the user's turn (manual VAD). Mic streams only while held.
  const startTalk = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    speakingRef.current = false;
    nextStartRef.current = 0; // barge-in: drop any queued guardian audio (fallback path)
    try { playbackNodeRef.current?.port.postMessage({ cmd: "flush" }); } catch {} // barge-in (worklet path)
    if (talkTimerRef.current) { clearTimeout(talkTimerRef.current); talkTimerRef.current = null; }
    uTurnRef.current = "";
    setUserText("");
    try { sessionRef.current?.sendRealtimeInput({ activityStart: {} }); } catch {}
    setState("listening");
  }, []);

  // Push-to-talk: release ends the user's turn so the guardian responds.
  const stopTalk = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    try { sessionRef.current?.sendRealtimeInput({ activityEnd: {} }); } catch {}
    setState("thinking");
  }, []);

  const disconnect = useCallback(() => {
    holdingRef.current = false;
    speakingRef.current = false;
    if (talkTimerRef.current) { clearTimeout(talkTimerRef.current); talkTimerRef.current = null; }
    if (wdRef.current) { clearInterval(wdRef.current); wdRef.current = null; }
    try { procRef.current?.disconnect(); } catch {}
    try { captureNodeRef.current?.disconnect(); } catch {}
    try { playbackNodeRef.current?.disconnect(); } catch {}
    procRef.current = null;
    captureNodeRef.current = null;
    playbackNodeRef.current = null;
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { sessionRef.current?.close(); } catch {}
    try { micCtxRef.current?.close(); } catch {}
    try { outCtxRef.current?.close(); } catch {}
    micCtxRef.current = null; // null (not just close) so ensureAudio recreates on reconnect
    outCtxRef.current = null;
    setState("idle");
  }, []);

  return { state, userText, guardianText, transcript, connect, disconnect, startTalk, stopTalk, prime };
}
