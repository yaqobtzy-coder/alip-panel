import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import {
  answerCallback,
  editMessageAfterDecision,
  removeQueueButton,
  askForQueueNumber,
  askForReply,
  sendOwnerText,
  sendMainMenu,
  sendKeyboard,
  buildPaymentGatewayKeyboard,
  paymentGatewayMenuText,
  editMessageTextAndKeyboard,
  sendDocumentBuffer,
  OWNER_DISPLAY_NAME
} from "@/lib/telegram";
import { buildBackupZip, buildSourceZip } from "@/lib/backup";
import { markInvoicePaid, setInvoiceQueueNumber, rejectInvoice } from "@/lib/invoiceService";
import {
  createAccountAsOwner,
  upgradeUserToPt,
  upgradeUserToReseller,
  findOwnerUserId
} from "@/lib/adminActions";
import {
  updateSiteConfig,
  bumpVersion,
  setToolNameOverride,
  pushNotification,
  getSiteConfig,
  setPaymentGatewayEnabled
} from "@/lib/siteConfig";
import { CANVAS_TOOLS } from "@/lib/toolsZoneData";
import { REJECTED_RETRY_COOLDOWN_MS } from "@/lib/timings";

const REJECTED_RETRY_HOURS = REJECTED_RETRY_COOLDOWN_MS / 3_600_000;

const OWNER_CHAT_ID = String(process.env.TELEGRAM_OWNER_CHAT_ID);
const ROLE_LABEL = { fullup: "Fullup", reseller: "Reseller", pt: "Partner (PT)", owner: "Owner" };

export async function POST(req) {
  const update = await req.json();

  try {
    if (update.callback_query) return await handleCallback(update.callback_query);
    if (update.message) return await handleMessage(update.message);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    // Without this, an unhandled error here just silently drops the
    // response — the bot looks "stuck"/unresponsive with no clue why.
    const chatId =
      update.callback_query?.message?.chat?.id || update.message?.chat?.id;
    if (chatId) {
      await sendOwnerText(chatId, `⚠️ Error: ${err.message || "unknown error"}`).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true }); // ignore anything else
}

async function handleCallback(cq) {
  const fromId = String(cq.from.id);
  if (fromId !== OWNER_CHAT_ID) {
    await answerCallback(cq.id, "Kamu tidak punya izin untuk ini.");
    return NextResponse.json({ ok: true });
  }

  const [action, id] = String(cq.data).split(":");
  const msgLocation = { chat_id: cq.message.chat.id, message_id: cq.message.message_id };
  const chatId = msgLocation.chat_id;

  // --- Registration approval (existing flow, untouched) ---
  if (action === "acc" || action === "rej") {
    return handleRegistrationDecision(action, id, cq, msgLocation);
  }

  // --- Payment review flow (existing, untouched) ---
  if (["pacc", "prej", "pqueue", "pqedit"].includes(action)) {
    return handlePaymentAction(action, id, cq, msgLocation);
  }

  // --- Admin menu (new) ---
  if (action === "m") return handleMenuAction(id, cq, chatId);
  if (action === "pgw") return handlePaymentGatewayToggle(id, cq, chatId);
  if (action === "cacc_role") return handleCreateAccRolePick(id, cq, chatId);
  if (action === "upg_type") return handleUpgradeTypePick(id, cq, chatId);
  if (action === "upg_pick") return handleUpgradeUserPick(id, cq, chatId);
  if (action === "toolpick") return handleToolPick(id, cq, chatId);
  if (action === "promo_confirm") return handlePromoConfirm(id, cq, chatId);

  await answerCallback(cq.id, "Aksi tidak dikenal.");
  return NextResponse.json({ ok: true });
}

