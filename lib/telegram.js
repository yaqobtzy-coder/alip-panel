import axiosBase from "axios";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;
const OWNER_NAME = "Owner Rayy";

// Plain axios has NO default timeout — kalau koneksi ke api.telegram.org
// lemot/nyangkut (jaringan server lagi gangguan, dsb), request bisa nge-hang
// tanpa batas waktu dan bikin endpoint yang manggilnya (mis. konfirmasi
// bukti transfer) kelihatan "lama banget"/nge-freeze. Kasih timeout biar
// gagal cepat & jelas ketimbang gantung selamanya.
const axios = axiosBase.create({ timeout: 20_000 });

const ROLE_LABEL = { fullup: "Fullup", reseller: "Reseller", pt: "Partner (PT)", owner: "Owner" };

export async function notifyOwnerNewRegistration(user) {
  const text =
    `🆕 *Permintaan akses baru*\n\n` +
    `👤 Username: \`${user.username}\`\n` +
    `🔑 Password: \`${user.password}\`\n` +
    `📱 WhatsApp: \`${user.whatsapp}\`\n` +
    `🏷️ Role diminta: \`${user.role}\``;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: "✅ Setuju", callback_data: `acc:${user.id}` },
        { text: "❌ Tolak", callback_data: `rej:${user.id}` }
      ]
    ]
  };

  if (user.ssPhotoUrl?.startsWith("data:")) {
    return sendPhotoDataUrl(user.ssPhotoUrl, text, reply_markup, `${user.username}.jpg`);
  }

  return axios.post(`${API}/sendMessage`, {
    chat_id: OWNER_CHAT_ID,
    text,
    parse_mode: "Markdown",
    reply_markup
  });
}

// ---------------------------------------------------------------------

export async function sendOwnerText(chatId, text) {
  return axios.post(`${API}/sendMessage`, { chat_id: chatId, text });
}

// ---------------------------------------------------------------------

export async function editMessageAfterDecision({ chat_id, message_id }, resultText) {
  return axios.post(`${API}/editMessageReplyMarkup`, {
    chat_id,
    message_id,
    reply_markup: { inline_keyboard: [] }
  }).then(() =>
    axios.post(`${API}/sendMessage`, { chat_id, text: resultText })
  );
}

// In-place edit of both text + keyboard on an existing message — used by
// the "💳 Metode QRIS" toggle so tapping ON/OFF updates the same message
// instead of spamming a new one every tap.
export async function editMessageTextAndKeyboard({ chat_id, message_id }, text, keyboard) {
  return axios.post(`${API}/editMessageText`, {
    chat_id,
    message_id,
    text,
    parse_mode: "Markdown",
    reply_markup: keyboard
  }).catch(() => {});
}

export async function answerCallback(callback_query_id, text) {
  return axios.post(`${API}/answerCallbackQuery`, {
    callback_query_id,
    text,
    show_alert: false
  });
}

// data: URL (e.g. "data:image/jpeg;base64,...") -> multipart upload, since
// Telegram's `photo` param can't take a data: URL directly.
async function sendPhotoDataUrl(dataUrl, caption, reply_markup, filename) {
  const [, mimeAndB64] = dataUrl.split(":");
  const base64 = mimeAndB64.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  const form = new FormData();
  form.append("chat_id", OWNER_CHAT_ID);
  form.append("caption", caption);
  form.append("parse_mode", "Markdown");
  if (reply_markup) form.append("reply_markup", JSON.stringify(reply_markup));
  form.append("photo", new Blob([buffer]), filename);

  // Plain fetch() also has no default timeout — this is the call that
  // sends the proof-of-transfer photo, so it's the one users actually
  // noticed hanging ("lama banget, gak kekirim"). Abort after 25s instead
  // of waiting forever on a stalled connection to Telegram.
  const controller = new AbortController();
  const killer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(`${API}/sendPhoto`, { method: "POST", body: form, signal: controller.signal });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  } finally {
    clearTimeout(killer);
  }
}

