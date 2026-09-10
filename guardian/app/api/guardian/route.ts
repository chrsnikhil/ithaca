import { NextRequest } from "next/server";
import { stateView } from "../../lib/engine";
import { readMultiFeed } from "../../lib/vaultMulti";

// The dashboard's read API — now fully serverless. State (balances + live market ranking) and the
// activity feed are read straight from Base Sepolia + The Graph, so the deployed app is never empty
// and needs no daemon. Autonomous actions go through /api/tick, /api/act and /api/escalate.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const view = new URL(req.url).searchParams.get("view") || "state";
  try {
    if (view === "activity") return Response.json(await readMultiFeed());
    if (view === "health") return Response.json({ ok: true });
    return Response.json(await stateView());
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 200 });
  }
}
