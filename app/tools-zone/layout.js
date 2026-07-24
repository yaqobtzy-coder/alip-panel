"use client";
import { useToolsZoneAuth, ToolsZoneLoginForm } from "./gate";

export default function ToolsZoneLayout({ children }) {
  const { username, login, logout } = useToolsZoneAuth();

  if (username === undefined) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Memuat…</main>;
  }

  if (!username) {
    return <ToolsZoneLoginForm onLogin={login} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-4 max-w-3xl mx-auto">
        <span className="mono text-xs text-muted">Masuk sebagai {username}</span>
        <button className="btn-ghost text-xs py-1.5" onClick={logout}>
          Keluar
        </button>
      </div>
      {children}
    </div>
  );
}
