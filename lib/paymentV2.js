// Gateway kedua: QRIS v2 (RikyShopReal) — full otomatis, tanpa upload
// bukti transfer / review manual owner. Beda total sama Pakasir (lib/payment.js):
// - QR-nya sudah jadi (URL gambar) langsung dari response create, nggak perlu
//   di-render ulang pakai lib `qrcode`.
// - Status dicek lewat deposit_id (bukan order_id+amount kayak Pakasir).
// - Auth pakai header x-api-key, bukan api_key di body.
const RIKY_BASE = process.env.RIKYSHOP_BASE_URL || "https://payment.rikyshopreal.cyou";
const RIKY_API_KEY = process.env.RIKYSHOP_API_KEY;

async function rikyFetch(path, body) {
  const res = await fetch(`${RIKY_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": RIKY_API_KEY },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    const msg = data?.error || `RikyShop ${path} gagal: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Bikin deposit baru. `amount` = harga upgrade (angka bulat, rupiah).
// Return shape dari API: { id, amount, fee, total_payment, qr_image, status, expired_at }
export async function createDepositRiky(amount) {
  const { deposit } = await rikyFetch("/api/deposit/create", { amount });
  return deposit;
}

// Dipanggil buat polling status — ini yang bikin gateway ini "full otomatis":
// begitu status di sisi RikyShop berubah jadi lunas, kita ikut nandain invoice
// lokal "paid" tanpa nunggu owner tap ACC di Telegram.
export async function getDepositStatusRiky(depositId) {
  const { deposit } = await rikyFetch("/api/deposit/status", { deposit_id: depositId });
  return deposit;
}

export async function cancelDepositRiky(depositId) {
  return rikyFetch("/api/deposit/cancel", { deposit_id: depositId });
}
