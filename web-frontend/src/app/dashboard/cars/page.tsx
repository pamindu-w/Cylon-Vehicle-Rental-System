"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { carsApi, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError, type CarList } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Spinner, Alert } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

export default function MyCarsPage() {
  const { token } = useAuth();
  const [cars, setCars] = useState<CarList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setCars(await carsApi.mine(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(car: CarList) {
    if (!token) return;
    const next = car.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    try {
      await carsApi.setStatus(token, car.id, next as "ACTIVE" | "HIDDEN");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update car");
    }
  }

  if (loading) return <Spinner label="Loading your cars…" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My cars</h1>
          <p className="text-sm text-slate-500">{cars.length} listed</p>
        </div>
        <Link
          href="/dashboard/cars/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          + Add a car
        </Link>
      </div>

      {error ? (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      ) : null}

      {cars.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">No cars yet.</p>
          <Link href="/dashboard/cars/new" className="mt-2 inline-block font-semibold text-amber-600 hover:text-amber-700">
            Add your first car
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cars.map((car) => (
            <div key={car.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              {car.imageUrls[0] ? (
                <img src={imageUrl(car.imageUrls[0])} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300 text-xs">
                  No photo
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {car.make} {car.model}
                    </div>
                    <div className="text-xs text-slate-500">
                      {car.city} · {formatPrice(car.dailyPrice)}/day
                    </div>
                  </div>
                  <StatusBadge status={car.status} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Link
                    href={`/dashboard/cars/${car.id}`}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/cars/${car.id}`}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => toggleStatus(car)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      car.status === "ACTIVE"
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {car.status === "ACTIVE" ? "Hide" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}