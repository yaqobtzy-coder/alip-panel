"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RayyProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/rayy-store/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.replace("/rayy-store/login");
          return;
        }
        setUsername(d.username);
        setWhatsapp(d.whatsapp || "");
      });
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/rayy-store/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, newPassword: newPassword || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      setMsg("✅ Profil berhasil disimpan.");
      setNewPassword("");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="card p-6 hover-lift">
        <h1 className="display text-xl font-bold text-white flex items-center gap-2">👤 Profil</h1>
        <p className="text-xs text-muted mt-1 mb-5 pb-4 border-b border-line">
          Data ini dipakai buat konfirmasi pesanan & dihubungi admin.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Username</label>
            <input className="field opacity-60" value={username} disabled />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Nomor WhatsApp</label>
            <input
              className="field"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="62xxxxxxxxxx"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Password Baru (kosongkan kalau tidak ganti)</label>
            <input
              type="password"
              className="field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {err && <p className="text-sm text-danger">{err}</p>}
          {msg && <p className="text-sm text-accent2">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>

        <Link href="/rayy-store/dashboard" className="block text-center text-sm text-muted mt-5">
          ← Kembali ke Toko
        </Link>
      </div>
    </div>
  );
}
