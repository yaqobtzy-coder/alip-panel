"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_LABEL = { fullup: "Fullup", reseller: "Reseller", pt: "Partner (PT)" };

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.target);
    const photo = form.get("photo");
    if (photo && photo.size > 700 * 1024) {
      setError("Ukuran foto maksimal 700KB. Kompres dulu foto sebelum upload.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center hover-lift" data-reveal="scale">
          <div className="text-3xl mb-3">📨</div>
          <h1 className="display text-xl font-bold text-white mb-2">Pendaftaran terkirim</h1>
          <p className="text-muted text-sm mb-6">
            Permintaan aksesmu sudah dikirim untuk ditinjau. Masuk dengan akunmu untuk melihat
            status persetujuan.
          </p>
          <button className="btn-primary w-full" onClick={() => router.push("/")}>
            Ke halaman login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="display text-2xl font-bold text-white">Buat Akun</h1>
          <p className="text-muted mt-1 text-sm">Akses akan aktif setelah disetujui admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 hover-lift" data-reveal="scale" encType="multipart/form-data">
          <div>
            <label className="text-xs text-muted mb-1 block">Username</label>
            <input className="field" name="username" required />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Password</label>
            <input className="field" name="password" type="password" required />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Pilihan role</label>
            <select className="field" name="role" required defaultValue="">
              <option value="" disabled>Pilih role</option>
              {Object.entries(ROLE_LABEL).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Nomor WhatsApp (wajib)</label>
            <input className="field" name="whatsapp" placeholder="628xxxxxxxxxx" required />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">
              Screenshot grup role saat ini (wajib)
            </label>
            <input
              className="field file:mr-3 file:btn-ghost file:border-0 file:bg-panel2 file:text-white"
              name="photo"
              type="file"
              accept="image/*"
              required
            />
            <p className="text-xs text-muted mt-1">
              Ukuran foto maksimal <span className="text-warn">700KB</span> — kompres dulu foto
              sebelum upload kalau ukurannya lebih besar (bisa pakai aplikasi kompres foto atau
              kirim ke diri sendiri lewat WhatsApp lalu simpan ulang, biasanya otomatis mengecil).
            </p>
          </div>

          {error && (
            <p className="text-danger text-sm border border-danger/30 bg-danger/10 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Membuat akun…" : "Buat akun"}
          </button>

          <p className="text-center text-sm text-muted pt-2">
            Sudah punya akun? <Link href="/" className="text-accent hover:underline">Masuk</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
