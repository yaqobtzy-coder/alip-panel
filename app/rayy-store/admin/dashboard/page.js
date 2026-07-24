"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TABS = ["Toko", "Banner", "Kategori", "Produk", "Voucher", "Notifikasi"];

export default function RayyAdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("Toko");

  useEffect(() => {
    fetch("/api/rayy-store/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/rayy-store/admin");
        else setChecking(false);
      });
  }, [router]);

  const logout = async () => {
    await fetch("/api/rayy-store/admin/logout", { method: "POST" });
    router.replace("/rayy-store/admin");
  };

  if (checking) return null;

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="display text-xl font-bold text-white">Admin Rayy Store</h1>
        <button onClick={logout} className="text-sm text-danger">Logout</button>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              tab === t ? "bg-accent border-accent text-white" : "border-line text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Toko" && <TokoTab />}
      {tab === "Banner" && <BannerTab />}
      {tab === "Kategori" && <KategoriTab />}
      {tab === "Produk" && <ProdukTab />}
      {tab === "Voucher" && <VoucherTab />}
      {tab === "Notifikasi" && <NotifikasiTab />}
    </div>
  );
}

// ---------------- Toko: nama & logo ----------------
function TokoTab() {
  const [config, setConfig] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/rayy-store/config").then((r) => r.json()).then((d) => {
      setConfig(d);
      setStoreName(d.storeName || "");
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const form = new FormData();
    form.append("storeName", storeName);
    if (logoFile) form.append("logo", logoFile);
    const res = await fetch("/api/rayy-store/config", { method: "PUT", body: form });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setConfig(data);
      setMsg("Tersimpan.");
    } else {
      setMsg(data.error || "Gagal menyimpan.");
    }
  };

  return (
    <form onSubmit={save} className="card p-4 space-y-3 max-w-md hover-lift">
      <div>
        <label className="text-xs text-muted">Nama Store</label>
        <input className="field mt-1" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted">Logo Store</label>
        {config?.logoUrl && <img src={config.logoUrl} alt="logo" className="w-16 h-16 rounded-lg object-cover my-2" />}
        <input type="file" accept="image/*" className="field mt-1" onChange={(e) => setLogoFile(e.target.files[0])} />
      </div>
      {msg && <p className="text-sm text-accent2">{msg}</p>}
      <button disabled={saving} className="bg-accent text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

// ---------------- Banner ----------------
function BannerTab() {
  const [banners, setBanners] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => fetch("/api/rayy-store/banners").then((r) => r.json()).then(setBanners);
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("image", file);
    await fetch("/api/rayy-store/banners", { method: "POST", body: form });
    setFile(null);
    setUploading(false);
    load();
  };

  const del = async (id) => {
    await fetch(`/api/rayy-store/banners/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={upload} className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center hover-lift">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="field flex-1" />
        <button disabled={uploading} className="bg-accent text-white rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap disabled:opacity-50">
          {uploading ? "Mengunggah..." : "Tambah Banner (16:9)"}
        </button>
      </form>
      <div className="grid grid-cols-2 gap-3">
        {banners.map((b) => (
          <div key={b.id} className="card overflow-hidden hover-lift">
            <img src={b.imageUrl} alt="" className="w-full aspect-video object-cover" />
            <button onClick={() => del(b.id)} className="w-full text-xs text-danger py-1.5">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Kategori ----------------
function KategoriTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

  const load = () => fetch("/api/rayy-store/categories").then((r) => r.json()).then(setCategories);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/rayy-store/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    load();
  };

  const del = async (id) => {
    await fetch(`/api/rayy-store/categories/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card p-4 flex gap-3 hover-lift">
        <input className="field flex-1" placeholder="Nama kategori (mis. Script Bot)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-accent text-white rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap">Tambah</button>
      </form>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="card p-3 flex items-center justify-between hover-lift">
            <span className="text-white text-sm">{c.name}</span>
            <button onClick={() => del(c.id)} className="text-xs text-danger">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Produk ----------------
function ProdukTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", type: "produk", categoryId: "", description: "" });
  const [thumbnail, setThumbnail] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/rayy-store/products").then((r) => r.json()).then(setProducts);
  useEffect(() => {
    load();
    fetch("/api/rayy-store/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !thumbnail) {
      setError("Nama, harga, dan thumbnail wajib diisi.");
      return;
    }
    if (form.type === "script" && !file) {
      setError("File .zip wajib diunggah untuk kategori Script Bot.");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("thumbnail", thumbnail);
    if (file) fd.append("file", file);

    const res = await fetch("/api/rayy-store/products", { method: "POST", body: fd });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Gagal menambah produk.");
      return;
    }
    setForm({ name: "", price: "", type: "produk", categoryId: "", description: "" });
    setThumbnail(null);
    setFile(null);
    load();
  };

  const del = async (id) => {
    await fetch(`/api/rayy-store/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card p-4 space-y-3 hover-lift">
        <p className="text-sm font-semibold text-white">Tambah Produk</p>
        <input className="field" placeholder="Nama barang *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" type="number" placeholder="Harga *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="produk">Produk biasa</option>
          <option value="script">Script Bot (butuh nomor bot + file .zip)</option>
        </select>
        <select className="field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea className="field" placeholder="Deskripsi (opsional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div>
          <label className="text-xs text-muted">Thumbnail *</label>
          <input type="file" accept="image/*" className="field mt-1" onChange={(e) => setThumbnail(e.target.files[0])} />
        </div>
        {form.type === "script" && (
          <div>
            <label className="text-xs text-muted">File .zip *</label>
            <input type="file" accept=".zip" className="field mt-1" onChange={(e) => setFile(e.target.files[0])} />
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={saving} className="bg-accent text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? "Menyimpan..." : "Tambah Produk"}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((p, i) => (
          <div key={p.id} className="card overflow-hidden hover-lift" data-reveal="scale" style={{ transitionDelay: `${Math.min(i, 11) * 50}ms` }}>
            <img src={p.thumbnailUrl} alt={p.name} className="w-full aspect-square object-cover" />
            <div className="p-2">
              <p className="text-xs text-white line-clamp-1">{p.name}</p>
              <p className="text-xs text-accent2">Rp{Number(p.price).toLocaleString("id-ID")}</p>
              <p className="text-[10px] text-muted uppercase">{p.type}</p>
              <button onClick={() => del(p.id)} className="text-xs text-danger mt-1">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Voucher ----------------
function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

function VoucherTab() {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", usageLimit: "10", expiredAt: "" });
  const [err, setErr] = useState("");

  const load = () => fetch("/api/rayy-store/vouchers").then((r) => r.json()).then(setVouchers);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/rayy-store/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Gagal membuat voucher.");
      return;
    }
    setForm({ code: "", type: "percentage", value: "", usageLimit: "10", expiredAt: "" });
    load();
  };

  const del = async (id) => {
    await fetch(`/api/rayy-store/vouchers/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card p-4 space-y-3 hover-lift">
        <input
          className="field"
          placeholder="Kode voucher (mis. RAYY10)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className="field"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="percentage">Persen (%)</option>
            <option value="fixed">Potongan tetap (Rp)</option>
          </select>
          <input
            type="number"
            className="field"
            placeholder={form.type === "percentage" ? "mis. 10" : "mis. 5000"}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            className="field"
            placeholder="Kuota pemakaian"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
          />
          <input
            type="date"
            className="field"
            value={form.expiredAt}
            onChange={(e) => setForm({ ...form, expiredAt: e.target.value })}
          />
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <button className="w-full bg-accent text-white rounded-md py-2.5 text-sm font-semibold">
          Buat Voucher
        </button>
      </form>

      <div className="space-y-2">
        {vouchers.map((v) => (
          <div key={v.id} className="card p-3 flex items-center justify-between hover-lift">
            <div>
              <p className="mono text-white text-sm font-semibold">{v.code}</p>
              <p className="text-xs text-muted">
                {v.type === "percentage" ? `${v.value}% OFF` : `${formatRupiah(v.value)} OFF`} · dipakai {v.used || 0}/{v.usageLimit}
                {v.expiredAt && ` · s.d. ${new Date(v.expiredAt).toLocaleDateString("id-ID")}`}
              </p>
            </div>
            <button onClick={() => del(v.id)} className="text-xs text-danger">Hapus</button>
          </div>
        ))}
        {vouchers.length === 0 && <p className="text-center text-muted text-sm py-6">Belum ada voucher.</p>}
      </div>
    </div>
  );
}

// ---------------- Notifikasi ----------------
function NotifikasiTab() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");

  const load = () => fetch("/api/rayy-store/notifications").then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch("/api/rayy-store/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    setText("");
    load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="card p-4 flex gap-3 hover-lift">
        <input className="field flex-1" placeholder="Teks notifikasi baru" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="bg-accent text-white rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap">Kirim</button>
      </form>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="card p-3 hover-lift">
            <p className="text-sm text-white">{n.text}</p>
            <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
