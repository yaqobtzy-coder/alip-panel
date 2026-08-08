import axiosBase from "axios";

// Panggil endpoint kecil yang jalan DI DALAM proses bot WhatsApp (Baileys) —
// lihat source/wa-notify-api.js di project bot (rayy-ai). Panel ini gak
// pegang koneksi WA sendiri, jadi kirim pesan WA harus lewat bot yang
// memang lagi login.
const BASE_URL = process.env.WA_NOTIFY_API_BASE_URL || "http://localhost:7072";
const API_KEY = process.env.WA_NOTIFY_API_KEY;

// Sama kayak lib/telegram.js: kasih timeout biar gagal cepat & jelas
// ketimbang gantung selamanya kalau bot lagi mati/nggak reachable.
const axios = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: API_KEY ? { "x-api-key": API_KEY } : {}
});

// Semua fungsi di sini sengaja "silent-fail friendly" (dipanggil dengan
// .catch(() => {}) di pemanggilnya) — notifikasi WA gagal terkirim bukan
// alasan buat gagalin proses order/pembayaran yang lagi berjalan.

export async function sendOwnerWaNotify(text) {
  return axios.post("/api/notify/owner", { text });
}

export async function sendChannelReceipt(text) {
  return axios.post("/api/notify/channel", { text });
}

// --------------------------------------------------------------------
// Formatter struk — dipakai buat pesan yang masuk ke saluran WA.
// --------------------------------------------------------------------

const STORE_URL = "https://rayy-database.my.id";
const STORE_CONTACT = "6285189712417";

export function formatStrukText({ orderId, transactionId, username, productName, total, optionLabel, customFields, paidAt }) {
  const extraLines = [];
  if (optionLabel) extraLines.push(`✦ Option: ${optionLabel}`);
  if (Array.isArray(customFields) && customFields.length) {
    customFields.forEach((f) => extraLines.push(`✦ ${f.label}: ${f.value}`));
  }
  const extraText = extraLines.length ? extraLines.join("\n") + "\n" : "";

  const tanggal = new Date(paidAt || Date.now()).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
`╔══════════════════════════════╗
║      ✅ ORDER COMPLETED      ║
╚══════════════════════════════╝

✦ Customer: ${username}
✦ Product: ${productName}
${extraText}✦ Amount: Rp${Number(total || 0).toLocaleString("id-ID")}
✦ Payment: QRIS (AustinPay)
✦ Transaction ID: ${transactionId || orderId}
✦ Date: ${tanggal}

🔗 Access Link:
${STORE_URL}

Thank you for shopping at ★ RAYY STORE ★
📞 Contact: wa.me/${STORE_CONTACT}`
  );
}

// Kirim notifikasi WA owner + struk ke channel dalam satu panggilan.
// Dipanggil dari titik yang sama tempat notifyOwnerRayyPaid (Telegram)
// dipanggil, dengan payload yang sama persis.
export async function notifyWaPaid(payload) {
  const struk = formatStrukText(payload);
  await Promise.allSettled([
    sendOwnerWaNotify(struk),
    sendChannelReceipt(struk)
  ]);
}

// --------------------------------------------------------------------
// Formatter teks "order baru dibuat" (invoice QRIS baru terbit, belum
// dibayar) — tema sama kayak struk, tapi status masih pending & CUMA
// dikirim ke WA owner (bukan ke saluran — saluran khusus buat transaksi
// yang udah kelar/lunas).
// --------------------------------------------------------------------

export function formatOrderText({ orderId, transactionId, username, productName, price, optionLabel, customFields, createdAt }) {
  const extraLines = [];
  if (optionLabel) extraLines.push(`✦ Option: ${optionLabel}`);
  if (Array.isArray(customFields) && customFields.length) {
    customFields.forEach((f) => extraLines.push(`✦ ${f.label}: ${f.value}`));
  }
  const extraText = extraLines.length ? extraLines.join("\n") + "\n" : "";

  const tanggal = new Date(createdAt || Date.now()).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
`╔══════════════════════════════╗
║        🛒 NEW ORDER          ║
╚══════════════════════════════╝

✦ Customer: ${username}
✦ Product: ${productName}
${extraText}✦ Amount: Rp${Number(price || 0).toLocaleString("id-ID")}
✦ Payment: QRIS (AustinPay)
✦ Transaction ID: ${transactionId || orderId}
✦ Status: ⏳ Menunggu Pembayaran
✦ Date: ${tanggal}

🔗 Access Link:
${STORE_URL}

★ RAYY STORE ★
📞 Contact: wa.me/${STORE_CONTACT}`
  );
}

export async function notifyWaOrder(payload) {
  return sendOwnerWaNotify(formatOrderText(payload));
}