async function handleRegistrationDecision(action, userId, cq, msgLocation) {
  const ref = db.collection("users").doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    await answerCallback(cq.id, "Data pendaftar tidak ditemukan.");
    return NextResponse.json({ ok: true });
  }
  const user = doc.data();

  if (action === "acc") {
    await ref.update({ status: "approved", rejectedAt: null });
    await answerCallback(cq.id, "Disetujui.");
    await editMessageAfterDecision(
      msgLocation,
      `✅ ${user.username} disetujui dan bisa login ke dashboard.`
    );
  } else {
    await ref.update({ status: "rejected", rejectedAt: Date.now() });
    await answerCallback(cq.id, "Ditolak.");
    await editMessageAfterDecision(
      msgLocation,
      `❌ ${user.username} ditolak. Bisa coba daftar/login lagi setelah ${REJECTED_RETRY_HOURS} jam.`
    );
  }
  return NextResponse.json({ ok: true });
}

async function handlePaymentAction(action, invoiceId, cq, msgLocation) {
  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) {
    await answerCallback(cq.id, "Invoice tidak ditemukan.");
    return NextResponse.json({ ok: true });
  }
  const inv = invDoc.data();

  if (inv.status === "paid" && (action === "pacc" || action === "prej")) {
    await answerCallback(cq.id, "Pembayaran ini sudah di-ACC sebelumnya.");
    return NextResponse.json({ ok: true });
  }

  if (action === "pacc") {
    const updated = await markInvoicePaid(invoiceId, Date.now());
    await answerCallback(cq.id, "Pembayaran di-ACC.");
    await sendOwnerText(
      msgLocation.chat_id,
      `✅ Pembayaran \`${inv.username}\` (INV ${invoiceId}) di-ACC. Role: ${ROLE_LABEL[inv.fromRole] || inv.fromRole} → ${ROLE_LABEL[updated.toRole] || updated.toRole}.`
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "prej") {
    await rejectInvoice(invoiceId, null);
    await answerCallback(cq.id, "Ditolak.");
    await sendOwnerText(
      msgLocation.chat_id,
      `❌ Pembayaran \`${inv.username}\` (INV ${invoiceId}) ditolak. User diminta upload ulang bukti transfer / banding.`
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "pqueue") {
    await removeQueueButton(msgLocation, invoiceId);
    await setPendingInput(msgLocation.chat_id, { kind: "queue", invoiceId });
    await askForQueueNumber(
      msgLocation.chat_id,
      `🕒 Masukkan nomor antrian untuk \`${inv.username}\` (INV ${invoiceId}).\nBalas (reply) pesan ini dengan angka.`
    );
    await answerCallback(cq.id, "Balas pesan berikutnya dengan nomor antrian.");
    return NextResponse.json({ ok: true });
  }

  if (action === "pqedit") {
    await setPendingInput(msgLocation.chat_id, { kind: "queue_edit", invoiceId });
    const current = inv.queueNumber != null ? ` (saat ini: #${inv.queueNumber})` : "";
    await askForQueueNumber(
      msgLocation.chat_id,
      `🔁 Masukkan nomor antrian baru untuk \`${inv.username}\` (INV ${invoiceId})${current}.\nBalas (reply) pesan ini dengan angka.`
    );
    await answerCallback(cq.id, "Balas pesan berikutnya dengan nomor antrian baru.");
    return NextResponse.json({ ok: true });
  }

  await answerCallback(cq.id, "Aksi tidak dikenal.");
  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------
// Admin menu (/start) — web-update notify/refresh, accounts, logo,
// maintenance, running text, tool naming, promo popup, broadcast.
// ---------------------------------------------------------------------
async function handleMenuAction(key, cq, chatId) {
  await answerCallback(cq.id);

  if (key === "notify") {
    await pushNotification("🔔 Ada update terbaru di website, cek yuk!");
    await sendOwnerText(chatId, "🔔 Notifikasi update terkirim ke lonceng semua user.");
    return NextResponse.json({ ok: true });
  }

  if (key === "autorefresh") {
    const v = await bumpVersion();
    await sendOwnerText(chatId, `🟢 Auto-refresh dipicu ke semua user yang lagi buka web (versi #${v}).`);
    return NextResponse.json({ ok: true });
  }

  if (key === "createacc") {
    await sendKeyboard(chatId, "🧾 *Buat akun* — pilih role:", {
      inline_keyboard: [
        [{ text: "Fullup", callback_data: "cacc_role:fullup" }],
        [{ text: "Reseller", callback_data: "cacc_role:reseller" }],
        [{ text: "Partner (PT)", callback_data: "cacc_role:pt" }]
      ]
    });
    return NextResponse.json({ ok: true });
  }

  if (key === "upgrade") {
    await sendKeyboard(chatId, "⬆️ *Naikin role* — pilih jenis upgrade:", {
      inline_keyboard: [
        [{ text: "Fullup ➜ Reseller", callback_data: "upg_type:fullup_to_reseller" }],
        [{ text: "Reseller ➜ PT", callback_data: "upg_type:reseller_to_pt" }]
      ]
    });
    return NextResponse.json({ ok: true });
  }

  if (key === "logo") {
    await setPendingInput(chatId, { kind: "logo_input" });
    await askForReply(chatId, "🖼️ Balas dengan *URL* gambar logo baru (link langsung ke file gambar).");
    return NextResponse.json({ ok: true });
  }

  if (key === "maint_on") {
    const v = await updateSiteConfig({ maintenanceMode: true }, { touchVersion: true });
    await sendOwnerText(chatId, `🛠️ Maintenance mode *ON* (versi #${v}). Semua user (selain owner) akan lihat halaman maintenance.`);
    return NextResponse.json({ ok: true });
  }

  if (key === "maint_off") {
    const v = await updateSiteConfig({ maintenanceMode: false }, { touchVersion: true });
    await sendOwnerText(chatId, `✅ Maintenance mode *OFF* (versi #${v}). Web sudah normal lagi.`);
    return NextResponse.json({ ok: true });
  }

  if (key === "paygw") {
    const cfg = await getSiteConfig();
    await sendKeyboard(chatId, paymentGatewayMenuText(cfg.paymentGateways), buildPaymentGatewayKeyboard(cfg.paymentGateways));
    return NextResponse.json({ ok: true });
  }

  if (key === "backup") {
    await sendOwnerText(chatId, "🗄️ Lagi narik semua data & bikin ZIP-nya, tunggu bentar ya...");
    try {
      const { buffer, meta } = await buildBackupZip();
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      const stamp = meta.generatedAt.slice(0, 19).replace(/[-:T]/g, "");
      const filename = `backup-alip-${stamp}.zip`;

      const lines = meta.collections.map((c) =>
        c.ok ? `✅ ${c.collection}: ${c.count}` : `⚠️ ${c.collection}: gagal (${c.error})`
      );
      const caption = `🗄️ *Backup data lengkap*\n📦 Ukuran: ${sizeMB} MB\n🕒 ${meta.generatedAt}\n\n${lines.join("\n")}`;

      if (buffer.length > 49 * 1024 * 1024) {
        await sendOwnerText(
          chatId,
          `⚠️ Backup jadi (${sizeMB} MB) tapi kelewat batas ukuran file Telegram bot (50 MB), jadi gak bisa dikirim langsung. Perlu di-split atau diambil manual dari server.`
        );
      } else {
        await sendDocumentBuffer(buffer, filename, caption);
      }
    } catch (err) {
      await sendOwnerText(chatId, `⚠️ Backup gagal: ${err.message || "unknown error"}`);
    }
    return NextResponse.json({ ok: true });
  }

  if (key === "backupsrc") {
    await sendOwnerText(chatId, "📁 Lagi zip semua file source code project, tunggu bentar ya...");
    try {
      const buffer = await buildSourceZip();
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
      const filename = `source-alip-${stamp}.zip`;
      const caption = `📁 *Backup source code lengkap*\n📦 Ukuran: ${sizeMB} MB\n🕒 ${new Date().toISOString()}\n\n⚠️ File \`.env\` asli sengaja TIDAK ikut (isinya token/API key rahasia).`;

      if (buffer.length > 49 * 1024 * 1024) {
        await sendOwnerText(
          chatId,
          `⚠️ Source code jadi ZIP-nya ${sizeMB} MB, kelewat batas 50 MB Telegram bot. Coba bersihin file besar yang gak perlu (mis. di /public) atau ambil manual dari server.`
        );
      } else {
        await sendDocumentBuffer(buffer, filename, caption);
      }
    } catch (err) {
      await sendOwnerText(chatId, `⚠️ Backup source code gagal: ${err.message || "unknown error"}`);
    }
    return NextResponse.json({ ok: true });
  }

  if (key === "runtext") {
    await setPendingInput(chatId, { kind: "runtext_input" });
    await askForReply(chatId, "📝 Ketik teks berjalan baru (kosongkan/ketik `-` untuk mematikan).");
    return NextResponse.json({ ok: true });
  }

  if (key === "toolname") {
    const rows = Object.entries(CANVAS_TOOLS).map(([id, t]) => [
      { text: t.name, callback_data: `toolpick:${id}` }
    ]);
    await sendKeyboard(chatId, "🏷️ *Nama Tools* — pilih tool yang mau diganti namanya:", {
      inline_keyboard: rows
    });
    return NextResponse.json({ ok: true });
  }

  if (key === "promo") {
    await setPendingInput(chatId, { kind: "promo_image" });
    await askForReply(
      chatId,
      "🎯 *Popup Promosi* — balas dengan *URL* gambar promosi (ketik `-` untuk tanpa gambar)."
    );
    return NextResponse.json({ ok: true });
  }

  if (key === "broadcast") {
    await setPendingInput(chatId, { kind: "broadcast_input" });
    await askForReply(chatId, "📣 Ketik info terbaru yang mau dikirim ke lonceng semua user.");
    return NextResponse.json({ ok: true });
  }

  await sendOwnerText(chatId, "Menu tidak dikenal.");
  return NextResponse.json({ ok: true });
}

// Toggle ON/OFF satu gateway pembayaran ("manual" atau "auto") dari tombol
// di menu "💳 Metode QRIS", lalu edit pesan yang sama biar keliatan
// status terbarunya tanpa spam pesan baru.
async function handlePaymentGatewayToggle(gateway, cq, chatId) {
  if (!["manual", "auto"].includes(gateway)) {
    await answerCallback(cq.id, "Gateway tidak dikenal.");
    return NextResponse.json({ ok: true });
  }

  const current = await getSiteConfig();
  const nextEnabled = !(current.paymentGateways?.[gateway] !== false);
  const updated = await setPaymentGatewayEnabled(gateway, nextEnabled);

  const label = gateway === "manual" ? "QRIS Manual (Pakasir)" : "QRIS v2 Otomatis (RikyShop)";
  await answerCallback(cq.id, `${label} sekarang ${nextEnabled ? "ON ✅" : "OFF 🔴"}.`);

  const msgLocation = { chat_id: cq.message.chat.id, message_id: cq.message.message_id };
  await editMessageTextAndKeyboard(
    msgLocation,
    paymentGatewayMenuText(updated.paymentGateways),
    buildPaymentGatewayKeyboard(updated.paymentGateways)
  );
  return NextResponse.json({ ok: true });
}

async function handleCreateAccRolePick(role, cq, chatId) {
  await answerCallback(cq.id);
  if (!["fullup", "reseller", "pt"].includes(role)) return NextResponse.json({ ok: true });
  await setPendingInput(chatId, { kind: "create_username", data: { role } });
  await askForReply(chatId, `🧾 Role: *${ROLE_LABEL[role]}*.\nBalas dengan *username* akun baru.`);
  return NextResponse.json({ ok: true });
}

// Instead of asking the owner to type a username (error-prone — typo,
// wrong case, extra space all show up as "user tidak ditemukan"), we
// pull the matching users straight from the database and let the owner
// tap one. The button's callback_data carries the Firestore doc id, so
// the username used for the upgrade is always the exact stored value.
async function handleUpgradeTypePick(type, cq, chatId) {
  await answerCallback(cq.id);
  if (!["fullup_to_reseller", "reseller_to_pt"].includes(type)) {
    await sendOwnerText(chatId, "Jenis upgrade tidak dikenal.");
    return NextResponse.json({ ok: true });
  }

  const sourceRole = type === "fullup_to_reseller" ? "fullup" : "reseller";
  const label = type === "fullup_to_reseller" ? "Fullup ➜ Reseller" : "Reseller ➜ PT";

  const snap = await db.collection("users").where("role", "==", sourceRole).limit(200).get();
  const users = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.username || "").localeCompare(b.username || ""));

  if (users.length === 0) {
    await sendOwnerText(chatId, `Belum ada user dengan role ${ROLE_LABEL[sourceRole]} saat ini.`);
    return NextResponse.json({ ok: true });
  }

  // Telegram keyboards get unwieldy past a few dozen rows — cap it and
  // say so, rather than silently dropping users.
  const shown = users.slice(0, 30);
  const rows = shown.map((u) => [{ text: `👤 ${u.username}`, callback_data: `upg_pick:${u.id}` }]);
  const truncNote =
    users.length > shown.length ? `\n\n_Menampilkan 30 dari ${users.length} user._` : "";

  await sendKeyboard(
    chatId,
    `⬆️ *${label}*\nPilih user yang mau dinaikkan role-nya:${truncNote}`,
    { inline_keyboard: rows }
  );
  return NextResponse.json({ ok: true });
}

