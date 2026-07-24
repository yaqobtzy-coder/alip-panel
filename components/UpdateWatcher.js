"use client";
import { useEffect, useState } from "react";
import { UPDATE_CHECK_POLL_MS, UPDATE_RELOAD_COUNTDOWN_SECONDS } from "@/lib/timings";

// Polls /api/site-config for a version bump (triggered from the Telegram
// bot's "Notif Update Web" / "Refresh Otomatis" menu, or any admin change
// that touches the version) and shows a countdown banner before
// auto-reloading the page.
export default function UpdateWatcher({ initialVersion }) {
  const [detected, setDetected] = useState(false);
  const [countdown, setCountdown] = useState(UPDATE_RELOAD_COUNTDOWN_SECONDS);

  useEffect(() => {
    let knownVersion = initialVersion;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/site-config", { cache: "no-store" });
        const data = await res.json();
        if (data.version && data.version !== knownVersion) {
          knownVersion = data.version;
          setDetected(true);
        }
      } catch {
        // ignore transient network errors
      }
    }, UPDATE_CHECK_POLL_MS);
    return () => clearInterval(poll);
  }, [initialVersion]);

  useEffect(() => {
    if (!detected) return;
    if (countdown <= 0) {
      window.location.reload();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [detected, countdown]);

  if (!detected) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[70] bg-accent text-ink text-sm font-semibold text-center py-2.5">
      🔄 Update web terdeteksi. Otomatis me-refresh halaman dalam {countdown} detik…
    </div>
  );
}
