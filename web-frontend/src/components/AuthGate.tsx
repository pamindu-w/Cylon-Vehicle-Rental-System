"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

export default function AuthGate({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: string;
}) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || (requireRole && user && user.role !== requireRole)) {
      router.replace(requireRole ? "/" : "/login");
    }
  }, [loading, token, user, requireRole, router]);

  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Spinner label="Redirecting to sign in…" />;
  if (requireRole && user.role !== requireRole) return <Spinner label="Redirecting…" />;
  return <>{children}</>;
}