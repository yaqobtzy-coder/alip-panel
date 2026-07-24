"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TITLE = "Database Rayy X Alip ai";
const SPLASH_MS = 2450;

// Full-screen veil shown on entry: a giant "D" forms, holds, then
// shrinks away while the full logotype crossfades in over the same
// spot — reads as the "D" collapsing into the complete name. By the
// time this fades out, the real page underneath (mounted the whole
// time, just hidden behind it) has already finished settling.
function Splash() {
  return (
    <div className="splash-overlay" aria-hidden="true">
      <div className="splash-stage">
        <span className="splash-bigD">D</span>
        <span className="splash-title">{TITLE}</span>
      </div>
    </div>
  );
}

// Title assembles letter-by-letter (as if the data is loading in), then
// a single light sweep passes over it once everything has landed — a
// quiet "verified" beat. Screen readers get the full title via
// aria-label; the letter spans themselves are hidden from them.
function IntroTitle({ text }) {
  return (
    <span className="intro-title-wrap" aria-label={text}>
      <span aria-hidden="true">
        {text.split("").map((ch, i) => (
          <span
            key={i}
            className="intro-letter"
            style={{ animationDelay: `${500 + i * 26}ms` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="intro-title-shine">
        {text}
      </span>
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
        return;
      }
      if (data.status === "pending") {
        router.push("/pending");
      } else if (data.status === "approved") {
        router.push(`/dashboard/${data.role}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {showSplash && <Splash />}
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <span className="intro-logo-wrap">
              <img
                src="https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg"
                alt="Logo"
                className="w-12 h-12 rounded-md object-cover border border-line"
              />
            </span>
          </div>
          <div className="intro-badge badge text-accent2 border-accent2/30 inline-block mb-4">
            SISTEM AKSES TERKELOLA
          </div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">
            <IntroTitle text={TITLE} />
          </h1>
          <p className="intro-subtitle text-muted mt-2 text-sm">
            Masuk untuk mengelola nomor dan akses jaringanmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="intro-card card p-6 space-y-4 hover-lift">
          <div>
            <label className="text-xs text-muted mb-1 block">Username</label>
            <input
              className="field"
              placeholder="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Password</label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm border border-danger/30 bg-danger/10 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </button>

          <p className="text-center text-sm text-muted pt-2">
            Belum punya akun?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Daftar di sini
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
