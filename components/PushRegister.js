"use client";
import { useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Daftarkan service worker + push subscription sekali saat user buka Rayy Store.
 * Dipakai di layout agar notif chat/news/payment jalan meski tab di background.
 */
export default function PushRegister() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapid) return;

        const reg = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return;
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid)
          });
        }

        await fetch("/api/push/global-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() })
        });
      } catch (e) {
        console.log("[PushRegister]", e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
