import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// ---------------------------------------------------------------------
// Rayy Store — data layer. Semua koleksi diprefix "rayyStore*" supaya
// aman hidup berdampingan di Firestore project yang sama dengan
// alip-panel (satu database, dua produk).
// ---------------------------------------------------------------------

const CONFIG_REF = db.collection("rayyStoreConfig").doc("main");
const BANNERS = db.collection("rayyStoreBanners");
const CATEGORIES = db.collection("rayyStoreCategories");
const PRODUCTS = db.collection("rayyStoreProducts");
const USERS = db.collection("rayyStoreUsers");
const ORDERS = db.collection("rayyStoreOrders");
const NOTIFS = db.collection("rayyStoreNotifications");
const VOUCHERS = db.collection("rayyStoreVouchers");

const DEFAULT_CONFIG = {
  storeName: "Rayy Store",
  logoUrl:
    "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg",
  updatedAt: Date.now()
};

// ---------------- Config (nama & logo store) ----------------
export async function getStoreConfig() {
  const doc = await CONFIG_REF.get();
  if (!doc.exists) {
    await CONFIG_REF.set(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  return { ...DEFAULT_CONFIG, ...doc.data() };
}

export async function updateStoreConfig(patch) {
  await CONFIG_REF.set({ ...patch, updatedAt: Date.now() }, { merge: true });
  return getStoreConfig();
}

// ---------------- Banner 16:9 ----------------
export async function listBanners() {
  const snap = await BANNERS.orderBy("order", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function addBanner(imageUrl) {
  const snap = await BANNERS.get();
  const doc = await BANNERS.add({ imageUrl, order: snap.size, createdAt: Date.now() });
  return doc.id;
}
export async function deleteBanner(id) {
  await BANNERS.doc(id).delete();
}

// ---------------- Kategori ----------------
export async function listCategories() {
  const snap = await CATEGORIES.orderBy("order", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function addCategory(name) {
  const snap = await CATEGORIES.get();
  const doc = await CATEGORIES.add({ name, order: snap.size, createdAt: Date.now() });
  return doc.id;
}
export async function updateCategory(id, name) {
  await CATEGORIES.doc(id).update({ name });
}
export async function deleteCategory(id) {
  await CATEGORIES.doc(id).delete();
}

// ---------------- Produk ----------------
// type: "script" (wajib file zip, alur beli pakai nomor bot) | "produk" (biasa)
export async function listProducts({ categoryId } = {}) {
  let q = PRODUCTS.orderBy("createdAt", "desc");
  const snap = await q.get();
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (categoryId) items = items.filter((p) => p.categoryId === categoryId);
  return items;
}
export async function getProduct(id) {
  const doc = await PRODUCTS.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}
export async function addProduct(data) {
  const doc = await PRODUCTS.add({ ...data, createdAt: Date.now() });
  return doc.id;
}
export async function updateProduct(id, patch) {
  await PRODUCTS.doc(id).update(patch);
}
export async function deleteProduct(id) {
  await PRODUCTS.doc(id).delete();
}

// ---------------- User toko (customer) ----------------
export async function findUserByUsername(username) {
  const snap = await USERS.where("username", "==", username).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
export async function createStoreUser({ username, passwordHash, whatsapp }) {
  const doc = await USERS.add({ username, passwordHash, whatsapp, createdAt: Date.now() });
  return doc.id;
}
export async function getStoreUser(uid) {
  const doc = await USERS.doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}
export async function updateStoreUser(uid, patch) {
  await USERS.doc(uid).update(patch);
}

// ---------------- Voucher ----------------
// type: "percentage" (value = 0-100) | "fixed" (value = potongan rupiah)
export async function listVouchers() {
  const snap = await VOUCHERS.orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function addVoucher(data) {
  const doc = await VOUCHERS.add({ used: 0, ...data, createdAt: Date.now() });
  return doc.id;
}
export async function deleteVoucher(id) {
  await VOUCHERS.doc(id).delete();
}
export async function getVoucherByCode(code) {
  const snap = await VOUCHERS.where("code", "==", code).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
export async function incrementVoucherUsage(id) {
  await VOUCHERS.doc(id).update({ used: FieldValue.increment(1) });
}

// Menghitung harga akhir setelah voucher, dan validasi (kadaluarsa /
// kuota habis) — dipakai bareng oleh halaman produk (preview) dan API
// pembuatan order (validasi ulang di server, jangan percaya harga dari
// client).
export function applyVoucherToPrice(voucher, price) {
  if (!voucher) return { finalPrice: price, discount: 0 };
  const now = Date.now();
  if (voucher.expiredAt && now > voucher.expiredAt) {
    return { error: "Voucher sudah kedaluwarsa." };
  }
  if ((voucher.used || 0) >= (voucher.usageLimit || 0)) {
    return { error: "Kuota voucher sudah habis." };
  }
  const discount =
    voucher.type === "percentage"
      ? Math.round((price * voucher.value) / 100)
      : Math.min(voucher.value, price);
  const finalPrice = Math.max(price - discount, 0);
  return { finalPrice, discount };
}

// ---------------- Order / transaksi ----------------
export async function createOrder(data) {
  const doc = await ORDERS.add({ ...data, createdAt: Date.now() });
  return doc.id;
}
export async function getOrder(id) {
  const doc = await ORDERS.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}
export async function updateOrder(id, patch) {
  await ORDERS.doc(id).update(patch);
}
export async function listOrdersByUser(uid) {
  // Sort di JS (bukan .orderBy() di Firestore) supaya nggak butuh bikin
  // composite index manual di Firestore console untuk where+orderBy.
  const snap = await ORDERS.where("userId", "==", uid).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// ---------------- Notifikasi (lonceng) ----------------
export async function listStoreNotifications(limit = 20) {
  const snap = await NOTIFS.orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function pushStoreNotification(text) {
  const doc = await NOTIFS.add({ text, createdAt: Date.now() });
  return doc.id;
}
