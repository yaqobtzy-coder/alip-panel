"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const DISMISS_KEY = "alip_push_broadcast_dismissed";

// Dipasang SEKALI di app/layout.js (root) biar aktif di semua halaman —
// dashboard, tools zone, rayy-store, dll — tanpa perlu ditaro ulang di
// tiap section.
//
// TUJUAN notifikasi ini (biar jelas, jangan sampai disalahartikan):
// cuma buat nerusin PENGUMUMAN/INFO dari admin (update fitur, promo,
// maintenance, dll) yang dikirim lewat menu Notifikasi admin / bot
// Telegram — supaya user tetap tau walau lagi nggak buka web-nya.
// BUKAN buat ngirim iklan pihak ketiga, bukan buat tracking, dan nggak
// dipakai buat notifikasi lain di luar itu.
export default function PushBroadcastSetup() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const aktifkan = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if ("serviceWorker" in navigator && "PushManager" in window && vapidPublicKey) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        const sub =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          }));
        await fetch("/api/push/global-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() })
        });
      }
    } catch (e) {
      console.error("[Alip Panel] Gagal aktifin notifikasi:", e);
    } finally {
      localStorage.setItem(DISMISS_KEY, "1");
      setBusy(false);
      setShow(false);
    }
  };

  const tutup = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="card border-line p-4 space-y-3 shadow-lg">
        <p className="text-xs text-muted leading-relaxed">
          🔔 Aktifkan notifikasi biar kamu langsung dapet <span className="text-white font-medium">info/pengumuman
          dari admin</span> (update fitur, promo, maintenance) — walau web-nya lagi nggak kebuka. Cuma dipakai buat
          itu, nggak ada notifikasi lain.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={aktifkan}
            disabled={busy}
            className="flex-1 bg-accent text-white rounded-md py-2 text-xs font-semibold disabled:opacity-60"
          >
            {busy ? "Memproses..." : "Izinkan Notifikasi"}
          </button>
          <button type="button" onClick={tutup} className="px-3 text-xs text-muted underline whitespace-nowrap">
            Nanti aja
          </button>
        </div>
      </div>
    </div>
  );
}
