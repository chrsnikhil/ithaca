"use client";
import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { DEPLOYMENTS, FLEX_OWNER, type Network } from "./deployments";

function errStr(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") { try { return JSON.stringify(e); } catch { return Object.prototype.toString.call(e); } }
  return String(e);
}

export type Transport = "usb" | "ble";
// A gate to run AFTER the Flex is connected (so the device chooser opens inside the user gesture)
// but BEFORE signing — e.g. Face ID. Throw to abort.
export type BeforeSign = () => Promise<void>;
export type PolicyParams = { investUsdc: number; protectUsdc: number; safeHaven: string; hours: number };
export type SignedPolicy = {
  policy: { investCap: string; venue: string; protectCap: string; safeHaven: string; expiry: string; nonce: string };
  signature: string;
  signer: string;
  ok: boolean;
};

const PATH = "44'/60'/0'/0/0"; // first Ethereum account on the Flex

// Connect to the Flex over the chosen transport and build the Ethereum signer. USB = WebHID (desktop
// Chrome/Edge). BLE = Web Bluetooth (desktop Chrome + Android Chrome — iOS blocks it). Both talk to
// the device locally in the browser; the hosting/server is never involved in signing.
async function connectSignerEth(transport: Transport, setStatus: (s: string) => void) {
  // Capability guard FIRST — Safari / Firefox / all iOS browsers lack both WebHID and Web
  // Bluetooth, so calling requestDevice there throws a cryptic "undefined is not an object".
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { hid?: unknown; bluetooth?: unknown }) : undefined;
  if (transport === "ble" && !nav?.bluetooth)
    throw new Error("This browser has no Web Bluetooth. Use desktop Chrome/Edge or Android Chrome (Safari & iPhone don't support it), or switch to USB.");
  if (transport === "usb" && !nav?.hid)
    throw new Error("This browser has no WebHID (USB). Use desktop Chrome or Edge (Safari, Firefox & iPhone don't support it), or switch to Bluetooth on Android.");

  const { DeviceManagementKitBuilder } = await import("@ledgerhq/device-management-kit");
  const { SignerEthBuilder } = await import("@ledgerhq/device-signer-kit-ethereum");
  const builder = new DeviceManagementKitBuilder();
  if (transport === "ble") {
    const { webBleTransportFactory } = await import("@ledgerhq/device-transport-kit-web-ble");
    builder.addTransport(webBleTransportFactory);
  } else {
    const { webHidTransportFactory } = await import("@ledgerhq/device-transport-kit-web-hid");
    builder.addTransport(webHidTransportFactory);
  }
  const dmk = builder.build();
  setStatus(transport === "ble" ? "pairing over Bluetooth…" : "connecting to Flex…");
  const device = await new Promise<unknown>((resolve, reject) => {
    const sub = dmk.startDiscovering({}).subscribe({
      next: (d: unknown) => { sub.unsubscribe(); resolve(d); },
      error: reject,
    });
    setTimeout(() => {
      try { sub.unsubscribe(); } catch {}
      reject(new Error(transport === "ble"
        ? "no Flex found over Bluetooth — turn Bluetooth on (Flex ▸ Settings ▸ Bluetooth), unlock it, open the Ethereum app"
        : "no Flex found — connect it by USB, unlock it, open the Ethereum app"));
    }, 30000);
  });
  setStatus("connecting…");
  const sessionId = await dmk.connect({ device: device as never });
  const signerEth = new SignerEthBuilder({ dmk, sessionId }).build();
  return { dmk, signerEth };
}

