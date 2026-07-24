import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername } from "@/lib/rayyStore";
import { createStoreSession } from "@/lib/rayyStoreAuth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
    }
    const user = await findUserByUsername(String(username).trim());
    if (!user) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }
    await createStoreSession({ uid: user.id, username: user.username });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
