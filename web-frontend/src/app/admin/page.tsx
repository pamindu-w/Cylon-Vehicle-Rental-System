"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AdminStats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Alert, Spinner } from "@/components/ui";

function Stat({ label, value, accent = "text-slate-900" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </div>
  );
}

export default function AdminOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setStats(await adminApi.stats(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading platform stats…" />;
  if (error) return <Alert kind="error">{error}</Alert>;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Platform overview</h1>
      <p className="text-sm text-slate-500">Everything across the marketplace at a glance.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered users" value={stats.totalUsers} />
        <Stat label="Owners / agencies" value={stats.totalOwners} accent="text-indigo-600" />
        <Stat label="Total cars" value={stats.totalCars} />
        <Stat label="Active listings" value={stats.activeCars} accent="text-emerald-600" />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Bookings</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total bookings" value={stats.totalBookings} />
          <Stat label="Pending" value={stats.pendingBookings} accent="text-amber-600" />
          <Stat label="Confirmed" value={stats.confirmedBookings} accent="text-sky-600" />
          <Stat label="Completed" value={stats.completedBookings} accent="text-emerald-600" />
          <Stat label="Cancelled" value={stats.cancelledBookings} accent="text-red-600" />
          <Stat label="Revenue (confirmed+)" value={formatPrice(stats.totalRevenue)} accent="text-slate-900" />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Listings</h2>
        <p className="mt-1 text-sm text-slate-500">
          {stats.hiddenCars === 0
            ? "All cars are currently live on the site."
            : `${stats.hiddenCars} car${stats.hiddenCars === 1 ? "" : "s"} are hidden and excluded from public search.`}
        </p>
      </div>
    </div>
  );
}