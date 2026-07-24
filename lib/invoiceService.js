import { db } from "@/lib/firebaseAdmin";
import { alipDb } from "@/lib/alipDb";
import { notifyOwnerPaymentRequest } from "@/lib/telegram";
import { renderQrImage } from "@/lib/payment";
import { getDepositStatusRiky } from "@/lib/paymentV2";

// Statuses that still count as "an invoice the user is actively working
// through" — covers the whole manual-review lifecycle, not just the
// original QR-not-yet-confirmed state. "paid" and "cancelled" are the
// only terminal states that free the user up to start a new upgrade.
const OPEN_STATUSES = ["pending", "awaiting_review", "queued", "rejected"];

// Finds this user's still-open invoice, if any. Filtering happens in JS
// (not a compound Firestore query) to avoid needing a composite index,
// and because a single user only ever has a handful of invoice docs.
export async function findActivePendingInvoice(userId) {
  const snap = await db.collection("invoices").where("userId", "==", userId).get();
  const now = Date.now();

  const candidates = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((inv) => {
      if (!OPEN_STATUSES.includes(inv.status)) return false;
      // Expiry only matters before the user has submitted proof — once
      // they're in review/queued/rejected the invoice stays open until
      // an admin decision, regardless of the original QR expiry.
      if (inv.status === "pending" && inv.expiredAt) {
        const exp = new Date(inv.expiredAt).getTime();
        if (!Number.isNaN(exp) && exp <= now) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return candidates[0] || null;
}

// Gateway-aware QR image lookup. Pakasir (gateway "manual") only stores a
// raw payment_number and needs it re-rendered into a PNG data URL every
// time; RikyShop (gateway "auto") already hands back a ready-made image
// URL on creation, so we just persist and reuse that string as-is.
export async function getInvoiceQrImage(inv) {
  if (inv.gateway === "auto") return inv.qrImage;
  return renderQrImage(inv.paymentNumber);
}

// Statuses from RikyShop that mean "the deposit is actually settled".
// Kept as a list (rather than a single string) since we don't fully
// control the gateway's vocabulary and different QRIS providers tend to
// use slightly different wording for the same thing.
const RIKY_PAID_STATUSES = ["success", "paid", "completed", "settlement"];

// Only meaningful for gateway "auto" invoices still marked "pending" — this
// is what makes that gateway "full otomatis": instead of waiting for the
// owner to tap ACC in Telegram, we ask RikyShop directly whether the
// deposit has been paid and auto-settle it here if so. No-op for every
// other gateway/status combination. Safe to call on every poll/pageview.
export async function syncAutoGatewayInvoice(invoiceId, inv) {
  if (inv.gateway !== "auto" || inv.status !== "pending" || !inv.externalId) return inv;
  try {
    const remote = await getDepositStatusRiky(inv.externalId);
    const remoteStatus = String(remote?.status || "").toLowerCase();
    if (RIKY_PAID_STATUSES.includes(remoteStatus)) {
      const updated = await markInvoicePaid(invoiceId, remote?.paid_at || remote?.completed_at || null);
      if (updated) return updated;
    }
  } catch (e) {
    // Gateway hiccup — leave the invoice as "pending" so the next poll
    // (1s later, see PAYMENT_STATUS_POLL_MS) just tries again. The user
    // can still cancel manually if it never resolves.
    console.error(`RikyShop status sync failed for ${invoiceId}:`, e.message);
  }
  return inv;
}

// Marks an invoice as paid, upgrades the user's role. Safe to call more
// than once for the same invoice — it no-ops if already paid. `source`
// is just for logging ("owner-telegram" vs a payment-gateway webhook).
export async function markInvoicePaid(invoiceId, completedAt) {
  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) return null;

  const inv = invDoc.data();
  if (inv.status === "paid") return inv; // already processed

  try {
    if (inv.toRole === "pt") {
      await alipDb.upgradeResellerToPt(inv.username);
    }
  } catch {
    console.error(`ALIP-DB sync failed for ${inv.username} -> ${inv.toRole}`);
  }

  await db.collection("users").doc(inv.userId).update({ role: inv.toRole });
  await invRef.update({
    status: "paid",
    paidAt: Date.now(),
    settlementTime: completedAt || null,
    queueNumber: null,
    rejectReason: null
  });

  return { ...inv, status: "paid" };
}

// User uploaded a proof-of-transfer photo and pressed "Saya sudah bayar".
// Sends the request (photo + order info) to the owner's Telegram with the
// ACC / Tolak / Masukkan ke antrian / Ubah antrian keyboard.
export async function submitPaymentProof(invoiceId, photoDataUrl) {
  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) return null;
  const inv = invDoc.data();

  const isBanding = inv.status === "rejected";

  await invRef.update({
    status: "awaiting_review",
    proofPhotoUrl: photoDataUrl,
    submittedAt: Date.now(),
    queueNumber: null,
    rejectReason: null,
    bandingCount: isBanding ? (inv.bandingCount || 0) + 1 : inv.bandingCount || 0
  });

  let tg = null;
  try {
    tg = await notifyOwnerPaymentRequest({
      invoiceId,
      username: inv.username,
      fromRole: inv.fromRole,
      toRole: inv.toRole,
      total: inv.total,
      proofPhotoUrl: photoDataUrl,
      banding: isBanding
    });
  } catch (e) {
    console.error("Gagal kirim notifikasi Telegram:", e.message);
  }

  if (tg?.chatId && tg?.messageId) {
    await invRef.update({ telegramChatId: String(tg.chatId), telegramMessageId: tg.messageId });
  }

  return { ...inv, status: "awaiting_review" };
}

export async function setInvoiceQueueNumber(invoiceId, queueNumber) {
  const invRef = db.collection("invoices").doc(invoiceId);
  await invRef.update({ status: "queued", queueNumber });
  const doc = await invRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function rejectInvoice(invoiceId, reason = null) {
  const invRef = db.collection("invoices").doc(invoiceId);
  await invRef.update({ status: "rejected", rejectReason: reason, rejectedAt: Date.now() });
  const doc = await invRef.get();
  return { id: doc.id, ...doc.data() };
}
