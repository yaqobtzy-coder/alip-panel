import { NextResponse } from "next/server";
import { getProduct, updateProduct, deleteProduct } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";
import { uploadRayyFile } from "@/lib/rayyStoreStorage";

export async function GET(_req, { params }) {
  const product = await getProduct(params.id);
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  return NextResponse.json(product);
}

// multipart form, semua field opsional kecuali yang diubah
export async function PUT(req, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const form = await req.formData();
  const patch = {};
  const name = form.get("name");
  const price = form.get("price");
  const description = form.get("description");
  const thumbnail = form.get("thumbnail");
  const file = form.get("file");

  if (name) patch.name = String(name).trim();
  if (price) patch.price = Number(price);
  if (description !== null) patch.description = String(description);

  if (thumbnail && typeof thumbnail !== "string" && thumbnail.size > 0) {
    const bytes = Buffer.from(await thumbnail.arrayBuffer());
    const path = `rayy-store/products/thumb-${Date.now()}-${thumbnail.name || "thumb"}`;
    patch.thumbnailUrl = await uploadRayyFile(bytes, path, thumbnail.type || "image/jpeg");
  }
  if (file && typeof file !== "string" && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const path = `rayy-store/products/files/${Date.now()}-${file.name}`;
    patch.fileUrl = await uploadRayyFile(bytes, path, "application/zip");
    patch.fileName = file.name;
  }

  await updateProduct(params.id, patch);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  await deleteProduct(params.id);
  return NextResponse.json({ success: true });
}
