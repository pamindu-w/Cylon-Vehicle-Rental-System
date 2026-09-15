"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carsApi } from "@/lib/api";
import { CITIES, CAR_TYPES, type CarList, type CarType, type Transmission } from "@/lib/types";
import CarCard from "@/components/CarCard";
import { Checkbox, GhostButton, Select, Spinner } from "@/components/ui";

const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual" },
];

export default function HomePage() {
  const router = useRouter();
  const [cars, setCars] = useState<CarList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [city, setCity] = useState("");
  const [type, setType] = useState<CarType | "">("");
  const [seats, setSeats] = useState("");
  const [transmission, setTransmission] = useState<Transmission | "">("");
  const [withDriver, setWithDriver] = useState(false);
  const [unlimited, setUnlimited] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await carsApi.list({});
      setCars(unlimited ? data : data.slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, [unlimited]);

  useEffect(() => {
    load();
  }, [load]);

  function search() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (seats) params.set("seats", seats);
    if (transmission) params.set("transmission", transmission);
    if (withDriver) params.set("withDriver", "true");
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-amber-50 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-600">
            Sri Lanka car rentals
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Explore Sri Lanka your way —{" "}
            <span className="text-amber-600">with or without a driver</span>
          </h1>
          <p className="mt-4 max-w-xl text-slate-600">
            Book a car as a guest — no account needed. Locals and tourists can choose flexible
            date ranges, optional drivers, and verified local owners.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                City
              </span>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Anywhere in Sri Lanka</option>
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
              <Select value={type} onChange={(e) => setType(e.target.value as CarType | "")}>
                <option value="">Any type</option>
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
              <Select value={seats} onChange={(e) => setSeats(e.target.value)}>
                <option value="">Any seats</option>
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
              <Select value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission | "")}>
                <option value="">Either</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex flex-col justify-end gap-2">
              <Checkbox label="With driver" checked={withDriver} onChange={setWithDriver} />
              <button
                onClick={search}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                Search cars
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Featured fleet</h2>
          <button
            onClick={() => setUnlimited((v) => !v)}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            {unlimited ? "Show fewer" : "Show all"}
          </button>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="py-10 text-center text-red-600">{error}</p>
        ) : cars.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No cars available yet — check back soon.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <GhostButton onClick={() => router.push("/cars")}>Browse all cars</GhostButton>
        </div>
      </section>
    </div>
  );
}