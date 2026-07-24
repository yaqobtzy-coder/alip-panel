"use client";
import { useEffect, useState } from "react";
import { AD_BANNER_REAPPEAR_MS } from "@/lib/timings";

const MESSAGE = {
  fullup: "Upgrade role kamu ke Reseller untuk bisa menambah nomor tanpa batas.",
  reseller: "Upgrade ke Partner (PT) agar kamu bisa membuat reseller sendiri.",
  pt: "Kamu sudah di level Partner — kelola jaringan reseller & fullup di bawahmu.",
  owner: null
};

export default function AdBanner({ role, onUpgradeClick }) {
  const [visible, setVisible] = useState(true);
  const message = MESSAGE[role];

  useEffect(() => {
    if (!message) return;
    const interval = setInterval(() => setVisible(true), AD_BANNER_REAPPEAR_MS);
    return () => clearInterval(interval);
  }, [message]);

  if (!message || !visible) return null;

  return (
    <div className="card p-4 mb-6 flex items-center justify-between gap-4 border-accent/30 hover-lift">
      <div className="flex items-center gap-3">
        <span className="text-xl">🚀</span>
        <p className="text-sm text-white">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(role === "fullup" || role === "reseller") && (
          <button className="btn-primary text-sm py-2" onClick={onUpgradeClick}>
            Upgrade sekarang
          </button>
        )}
        <button
          className="text-muted hover:text-white text-sm px-2"
          onClick={() => setVisible(false)}
          aria-label="Tutup"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
