import { NextRequest } from "next/server";
import { runCommand } from "../../lib/engine";

// Explicit, user-triggered action (voice "put my money to work" / the panel buttons). Same bounded
// executor as the tick, but for one named action. The mandate travels in the body.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policy, signature, action, amountUsdc } = body || {};
  if (!policy || !signature || !action) return Response.json({ ok: false, error: "missing policy, signature or action" });
  try {
    return Response.json(await runCommand(policy, signature, String(action), amountUsdc != null ? Number(amountUsdc) : undefined));
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
