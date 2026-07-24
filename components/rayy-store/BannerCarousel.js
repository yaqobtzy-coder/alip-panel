"use client";
import { useEffect, useState } from "react";

// Banner rasio 16:9, auto-geser tiap beberapa detik.
export default function BannerCarousel({ banners = [] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="w-full aspect-video rounded-md overflow-hidden card relative hover-lift">
      {banners.map((b, i) => (
        <img
          key={b.id}
          src={b.imageUrl}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-accent" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
