"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RayyAdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rayy-store/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal login.");
      router.replace("/rayy-store/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm p-6 hover-lift" data-reveal="scale">
        <h1 className="display text-xl font-bold text-white mb-1">Admin Rayy Store</h1>
        <p className="text-sm text-muted mb-6">Login untuk kelola toko.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="field"
            placeholder="Username admin"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            type="password"
            className="field"
            placeholder="Password admin"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold rounded-md py-2.5 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
