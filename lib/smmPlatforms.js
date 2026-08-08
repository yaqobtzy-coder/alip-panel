// Daftar platform yang dikenali buat ngelompokin ratusan layanan IndoSMM
// jadi menu kayak di rahmad.shop (Facebook / Instagram / TikTok / dst).
// Dicocokin dari teks "category" (utamanya) atau "name" tiap layanan.
export const SMM_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📷", match: ["instagram", " ig ", "igtv"] },
  { key: "facebook", label: "Facebook", icon: "📘", match: ["facebook", " fb "] },
  { key: "tiktok", label: "TikTok", icon: "🎵", match: ["tiktok", " tt "] },
  { key: "youtube", label: "YouTube", icon: "▶️", match: ["youtube", " yt "] },
  { key: "twitter", label: "Twitter / X", icon: "🐦", match: ["twitter", " x ", " x)", "(x "] },
  { key: "telegram", label: "Telegram", icon: "✈️", match: ["telegram", " tele "] },
  { key: "whatsapp", label: "WhatsApp", icon: "🟢", match: ["whatsapp", " wa "] },
  { key: "spotify", label: "Spotify", icon: "🎧", match: ["spotify"] },
  { key: "threads", label: "Threads", icon: "🧵", match: ["threads"] },
  { key: "discord", label: "Discord", icon: "🎮", match: ["discord"] },
  { key: "shopee", label: "Shopee", icon: "🛒", match: ["shopee"] },
  { key: "website", label: "Website / SEO", icon: "🌐", match: ["website", "traffic", "seo", "backlink"] },
  { key: "lainnya", label: "Lainnya", icon: "✨", match: [] }
];

export function detectPlatform(service) {
  const text = ` ${String(service.category || "").toLowerCase()} ${String(service.name || "").toLowerCase()} `;
  for (const p of SMM_PLATFORMS) {
    if (p.key === "lainnya") continue;
    if (p.match.some((kw) => text.includes(kw))) return p.key;
  }
  return "lainnya";
}

export function groupByPlatform(services) {
  const groups = {};
  for (const s of services) {
    const key = detectPlatform(s);
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return groups;
}
