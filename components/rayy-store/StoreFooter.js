import Link from "next/link";

const LINKS = [
  { label: "Profil", href: "/rayy-store/profile" },
  { label: "Voucher", href: "/rayy-store/vouchers" },
  { label: "Tentang", href: "/rayy-store/about" },
  { label: "Kontak", href: "/rayy-store/contact" },
  { label: "FAQ", href: "/rayy-store/faq" },
  { label: "Bantuan", href: "/rayy-store/help" },
  { label: "Sitemap", href: "/rayy-store/sitemap" },
  { label: "Syarat & Ketentuan", href: "/rayy-store/terms" },
  { label: "Privasi", href: "/rayy-store/privacy-policy" }
];

// Footer kecil di bawah dashboard Rayy Store, nyambungin ke
// halaman-halaman info yang tadinya cuma ada di rayy-store.zip.
export default function StoreFooter() {
  return (
    <div className="mt-8 pt-4 border-t border-line flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-white">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
