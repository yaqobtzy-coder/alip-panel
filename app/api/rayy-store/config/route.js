import { NextResponse } from "next/server";
import { getStoreConfig, updateStoreConfig } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";
import { uploadRayyFile } from "@/lib/rayyStoreStorage";

export async function GET() {
  const config = await getStoreConfig();
  return NextResponse.json(config);
}

// multipart form: storeName (text), logo (file, optional)
export async function PUT(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const form = await req.formData();
  const storeName = form.get("storeName");
  const logo = form.get("logo");

  const patch = {};
  if (storeName) patch.storeName = String(storeName).trim();

  if (logo && typeof logo !== "string" && logo.size > 0) {
    const bytes = Buffer.from(await logo.arrayBuffer());
    const path = `rayy-store/logo-${Date.now()}.${(logo.type || "image/png").split("/")[1] || "png"}`;
    patch.logoUrl = await uploadRayyFile(bytes, path, logo.type || "image/png");
  }

  const config = await updateStoreConfig(patch);
  return NextResponse.json(config);
}
