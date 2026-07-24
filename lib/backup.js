import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/firebaseAdmin";

// Semua koleksi Firestore yang dipakai project ini (alip-panel + Rayy
// Store, satu database yang sama). Tambah nama koleksi baru di sini kalau
// ada fitur baru yang bikin koleksi baru — kalau lupa, dia cuma gak ikut
// ke-backup (bukan error), jadi aman.
const COLLECTIONS = [
  "users",
  "invoices",
  "siteConfig",
  "siteNotifications",
  "telegramPending",
  "toolsGameSessions",
  "toolsLeaderboard",
  "rayyStoreUsers",
  "rayyStoreOrders",
  "rayyStoreProducts",
  "rayyStoreCategories",
  "rayyStoreBanners",
  "rayyStoreConfig",
  "rayyStoreNotifications"
];

// Firestore Timestamp punya method .toDate() tapi bukan Date biasa, jadi
// JSON.stringify default-nya nge-dump {_seconds,_nanoseconds} yang gak
// enak dibaca. Ubah ke ISO string dulu.
function toPlain(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = toPlain(value[k]);
    return out;
  }
  return value;
}

async function dumpCollection(name) {
  const snap = await db.collection(name).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...toPlain(doc.data()) }));
}

// Menarik semua koleksi, mem-package tiap koleksi jadi satu file JSON di
// dalam satu ZIP, dan mengembalikan Buffer siap kirim (mis. lewat
// Telegram sendDocument). Koleksi yang gagal diambil dicatat di
// _meta.json ketimbang bikin seluruh backup gagal.
export async function buildBackupZip() {
  const zip = new JSZip();
  const summary = [];

  for (const name of COLLECTIONS) {
    try {
      const docs = await dumpCollection(name);
      zip.file(`${name}.json`, JSON.stringify(docs, null, 2));
      summary.push({ collection: name, count: docs.length, ok: true });
    } catch (err) {
      summary.push({ collection: name, ok: false, error: err.message });
    }
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    collections: summary
  };
  zip.file("_meta.json", JSON.stringify(meta, null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer, meta };
}

// ---------------------------------------------------------------------
// Backup source code — zip semua file project persis kayak yang kamu
// upload/download di chat ini, langsung dari server yang lagi jalan.
// ---------------------------------------------------------------------

// Folder berat/gak perlu ikut kebawa: node_modules bisa dipasang ulang
// dari package.json, .next/.vercel isinya build hasil compile (bukan
// source), .git isinya riwayat commit (berat & gak perlu buat restore).
const EXCLUDED_DIRS = new Set(["node_modules", ".git", ".next", ".vercel", ".turbo"]);

// .env asli isinya secret (token bot, API key, dsb) — jangan pernah ikut
// kekirim lewat chat Telegram. .env.example (yang cuma placeholder) tetap
// boleh, biar strukturnya kebaca.
function isExcludedFile(name) {
  if (name === ".env") return true;
  if (name.startsWith(".env.") && name !== ".env.example") return true;
  if (name === ".DS_Store") return true;
  return false;
}

async function walkIntoZip(dir, relBase, zip) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      await walkIntoZip(path.join(dir, entry.name), relPath, zip);
    } else if (entry.isFile()) {
      if (isExcludedFile(entry.name)) continue;
      const content = await fs.readFile(path.join(dir, entry.name));
      zip.file(relPath, content);
    }
  }
}

// Menghasilkan Buffer ZIP berisi seluruh source code project (dari
// process.cwd(), yaitu root project yang lagi jalan) minus node_modules,
// .git, hasil build, dan file .env asli. Nama folder root project ikut
// dibungkus di dalam ZIP biar begitu diekstrak langsung jadi satu folder
// rapi, bukan berantakan di root.
export async function buildSourceZip() {
  const zip = new JSZip();
  const root = process.cwd();
  const rootName = path.basename(root) || "alip-panel";
  await walkIntoZip(root, rootName, zip);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buffer;
}
