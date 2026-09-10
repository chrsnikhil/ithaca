"use client";

import { useEffect, useState } from "react";

type Phase = "intro" | "scanning" | "done";

/* Face ID mark — mint corner brackets + ivory clay face, drawn inline */
function FaceMark() {
  return (
    <svg className="fid-mark" viewBox="0 0 96 96" aria-hidden>
      <g
        stroke="#7BE3CC"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M10 30v-8a12 12 0 0 1 12-12h8" />
        <path d="M66 10h8a12 12 0 0 1 12 12v8" />
        <path d="M86 66v8a12 12 0 0 1-12 12h-8" />
        <path d="M30 86h-8a12 12 0 0 1-12-12v-8" />
      </g>
      <g
        stroke="#F3EDE4"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M35 40v4" />
        <path d="M61 40v4" />
        <path d="M48 42v9a3.5 3.5 0 0 1-3.5 3.5" opacity="0.55" />
        <path d="M34 62c3.5 4.5 8.3 7 14 7s10.5-2.5 14-7" />
      </g>
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

export default function FaceIdFlow({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("done"), 2300);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      className="fl-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "scanning") onClose();
      }}
    >
      <div className="fl-sheet">
        <div className="fl-handle" />

        <div className="fl-phase" key={phase}>
          <div className="fl-stage">
            {phase !== "done" ? (
              <div className={`fid-well ${phase === "scanning" ? "fid-scanning" : ""}`}>
                <FaceMark />
                {phase === "scanning" && <div className="fid-scan" />}
              </div>
            ) : (
              <>
                <span className="fl-ring" aria-hidden />
                <span className="fl-ring c2" aria-hidden />
                <Check />
              </>
            )}
          </div>

          <div className="fl-title">
            {phase === "intro" && "Set up Face ID"}
            {phase === "scanning" && "Scanning your face…"}
            {phase === "done" && "Face ID enabled"}
          </div>
          <div className="fl-sub">
            {phase === "intro" && "Unlock Guardian and approve payments with a glance."}
            {phase === "scanning" && "Hold still — almost there."}
            {phase === "done" && "You're all set. Your capital is locked down."}
          </div>

          {phase === "scanning" && (
            <div className="fl-prog">
              <i />
            </div>
          )}
          {phase === "intro" && (
            <button className="fl-btn" onClick={() => setPhase("scanning")}>
              Start Face Scan
            </button>
          )}
          {phase === "done" && (
            <button className="fl-btn" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
