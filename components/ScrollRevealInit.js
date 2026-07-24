"use client";
import { useEffect } from "react";

// Mounted once in the root layout. Any element anywhere in the app can
// opt into a scroll/mount reveal just by adding a `data-reveal`
// attribute (optionally "left" | "right" | "scale" — see globals.css)
// and, if it should stagger with siblings, an inline
// `style={{ transitionDelay: "80ms" }}`. No per-page wiring needed.
//
// A MutationObserver keeps watching after the initial scan so content
// that shows up later — search results, product grids, admin lists —
// still gets revealed instead of staying invisible.
export default function ScrollRevealInit() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const observeAll = (root) => {
      root.querySelectorAll?.("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    };

    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute?.("data-reveal")) io.observe(node);
          observeAll(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