// Run an EIP-712 signTypedData through the DMK observable → a serialized 65-byte signature.
async function signTyped(
  signerEth: { signTypedData: (path: string, data: never) => { observable: unknown } },
  typedData: unknown,
): Promise<string> {
  const { DeviceActionStatus } = await import("@ledgerhq/device-management-kit");
  const { observable } = signerEth.signTypedData(PATH, typedData as never);
  const output = await new Promise<{ r: string; s: string; v: number }>((resolve, reject) => {
    (observable as { subscribe: (o: unknown) => void }).subscribe({
      next: (st: { status: unknown; output?: { r: string; s: string; v: number }; error?: unknown }) => {
        if (st.status === DeviceActionStatus.Completed && st.output) resolve(st.output);
        else if (st.status === DeviceActionStatus.Error) reject(new Error("device action error: " + errStr(st.error)));
      },
      error: (e: unknown) => reject(new Error("stream error: " + errStr(e))),
    });
  });
  if (!output || output.r == null || output.s == null) throw new Error("unexpected signer output: " + errStr(output));
  const r = output.r.startsWith("0x") ? output.r : "0x" + output.r;
  const s = output.s.startsWith("0x") ? output.s : "0x" + output.s;
  const v = Number(output.v) < 27 ? Number(output.v) + 27 : Number(output.v);
  return ethers.Signature.from({ r, s, v }).serialized;
}