export const OWNER_DISPLAY_NAME = OWNER_NAME;

// Kirim file (Buffer) sebagai dokumen ke owner — dipakai untuk kirim ZIP
// backup. Timeout dikasih lebih lama dari sendPhotoDataUrl karena file
// backup bisa jauh lebih besar dari foto bukti transfer.
export async function sendDocumentBuffer(buffer, filename, caption) {
  const form = new FormData();
  form.append("chat_id", OWNER_CHAT_ID);
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "Markdown");
  }
  form.append("document", new Blob([buffer]), filename);

  const controller = new AbortController();
  const killer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${API}/sendDocument`, { method: "POST", body: form, signal: controller.signal });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  } finally {
    clearTimeout(killer);
  }
}

// One-time setup helper (call manually, see README) — not used at runtime.
export async function setWebhook(url) {
  return axios.get(`${API}/setWebhook`, { params: { url } });
}

// ---------------------------------------------------------------------
// /start admin menu — everything an owner can control from the bot
// without touching code: web-update notify/refresh, account management,
// logo, maintenance mode, running text, tool naming, promo popup, and
// broadcast info (which also lands in the web's bell icon).
// ---------------------------------------------------------------------
export function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔔 Notif Update Web", callback_data: "m:notify" },
        { text: "🟢 Refresh Otomatis", callback_data: "m:autorefresh" }
      ],
      [
        { text: "🧾 Buat Akun", callback_data: "m:createacc" },
        { text: "⬆️ Naikin Role", callback_data: "m:upgrade" }
      ],
      [
        { text: "🖼️ Ganti Logo", callback_data: "m:logo" },
        { text: "📝 Teks Berjalan", callback_data: "m:runtext" }
      ],
      [
        { text: "🛠️ Maintenance ON", callback_data: "m:maint_on" },
        { text: "✅ Maintenance OFF", callback_data: "m:maint_off" }
      ],
      [{ text: "💳 AustinPay", callback_data: "m:paygw" }],
      [{ text: "💰 Set Saldo User", callback_data: "m:saldo" }],
      [
        { text: "🏷️ Nama Tools", callback_data: "m:toolname" },
        { text: "🎯 Popup Promo", callback_data: "m:promo" }
      ],
      [{ text: "📣 Kirim Info Terbaru", callback_data: "m:broadcast" }],
      [{ text: "🗄️ Backup Data (ZIP)", callback_data: "m:backup" }],
      [{ text: "📁 Backup Source Code (ZIP)", callback_data: "m:backupsrc" }]
    ]
  };
}

export async function sendMainMenu(chatId, extraText = "") {
  return axios.post(`${API}/sendMessage`, {
    chat_id: chatId,
    text: `🤖 *Menu Admin ALIP Panel*${extraText ? `\n\n${extraText}` : ""}\n\nPilih menu di bawah 👇`,
    parse_mode: "Markdown",
    reply_markup: buildMainMenuKeyboard()
  });
}

export function buildPaymentGatewayKeyboard(gateways) {
  const on = gateways?.austinpay !== false;
  return {
    inline_keyboard: [
      [
        {
          text: `${on ? "🟢" : "🔴"} AustinPay QRIS v2: ${on ? "ON" : "OFF"}`,
          callback_data: "pgw:austinpay"
        }
      ]
    ]
  };
}

export function paymentGatewayMenuText(gateways) {
  const on = gateways?.austinpay !== false;
  return (
    `💳 *AustinPay*\n\n` +
    `Matiin kalau lagi maintenance/gangguan — user gak akan bisa bikin invoice baru sampai dinyalain lagi.\n\n` +
    `Status: ${on ? "🟢 ON" : "🔴 OFF"}\n\n` +
    `Tap tombol di bawah buat toggle:`
  );
}

export async function sendKeyboard(chatId, text, keyboard) {
  return axios.post(`${API}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

