import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { getDepositStatusAustin } from "@/lib/austinpay";
import { markInvoicePaid } from "@/lib/invoiceService";

// Polled by the frontend every few seconds while a payment is in flight.
// Sebelumnya webhook-only (cuma baca ulang invoice dari DB). Sekarang juga
// aktif cek ke gateway langsung (GET /api/v2/deposit/check/{transaction_id})
// kalau masih pending, jadi status tetap ke-update walau webhook AustinPay
// nggak nyampe/gagal diverifikasi — webhook tetap jalan sebagai fast-path.
export async function GET(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const invoiceId = new URL(req.url).searchParams.get("invoice_id");
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  let inv = invDoc.data();

  if (inv.userId !== auth.session.uid) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  if (inv.status === "pending" && inv.externalId) {
    try {
      const deposit = await getDepositStatusAustin(inv.externalId);
      const s = String(deposit?.status || "").toLowerCase();
      if (["paid", "success", "completed", "settlement"].includes(s)) {
        const updated = await markInvoicePaid(invoiceId, Date.now());
        if (updated) inv = updated;
      } else if (["expired", "expire", "failed", "cancelled", "canceled", "cancel"].includes(s)) {
        await invRef.update({ status: "expired" });
        inv = { ...inv, status: "expired" };
      }
    } catch (err) {
      console.error("cek status austinpay gagal:", err.message);
    }
  }

  return NextResponse.json({
    status: inv.status,
    toRole: inv.toRole
  });
}
