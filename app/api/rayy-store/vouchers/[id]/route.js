import { NextResponse } from "next/server";
import { deleteVoucher } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";

export async function DELETE(_req, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  await deleteVoucher(params.id);
  return NextResponse.json({ success: true });
}
