import Link from "next/link";

// Layout bersama untuk halaman informasi statis Rayy Store (Tentang,
// Kontak, FAQ, Syarat & Ketentuan, Kebijakan Privasi, Bantuan, Sitemap)
// — supaya semuanya konsisten satu tema dengan sisa dashboard alip-panel,
// bukan gaya rayy-store.zip yang aslinya putih/terang.
export default function InfoPage({ icon, title, subtitle, children, backHref = "/rayy-store/dashboard" }) {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="card p-6 hover-lift">
        <h1 className="display text-xl font-bold text-white flex items-center gap-2">
          <span className="text-lg">{icon}</span> {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted mt-1 mb-5 pb-4 border-b border-line">{subtitle}</p>
        )}
        {!subtitle && <div className="mb-4" />}

        <div className="space-y-5 text-sm text-muted leading-relaxed">{children}</div>

        <Link
          href={backHref}
          className="inline-block mt-7 bg-accent text-white rounded-md px-5 py-2 text-sm font-semibold hover-lift"
        >
          ← Kembali ke Toko
        </Link>
      </div>
    </div>
  );
}

export function InfoSection({ heading, children }) {
  return (
    <div>
      {heading && (
        <h2 className="text-white font-semibold text-sm border-l-2 border-accent2 pl-3 mb-2">{heading}</h2>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}
