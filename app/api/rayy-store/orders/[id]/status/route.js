import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getOrder, updateOrder, getProduct } from "@/lib/rayyStore";
import { getDepositStatusRiky } from "@/lib/paymentV2";
import { notifyOwnerRayyPaid } from "@/lib/telegram";
import { alipDb } from "@/lib/alipDb";
import { addNumberToOwnerBot } from "@/lib/adminActions";
import { incrementVoucherUsage } from "@/lib/rayyStore";

const PAID_STATUSES = ["paid", "success", "completed", "settlement"];
const FAILED_STATUSES = ["expired", "expire", "failed", "cancelled", "canceled"];

// Pesan tetap yang dikirim/ditampilkan ke pembeli produk "script" begitu
// pembayarannya sukses. Spasi di akhir baris password itu SENGAJA — itu
// memang bagian dari password aslinya, jangan di-trim.
const SCRIPT_THANK_YOU_MESSAGE =
  "Terimakasih telah berbelanja\n" +
  "Database khusus buyer: https://rayy-x-db-alip.vercel.app\n" +
  "Pw sc: alip ai new version ";

export async function GET(_req, { params }) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });

  const order = await getOrder(params.id);
  if (!order || order.userId !== session.uid) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  if (order.status === "pending") {
    try {
      const deposit = await getDepositStatusRiky(order.depositId);
      const s = String(deposit.status || "").toLowerCase();

      if (PAID_STATUSES.includes(s)) {
        const product = await getProduct(order.productId);
        const patch = {
          status: "paid",
          paidAt: Date.now(),
          fileUrl: product?.fileUrl || null,
          fileName: product?.fileName || null
        };

        // Baru di titik INI pembayaran benar-benar sukses — nomor bot yang
        // diisi pembeli ditambahkan ke database bot & ke daftar nomor
        // akun Owner, plus pesan terima kasih disiapkan buat ditampilkan
        // di halaman struk.
        if (order.productType === "script" && order.botNumber) {
          try {
            await alipDb.addNumber(order.botNumber);
          } catch (e) {
            // 409 = nomor memang sudah ada di database bot -> bukan error fatal.
            if (e.response?.status !== 409) console.error("alipDb.addNumber gagal:", e.message);
          }
          await addNumberToOwnerBot(order.botNumber).catch((e) =>
            console.error("addNumberToOwnerBot gagal:", e.message)
          );
          patch.thankYouMessage = SCRIPT_THANK_YOU_MESSAGE;
        }

        if (order.voucherId) {
          await incrementVoucherUsage(order.voucherId).catch((e) =>
            console.error("incrementVoucherUsage gagal:", e.message)
          );
        }

        await updateOrder(order.id, patch);
        Object.assign(order, patch);
        notifyOwnerRayyPaid({
          orderId: order.id,
          username: order.username,
          productName: order.productName,
          total: order.totalPayment
        }).catch(() => {});
      } else if (FAILED_STATUSES.includes(s)) {
        await updateOrder(order.id, { status: "expired" });
        order.status = "expired";
      }
    } catch (err) {
      console.error("cek status rikyshop gagal:", err.message);
    }
  }

  return NextResponse.json(order);
}
