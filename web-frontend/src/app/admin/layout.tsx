"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { initialField } from "@/lib/utils";
import { Spinner } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/cars", label: "Cars" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Spinner label="Redirecting to sign in…" />;
  if (user.role !== "ADMIN") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                {initialField(user?.fullName ?? "?")}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">{user?.fullName}</div>
                <div className="truncate text-xs text-slate-500">{user?.businessName || user?.email}</div>
              </div>
            </div>
            <nav className="mt-4 flex flex-col gap-1 text-sm font-semibold">
              {NAV.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="mt-2 rounded-lg px-3 py-2 text-left text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                Sign out
              </button>
            </nav>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}