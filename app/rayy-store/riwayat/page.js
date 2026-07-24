"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}
const STATUS_LABEL = { pending: "Menunggu Bayar", paid: "Lunas", expired: "Kedaluwarsa" };

export default function RayyRiwayatPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/rayy-store/orders")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/rayy-store/login");
          return [];
        }
        return r.json();
      })
      .then((d) => setOrders(Array.isArray(d) ? d : []));
  }, [router]);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <Link href="/rayy-store/dashboard" className="text-sm text-accent">&larr; Kembali</Link>
      <h1 className="display text-xl font-bold text-white mt-3 mb-4">Riwayat Transaksi</h1>

      <div className="space-y-2">
        {orders.map((o, i) => (
          <Link key={o.id} href={`/rayy-store/struk/${o.id}`} className="card p-3 flex items-center justify-between block hover:border-accent hover-lift" data-reveal style={{ transitionDelay: `${Math.min(i, 10) * 50}ms` }}>
            <div>
              <p className="text-sm text-white font-medium">{o.productName}</p>
              <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-accent2 font-semibold">{formatRupiah(o.price)}</p>
              <p className={`text-xs ${o.status === "paid" ? "text-accent2" : o.status === "expired" ? "text-danger" : "text-warn"}`}>
                {STATUS_LABEL[o.status] || o.status}
              </p>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-center text-muted text-sm py-10">Belum ada transaksi.</p>}
      </div>
    </div>
  );
}
