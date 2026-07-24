import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/rayyStoreAuth";

// Admin web Rayy Store pakai satu akun dari ENV (RAYY_ADMIN_USERNAME /
// RAYY_ADMIN_PASSWORD) — simpel & cukup buat satu owner toko. Ganti env
// var itu kalau mau ubah kredensial admin.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const validUser = process.env.RAYY_ADMIN_USERNAME || "admin";
    const validPass = process.env.RAYY_ADMIN_PASSWORD || "";

    if (!validPass) {
      return NextResponse.json(
        { error: "RAYY_ADMIN_PASSWORD belum di-set di environment." },
        { status: 500 }
      );
    }
    if (username !== validUser || password !== validPass) {
      return NextResponse.json({ error: "Username atau password admin salah." }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
