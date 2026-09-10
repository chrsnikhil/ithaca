"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "enter" | "sending" | "done";

/* KILN confetti: mint, peach, clay, ivory */
const COLORS = ["#7BE3CC", "#F2B48C", "#B7A996", "#F3EDE4"];

/* peach clay coin — drawn inline, no image assets */
function Coin({ size = 124, className = "", style }: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
    >
      <circle cx="24" cy="26" r="20" fill="#C4805A" />
      <circle cx="24" cy="22.5" r="20" fill="#F2B48C" />
      <circle cx="24" cy="21.5" r="19" fill="#F7C39E" />
      <circle
        cx="24"
        cy="22.5"
        r="13.5"
        fill="none"
        stroke="#C4805A"
        strokeWidth="2.4"
      />
      <text
        x="24"
        y="28.5"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill="#7A4322"
        fontFamily="inherit"
      >
        $
      </text>
    </svg>
  );
}

function Check() {
  return (
    <span className="fl-check fl-pop">
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M5.5 12.5 10 17 18.5 8" />
      </svg>
    </span>
  );
}

export default function PayFlow({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    if (phase !== "sending") return;
    const t = setTimeout(() => setPhase("done"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 80 + Math.random() * 110;
        return {
          bg: COLORS[i % 4],
          cx: `${Math.cos(a) * dist}px`,
          cy: `${Math.sin(a) * dist - 30}px`,
          cr: `${(Math.random() - 0.5) * 720}deg`,
          sz: `${7 + Math.random() * 6}px`,
          dur: `${0.8 + Math.random() * 0.7}s`,
          delay: `${Math.random() * 0.12}s`,
          round: i % 2 === 0,
        };
      }),
    []
  );

  return (
    <div
      className="fl-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "sending") onClose();
      }}
    >
      <div className="fl-sheet">
        <div className="fl-handle" />

        {phase === "enter" && (
          <div className="fl-phase" key="enter">
            <div className="fl-title">Send payment</div>
            <div className="fl-sub">Auto-approved by your Guardian.</div>
            <div className="fl-amount" style={{ marginTop: 16 }}>
              $4.20
            </div>
            <div className="fl-rows">
              <div className="fl-row">
                <span className="k">Token</span>
                <span className="v">
                  <Coin size={20} /> USDC · on Sui
                </span>
              </div>
              <div className="fl-row">
                <span className="k">To</span>
                <span className="v">0xA1…9F2</span>
              </div>
              <div className="fl-row">
                <span className="k">Route safety</span>
                <span className="v mint">Verified</span>
              </div>
            </div>
            <button className="fl-btn" onClick={() => setPhase("sending")}>
              Send $4.20
            </button>
            <button className="fl-btn quiet" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}

        {phase === "sending" && (
          <div className="fl-phase" key="sending">
            <div className="fl-stage">
              <Coin className="fl-coin fl-spin" />
              {[0, 1, 2, 3, 4].map((i) => (
                <Coin
                  key={i}
                  size={38}
                  className="fl-fly"
                  style={
                    {
                      left: `${32 + i * 8}%`,
                      bottom: 52,
                      "--fx": `${(i - 2) * 16}px`,
                      "--fr": `${(i - 2) * 22}deg`,
                      animation: `fl-flyup ${1 + (i % 3) * 0.16}s ${i * 0.13}s ease-in infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <div className="fl-title">Sending…</div>
            <div className="fl-sub">Signing and broadcasting your transaction.</div>
            <div className="fl-prog pay">
              <i />
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="fl-phase" key="done">
            <div className="fl-stage">
              <div className="fl-confetti">
                {confetti.map((c, i) => (
                  <i
                    key={i}
                    style={
                      {
                        background: c.bg,
                        borderRadius: c.round ? "999px" : "3px",
                        animation: `fl-conf ${c.dur} ${c.delay} cubic-bezier(0.16, 0.8, 0.4, 1) forwards`,
                        "--cx": c.cx,
                        "--cy": c.cy,
                        "--cr": c.cr,
                        "--sz": c.sz,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <span className="fl-ring" aria-hidden />
              <span className="fl-ring c2" aria-hidden />
              <Check />
            </div>
            <div className="fl-title">Payment sent</div>
            <div className="fl-sub">$4.20 USDC delivered · confirmed on Sui.</div>
            <button className="fl-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
