import { NextResponse } from "next/server";
import { listStoreNotifications, pushStoreNotification } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";

export async function GET() {
  const notifications = await listStoreNotifications();
  return NextResponse.json(notifications);
}

export async function POST(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { text } = await req.json();
  if (!text || !String(text).trim()) {
    return NextResponse.json({ error: "Teks notifikasi wajib diisi." }, { status: 400 });
  }
  const id = await pushStoreNotification(String(text).trim());
  return NextResponse.json({ success: true, id });
}
