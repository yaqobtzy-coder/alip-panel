/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "payment.dongtube.cyou" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" }
    ]
  },
  experimental: {
    // Next.js/Vercel cuma nge-bundle file yang beneran ke-import ke satu
    // route function. Fitur "backup source code" di webhook Telegram
    // butuh SEMUA file project ada di filesystem saat runtime, jadi
    // dipaksa disertakan di sini — kalau nggak, hasil backup-nya bisa
    // gak lengkap pas di-deploy ke Vercel (walau lengkap kalau dites
    // `npm run dev` di lokal/VPS).
    outputFileTracingIncludes: {
      "app/api/telegram/webhook/route.js": [
        "./app/**/*",
        "./components/**/*",
        "./lib/**/*",
        "./public/**/*",
        "./package.json",
        "./next.config.js",
        "./tailwind.config.js",
        "./postcss.config.js",
        "./jsconfig.json",
        "./README.md",
        "./RAYY_STORE_README.md",
        "./.env.example"
      ]
    }
  }
};

module.exports = nextConfig;
