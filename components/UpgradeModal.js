"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABEL, formatRupiah } from "@/lib/roles";
import { PAYMENT_STATUS_POLL_MS, APPROVED_REDIRECT_SECONDS } from "@/lib/timings";

export default function UpgradeModal({ open, onClose, onUpgraded, onCancelled, target }) {
  const router = useRouter();
  // checking | confirm | qr | approved
  const [step, setStep] = useState("checking");
  const [invoice, setInvoice] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [creating, setCreating] = useState(false);
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [countdown, setCountdown] = useState(APPROVED_REDIRECT_SECONDS);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep("checking");
      setInvoice(null);
      setError("");
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
      return;
    }

    // Every time the modal opens, first check the server for an invoice
    // already in flight — refresh, closed tab, or cleared cache all land
    // back on the right step. Also fetch whether AustinPay is currently ON
    // (owner can flip this from Telegram for maintenance) so the button
    // disables itself instead of erroring after the fact.
    (async () => {
      setStep("checking");
      const [pendingRes, gatewaysRes] = await Promise.all([
        fetch("/api/payment/pending"),
        fetch("/api/payment/gateways").catch(() => null)
      ]);

      if (gatewaysRes?.ok) {
        const g = await gatewaysRes.json();
        setGatewayEnabled(g.austinpay !== false);
      }

      const data = await pendingRes.json();
      if (pendingRes.ok && data.pending) {
        setInvoice(data.invoice);
        setTargetRole(data.targetRole);
        enterStepForStatus(data.status, data.invoice.invoice_id);
      } else {
        setStep("confirm");
      }
    })();

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [open]);

  function enterStepForStatus(status, invoiceId) {
    if (status === "paid") {
      startApprovedCountdown(invoiceId);
    } else {
      setStep("qr");
      startPolling(invoiceId);
    }
  }

  function startPolling(invoiceId) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/payment/status?invoice_id=${invoiceId}`);
      const s = await r.json();
      if (!r.ok) return;

      if (s.status === "paid") {
        clearInterval(pollRef.current);
        startApprovedCountdown(invoiceId);
      } else if (s.status === "cancelled") {
        clearInterval(pollRef.current);
        setInvoice(null);
        setStep("confirm");
      }
    }, PAYMENT_STATUS_POLL_MS);
  }

  function startApprovedCountdown(invoiceId) {
    setStep("approved");
    setCountdown(APPROVED_REDIRECT_SECONDS);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current);
          router.push(`/struk?invoice_id=${invoiceId}`);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  async function startPayment() {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/payment/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: target?.to })
      });
      // Guard against a non-JSON response (e.g. a proxy/server error page)
      // so a bad response can never leave the button stuck on "Memproses…"
      // with no feedback — this was the root cause of the "tombol
      // dipencet, QRIS gak muncul-muncul" bug.
      const data = await res.json().catch(() => null);
      if (!data) {
        setError("Server tidak merespons dengan benar. Coba lagi.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Gagal membuat invoice.");
        return;
      }
      setInvoice(data.invoice);
      setTargetRole(data.targetRole);
      enterStepForStatus(data.status || "pending", data.invoice.invoice_id);
    } catch (e) {
      setError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  // Closing the modal never cancels anything — the invoice stays open on
  // the server. Only the explicit "Batalkan transaksi" button does that.
  function handleClose() {
    clearInterval(pollRef.current);
    clearInterval(countdownRef.current);
    onClose();
  }

  async function cancelTransaction() {
    if (!invoice) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.invoice_id })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membatalkan transaksi.");
        return;
      }
      clearInterval(pollRef.current);
      setInvoice(null);
      setStep("confirm");
      onCancelled?.();
    } finally {
      setCancelling(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-sm relative hover-lift">
        <button
          className="absolute top-3 right-3 text-muted hover:text-white text-sm px-2"
          onClick={handleClose}
          aria-label="Tutup"
        >
          ✕
        </button>

        {step === "checking" && (
          <p className="text-muted text-sm text-center py-6">Memeriksa transaksi…</p>
        )}

        {step === "confirm" && (
          <>
            <h2 className="display text-lg font-bold text-white mb-2">
              Upgrade ke {ROLE_LABEL[target?.to] || "role berikutnya"}
            </h2>
            <p className="text-muted text-sm mb-1">
              Lanjutkan pembayaran untuk menaikkan role kamu.
            </p>
            {target?.price != null && (
              <p className="mono text-accent2 text-lg font-semibold mb-4">
                {formatRupiah(target.price)}
              </p>
            )}

            <p className="text-muted text-xs mb-6">
              Bayar via QRIS — pembayaran terdeteksi otomatis, tanpa upload bukti transfer dan tanpa
              menunggu ACC admin.
            </p>

            {!gatewayEnabled && (
              <p className="text-danger text-xs mb-4 text-center">
                Payment Gateway Database Kami sedang di nonaktifkan
              </p>
            )}
            {error && <p className="text-danger text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={handleClose} disabled={creating}>
                Tutup
              </button>
              <button
                className="btn-primary flex-1 disabled:opacity-50"
                onClick={startPayment}
                disabled={creating || !gatewayEnabled}
              >
                {creating ? "Membuat QRIS…" : "Buat pembayaran"}
              </button>
            </div>
          </>
        )}

        {step === "qr" && invoice && (
          <>
            <h2 className="display text-lg font-bold text-white mb-1">Scan QRIS</h2>
            <p className="text-muted text-xs mb-4 mono">
              INV {invoice.invoice_id} · Rp{invoice.total.toLocaleString("id-ID")}
            </p>
            <div className="bg-white rounded-md p-3 mb-4">
              <img src={invoice.qris_image} alt="QRIS" className="w-full" />
            </div>

            <div className="mono text-accent text-xs mb-4 text-center animate-pulse">
              MENUNGGU PEMBAYARAN TERDETEKSI OTOMATIS…
            </div>
            <p className="text-muted text-xs text-center mb-3">
              Scan &amp; bayar QRIS di atas. Halaman ini otomatis lanjut sendiri begitu pembayaran
              terdeteksi — tidak perlu upload bukti atau menunggu ACC admin.
            </p>
            {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={handleClose}>
                Tutup (lanjut nanti)
              </button>
              <button
                className="flex-1 text-danger border border-danger/30 rounded-sm text-sm hover:bg-danger/10"
                onClick={cancelTransaction}
                disabled={cancelling}
              >
                {cancelling ? "Membatalkan…" : "Batalkan transaksi"}
              </button>
            </div>
          </>
        )}

        {step === "approved" && (
          <>
            <div className="text-3xl mb-3 text-center">✅</div>
            <h2 className="display text-lg font-bold text-white mb-2 text-center">
              Pembayaran berhasil
            </h2>
            <p className="text-muted text-sm text-center mb-6">
              Role kamu sedang diupgrade ke {ROLE_LABEL[targetRole] || targetRole}. Halaman akan lanjut ke struk dalam{" "}
              {countdown} detik…
            </p>
            <button className="btn-primary w-full" onClick={handleClose}>Tutup</button>
          </>
        )}
      </div>
    </div>
  );
}
