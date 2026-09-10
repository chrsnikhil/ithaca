"use client";

import { useEffect } from "react";

// Neutralized for now: unregister any existing service worker and clear its
// caches so stale dev assets can't break hydration. Re-enable a real SW later
// once the app is deployed to a stable HTTPS origin.
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if ("caches" in window) {
      caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);
  return null;
}
