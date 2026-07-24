import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  const doc = await db.collection("users").doc(session.uid).get();
  if (!doc.exists) return NextResponse.json({ authenticated: false });
  const user = doc.data();

  // Refresh cookie if status or role changed (e.g. approved since last
  // check, or an admin just ACC'd a role-upgrade payment on Telegram).
  if (user.status !== session.status || user.role !== session.role) {
    await createSession({
      uid: session.uid,
      username: user.username,
      role: user.role,
      status: user.status
    });
  }

  return NextResponse.json({
    authenticated: true,
    username: user.username,
    role: user.role,
    status: user.status,
    numbersCount: (user.numbers || []).length
  });
}
