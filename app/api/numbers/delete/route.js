import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { alipDb } from "@/lib/alipDb";

export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { ref, user } = auth;

  const { number } = await req.json();
  const phone = String(number || "").replace(/[^0-9]/g, "");

  const currentNumbers = user.numbers || [];
  if (!currentNumbers.includes(phone)) {
    return NextResponse.json({ error: "Nomor ini bukan milikmu." }, { status: 403 });
  }

  try {
    await alipDb.deleteNumber(phone);
  } catch (e) {
    if (e.response?.status !== 404) {
      return NextResponse.json({ error: "Gagal menghapus nomor." }, { status: 502 });
    }
    // 404 upstream = already gone; still remove locally.
  }

  const updated = currentNumbers.filter((n) => n !== phone);
  await ref.update({ numbers: updated });
  return NextResponse.json({ success: true, numbers: updated });
}
