import { db } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { sendPushNotification } from "@/lib/webPush";

const COLLECTION = "pushSubscriptions";
const USER_COLLECTION = "userPushSubscriptions";

function subId(endpoint) {
  return crypto.createHash("sha1").update(endpoint).digest("hex");
}

export async function saveBroadcastSubscription(subscription, meta = {}) {
  if (!subscription?.endpoint) return;
  await db.collection(COLLECTION).doc(subId(subscription.endpoint)).set({
    subscription,
    userId: meta.userId || null,
    updatedAt: Date.now(),
    createdAt: Date.now()
  }, { merge: true });

  // Juga simpan per-user biar bisa push chat/CS ke orang tertentu
  if (meta.userId) {
    await db.collection(USER_COLLECTION).doc(`${meta.userId}_${subId(subscription.endpoint)}`).set({
      userId: meta.userId,
      subscription,
      updatedAt: Date.now()
    }, { merge: true });
  }
}

export async function removeBroadcastSubscription(endpoint) {
  if (!endpoint) return;
  await db.collection(COLLECTION).doc(subId(endpoint)).delete().catch(() => {});
}

export async function listBroadcastSubscriptions() {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data().subscription).filter(Boolean);
}

export async function listUserPushSubscriptions(userId) {
  if (!userId) return [];
  const snap = await db.collection(USER_COLLECTION).where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data().subscription).filter(Boolean);
}

async function safeSend(sub, payload) {
  try {
    await sendPushNotification(sub, payload);
    return true;
  } catch (err) {
    const code = err?.statusCode || err?.status;
    if (code === 404 || code === 410) {
      await removeBroadcastSubscription(sub?.endpoint).catch(() => {});
    }
    console.error("push gagal:", err.message);
    return false;
  }
}

export async function pushToAll(payload) {
  const subs = await listBroadcastSubscriptions();
  await Promise.allSettled(subs.map((s) => safeSend(s, payload)));
  return { count: subs.length };
}

export async function pushToUser(userId, payload) {
  const subs = await listUserPushSubscriptions(userId);
  if (!subs.length) {
    // fallback: global subs yang punya userId match (kalau pernah disimpan)
    const all = await db.collection(COLLECTION).where("userId", "==", userId).get();
    const extra = all.docs.map((d) => d.data().subscription).filter(Boolean);
    await Promise.allSettled(extra.map((s) => safeSend(s, payload)));
    return { count: extra.length };
  }
  await Promise.allSettled(subs.map((s) => safeSend(s, payload)));
  return { count: subs.length };
}
