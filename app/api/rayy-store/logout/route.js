import { NextResponse } from "next/server";
import { clearStoreSession } from "@/lib/rayyStoreAuth";

export async function POST() {
  clearStoreSession();
  return NextResponse.json({ success: true });
}
