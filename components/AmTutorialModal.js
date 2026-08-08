"use client";
import { useEffect } from "react";

const STEPS = [
  {
    n: 1,
    text: "Aktivasi / masukkan Gmail aktif kalian di website.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155420_711_9fyoijvy.jpg"
  },
  {
    n: 2,
    text: "Setelah mengisi akun, pencet tombol \"Ya, saya sudah menerima link verifikasi\".",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155428_247_70jnxsrx.jpg"
  },
  {
    n: 3,
    text: "Buka aplikasi Gmail, lalu pencet tombol profile di pojok kanan atas.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155442_252_zk5f6rk1.jpg"
  },
  {
    n: 4,
    text: "Pencet akun Gmail kalian — wajib sama dengan Gmail yang diisi di web.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155452_346_ny4kn3xe.jpg"
  },
  {
    n: 5,
    text: "Kembali ke halaman awal Gmail, lalu pencet tombol/garis 3 di pojok kiri atas.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155501_795_bw99mlva.jpg"
  },
  {
    n: 6,
    text: "Scroll sidebar sampai ketemu tulisan \"Spam\", lalu pencet.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155527_963_ge74bo03.jpg"
  },
  {
    n: 7,
    text: "Masuk ke email dari noreply (Alight Creative).",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155534_449_3t2lsahn.jpg"
  },
  {
    n: 8,
    text: "Tekan tombol \"Login ke Alight Creative\" (bahasa bisa berbeda / English).",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155542_034_tenqz1t5.jpg"
  },
  {
    n: 9,
    text: "Tekan lama tombol \"Salin URL\" (jangan diclick biasa — tekan & tahan, lalu salin).",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155553_852_ljgb4gsc.jpg"
  },
  {
    n: 10,
    text: "Balik ke website, tempel / masukkan link URL yang disalin di kolom kosong, lalu pencet Verifikasi.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155605_523_zxriujrl.jpg"
  },
  {
    n: 11,
    text: "Jika berhasil, akan muncul teks \"Semua proses aktivasi selesai\".",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155612_752_52l07ikx.jpg"
  },
  {
    n: 12,
    text: "Buka aplikasi Alight Motion.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155654_593_h28s7btt.jpg"
  },
  {
    n: 13,
    text: "Di halaman awal Alight Motion, pencet tombol profile di pojok kanan atas.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155702_184_79enhr82.jpg"
  },
  {
    n: 14,
    text: "Pencet tombol Masuk.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155710_621_d6ad6r9w.jpg"
  },
  {
    n: 15,
    text: "Pilih login dengan Google.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260802_155716_479_cbwdz8bf.jpg"
  },
  {
    n: 16,
    text: "Login dengan akun Gmail yang sama dengan yang diaktivasi di web tadi.",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155723_840_2uh780mh.jpg"
  },
  {
    n: 17,
    text: "Selesai — akun siap dipakai!",
    image: "https://raw.githubusercontent.com/ZrooPro/SaveDat1/main/uploads/20260802_155729_287_8oumsyfd.jpg"
  }
];

export default function AmTutorialModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] bg-panel border border-line rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">📖 Cara Login Alight Motion</p>
            <p className="text-[11px] text-muted">Tutorial langkah demi langkah (17 langkah)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-white text-lg px-2"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-5">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <p className="text-sm text-white leading-relaxed pt-0.5">{s.text}</p>
              </div>
              {s.image && (
                <img
                  src={s.image}
                  alt={`Langkah ${s.n}`}
                  loading="lazy"
                  className="w-full rounded-lg border border-line"
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-line shrink-0">
          <button type="button" onClick={onClose} className="btn-primary w-full text-sm">
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
