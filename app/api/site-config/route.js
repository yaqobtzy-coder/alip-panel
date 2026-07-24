import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/siteConfig";

// Public, read-only, polled by every open tab (see components/AppChrome.js)
// to detect deploys/config changes without needing a hard refresh, drive
// maintenance mode, the running-text ticker, and the promo popup.
//
// IMPORTANT: this handler doesn't call cookies()/headers() or read any
// request param, so Next.js's App Router treats it as a *static* route by
// default — it gets rendered once (at build time / first hit) and that
// same frozen JSON is served to everyone after that, no matter how many
// times the Telegram bot updates Firestore. That's why bot changes never
// showed up on the live site. Force it to run fresh on every request:
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const cfg = await getSiteConfig();
  return NextResponse.json(
    {
      version: cfg.version,
      maintenanceMode: cfg.maintenanceMode,
      maintenanceMessage: cfg.maintenanceMessage,
      logoUrl: cfg.logoUrl,
      runningText: cfg.runningText,
      toolNameOverrides: cfg.toolNameOverrides || {},
      popup: cfg.popup
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
