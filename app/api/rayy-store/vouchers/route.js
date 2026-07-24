import { NextResponse } from "next/server";
import { listVouchers, addVoucher } from "@/lib/rayyStore";
import { getAdminSession } from "@/lib/rayyStoreAuth";

export async function GET() {
  const vouchers = await listVouchers();
  return NextResponse.json(vouchers);
}

export async function POST(req) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const { code, type, value, usageLimit, expiredAt } = await req.json();
  const c = String(code || "").trim().toUpperCase();
  if (!c) return NextResponse.json({ error: "Kode voucher wajib diisi." }, { status: 400 });
  if (!["percentage", "fixed"].includes(type)) {
    return NextResponse.json({ error: "Tipe voucher tidak valid." }, { status: 400 });
  }
  const v = Number(value);
  if (!v || v <= 0) return NextResponse.json({ error: "Nilai potongan tidak valid." }, { status: 400 });
  if (type === "percentage" && v > 100) {
    return NextResponse.json({ error: "Persentase maksimal 100." }, { status: 400 });
  }

  const id = await addVoucher({
    code: c,
    type,
    value: v,
    usageLimit: Number(usageLimit) || 1,
    expiredAt: expiredAt ? new Date(expiredAt).getTime() : null
  });
  return NextResponse.json({ success: true, id });
}
