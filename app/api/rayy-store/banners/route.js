import { NextResponse } from "next/server";
import { listBanners, addBanner } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";
import { uploadRayyFile } from "@/lib/rayyStoreStorage";

export async function GET() {
  const banners = await listBanners();
  return NextResponse.json(banners);
}

// multipart form: image (file, wajib, rasio 16:9)
export async function POST(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const form = await req.formData();
  const image = form.get("image");
  if (!image || typeof image === "string" || image.size === 0) {
    return NextResponse.json({ error: "Gambar banner wajib diunggah." }, { status: 400 });
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  const path = `rayy-store/banners/${Date.now()}-${image.name || "banner"}`;
  const imageUrl = await uploadRayyFile(bytes, path, image.type || "image/jpeg");
  const id = await addBanner(imageUrl);
  return NextResponse.json({ success: true, id, imageUrl });
}