const EIP712_DOMAIN = [
  { name: "name", type: "string" }, { name: "version", type: "string" },
  { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" },
];

// EIP-712 domain for the selected network. Only chainId + verifyingContract differ per chain; the
// name/version and the Flex owner are identical on both. Defaults to Base Sepolia.
function domainFor(network: Network, verifyingContract: string) {
  return { name: "Guardian", version: "1", chainId: DEPLOYMENTS[network].chainId, verifyingContract };
}

// Sign a GuardianVault Policy / GuardianVaultMulti Policy / Escalation on the Ledger Flex (EIP-712).
// One signature authorizes an autonomous policy the agent then acts within, until expiry. The
// verifyingContract is the Flex-owned vault, so the signature recovers to the Flex owner.
export function useLedgerPolicy() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<SignedPolicy | null>(null);

  // Single-vault v2 Policy (has a per-venue field). Kept for the Aave-only demo path.
  const armWithLedger = useCallback(async (p: PolicyParams, transport: Transport = "usb", network: Network = "baseSepolia"): Promise<SignedPolicy | null> => {
    setStatus("connecting to Flex…"); setResult(null);
    try {
      const { signerEth } = await connectSignerEth(transport, setStatus);
      const guard = DEPLOYMENTS[network].GuardianVault;
      // single-vault v2 has a per-venue field; the Aave venue only exists on Base (this legacy path
      // is Base-only — the multi-market flow below is the network-aware one).
      const venue = DEPLOYMENTS.baseSepolia.aaveVenue;
      const expiry = Math.floor(Date.now() / 1000) + p.hours * 3600;
      const message = {
        investCap: BigInt(Math.round(p.investUsdc * 1e6)).toString(),
        venue,
        protectCap: BigInt(Math.round(p.protectUsdc * 1e6)).toString(),
        safeHaven: p.safeHaven,
        expiry: expiry.toString(),
        nonce: Math.floor(Date.now() / 1000).toString(),
      };
      const domain = domainFor(network, guard);
      const policyType = [
        { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
        { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
        { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
      ];
      setStatus("review + approve the policy on your Flex…");
      const signature = await signTyped(signerEth, { domain, types: { EIP712Domain: EIP712_DOMAIN, Policy: policyType }, primaryType: "Policy", message });
      const recovered = ethers.verifyTypedData(domain, { Policy: policyType }, message, signature);
      const ok = recovered.toLowerCase() === FLEX_OWNER.toLowerCase();
      setStatus(ok ? "signed ✓ — policy authorized by your Flex" : `signed, but signer ${recovered.slice(0, 8)}… ≠ Flex owner (wrong account/path)`);
      const signed = { policy: message, signature, signer: recovered, ok };
      setResult(signed);
      return signed;
    } catch (e) {
      console.error("[ledger] arm error:", e);
      setStatus("error: " + errStr(e));
      return null;
    }
  }, []);

  // MULTI-market Policy (GuardianVaultMulti) — NO per-venue field: { investCap, protectCap,
  // safeHaven, expiry, nonce }. Authorizes the agent to allocate across ALL allowlisted markets up
  // to investCap and evacuate up to protectCap to the safe haven.
  const armMultiWithLedger = useCallback(async (p: PolicyParams, transport: Transport = "usb", beforeSign?: BeforeSign, network: Network = "baseSepolia"): Promise<SignedPolicy | null> => {
    setStatus("connecting to Flex…"); setResult(null);
    try {
      const { signerEth } = await connectSignerEth(transport, setStatus);
      if (beforeSign) await beforeSign(); // Face ID — after the device request (needs the gesture), before signing
      const guard = DEPLOYMENTS[network].GuardianVaultMulti;
      const expiry = Math.floor(Date.now() / 1000) + p.hours * 3600;
      const message = {
        investCap: BigInt(Math.round(p.investUsdc * 1e6)).toString(),
        protectCap: BigInt(Math.round(p.protectUsdc * 1e6)).toString(),
        safeHaven: p.safeHaven,
        expiry: expiry.toString(),
        nonce: Math.floor(Date.now() / 1000).toString(),
      };
      const domain = domainFor(network, guard);
      const policyType = [
        { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
        { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
      ];
      setStatus("review + approve the policy on your Flex…");
      const signature = await signTyped(signerEth, { domain, types: { EIP712Domain: EIP712_DOMAIN, Policy: policyType }, primaryType: "Policy", message });
      const recovered = ethers.verifyTypedData(domain, { Policy: policyType }, message, signature);
      const ok = recovered.toLowerCase() === FLEX_OWNER.toLowerCase();
      setStatus(ok ? "signed ✓ — mandate authorized by your Flex" : `signed, but signer ${recovered.slice(0, 8)}… ≠ Flex owner`);
      const signed = { policy: message as unknown as SignedPolicy["policy"], signature, signer: recovered, ok };
      setResult(signed);
      return signed;
    } catch (e) {
      console.error("[ledger] arm-multi error:", e);
      setStatus("error: " + errStr(e));
      return null;
    }
  }, []);

  // HIGH-RISK: a FRESH, single-use Escalation — one specific evacuation (amount → destination)
  // beyond the standing mandate. The live "the Ledger approves the dangerous action in the moment" tap.
  const signEscalation = useCallback(async (p: { amountUsdc: number; safeHaven: string; hours?: number }, transport: Transport = "usb", beforeSign?: BeforeSign, network: Network = "baseSepolia") => {
    setStatus("connecting to Flex…");
    try {
      const { signerEth } = await connectSignerEth(transport, setStatus);
      if (beforeSign) await beforeSign(); // Face ID — after the device request (needs the gesture), before signing
      const guard = DEPLOYMENTS[network].GuardianVaultMulti;
      const message = {
        amount: BigInt(Math.round(p.amountUsdc * 1e6)).toString(),
        safeHaven: p.safeHaven,
        expiry: (Math.floor(Date.now() / 1000) + (p.hours ?? 1) * 3600).toString(),
        nonce: Math.floor(Date.now() / 1000).toString(),
      };
      const domain = domainFor(network, guard);
      const escType = [
        { name: "amount", type: "uint256" }, { name: "safeHaven", type: "address" },
        { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
      ];
      setStatus("approve this evacuation on your Flex…");
      const signature = await signTyped(signerEth, { domain, types: { EIP712Domain: EIP712_DOMAIN, Escalation: escType }, primaryType: "Escalation", message });
      const recovered = ethers.verifyTypedData(domain, { Escalation: escType }, message, signature);
      const ok = recovered.toLowerCase() === FLEX_OWNER.toLowerCase();
      setStatus(ok ? "approved ✓ on your Flex" : `signer ${recovered.slice(0, 8)}… ≠ Flex owner`);
      return { escalation: message, signature, signer: recovered, ok };
    } catch (e) {
      setStatus("error: " + errStr(e));
      return null;
    }
  }, []);

  return { status, result, armWithLedger, armMultiWithLedger, signEscalation };
}
