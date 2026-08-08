# ALIP AI — Panel

Panel manajemen akses & nomor dengan 4 role (fullup, reseller, PT/partner, owner),
approval pendaftaran via bot Telegram, dan upgrade role berbayar via QRIS (Dongtube).

## ⚠️ Sebelum mulai — rotasi kredensial

Token bot Telegram, API key ALIP-DB, dan API key Dongtube yang pernah kamu ketik di chat
**sudah harus dianggap bocor**. Sebelum deploy:
1. Buat token bot baru lewat [@BotFather](https://t.me/BotFather) (`/revoke` lalu buat lagi, atau buat bot baru).
2. Minta API key ALIP-DB baru ke pengelola `alipai-db.clutch.web.id`.
3. Kalau bisa, minta API key Dongtube baru juga.

Jangan pernah taruh key ini di kode / commit ke Git — semua sudah dibaca lewat
`process.env.*`, isi nilainya hanya di **Environment Variables** Vercel.

## 1. Setup Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com).
2. Aktifkan **Firestore Database** (mode production).
3. Project settings → Service accounts → Generate new private key → simpan JSON-nya.
4. Masukkan seluruh isi JSON itu ke env var `FIREBASE_SERVICE_ACCOUNT`.

> **Catatan:** panel ini TIDAK memakai Firebase Storage (yang sekarang wajib paket
> berbayar Blaze). Screenshot grup role saat registrasi disimpan sebagai base64
> langsung di dokumen Firestore, jadi tetap bisa full di paket gratis (Spark).
> Konsekuensinya: foto dibatasi maksimal **700KB** (lihat validasi di
> `app/api/register/route.js` dan `app/register/page.js`) karena Firestore
> membatasi ukuran satu dokumen ke ~1MiB.

## 2. Install & jalankan lokal

```bash
npm install
cp .env.example .env.local   # lalu isi semua nilainya
npm run dev
```

## 3. Deploy ke Vercel

1. Push folder ini ke repo GitHub (private direkomendasikan).
2. Import repo di [vercel.com/new](https://vercel.com/new).
3. Di **Settings → Environment Variables**, isi semua variabel dari `.env.example`
   dengan nilai asli (yang sudah dirotasi).
4. Deploy.

## 4. Sambungkan webhook Telegram

Setelah domain Vercel aktif (misal `https://alip-panel.vercel.app`), daftarkan webhook
**sekali saja** dengan membuka URL ini di browser (ganti `<TOKEN>` dengan token bot barumu):

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://alip-panel.vercel.app/api/telegram/webhook
```

Kalau berhasil, responsnya `{"ok":true,"result":true,...}`. Sekarang setiap pendaftar baru
akan otomatis membuat bot mengirim pesan ke `TELEGRAM_OWNER_CHAT_ID` dengan tombol
**Setuju / Tolak**, dan klik tombol itu langsung memanggil `/api/telegram/webhook`
(tidak butuh proses polling yang jalan terus-menerus, cocok untuk serverless).

## Alur singkat

- **Daftar** (`/register`) → status `pending` → bot Telegram kirim permintaan ke owner.
- **Login** (`/`) sebelum di-ACC → diarahkan ke `/pending`, halaman ini polling status
  tiap 5 detik. Ditolak → harus tunggu 2 jam sebelum bisa coba lagi (otomatis, lihat
  `app/api/login/route.js`).
- **Disetujui** → masuk ke `/dashboard/<role>`.
- **fullup**: kelola nomor sendiri, maksimal 3.
- **reseller**: kelola nomor sendiri, tanpa batas.
- **pt**: kelola nomor sendiri + bisa membuat akun fullup/reseller di bawahnya.
- **owner**: semua akses di atas + bisa membuat akun apa pun + upgrade paksa
  reseller→PT + mencabut akses akun di bawahnya.
- **Upgrade role berbayar (manual review, bukan auto-detect)**: tombol "Upgrade
  sekarang" → QRIS ditampilkan (via Pakasir, cuma untuk scan/bayar, bukan untuk
  auto-konfirmasi) → user upload screenshot bukti transfer → tekan **"Saya sudah
  bayar"** → request (foto + data: username, beli apa, role awal) dikirim ke bot
  Telegram owner dengan 4 tombol:
  - **✅ ACC** — role user langsung naik (dan untuk reseller→PT disinkronkan ke
    ALIP-DB), invoice ditandai `paid`. Web user (polling tiap 3 detik) menampilkan
    popup "Pembayaran kamu di-ACC", lalu otomatis lanjut ke `/struk` dalam 10 detik.
  - **❌ Tolak** — invoice ditandai `rejected`; user melihat pesan "Harap kirim
    ulang/banding" dan tombol upload ulang bukti transfer (banding).
  - **🕒 Masukkan ke antrian** — owner reply pesan berikutnya dengan angka nomor
    antrian; tombol ini hilang permanen begitu ditekan (3 tombol lain tetap ada).
    User melihat "Kamu dimasukkan ke antrian #N oleh Owner Rayy".
  - **🔁 Ubah antrian** — sama seperti di atas tapi untuk mengoreksi nomor antrian
    yang sudah ada, bisa dipakai kapan saja.
  Tanpa upload bukti transfer, tombol "Saya sudah bayar" tidak bisa ditekan sama
  sekali — jadi tidak ada cara untuk minta ACC tanpa bukti.
- **Riwayat pembayaran**: tersedia di dashboard fullup/reseller — bisa lihat semua
  invoice (pending/berhasil) dan download struk untuk yang sudah berhasil.

## Whitelist IP untuk QRIS Zakki

Vercel Serverless Functions **tidak punya IP keluar yang tetap** — setiap request bisa
keluar dari IP berbeda-beda. Kalau admin `qris.zakki.store` mewajibkan whitelist IP,
ada 3 opsi:
1. Upgrade Vercel ke plan yang mendukung fitur **Static Outbound IP** (berbayar).
2. Pakai proxy/relay pihak ketiga dengan IP tetap sebagai perantara.
3. Tanyakan ke admin apakah bisa whitelist berdasarkan domain (`*.vercel.app`) alih-alih
   IP, karena domain lebih stabil dibanding IP di lingkungan serverless.

## Catatan / hal yang perlu kamu putuskan

- **Harga upgrade reseller→PT** belum kamu tentukan di brief awal — saya isi placeholder
  Rp150.000 di `lib/auth.js` (`UPGRADE_PRICE`), silakan ubah.
- **Sinkron fullup→reseller ke ALIP-DB**: endpoint `/resellers/add` butuh password
  plaintext, sedangkan panel ini cuma menyimpan hash-nya (demi keamanan). Jadi saat user
  bayar upgrade fullup→reseller, role di panel langsung naik, tapi sinkron ke ALIP-DB
  perlu dilakukan manual oleh owner (mis. lewat command `.createreseller` di bot).
- Kalau nanti servernya `alipai-db.clutch.web.id` sudah punya SSL, sebaiknya ganti
  `ALIP_DB_BASE_URL` ke `https://` (sekarang masih `http://`).

## Menu admin via bot Telegram (`/start`)

Ketik `/start` (atau `/menu`) ke bot untuk buka menu tombol berikut (hanya owner —
`TELEGRAM_OWNER_CHAT_ID` — yang bisa pakai):

- 🔔 **Notif Update Web** — kirim notifikasi ke lonceng semua user yang lagi login.
- 🟢 **Refresh Otomatis** — paksa semua tab yang lagi kebuka auto-refresh dalam 5
  detik (banner "Update web terdeteksi...").
- 🧾 **Buat Akun** — bikin akun Fullup/Reseller/PT langsung dari bot (pilih role →
  ketik username → ketik password).
- ⬆️ **Naikin Role** — upgrade user Fullup→Reseller atau Reseller→PT lewat username.
- 🖼️ **Ganti Logo** — kirim foto atau URL gambar, otomatis kepasang di semua halaman.
- 🛠️/✅ **Maintenance ON/OFF** — kalau ON, semua user (selain owner) melihat halaman
  maintenance; halaman login tetap bisa diakses supaya owner tetap bisa masuk.
- 📝 **Teks Berjalan** — atur teks marquee yang tampil di dashboard (ketik `-` untuk
  mematikan).
- 🏷️ **Nama Tools** — ganti nama tampilan tools di Tools Zone tanpa ubah kode.
- 🎯 **Popup Promo** — atur gambar (foto/URL), teks, tombol CTA + link tujuan (misal
  link upgrade role); popup tampil 10 detik dan bisa ditutup pakai ✕.
- 📣 **Kirim Info Terbaru** — broadcast teks bebas ke lonceng semua user.

Semua perubahan yang mempengaruhi tampilan (logo, teks berjalan, maintenance, nama
tools, popup) otomatis menaikkan "versi" web, sehingga tab yang lagi kebuka akan
menampilkan banner update dan auto-refresh dalam 5 detik.

**Catatan setup:** fitur ganti logo & popup promo (upload foto lewat bot) menyimpan
gambar ke Firebase Storage (`FIREBASE_STORAGE_BUCKET`) sebagai objek publik — pastikan
bucket tsb sudah dibuat dan Storage Rules-nya mengizinkan file yang di-upload lewat
Admin SDK menjadi publicly readable (default Admin SDK `public: true` biasanya sudah
cukup, tapi kalau bucket punya "Uniform bucket-level access" aktif, set IAM
`allUsers` = `Storage Object Viewer` di level bucket, bukan di level object).
