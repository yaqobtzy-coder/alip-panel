"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const LOGO_URL =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function StrukInner() {
  const params = useSearchParams();
  const invoiceId = params.get("invoice_id");
  const canvasRef = useRef(null);
  const [inv, setInv] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setError("invoice_id wajib diisi.");
      return;
    }
    (async () => {
      const res = await fetch(`/api/payment/struk?invoice_id=${invoiceId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat struk.");
        return;
      }
      setInv(data);
    })();
  }, [invoiceId]);

  useEffect(() => {
    if (!inv) return;
    (async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const W = 640;
      const H = 820;
      canvas.width = W;
      canvas.height = H;

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0B0F17");
      bg.addColorStop(1, "#0d1420");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // card
      ctx.fillStyle = "#111827";
      roundRect(ctx, 32, 32, W - 64, H - 64, 18);
      ctx.fill();
      ctx.strokeStyle = "#232E42";
      ctx.lineWidth = 1;
      roundRect(ctx, 32, 32, W - 64, H - 64, 18);
      ctx.stroke();

      let logo = null;
      try {
        logo = await loadImage(LOGO_URL);
      } catch {
        logo = null;
      }

      let y = 76;
      if (logo) {
        const size = 40;
        roundRect(ctx, W / 2 - size / 2, y - size + 8, size, size, 8);
        ctx.save();
        ctx.clip();
        ctx.drawImage(logo, W / 2 - size / 2, y - size + 8, size, size);
        ctx.restore();
        y += 24;
      }

      ctx.fillStyle = "#E7ECF6";
      ctx.font = "600 18px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(inv.webName || "Database Rayy X Alip ai", W / 2, y + 20);

      // divider
      ctx.strokeStyle = "#232E42";
      ctx.beginPath();
      ctx.moveTo(64, y + 44);
      ctx.lineTo(W - 64, y + 44);
      ctx.stroke();

      // success check circle
      const cy = y + 110;
      ctx.beginPath();
      ctx.fillStyle = "#38D6A8";
      ctx.arc(W / 2, cy, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0B0F17";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 18, cy);
      ctx.lineTo(W / 2 - 5, cy + 15);
      ctx.lineTo(W / 2 + 20, cy - 18);
      ctx.stroke();

      ctx.fillStyle = "#E7ECF6";
      ctx.font = "700 26px 'Segoe UI', sans-serif";
      ctx.fillText("Pembayaran berhasil", W / 2, cy + 76);

      const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date();
      const tanggalJam = paidDate.toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
        timeZone: "Asia/Jakarta"
      });

      const rows = [
        ["Nama produk", inv.productName],
        ["Jumlah", String(inv.quantity ?? 1)],
        ["Tanggal & jam", tanggalJam],
        ["Harga", `Rp${Number(inv.total || 0).toLocaleString("id-ID")}`],
        ["Role awal", inv.fromRoleLabel],
        ["Role baru", inv.toRoleLabel],
        ["Username", inv.username],
        ["ID Transaksi", inv.invoice_id]
      ];

      let ry = cy + 120;
      ctx.textAlign = "left";
      ctx.font = "13px 'Segoe UI', sans-serif";
      const leftX = 64;
      const rightX = W - 64;

      rows.forEach(([label, value], i) => {
        ctx.fillStyle = "#111827";
        roundRect(ctx, leftX - 8, ry - 22, rightX - leftX + 16, 40, 8);
        ctx.fillStyle = i % 2 === 0 ? "#0f1622" : "#111827";
        ctx.fill();

        ctx.fillStyle = "#8B96AC";
        ctx.font = "12px 'Segoe UI', sans-serif";
        ctx.fillText(label, leftX, ry - 4);

        ctx.fillStyle = "#E7ECF6";
        ctx.font = "600 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        const val = String(value ?? "-");
        ctx.fillText(val.length > 42 ? val.slice(0, 42) + "…" : val, rightX, ry + 14);
        ctx.textAlign = "left";

        ry += 52;
      });

      ctx.textAlign = "center";
      ctx.fillStyle = "#59657F";
      ctx.font = "11px 'Segoe UI', sans-serif";
      ctx.fillText("Struk ini dibuat otomatis — simpan sebagai bukti pembayaran.", W / 2, H - 48);

      setReady(true);
    })();
  }, [inv]);

  function download() {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `struk-${inv?.invoice_id || "pembayaran"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {error && (
        <p className="text-danger text-sm border border-danger/30 bg-danger/10 rounded-sm px-3 py-2 mb-4 max-w-md text-center">
          {error}
        </p>
      )}

      {!error && !inv && <p className="text-muted text-sm">Memuat struk…</p>}

      <canvas
        ref={canvasRef}
        className="w-full max-w-[420px] rounded-xl border border-line shadow-lg"
        style={{ display: inv ? "block" : "none" }}
      />

      {ready && (
        <button className="btn-primary mt-5 w-full max-w-[420px]" onClick={download}>
          Unduh struk (PNG)
        </button>
      )}
    </main>
  );
}

export default function StrukPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-muted">Memuat…</main>}>
      <StrukInner />
    </Suspense>
  );
}
