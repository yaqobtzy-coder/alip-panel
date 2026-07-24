import { NextResponse } from "next/server";

// NOTE: payment approval is no longer automatic. Even if Pakasir detects a
// completed QRIS payment, the invoice only moves to "paid" (and the role
// upgrade only happens) once the owner taps ✅ ACC on the proof-of-transfer
// photo in Telegram — see /api/payment/confirm and /api/telegram/webhook.
// This endpoint is kept only so an existing Pakasir "Webhook URL" setting
// doesn't start failing; it intentionally does nothing with the payload.
export async function POST(req) {
  await req.json().catch(() => null);
  return NextResponse.json({ received: true });
}
