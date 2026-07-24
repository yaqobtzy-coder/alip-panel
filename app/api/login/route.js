import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebaseAdmin";
import { createSession } from "@/lib/auth";
import { REJECTED_RETRY_COOLDOWN_MS } from "@/lib/timings";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
    }

    const snap = await db.collection("users").where("username", "==", username).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }
    const doc = snap.docs[0];
    const user = doc.data();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }

    if (user.status === "rejected") {
      const elapsed = Date.now() - (user.rejectedAt || 0);
      if (elapsed < REJECTED_RETRY_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((REJECTED_RETRY_COOLDOWN_MS - elapsed) / 60000);
        return NextResponse.json(
          { error: `Permintaan ditolak. Coba lagi dalam ${minutesLeft} menit.` },
          { status: 403 }
        );
      }
      // Cooldown passed — allow re-requesting approval.
      await doc.ref.update({ status: "pending" });
      user.status = "pending";
    }

    await createSession({
      uid: doc.id,
      username: user.username,
      role: user.role,
      status: user.status
    });

    return NextResponse.json({ success: true, status: user.status, role: user.role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
