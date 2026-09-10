import { NextRequest } from "next/server";
import { runTick } from "../../lib/engine";

// The autonomous heartbeat. The armed browser polls this on an interval with its Flex-signed
// mandate; the server decides + executes one bounded action on-chain. No daemon — this IS the loop.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policy, signature, danger } = body || {};
  if (!policy || !signature) return Response.json({ ok: false, action: "ERROR", error: "missing policy or signature" });
  try {
    return Response.json(await runTick(policy, signature, Boolean(danger)));
  } catch (e) {
    return Response.json({ ok: false, action: "ERROR", error: e instanceof Error ? e.message : String(e) });
  }
}
