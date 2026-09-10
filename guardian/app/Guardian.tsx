"use client";

import { useEffect, useRef, useState } from "react";
import FaceIdFlow from "./FaceIdFlow";
import PayFlow from "./PayFlow";

type StateKey =
  | "idle"
  | "listening"
  | "thinking"
  | "talking"
  | "protecting"
  | "alert"
  | "happy";

type CharKey = "tvrobot" | "dog" | "ginger" | "bungirl" | "alien";

const CHARACTERS: {
  key: CharKey;
  name: string;
  role: string;
  hero: string;
  prefix: string;
}[] = [
  { key: "tvrobot", name: "Guardian", role: "Capital protector", hero: "/heroes/tvrobot.webp", prefix: "tv" },
  { key: "dog", name: "Scout", role: "Loyal watchdog", hero: "/heroes/dog.webp", prefix: "dog" },
  { key: "ginger", name: "Max", role: "Quant buddy", hero: "/heroes/ginger.webp", prefix: "ginger" },
  { key: "bungirl", name: "Nova", role: "Markets analyst", hero: "/heroes/bungirl.webp", prefix: "bungirl" },
  { key: "alien", name: "Zap", role: "Cross-chain scout", hero: "/heroes/alien.webp", prefix: "alien" },
];

const STATES: { key: StateKey; label: string; status: string }[] = [
  { key: "idle", label: "Idle", status: "All clear — your capital is protected" },
  { key: "listening", label: "Listen", status: "Listening…" },
  { key: "thinking", label: "Think", status: "Analyzing markets across 3 chains…" },
  { key: "talking", label: "Talk", status: "Here's what I'm seeing right now." },
  { key: "protecting", label: "Protect", status: "Shielding your position — moving to safety" },
  { key: "alert", label: "Alert", status: "Risk detected — acting to protect you" },
  { key: "happy", label: "Happy", status: "Nice — your capital is up 2.4% today" },
];

/* rounded-line state glyphs (16px, stroke inherits) */
const STATE_ICONS: Record<StateKey, React.ReactNode> = {
  idle: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />,
  listening: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <line x1="12" y1="17.5" x2="12" y2="21" />
    </>
  ),
  thinking: (
    <>
      <path d="M12 2.5a6.5 6.5 0 0 0-3.7 11.85c.7.5 1.2 1.3 1.2 2.15h5c0-.85.5-1.65 1.2-2.15A6.5 6.5 0 0 0 12 2.5z" />
      <path d="M9.5 20h5" />
    </>
  ),
  talking: <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />,
  protecting: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  happy: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </>
  ),
};

/* per-state accent for the stage's ambient set-lighting (KILN family) */
const ACCENTS: Record<StateKey, string> = {
  idle: "#7BE3CC",
  listening: "#9FEDDC",
  thinking: "#B7A996",
  talking: "#F2B48C",
  protecting: "#7BE3CC",
  alert: "#E06A4E",
  happy: "#F2B48C",
};

const clipFor = (prefix: string, state: StateKey) => `/avatars/${prefix}_${state}.mp4?v=60`;

/* stagger helper for the entrance choreography */
const d = (ms: number) => ({ "--d": `${ms}ms` } as React.CSSProperties);

/* rAF count-up, isolated so per-frame renders stay local to the number */
function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1300,
  delay = 450,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
      setDisplay(value * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const to = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(to);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span className="tnum">
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

function AvatarStage({ clip }: { clip: string }) {
  const [layers, setLayers] = useState<{ id: number; src: string; on: boolean }[]>([
    { id: 0, src: clip, on: true },
  ]);
  const nextId = useRef(1);
  const prevClip = useRef(clip);

  useEffect(() => {
    if (clip === prevClip.current) return;
    prevClip.current = clip;
    const id = nextId.current++;
    setLayers((ls) => [...ls, { id, src: clip, on: false }]);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, on: true } : l)))
      )
    );
    return () => cancelAnimationFrame(raf);
  }, [clip]);

  const collapse = (id: number) =>
    setLayers((ls) => {
      const top = ls[ls.length - 1];
      return top && top.id === id && top.on ? [top] : ls;
    });

  return (
    <div className="avatar-holder">
      {layers.map((l) => (
        <video
          key={l.id}
          className={`avatar-video ${l.on ? "on" : ""}`}
          src={l.src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onTransitionEnd={(e) => {
            if (e.propertyName === "opacity") collapse(l.id);
          }}
        />
      ))}
    </div>
  );
}

