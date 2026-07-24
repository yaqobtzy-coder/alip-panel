import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebaseAdmin";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getOrder } from "@/lib/rayyStore";
import { notifyOwnerRayyFullup } from "@/lib/telegram";

// Setelah beli script & bayar lunas, user bisa langsung dibuatkan akun
// role "fullup" di koleksi `users` yang SAMA dengan alip-panel (status
// langsung "approved" — nggak perlu approve manual lagi karena sudah bayar)
// supaya bisa login ke panel/DB akses nomor.
export async function POST(req) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });

  try {
    const { username, password, orderId } = await req.json();
    const uname = String(username || "").trim();
    const pass = String(password || "");

    if (!uname || !pass) {
      return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
    }
    if (pass.length < 4) {
      return NextResponse.json({ error: "Password minimal 4 karakter." }, { status: 400 });
    }

    if (orderId) {
      const order = await getOrder(orderId);
      if (!order || order.userId !== session.uid || order.status !== "paid") {
        return NextResponse.json({ error: "Order pembelian belum lunas." }, { status: 403 });
      }
    }

    const existing = await db.collection("users").where("username", "==", uname).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Username sudah digunakan di sistem." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    await db.collection("users").add({
      username: uname,
      passwordHash,
      role: "fullup",
      whatsapp: "",
      ssPhotoUrl: null,
      status: "approved",
      rejectedAt: null,
      numbers: [],
      parentId: null,
      createdAt: Date.now(),
      source: "rayy-store"
    });

    notifyOwnerRayyFullup({ username: uname }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat akun." }, { status: 500 });
  }
}