// Tapping a user button in the list above lands here — looks the user up
// by doc id (guaranteed exact match, no typing involved) and runs the
// same upgrade functions the old typed-username flow used.
async function handleUpgradeUserPick(userId, cq, chatId) {
  const msgLocation = { chat_id: cq.message.chat.id, message_id: cq.message.message_id };
  const ref = db.collection("users").doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    await answerCallback(cq.id, "User tidak ditemukan (mungkin sudah dihapus).");
    return NextResponse.json({ ok: true });
  }

  const user = doc.data();
  await answerCallback(cq.id, "Memproses...");

  let result;
  if (user.role === "fullup") {
    result = await upgradeUserToReseller(user.username);
  } else if (user.role === "reseller") {
    result = await upgradeUserToPt(user.username);
  } else {
    result = {
      error: `Role user ini udah berubah jadi ${ROLE_LABEL[user.role] || user.role}, gak bisa dinaikkan lagi lewat menu ini.`
    };
  }

  await editMessageAfterDecision(
    msgLocation,
    result.error
      ? `❌ Gagal upgrade \`${user.username}\`: ${result.error}`
      : `✅ \`${user.username}\` berhasil dinaikkan role-nya.`
  );
  return NextResponse.json({ ok: true });
}

async function handleToolPick(toolId, cq, chatId) {
  await answerCallback(cq.id);
  if (!CANVAS_TOOLS[toolId]) return NextResponse.json({ ok: true });
  await setPendingInput(chatId, { kind: "toolname_input", data: { toolId } });
  await askForReply(chatId, `🏷️ Nama baru untuk *${CANVAS_TOOLS[toolId].name}*:`);
  return NextResponse.json({ ok: true });
}

