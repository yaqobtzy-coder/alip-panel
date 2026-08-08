"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SewaGcToolPage() {
  const [link, setLink] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  async function loadList() {
    setListLoading(true);
    try {
      const res = await fetch("/api/sewagc/list");
      const data = await res.json();
      if (res.ok) setList(data.data || []);
    } catch (e) {
      // diam saja, list bersifat optional
    }
    setListLoading(false);
  }

  useEffect(() => {
    loadList();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setLoading(true);
    try {
      const res = await fetch("/api/sewagc/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, days })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || "Gagal menambahkan sewa grup.", type: "error" });
      } else {
        setMsg({
          text: `Berhasil! Grup "${data.data.groupName}" aktif sampai ${new Date(
            data.data.expiredAt
          ).toLocaleString("id-ID")}. Status: ${data.data.joinStatus}`,
          type: "success"
        });
        setLink("");
        loadList();
      }
    } catch (e) {
      setMsg({ text: "Terjadi kesalahan jaringan.", type: "error" });
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-accent2">&larr; Kembali</Link>

      <div className="mt-3 mb-6" data-reveal>
        <h1 className="display text-2xl font-bold text-white">Sewa Grup (Add Sewa GC)</h1>
        <p className="text-muted text-sm mt-1">
          Masukkan link invite grup WhatsApp — bot akan otomatis join dan mengaktifkan masa sewa.
        </p>
      </div>

      <form onSubmit={submit} className="card hover-lift p-5 space-y-4 mb-8" data-reveal="scale">
        <div>
          <label className="text-xs text-muted mb-1 block">Link Grup</label>
          <input
            type="text"
            required
            placeholder="https://chat.whatsapp.com/xxxxxxxx"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="field mono"
          />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Durasi (hari)</label>
          <input
            type="number"
            min={1}
            required
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="field w-32"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Memproses..." : "Tambah Sewa & Join Grup"}
        </button>

        {msg.text && (
          <div
            className={`text-sm rounded-sm px-3 py-2 border ${
              msg.type === "error"
                ? "text-danger border-danger/30 bg-danger/10"
                : "text-accent2 border-accent2/30 bg-accent2/10"
            }`}
          >
            {msg.text}
          </div>
        )}
      </form>

      <h2 className="display font-semibold text-white mb-3" data-reveal>Grup Sewa Aktif</h2>

      {listLoading ? (
        <p className="text-muted text-sm">Memuat...</p>
      ) : list.length === 0 ? (
        <p className="text-muted text-sm">Belum ada data.</p>
      ) : (
        <div className="space-y-2">
          {list.map((item, i) => (
            <div
              key={item.jid}
              className="card hover-lift p-3 flex items-center justify-between gap-3"
              data-reveal
              style={{ transitionDelay: `${Math.min(i, 10) * 50}ms` }}
            >
              <span className="mono text-xs text-muted truncate">{item.jid}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted">{new Date(item.expired).toLocaleString("id-ID")}</span>
                <span className={`badge ${item.active ? "text-accent2 border-accent2/30" : "text-danger border-danger/30"}`}>
                  {item.active ? "Aktif" : "Expired"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
