import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal" }, { status: 500 });
  }
}
