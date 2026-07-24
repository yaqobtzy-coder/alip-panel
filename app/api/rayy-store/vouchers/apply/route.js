import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getProduct, getVoucherByCode, applyVoucherToPrice } from "@/lib/rayyStore";

// Preview potongan harga voucher di halaman produk, SEBELUM checkout.
// Validasi ulang (jangan percaya harga dari client) juga dilakukan lagi
// di app/api/rayy-store/orders/create ketika order beneran dibuat.
export async function POST(req) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });

  const { code, productId } = await req.json();
  const product = await getProduct(productId);
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  const voucher = await getVoucherByCode(String(code || "").trim().toUpperCase());
  if (!voucher) return NextResponse.json({ error: "Kode voucher tidak ditemukan." }, { status: 404 });

  const result = applyVoucherToPrice(voucher, product.price);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    success: true,
    code: voucher.code,
    discount: result.discount,
    finalPrice: result.finalPrice
  });
}
