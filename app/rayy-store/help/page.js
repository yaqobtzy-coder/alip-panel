import Link from "next/link";
import InfoPage from "@/components/rayy-store/InfoPage";

const CATEGORIES = [
  {
    heading: "🛒 Pesanan & Pembayaran",
    links: [
      { label: "Cara membeli produk", href: "/rayy-store/faq" },
      { label: "Metode pembayaran", href: "/rayy-store/faq" },
      { label: "Cara pakai voucher", href: "/rayy-store/faq" },
      { label: "Lama proses setelah bayar", href: "/rayy-store/faq" }
    ]
  },
  {
    heading: "🎧 Bantuan Lainnya",
    links: [
      { label: "Chat Customer Service", href: "/rayy-store/cs-chat" },
      { label: "Live Chat dengan pengguna lain", href: "/rayy-store/live-chat" },
      { label: "Kontak kami", href: "/rayy-store/contact" },
      { label: "Update & maintenance", href: "/rayy-store/news" }
    ]
  }
];

export default function RayyHelpPage() {
  return (
    <InfoPage icon="🆘" title="Pusat Bantuan">
      <div className="space-y-5">
        {CATEGORIES.map((cat) => (
          <div key={cat.heading}>
            <h2 className="text-white font-semibold text-sm border-l-2 border-accent2 pl-3 mb-2">{cat.heading}</h2>
            <div className="flex flex-col gap-1.5">
              {cat.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="flex items-center gap-2 bg-panel2 rounded-md px-3 py-2.5 text-sm text-white hover:bg-panel2/70"
                >
                  <span className="text-accent2">→</span> {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </InfoPage>
  );
}
