import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getProduct, createOrder, getVoucherByCode, applyVoucherToPrice } from "@/lib/rayyStore";
import { createDepositRiky } from "@/lib/paymentV2";
import { notifyOwnerRayyOrder } from "@/lib/telegram";

// Alur: user pilih produk -> (opsional) pakai kode voucher -> (kalau tipe
// script) isi nomor bot -> invoice QRIS dibuat via RikyShop -> nomor BARU
// ditambahkan ke database bot & dikirimi pesan terima kasih setelah
// pembayaran benar-benar sukses (lihat orders/[id]/status/route.js, yang
// juga baru menambah kuota voucher terpakai di titik itu).
export async function POST(req) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });

  try {
    const { productId, botNumber, voucherCode } = await req.json();
    const product = await getProduct(productId);
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

    let phone = null;
    if (product.type === "script") {
      phone = String(botNumber || "").replace(/[^0-9]/g, "");
      if (phone.length < 10) {
        return NextResponse.json({ error: "Nomor bot tidak valid." }, { status: 400 });
      }
    }

    // Validasi voucher ULANG di server — jangan percaya angka dari client,
    // supaya orang gak bisa oprek harga di devtools.
    let finalPrice = product.price;
    let voucher = null;
    let discount = 0;
    if (voucherCode) {
      voucher = await getVoucherByCode(String(voucherCode).trim().toUpperCase());
      if (!voucher) return NextResponse.json({ error: "Kode voucher tidak ditemukan." }, { status: 404 });
      const result = applyVoucherToPrice(voucher, product.price);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      finalPrice = result.finalPrice;
      discount = result.discount;
    }

    const deposit = await createDepositRiky(finalPrice);

    const orderId = await createOrder({
      userId: session.uid,
      username: session.username,
      productId: product.id,
      productName: product.name,
      productType: product.type,
      price: finalPrice,
      originalPrice: product.price,
      voucherId: voucher?.id || null,
      voucherCode: voucher?.code || null,
      discount,
      botNumber: phone,
      depositId: deposit.id,
      qrImage: deposit.qr_image,
      totalPayment: deposit.total_payment,
      status: "pending",
      fileUrl: null
    });

    notifyOwnerRayyOrder({
      orderId,
      username: session.username,
      productName: product.name,
      botNumber: phone,
      price: finalPrice
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId,
      qrImage: deposit.qr_image,
      totalPayment: deposit.total_payment,
      expiredAt: deposit.expired_at
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Gagal membuat invoice." }, { status: 500 });
  }
}
