import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/rayyStoreAuth";

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ success: true });
}