async function handlePromoConfirm(action, cq, chatId) {
  await answerCallback(cq.id);
  const pending = await getPendingInput(chatId);
  if (!pending || pending.kind !== "promo_review") return NextResponse.json({ ok: true });
  const { data } = pending;

  if (action === "save") {
    const v = await updateSiteConfig(
      {
        popup: {
          enabled: true,
          imageUrl: data.imageUrl || "",
          text: data.text || "",
          ctaText: data.ctaText || "",
          ctaUrl: data.ctaUrl || ""
        }
      },
      { touchVersion: true }
    );
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, `🎯 Popup promosi aktif & tersimpan (versi #${v}).`);
  } else if (action === "off") {
    const v = await updateSiteConfig({ popup: { enabled: false } }, { touchVersion: true });
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, `🚫 Popup promosi dimatikan (versi #${v}).`);
  }
  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------
// Text/photo replies (force-reply flow) + /start
// ---------------------------------------------------------------------
async function handleMessage(message) {
  const fromId = String(message.from?.id || "");
  const chatId = String(message.chat.id);

  if (fromId !== OWNER_CHAT_ID) return NextResponse.json({ ok: true });

  const text = String(message.text || message.caption || "").trim();

  if (text === "/start" || text === "/menu") {
    await sendMainMenu(chatId);
    return NextResponse.json({ ok: true });
  }

  if (!message.reply_to_message) return NextResponse.json({ ok: true });

  const pending = await getPendingInput(chatId);
  if (!pending) return NextResponse.json({ ok: true });

  const { kind, invoiceId, data } = pending;

  // --- Existing queue-number flow ---
  if (kind === "queue" || kind === "queue_edit") {
    const queueNumber = parseInt(text, 10);
    if (!Number.isFinite(queueNumber) || queueNumber <= 0) {
      await sendOwnerText(chatId, "Nomor antrian tidak valid. Balas lagi dengan angka (misalnya: 1).");
      return NextResponse.json({ ok: true });
    }
    const updated = await setInvoiceQueueNumber(invoiceId, queueNumber);
    await clearPendingInput(chatId);
    const label =
      kind === "queue_edit"
        ? `🔁 Antrian \`${updated.username}\` (INV ${invoiceId}) diubah ke #${queueNumber}.`
        : `🕒 \`${updated.username}\` (INV ${invoiceId}) dimasukkan ke antrian #${queueNumber} oleh ${OWNER_DISPLAY_NAME}.`;
    await sendOwnerText(chatId, label);
    return NextResponse.json({ ok: true });
  }

  // --- Create account: username then password ---
  if (kind === "create_username") {
    if (!text) {
      await sendOwnerText(chatId, "Username tidak boleh kosong. Balas lagi.");
      return NextResponse.json({ ok: true });
    }
    await setPendingInput(chatId, { kind: "create_password", data: { ...data, username: text } });
    await askForReply(chatId, `🔑 Balas dengan *password* untuk akun \`${text}\`.`);
    return NextResponse.json({ ok: true });
  }

  if (kind === "create_password") {
    const ownerId = await findOwnerUserId();
    const result = await createAccountAsOwner({
      username: data.username,
      password: text,
      role: data.role,
      parentId: ownerId
    });
    await clearPendingInput(chatId);
    if (result.error) {
      await sendOwnerText(chatId, `❌ ${result.error}`);
    } else {
      await sendOwnerText(chatId, `✅ Akun \`${data.username}\` (${ROLE_LABEL[data.role]}) berhasil dibuat.`);
    }
    return NextResponse.json({ ok: true });
  }

  // --- Logo ---
  if (kind === "logo_input") {
    if (!/^https?:\/\//i.test(text)) {
      await sendOwnerText(chatId, "Itu bukan URL yang valid. Balas lagi dengan link gambar (diawali http:// atau https://).");
      return NextResponse.json({ ok: true });
    }
    const v = await updateSiteConfig({ logoUrl: text }, { touchVersion: true });
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, `🖼️ Logo diganti (versi #${v}).`);
    return NextResponse.json({ ok: true });
  }

  // --- Running text ---
  if (kind === "runtext_input") {
    const value = text === "-" ? "" : text;
    const v = await updateSiteConfig({ runningText: value }, { touchVersion: true });
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, value ? `📝 Teks berjalan diperbarui (versi #${v}).` : `📝 Teks berjalan dimatikan (versi #${v}).`);
    return NextResponse.json({ ok: true });
  }

  // --- Tool naming ---
  if (kind === "toolname_input") {
    await setToolNameOverride(data.toolId, text);
    const v = await bumpVersion();
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, `🏷️ Nama tool diganti jadi *${text}* (versi #${v}).`);
    return NextResponse.json({ ok: true });
  }

  // --- Broadcast info -> bell ---
  if (kind === "broadcast_input") {
    await pushNotification(text);
    await clearPendingInput(chatId);
    await sendOwnerText(chatId, "📣 Info terbaru terkirim ke lonceng semua user.");
    return NextResponse.json({ ok: true });
  }

  // --- Promo popup: image -> text -> cta text -> cta url -> review ---
  if (kind === "promo_image") {
    let url = "";
    if (text !== "-") {
      if (!/^https?:\/\//i.test(text)) {
        await sendOwnerText(chatId, "Itu bukan URL yang valid. Balas lagi dengan link gambar (diawali http:// atau https://), atau `-` untuk tanpa gambar.");
        return NextResponse.json({ ok: true });
      }
      url = text;
    }
    await setPendingInput(chatId, { kind: "promo_text", data: { imageUrl: url } });
    await askForReply(chatId, "✍️ Ketik teks promosi yang mau ditampilkan.");
    return NextResponse.json({ ok: true });
  }

  if (kind === "promo_text") {
    await setPendingInput(chatId, { kind: "promo_cta_text", data: { ...data, text } });
    await askForReply(chatId, "🔘 Ketik teks tombol CTA (misal: \"Upgrade Sekarang\"), atau `-` untuk tanpa tombol.");
    return NextResponse.json({ ok: true });
  }

  if (kind === "promo_cta_text") {
    const ctaText = text === "-" ? "" : text;
    if (!ctaText) {
      await setPendingInput(chatId, { kind: "promo_review", data: { ...data, ctaText: "", ctaUrl: "" } });
      return sendPromoReview(chatId, { ...data, ctaText: "", ctaUrl: "" });
    }
    await setPendingInput(chatId, { kind: "promo_cta_url", data: { ...data, ctaText } });
    await askForReply(chatId, "🔗 Balas dengan link tujuan tombol CTA (URL halaman upgrade/pembelian kamu).");
    return NextResponse.json({ ok: true });
  }

  if (kind === "promo_cta_url") {
    const full = { ...data, ctaUrl: text };
    await setPendingInput(chatId, { kind: "promo_review", data: full });
    return sendPromoReview(chatId, full);
  }

  return NextResponse.json({ ok: true });
}

