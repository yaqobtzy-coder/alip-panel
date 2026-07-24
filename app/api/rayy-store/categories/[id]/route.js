import { NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";

export async function PUT(req, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
  }
  await updateCategory(params.id, String(name).trim());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  await deleteCategory(params.id);
  return NextResponse.json({ success: true });
}
