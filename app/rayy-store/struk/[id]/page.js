"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

export default function RayyStrukPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/rayy-store/orders/${id}/status`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => {});
  }, [id]);

  if (!order) return null;

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="card p-6 print:border-0 print:shadow-none hover-lift" id="struk">
        <h1 className="display text-lg font-bold text-white text-center">Struk Pembayaran</h1>
        <p className="text-center text-xs text-muted mb-4">Rayy Store</p>

        <div className="border-t border-b border-line py-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">No. Order</span><span className="mono text-white">{order.id}</span></div>
          <div className="flex justify-between"><span className="text-muted">Produk</span><span className="text-white">{order.productName}</span></div>
          {order.botNumber && (
            <div className="flex justify-between"><span className="text-muted">Nomor Bot</span><span className="text-white">{order.botNumber}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted">Status</span><span className="text-accent2">{order.status === "paid" ? "Lunas" : order.status}</span></div>
          {order.voucherCode && (
            <div className="flex justify-between"><span className="text-muted">Voucher</span><span className="text-accent2">{order.voucherCode} (-{formatRupiah(order.discount)})</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted">Tanggal</span><span className="text-white">{new Date(order.createdAt).toLocaleString("id-ID")}</span></div>
        </div>

        <div className="flex justify-between mt-3 text-base font-semibold">
          <span className="text-white">Total</span>
          <span className="text-accent2">{formatRupiah(order.totalPayment || order.price)}</span>
        </div>

        {order.status === "paid" && order.fileUrl && (
          <a
            href={order.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-4 bg-accent2 text-ink text-center rounded-md py-2.5 text-sm font-semibold print:hidden"
          >
            ⬇ Unduh File Produk
          </a>
        )}

        {order.status === "paid" && order.thankYouMessage && (
          <div className="mt-4 border border-accent2/30 bg-accent2/10 rounded-md p-3 print:hidden">
            <p className="text-xs text-accent2 font-semibold mb-1.5">Pesan dari Rayy Store</p>
            <pre className="whitespace-pre-wrap text-sm text-white font-sans">{order.thankYouMessage}</pre>
            <button
              onClick={() => navigator.clipboard?.writeText(order.thankYouMessage)}
              className="btn-ghost text-xs mt-2"
            >
              📋 Salin Pesan
            </button>
          </div>
        )}

        <button
          onClick={() => window.print()}
          className="w-full mt-6 bg-accent text-white rounded-md py-2.5 text-sm font-semibold print:hidden"
        >
          Unduh / Cetak Struk
        </button>
      </div>
    </div>
  );
}
