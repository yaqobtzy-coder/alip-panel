"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

const DB_LINK = "https://rayy-x-db-alip.vercel.app";

export default function RayyProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const pollRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [botNumber, setBotNumber] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [voucherErr, setVoucherErr] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullupForm, setFullupForm] = useState({ username: "", password: "" });
  const [fullupMsg, setFullupMsg] = useState("");
  const [fullupLoading, setFullupLoading] = useState(false);

  useEffect(() => {
    fetch("/api/rayy-store/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/rayy-store/login");
      });
  }, [router]);

  useEffect(() => {
    fetch(`/api/rayy-store/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => {});
  }, [id]);

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  const startPolling = (orderId) => {
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/rayy-store/orders/${orderId}/status`);
      const data = await res.json();
      setOrder(data);
      if (data.status === "paid" || data.status === "expired") {
        clearInterval(pollRef.current);
      }
    }, 4000);
  };

  const cekVoucher = async () => {
    setVoucherErr("");
    setVoucherPreview(null);
    if (!voucherCode.trim()) return;
    setVoucherChecking(true);
    try {
      const res = await fetch("/api/rayy-store/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, productId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voucher tidak valid.");
      setVoucherPreview(data);
    } catch (e) {
      setVoucherErr(e.message);
    } finally {
      setVoucherChecking(false);
    }
  };

  const beli = async () => {
    setError("");
    if (product.type === "script" && !botNumber.trim()) {
      setError("Nomor bot wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rayy-store/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          botNumber,
          voucherCode: voucherPreview ? voucherCode : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice.");
      setOrder({
        id: data.orderId,
        status: "pending",
        qrImage: data.qrImage,
        totalPayment: data.totalPayment,
        productName: product.name
      });
      startPolling(data.orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buatFullup = async (e) => {
    e.preventDefault();
    setFullupMsg("");
    setFullupLoading(true);
    try {
      const res = await fetch("/api/rayy-store/fullup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fullupForm, orderId: order.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat akun.");
      setFullupMsg("Akun Fullup berhasil dibuat! Silakan login pakai username & password itu.");
    } catch (err) {
      setFullupMsg(err.message);
    } finally {
      setFullupLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <Link href="/rayy-store/dashboard" className="text-sm text-accent">&larr; Kembali</Link>

      <div className="card overflow-hidden mt-3 hover-lift">
        <div className="aspect-video bg-panel2">
          {product.thumbnailUrl && (
            <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-4">
          <h1 className="display text-xl font-bold text-white">{product.name}</h1>
          <p className="text-accent2 font-semibold text-lg mt-1">{formatRupiah(product.price)}</p>
          {product.description && <p className="text-sm text-muted mt-2">{product.description}</p>}
        </div>
      </div>

      {/* Belum ada order -> form beli */}
      {!order && (
        <div className="card p-4 mt-4 space-y-3 hover-lift">
          {product.type === "script" && (
            <div>
              <label className="text-xs text-muted">Nomor Bot (untuk didaftarkan ke database)</label>
              <input
                className="field mt-1"
                value={botNumber}
                onChange={(e) => setBotNumber(e.target.value)}
                placeholder="62xxxxxxxxxx"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted">Kode Voucher (opsional)</label>
            <div className="flex gap-2 mt-1">
              <input
                className="field flex-1"
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase());
                  setVoucherPreview(null);
                  setVoucherErr("");
                }}
                placeholder="MISALNYA RAYY10"
              />
              <button
                type="button"
                onClick={cekVoucher}
                disabled={voucherChecking || !voucherCode.trim()}
                className="btn-ghost px-4 text-sm disabled:opacity-50"
              >
                {voucherChecking ? "..." : "Pakai"}
              </button>
            </div>
            {voucherErr && <p className="text-xs text-danger mt-1">{voucherErr}</p>}
            {voucherPreview && (
              <p className="text-xs text-accent2 mt-1">
                ✅ Voucher {voucherPreview.code} dipakai — potongan {formatRupiah(voucherPreview.discount)}, total jadi{" "}
                <span className="font-semibold">{formatRupiah(voucherPreview.finalPrice)}</span>
              </p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            onClick={beli}
            disabled={loading}
            className="w-full bg-accent hover:opacity-90 transition text-white font-semibold rounded-md py-2.5 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Bayar"}
          </button>
        </div>
      )}

      {/* Order pending -> QR */}
      {order && order.status === "pending" && (
        <div className="card p-4 mt-4 text-center space-y-3 hover-lift">
          <p className="text-sm text-muted">Scan QRIS untuk bayar {formatRupiah(order.totalPayment)}</p>
          {order.qrImage && <img src={order.qrImage} alt="QRIS" className="w-56 h-56 mx-auto rounded-md bg-white p-2" />}
          <p className="text-xs text-muted animate-pulse">Menunggu pembayaran... halaman akan update otomatis.</p>
        </div>
      )}

      {order && order.status === "expired" && (
        <div className="card p-4 mt-4 text-center hover-lift">
          <p className="text-danger text-sm">Invoice kedaluwarsa / gagal. Silakan buat pesanan baru.</p>
          <button onClick={() => setOrder(null)} className="mt-3 text-accent text-sm underline">Coba lagi</button>
        </div>
      )}

      {/* Paid -> download + link db + form fullup */}
      {order && order.status === "paid" && (
        <div className="card p-4 mt-4 space-y-4 hover-lift">
          <p className="text-accent2 font-semibold">✅ Pembayaran berhasil!</p>

          {order.fileUrl && (
            <a
              href={order.fileUrl}
              className="block w-full text-center bg-accent2 hover:opacity-90 transition text-ink font-semibold rounded-md py-2.5"
            >
              ⬇ Unduh File / Script
            </a>
          )}

          <a
            href={DB_LINK}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center border border-line hover:border-accent transition text-white rounded-md py-2.5 text-sm"
          >
            Buka Database Rayy X Alip ↗
          </a>

          <div className="border-t border-line pt-4">
            <p className="text-sm text-white font-medium mb-2">Buat akun Fullup (akses database)</p>
            <form onSubmit={buatFullup} className="space-y-2">
              <input
                className="field"
                placeholder="Username"
                value={fullupForm.username}
                onChange={(e) => setFullupForm({ ...fullupForm, username: e.target.value })}
                required
              />
              <input
                type="password"
                className="field"
                placeholder="Password"
                value={fullupForm.password}
                onChange={(e) => setFullupForm({ ...fullupForm, password: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={fullupLoading}
                className="w-full bg-panel2 hover:bg-line transition text-white rounded-md py-2.5 text-sm disabled:opacity-50"
              >
                {fullupLoading ? "Memproses..." : "Buat Akun Fullup"}
              </button>
            </form>
            {fullupMsg && <p className="text-sm text-muted mt-2">{fullupMsg}</p>}
          </div>

          <Link href={`/rayy-store/struk/${order.id}`} className="block text-center text-sm text-accent underline">
            Lihat & unduh struk
          </Link>
        </div>
      )}
    </div>
  );
}
