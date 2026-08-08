import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { createDepositAustin } from "@/lib/austinpay";
import { UPGRADE_PATHS } from "@/lib/roles";
import { findActivePendingInvoice, getInvoiceQrImage } from "@/lib/invoiceService";
import { getSiteConfig } from "@/lib/siteConfig";

export async function POST(req) {
  // Everything below is wrapped in one try/catch so an unexpected error
  // anywhere in here always answers with JSON instead of leaving the
  // frontend's fetch() waiting forever ("tombol dipencet, QRIS gak
  // muncul-muncul" bug).
  try {
    const auth = await requireUser();
    if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
    const { session, user } = auth;

    const paths = UPGRADE_PATHS[user.role];
    if (!paths || paths.length === 0) {
      return NextResponse.json({ error: "Role kamu tidak bisa upgrade dari sini." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedTarget = body?.targetRole;
    const path = requestedTarget ? paths.find((p) => p.to === requestedTarget) : paths[0];
    if (!path) {
      return NextResponse.json({ error: "Tujuan upgrade tidak valid untuk role kamu." }, { status: 400 });
    }

    const targetRole = path.to;
    const amount = path.price;

    // Resume a still-open invoice instead of creating a new gateway
    // transaction — covers refresh, closed tab, or cleared cache. A user
    // can only have one open invoice at a time.
    const existing = await findActivePendingInvoice(session.uid);
    if (existing) {
      const qrisImage = await getInvoiceQrImage(existing);
      return NextResponse.json({
        success: true,
        resumed: true,
        invoice: {
          invoice_id: existing.id,
          total: existing.total,
          qris_image: qrisImage,
          expired_at: existing.expiredAt,
          gateway: "austinpay"
        },
        targetRole: existing.toRole,
        status: existing.status
      });
    }

    const orderId = `UP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Only gate NEW invoices — an invoice already in flight (handled by
    // the `existing` resume branch above) must stay payable even if the
    // owner switches this gateway off afterwards.
    const cfg = await getSiteConfig();
    if (cfg.paymentGateways?.austinpay === false) {
      return NextResponse.json(
        { error: "Payment Gateway Database Kami sedang di nonaktifkan" },
        { status: 400 }
      );
    }

    let deposit;
    try {
      deposit = await createDepositAustin(amount);
    } catch (e) {
      console.error("AustinPay createDeposit failed:", e.message);
      return NextResponse.json(
        { error: "Gagal membuat invoice pembayaran (QRIS v2). Coba lagi dalam beberapa saat." },
        { status: 502 }
      );
    }
    if (!deposit?.qr_image || !deposit?.transaction_id) {
      console.error("AustinPay createDeposit returned unexpected shape:", deposit);
      return NextResponse.json(
        { error: "QRIS v2 gagal dibuat, coba lagi dalam beberapa saat." },
        { status: 502 }
      );
    }

    const invoiceDoc = {
      userId: session.uid,
      username: user.username,
      fromRole: user.role,
      toRole: targetRole,
      amount,
      total: deposit.amount,
      status: "pending",
      createdAt: Date.now(),
      expiredAt: deposit.expired_at,
      gateway: "austinpay",
      externalId: deposit.transaction_id,
      qrImage: deposit.qr_image
    };

    await db.collection("invoices").doc(orderId).set(invoiceDoc);

    return NextResponse.json({
      success: true,
      resumed: false,
      invoice: {
        invoice_id: orderId,
        total: invoiceDoc.total,
        qris_image: deposit.qr_image,
        expired_at: invoiceDoc.expiredAt,
        gateway: "austinpay"
      },
      targetRole,
      status: "pending"
    });
  } catch (e) {
    console.error("create-invoice unexpected error:", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan tak terduga. Coba lagi." },
      { status: 500 }
    );
  }
}
