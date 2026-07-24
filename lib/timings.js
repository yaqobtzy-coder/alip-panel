// ---------------------------------------------------------------------
// Semua angka delay/polling/timeout di aplikasi ini dikumpulkan di satu
// tempat biar gampang di-tuning — tinggal ubah angkanya di sini, nggak
// perlu nyari-nyari ke tiap komponen. Semua dalam milidetik kecuali
// disebutkan lain (dan detik/menit ditulis biar gampang dibaca).
//
// NOTE: nilai-nilai di bawah ini udah di-set ke paling cepat yang masih
// masuk akal (sesuai request). Efeknya: lebih banyak request bolak-balik
// ke server/Firestore per user yang lagi buka web — kalau user-nya
// banyak dan kerasa berat/boros read Firestore, tinggal naikkin lagi
// angka *_POLL_MS di bawah.
// ---------------------------------------------------------------------

// components/UpdateWatcher.js — seberapa sering tab yang lagi kebuka
// ngecek /api/site-config buat lihat apakah versi berubah (dipicu dari
// menu "Notif Update Web" / "Refresh Otomatis" di bot, atau perubahan
// apa pun yang nge-bump versi: ganti logo, running text, maintenance,
// popup promo, nama tool).
export const UPDATE_CHECK_POLL_MS = 2_000; // 2 detik

// Setelah update kedetect, berapa lama hitung mundur sebelum halaman
// auto-refresh (biar user sempat baca banner-nya dulu).
export const UPDATE_RELOAD_COUNTDOWN_SECONDS = 1;

// components/AdBanner.js — setelah user nutup banner ajakan upgrade
// role, berapa lama sebelum banner itu muncul lagi otomatis.
export const AD_BANNER_REAPPEAR_MS = 5_000; // 5 detik

// components/DashboardShell.js — berapa lama toast pesan sukses/error
// (mis. "Nomor ditambahkan.") nampil sebelum ilang sendiri.
export const FLASH_MESSAGE_MS = 1_500; // 1.5 detik

// components/PromoPopup.js — popup promosi dari bot auto-hilang
// sendiri setelah sekian lama kalau nggak di-close manual.
export const PROMO_POPUP_AUTO_HIDE_MS = 3_000; // 3 detik

// components/UpgradeModal.js — saat user lagi nunggu ACC pembayaran,
// seberapa sering modal ngecek status invoice-nya ke server.
export const PAYMENT_STATUS_POLL_MS = 1_000; // 1 detik

// components/UpgradeModal.js — setelah pembayaran di-ACC admin,
// hitung mundur sebelum redirect otomatis ke halaman struk.
export const APPROVED_REDIRECT_SECONDS = 1;

// app/pending/page.js — user yang baru daftar & masih nunggu ACC admin
// di Telegram, seberapa sering halaman ngecek status approval-nya.
export const REGISTRATION_APPROVAL_POLL_MS = 1_000; // 1 detik

// components/DashboardShell.js — seberapa sering lonceng (info/update +
// transaksi) ngecek notifikasi baru dari server.
export const BELL_NOTIF_POLL_MS = 2_000; // 2 detik

// app/api/login/route.js — setelah user ditolak admin, berapa lama dia
// harus nunggu sebelum boleh coba daftar/login lagi.
//
// PENTING: ini beda sifatnya dari yang lain di atas — bukan soal
// kecepatan nampilin data, tapi rate-limit/anti-spam biar orang yang
// ditolak nggak bisa spam coba daftar berkali-kali. Sengaja TIDAK saya
// ikut percepat ke angka kecil (dibiarkan 2 jam); kalau memang mau
// diperpendek juga tinggal bilang, tapi pertimbangkan efeknya ke
// keamanan pendaftaran.
export const REJECTED_RETRY_COOLDOWN_MS = 2 * 60 * 60_000; // 2 jam
