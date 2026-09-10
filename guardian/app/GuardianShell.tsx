"use client";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Mic } from "lucide-react";
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Orb, type AgentState } from "@/components/ui/orb";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { VoiceButton } from "@/components/ui/voice-button";
import { VoicePicker } from "@/components/ui/voice-picker";
import { useGuardianVoice, type VoiceState } from "./lib/useGuardianVoice";
import { useLedgerPolicy, type PolicyParams, type Transport } from "./lib/useLedgerPolicy";
import { faceIdGate } from "./lib/faceId";
import { FLEX_OWNER } from "./lib/deployments";
import { loadMandate, saveMandate, clearMandate, type StoredMandate } from "./lib/mandate";

type PanelId = "balances" | "positions" | "investments" | "mandates" | "activity" | "markets";
type ActionState = "investing" | "protecting" | null;

type CharId = "alien" | "bungirl" | "dog" | "ginger" | "tv" | "orb";
const CHAR_KEY = "guardian.char";
const CHARS: { id: CharId; name: string; role: string }[] = [
  { id: "tv", name: "Guardian", role: "Protector" },
  { id: "dog", name: "Biscuit", role: "Watchdog" },
  { id: "bungirl", name: "Juno", role: "Analyst" },
  { id: "ginger", name: "Ginger", role: "Strategist" },
  { id: "alien", name: "Nova", role: "Scout" },
  // 6th character: the ElevenLabs orb itself takes the hero stage (no clay video).
  // /api/gemini-token falls back to the default voice for unknown ids — safe.
  { id: "orb", name: "Orb", role: "Signal" },
];
const CLIP: Record<VoiceState, string> = {
  idle: "idle", connecting: "thinking", ready: "idle", listening: "listening", thinking: "thinking", talking: "talking",
};
const LABEL: Record<VoiceState, string> = {
  idle: "Tap or hold to talk", connecting: "Waking up…", ready: "Tap or hold to talk",
  listening: "Listening… tap or release to send", thinking: "Working…", talking: "Speaking",
};

/* graphscout's ranked lending markets (from the daemon's state feed) */
type Market = {
  id?: string; name?: string; apr?: number | null; score?: number | null;
  verdict?: string | null; riskScore?: number | null; tvlUSD?: number | null;
  tvlChange7dPct?: number | null; position?: number | string | null; pick?: boolean;
};

type GState = {
  offline?: boolean;
  idle?: string | null; position?: string | null; havenBal?: string | null; apr?: number | null;
  dial?: boolean; tick?: number; vault?: string; chainId?: number; venue?: string; haven?: string | null;
  explorerBase?: string;
  policy?: { investCap: string; protectCap: string; safeHaven: string; expiry: string; signer: string } | null;
  risk?: { severity: number; reasons: string[]; danger: boolean } | null;
  markets?: Market[] | null;
};
type Act = { ts: number; tick: number; tier: string; action: string; reason: string; amountUsdc?: string; txUrl?: string };

const n = (x?: string | null) => parseFloat(x || "0") || 0;
const money = (x: number) => x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (a?: string | null) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "—");
const ago = (ts: number) => {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + "s"; if (s < 3600) return Math.floor(s / 60) + "m"; return Math.floor(s / 3600) + "h";
};

/* dock destinations — presentational grouping of the same panels.
   "Me" (character picker) moved to a top-bar avatar chip to make room
   for Markets; the four dock slots flank the raised mic. */
type DockId = "portfolio" | "markets" | "activity" | "mandates" | "me";
const DOCK: { id: DockId; label: string; icon: React.ReactNode }[] = [
  { id: "portfolio", label: "Portfolio", icon: <><path d="M3 7h18v10H3z" /><path d="M3 11h18" /></> },
  { id: "markets", label: "Markets", icon: <><path d="M5 20v-7" /><path d="M12 20V5" /><path d="M19 20v-10" /></> },
  { id: "activity", label: "Activity", icon: <path d="M3 12h4l3 8 4-16 3 8h4" /> },
  { id: "mandates", label: "Mandates", icon: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 9h6M9 13h6M9 17h3" /></> },
];
/* the Portfolio sheet's segmented control — swaps between the three existing panel bodies */
const SEGS: { id: PanelId; label: string }[] = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
  { id: "investments", label: "Investments" },
];
/* which dock sheet a given panel id renders inside */
const SHEET_OF: Record<PanelId, Exclude<DockId, "me">> = {
  balances: "portfolio", positions: "portfolio", investments: "portfolio",
  mandates: "mandates", activity: "activity", markets: "markets",
};

// map fuzzy voice values ("wallet", "dashboard", "rules"…) to a real panel
const PANEL_ALIASES: Record<string, PanelId> = {
  balances: "balances", balance: "balances", wallet: "balances", holdings: "balances", money: "balances", funds: "balances",
  positions: "positions", position: "positions", onchain: "positions",
  investments: "investments", investment: "investments", invested: "investments", yield: "investments", aave: "investments",
  mandates: "mandates", mandate: "mandates", policy: "mandates", rules: "mandates", limits: "mandates",
  activity: "activity", history: "activity", log: "activity", feed: "activity", dashboard: "activity",
  markets: "markets", market: "markets", moonwell: "markets", compound: "markets", venues: "markets", lending: "markets",
};
function toPanel(v: unknown): PanelId {
  return PANEL_ALIASES[String(v || "").toLowerCase().replace(/[^a-z]/g, "")] || "balances";
}

/* ---------- presentation-only helpers (no app logic) ---------- */

