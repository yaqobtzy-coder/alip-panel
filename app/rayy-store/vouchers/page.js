"use client";
import { useEffect, useState } from "react";
import InfoPage from "@/components/rayy-store/InfoPage";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

function VoucherCard({ v, expired }) {
  const [copied, setCopied] = useState(false);
  const discountText = v.type === "percentage" ? `${v.value}% OFF` : `${formatRupiah(v.value)} OFF`;
  const remaining = (v.usageLimit || 0) - (v.used || 0);

  return (
    <div className={`card p-4 hover-lift ${expired ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="mono text-white font-bold tracking-wide">{v.code}</span>
        <span className="bg-accent2/15 text-accent2 text-xs font-semibold px-2.5 py-1 rounded-full">
          {discountText}
        </span>
      </div>
      <div className="text-xs text-muted space-y-1">
        <p>👥 Sisa penggunaan: {Math.max(remaining, 0)} dari {v.usageLimit}</p>
        {v.expiredAt && <p>📅 Berlaku sampai: {new Date(v.expiredAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>}
      </div>
      {expired ? (
        <span className="inline-block mt-3 text-xs text-danger">⏰ {remaining <= 0 ? "Kuota habis" : "Kedaluwarsa"}</span>
      ) : (
        <button
          onClick={() => {
            navigator.clipboard?.writeText(v.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="btn-ghost text-xs mt-3"
        >
          {copied ? "✅ Tersalin!" : "📋 Salin Kode"}
        </button>
      )}
    </div>
  );
}

export default function RayyVouchersPage() {
  const [vouchers, setVouchers] = useState(null);

  useEffect(() => {
    fetch("/api/rayy-store/vouchers")
      .then((r) => r.json())
      .then((d) => setVouchers(Array.isArray(d) ? d : []))
      .catch(() => setVouchers([]));
  }, []);

  if (vouchers === null) return null;

  const now = Date.now();
  const active = vouchers.filter((v) => (!v.expiredAt || v.expiredAt > now) && (v.used || 0) < (v.usageLimit || 0));
  const expired = vouchers.filter((v) => !active.includes(v));

  return (
    <InfoPage icon="🎟️" title="Voucher Center" subtitle="Pakai kode voucher di halaman pembelian produk.">
      <div>
        <h2 className="text-white font-semibold text-sm mb-2">Voucher Aktif</h2>
        {active.length === 0 && <p className="text-sm text-muted">✨ Belum ada voucher aktif. Pantau terus ya!</p>}
        <div className="space-y-2.5">
          {active.map((v) => <VoucherCard key={v.id} v={v} />)}
        </div>
      </div>

      {expired.length > 0 && (
        <div>
          <h2 className="text-white font-semibold text-sm mb-2">Voucher Kedaluwarsa</h2>
          <div className="space-y-2.5">
            {expired.map((v) => <VoucherCard key={v.id} v={v} expired />)}
          </div>
        </div>
      )}
    </InfoPage>
  );
}
