import Link from "next/link";
import InfoPage from "@/components/rayy-store/InfoPage";

// Halaman ditandai "(segera)" belum dibuat — nyusul di batch selanjutnya
// sesuai urutan yang sudah disepakati.
const GROUPS = [
  {
    heading: "🏠 Utama",
    links: [
      { label: "Beranda", href: "/rayy-store/dashboard" },
      { label: "Profil", href: "/rayy-store/profile" },
      { label: "Voucher Center", href: "/rayy-store/vouchers" },
      { label: "News & Update", href: "/rayy-store/news", soon: true }
    ]
  },
  {
    heading: "🛍️ Belanja",
    links: [
      { label: "Beli Panel Hosting", href: "/rayy-store/buy-panel", soon: true },
      { label: "Sewa Bot", href: "/rayy-store/data-sewa", soon: true },
      { label: "Beli Script", href: "/rayy-store/dashboard" }
    ]
  },
  {
    heading: "📂 Akun Saya",
    links: [
      { label: "Data Panel Saya", href: "/rayy-store/panel-data", soon: true },
      { label: "Histori Belanja", href: "/rayy-store/riwayat" },
      { label: "Sewa Aktif", href: "/rayy-store/active-sewa", soon: true }
    ]
  },
  {
    heading: "💬 Bantuan",
    links: [
      { label: "Live Chat", href: "/rayy-store/live-chat", soon: true },
      { label: "Customer Service", href: "/rayy-store/cs-chat", soon: true },
      { label: "FAQ", href: "/rayy-store/faq" },
      { label: "Pusat Bantuan", href: "/rayy-store/help" }
    ]
  },
  {
    heading: "ℹ️ Informasi",
    links: [
      { label: "Tentang Kami", href: "/rayy-store/about" },
      { label: "Kontak", href: "/rayy-store/contact" },
      { label: "Syarat & Ketentuan", href: "/rayy-store/terms" },
      { label: "Kebijakan Privasi", href: "/rayy-store/privacy-policy" }
    ]
  }
];

export default function RayySitemapPage() {
  return (
    <InfoPage icon="🗺️" title="Sitemap">
      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <h2 className="text-white font-semibold text-sm border-l-2 border-accent2 pl-3 mb-2">{g.heading}</h2>
            <div className="flex flex-col gap-1">
              {g.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="flex items-center justify-between text-sm text-muted hover:text-white px-1 py-1"
                >
                  <span>{l.label}</span>
                  {l.soon && <span className="text-[10px] text-accent2 border border-accent2/40 rounded-full px-2 py-0.5">segera</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </InfoPage>
  );
}
