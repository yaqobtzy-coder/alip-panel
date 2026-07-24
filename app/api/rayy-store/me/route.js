import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getStoreUser } from "@/lib/rayyStore";

export async function GET() {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ authenticated: false });
  const user = await getStoreUser(session.uid);
  return NextResponse.json({
    authenticated: true,
    username: session.username,
    uid: session.uid,
    whatsapp: user?.whatsapp || ""
  });
}
