import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";

// Pakasir doesn't provide a receipt-image endpoint like the old QRIS Zakki
// gateway did, so this returns the transaction details as JSON — the
// /struk page turns it into a downloadable canvas receipt on the client.
const ROLE_LABEL = { fullup: "Fullup", reseller: "Reseller", pt: "Partner (PT)", owner: "Owner" };
const PRODUCT_NAME = { reseller: "Upgrade ke Reseller", pt: "Upgrade ke Partner (PT)" };

export async function GET(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const invoiceId = new URL(req.url).searchParams.get("invoice_id");
  if (!invoiceId) return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });

  const invDoc = await db.collection("invoices").doc(invoiceId).get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  const inv = invDoc.data();

  if (inv.userId !== auth.session.uid && auth.user.role !== "owner") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }
  if (inv.status !== "paid") {
    return NextResponse.json({ error: "Struk hanya tersedia untuk pembayaran yang sudah sukses." }, { status: 400 });
  }

  return NextResponse.json({
    invoice_id: invoiceId,
    username: inv.username,
    fromRole: inv.fromRole,
    toRole: inv.toRole,
    fromRoleLabel: ROLE_LABEL[inv.fromRole] || inv.fromRole,
    toRoleLabel: ROLE_LABEL[inv.toRole] || inv.toRole,
    productName: PRODUCT_NAME[inv.toRole] || `Upgrade ke ${inv.toRole}`,
    quantity: 1,
    total: inv.total,
    paidAt: inv.paidAt,
    settlementTime: inv.settlementTime,
    webName: "Database Rayy X Alip ai"
  });
}
