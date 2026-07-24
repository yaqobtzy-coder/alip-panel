import { NextResponse } from "next/server";
import { listCategories, addCategory } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
  }
  const id = await addCategory(String(name).trim());
  return NextResponse.json({ success: true, id });
}
