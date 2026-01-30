"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize auth listener
    const cleanup = initializeAuth();
    return () => {
      cleanup.then((unsub) => unsub && unsub());
    };
  }, [initializeAuth]);

  return <>{children}</>;
}
