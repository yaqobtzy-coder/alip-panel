"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoSplash from "@/components/rayy-store/LogoSplash";

export default function RayyStoreSplash() {
  const router = useRouter();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/api/rayy-store/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ storeName: "Rayy Store", logoUrl: "" }));
  }, []);

  const handleDone = async () => {
    try {
      const res = await fetch("/api/rayy-store/me");
      const data = await res.json();
      router.replace(data.authenticated ? "/rayy-store/dashboard" : "/rayy-store/login");
    } catch {
      router.replace("/rayy-store/login");
    }
  };

  return (
    <LogoSplash
      logoUrl={config?.logoUrl}
      storeName={config?.storeName}
      onDone={handleDone}
    />
  );
}
