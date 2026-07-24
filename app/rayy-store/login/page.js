"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RayyLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rayy-store/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal login.");
      router.replace("/rayy-store/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="card w-full max-w-sm p-6 hover-lift" data-reveal="scale">
        <h1 className="display text-xl font-bold text-white mb-1">Login</h1>
        <p className="text-sm text-muted mb-6">Masuk ke akun Rayy Store kamu.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-muted">Username</label>
            <input
              className="field mt-1"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted">Password</label>
            <input
              type="password"
              className="field mt-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:opacity-90 transition text-white font-semibold rounded-md py-2.5 mt-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <Link
          href="/rayy-store/register"
          className="block text-center text-sm text-accent mt-4 hover:underline"
        >
          Belum punya akun? Daftar
        </Link>
      </div>
    </div>
  );
}
