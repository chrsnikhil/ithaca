import { NextRequest } from "next/server";
import { stateView } from "../../lib/engine";
import { vaultFor } from "../../lib/vaultMulti";

// The dashboard's read API — now fully serverless. State (balances + live market ranking) and the
// activity feed are read straight from Base Sepolia + The Graph, so the deployed app is never empty
// and needs no daemon. Autonomous actions go through /api/tick, /api/act and /api/escalate.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const view = sp.get("view") || "state";
  const network = sp.get("network") === "arc" ? "arc" : "baseSepolia"; // absent ⇒ Base Sepolia (unchanged)
  try {
    if (view === "activity") return Response.json(await vaultFor(network).readMultiFeed());
    if (view === "health") return Response.json({ ok: true });
    return Response.json(await stateView(undefined, network));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 200 });
  }
}
