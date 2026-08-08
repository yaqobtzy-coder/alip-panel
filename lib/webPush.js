import webpush from "web-push";

// VAPID keys ngenalin server kita ke push service (FCM di Chrome, dll)
// biar mereka percaya notifikasi ini beneran dari kita, bukan spam.
// Generate sekali pakai `npx web-push generate-vapid-keys`, terus taro
// hasilnya di env var — JANGAN pernah commit private key ke repo.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error(
      "VAPID key belum di-set (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY di env)."
    );
  }
  webpush.setVapidDetails("mailto:admin@rayystore.local", PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

// payload contoh: { title, body, url }
export async function sendPushNotification(subscription, payload) {
  ensureConfigured();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
