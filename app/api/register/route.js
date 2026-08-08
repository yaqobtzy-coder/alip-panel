import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebaseAdmin";
import { notifyOwnerNewRegistration } from "@/lib/telegram";

// Firestore documents are capped at ~1MiB, and base64 inflates size by ~33%.
// Keep a safety margin under that.
const MAX_PHOTO_BYTES = 700 * 1024;

export async function POST(req) {
  try {
    const form = await req.formData();
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const role = String(form.get("role") || "");
    const whatsapp = String(form.get("whatsapp") || "").replace(/[^0-9]/g, "");
    const photo = form.get("photo"); // File | null

    if (!username || !password || !role || !whatsapp) {
      return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
    }
    if (!["fullup", "reseller", "pt"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }
    if (!photo || typeof photo === "string") {
      return NextResponse.json({ error: "Screenshot grup role wajib diunggah." }, { status: 400 });
    }

    const existing = await db.collection("users").where("username", "==", username).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }

    // Store screenshot as base64 directly in Firestore (no Firebase Storage /
    // Blaze plan required). Keep it small — Firestore documents cap at ~1MiB.
    const bytes = Buffer.from(await photo.arrayBuffer());
    if (bytes.length > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 700KB. Kompres dulu foto sebelum upload." },
        { status: 413 }
      );
    }
    const mime = photo.type || "image/jpeg";
    const ssPhotoUrl = `data:${mime};base64,${bytes.toString("base64")}`;

    const passwordHash = await bcrypt.hash(password, 10);

    const docRef = await db.collection("users").add({
      username,
      passwordHash,
      role,
      whatsapp,
      ssPhotoUrl,
      status: "pending", // pending | approved | rejected
      rejectedAt: null,
      numbers: [],
      parentId: null,
      createdAt: Date.now()
    });

    // Notify owner via Telegram bot with Setuju/Tolak buttons.
    // Password is shown once here for verification purposes only.
    await notifyOwnerNewRegistration({
      id: docRef.id,
      username,
      password,
      whatsapp,
      role,
      ssPhotoUrl
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mendaftar. Coba lagi." }, { status: 500 });
  }
}
