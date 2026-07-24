import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { db } from "@/lib/firebaseAdmin";
import { createInvoice } from "@/lib/payment";
import { createDepositRiky } from "@/lib/paymentV2";
import { UPGRADE_PATHS } from "@/lib/roles";
import { findActivePendingInvoice, getInvoiceQrImage } from "@/lib/invoiceService";
import { getSiteConfig } from "@/lib/siteConfig";

const VALID_GATEWAYS = ["manual", "auto"];

export async function POST(req) {
  // Everything below is wrapped in one try/catch. Previously an
  // unexpected error anywhere in here (bad Pakasir response shape, a
  // Firestore hiccup, etc) could throw before any NextResponse was
  // returned, which left the frontend's fetch() waiting forever — the
  // "tombol dipencet, QRIS gak muncul-muncul" bug. Now we always answer
  // with JSON, even on failure, so the UI can show an error instead of
  // hanging.
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

    // Gateway pembayaran: "manual" (Pakasir QRIS + ACC manual owner lewat
    // Telegram, bisa antri) atau "auto" (RikyShop QRIS v2, full otomatis —
    // lihat lib/paymentV2.js). Default ke "manual" biar kompatibel kalau
    // ada client lama yang belum kirim field ini.
    const requestedGateway = body?.gateway;
    const gateway = VALID_GATEWAYS.includes(requestedGateway) ? requestedGateway : "manual";

    // Resume a still-open invoice instead of creating a new gateway
    // transaction — covers refresh, closed tab, or cleared cache, and also
    // covers the whole manual-review lifecycle (awaiting review / queued /
    // rejected-awaiting-banding), not just an unpaid QR. A user can only
    // have one open invoice at a time, so this takes priority over
    // whatever target/gateway was just requested.
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
          gateway: existing.gateway || "manual"
        },
        targetRole: existing.toRole,
        status: existing.status,
        queueNumber: existing.queueNumber ?? null,
        rejectReason: existing.rejectReason ?? null
      });
    }

    const orderId = `UP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Only gate NEW invoices — an invoice already in flight (handled by
    // the `existing` resume branch above) must stay payable even if the
    // owner switches this gateway off afterwards, so the user isn't left
    // stuck mid-payment.
    const cfg = await getSiteConfig();
    if (cfg.paymentGateways?.[gateway] === false) {
      const bothOff = cfg.paymentGateways?.manual === false && cfg.paymentGateways?.auto === false;
      const message = bothOff
        ? "Payment Gateway Database Kami sedang di nonaktifkan"
        : `${gateway === "auto" ? "QRIS v2 (Otomatis)" : "QRIS Manual"} lagi maintenance/nonaktif sementara. Coba metode pembayaran lain.`;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let invoiceDoc;
    let qrImageForResponse;
    if (gateway === "auto") {
      let deposit;
      try {
        deposit = await createDepositRiky(amount);
      } catch (e) {
        console.error("RikyShop createDeposit failed:", e.message);
        return NextResponse.json(
          { error: "Gagal membuat invoice pembayaran (QRIS v2). Coba lagi dalam beberapa saat." },
          { status: 502 }
        );
      }
      if (!deposit?.qr_image || !deposit?.id) {
        console.error("RikyShop createDeposit returned unexpected shape:", deposit);
        return NextResponse.json(
          { error: "QRIS v2 gagal dibuat, coba lagi dalam beberapa saat." },
          { status: 502 }
        );
      }
      invoiceDoc = {
        userId: session.uid,
        username: user.username,
        fromRole: user.role,
        toRole: targetRole,
        amount,
        total: deposit.total_payment,
        status: "pending",
        createdAt: Date.now(),
        expiredAt: deposit.expired_at,
        gateway: "auto",
        externalId: deposit.id,
        qrImage: deposit.qr_image
      };
      qrImageForResponse = deposit.qr_image;
    } else {
      // Pakasir needs an order_id we generate ourselves. We still use
      // Pakasir purely to render a QRIS the user can scan and pay manually
      // — the actual payment confirmation is not automatic on this path.
      let payment;
      try {
        payment = await createInvoice(orderId, amount);
      } catch (e) {
        console.error("Pakasir createInvoice failed:", e.message);
        return NextResponse.json(
          { error: "Gagal membuat invoice pembayaran (QRIS). Coba lagi dalam beberapa saat." },
          { status: 502 }
        );
      }
      if (!payment?.qr_image || !payment?.payment_number) {
        console.error("Pakasir createInvoice returned unexpected shape:", payment);
        return NextResponse.json(
          { error: "QRIS gagal dibuat, coba lagi dalam beberapa saat." },
          { status: 502 }
        );
      }
      invoiceDoc = {
        userId: session.uid,
        username: user.username,
        fromRole: user.role,
        toRole: targetRole,
        amount,
        total: payment.total_payment,
        status: "pending",
        createdAt: Date.now(),
        expiredAt: payment.expired_at,
        gateway: "manual",
        paymentNumber: payment.payment_number
      };
      qrImageForResponse = payment.qr_image;
    }

    await db.collection("invoices").doc(orderId).set(invoiceDoc);

    return NextResponse.json({
      success: true,
      resumed: false,
      invoice: {
        invoice_id: orderId,
        total: invoiceDoc.total,
        qris_image: qrImageForResponse,
        expired_at: invoiceDoc.expiredAt,
        gateway
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
