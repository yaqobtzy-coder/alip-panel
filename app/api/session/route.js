import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Ringan: hanya baca JWT cookie, tanpa hit Firestore.
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      uid: session.uid,
      username: session.username,
      role: session.role,
      status: session.status
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
