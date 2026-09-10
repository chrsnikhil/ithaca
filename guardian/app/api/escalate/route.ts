import { NextRequest } from "next/server";
import { runEscalation } from "../../lib/engine";

// HIGH-RISK: execute a FRESH, single-use Flex-signed Escalation (a live evacuation approved on the
// device, beyond the standing mandate). Runs on-chain here with the bounded agent key — no daemon.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { escalation, signature, amountUsdc } = body || {};
  if (!escalation || !signature) return Response.json({ ok: false, error: "missing escalation or signature" });
  try {
    return Response.json(await runEscalation(escalation, signature, amountUsdc != null ? Number(amountUsdc) : undefined));
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
