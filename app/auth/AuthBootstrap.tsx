"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/contexts/auth-context";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const startAuthListener = useAuthStore((s) => s.startAuthListener);

  useEffect(() => {
    return startAuthListener();
  }, [startAuthListener]);

  return <>{children}</>;
}
