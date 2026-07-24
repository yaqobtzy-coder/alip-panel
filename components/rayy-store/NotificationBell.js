"use client";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/rayy-store/notifications")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full card flex items-center justify-center relative hover-lift"
        aria-label="Notifikasi"
      >
        🔔
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 card p-3 z-20 max-h-80 overflow-y-auto hover-lift">
          <p className="text-sm font-semibold mb-2 text-white">Notifikasi</p>
          {items.length === 0 && <p className="text-sm text-muted">Belum ada notifikasi.</p>}
          <div className="space-y-2">
            {items.map((n) => (
              <div key={n.id} className="text-sm border-b border-line pb-2 last:border-0">
                <p className="text-white">{n.text}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(n.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
