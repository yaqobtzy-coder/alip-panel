"use client";
import { useEffect, useState } from "react";
import TypewriterLoop from "./TypewriterLoop";

// Splash awal: logo muncul (scale+fade), lalu nama store animasi ketikan,
// lalu redirect ke tujuan setelah beberapa detik.
export default function LogoSplash({ logoUrl, storeName, onDone }) {
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 100);
    const t2 = setTimeout(() => setShowText(true), 700);
    const t3 = setTimeout(() => onDone && onDone(), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink px-6">
      <div
        className={`w-24 h-24 rounded-2xl overflow-hidden border border-line shadow-2xl transition-all duration-700 ${
          showLogo ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        {logoUrl && <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />}
      </div>
      <div
        className={`mt-6 h-10 flex items-center transition-opacity duration-500 ${
          showText ? "opacity-100" : "opacity-0"
        }`}
      >
        {showText && (
          <TypewriterLoop text={storeName || "Rayy Store"} className="display text-2xl font-bold text-white" />
        )}
      </div>
    </div>
  );
}
