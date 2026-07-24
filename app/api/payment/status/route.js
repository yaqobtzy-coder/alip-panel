import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { syncAutoGatewayInvoice } from "@/lib/invoiceService";

// Polled by the frontend every few seconds while a payment is in flight.
// Gateway "manual" (Pakasir) approval stays manual-only (owner taps
// ACC/Tolak/antrian in Telegram) — for that one this just reflects whatever
// the invoice doc already says. Gateway "auto" (RikyShop) is different: we
// actively ask the gateway for the deposit's real status here so it can
// flip pending -> paid on its own, no admin action needed.
export async function GET(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const invoiceId = new URL(req.url).searchParams.get("invoice_id");
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const invDoc = await db.collection("invoices").doc(invoiceId).get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  let inv = invDoc.data();

  if (inv.userId !== auth.session.uid) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  inv = await syncAutoGatewayInvoice(invoiceId, inv);

  return NextResponse.json({
    status: inv.status,
    toRole: inv.toRole,
    queueNumber: inv.queueNumber ?? null,
    rejectReason: inv.rejectReason ?? null
  });
}
