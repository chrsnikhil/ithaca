import { NextRequest } from "next/server";
import { vaultFor } from "../../lib/vaultMulti";

// Arming is now CLIENT-side: the browser keeps the Flex-signed mandate in localStorage and hands it
// to /api/tick|act on each call. This route just VERIFIES the signature server-side (recovers to the
// Flex owner) so the UI can confirm the mandate is valid before storing it. No daemon.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policy, signature } = body || {};
  const network = body?.network === "arc" ? "arc" : "baseSepolia"; // absent ⇒ Base Sepolia (unchanged)
  if (!policy || !signature) return Response.json({ ok: false, error: "missing policy or signature" });
  const v = vaultFor(network).verifyPolicy(policy, signature);
  return Response.json(v.ok ? { ok: true, signer: v.signer } : { ok: false, error: v.error });
}

export async function GET() {
  // The armed state is held in the browser (localStorage); the server is stateless here.
  return Response.json({ armed: false, note: "mandate is held client-side" });
}