async function sendPromoReview(chatId, data) {
  const preview =
    `🎯 *Preview Popup Promosi*\n\n` +
    `🖼️ Gambar: ${data.imageUrl ? "✅ ada" : "tanpa gambar"}\n` +
    `✍️ Teks: ${data.text || "-"}\n` +
    `🔘 CTA: ${data.ctaText || "-"}${data.ctaUrl ? ` ➜ ${data.ctaUrl}` : ""}`;
  await sendKeyboard(chatId, preview, {
    inline_keyboard: [
      [{ text: "✅ Aktifkan & Simpan", callback_data: "promo_confirm:save" }],
      [{ text: "🚫 Batal / Matikan", callback_data: "promo_confirm:off" }]
    ]
  });
  return NextResponse.json({ ok: true });
}

async function setPendingInput(chatId, payload) {
  await db.collection("telegramPending").doc(String(chatId)).set({ ...payload, createdAt: Date.now() });
}

async function getPendingInput(chatId) {
  const doc = await db.collection("telegramPending").doc(String(chatId)).get();
  return doc.exists ? doc.data() : null;
}

async function clearPendingInput(chatId) {
  await db.collection("telegramPending").doc(String(chatId)).delete();
}

// Telegram sends a GET on webhook misconfiguration checks in some setups —
// respond harmlessly instead of 405.
export async function GET() {
  return NextResponse.json({ ok: true, info: "ALIP AI telegram webhook" });
}
