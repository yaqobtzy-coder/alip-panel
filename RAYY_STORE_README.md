# Rayy Store — panduan setup

Modul **Rayy Store** ditambahkan ke project `alip-panel` yang sudah ada
(satu project Next.js, satu database Firestore, satu bot Telegram — sama
persis kayak yang kamu minta). Kalau project ini kamu deploy di domain yang
sama dengan `https://rayy-x-db-alip.vercel.app`, maka Rayy Store otomatis
bisa diakses di `https://rayy-x-db-alip.vercel.app/rayy-store`.

## 1. Apa saja yang ditambahkan

- `app/rayy-store/**` — semua halaman (splash animasi, daftar, login,
  dashboard, detail produk & pembayaran, riwayat, struk, admin web).
- `app/api/rayy-store/**` — semua API (auth, config toko, banner,
  kategori, produk, order/pembayaran, notifikasi, fullup).
- `lib/rayyStore.js`, `lib/rayyStoreAuth.js`, `lib/rayyStoreStorage.js` —
  layer data & auth khusus Rayy Store.
- `lib/telegram.js` — ditambah 4 fungsi notifikasi baru khusus Rayy Store
  (kode lama alip-panel tidak diubah/dihapus).
- `components/AppChrome.js` — 1 baris ditambah supaya halaman
  `/rayy-store/*` tidak ketiban mode maintenance/promo popup punya panel
  lama.
- Tidak ada dependency npm baru — semua pakai library yang sudah ada di
  `package.json` (firebase-admin, bcryptjs, jose, axios).

## 2. Environment variables tambahan

Semua env var lama (`FIREBASE_SERVICE_ACCOUNT`, `TELEGRAM_BOT_TOKEN`,
`RIKYSHOP_API_KEY`, `ALIP_DB_API_KEY`, dst — lihat `.env.example`) dipakai
ulang apa adanya. Yang baru cuma untuk login admin web Rayy Store:

```
RAYY_ADMIN_USERNAME=admin
RAYY_ADMIN_PASSWORD=ganti-dengan-password-kuat
```

Set kedua env var itu di Vercel (Project Settings → Environment
Variables) atau di `.env.local` waktu development.

## 3. Cara kerja alur yang kamu minta

- **Splash awal** (`/rayy-store`): logo scale-in lalu nama toko animasi
  ketikan, lalu auto-redirect ke login/dashboard.
- **Daftar/Login** (`/rayy-store/register`, `/rayy-store/login`):
  username, password, nomor WhatsApp → tersimpan di koleksi Firestore
  `rayyStoreUsers` (database yang sama dengan alip-panel), dan owner
  langsung dapat notif Telegram.
- **Dashboard**: logo + nama toko animasi ketikan looping, banner 16:9
  (auto slide), kategori, grid produk 4 kolom (2 kolom di layar kecil),
  lonceng notifikasi.
- **Beli produk kategori "Script Bot"**: user isi nomor bot → nomor
  otomatis ditambahkan ke database bot lewat `alipDb.addNumber()` (fungsi
  yang sudah ada di `lib/alipDb.js`) → invoice QRIS dibuat otomatis lewat
  RikyShop (`lib/paymentV2.js`, gateway "auto", sama seperti di
  alip-panel) → halaman polling status tiap 4 detik → begitu lunas,
  muncul tombol **Unduh File**, link ke
  `https://rayy-x-db-alip.vercel.app`, dan form untuk bikin **akun
  Fullup** (masuk ke koleksi `users` yang sama dengan alip-panel, role
  `fullup`, langsung `approved`).
- **Riwayat transaksi & struk**: `/rayy-store/riwayat` daftar transaksi,
  `/rayy-store/struk/[id]` halaman struk yang bisa "Unduh/Cetak" (pakai
  print-to-PDF bawaan browser — tanpa dependency PDF tambahan).
- **Admin web** (`/rayy-store/admin`): login pakai
  `RAYY_ADMIN_USERNAME`/`RAYY_ADMIN_PASSWORD`, lalu di
  `/rayy-store/admin/dashboard` ada tab **Toko** (nama & logo), **Banner**
  (upload gambar 16:9), **Kategori**, **Produk** (nama\*, harga\*,
  thumbnail\*, dan untuk kategori Script Bot wajib upload file `.zip`),
  **Notifikasi** (broadcast teks ke lonceng semua user).

## 4. Yang perlu kamu lakukan sendiri (tidak bisa saya lakukan dari sini)

Saya membuat semua kode di lingkungan tanpa akses internet, jadi ada 3 hal
yang **wajib kamu jalankan sendiri**:

1. **`npm install`** — untuk memastikan semua dependency ke-install &
   project bisa di-build (`npm run build`). Saya tidak bisa menjalankan
   ini di sisi saya karena tidak ada akses jaringan.
2. **Isi environment variables** yang asli (Firebase service account,
   token bot Telegram, API key RikyShop, dst) — ini kredensial rahasia
   yang memang tidak boleh saya buat/tebak.
3. **Push ke GitHub** — saya juga tidak punya akses ke GitHub kamu.
   Jalankan ini dari komputer kamu, di folder project:

   ```bash
   git init
   git add .
   git commit -m "Add Rayy Store module"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```

   (Ganti `USERNAME/NAMA-REPO` dengan repo GitHub kamu. Kalau repo-nya
   sudah ada isinya dari sebelumnya, ganti `git init` dengan `git clone`
   repo itu dulu, lalu salin folder `app/rayy-store`, `app/api/rayy-store`,
   `lib/rayyStore*.js`, dan perubahan di `lib/telegram.js` &
   `components/AppChrome.js` ke dalamnya.)

4. Setelah push, hubungkan/redeploy project itu di Vercel (kalau belum
   auto-deploy dari GitHub), pastikan env var di poin 2 sudah diisi di
   Vercel juga.

## 5. Catatan teknis

- Semua upload file (logo, banner, thumbnail, file `.zip` script)
  disimpan ke Firebase Storage lewat `lib/rayyStoreStorage.js` — pastikan
  `FIREBASE_STORAGE_BUCKET` sudah aktif (Blaze plan) seperti yang
  dipakai alip-panel yang lama.
- Batas ukuran body request default Next.js API route adalah beberapa MB;
  kalau file `.zip` produk kamu besar, mungkin perlu naikkan limit lewat
  konfigurasi Vercel (Pro plan) atau pindah upload besar ke client-side
  upload langsung ke storage — beri tahu saya kalau butuh ini.
- Status pembayaran RikyShop dicek dari field `status` pada response
  `/api/deposit/status`. Saya menerima beberapa kemungkinan nilai umum
  (`paid`, `success`, `completed`, `settlement` / `expired`, `failed`,
  `cancelled`). Kalau nanti ternyata RikyShop pakai istilah status lain,
  tinggal sesuaikan array `PAID_STATUSES`/`FAILED_STATUSES` di
  `app/api/rayy-store/orders/[id]/status/route.js`.
