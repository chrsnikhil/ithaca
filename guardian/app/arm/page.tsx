"use client";
import { useState } from "react";
import { useLedgerPolicy } from "../lib/useLedgerPolicy";
import { FLEX_OWNER } from "../lib/deployments";

export default function ArmPage() {
  const { status, result, armWithLedger } = useLedgerPolicy();
  const [investUsdc, setInvestUsdc] = useState(1000);
  const [protectUsdc, setProtectUsdc] = useState(1000);
  const [safeHaven, setSafeHaven] = useState(FLEX_OWNER);
  const [hours, setHours] = useState(168);
  const [serverMsg, setServerMsg] = useState("");

  const doArm = async () => {
    setServerMsg("");
    const signed = await armWithLedger({ investUsdc, protectUsdc, safeHaven, hours });
    if (signed?.ok) {
      try {
        const r = await fetch("/api/arm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policy: signed.policy, signature: signed.signature }) });
        const j = await r.json();
        setServerMsg(j.ok ? `✓ Guardian armed — the daemon verified your Flex signature (${String(j.signer).slice(0, 10)}…)` : `daemon rejected: ${j.error || "unknown"}`);
      } catch (e) {
        setServerMsg("relay failed: " + (e instanceof Error ? e.message : String(e)));
      }
    }
  };

  const box: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(243,237,228,0.12)",
    background: "#0f0f11", color: "var(--fg,#f3ede4)", fontSize: 15, fontFamily: "inherit",
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "var(--fg,#f3ede4)", fontFamily: "var(--font-sans,system-ui)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", gap: 22 }}>
      <div style={{ maxWidth: 440, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Arm your Guardian</h1>
          <p style={{ color: "var(--muted,#a2978a)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Sign one <strong>policy</strong> on your Ledger Flex. Your guardian then runs autonomously —
            investing idle USDC into Aave for yield and evacuating to your safe haven in danger — but <em>only</em> within
            these caps, to this safe haven, until it expires. It can never do more than you signed.
          </p>
        </div>

        <label style={{ fontSize: 13, color: "var(--muted,#a2978a)" }}>Max to invest into Aave (USDC)
          <input type="number" value={investUsdc} onChange={(e) => setInvestUsdc(Number(e.target.value))} style={{ ...box, marginTop: 6 }} />
        </label>
        <label style={{ fontSize: 13, color: "var(--muted,#a2978a)" }}>Max to evacuate to safety (USDC)
          <input type="number" value={protectUsdc} onChange={(e) => setProtectUsdc(Number(e.target.value))} style={{ ...box, marginTop: 6 }} />
        </label>
        <label style={{ fontSize: 13, color: "var(--muted,#a2978a)" }}>Safe haven (where danger evacuations go)
          <input value={safeHaven} onChange={(e) => setSafeHaven(e.target.value)} style={{ ...box, marginTop: 6, fontSize: 12 }} />
        </label>
        <label style={{ fontSize: 13, color: "var(--muted,#a2978a)" }}>Valid for (hours)
          <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} style={{ ...box, marginTop: 6 }} />
        </label>

        <button
          onClick={doArm}
          style={{ padding: "15px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--mint,#7be3cc)", color: "#0c231e", fontSize: 16, fontWeight: 650 }}
        >
          Sign policy on Ledger Flex
        </button>

        <div style={{ fontSize: 13, color: status.startsWith("error") ? "var(--danger,#e06a4e)" : "var(--fg-soft,#d9d0c3)", minHeight: 20 }}>{status}</div>

        {result && (
          <div style={{ background: "#0f0f11", border: "1px solid rgba(243,237,228,0.12)", borderRadius: 14, padding: 14, fontSize: 12, wordBreak: "break-all", color: "var(--muted,#a2978a)" }}>
            <div style={{ color: result.ok ? "var(--mint,#7be3cc)" : "var(--danger,#e06a4e)", fontWeight: 650, marginBottom: 8 }}>
              {result.ok ? "✓ Policy signed by your Flex" : "⚠ Signed by a different address"}
            </div>
            <div>signer: {result.signer}</div>
            <div style={{ marginTop: 6 }}>invest cap: {(Number(result.policy.investCap) / 1e6)} USDC · protect cap: {(Number(result.policy.protectCap) / 1e6)} USDC</div>
            <div style={{ marginTop: 6 }}>safe haven: {result.policy.safeHaven.slice(0, 10)}…</div>
          </div>
        )}

        {serverMsg && <div style={{ fontSize: 13, color: serverMsg.startsWith("✓") ? "var(--mint,#7be3cc)" : "var(--danger,#e06a4e)", wordBreak: "break-all" }}>{serverMsg}</div>}

        <p style={{ fontSize: 11, color: "var(--faint,#6e655a)", textAlign: "center" }}>Desktop Chrome/Edge · USB · unlock the Flex and open the Ethereum app (blind signing on) first</p>
      </div>
    </main>
  );
}
