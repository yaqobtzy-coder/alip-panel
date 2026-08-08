import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Database-only: simpan subscription push untuk user database yang login.
export async function POST(req) {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    // Subscription disimpan di sisi client / koleksi push terpisah bila ada.
    // Endpoint tetap ada agar SW tidak error.
    return NextResponse.json({ ok: true, user: session.username || null });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal" }, { status: 500 });
  }
}
