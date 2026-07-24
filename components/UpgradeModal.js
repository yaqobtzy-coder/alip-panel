"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABEL, formatRupiah } from "@/lib/roles";
import { PAYMENT_STATUS_POLL_MS, APPROVED_REDIRECT_SECONDS } from "@/lib/timings";

// Mobile camera screenshots/photos can easily be several MB — sent as
// base64 that's ~33% bigger again, which is the other big contributor to
// "lama banget, gak kekirim" (slow upload from the user's phone, then a
// slow multipart re-upload from server to Telegram). Downscale + re-encode
// as JPEG client-side first, trying progressively harder compression until
// it's under the 700KB cap (mirrored server-side in
// app/api/payment/confirm/route.js) so the payload going out is always
// small and fast on a normal mobile connection.
const PROOF_MAX_BYTES = 700 * 1024; // 700KB
const COMPRESSION_STEPS = [
  { maxDim: 1280, quality: 0.75 },
  { maxDim: 1100, quality: 0.65 },
  { maxDim: 900, quality: 0.55 },
  { maxDim: 720, quality: 0.45 },
  { maxDim: 540, quality: 0.4 }
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageEl(dataUrl) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
}

// Base64 -> decoded byte count (not string length) so the 700KB check
// matches the actual file size, not the inflated base64 text size.
function estimateBase64Bytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function renderJpeg(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

// Returns { dataUrl, bytes, tooBig }. Tries each compression step in order
// and stops at the first one that fits under PROOF_MAX_BYTES; if even the
// hardest step doesn't fit, returns the smallest attempt with tooBig=true
// so the caller can tell the user clearly instead of silently sending an
// oversized file.
async function compressProofImage(file) {
  const rawDataUrl = await fileToDataUrl(file);
  if (!file.type?.startsWith("image/")) {
    const bytes = estimateBase64Bytes(rawDataUrl);
    return { dataUrl: rawDataUrl, bytes, tooBig: bytes > PROOF_MAX_BYTES };
  }

  let img;
  try {
    img = await loadImageEl(rawDataUrl);
  } catch {
    const bytes = estimateBase64Bytes(rawDataUrl);
    return { dataUrl: rawDataUrl, bytes, tooBig: bytes > PROOF_MAX_BYTES };
  }

  let smallest = null;
  for (const step of COMPRESSION_STEPS) {
    const candidate = renderJpeg(img, step.maxDim, step.quality);
    const bytes = estimateBase64Bytes(candidate);
    if (!smallest || bytes < smallest.bytes) smallest = { dataUrl: candidate, bytes };
    if (bytes <= PROOF_MAX_BYTES) return { dataUrl: candidate, bytes, tooBig: false };
  }
  return { ...smallest, tooBig: true };
}

export default function UpgradeModal({ open, onClose, onUpgraded, onCancelled, target }) {
  const router = useRouter();
  // checking | confirm | qr | review | queued | rejected | approved
  const [step, setStep] = useState("checking");
  const [invoice, setInvoice] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [queueNumber, setQueueNumber] = useState(null);
  const [rejectReason, setRejectReason] = useState(null);
  // "manual" = Pakasir QRIS, ACC manual owner lewat Telegram (bisa antri).
  // "auto"   = RikyShop QRIS v2, full otomatis — status dicek langsung ke
  // gateway, begitu lunas langsung lanjut sendiri tanpa nunggu admin.
  const [gateway, setGateway] = useState("manual");
  const [gatewaysAvailable, setGatewaysAvailable] = useState({ manual: true, auto: true });
  const [countdown, setCountdown] = useState(APPROVED_REDIRECT_SECONDS);
  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep("checking");
      setInvoice(null);
      setError("");
      setProofFile(null);
      setProofPreview(null);
      setCompressing(false);
      setQueueNumber(null);
      setRejectReason(null);
      setGateway("manual");
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
      return;
    }

    // Every time the modal opens, first check the server for an invoice
    // already in flight — refresh, closed tab, or cleared cache all land
    // back on whichever step matches the invoice's current status. Also
    // fetch which gateways are currently ON (owner can flip these from
    // Telegram for maintenance) so a disabled one isn't pickable.
    (async () => {
      setStep("checking");
      const [pendingRes, gatewaysRes] = await Promise.all([
        fetch("/api/payment/pending"),
        fetch("/api/payment/gateways").catch(() => null)
      ]);

      if (gatewaysRes?.ok) {
        const g = await gatewaysRes.json();
        setGatewaysAvailable(g);
        setGateway((prev) => (g[prev] ? prev : g.manual ? "manual" : g.auto ? "auto" : prev));
      }

      const data = await pendingRes.json();
      if (pendingRes.ok && data.pending) {
        setInvoice(data.invoice);
        setTargetRole(data.targetRole);
        setQueueNumber(data.queueNumber);
        setRejectReason(data.rejectReason);
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
    if (status === "queued") setStep("queued");
    else if (status === "rejected") setStep("rejected");
    else if (status === "awaiting_review") setStep("review");
    else setStep("qr");
    if (status !== "rejected") startPolling(invoiceId);
    else clearInterval(pollRef.current);
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
      } else if (s.status === "queued") {
        setQueueNumber(s.queueNumber);
        setStep("queued");
      } else if (s.status === "rejected") {
        clearInterval(pollRef.current);
        setRejectReason(s.rejectReason);
        setStep("rejected");
      } else if (s.status === "awaiting_review") {
        setStep("review");
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
        body: JSON.stringify({ targetRole: target?.to, gateway })
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
      setQueueNumber(data.queueNumber);
      setRejectReason(data.rejectReason);
      enterStepForStatus(data.status || "pending", data.invoice.invoice_id);
    } catch (e) {
      setError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  async function handleProofChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setCompressing(true);
    try {
      const result = await compressProofImage(file);
      if (result.tooBig) {
        setProofFile(null);
        setProofPreview(null);
        e.target.value = "";
        setError(
          `Foto masih ${Math.ceil(result.bytes / 1024)}KB walau sudah dikompres maksimal — wajib 700KB ke bawah. Coba foto lain yang lebih kecil/simpel (atau screenshot ulang, bukan foto kamera).`
        );
        return;
      }
      setProofFile(file);
      setProofPreview(result.dataUrl);
    } catch {
      setError("Gagal memproses foto. Coba pilih ulang foto bukti transfer.");
    } finally {
      setCompressing(false);
    }
  }

  async function submitProof() {
    if (!invoice || !proofPreview) return;
    setSubmitting(true);
    setError("");
    // Client-side timeout so a stuck request tells the user something
    // useful instead of just spinning on "Mengirim…" forever.
    const controller = new AbortController();
    const killer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.invoice_id, photo: proofPreview }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        setError("Server tidak merespons dengan benar. Coba lagi.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Gagal mengirim bukti pembayaran.");
        return;
      }
      setProofFile(null);
      setStep("review");
      startPolling(invoice.invoice_id);
    } catch (e) {
      if (e?.name === "AbortError") {
        const sizeKb = Math.ceil(estimateBase64Bytes(proofPreview) / 1024);
        setError(
          `Pengiriman timeout (>20 detik) — kemungkinan koneksi lambat, bukan ukuran file (foto ini sudah ${sizeKb}KB, di bawah batas 700KB). Coba lagi sebentar lagi.`
        );
      } else {
        setError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
      }
    } finally {
      clearTimeout(killer);
      setSubmitting(false);
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

            <label className="block text-xs text-muted mb-2">Pilih metode pembayaran:</label>
            <div className="grid grid-cols-1 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setGateway("manual")}
                disabled={creating || !gatewaysAvailable.manual}
                className={`text-left rounded-md border px-3 py-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  gateway === "manual" ? "border-accent bg-accent/10" : "border-line hover:bg-white/5"
                }`}
              >
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  QRIS Manual
                  {!gatewaysAvailable.manual && (
                    <span className="text-[10px] font-normal text-danger border border-danger/30 rounded-sm px-1.5 py-0.5">
                      Maintenance
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  Scan QRIS, upload bukti transfer, di-ACC manual oleh admin (bisa antri).
                </div>
              </button>
              <button
                type="button"
                onClick={() => setGateway("auto")}
                disabled={creating || !gatewaysAvailable.auto}
                className={`text-left rounded-md border px-3 py-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  gateway === "auto" ? "border-accent bg-accent/10" : "border-line hover:bg-white/5"
                }`}
              >
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  QRIS v2 (Otomatis)
                  {!gatewaysAvailable.auto && (
                    <span className="text-[10px] font-normal text-danger border border-danger/30 rounded-sm px-1.5 py-0.5">
                      Maintenance
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  Scan QRIS, pembayaran terdeteksi otomatis — tanpa upload bukti, tanpa antri.
                </div>
              </button>
            </div>

            {!gatewaysAvailable.manual && !gatewaysAvailable.auto && (
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
                disabled={creating || !gatewaysAvailable[gateway]}
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

            {invoice.gateway === "auto" ? (
              <>
                <div className="mono text-accent text-xs mb-4 text-center animate-pulse">
                  MENUNGGU PEMBAYARAN TERDETEKSI OTOMATIS…
                </div>
                <p className="text-muted text-xs text-center mb-3">
                  Scan &amp; bayar QRIS di atas. Halaman ini otomatis lanjut sendiri begitu
                  pembayaran terdeteksi — tidak perlu upload bukti atau menunggu ACC admin.
                </p>
                {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}
              </>
            ) : (
              <>
                <label className="block text-xs text-muted mb-1">
                  Sudah bayar? Upload bukti transfer (screenshot), lalu tekan "Saya sudah bayar".
                </label>
                <p className="text-[11px] text-muted/70 mb-2">
                  Ukuran foto wajib 700KB atau lebih kecil (otomatis dikompres kalau kegedean).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  disabled={compressing}
                  className="block w-full text-xs text-muted mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-white/10 file:text-white disabled:opacity-50"
                />
                {compressing && <p className="text-muted text-xs mb-3">Mengompres foto…</p>}
                {proofPreview && (
                  <img src={proofPreview} alt="Preview bukti transfer" className="w-full rounded-md mb-3 border border-line" />
                )}

                {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}

                <button
                  className="btn-primary w-full mb-3 disabled:opacity-50"
                  onClick={submitProof}
                  disabled={!proofFile || submitting || compressing}
                >
                  {submitting ? "Mengirim…" : "Saya sudah bayar"}
                </button>
              </>
            )}

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

        {step === "review" && (
          <>
            <div className="mono text-accent text-sm mb-3 text-center animate-pulse">MENUNGGU REVIEW</div>
            <h2 className="display text-lg font-bold text-white mb-2 text-center">
              Bukti pembayaran terkirim
            </h2>
            <p className="text-muted text-sm text-center mb-6">
              Bukti transfermu sudah dikirim ke admin lewat Telegram. Halaman ini otomatis lanjut
              begitu admin memproses.
            </p>
            <button className="btn-ghost w-full mb-3" onClick={handleClose}>Tutup (cek nanti)</button>
            <button
              className="w-full text-danger border border-danger/30 rounded-sm text-sm py-2.5 hover:bg-danger/10"
              onClick={cancelTransaction}
              disabled={cancelling}
            >
              {cancelling ? "Membatalkan…" : "Batalkan transaksi"}
            </button>
          </>
        )}

        {step === "queued" && (
          <>
            <div className="text-3xl mb-3 text-center">🕒</div>
            <h2 className="display text-lg font-bold text-white mb-2 text-center">
              Kamu dimasukkan ke antrian{queueNumber != null ? ` #${queueNumber}` : ""}
            </h2>
            <p className="text-muted text-sm text-center mb-6">
              Antrian diatur oleh Owner Rayy. Halaman ini otomatis lanjut begitu giliranmu diproses.
            </p>
            <button className="btn-ghost w-full mb-3" onClick={handleClose}>Tutup (cek nanti)</button>
            <button
              className="w-full text-danger border border-danger/30 rounded-sm text-sm py-2.5 hover:bg-danger/10"
              onClick={cancelTransaction}
              disabled={cancelling}
            >
              {cancelling ? "Membatalkan…" : "Batalkan transaksi"}
            </button>
          </>
        )}

        {step === "rejected" && (
          <>
            <div className="text-3xl mb-3 text-center">❌</div>
            <h2 className="display text-lg font-bold text-white mb-2 text-center">
              Harap kirim ulang / banding
            </h2>
            <p className="text-muted text-sm text-center mb-6">
              Permintaan persetujuan pembayaran/ACC kamu ditolak. Upload ulang bukti transfer untuk
              mengajukan banding.
            </p>

            <p className="text-[11px] text-muted/70 mb-2">
              Ukuran foto wajib 700KB atau lebih kecil (otomatis dikompres kalau kegedean).
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleProofChange}
              disabled={compressing}
              className="block w-full text-xs text-muted mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-white/10 file:text-white disabled:opacity-50"
            />
            {compressing && <p className="text-muted text-xs mb-3">Mengompres foto…</p>}
            {proofPreview && (
              <img src={proofPreview} alt="Preview bukti transfer" className="w-full rounded-md mb-3 border border-line" />
            )}
            {error && <p className="text-danger text-sm mb-3 text-center">{error}</p>}

            <button
              className="btn-primary w-full mb-3 disabled:opacity-50"
              onClick={submitProof}
              disabled={!proofFile || submitting || compressing}
            >
              {submitting ? "Mengirim…" : "Banding (kirim ulang bukti)"}
            </button>
            <button className="btn-ghost w-full mb-3" onClick={handleClose}>Tutup</button>
            <button
              className="w-full text-danger border border-danger/30 rounded-sm text-sm py-2.5 hover:bg-danger/10"
              onClick={cancelTransaction}
              disabled={cancelling}
            >
              {cancelling ? "Membatalkan…" : "Batalkan transaksi"}
            </button>
          </>
        )}

        {step === "approved" && (
          <>
            <div className="text-3xl mb-3 text-center">✅</div>
            <h2 className="display text-lg font-bold text-white mb-2 text-center">
              Pembayaran kamu di-ACC
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
