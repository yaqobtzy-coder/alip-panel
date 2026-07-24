"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UpdateWatcher from "@/components/UpdateWatcher";
import PromoPopup from "@/components/PromoPopup";
import MaintenancePage from "@/components/MaintenancePage";

// Global chrome mounted once in the root layout: fetches site-config,
// drives the update-detect banner + promo popup everywhere, and gates
// the whole app behind a maintenance screen (except the login page, so
// the owner can still sign in, and the owner's own dashboard).
export default function AppChrome({ children }) {
  const pathname = usePathname();
  const [config, setConfig] = useState(null);
  const [role, setRole] = useState(undefined); // undefined = not checked yet

  useEffect(() => {
    fetch("/api/site-config", { cache: "no-store" })
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setRole(d.authenticated ? d.role : null))
      .catch(() => setRole(null));
  }, []);

  // Rayy Store adalah produk terpisah yang cuma numpang satu project/DB —
  // jangan kena maintenance mode, update banner, atau promo popup milik
  // alip-panel lama.
  const isRayyStore = pathname?.startsWith("/rayy-store");
  if (isRayyStore) return children;

  const isLoginRoute = pathname === "/" || pathname === "/register" || pathname === "/pending";
  const blockedByMaintenance =
    config?.maintenanceMode && !isLoginRoute && role !== "owner" && role !== undefined;

  return (
    <>
      {config && <UpdateWatcher initialVersion={config.version} />}
      {blockedByMaintenance ? (
        <MaintenancePage message={config.maintenanceMessage} logoUrl={config.logoUrl} />
      ) : (
        children
      )}
      {config && <PromoPopup popup={config.popup} version={config.version} />}
    </>
  );
}
