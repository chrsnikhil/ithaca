"use client";

/* ============================================================
   GUARDIAN — brand film (/demo)
   ~42s auto-playing kinetic-typography motion sequence.
   Swiss-editorial on pure black: giant ivory type, dot fields,
   thin technical annotation, corner metadata. KILN ZEN tokens.

   ?scene=N  -> freeze scene N in its settled state
   ?record=1 -> hide chrome (replay + progress dots)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import "./demo.css";

/* ---------------- timeline ---------------- */

const DUR = [3200, 5000, 6200, 6400, 7000, 6000, 5000, 4800];
const OFFSET = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
const SCENE_TAG = [
  "00 · cold open",
  "01 · the name",
  "02 · how it works",
  "03 · defense",
  "04 · the guardian",
  "05 · the stack",
  "06 · the balance",
  "07 · close",
];

type Boot = { frozen: number | null; record: boolean; rm: boolean };

/* ---------------- page ---------------- */

export default function DemoFilm() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [take, setTake] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("scene");
    const frozen =
      s !== null && /^\d+$/.test(s)
        ? Math.min(7, Math.max(0, parseInt(s, 10)))
        : null;
    setBoot({
      frozen,
      record: q.get("record") === "1",
      rm: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  if (!boot) return <main className="film" aria-label="Guardian brand film" />;
  return <Film key={take} boot={boot} onReplay={() => setTake((t) => t + 1)} />;
}

/* ---------------- the film ---------------- */

function Film({ boot, onReplay }: { boot: Boot; onReplay: () => void }) {
  const { frozen, record, rm } = boot;
  const [scene, setScene] = useState(frozen ?? 0);
  const [leaving, setLeaving] = useState<number | null>(null);

  /* scene state machine — timers only, no scroll, no interaction */
  useEffect(() => {
    if (frozen !== null) return;
    let dead = false;
    const timers: number[] = [];
    const go = (i: number) => {
      timers.push(
        window.setTimeout(() => {
          if (dead) return;
          if (i >= 7) {
            onReplay(); // loop the film
            return;
          }
          setLeaving(i);
          setScene(i + 1);
          timers.push(window.setTimeout(() => setLeaving(null), 520));
          go(i + 1);
        }, DUR[i])
      );
    };
    go(0);
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
    };
  }, [frozen, onReplay]);

  const settled = frozen !== null;

  const renderScene = (i: number, out: boolean) => (
    <section
      key={i}
      className={`scene${out ? " out" : ""}`}
      aria-hidden={out}
    >
      {i === 0 && <ColdOpen />}
      {i === 1 && <HeroWord />}
      {i === 2 && <KineticProp />}
      {i === 3 && <DotShield frozen={settled} rm={rm} />}
      {i === 4 && <AvatarInterlude />}
      {i === 5 && <FeatureStack />}
      {i === 6 && <NumberMoment frozen={settled} rm={rm} />}
      {i === 7 && <Close />}
    </section>
  );

  return (
    <main className="film">
      <div className={`stage${settled ? " settled" : ""}`}>
        {leaving !== null && renderScene(leaving, true)}
        {renderScene(scene, false)}

        {/* persistent corner metadata — part of the film */}
        <header className="meta tl">GUARDIAN — CAPITAL PROTECTOR</header>
        <div className="meta tr">V1 · 2026</div>
        <div className="meta bl" key={`tag-${scene}`}>
          {SCENE_TAG[scene]}
        </div>
        <div className="meta br">
          TC <Timecode frozenMs={settled ? OFFSET[scene] + DUR[scene] : null} />
        </div>

        {/* chrome — hidden in ?record=1 */}
        {!record && (
          <nav className="chrome" aria-label="film controls">
            <div className="prog">
              {DUR.map((_, i) => (
                <i key={i} className={i === scene ? "on" : ""} />
              ))}
            </div>
            <button className="replay" onClick={onReplay}>
              replay
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

/* ---------------- timecode (rAF, text-only updates) ---------------- */

const pad = (n: number) => String(n).padStart(2, "0");
const fmtTc = (ms: number) => {
  const t = Math.max(0, ms);
  return `${pad(Math.floor(t / 60000))}:${pad(
    Math.floor((t % 60000) / 1000)
  )}:${pad(Math.floor((t % 1000) / 40))}`;
};

function Timecode({ frozenMs }: { frozenMs: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (frozenMs !== null) {
      if (ref.current) ref.current.textContent = fmtTc(frozenMs);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      if (ref.current) ref.current.textContent = fmtTc(t - t0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frozenMs]);
  return <span ref={ref} className="tnum" />;
}

/* ================= scene 0 — cold open ================= */

function ColdOpen() {
  return (
    <div className="s0">
      <span className="s0-line a-drawx" style={dv("620ms", "1400ms")} />
      <span className="s0-dot a-pop pulse" style={dv("260ms")} />
      <p className="micro s0-cap a-fade" style={dv("1900ms")}>
        WATCH PROTOCOL — ONLINE
      </p>
    </div>
  );
}

/* ================= scene 1 — hero word ================= */

function HeroWord() {
  return (
    <div className="s1">
      <h1 className="s1-word a-settle" aria-label="GUARDIAN">
        {"GUARDIAN".split("").map((ch, i) => (
          <span key={i} className="a-letter" style={{ "--i": i } as never}>
            {ch}
          </span>
        ))}
      </h1>
      <p className="micro s1-cap a-fade" style={dv("1600ms")}>
        YOUR CAPITAL, WATCHED — ALWAYS
      </p>
    </div>
  );
}

/* ================= scene 2 — kinetic value-prop ================= */

function KineticProp() {
  return (
    <div className="s2">
      <p className="micro s2-tag a-fade" style={dv("200ms")}>
        01 / HOW IT WORKS
      </p>

      <span className="s2-w s2-w1 a-rise" style={dv("400ms")}>
        capital
      </span>
      <span className="s2-w s2-w2 a-rise" style={dv("1500ms")}>
        protected
      </span>
      <span className="s2-w s2-w3 a-rise" style={dv("2700ms")}>
        autonomously
      </span>
      <span className="s2-w s2-w4 a-rise" style={dv("3600ms")}>
        on-chain
      </span>

      {/* hairline connectors */}
      <span className="hl v s2-c1 a-drawy" style={dv("950ms")} />
      <span className="hl h s2-c2 a-drawx" style={dv("1250ms")} />
      <span className="hl v s2-c3 a-drawy" style={dv("2350ms")} />
      <span className="hl h s2-c4 a-drawx" style={dvo("2650ms", "right center")} />
      <span className="hl h s2-c5 a-drawx" style={dv("3350ms")} />

      <span className="joint s2-j1 a-fade" style={dv("1300ms")} />
      <span className="joint s2-j2 a-fade" style={dv("2700ms")} />
      <p className="micro s2-coord a-fade tnum" style={dv("1500ms")}>
        x 228
      </p>
    </div>
  );
}

/* ================= scene 3 — dot-field shield ================= */

const TAU = Math.PI * 2;
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function shieldPath(c: CanvasRenderingContext2D, w: number, h: number) {
  const x0 = w * 0.08,
    x1 = w * 0.92,
    y0 = h * 0.05,
    yb = h * 0.97,
    rr = w * 0.1,
    ym = h * 0.55,
    cx = w / 2;
  c.beginPath();
  c.moveTo(x0, y0 + rr);
  c.quadraticCurveTo(x0, y0, x0 + rr, y0);
  c.lineTo(x1 - rr, y0);
  c.quadraticCurveTo(x1, y0, x1, y0 + rr);
  c.lineTo(x1, ym);
  c.quadraticCurveTo(x1, h * 0.82, cx, yb);
  c.quadraticCurveTo(x0, h * 0.82, x0, ym);
  c.closePath();
}

function heartPath(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const s = size / 2;
  c.beginPath();
  c.moveTo(cx, cy + s * 0.9);
  c.bezierCurveTo(cx - s * 1.15, cy + s * 0.22, cx - s * 0.95, cy - s * 0.78, cx, cy - s * 0.28);
  c.bezierCurveTo(cx + s * 0.95, cy - s * 0.78, cx + s * 1.15, cy + s * 0.22, cx, cy + s * 0.9);
  c.closePath();
}

function samplePts(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  step: number,
  rand: () => number
) {
  const data = c.getImageData(0, 0, w, h).data;
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (data[(y * w + x) * 4 + 3] > 128)
        pts.push({
          x: x + (rand() - 0.5) * step * 0.9,
          y: y + (rand() - 0.5) * step * 0.9,
        });
  return pts;
}

const IVORY = "#f3ede4",
  MINT = "#7be3cc",
  PEACH = "#f2b48c",
  TERRA = "#e06a4e",
  BLUE = "#7db3e3",
  LAV = "#c7b8e8",
  DIM = "#8d8478";

const pickShield = (r: number) =>
  r < 0.5 ? IVORY : r < 0.68 ? DIM : r < 0.8 ? MINT : r < 0.87 ? BLUE : r < 0.94 ? LAV : PEACH;
const pickHeart = (r: number) => (r < 0.55 ? PEACH : r < 0.85 ? TERRA : IVORY);

function DotShield({ frozen, rm }: { frozen: boolean; rm: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width,
      h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    const rand = mulberry32(20260904);

    /* sample the silhouette: shield with heart cut out + inner heart */
    const SW = 220,
      SH = 260;
    const off = document.createElement("canvas");
    off.width = SW;
    off.height = SH;
    const oc = off.getContext("2d");
    if (!oc) return;
    oc.fillStyle = "#fff";
    shieldPath(oc, SW, SH);
    oc.fill();
    oc.globalCompositeOperation = "destination-out";
    heartPath(oc, SW / 2, SH * 0.43, SW * 0.52);
    oc.fill();
    const shieldPts = samplePts(oc, SW, SH, 6, rand);
    oc.globalCompositeOperation = "source-over";
    oc.clearRect(0, 0, SW, SH);
    heartPath(oc, SW / 2, SH * 0.43, SW * 0.36);
    oc.fill();
    const heartPts = samplePts(oc, SW, SH, 5, rand);

    const scale = (h * 0.6) / SH;
    const cx = w * 0.5,
      cy = h * 0.465;

    type Dot = {
      sx: number; sy: number; dx: number; dy: number;
      tx: number; ty: number; r: number; c: string;
      d: number; dur: number; ph: number; sa: number;
    };
    const dots: Dot[] = [];
    const add = (pts: { x: number; y: number }[], color: (r: number) => string) => {
      for (const p of pts)
        dots.push({
          sx: rand() * w,
          sy: rand() * h,
          dx: (rand() - 0.5) * 16,
          dy: (rand() - 0.5) * 16,
          tx: cx + (p.x - SW / 2) * scale,
          ty: cy + (p.y - SH / 2) * scale,
          r: 1.1 + rand() * 1.5,
          c: color(rand()),
          d: rand() * 1100,
          dur: 1300 + rand() * 700,
          ph: rand() * TAU,
          sa: 0.2 + rand() * 0.4,
        });
    };
    add(shieldPts, pickShield);
    add(heartPts, pickHeart);

    const T0 = 1250; /* scatter hold before assembly */
    const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

    const draw = (elapsed: number, breathe: boolean) => {
      ctx.clearRect(0, 0, w, h);
      for (const dot of dots) {
        const start = T0 + dot.d;
        const p = elapsed <= start ? 0 : Math.min((elapsed - start) / dot.dur, 1);
        const e = easeOut(p);
        const driftT = Math.min(elapsed, start) / 1000;
        const bx = dot.sx + dot.dx * driftT;
        const by = dot.sy + dot.dy * driftT;
        let tx = dot.tx,
          ty = dot.ty;
        if (breathe && p === 1) {
          tx += Math.sin(elapsed / 900 + dot.ph) * 0.7;
          ty += Math.cos(elapsed / 1100 + dot.ph) * 0.7;
        }
        ctx.globalAlpha = (dot.sa + (1 - dot.sa) * e) * Math.min(elapsed / 600, 1);
        ctx.fillStyle = dot.c;
        ctx.beginPath();
        ctx.arc(bx + (tx - bx) * e, by + (ty - by) * e, dot.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    if (frozen || rm) {
      draw(1e7, false); /* settled: everything assembled */
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      draw(t - t0, true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frozen, rm]);

  return (
    <div className="s3">
      <canvas ref={canvasRef} className={`s3-canvas${rm ? " a-fade" : ""}`} />
      <p className="micro s3-cap a-fade" style={dv("3400ms")}>
        AUTONOMOUS DEFENSE
      </p>
      {/* technical annotation: left scale + top-right crosshair */}
      <span className="hl v s3-axis a-drawy" style={dv("2900ms")} />
      <span className="tick s3-t1 a-fade" style={dv("3100ms")} />
      <span className="tick s3-t2 a-fade" style={dv("3200ms")} />
      <span className="tick s3-t3 a-fade" style={dv("3300ms")} />
      <p className="micro s3-a1 a-fade tnum" style={dv("3250ms")}>
        48.2
      </p>
      <p className="micro s3-a2 a-fade tnum" style={dv("3400ms")}>
        12.6
      </p>
      <p className="micro s3-a3 a-fade tnum" style={dv("3500ms")}>
        0.0
      </p>
      <span className="cross s3-x a-fade" style={dv("3600ms")} />
      <p className="micro s3-xl a-fade tnum" style={dv("3750ms")}>
        512 · 208
      </p>
    </div>
  );
}

/* ================= scene 4 — avatar interlude ================= */

function AvatarInterlude() {
  const [src, setSrc] = useState("/avatars/tv_protecting.mp4?v=60");
  return (
    <div className="s4">
      <p className="micro s4-tag a-fade" style={dv("300ms")}>
        02 / THE GUARDIAN
      </p>
      <div className="s4-holder a-fade" style={dv("400ms", "1100ms")}>
        <video
          className="s4-video"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() =>
            setSrc((s) =>
              s.includes("tv_protecting") ? "/avatars/tv_idle.mp4?v=60" : s
            )
          }
        />
        {/* static radial vignette — never a mask over the video */}
        <span className="s4-vignette" />
      </div>

      {/* annotation: antenna (top right) */}
      <span className="hl h s4-l1 a-drawx" style={dvo("1600ms", "right center")} />
      <span className="joint s4-p1 a-fade" style={dv("1550ms")} />
      <p className="micro s4-a1 a-fade" style={dv("1950ms")}>
        ANTENNA — SIGNAL
      </p>

      {/* annotation: status (right mid) */}
      <span className="hl h s4-l2 a-drawx" style={dvo("2400ms", "right center")} />
      <span className="joint s4-p2 a-fade" style={dv("2350ms")} />
      <p className="micro s4-a2 a-fade" style={dv("2750ms")}>
        <span className="mintdot pulse" /> STATUS: PROTECTED
      </p>

      {/* annotation: heart (left) */}
      <span className="hl h s4-l3 a-drawx" style={dv("3200ms")} />
      <span className="joint s4-p3 a-fade" style={dv("3550ms")} />
      <p className="micro s4-a3 a-fade" style={dv("3550ms")}>
        HEART — EMPATHY CORE
      </p>
    </div>
  );
}

/* ================= scene 5 — feature stack ================= */

const FEATURES = [
  { name: "Face ID", desc: "biometric lock", meta: "01 · LOCAL" },
  { name: "Arc", desc: "cross-chain USDC", meta: "02 · RAIL" },
  { name: "The Graph", desc: "real-time watch", meta: "03 · LIVE" },
];

function FeatureStack() {
  return (
    <div className="s5">
      <p className="micro s5-tag a-fade" style={dv("200ms")}>
        03 / THE STACK
      </p>
      <div className="s5-rows">
        {FEATURES.map((f, i) => (
          <div key={f.name} className="s5-row">
            <div className="s5-line a-rise" style={dv(`${500 + i * 800}ms`)}>
              <svg className="s5-tick" viewBox="0 0 12 12" aria-hidden="true">
                <polyline points="2,6.5 5,9.5 10,3" fill="none" />
              </svg>
              <b>{f.name}</b>
              <span className="s5-desc">{f.desc}</span>
              <span className="micro s5-meta tnum">{f.meta}</span>
            </div>
            <span
              className="hl h s5-rule a-drawx"
              style={dv(`${700 + i * 800}ms`, "1000ms")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= scene 6 — number moment ================= */

function NumberMoment({ frozen, rm }: { frozen: boolean; rm: boolean }) {
  const snap = frozen || rm;
  const [v, setV] = useState(snap ? 12480 : 0);
  useEffect(() => {
    if (snap) return;
    let raf = 0,
      start = 0;
    const dur = 1900;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); /* easeOutExpo */
      setV(Math.round(12480 * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const to = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 700);
    return () => {
      clearTimeout(to);
      cancelAnimationFrame(raf);
    };
  }, [snap]);

  return (
    <div className="s6">
      <p className="micro s6-tag a-fade" style={dv("200ms")}>
        04 / YOUR BALANCE, SAFE
      </p>
      <p className="micro s6-over a-fade" style={dv("400ms")}>
        PROTECTED BALANCE
      </p>
      <h2 className="s6-num tnum a-rise" style={dv("500ms")}>
        ${v.toLocaleString("en-US")}
      </h2>
      <span className="hl h s6-rule a-drawx" style={dv("2500ms")} />
      <p className="micro s6-delta a-fade tnum" style={dv("2800ms")}>
        +2.4% · 24H PROTECTED
      </p>
    </div>
  );
}

/* ================= scene 7 — close ================= */

function Close() {
  return (
    <div className="s7">
      <span className="corner c-tl a-fade" style={dv("300ms")} />
      <span className="corner c-tr a-fade" style={dv("400ms")} />
      <span className="corner c-bl a-fade" style={dv("500ms")} />
      <span className="corner c-br a-fade" style={dv("600ms")} />
      <span className="s7-dot a-pop pulse" style={dv("800ms")} />
      <h2 className="s7-word a-rise" style={dv("950ms")}>
        GUARDIAN
      </h2>
      <p className="micro s7-tag a-fade" style={dv("1700ms")}>
        YOUR AUTONOMOUS ON-CHAIN GUARDIAN
      </p>
    </div>
  );
}

/* ---------------- style helpers ---------------- */

/* delay (+ optional duration) vars for the animation utilities */
const dv = (d: string, t?: string) =>
  ({ "--d": d, ...(t ? { "--t": t } : {}) } as never);
const dvo = (d: string, origin: string) =>
  ({ "--d": d, "--o": origin } as never);