// Crossfading video: two stacked <video> layers. When `src` changes the new
// clip mounts UNDER-invisible ("pre"), starts playing, and only once it has
// decoded a frame (loadeddata) fades in over the outgoing clip, which fades
// out in sync and is unmounted after the fade — no remount flash, ever.
function CrossfadeVideo({ src }: { src: string }) {
  const [layers, setLayers] = useState<{ key: number; src: string }[]>(() => [{ key: 0, src }]);
  const [readyKey, setReadyKey] = useState(-1);
  const seq = useRef(0);

  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.src === src) return prev;
      seq.current += 1;
      // keep at most one outgoing layer beneath the incoming one
      return [...prev.slice(-1), { key: seq.current, src }];
    });
  }, [src]);

  const topKey = layers[layers.length - 1].key;
  const ready = readyKey >= topKey;

  // safety: if media events never fire, start the fade anyway
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReadyKey((k) => Math.max(k, topKey)), 700);
    return () => clearTimeout(t);
  }, [ready, topKey]);

  // once the incoming layer has fully faded in, drop the outgoing one
  useEffect(() => {
    if (layers.length < 2 || !ready) return;
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), 420);
    return () => clearTimeout(t);
  }, [layers, ready]);

  return (
    <>
      {layers.map((l, i) => {
        const isTop = i === layers.length - 1;
        const cls = isTop ? (ready ? " in" : " pre") : ready ? " out" : "";
        return (
          <video
            key={l.key}
            className={"gx-av" + cls}
            src={l.src}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setReadyKey((k) => Math.max(k, l.key))}
          />
        );
      })}
    </>
  );
}

/* markets formatting (display only) */
const fmtUsd = (x?: number | null) =>
  x == null ? "—" :
  x >= 1e9 ? "$" + (x / 1e9).toFixed(1) + "B" :
  x >= 1e6 ? "$" + (x / 1e6).toFixed(1) + "M" :
  x >= 1e3 ? "$" + (x / 1e3).toFixed(1) + "K" : "$" + x.toFixed(0);
const fmtPct = (x?: number | null) => (x == null ? "—" : x.toFixed(2) + "%");
const fmtChg = (x?: number | null) => (x == null ? "" : (x >= 0 ? "+" : "") + x.toFixed(1) + "% 7d");
const fmtScore = (x?: number | null) =>
  x == null ? "—" : x <= 1 ? String(Math.round(x * 100)) : x >= 10 ? x.toFixed(0) : x.toFixed(1);

/* graphscout verdict → MONOCHROME severity badge. No hue: severity is fill/weight —
   healthy = quiet hairline outline · watch = mid-gray filled ·
   elevated = solid white-on-black · critical = white-on-black + heavy outer ring */
function VerdictBadge({ verdict }: { verdict?: string | null }) {
  const v = (verdict || "").toLowerCase();
  const cls =
    v === "healthy" ? "border-white/25 bg-transparent text-foreground/75"
    : v === "watch" ? "border-transparent bg-white/20 text-foreground"
    : v === "elevated" ? "border-transparent bg-foreground text-background font-extrabold"
    : v === "critical" ? "border-transparent bg-foreground text-background font-extrabold shadow-[0_0_0_1px_#000,0_0_0_2px_rgba(255,255,255,0.9)]"
    : "border-border bg-transparent text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("h-[18px] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]", cls)}>
      {verdict || "scanning"}
    </Badge>
  );
}

// The Orb is a WebGL accent — if the GPU/context ever fails it must never take
// the app down with it, so it renders behind a tiny boundary with a flat fallback.
class OrbSafe extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <span className="gx-orbdot" /> : this.props.children; }
}

/* voice-state → orb agent-state (accent animation only) */
const ORB_STATE: Record<VoiceState, AgentState> = {
  idle: null, ready: null, connecting: "thinking", thinking: "thinking",
  listening: "listening", talking: "talking",
};

// Keeps a sheet mounted briefly after close so its out-animation can play.
function useSheet<T>(value: T | null): { shown: T | null; closing: boolean } {
  const [held, setHeld] = useState<T | null>(value);
  useEffect(() => {
    if (value != null) { setHeld(value); return; }
    const t = setTimeout(() => setHeld(null), 260);
    return () => clearTimeout(t);
  }, [value]);
  const shown = value != null ? value : held;
  return { shown, closing: value == null && held != null };
}

