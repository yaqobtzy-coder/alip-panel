import bcrypt from "bcryptjs";
import { db } from "@/lib/firebaseAdmin";
import { alipDb } from "@/lib/alipDb";

// Shared by app/api/roles/create-account (web) and the Telegram bot's
// "Buat akun" menu, so both paths behave identically.
export async function createAccountAsOwner({ username, password, role, parentId }) {
  if (!username || !password || !["fullup", "reseller", "pt"].includes(role)) {
    return { error: "Data tidak valid." };
  }

  const existing = await db.collection("users").where("username", "==", username).get();
  if (!existing.empty) return { error: "Username sudah digunakan." };

  try {
    if (role === "reseller") await alipDb.addReseller(username, password);
    if (role === "pt") await alipDb.addPt(username, password);
  } catch (e) {
    if (e.response?.status === 409) return { error: "Username sudah dipakai di database utama." };
    return { error: "Gagal membuat akun di database utama." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.collection("users").add({
    username,
    passwordHash,
    role,
    whatsapp: "",
    ssPhotoUrl: null,
    status: "approved",
    rejectedAt: null,
    numbers: [],
    parentId,
    createdAt: Date.now()
  });

  return { success: true };
}

// Shared by app/api/roles/upgrade (web, reseller -> pt) and the Telegram
// bot's "Naikin role" menu.
export async function upgradeUserToPt(username) {
  if (!username) return { error: "Username wajib diisi." };

  try {
    await alipDb.upgradeResellerToPt(username);
  } catch (e) {
    if (e.response?.status === 404) return { error: "User tidak ditemukan." };
    return { error: "Gagal upgrade." };
  }

  const snap = await db.collection("users").where("username", "==", username).limit(1).get();
  if (snap.empty) return { error: "User tidak ditemukan di panel (sudah diupgrade di database utama)." };
  await snap.docs[0].ref.update({ role: "pt" });
  return { success: true };
}

// Fullup -> reseller has no ALIP-DB endpoint of its own — tracked locally.
export async function upgradeUserToReseller(username) {
  if (!username) return { error: "Username wajib diisi." };
  const snap = await db.collection("users").where("username", "==", username).limit(1).get();
  if (snap.empty) return { error: "User tidak ditemukan." };
  const user = snap.docs[0].data();
  if (user.role !== "fullup") return { error: "User ini bukan role Fullup." };
  await snap.docs[0].ref.update({ role: "reseller" });
  return { success: true };
}

export async function findOwnerUserId() {
  const snap = await db.collection("users").where("role", "==", "owner").limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

// Dipakai saat pembayaran produk tipe "script" di Rayy Store berhasil —
// nomor bot yang diisi pembeli langsung nongol di "Nomor kamu" punya akun
// Owner, persis kayak kalau Owner nambahin manual dari dashboard. Nomor
// yang sama gak akan dobel kalau kebetulan sudah ada.
export async function addNumberToOwnerBot(phone) {
  const snap = await db.collection("users").where("role", "==", "owner").limit(1).get();
  if (snap.empty) return { error: "Akun owner tidak ditemukan." };
  const ref = snap.docs[0].ref;
  const owner = snap.docs[0].data();
  const numbers = owner.numbers || [];
  if (numbers.includes(phone)) return { success: true, alreadyExists: true };
  await ref.update({ numbers: [...numbers, phone] });
  return { success: true };
}
