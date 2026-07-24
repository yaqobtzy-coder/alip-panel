import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { submitPaymentProof } from "@/lib/invoiceService";

// Server-side mirror of the 700KB cap enforced in UpgradeModal.js — the
// frontend already compresses/rejects oversized photos before this is ever
// called, but this stays here as a backstop for direct API calls that skip
// the browser flow. Base64 inflates the original binary size by ~4/3, so we
// size-check the decoded byte count, not the string length.
const MAX_PROOF_BYTES = 700 * 1024;

function estimateBase64Bytes(dataUrl) {
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

// Called when the user has (manually) transferred payment, uploaded a
// screenshot as proof, and pressed "Saya sudah bayar". Nothing is
// auto-approved here — this only forwards the request + photo to the
// owner's Telegram for a manual ACC / Tolak / antrian decision. Without a
// proof photo, submission is rejected outright.
export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { session } = auth;

  const { invoice_id: invoiceId, photo } = await req.json().catch(() => ({}));
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id wajib diisi." }, { status: 400 });
  }
  if (!photo || typeof photo !== "string" || !photo.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Bukti transfer wajib diupload sebelum menekan tombol \"Saya sudah bayar\"." },
      { status: 400 }
    );
  }
  if (estimateBase64Bytes(photo) > MAX_PROOF_BYTES) {
    return NextResponse.json(
      { error: "Ukuran foto bukti transfer wajib 700KB atau lebih kecil. Upload ulang foto yang lebih kecil." },
      { status: 400 }
    );
  }

  const invRef = db.collection("invoices").doc(invoiceId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  const inv = invDoc.data();

  if (inv.userId !== session.uid) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }
  if (inv.status === "paid") {
    return NextResponse.json({ error: "Invoice ini sudah dibayar." }, { status: 400 });
  }
  if (inv.gateway === "auto") {
    return NextResponse.json(
      { error: "Gateway QRIS v2 ini otomatis — tidak perlu upload bukti, tunggu pembayaran terdeteksi sendiri." },
      { status: 400 }
    );
  }
  if (inv.status === "queued") {
    return NextResponse.json(
      { error: "Kamu sudah masuk antrian, tunggu admin memprosesnya." },
      { status: 400 }
    );
  }
  if (inv.status === "awaiting_review") {
    return NextResponse.json(
      { error: "Buktimu sedang direview admin, tunggu keputusannya." },
      { status: 400 }
    );
  }

  const updated = await submitPaymentProof(invoiceId, photo);
  if (!updated) return NextResponse.json({ error: "Gagal mengirim bukti pembayaran." }, { status: 500 });

  return NextResponse.json({ success: true, status: "awaiting_review" });
}
