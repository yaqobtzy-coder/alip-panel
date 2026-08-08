import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { cancelDepositAustin } from "@/lib/austinpay";

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
  if (inv.status !== "pending") {
    return NextResponse.json({ error: "Transaksi ini sudah tidak bisa dibatalkan." }, { status: 400 });
  }

  try {
    await cancelDepositAustin(inv.externalId);
  } catch (e) {
    // Gateway may already consider it expired/gone — still proceed to
    // mark it cancelled locally so the user isn't stuck.
    console.error("AustinPay cancel failed:", e.message);
  }

  await invRef.update({ status: "cancelled", cancelledAt: Date.now() });
  return NextResponse.json({ success: true });
}
