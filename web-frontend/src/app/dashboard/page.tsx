"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { bookingsApi, carsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Booking, CarList } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

function StatCard({
  label,
  value,
  to,
  accent,
}: {
  label: string;
  value: string | number;
  to: string;
  accent: string;
}) {
  return (
    <Link
      href={to}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </Link>
  );
}

export default function DashboardOverview() {
  const { token } = useAuth();
  const [cars, setCars] = useState<CarList[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [c, b] = await Promise.all([carsApi.mine(token), bookingsApi.mine(token)]);
      setCars(c);
      setBookings(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <p className="text-red-600">{error}</p>;

  const activeCars = cars.filter((c) => c.status === "ACTIVE").length;
  const totalViews = cars.reduce((sum, c) => sum + (c.viewCount ?? 0), 0);
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const upcoming = bookings
    .filter((b) => b.status === "CONFIRMED")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <p className="text-sm text-slate-500">Your listings and bookings at a glance.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total cars" value={cars.length} to="/dashboard/cars" accent="text-slate-900" />
        <StatCard label="Active listings" value={activeCars} to="/dashboard/cars" accent="text-emerald-600" />
        <StatCard label="Total views" value={totalViews} to="/dashboard/cars" accent="text-violet-600" />
        <StatCard label="Pending bookings" value={pending} to="/dashboard/bookings" accent="text-amber-600" />
        <StatCard label="Confirmed bookings" value={confirmed} to="/dashboard/bookings" accent="text-sky-600" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Upcoming confirmed rentals</h2>
          <Link href="/dashboard/bookings" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No confirmed rentals yet.{" "}
            <Link href="/dashboard/cars" className="font-semibold text-amber-600 hover:text-amber-700">
              Check your cars
            </Link>{" "}
            once bookings come in.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {upcoming.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    #{b.id} · {b.carMake} {b.carModel}
                  </div>
                  <div className="text-xs text-slate-500">
                    {b.guestName} · {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-700">{formatPrice(b.totalPrice)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Your cars</h2>
          <Link href="/dashboard/cars/new" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            + Add a car
          </Link>
        </div>
        {cars.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            You haven&apos;t listed any cars yet.{" "}
            <Link href="/dashboard/cars/new" className="font-semibold text-amber-600 hover:text-amber-700">
              Add your first car
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cars.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">
                  {c.make} {c.model} <span className="text-xs text-slate-400">{c.city}</span>
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm font-semibold text-violet-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {c.viewCount ?? 0}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">{formatPrice(c.dailyPrice)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}