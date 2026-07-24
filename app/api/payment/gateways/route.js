import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getSiteConfig } from "@/lib/siteConfig";

// Read-only. UpgradeModal calls this before showing the gateway picker so
// a gateway the owner just switched OFF from Telegram (maintenance/
// gangguan) doesn't show up as pickable, without needing a redeploy.
export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const cfg = await getSiteConfig();
  return NextResponse.json({
    manual: cfg.paymentGateways?.manual !== false,
    auto: cfg.paymentGateways?.auto !== false
  });
}
