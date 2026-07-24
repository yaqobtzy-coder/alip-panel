import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { cancelTransaction } from "@/lib/payment";
import { cancelDepositRiky } from "@/lib/paymentV2";

// Every status that still counts as "open" (mirrors OPEN_STATUSES in
// lib/invoiceService.js) — a user must be able to cancel from ANY of
// these, not just "pending". Previously this only allowed "pending",
// so cancelling an invoice that was already awaiting_review / queued /
// rejected silently failed (400) and the invoice kept reappearing on
// every refresh even though the user had pressed "Batalkan transaksi".
const CANCELLABLE_STATUSES = ["pending", "awaiting_review", "queued", "rejected"];

// The ONLY way a pending invoice gets voided. Closing the modal (X),
// leaving the page, or a refresh must never reach this — only an explicit
// "Batalkan transaksi" click.
export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const { invoice_id: invoiceId } = await req.json().catch(() => ({}));
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  const inv = invDoc.data();

  if (inv.userId !== auth.session.uid) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }
  if (!CANCELLABLE_STATUSES.includes(inv.status)) {
    return NextResponse.json({ error: "Transaksi ini sudah tidak bisa dibatalkan." }, { status: 400 });
  }

  if (inv.status === "pending") {
    try {
      if (inv.gateway === "auto") {
        await cancelDepositRiky(inv.externalId);
      } else {
        await cancelTransaction(invoiceId, inv.amount);
      }
    } catch (e) {
      // Gateway may already consider it expired/gone — still proceed to
      // mark it cancelled locally so the user isn't stuck.
      console.error(`${inv.gateway === "auto" ? "RikyShop" : "Pakasir"} cancel failed:`, e.message);
    }
  }

  await invRef.update({ status: "cancelled", cancelledAt: Date.now() });
  return NextResponse.json({ success: true });
}
