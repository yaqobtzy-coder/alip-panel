import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { session, user } = auth;

  let query;
  if (user.role === "owner") {
    query = db.collection("users");
  } else if (user.role === "pt") {
    query = db.collection("users").where("parentId", "==", session.uid);
  } else {
    return NextResponse.json({ accounts: [] }); // fullup/reseller manage only their own numbers
  }

  const snap = await query.get();
  const accounts = snap.docs
    .filter((d) => d.id !== session.uid)
    .map((d) => {
      const u = d.data();
      return {
        id: d.id,
        username: u.username,
        role: u.role,
        status: u.status,
        whatsapp: u.whatsapp,
        numbersCount: (u.numbers || []).length
      };
    });

  return NextResponse.json({ accounts });
}
