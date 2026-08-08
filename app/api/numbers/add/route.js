import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { alipDb } from "@/lib/alipDb";

export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { ref, user } = auth;

  const { number } = await req.json();
  const phone = String(number || "").replace(/[^0-9]/g, "");
  if (phone.length < 10) {
    return NextResponse.json({ error: "Nomor tidak valid." }, { status: 400 });
  }

  const currentNumbers = user.numbers || [];
  if (user.role === "fullup" && currentNumbers.length >= 3) {
    return NextResponse.json(
      { error: "Akun fullup maksimal 3 nomor. Upgrade role untuk menambah lebih banyak." },
      { status: 403 }
    );
  }
  if (currentNumbers.includes(phone)) {
    return NextResponse.json({ error: "Nomor sudah ada di akunmu." }, { status: 409 });
  }

  try {
    await alipDb.addNumber(phone);
  } catch (e) {
    if (e.response?.status === 409) {
      return NextResponse.json({ error: "Nomor sudah ada di database." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menambahkan nomor." }, { status: 502 });
  }

  await ref.update({ numbers: [...currentNumbers, phone] });
  return NextResponse.json({ success: true, numbers: [...currentNumbers, phone] });
}
