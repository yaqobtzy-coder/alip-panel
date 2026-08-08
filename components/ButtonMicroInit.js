"use client";
import { useEffect } from "react";

// Set --x/--y pada .btn-ripple saat pointer down (untuk efek radial)
export default function ButtonMicroInit() {
  useEffect(() => {
    const onDown = (e) => {
      const el = e.target.closest?.(".btn-ripple");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--x", `${x}%`);
      el.style.setProperty("--y", `${y}%`);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
