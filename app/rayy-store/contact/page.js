import InfoPage from "@/components/rayy-store/InfoPage";

const CONTACTS = [
  { icon: "💬", label: "WhatsApp", value: "+62 857-9454-5996", href: "https://wa.me/6285794545996", cta: "Chat Sekarang →" },
  { icon: "✈️", label: "Telegram", value: "@DeltaxReal", href: "https://t.me/DeltaxReal", cta: "Chat Sekarang →" },
  { icon: "✉️", label: "Email", value: "rayystore@myruko.web.id", href: "mailto:rayystore@myruko.web.id", cta: "Kirim Email →" },
  { icon: "🎧", label: "Customer Service", value: "24/7 Online", href: "/rayy-store/cs-chat", cta: "Buka CS Chat →" }
];

const SOCIALS = [
  { icon: "🎵", href: "https://www.tiktok.com/@r_itsmyinitials", label: "TikTok" },
  { icon: "📷", href: "https://www.instagram.com/rayystore", label: "Instagram" },
  { icon: "✈️", href: "https://t.me/DeltaxReal", label: "Telegram" },
  { icon: "💬", href: "https://wa.me/6285794545996", label: "WhatsApp" }
];

export default function RayyContactPage() {
  return (
    <InfoPage icon="📇" title="Hubungi Kami">
      <div className="grid grid-cols-2 gap-3">
        {CONTACTS.map((c) => (
          <div key={c.label} className="bg-panel2 rounded-lg p-4 text-center hover-lift">
            <div className="text-2xl mb-1.5">{c.icon}</div>
            <p className="text-white text-sm font-semibold">{c.label}</p>
            <p className="text-xs text-muted mb-1.5">{c.value}</p>
            <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-xs text-accent2 font-medium">
              {c.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 pt-1">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            title={s.label}
            className="w-11 h-11 rounded-full bg-panel2 flex items-center justify-center text-lg hover-lift"
          >
            {s.icon}
          </a>
        ))}
      </div>

      <div className="border border-accent2/30 bg-accent2/10 rounded-md p-3 text-xs text-accent2 space-y-1">
        <p>🕐 Jam Operasional CS: 08:00 - 22:00 WIB (Respon cepat)</p>
        <p>✅ Live Chat &amp; CS Chat tersedia 24/7</p>
      </div>
    </InfoPage>
  );
}
