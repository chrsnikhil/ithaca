"use client";
import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { DEPLOYMENTS, FLEX_OWNER } from "./deployments";

function errStr(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") { try { return JSON.stringify(e); } catch { return Object.prototype.toString.call(e); } }
  return String(e);
}

export type MandateParams = { maxUsdc: number; safeHaven: string; hours: number };
export type SignedMandate = {
  mandate: { maxAmount: string; safeHaven: string; expiry: string; nonce: string };
  signature: string;
  signer: string;
  ok: boolean;
};

const PATH = "44'/60'/0'/0/0"; // first Ethereum account on the Flex

export function useLedgerMandate() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<SignedMandate | null>(null);

  const armWithLedger = useCallback(async (p: MandateParams): Promise<SignedMandate | null> => {
    setStatus("connecting to Flex…");
    setResult(null);
    try {
      // Browser-only SDKs — load at click so they never touch SSR/build.
      const { DeviceManagementKitBuilder, DeviceActionStatus } = await import("@ledgerhq/device-management-kit");
      const { webHidTransportFactory } = await import("@ledgerhq/device-transport-kit-web-hid");
      const { SignerEthBuilder } = await import("@ledgerhq/device-signer-kit-ethereum");

      const dmk = new DeviceManagementKitBuilder().addTransport(webHidTransportFactory).build();
      const device = await new Promise<unknown>((resolve, reject) => {
        const sub = dmk.startDiscovering({}).subscribe({
          next: (d: unknown) => { sub.unsubscribe(); resolve(d); },
          error: reject,
        });
        setTimeout(() => { try { sub.unsubscribe(); } catch {} reject(new Error("no Flex found — unlock it and open the Ethereum app")); }, 30000);
      });

      setStatus("connecting…");
      const sessionId = await dmk.connect({ device: device as never });
      const signerEth = new SignerEthBuilder({ dmk, sessionId }).build();

      const guard = DEPLOYMENTS.baseSepolia.GuardVaultCCTP;
      const expiry = Math.floor(Date.now() / 1000) + p.hours * 3600;
      const message = {
        maxAmount: BigInt(Math.round(p.maxUsdc * 1e6)).toString(),
        safeHaven: p.safeHaven,
        expiry: expiry.toString(),
        nonce: "1",
      };
      const domain = { name: "Guardian", version: "1", chainId: DEPLOYMENTS.baseSepolia.chainId, verifyingContract: guard };
      const mandateType = [
        { name: "maxAmount", type: "uint256" },
        { name: "safeHaven", type: "address" },
        { name: "expiry", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ];
      const typedData = {
        domain,
        types: {
          EIP712Domain: [
            { name: "name", type: "string" }, { name: "version", type: "string" },
            { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" },
          ],
          Mandate: mandateType,
        },
        primaryType: "Mandate",
        message,
      };

      setStatus("review + approve on your Flex…");
      const { observable } = signerEth.signTypedData(PATH, typedData as never);
      const output = await new Promise<{ r: string; s: string; v: number }>((resolve, reject) => {
        observable.subscribe({
          next: (st: { status: unknown; output?: { r: string; s: string; v: number }; error?: unknown }) => {
            console.log("[ledger] state:", st);
            if (st.status === DeviceActionStatus.Completed && st.output) resolve(st.output);
            else if (st.status === DeviceActionStatus.Error) reject(new Error("device action error: " + errStr(st.error)));
          },
          error: (e) => reject(new Error("stream error: " + errStr(e))),
        });
      });

      console.log("[ledger] signer output:", output);
      if (!output || output.r == null || output.s == null) throw new Error("unexpected signer output: " + errStr(output));
      const r = output.r.startsWith("0x") ? output.r : "0x" + output.r;
      const s = output.s.startsWith("0x") ? output.s : "0x" + output.s;
      const v = Number(output.v) < 27 ? Number(output.v) + 27 : Number(output.v);
      const signature = ethers.Signature.from({ r, s, v }).serialized;

      const recovered = ethers.verifyTypedData(domain, { Mandate: mandateType }, message, signature);
      const ok = recovered.toLowerCase() === FLEX_OWNER.toLowerCase();
      setStatus(ok ? "signed ✓ — guardian armed" : `signed, but signer ${recovered.slice(0, 8)}… ≠ Flex owner (wrong account/path)`);
      const signed = { mandate: message, signature, signer: recovered, ok };
      setResult(signed);
      return signed;
    } catch (e) {
      console.error("[ledger] arm error:", e);
      setStatus("error: " + errStr(e));
      return null;
    }
  }, []);

  return { status, result, armWithLedger };
}
