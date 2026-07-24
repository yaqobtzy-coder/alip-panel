import { NextResponse } from "next/server";
import { listProducts, addProduct, listCategories } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";
import { uploadRayyFile } from "@/lib/rayyStoreStorage";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") || undefined;
  const products = await listProducts({ categoryId });
  return NextResponse.json(products);
}

// multipart form: name*, price*, type* (script|produk), categoryId,
// description, thumbnail* (file), file (zip — WAJIB kalau type=script)
export async function POST(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const price = Number(form.get("price") || 0);
  const type = String(form.get("type") || "produk");
  const categoryId = String(form.get("categoryId") || "");
  const description = String(form.get("description") || "");
  const thumbnail = form.get("thumbnail");
  const file = form.get("file");

  if (!name) return NextResponse.json({ error: "Nama barang wajib diisi." }, { status: 400 });
  if (!price || price <= 0) return NextResponse.json({ error: "Harga barang wajib diisi." }, { status: 400 });
  if (!thumbnail || typeof thumbnail === "string" || thumbnail.size === 0) {
    return NextResponse.json({ error: "Thumbnail produk wajib diunggah." }, { status: 400 });
  }
  if (type === "script") {
    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "File .zip wajib diunggah untuk kategori Script Bot." }, { status: 400 });
    }
    if (!/\.zip$/i.test(file.name || "")) {
      return NextResponse.json({ error: "File produk script harus berformat .zip." }, { status: 400 });
    }
  }

  const thumbBytes = Buffer.from(await thumbnail.arrayBuffer());
  const thumbPath = `rayy-store/products/thumb-${Date.now()}-${thumbnail.name || "thumb"}`;
  const thumbnailUrl = await uploadRayyFile(thumbBytes, thumbPath, thumbnail.type || "image/jpeg");

  let fileUrl = null;
  let fileName = null;
  if (type === "script" && file && typeof file !== "string") {
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const filePath = `rayy-store/products/files/${Date.now()}-${file.name}`;
    fileUrl = await uploadRayyFile(fileBytes, filePath, "application/zip");
    fileName = file.name;
  }

  let categoryName = "";
  if (categoryId) {
    const cats = await listCategories();
    categoryName = cats.find((c) => c.id === categoryId)?.name || "";
  }

  const id = await addProduct({
    name,
    price,
    type,
    categoryId: categoryId || null,
    categoryName,
    description,
    thumbnailUrl,
    fileUrl,
    fileName
  });

  return NextResponse.json({ success: true, id });
}
