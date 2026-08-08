import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getSiteConfig } from "@/lib/siteConfig";

// Read-only. UpgradeModal calls this before showing "Buat pembayaran" so a
// gateway the owner just switched OFF from Telegram (maintenance/gangguan)
// disables the button, without needing a redeploy.
export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const cfg = await getSiteConfig();
  return NextResponse.json({
    austinpay: cfg.paymentGateways?.austinpay !== false
  });
}