export default function GuardianShell() {
  const [gstate, setGstate] = useState<GState>({});
  const [feed, setFeed] = useState<Act[]>([]);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [action, setAction] = useState<ActionState>(null);
  const [busy, setBusy] = useState(false);
  const [char, setChar] = useState<CharId>("tv");
  const [charOpen, setCharOpen] = useState(false);
  const [proposed, setProposed] = useState<PolicyParams | null>(null);
  const [armMsg, setArmMsg] = useState("");
  const [signing, setSigning] = useState(false);
  const { status: ledgerStatus, armMultiWithLedger, signEscalation } = useLedgerPolicy();
  const [escMsg, setEscMsg] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [signVia, setSignVia] = useState<Transport>("usb"); // USB (WebHID) or Bluetooth (Web BLE)
  const actTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeRef = useRef<() => void>(() => {});
  // client-held mandate (localStorage) — the serverless app arms + acts with no daemon
  const mandateRef = useRef<StoredMandate | null>(null);
  const [armedLocal, setArmedLocal] = useState(false);
  const [dangerOn, setDangerOn] = useState(false); // client-side "simulate danger" flip
  const commandRef = useRef<(a: "invest" | "protect" | "derisk") => void>(() => {});

  const refresh = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        fetch("/api/guardian?view=state", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/guardian?view=activity", { cache: "no-store" }).then((r) => r.json()),
      ]);
      // the server view is stateless (no policy); overlay the client-held mandate so the mandate
      // panels stay populated across refreshes
      if (s && !s.error) {
        const m = mandateRef.current;
        setGstate(m ? { ...s, policy: { ...m.policy, signer: m.signer } } : s);
      }
      if (Array.isArray(a?.items)) setFeed(a.items);
    } catch {}
  }, []);
  pokeRef.current = refresh;

  const flashAction = useCallback((a: ActionState) => {
    setAction(a);
    if (actTimer.current) clearTimeout(actTimer.current);
    actTimer.current = setTimeout(() => setAction(null), 7000);
  }, []);

  const onTool = useCallback((name: string) => {
    // invest_now / protect_now must EXECUTE on the device (the browser holds the Flex-signed
    // mandate; the server can't). The voice tool only acknowledges server-side, so we fire the
    // real bounded action here via the client executor.
    if (name === "invest_now") { setPanel("investments"); commandRef.current("invest"); }
    if (name === "protect_now") { setPanel("activity"); commandRef.current("protect"); }
    if (name === "compare_markets") setPanel("markets");
    setTimeout(() => pokeRef.current(), 1500);
    setTimeout(() => pokeRef.current(), 6000);
  }, []);

  // client-resolved tools: open a panel, or draft a policy for the user to sign on their Flex
  const onClientTool = useCallback((name: string, args: Record<string, unknown>) => {
    if (name === "show_panel") { const p = toPanel(args.panel); setPanel(p); return { ok: true, panel: p }; }
    if (name === "propose_policy") {
      const investUsdc = Math.max(0, Number(args.investCapUsdc ?? 0));
      const protectUsdc = Math.max(0, Number(args.protectCapUsdc ?? investUsdc));
      const hours = Math.max(1, Number(args.hours ?? 168));
      const p: PolicyParams = { investUsdc, protectUsdc, safeHaven: FLEX_OWNER, hours };
      setProposed(p); setArmMsg(""); setPanel(null);
      return { ok: true, drafted: { investCapUsdc: investUsdc, protectCapUsdc: protectUsdc, safeHaven: FLEX_OWNER, hours }, message: "Draft shown on screen — tell the user to review it and approve it on their Ledger Flex to arm." };
    }
    return { ok: true };
  }, []);

  const { state, userText, guardianText, transcript, connect, disconnect, startTalk, stopTalk, prime } = useGuardianVoice({ onTool, onClientTool, character: char });
  const scrollRef = useRef<HTMLDivElement>(null);
  // auto-scroll the full transcript view; transcriptOpen is included so opening the sheet lands at the latest line
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [transcript, guardianText, userText, transcriptOpen]);
  const live = state !== "idle";
  const [holding, setHolding] = useState(false);
  const wantRef = useRef(false);
  const modeRef = useRef<"touch" | "mouse">("mouse"); // touch = tap-to-toggle; mouse = hold-to-talk

  const holdStart = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    modeRef.current = e.pointerType === "touch" ? "touch" : "mouse";
    // On TOUCH, use tap-to-toggle: a mic-permission prompt or the browser's scroll heuristic
    // fires pointercancel mid-hold on phones, which drops push-to-talk. A second tap stops.
    if (modeRef.current === "touch" && wantRef.current) {
      wantRef.current = false; setHolding(false); stopTalk(); return;
    }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    prime(); // iOS: unlock/resume the AudioContexts synchronously inside the tap, before any await
    wantRef.current = true;
    setHolding(true);
    if (state === "idle") { await connect(); }
    if (wantRef.current) startTalk();
  }, [state, connect, startTalk, stopTalk, prime]);

  const holdEnd = useCallback((e?: React.PointerEvent) => {
    // Touch is tap-to-toggle — ignore pointerup/leave/cancel; the next tap ends the turn.
    if (modeRef.current === "touch") return;
    e?.preventDefault();
    if (!wantRef.current) return;
    wantRef.current = false;
    setHolding(false);
    stopTalk();
  }, [stopTalk]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  // On mount, restore the Flex-signed mandate from this device (localStorage). If present + unexpired
  // the app is armed with no daemon; surface it into gstate so the mandate panels render.
  useEffect(() => {
    const m = loadMandate();
    if (m) {
      mandateRef.current = m;
      setArmedLocal(true);
      setGstate((g) => ({ ...g, policy: { ...m.policy, signer: m.signer } }));
    }
  }, []);

  // THE AUTONOMOUS LOOP — serverless. While armed, the browser drives ticks: it hands the mandate to
  // /api/tick, which decides + executes one bounded action on-chain. This replaces the daemon.
  useEffect(() => {
    if (!armedLocal) return;
    let alive = true, inFlight = false;
    const tick = async () => {
      if (!alive || inFlight) return;
      const m = mandateRef.current;
      if (!m) return;
      inFlight = true;
      try {
        const r = await fetch("/api/tick", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policy: m.policy, signature: m.signature, danger: dangerOn }),
        });
        const j = await r.json();
        // mandate expired or wrong signer → disarm cleanly (drop the stored mandate)
        if (alive && j?.error && /expired|not the Flex owner|bad signature/i.test(j.error)) {
          clearMandate(); mandateRef.current = null; setArmedLocal(false);
          setGstate((g) => ({ ...g, policy: null }));
          return;
        }
        if (alive && j?.action) {
          if (j.action === "INVEST" || j.action === "REBALANCE") flashAction("investing");
          else if (j.action === "PROTECT" || j.action === "ESCALATE") flashAction("protecting");
          if (j.action !== "HOLD") setTimeout(refresh, 800);
        }
      } catch { /* transient — next tick retries */ }
      finally { inFlight = false; }
    };
    tick(); // act immediately on arming / danger flip, don't wait a full interval
    const id = setInterval(tick, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [armedLocal, dangerOn, flashAction, refresh]);

  // character choice — read once on mount (client only), persist on change
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHAR_KEY);
      if (saved && CHARS.some((c) => c.id === saved)) setChar(saved as CharId);
    } catch {}
  }, []);

  // reliable panel-opening: react to what the user SAYS, not only to the model calling show_panel
  useEffect(() => {
    const t = (userText || "").toLowerCase();
    if (!t || !/\b(show|pull|open|bring|see|view|display|go to|check|what'?s? in|whats)\b/.test(t)) return;
    for (const kw of Object.keys(PANEL_ALIASES)) {
      if (t.includes(kw)) { setPanel(PANEL_ALIASES[kw]); break; }
    }
  }, [userText]);

  const pickChar = useCallback((id: CharId) => {
    setChar(id);
    try { window.localStorage.setItem(CHAR_KEY, id); } catch {}
    setCharOpen(false);
  }, []);

  const clip =
    action === "investing" ? "happy" :
    action === "protecting" ? "protecting" :
    (dangerOn || (gstate.risk?.severity ?? 0) >= 3) ? "alert" :
    CLIP[state];

  const idle = n(gstate.idle), invested = n(gstate.position), haven = n(gstate.havenBal);
  const total = idle + invested + haven;
  const armed = armedLocal || !!gstate.policy;
  const danger = dangerOn || (gstate.risk?.severity ?? 0) >= 3;
  const ex = gstate.explorerBase || "https://sepolia.basescan.org";

  // explicit action → serverless executor, authorized by the client-held mandate (no daemon)
  const command = useCallback(async (act: "invest" | "protect" | "derisk") => {
    const m = mandateRef.current;
    if (!m) { setPanel("mandates"); return; } // not armed — send them to arm
    setBusy(true);
    if (act === "invest") flashAction("investing"); else flashAction("protecting");
    try {
      await fetch("/api/act", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: m.policy, signature: m.signature, action: act }),
      });
    } catch {}
    setTimeout(refresh, 1500); setTimeout(() => { refresh(); setBusy(false); }, 6000);
  }, [flashAction, refresh]);
  commandRef.current = command;

  // "simulate danger" is a client-side flip now; when turned ON while armed, kick an immediate tick
  // so the guardian evacuates right away (the loop also picks it up via dangerOn).
  const toggleDanger = useCallback(async () => {
    const on = !dangerOn;
    setDangerOn(on);
    if (on && mandateRef.current) {
      const m = mandateRef.current;
      flashAction("protecting");
      try {
        await fetch("/api/tick", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policy: m.policy, signature: m.signature, danger: true }),
        });
      } catch {}
      setTimeout(refresh, 1500); setTimeout(refresh, 6000);
    }
  }, [dangerOn, flashAction, refresh]);

  // sign the drafted policy on the Flex (user gesture), then relay to the daemon to arm
  const signProposed = useCallback(async () => {
    if (!proposed || signing) return;
    setSigning(true); setArmMsg(signVia === "ble" ? "Pick your Flex over Bluetooth…" : "Connect your Flex…");
    // Connect the Flex FIRST — the USB/Bluetooth device chooser MUST open inside this tap's user
    // gesture. Running Face ID first consumes the gesture and blocks the chooser ("Must be handling
    // a user gesture"). So Face ID runs as the post-connect gate, before the Flex signs.
    const signed = await armMultiWithLedger(proposed, signVia, async () => {
      setArmMsg("Confirm with Face ID…");
      const bio = await faceIdGate();
      if (!bio.ok) throw new Error("Face ID required to arm — " + (bio.error || "cancelled"));
      setArmMsg(bio.skipped ? "Approve on your Flex…" : "Face ID ✓ — approve on your Flex…");
    });
    // On failure, clear armMsg so the hint surfaces the SPECIFIC ledgerStatus (e.g. "no Flex found",
    // the exact DMK error) instead of a generic line.
    if (!signed) { setArmMsg(""); setSigning(false); return; }
    if (!signed.ok) { setArmMsg("Signed by a different address than your Flex."); setSigning(false); return; }
    // Verify server-side (recovers to the Flex owner), then STORE the mandate on this device. No
    // daemon: the app is now armed and the autonomous loop (the tick effect) takes over.
    try {
      const r = await fetch("/api/arm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policy: signed.policy, signature: signed.signature }) });
      const j = await r.json();
      if (!j.ok) { setArmMsg("rejected: " + (j.error || "signature check failed")); setSigning(false); return; }
    } catch { /* verify endpoint hiccup — the signature is valid locally, proceed */ }
    const m: StoredMandate = { policy: signed.policy as StoredMandate["policy"], signature: signed.signature, signer: signed.signer, armedAt: Date.now() };
    saveMandate(m); mandateRef.current = m; setArmedLocal(true);
    setGstate((g) => ({ ...g, policy: { ...m.policy, signer: m.signer } }));
    setArmMsg("armed"); refresh();
    setTimeout(() => { setProposed(null); setArmMsg(""); }, 2600);
    setSigning(false);
  }, [proposed, signing, armMultiWithLedger, refresh, signVia]);

  // HIGH-RISK path: a fresh, single-use Flex approval to evacuate everything to the cold safe
  // haven right now — beyond the standing mandate. Face ID, then a live Flex signature.
  const escalate = useCallback(async () => {
    if (escalating) return;
    const amt = n(gstate.idle) + n(gstate.position);
    if (amt < 1) { setEscMsg("nothing to evacuate"); return; }
    setEscalating(true); setEscMsg(signVia === "ble" ? "Pick your Flex over Bluetooth…" : "Connect your Flex…");
    // Flex first (device chooser needs the tap's gesture), then Face ID, then the live approval.
    const signed = await signEscalation({ amountUsdc: amt, safeHaven: FLEX_OWNER, hours: 1 }, signVia, async () => {
      setEscMsg("Confirm with Face ID…");
      const bio = await faceIdGate();
      if (!bio.ok) throw new Error("Face ID required — " + (bio.error || "cancelled"));
      setEscMsg("Approve this evacuation on your Flex…");
    });
    if (!signed?.ok) { setEscMsg(signed ? "signed by a different address than your Flex" : "Flex signing failed / cancelled"); setEscalating(false); return; }
    try {
      const r = await fetch("/api/escalate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escalation: signed.escalation, signature: signed.signature, amountUsdc: amt }) });
      const j = await r.json();
      setEscMsg(j.ok ? "✓ evacuated to your cold wallet" : (j.error || j.reason || "failed"));
      if (j.ok) setTimeout(refresh, 2500);
    } catch (e) { setEscMsg("relay failed: " + (e instanceof Error ? e.message : String(e))); }
    setEscalating(false);
  }, [escalating, gstate.idle, gstate.position, signEscalation, refresh, signVia]);

  const latest = feed[0];
  const charMeta = CHARS.find((c) => c.id === char) ?? CHARS[0];

  // presentation only: sheets linger briefly after close for the out-animation
  const panelSheet = useSheet<PanelId>(panel);
  const charSheet = useSheet<boolean>(charOpen ? true : null);
  const proposedSheet = useSheet<PolicyParams>(proposed);
  const txSheet = useSheet<boolean>(transcriptOpen ? true : null);

  // presentation only: which dock destination is lit + what the peek shows
  const activeDock: DockId | null = charOpen ? "me" : panel ? SHEET_OF[panel] : null;
  const lastGuardianLine = [...transcript].reverse().find((m) => m.role !== "you")?.text ?? "";
  const peekGuardian = guardianText || lastGuardianLine;
  const openDock = (id: DockId) => {
    if (id === "me") { setCharOpen(true); return; }
    if (id === "activity") { setPanel("activity"); return; }
    if (id === "mandates") { setPanel("mandates"); return; }
    if (id === "markets") { setPanel("markets"); return; }
    setPanel("balances"); // Portfolio opens on its first segment
  };

  // presentation only: the five characters shaped as ElevenLabs voices for the picker
  const voiceItems = useMemo(
    () => CHARS.map((c) => ({ voiceId: c.id, name: c.name, labels: { accent: c.role } })) as unknown as ElevenLabs.Voice[],
    []
  );
  // monochrome orb: white/gray churn at rest; danger reads as a harsher
  // full-contrast white-on-black churn (severity by contrast, not hue)
  const orbColors: [string, string] = danger ? ["#ffffff", "#161616"] : ["#e5e5e5", "#555555"];

  return (
    <main className="app">
      <div className="gx">
        {/* top bar — display only: brand left, character chip + live total right */}
        <div className="gx-top reveal">
          <span className="gx-brand">
            <span className={"gx-live " + (danger ? "danger" : live || armed ? "on" : "")} />
            GUARDIAN
          </span>
          <button
            className={"gx-me" + (charOpen ? " active" : "")}
            onClick={() => setCharOpen(true)}
            aria-label={`Your guardian: ${charMeta.name} — tap to change`}
          >
            {char === "orb" ? (
              <OrbSafe>
                <Orb seed={7} agentState={ORB_STATE[state]} colors={orbColors} className="gx-chiporb" />
              </OrbSafe>
            ) : (
              <video src={`/avatars/${char}_idle.mp4?v=60`} autoPlay loop muted playsInline />
            )}
          </button>
          <span className="gx-bal">{money(total)}<em>USDC</em></span>
        </div>

        {/* center stage — clay video hero, or the ElevenLabs Orb when the
            "orb" character is selected (same voice-state drive, danger tint
            via orbColors; everything monochrome) */}
        <div className="gx-stage reveal" style={{ ["--d" as string]: "70ms" }} onClick={() => (live ? disconnect() : connect())}>
          <div className="gx-orb">
            <div className="stage-ambient" style={{ ["--sac" as string]: "#ffffff" }} />
            {char === "orb" ? (
              <OrbSafe>
                <Orb seed={7} agentState={ORB_STATE[state]} colors={orbColors} className="gx-heroorb" />
              </OrbSafe>
            ) : (
              <CrossfadeVideo src={`/avatars/${char}_${clip}.mp4?v=60`} />
            )}
          </div>
        </div>

        {/* last-exchange peek — tap for the full transcript.
            The small voice-reactive orb is an ACCENT beside the status readout;
            the clay video avatar above stays the hero. */}
        <button className="gx-peek reveal" style={{ ["--d" as string]: "150ms" }} onClick={() => setTranscriptOpen(true)} aria-label="Open full transcript">
          <span className="gx-hintrow">
            <span className="gx-orbwell" aria-hidden>
              <OrbSafe>
                <Orb seed={11} agentState={ORB_STATE[state]} colors={orbColors} />
              </OrbSafe>
            </span>
            <span className="gx-hint">
              {state === "thinking" || state === "connecting" ? (
                <ShimmeringText text={LABEL[state]} duration={1.4} color="var(--muted)" shimmerColor="var(--mint)" startOnView={false} />
              ) : (
                LABEL[state]
              )}
            </span>
          </span>
          {peekGuardian && <p className={"g" + (userText ? " one" : "")}>{peekGuardian}</p>}
          {userText && <p className="u">{"“" + userText + "”"}</p>}
          {!peekGuardian && !userText && (
            <p className="ph">{danger ? "Danger sensed — I can move you to safety." : armed ? "Armed and watching. Ask me anything." : "Tap the mic and just talk."}</p>
          )}
        </button>

        {/* live feed ticker — fixed-height slot so its arrival never shifts layout */}
        <div className="gx-striprow">
          {latest && (
            <button key={`${latest.ts}-${latest.action}`} className="gx-strip" onClick={() => setPanel("activity")}>
              <span className={"rail b-" + latest.tier} />
              <span className="txt"><b className={"t-" + latest.tier}>{latest.action}</b>{" "}{latest.reason}</span>
              <span className="when">{ago(latest.ts)}</span>
            </button>
          )}
        </div>
      </div>

      {/* floating pill dock — 4 destinations flanking the raised mic */}
      <nav className="gx-dock reveal" style={{ ["--d" as string]: "220ms" }} aria-label="Guardian navigation">
        {DOCK.slice(0, 2).map((m) => (
          <button key={m.id} className={"gx-ditem" + (activeDock === m.id ? " active" : "")} onClick={() => openDock(m.id)} aria-label={m.label}>
            <svg viewBox="0 0 24 24">{m.icon}</svg>
            <span>{m.label}</span>
          </button>
        ))}
        <div className="gx-dockmic">
          {/* ElevenLabs voice-button as the hold-to-talk mic. IMPORTANT: keep it in "idle"
              state — its "recording" state mounts LiveWaveform, which opens its OWN
              getUserMedia + AudioContext and collides with the voice pipeline's mic capture,
              breaking push-to-talk. The voice pipeline owns the mic; hold feedback comes from
              the .gx-mic.holding pulse + the voice-reactive Orb. */}
          <VoiceButton
            state="idle"
            variant="default"
            size="icon"
            icon={<Mic className="size-6.5" strokeWidth={1.9} />}
            className={"gx-mic overflow-hidden rounded-full" + (holding ? " holding" : "")}
            waveformClassName="rounded-full border-0 bg-transparent"
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerLeave={holdEnd}
            onPointerCancel={holdEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Hold to talk"
          />
        </div>
        {DOCK.slice(2).map((m) => (
          <button key={m.id} className={"gx-ditem" + (activeDock === m.id ? " active" : "")} onClick={() => openDock(m.id)} aria-label={m.label}>
            <svg viewBox="0 0 24 24">{m.icon}</svg>
            <span>{m.label}</span>
          </button>
        ))}
      </nav>

      {/* dock sheets — Portfolio (segmented), Activity, Mandates */}
      {panelSheet.shown && (
        <div className={"fl-overlay ctrl" + (panelSheet.closing ? " closing" : "")} onClick={() => setPanel(null)}>
          <div className="fl-sheet gx-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fl-handle" />
            {SHEET_OF[panelSheet.shown] === "portfolio" && (
              <div className="gx-segbar" role="tablist" aria-label="Portfolio views">
                {SEGS.map((s) => (
                  <button key={s.id} role="tab" aria-selected={panelSheet.shown === s.id} className={"gx-segbtn" + (panelSheet.shown === s.id ? " active" : "")} onClick={() => setPanel(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <Panel
              id={panelSheet.shown} g={gstate} feed={feed} busy={busy} ex={ex}
              idle={idle} invested={invested} haven={haven} total={total}
              onCommand={command} onToggleDanger={toggleDanger} dangerOn={dangerOn}
              onEscalate={escalate} escMsg={escMsg} escalating={escalating}
              onArm={() => { setPanel(null); setProposed({ investUsdc: 100, protectUsdc: 100, safeHaven: FLEX_OWNER, hours: 168 }); }}
            />
            <div className="gx-note">The guardian can only ever move funds into the vetted lending markets (Moonwell · Aave · Compound) or to the safe haven you approved on your Ledger Flex — never anywhere else.</div>
          </div>
        </div>
      )}

      {/* Me — character picker + mandate/Flex context */}
      {charSheet.shown && (
        <div className={"fl-overlay ctrl" + (charSheet.closing ? " closing" : "")} onClick={() => setCharOpen(false)}>
          <div className="fl-sheet gx-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fl-handle" />
            <div className="fl-title">Your guardian</div>
            <div className="fl-sub">Currently {charMeta.name} · {charMeta.role}. Six faces, one watchful brain — your pick sticks on this device.</div>
            <div className="gx-mepick">
              <span className="gx-charwell big" aria-hidden>
                {char === "orb" ? (
                  <OrbSafe>
                    <Orb seed={7} agentState={ORB_STATE[state]} colors={orbColors} className="gx-chiporb" />
                  </OrbSafe>
                ) : (
                  <video src={`/avatars/${char}_idle.mp4?v=60`} autoPlay loop muted playsInline />
                )}
              </span>
              <div className="gx-mepick-body">
                <VoicePicker
                  voices={voiceItems}
                  value={char}
                  onValueChange={(v) => pickChar(v as CharId)}
                  placeholder="Choose a guardian…"
                  className="w-full"
                />
                <span className="gx-charrole">{charMeta.name} · {charMeta.role}</span>
              </div>
            </div>
            <div className="fl-rows">
              <div className="fl-row"><span className="k">Mandate</span><span className={"v" + (armed ? " mint" : "")}>{armed ? "● ARMED" : "NOT ARMED"}</span></div>
              <div className="fl-row"><span className="k">Signed by (Flex)</span><span className="v">{short(gstate.policy?.signer ?? FLEX_OWNER)}</span></div>
              <div className="fl-row"><span className="k">Safe haven</span><span className="v">{short(FLEX_OWNER)}</span></div>
            </div>
            <div className="gx-note">Ask for a new mandate in conversation — the guardian drafts it on screen and you approve it on your Ledger Flex. Whichever face you choose, the same signed mandate applies.</div>
            <div className="sheet-foot">Base Sepolia · vault {short(gstate.vault)} · voice works best in desktop Chrome/Edge</div>
          </div>
        </div>
      )}

      {/* full transcript */}
      {txSheet.shown && (
        <div className={"fl-overlay ctrl" + (txSheet.closing ? " closing" : "")} onClick={() => setTranscriptOpen(false)}>
          <div className="fl-sheet gx-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fl-handle" />
            <div className="fl-title">Conversation</div>
            {/* ElevenLabs conversation + message: sticky auto-scroll transcript
                (StickToBottom owns the auto-scroll; scrollRef stays unattached) */}
            <Conversation className="gx-convo">
              <ConversationContent className="flex flex-col gap-0 px-1 py-2">
                {transcript.length === 0 && !guardianText && !userText ? (
                  <ConversationEmptyState
                    className="min-h-40"
                    title={danger ? "Danger sensed" : armed ? "Armed and watching" : "Nothing yet"}
                    description={danger ? "I can move you to safety — just say the word." : armed ? "Ask me anything." : "Hold the mic and just talk."}
                  />
                ) : (
                  <>
                    {transcript.map((m, i) => (
                      <Message key={i} from={m.role === "you" ? "user" : "assistant"} className="py-1.5">
                        <MessageContent variant="contained" className="gx-msg">{m.text}</MessageContent>
                      </Message>
                    ))}
                    {guardianText && (
                      <Message from="assistant" className="py-1.5">
                        <MessageContent variant="contained" className="gx-msg">{guardianText}</MessageContent>
                      </Message>
                    )}
                    {userText && (
                      <Message from="user" className="py-1.5">
                        <MessageContent variant="contained" className="gx-msg">{userText}</MessageContent>
                      </Message>
                    )}
                  </>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>
        </div>
      )}

      {/* draft policy — approve on the Flex */}
      {proposedSheet.shown && (
        <div className={"fl-overlay ctrl" + (proposedSheet.closing ? " closing" : "")} onClick={() => { if (!signing) { setProposed(null); setArmMsg(""); } }}>
          <div className="fl-sheet gx-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fl-handle" />
            <div className="fl-title">Approve on your Flex</div>
            <div className="fl-sub">Your guardian drafted this mandate from your rules. Review it, then approve on your Ledger Flex to arm — it can never do more than this.</div>
            <div className="fl-rows">
              <div className="fl-row"><span className="k">Invest up to</span><span className="v mint">{money(proposedSheet.shown.investUsdc)} USDC</span></div>
              <div className="fl-row"><span className="k">Protect up to</span><span className="v">{money(proposedSheet.shown.protectUsdc)} USDC</span></div>
              <div className="fl-row"><span className="k">Safe haven</span><span className="v">{short(proposedSheet.shown.safeHaven)}</span></div>
              <div className="fl-row"><span className="k">Valid for</span><span className="v">{proposedSheet.shown.hours} hours</span></div>
            </div>
            {/* connect the Flex over USB (WebHID) or wirelessly over Bluetooth (Web BLE) */}
            <div className="gx-segbar" role="tablist" aria-label="Connect the Flex via" style={{ marginTop: 12 }}>
              <button role="tab" aria-selected={signVia === "usb"} className={"gx-segbtn" + (signVia === "usb" ? " active" : "")} onClick={() => setSignVia("usb")} disabled={signing}>USB cable</button>
              <button role="tab" aria-selected={signVia === "ble"} className={"gx-segbtn" + (signVia === "ble" ? " active" : "")} onClick={() => setSignVia("ble")} disabled={signing}>Bluetooth</button>
            </div>
            <button className="gx-act mint" disabled={signing} style={{ width: "100%", marginTop: 12 }} onClick={signProposed}>
              {signing ? (armMsg || "Approving…") : "Approve with Face ID + Flex"}
            </button>
            <div className="gx-hint" style={{ textAlign: "center", marginTop: 10 }}>
              {armMsg === "armed" ? "✓ Guardian armed by your Flex" : armMsg ? armMsg : (ledgerStatus !== "idle" ? ledgerStatus : (signVia === "ble" ? "Bluetooth · turn on the Flex's Bluetooth, unlock it, open the Ethereum app · desktop or Android Chrome" : "USB · unlock the Flex, open the Ethereum app (blind signing on) · desktop Chrome/Edge"))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Panel(props: {
  id: PanelId; g: GState; feed: Act[]; busy: boolean; ex: string;
  idle: number; invested: number; haven: number; total: number;
  onCommand: (a: "invest" | "protect" | "derisk") => void; onToggleDanger: () => void; dangerOn: boolean;
  onEscalate: () => void; escMsg: string; escalating: boolean; onArm: () => void;
}) {
  const { id, g, feed, busy, ex, idle, invested, haven, total, onEscalate, escMsg, escalating, onArm } = props;
  const apr = g.apr ?? null;
  // the market the funds are actually in (largest position), else the current pick — replaces the
  // old hardcoded "Aave" labels now that the vault allocates across Moonwell/Aave/Compound
  const mkts = g.markets ?? [];
  const heldMkt = mkts.find((m) => n(typeof m.position === "number" ? String(m.position) : m.position) > 0);
  const marketName = (heldMkt ?? mkts.find((m) => m.pick))?.name ?? "the best market";

  if (id === "balances") return (
    <>
      <div className="fl-title">Balances</div>
      <div className="gx-grid">
        <div className="gx-stat hero"><div className="k">Total under guard</div><div className="v">{money(total)}<em>USDC</em></div></div>
        <div className="gx-stat"><div className="k">Idle · vault</div><div className="v">{money(idle)}</div></div>
        <div className="gx-stat mint"><div className="k">Invested · {marketName}</div><div className="v">{money(invested)}</div></div>
        <div className="gx-stat"><div className="k">Safe haven</div><div className="v">{money(haven)}</div></div>
        <div className="gx-stat"><div className="k">Supply APR</div><div className="v">{apr != null ? apr.toFixed(2) + "%" : "—"}</div></div>
      </div>
      <div className="gx-actions">
        <button className="gx-act mint" disabled={busy || idle < 1} onClick={() => props.onCommand("invest")}>Invest idle</button>
        <button className="gx-act danger" disabled={busy || idle + invested < 1} onClick={() => props.onCommand("protect")}>Protect all</button>
      </div>
    </>
  );

  if (id === "positions") return (
    <>
      <div className="fl-title">Positions</div>
      <div className="gx-grid">
        <div className="gx-stat hero mint"><div className="k">{marketName}</div><div className="v">{money(invested)}<em>USDC</em></div></div>
        <div className="gx-stat"><div className="k">Supply APR</div><div className="v">{apr != null ? apr.toFixed(2) + "%" : "—"}</div></div>
        <div className="gx-stat"><div className="k">Idle · vault</div><div className="v">{money(idle)}</div></div>
      </div>
      <div className="fl-rows">
        <div className="fl-row"><span className="k">Venue</span><span className="v">{marketName.toUpperCase()}</span></div>
        <div className="fl-row"><span className="k">Vault</span><span className="v"><a href={`${ex}/address/${g.vault}`} target="_blank" rel="noreferrer" style={{ color: "var(--mint)" }}>{short(g.vault)}</a></span></div>
        <div className="fl-row"><span className="k">Chain</span><span className="v">BASE SEPOLIA</span></div>
      </div>
      {invested < 1 && <div className="gx-empty">Nothing deployed right now.</div>}
    </>
  );

  if (id === "investments") {
    const invs = feed.filter((f) => f.action === "INVEST").slice(0, 6);
    return (
      <>
        <div className="fl-title">Investments</div>
        <div className="gx-grid">
          <div className="gx-stat hero mint"><div className="k">Working in {marketName}</div><div className="v">{money(invested)}<em>USDC</em></div></div>
          <div className="gx-stat"><div className="k">APR</div><div className="v">{apr != null ? apr.toFixed(2) + "%" : "—"}</div></div>
          <div className="gx-stat"><div className="k">Est. yearly</div><div className="v">{apr != null ? money(invested * apr / 100) : "—"}</div></div>
        </div>
        <div className="gx-actions">
          <button className="gx-act mint" disabled={busy || idle < 1} onClick={() => props.onCommand("invest")}>Deploy idle</button>
          <button className="gx-act" disabled={busy || invested < 1} onClick={() => props.onCommand("derisk")}>Pull back</button>
        </div>
        <div className="gx-feed">
          {invs.length === 0 && <div className="gx-empty">No investments yet.</div>}
          {invs.map((f, i) => (
            <div className="gx-fitem" key={i}>
              <span className={"rail b-" + f.tier} />
              <div className="body">
                <div className="top"><span className={"tag t-" + f.tier}>Invested</span><span className="amt">{f.amountUsdc} USDC</span></div>
                {f.txUrl && <a href={f.txUrl} target="_blank" rel="noreferrer">view tx ↗</a>}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (id === "markets") {
    const markets = [...(g.markets ?? [])].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return (
      <>
        <div className="fl-title">Markets</div>
        <div className="fl-sub">Lending venues ranked by graphscout&apos;s live risk read × yield. The guardian deploys into the pick and rotates as risk shifts.</div>
        {markets.length === 0 && (
          <div className="gx-empty">
            Waiting for the agent…<br />
            <span className="gx-hint" style={{ display: "inline-block", marginTop: 8 }}>market scores arrive with its next scan</span>
          </div>
        )}
        <div className="gx-feed">
          {markets.map((m, i) => {
            const pos = n(typeof m.position === "number" ? String(m.position) : m.position);
            return (
              <div key={m.id ?? i} className={"gx-mkt" + (m.pick ? " pick" : "")} style={{ ["--d" as string]: `${i * 40}ms` }}>
                <div className="row1">
                  <b className="name">{m.name ?? m.id ?? "market"}</b>
                  <VerdictBadge verdict={m.verdict} />
                  {m.pick && <span className="pickstar">★ PICK</span>}
                  <span className="apr">{fmtPct(m.apr)}<em>APR</em></span>
                </div>
                <div className="row2">
                  <span>TVL {fmtUsd(m.tvlUSD)}</span>
                  {m.tvlChange7dPct != null && (
                    <span className={m.tvlChange7dPct < 0 ? "neg" : "pos"}>{fmtChg(m.tvlChange7dPct)}</span>
                  )}
                  <span>score {fmtScore(m.score)}</span>
                  {m.riskScore != null && <span>risk {fmtScore(m.riskScore)}</span>}
                  {pos > 0 && <span className="inpos">{money(pos)} deployed</span>}
                </div>
              </div>
            );
          })}
        </div>
        {markets.length > 0 && (
          <div className="gx-note">Ask &ldquo;which market is best?&rdquo; — the guardian compares these live and drafts the mandate for your Flex.</div>
        )}
      </>
    );
  }

  if (id === "mandates") {
    const p = g.policy;
    const exp = p ? new Date(Number(p.expiry) * 1000) : null;
    return (
      <>
        <div className="fl-title">Active mandate</div>
        {!p && (
          <>
            <div className="gx-empty">Not armed yet. Sign a mandate on your Ledger Flex to authorize the autonomous guardian — it can then act only within the caps you approve.</div>
            <button className="gx-act mint" style={{ width: "100%", marginTop: 12 }} onClick={onArm}>Arm the guardian — Face ID + Flex</button>
            <div className="gx-hint" style={{ textAlign: "center", marginTop: 8 }}>Desktop Chrome/Edge · Flex on USB, Ethereum app open, blind signing on</div>
          </>
        )}
        {p && (
          <>
            <div className="gx-grid">
              <div className="gx-stat mint"><div className="k">Invest cap</div><div className="v">{money(n(p.investCap))}</div></div>
              <div className="gx-stat"><div className="k">Protect cap</div><div className="v">{money(n(p.protectCap))}</div></div>
            </div>
            <div className="fl-rows">
              <div className="fl-row"><span className="k">Safe haven</span><span className="v">{short(p.safeHaven)}</span></div>
              <div className="fl-row"><span className="k">Signed by (Flex)</span><span className="v mint">{short(p.signer)}</span></div>
              <div className="fl-row"><span className="k">Expires</span><span className="v">{exp ? exp.toLocaleDateString() : "—"}</span></div>
              <div className="fl-row"><span className="k">Status</span><span className="v mint">● ARMED</span></div>
            </div>
            <div className="gx-note">One Flex signature authorizes the whole autonomous policy. The agent acts only within these bounds — a compromised agent still can&apos;t exceed the caps or reach any other address.</div>
          </>
        )}
        <div className="gx-note" style={{ marginTop: 14 }}>
          Emergency: evacuate <b>everything to your cold wallet now</b> — a HIGH-RISK move beyond the
          standing mandate, so it needs a fresh live approval (Face ID + Flex), signed for this one action.
        </div>
        <button className="gx-act danger" disabled={escalating} style={{ width: "100%", marginTop: 10 }} onClick={onEscalate}>
          {escalating ? (escMsg || "Approving…") : "Emergency evacuate — Face ID + Flex"}
        </button>
        {escMsg && !escalating && <div className="gx-hint" style={{ textAlign: "center", marginTop: 8 }}>{escMsg}</div>}
      </>
    );
  }

  // activity
  return (
    <>
      <div className="fl-title">Activity</div>
      <div className="gx-toggle">
        <div className="tl"><b>Simulate danger</b><span>Trigger an autonomous evacuation</span></div>
        <button className={"gx-sw" + (props.dangerOn ? " on" : "")} onClick={props.onToggleDanger} aria-label="Toggle danger"><i /></button>
      </div>
      <div className="gx-feed">
        {feed.length === 0 && <div className="gx-empty">Waiting for the guardian…</div>}
        {feed.map((f, i) => (
          <div className="gx-fitem" key={i}>
            <span className={"rail b-" + f.tier} />
            <div className="body">
              <div className="top">
                <span className={"tag t-" + f.tier}>{f.action}</span>
                {f.amountUsdc && <span className="amt">{f.amountUsdc} USDC</span>}
              </div>
              <div className="reason">{f.reason}</div>
              {f.txUrl && <a href={f.txUrl} target="_blank" rel="noreferrer">view tx ↗</a>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
