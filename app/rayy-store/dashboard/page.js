"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TypewriterLoop from "@/components/rayy-store/TypewriterLoop";
import BannerCarousel from "@/components/rayy-store/BannerCarousel";
import NotificationBell from "@/components/rayy-store/NotificationBell";
import StoreFooter from "@/components/rayy-store/StoreFooter";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

export default function RayyDashboardPage() {
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/rayy-store/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/rayy-store/login");
        else setChecking(false);
      });
  }, [router]);

  useEffect(() => {
    fetch("/api/rayy-store/config").then((r) => r.json()).then(setConfig);
    fetch("/api/rayy-store/banners").then((r) => r.json()).then(setBanners);
    fetch("/api/rayy-store/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    const url = activeCategory
      ? `/api/rayy-store/products?categoryId=${activeCategory}`
      : "/api/rayy-store/products";
    fetch(url).then((r) => r.json()).then(setProducts);
  }, [activeCategory]);

  if (checking) return null;

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      {/* Header: logo + nama toko animasi + lonceng */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {config?.logoUrl && (
            <img src={config.logoUrl} alt="logo" className="w-11 h-11 rounded-xl object-cover border border-line" />
          )}
          <TypewriterLoop text={config?.storeName || "Rayy Store"} className="display text-lg font-bold text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rayy-store/vouchers" className="w-10 h-10 rounded-full card flex items-center justify-center hover-lift" title="Voucher">
            🎟️
          </Link>
          <Link href="/rayy-store/profile" className="w-10 h-10 rounded-full card flex items-center justify-center hover-lift" title="Profil">
            👤
          </Link>
          <Link href="/rayy-store/riwayat" className="w-10 h-10 rounded-full card flex items-center justify-center hover-lift" title="Riwayat transaksi">
            🧾
          </Link>
          <NotificationBell />
        </div>
      </div>

      {/* Banner 16:9 */}
      {banners.length > 0 && (
        <div className="mb-5" data-reveal="scale">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* Kategori */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" data-reveal>
          <button
            onClick={() => setActiveCategory("")}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              activeCategory === "" ? "bg-accent border-accent text-white" : "border-line text-muted"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
                activeCategory === c.id ? "bg-accent border-accent text-white" : "border-line text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid produk: 4 kolom (2 kolom di layar sangat kecil) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/rayy-store/produk/${p.id}`}
            className="card overflow-hidden hover:border-accent transition hover-lift"
          >
            <div className="aspect-square bg-panel2">
              {p.thumbnailUrl && (
                <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-2.5">
              <p className="text-sm font-medium text-white line-clamp-2">{p.name}</p>
              <p className="text-sm text-accent2 font-semibold mt-1">{formatRupiah(p.price)}</p>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-muted py-10 text-sm">Belum ada produk.</p>
        )}
      </div>

      <StoreFooter />
    </div>
  );
}
