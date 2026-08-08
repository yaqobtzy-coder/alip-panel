"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UpdateWatcher from "@/components/UpdateWatcher";
import PromoPopup from "@/components/PromoPopup";
import MaintenancePage from "@/components/MaintenancePage";

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const [config, setConfig] = useState(null);
  const [role, setRole] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    // Satu request config; cache browser sebentar
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setConfig(d);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Role cuma perlu untuk maintenance gate — skip di login routes
    if (pathname === "/" || pathname === "/register" || pathname === "/pending") {
      setRole(null);
      return;
    }
    let cancelled = false;
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRole(d.authenticated ? d.role : null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
