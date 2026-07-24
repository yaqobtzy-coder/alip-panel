"use client";
import { useState } from "react";
import { ROLE_LABEL, formatRupiah } from "@/lib/roles";

const STATUS_INFO = {
  pending: { label: "Menunggu pembayaran (QRIS belum dibayar)", color: "text-muted" },
  awaiting_review: { label: "Bukti transfer sedang direview admin", color: "text-warn" },
  queued: { label: "Dalam antrian", color: "text-warn" },
  rejected: { label: "Ditolak admin", color: "text-danger" },
  paid: { label: "Disetujui admin ✅", color: "text-accent2" },
  cancelled: { label: "Dibatalkan", color: "text-muted" }
};

function statusText(inv) {
  const info = STATUS_INFO[inv.status] || { label: inv.status, color: "text-muted" };
  if (inv.status === "queued" && inv.queueNumber != null) {
    return { ...info, label: `Dalam antrian #${inv.queueNumber}` };
  }
  if (inv.status === "rejected" && inv.rejectReason) {
    return { ...info, label: `Ditolak admin — ${inv.rejectReason}` };
  }
  return info;
}

function formatWhen(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function TrxHistoryModal({ open, onClose, invoices, loading, notifications = [] }) {
  const [tab, setTab] = useState("info"); // "info" | "trx"
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-md relative max-h-[80vh] flex flex-col hover-lift">
        <button
          className="absolute top-3 right-3 text-muted hover:text-white text-sm px-2"
          onClick={onClose}
          aria-label="Tutup"
        >
          ✕
        </button>

        <h2 className="display text-lg font-bold text-white mb-1">Notifikasi</h2>

        <div className="flex gap-1 mb-4 border-b border-line">
          <button
            className={`text-sm px-3 py-2 border-b-2 -mb-px transition ${
              tab === "info"
                ? "border-accent2 text-white font-semibold"
                : "border-transparent text-muted hover:text-white"
            }`}
            onClick={() => setTab("info")}
          >
            Info & Update
          </button>
          <button
            className={`text-sm px-3 py-2 border-b-2 -mb-px transition ${
              tab === "trx"
                ? "border-accent2 text-white font-semibold"
                : "border-transparent text-muted hover:text-white"
            }`}
            onClick={() => setTab("trx")}
          >
            Transaksi
          </button>
        </div>

        <div className="overflow-y-auto space-y-2 pr-1">
          {tab === "info" && (
            <>
              {notifications.length === 0 && (
                <p className="text-muted text-sm text-center py-6">Belum ada info/update.</p>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="bg-panel2 rounded-sm px-3 py-3">
                  <p className="text-sm text-white whitespace-pre-wrap">{n.text}</p>
                  <p className="mono text-xs text-muted mt-1">{formatWhen(n.createdAt)}</p>
                </div>
              ))}
            </>
          )}

          {tab === "trx" && (
            <>
              {loading && <p className="text-muted text-sm text-center py-6">Memuat…</p>}

              {!loading && invoices.length === 0 && (
                <p className="text-muted text-sm text-center py-6">Belum ada transaksi.</p>
              )}

              {!loading &&
                invoices.map((inv) => {
                  const st = statusText(inv);
                  return (
                    <div key={inv.id} className="bg-panel2 rounded-sm px-3 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-white font-semibold">
                          {ROLE_LABEL[inv.fromRole] || inv.fromRole} → {ROLE_LABEL[inv.toRole] || inv.toRole}
                        </p>
                        <p className="mono text-xs text-muted">{formatRupiah(inv.total ?? inv.amount)}</p>
                      </div>
                      <p className="mono text-xs text-muted mb-1">INV {inv.id}</p>
                      <p className={`text-xs font-medium ${st.color}`}>{st.label}</p>
                      {inv.status === "paid" && (
                        <a
                          className="btn-ghost text-xs py-1.5 px-3 inline-block mt-2"
                          href={`/struk?invoice_id=${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat struk
                        </a>
                      )}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
