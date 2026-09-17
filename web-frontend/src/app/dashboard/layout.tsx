"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { imageUrl } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import { initialField } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/cars", label: "My cars" },
  { href: "/dashboard/cars/new", label: "Add car" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <AuthGate requireRole="OWNER">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  {user?.avatarUrl ? (
                    <img src={imageUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialField(user?.fullName ?? "?")
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{user?.fullName}</div>
                  <div className="truncate text-xs text-slate-500">{user?.businessName || user?.email}</div>
                </div>
              </div>
              <nav className="mt-4 flex flex-col gap-1 text-sm font-semibold">
                {NAV.map((item) => {
                  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-3 py-2 transition ${
                        active
                          ? "bg-amber-50 text-amber-700"
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
    </AuthGate>
  );
}