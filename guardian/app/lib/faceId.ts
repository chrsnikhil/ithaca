"use client";
// A biometric gate (Face ID / Touch ID / Windows Hello) via WebAuthn, run BEFORE the Ledger Flex
// signs a mandate — so arming the guardian is two factors: your face, then your hardware key.
//
// This uses the platform authenticator's user-verification (the OS enforces the biometric). It's a
// presence/identity gate for the arming UX, not a server-verified credential — the cryptographic
// authority over funds remains the Flex's EIP-712 signature. First use registers a local platform
// credential (which itself requires the biometric); later uses assert it (biometric again).

const CRED_KEY = "guardian.faceid.credId";

function b64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export type FaceIdResult = { ok: boolean; skipped?: boolean; error?: string };

/** Prompt the device biometric. Returns ok:true on success, skipped:true if no biometric hardware. */
export async function faceIdGate(): Promise<FaceIdResult> {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential || !navigator.credentials) {
      return { ok: true, skipped: true };
    }
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
    if (!available) return { ok: true, skipped: true }; // no Face ID / Touch ID / Hello → don't block

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const stored = localStorage.getItem(CRED_KEY);

    if (!stored) {
      // First time: create a platform credential — the create itself requires the biometric.
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Guardian", id: location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "guardian-owner", displayName: "Guardian Owner" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;
      if (!cred) return { ok: false, error: "no credential created" };
      localStorage.setItem(CRED_KEY, b64(cred.rawId));
      return { ok: true };
    }

    // Subsequent: assert the stored credential — triggers the biometric again.
    await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: fromB64(stored) }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // A cancelled/failed biometric must block arming.
    return { ok: false, error: msg };
  }
}
