"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { carsApi } from "@/lib/api";
import { CITIES, CAR_TYPES, type CarList, type CarType, type Transmission } from "@/lib/types";
import CarCard from "@/components/CarCard";
import { Checkbox, GhostButton, Select, Spinner, Alert } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-xl bg-slate-100" />,
});

interface FilterState {
  city: string;
  type: CarType | "";
  seats: string;
  transmission: Transmission | "";
  withDriver: boolean;
}

export default function BrowseClient({ initialFilters }: { initialFilters: FilterState }) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [cars, setCars] = useState<CarList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(async (f: FilterState) => {
    setLoading(true);
    setError("");
    try {
      const data = await carsApi.list({
        city: f.city || undefined,
        type: f.type || undefined,
        seats: f.seats ? Number(f.seats) : undefined,
        transmission: f.transmission || undefined,
        withDriver: f.withDriver ? true : undefined,
      });
      setCars(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(filters), 250);
    return () => clearTimeout(timer);
  }, [filters, load]);

  const mapCars = useMemo(
    () =>
      cars.map((c) => ({
        id: c.id,
        name: `${c.make} ${c.model}`,
        city: c.city,
        lat: c.lat,
        lng: c.lng,
        dailyPrice: c.dailyPrice,
      })),
    [cars],
  );

  const activeCount = useMemo(
    () => Object.entries(filters).filter(([, v]) => v !== "" && v !== false).length,
    [filters],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse rental cars</h1>
          <p className="text-sm text-slate-500">
            {loading ? "Searching…" : `${cars.length} car${cars.length === 1 ? "" : "s"} available`}
          </p>
        </div>
        <GhostButton onClick={() => setShowMap((v) => !v)} disabled={cars.length === 0}>
          {showMap ? "Hide map" : "Show map"}
        </GhostButton>
      </div>

      <div className="sticky top-16 z-30 mt-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              City
            </span>
            <Select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </span>
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as CarType | "" })}
            >
              <option value="">All types</option>
              {CAR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Seats
            </span>
            <Select value={filters.seats} onChange={(e) => setFilters({ ...filters, seats: e.target.value })}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15].map((s) => (
                <option key={s} value={s}>
                  {s}+ seats
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Transmission
            </span>
            <Select
              value={filters.transmission}
              onChange={(e) =>
                setFilters({ ...filters, transmission: e.target.value as Transmission | "" })
              }
            >
              <option value="">Either</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </Select>
          </label>
          <div className="flex items-end gap-2">
            <Checkbox
              label="With driver"
              checked={filters.withDriver}
              onChange={(v) => setFilters({ ...filters, withDriver: v })}
            />
            {activeCount > 0 ? (
              <button
                onClick={() =>
                  setFilters({
                    city: "",
                    type: "",
                    seats: "",
                    transmission: "",
                    withDriver: false,
                  })
                }
                className="text-xs font-semibold text-slate-500 hover:text-red-600"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <Alert kind="error">{error}</Alert>
      ) : showMap ? (
        <div className="mt-5">
          <MapView cars={mapCars} />
        </div>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : cars.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            No cars match your filters. Try widening your search.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}