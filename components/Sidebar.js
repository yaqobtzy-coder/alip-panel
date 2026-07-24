"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_LABEL, formatRupiah } from "@/lib/roles";

// Hamburger button (top-left) that opens a slide-out drawer. The drawer's
// first item is always the logo, followed by nav links relevant to the
// user's role, an "Upgrade role" picker when the account has upgrade
// paths available, then log out.
export default function Sidebar({ session, logoUrl, onLogout, upgradePaths = [], onUpgrade }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: `/dashboard/${session?.role}`, label: "Dashboard" },
    { href: "/dashboard/sewagc-tool", label: "Sewa Grup (Add GC)" },
    { href: "/tools-zone", label: "Tools Zone" }
  ];

  function pickUpgrade(target) {
    setOpen(false);
    onUpgrade?.(target);
  }

  return (
    <>
      <button
        aria-label="Buka menu"
        title="Menu"
        onClick={() => setOpen(true)}
        className="btn-ghost shrink-0 px-2.5 py-2.5 flex flex-col items-center justify-center gap-[3px] transition-transform active:scale-90"
      >
        <span className="block w-4 h-[2px] bg-current rounded-full" />
        <span className="block w-4 h-[2px] bg-current rounded-full" />
        <span className="block w-4 h-[2px] bg-current rounded-full" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex">
            <div className="sidebar-backdrop absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <div className="sidebar-panel relative w-64 max-w-[80%] h-full bg-panel border-r border-line p-5 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-md object-cover border border-line" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{session?.username}</p>
                  {session?.role && (
                    <p className="mono text-[11px] text-accent2">{ROLE_LABEL[session.role]}</p>
                  )}
                </div>
              </div>

              <nav className="space-y-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 rounded-sm text-sm text-white hover:bg-panel2"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {upgradePaths.length > 0 && (
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="mono text-[11px] text-muted uppercase tracking-wide px-3 mb-2">
                    Upgrade role
                  </p>
                  <div className="space-y-1.5">
                    {upgradePaths.map((p) => (
                      <button
                        key={p.to}
                        onClick={() => pickUpgrade(p)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm text-sm text-white bg-panel2 hover:bg-line"
                      >
                        <span>Naik ke {ROLE_LABEL[p.to]}</span>
                        <span className="mono text-xs text-accent2 shrink-0">{formatRupiah(p.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1" />

              <button
                onClick={() => {
                  setOpen(false);
                  onLogout ? onLogout() : router.push("/");
                }}
                className="btn-ghost text-sm mt-4"
              >
                Keluar
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
