import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { findActivePendingInvoice, getInvoiceQrImage } from "@/lib/invoiceService";

// Read-only. Frontend uses this on load to resume a still-unpaid QR instead
// of always starting the modal over from scratch. AustinPay settles itself
// via webhook, so nothing here calls the gateway directly.
export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const existing = await findActivePendingInvoice(auth.session.uid);
  if (!existing) return NextResponse.json({ pending: false });

  const qrisImage = await getInvoiceQrImage(existing);
  return NextResponse.json({
    pending: true,
    invoice: {
      invoice_id: existing.id,
      total: existing.total,
      qris_image: qrisImage,
      expired_at: existing.expiredAt,
      gateway: "austinpay"
    },
    targetRole: existing.toRole,
    status: existing.status
  });
}
