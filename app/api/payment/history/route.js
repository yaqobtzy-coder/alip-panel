import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const snap = await db
    .collection("invoices")
    .where("userId", "==", auth.session.uid)
    .get();

  const invoices = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ invoices });
}
