import { NextResponse } from "next/server";

// Database-only build: webhook pembayaran toko dinonaktifkan di domain ini.
// Jika nanti ada deposit database terpisah, hubungkan di sini.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[payment/webhook] ignored on database-only domain", body?.id || body?.external_id || "");
    return NextResponse.json({ ok: true, ignored: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, mode: "database-only" });
}
