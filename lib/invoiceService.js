import { db } from "@/lib/firebaseAdmin";
import { alipDb } from "@/lib/alipDb";

const OPEN_STATUSES = ["pending"];

export async function findActivePendingInvoice(userId) {
  const snap = await db.collection("invoices").where("userId", "==", userId).get();
  const now = Date.now();

  const candidates = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((inv) => {
      if (!OPEN_STATUSES.includes(inv.status)) return false;
      if (inv.expiredAt) {
        const exp = new Date(inv.expiredAt).getTime();
        if (!Number.isNaN(exp) && exp <= now) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return candidates[0] || null;
}

export async function getInvoiceQrImage(inv) {
  return inv.qrImage;
}

export async function findInvoiceByExternalId(externalId) {
  if (!externalId) return null;
  const snap = await db.collection("invoices").where("externalId", "==", externalId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

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
    settlementTime: completedAt || null
  });

  return { ...inv, status: "paid" };
}
