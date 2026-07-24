import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { findActivePendingInvoice, getInvoiceQrImage, syncAutoGatewayInvoice } from "@/lib/invoiceService";

// Read-only. Frontend uses this on load to resume: still-unpaid QR,
// already-submitted-and-awaiting-review, queued, or rejected (awaiting
// re-upload/banding) — instead of always starting the modal over from
// scratch.
export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  let existing = await findActivePendingInvoice(auth.session.uid);
  if (!existing) return NextResponse.json({ pending: false });

  // Gateway "auto" (RikyShop) settles itself — check the moment the user
  // opens the modal too, not just while polling, so a payment made while
  // the tab was closed shows as paid immediately instead of stuck on "qr".
  existing = await syncAutoGatewayInvoice(existing.id, existing);

  const qrisImage = await getInvoiceQrImage(existing);
  return NextResponse.json({
    pending: true,
    invoice: {
      invoice_id: existing.id,
      total: existing.total,
      qris_image: qrisImage,
      expired_at: existing.expiredAt,
      gateway: existing.gateway || "manual"
    },
    targetRole: existing.toRole,
    status: existing.status,
    queueNumber: existing.queueNumber ?? null,
    rejectReason: existing.rejectReason ?? null
  });
}
