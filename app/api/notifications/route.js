import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { listNotifications } from "@/lib/siteConfig";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const notifications = await listNotifications(20);
  return NextResponse.json({ notifications });
}
