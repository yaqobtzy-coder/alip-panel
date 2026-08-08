"use client";
import { useEffect, useRef, useState } from "react";
import { PROMO_POPUP_AUTO_HIDE_MS } from "@/lib/timings";

const SEEN_KEY_PREFIX = "alip_promo_seen_";

// Shows the promo popup once per config version per browser (so it
// doesn't re-appear on every page nav), auto-dismisses after a delay,
// and can be closed early with the X.
export default function PromoPopup({ popup, version }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!popup?.enabled) return;
    const seenKey = `${SEEN_KEY_PREFIX}${version}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(seenKey)) return;

    setVisible(true);
    if (typeof window !== "undefined") sessionStorage.setItem(seenKey, "1");
    timerRef.current = setTimeout(() => setVisible(false), PROMO_POPUP_AUTO_HIDE_MS);
    return () => clearTimeout(timerRef.current);
  }, [popup?.enabled, version]);

  if (!visible || !popup?.enabled) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="card relative w-full max-w-sm p-5 hover-lift">
        <button
          aria-label="Tutup"
          onClick={() => {
            clearTimeout(timerRef.current);
            setVisible(false);
          }}
          className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none"
        >
          ✕
        </button>

        {popup.imageUrl && (
          <img src={popup.imageUrl} alt="Promo" className="w-full rounded-md mb-4 border border-line" />
        )}
        {popup.text && <p className="text-sm text-white mb-4 whitespace-pre-wrap">{popup.text}</p>}

        {popup.ctaText && popup.ctaUrl && (
          <a href={popup.ctaUrl} className="btn-primary w-full block text-center">
            {popup.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
