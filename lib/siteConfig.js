import { db } from "@/lib/firebaseAdmin";

// Single config doc drives site-wide behaviour: update-detection version,
// maintenance mode, logo, running text (marquee), and the promo popup.
// Everything here is controlled from the Telegram bot (see
// app/api/telegram/webhook) so the owner never has to touch code/redeploy
// to change any of it.
const CONFIG_REF = db.collection("siteConfig").doc("main");
const NOTIF_COLLECTION = db.collection("siteNotifications");

const DEFAULT_CONFIG = {
  version: 1,
  maintenanceMode: false,
  maintenanceMessage: "Sedang maintenance. Balik lagi sebentar lagi, ya.",
  logoUrl:
    "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg",
  runningText: "",
  toolNameOverrides: {},
  // On/off switch per gateway pembayaran, dikontrol dari bot Telegram (menu
  // "💳 Metode QRIS") — dipakai buat matiin satu gateway sementara kalau
  // lagi maintenance/gangguan tanpa perlu redeploy. "manual" = Pakasir
  // (ACC manual owner), "auto" = RikyShop QRIS v2 (full otomatis).
  paymentGateways: {
    manual: true,
    auto: true
  },
  popup: {
    enabled: false,
    imageUrl: "",
    text: "",
    ctaText: "",
    ctaUrl: ""
  }
};

export async function getSiteConfig() {
  const doc = await CONFIG_REF.get();
  if (!doc.exists) {
    await CONFIG_REF.set(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  const data = doc.data();
  return {
    ...DEFAULT_CONFIG,
    ...data,
    // Dot-notation updates (see setPaymentGatewayEnabled) can leave this
    // nested map with only one key set in Firestore — merge explicitly so
    // an untouched gateway never silently disappears/defaults to off.
    paymentGateways: { ...DEFAULT_CONFIG.paymentGateways, ...(data.paymentGateways || {}) }
  };
}

// Toggle a single payment gateway on/off without touching the other one.
// Uses a dot-notation field path so Firestore updates just that key inside
// the paymentGateways map instead of replacing the whole map.
export async function setPaymentGatewayEnabled(gateway, enabled) {
  await CONFIG_REF.set({ [`paymentGateways.${gateway}`]: enabled }, { merge: true });
  return getSiteConfig();
}

// Any write that should trigger the "Update Web Terdeteksi" auto-refresh
// banner on every open tab must bump `version`.
export async function bumpVersion() {
  const current = await getSiteConfig();
  const next = (current.version || 1) + 1;
  await CONFIG_REF.set({ version: next }, { merge: true });
  return next;
}

export async function updateSiteConfig(patch, { touchVersion = false } = {}) {
  await CONFIG_REF.set(patch, { merge: true });
  if (touchVersion) return bumpVersion();
  const cfg = await getSiteConfig();
  return cfg.version;
}

export async function setToolNameOverride(toolId, newName) {
  await CONFIG_REF.set({ toolNameOverrides: { [toolId]: newName } }, { merge: true });
}

// ---------------------------------------------------------------------
// Broadcast notifications -> feed the bell icon on the dashboard.
// ---------------------------------------------------------------------
export async function pushNotification(text) {
  const doc = await NOTIF_COLLECTION.add({ text, createdAt: Date.now() });
  return doc.id;
}

export async function listNotifications(limit = 20) {
  const snap = await NOTIF_COLLECTION.orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
