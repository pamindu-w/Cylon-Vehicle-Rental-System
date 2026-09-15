"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Spinner label="Redirecting to sign in…" />;
  return <>{children}</>;
}