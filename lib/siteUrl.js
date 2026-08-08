// Satu sumber domain buat SEMUA tempat yang butuh URL lengkap web ini
// (metadata Open Graph/thumbnail preview, link database yang ditampilkan
// ke user, dll). Ganti domain cukup DI SINI SATU KALI.
//
// Lebih gampang lagi: set env var NEXT_PUBLIC_SITE_URL di Vercel (Project
// Settings > Environment Variables) ke domain barunya, redeploy, dan kode
// di bawah nggak perlu diubah sama sekali.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rayy-database.my.id";
