"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { imageUrl } from "@/lib/api";
import { initialField } from "@/lib/utils";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 11l1.5-4.5a1 1 0 01.95-.7h9.1a1 1 0 01.95.7L19 11" strokeLinecap="round" />
          <path d="M3.5 11h17v5h-17z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="16.5" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="17" cy="16.5" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Lanka<span className="text-amber-600">Wheels</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
          <Link href="/" className="hover:text-amber-600">
            Home
          </Link>
          <Link href="/cars" className="hover:text-amber-600">
            Browse Cars
          </Link>
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="hover:text-amber-600">
              Admin
            </Link>
          ) : user?.role === "OWNER" ? (
            <Link href="/dashboard" className="hover:text-amber-600">
              Dashboard
            </Link>
          ) : user?.role === "CUSTOMER" ? (
            <Link href="/my-rentals" className="hover:text-amber-600">
              My rentals
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                {user.avatarUrl ? (
                  <img src={imageUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialField(user.fullName)
                )}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold leading-tight text-slate-900">{user.fullName}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{user.role}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                List your car
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}