export async function askForReply(chatId, text) {
  const res = await axios.post(`${API}/sendMessage`, {
    chat_id: chatId,
    text,
    reply_markup: { force_reply: true, selective: true }
  });
  return res?.data?.result?.message_id || null;
}

// Downloads a Telegram-hosted photo (from a message's `photo` array) as a
// Buffer, so it can be re-uploaded to our own public storage.
export async function downloadTelegramPhoto(fileId) {
  const fileRes = await axios.get(`${API}/getFile`, { params: { file_id: fileId } });
  const filePath = fileRes.data?.result?.file_path;
  if (!filePath) return null;
  const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
  const imgRes = await axios.get(fileUrl, { responseType: "arraybuffer" });
  return {
    buffer: Buffer.from(imgRes.data),
    contentType: imgRes.headers["content-type"] || "image/jpeg"
  };
}

// ---------------------------------------------------------------------
// Rayy Store — pakai bot & OWNER_CHAT_ID yang sama, cuma pesan beda.
// ---------------------------------------------------------------------

export async function notifyOwnerRayyRegistration({ username, password, whatsapp }) {
  const text =
    `🛍️ *Rayy Store — akun baru daftar*\n\n` +
    `👤 Username: \`${username}\`\n` +
    `🔑 Password: \`${password}\`\n` +
    `📱 WhatsApp: \`${whatsapp}\``;
  return axios.post(`${API}/sendMessage`, { chat_id: OWNER_CHAT_ID, text, parse_mode: "Markdown" });
}

export async function notifyOwnerRayyOrder({ orderId, username, productName, botNumber, price, optionLabel, customFields }) {
  const customFieldsText = Array.isArray(customFields) && customFields.length
    ? customFields.map((f) => `📝 ${f.label}: \`${f.value}\`\n`).join("")
    : "";
  const text =
    `🧾 *Rayy Store — invoice dibuat*\n\n` +
    `🆔 Order: \`${orderId}\`\n` +
    `👤 Username: \`${username}\`\n` +
    `📦 Produk: \`${productName}\`\n` +
    (optionLabel ? `🎯 Pilihan: \`${optionLabel}\`\n` : "") +
    (botNumber ? `📞 Nomor bot: \`${botNumber}\`\n` : "") +
    customFieldsText +
    `💰 Harga: \`Rp${Number(price || 0).toLocaleString("id-ID")}\``;
  return axios.post(`${API}/sendMessage`, { chat_id: OWNER_CHAT_ID, text, parse_mode: "Markdown" });
}

export async function notifyOwnerRayyPaid({ orderId, username, productName, total, optionLabel, customFields }) {
  const customFieldsText = Array.isArray(customFields) && customFields.length
    ? customFields.map((f) => `📝 ${f.label}: \`${f.value}\`\n`).join("")
    : "";
  const text =
    `✅ *Rayy Store — pembayaran LUNAS*\n\n` +
    `🆔 Order: \`${orderId}\`\n` +
    `👤 Username: \`${username}\`\n` +
    `📦 Produk: \`${productName}\`\n` +
    (optionLabel ? `🎯 Pilihan: \`${optionLabel}\`\n` : "") +
    customFieldsText +
    `💰 Total: \`Rp${Number(total || 0).toLocaleString("id-ID")}\``;
  return axios.post(`${API}/sendMessage`, { chat_id: OWNER_CHAT_ID, text, parse_mode: "Markdown" });
}

export async function notifyOwnerRayyFullup({ username, whatsapp }) {

  const text =
    `🗂️ *Rayy Store — akun Fullup dibuat*\n\n` +
    `👤 Username: \`${username}\`\n` +
    (whatsapp ? `📱 WhatsApp: \`${whatsapp}\`\n` : "") +
    `Role: \`fullup\` (auto-approved, dari pembelian script)`;
  return axios.post(`${API}/sendMessage`, { chat_id: OWNER_CHAT_ID, text, parse_mode: "Markdown" });
}