/* ---------- rotary character dial (pop-up) ---------- */
const SLOT = 72; /* 360 / 5 characters */

function CharDial({
  current,
  onPick,
  onClose,
}: {
  current: CharKey;
  onPick: (k: CharKey) => void;
  onClose: () => void;
}) {
  const startIdx = Math.max(
    0,
    CHARACTERS.findIndex((c) => c.key === current)
  );
  const [rot, setRot] = useState(-startIdx * SLOT);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const faceRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const drag = useRef({
    on: false,
    lastA: 0,
    x: 0,
    y: 0,
    moved: 0,
    downIdx: null as number | null,
  });

  const focused =
    ((Math.round(-rot / SLOT) % CHARACTERS.length) + CHARACTERS.length) %
    CHARACTERS.length;
  const focusChar = CHARACTERS[focused];

  const dismiss = (pick?: CharKey) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const instant = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.setTimeout(
      () => {
        if (pick) onPick(pick);
        onClose();
      },
      instant ? 0 : 190
    );
  };

  const confirm = () => dismiss(CHARACTERS[focused].key);

  /* chevrons: settle onto the nearest notch, then advance one slot */
  const step = (dir: 1 | -1) =>
    setRot((r) => Math.round(r / SLOT) * SLOT - dir * SLOT);

  /* tap a rim avatar: shortest spin that seats it under the pointer */
  const rotateTo = (i: number) =>
    setRot((r) => {
      const cur = (((i * SLOT + r) % 360) + 360) % 360;
      const delta = cur <= 180 ? -cur : 360 - cur;
      return r + delta;
    });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const center = () => {
    const r = faceRef.current!.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };
  const angleAt = (e: { clientX: number; clientY: number }) => {
    const { cx, cy } = center();
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const onDown = (e: React.PointerEvent) => {
    if (closingRef.current) return;
    const t = (e.target as HTMLElement).closest?.("[data-idx]") as
      | HTMLElement
      | null;
    drag.current = {
      on: true,
      lastA: angleAt(e),
      x: e.clientX,
      y: e.clientY,
      moved: 0,
      downIdx: t ? Number(t.dataset.idx) : null,
    };
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers may not be capturable — drag still works via bubbling */
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const dg = drag.current;
    if (!dg.on) return;
    dg.moved += Math.abs(e.clientX - dg.x) + Math.abs(e.clientY - dg.y);
    dg.x = e.clientX;
    dg.y = e.clientY;
    const a = angleAt(e);
    let delta = a - dg.lastA;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    dg.lastA = a;
    /* dead zone over the hub — the angle is unstable near the center */
    const { cx, cy } = center();
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (dist > 46 && dg.moved > 4) setRot((v) => v + delta);
  };

  const onUp = () => {
    const dg = drag.current;
    if (!dg.on) return;
    dg.on = false;
    setDragging(false);
    if (dg.moved < 8 && dg.downIdx !== null) {
      if (dg.downIdx === focused) confirm();
      else rotateTo(dg.downIdx);
    } else {
      setRot((r) => Math.round(r / SLOT) * SLOT);
    }
  };

  return (
    <div
      className={`dial-overlay ${closing ? "closing" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="dial-pop" role="dialog" aria-label="Choose your avatar">
        <div className="dial-head">
          <span className="label">Choose your guardian</span>
          <button className="dial-x" onClick={() => dismiss()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6.5 6.5l11 11" />
              <path d="M17.5 6.5l-11 11" />
            </svg>
          </button>
        </div>

        <div className="dial-wrap">
          <span className="dial-pointer" aria-hidden>
            <svg viewBox="0 0 24 14">
              <path
                d="M4.6 0h14.8c1.6 0 2.6 1.4 1.4 2.9l-7 9.7c-.9 1.3-2.7 1.3-3.6 0l-7-9.7C2 1.4 3 0 4.6 0z"
                fill="currentColor"
              />
            </svg>
          </span>

          <div
            ref={faceRef}
            className={`dial-face ${dragging ? "dragging" : ""}`}
            style={{ "--rot": `${rot}deg` } as React.CSSProperties}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="dial-groove" aria-hidden />
            <div className="dial-rotor">
              {CHARACTERS.map((c, i) => (
                <div
                  key={c.key}
                  className="dial-slot"
                  style={{ "--a": `${i * SLOT}deg` } as React.CSSProperties}
                >
                  <span
                    className={`dial-av ${i === focused ? "focus" : ""}`}
                    data-idx={i}
                    role="button"
                    aria-label={c.name}
                  >
                    <span className="dial-avc">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.hero} alt="" draggable={false} />
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="dial-hub">
              <b className="swap-in" key={`hn-${focused}`}>
                {focusChar.name}
              </b>
              <span className="swap-in" key={`hr-${focused}`}>
                {focusChar.role}
              </span>
            </div>
          </div>
        </div>

        <div className="dial-actions">
          <button className="dial-chev" onClick={() => step(-1)} aria-label="Previous">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M14.5 5.5 8 12l6.5 6.5" />
            </svg>
          </button>
          <button className="dial-select" onClick={confirm}>
            Select {focusChar.name}
          </button>
          <button className="dial-chev" onClick={() => step(1)} aria-label="Next">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M9.5 5.5 16 12l-6.5 6.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Guardian() {
  const [charKey, setCharKey] = useState<CharKey>("tvrobot");
  const [stateKey, setStateKey] = useState<StateKey>("idle");
  const [auto, setAuto] = useState(false);
  const [overlay, setOverlay] = useState<"faceid" | "pay" | null>(null);
  const [dialOpen, setDialOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const char = CHARACTERS.find((c) => c.key === charKey)!;
  const meta = STATES.find((s) => s.key === stateKey)!;
  const clip = clipFor(char.prefix, stateKey);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setStateKey((prev) => {
        const i = STATES.findIndex((s) => s.key === prev);
        return STATES[(i + 1) % STATES.length].key;
      });
    }, 3200);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (!sheetOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sheetOpen]);

  const pickChar = (k: CharKey) => {
    setCharKey(k);
    setStateKey("idle");
  };

  /* poke the guardian: cycle to the next state */
  const cycleState = () => {
    setAuto(false);
    setStateKey((prev) => {
      const i = STATES.findIndex((s) => s.key === prev);
      return STATES[(i + 1) % STATES.length].key;
    });
  };

  return (
    <main className="app">
      <div className="preload" aria-hidden style={{ display: "none" }}>
        {STATES.map((s) => (
          <link key={s.key} rel="preload" as="video" href={clipFor(char.prefix, s.key)} />
        ))}
      </div>

      <div className="zen" style={{ "--sac": ACCENTS[stateKey] } as React.CSSProperties}>
        <header className="zen-top reveal" style={d(0)}>
          <span className="zen-mark">
            <span className="zen-dot" aria-hidden />
            <span className="swap-in" key={`n-${charKey}`}>
              {char.name}
            </span>
          </span>
          <span className="zen-bal tnum">
            <CountUp value={12480} prefix="$" duration={1400} delay={600} />
            <em>
              <CountUp value={2.4} decimals={1} prefix="+" suffix="%" duration={1200} delay={800} />
            </em>
          </span>
        </header>

        <button
          className="zen-stage reveal"
          style={d(70)}
          onClick={cycleState}
          aria-label={`${char.name} — tap to change state`}
        >
          <span className="stage-ambient" key={`amb-${stateKey}`} aria-hidden />
          <AvatarStage clip={clip} />
        </button>

        <div className="zen-status reveal" style={d(150)}>
          <span className="zen-voice" key={stateKey}>
            <span className="si" aria-hidden />
            {meta.status}
          </span>
        </div>

        <button
          className="zen-grip reveal"
          style={d(230)}
          onClick={() => setSheetOpen(true)}
          aria-label="Open controls"
        >
          <span aria-hidden />
        </button>
      </div>

      {sheetOpen && (
        <div
          className="fl-overlay ctrl"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div className="fl-sheet ctrl-sheet" role="dialog" aria-label="Guardian controls">
            <div className="fl-handle" />

            <div className="block reveal" style={d(30)}>
              <div className="block-head">
                <span className="label">State</span>
                <button
                  className={`btn-ghost ${auto ? "on" : ""}`}
                  onClick={() => setAuto((a) => !a)}
                >
                  {auto ? "Stop" : "Auto"}
                </button>
              </div>
              <div className="states">
                {STATES.map((s) => (
                  <button
                    key={s.key}
                    className={`seg ${stateKey === s.key ? "active" : ""}${s.key === "alert" ? " hot" : ""}`}
                    onClick={() => {
                      setAuto(false);
                      setStateKey(s.key);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden>
                      {STATE_ICONS[s.key]}
                    </svg>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="block reveal" style={d(80)}>
              <span className="label">Guardian</span>
              <button
                className="char-tile"
                onClick={() => {
                  setSheetOpen(false);
                  setDialOpen(true);
                }}
              >
                <span className="char-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={char.hero} alt={char.name} />
                </span>
                <span className="char-meta">
                  <b className="swap-in" key={`ct-${charKey}`}>
                    {char.name}
                  </b>
                  <span>{char.role}</span>
                </span>
                <span className="char-change">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.13" />
                    <path d="M20.7 2.6v4.5h-4.5" />
                  </svg>
                  Change
                </span>
              </button>
            </div>

            <div className="block reveal" style={d(130)}>
              <span className="label">Quick actions</span>
              <div className="tiles">
                <button
                  className="tile"
                  onClick={() => {
                    setSheetOpen(false);
                    setOverlay("faceid");
                  }}
                >
                  <span className="tile-icon" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <path d="M7 3H5a2 2 0 0 0-2 2v2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
                      <path d="M9 9.5v1" />
                      <path d="M15 9.5v1" />
                      <path d="M8.5 15s1.3 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
                    </svg>
                  </span>
                  <div>
                    <b>Set up Face ID</b>
                    <span>Biometric unlock</span>
                  </div>
                </button>
                <button
                  className="tile"
                  onClick={() => {
                    setSheetOpen(false);
                    setOverlay("pay");
                  }}
                >
                  <span className="tile-icon" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M12 8v8" />
                      <path d="M14.5 9.8c-.5-.8-1.4-1.3-2.5-1.3-1.4 0-2.5.8-2.5 1.9 0 2.6 5 1.2 5 3.7 0 1.1-1.1 1.9-2.5 1.9-1.1 0-2-.5-2.5-1.3" />
                    </svg>
                  </span>
                  <div>
                    <b>Send payment</b>
                    <span>Guarded transfer</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="sheet-foot reveal" style={d(180)}>
              Autonomous · Face ID · Arc · Privy · The Graph
            </div>
          </div>
        </div>
      )}

      {dialOpen && (
        <CharDial
          current={charKey}
          onPick={pickChar}
          onClose={() => setDialOpen(false)}
        />
      )}
      {overlay === "faceid" && <FaceIdFlow onClose={() => setOverlay(null)} />}
      {overlay === "pay" && <PayFlow onClose={() => setOverlay(null)} />}
    </main>
  );
}
