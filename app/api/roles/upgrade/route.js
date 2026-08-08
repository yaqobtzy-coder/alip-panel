import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { upgradeUserToPt } from "@/lib/adminActions";

export async function POST(req) {
  const auth = await requireUser();
  if (!auth || auth.user.role !== "owner") {
    return NextResponse.json({ error: "Hanya owner yang bisa melakukan ini." }, { status: 403 });
  }

  const { username } = await req.json();
  const result = await upgradeUserToPt(username);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
