"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REGISTRATION_APPROVAL_POLL_MS, REJECTED_RETRY_COOLDOWN_MS } from "@/lib/timings";

const REJECTED_RETRY_HOURS = REJECTED_RETRY_COOLDOWN_MS / 3_600_000;

export default function PendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    let stop = false;
    async function poll() {
      const res = await fetch("/api/session");
      const data = await res.json();
      if (stop) return;
      if (!data.authenticated) {
        router.push("/");
        return;
      }
      setStatus(data.status);
      if (data.status === "approved") {
        router.push(`/dashboard/${data.role}`);
        return;
      }
      if (data.status === "rejected") return; // show rejected message, stop polling loudly
      setTimeout(poll, REGISTRATION_APPROVAL_POLL_MS);
    }
    poll();
    return () => { stop = true; };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md text-center hover-lift">
        {status === "rejected" ? (
          <>
            <div className="text-3xl mb-3">⏳</div>
            <h1 className="display text-xl font-bold text-white mb-2">Permintaan ditolak</h1>
            <p className="text-muted text-sm">
              Kamu bisa mencoba mendaftar/masuk lagi setelah {REJECTED_RETRY_HOURS} jam.
            </p>
          </>
        ) : (
          <>
            <div className="mono text-accent text-sm mb-3 animate-pulse">MENUNGGU PERSETUJUAN</div>
            <h1 className="display text-xl font-bold text-white mb-2">
              Menunggu ACC dari admin
            </h1>
            <p className="text-muted text-sm">
              Permintaan aksesmu sudah dikirim ke admin lewat Telegram. Halaman ini akan otomatis
              masuk ke dashboard begitu disetujui.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
