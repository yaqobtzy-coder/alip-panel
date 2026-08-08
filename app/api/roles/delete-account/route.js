import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";

export async function POST(req) {
  const auth = await requireUser();
  if (!auth || auth.user.role !== "owner") {
    return NextResponse.json({ error: "Hanya owner yang bisa melakukan ini." }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId wajib diisi." }, { status: 400 });

  const ref = db.collection("users").doc(userId);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  if (doc.data().role === "owner") {
    return NextResponse.json({ error: "Tidak bisa menghapus akun owner." }, { status: 400 });
  }

  await ref.update({ status: "revoked" });
  return NextResponse.json({ success: true });
}
