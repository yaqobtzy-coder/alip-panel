"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "toolsZoneUsername";
const LOGO_URL =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg";

export function useToolsZoneAuth() {
  const [username, setUsername] = useState(undefined); // undefined = still checking

  useEffect(() => {
    setUsername(localStorage.getItem(STORAGE_KEY) || null);
  }, []);

  function login(name) {
    localStorage.setItem(STORAGE_KEY, name);
    setUsername(name);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUsername(null);
  }

  return { username, login, logout };
}

export function ToolsZoneLoginForm({ onLogin }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onLogin(trimmed);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src={LOGO_URL}
            alt="Logo"
            className="w-12 h-12 rounded-md object-cover mx-auto mb-3 border border-line"
          />
          <h1 className="display text-2xl font-bold text-white">Tools Zone Rayy</h1>
          <p className="text-muted mt-2 text-sm">
            Masukkan username untuk masuk. Cukup sekali — nggak perlu login ulang kecuali kamu keluar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 hover-lift">
          <div>
            <label className="text-xs text-muted mb-1 block">Username</label>
            <input
              className="field"
              placeholder="username"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button className="btn-primary w-full">Masuk</button>
        </form>
      </div>
    </main>
  );
}
