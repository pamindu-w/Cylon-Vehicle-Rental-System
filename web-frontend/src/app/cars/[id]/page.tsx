"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { carsApi, reviewsApi } from "@/lib/api";
import type { Car, Review } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import CarGallery from "@/components/CarGallery";
import BookingWidget from "@/components/BookingWidget";
import { Stars } from "@/components/Stars";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner, Alert } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-100" />,
});

const SPECS: { key: keyof Car; label: string; fmt?: (c: Car) => string }[] = [
  { key: "type", label: "Type", fmt: (c) => c.type },
  { key: "transmission", label: "Transmission", fmt: (c) => (c.transmission === "AUTOMATIC" ? "Automatic" : "Manual") },
  { key: "fuel", label: "Fuel", fmt: (c) => c.fuel },
  { key: "seats", label: "Seats", fmt: (c) => String(c.seats) },
  { key: "year", label: "Year", fmt: (c) => String(c.year) },
  { key: "withDriver", label: "Driver", fmt: (c) => (c.withDriver ? `Available (+ ${formatPrice(c.driverDailyPrice)}/day)` : "Not offered") },
  { key: "ownerName", label: "Provided by", fmt: (c) => c.ownerName },
];

export default function CarDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [car, setCar] = useState<Car | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, r] = await Promise.all([carsApi.get(id), reviewsApi.byCar(id)]);
      setCar(c);
      setReviews(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load car");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading car…" />;

  if (error || !car) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Alert kind="error">{error || "Car not found"}</Alert>
        <p className="mt-4 text-center">
          <Link href="/cars" className="font-semibold text-amber-600 hover:text-amber-700">
            ← Back to browse
          </Link>
        </p>
      </div>
    );
  }

  const unavailable = car.status !== "ACTIVE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-600">
          Home
        </Link>
        {" / "}
        <Link href="/cars" className="hover:text-amber-600">
          Cars
        </Link>
        {" / "}
        <span className="text-slate-700">
          {car.make} {car.model}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CarGallery images={car.imageUrls} alt={`${car.make} ${car.model}`} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {car.make} {car.model} <span className="text-lg font-medium text-slate-500">{car.year}</span>
              </h1>
              <p className="text-sm text-slate-500">
                {car.city}
                {car.withDriver ? " · driver available" : ""}
              </p>
            </div>
            <Stars value={car.averageRating} count={car.ratingCount} />
            {unavailable ? <StatusBadge status={car.status} size="md" /> : null}
          </div>

          <h2 className="mt-6 text-lg font-bold text-slate-900">Overview</h2>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {car.description || "No description provided by the owner."}
          </p>

          <h2 className="mt-6 text-lg font-bold text-slate-900">Specifications</h2>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between border-b border-slate-100 pb-2 text-sm"
              >
                <dt className="text-slate-500">{spec.label}</dt>
                <dd className="font-semibold text-slate-800">{spec.fmt ? spec.fmt(car) : ""}</dd>
              </div>
            ))}
          </dl>

          {car.lat !== null && car.lng !== null ? (
            <>
              <h2 className="mt-6 text-lg font-bold text-slate-900">Pickup area</h2>
              <div className="mt-2">
                <MapView
                  cars={[
                    {
                      id: car.id,
                      name: `${car.make} ${car.model}`,
                      city: car.city,
                      lat: car.lat,
                      lng: car.lng,
                      dailyPrice: car.dailyPrice,
                    },
                  ]}
                />
              </div>
            </>
          ) : null}

          <h2 className="mt-8 text-lg font-bold text-slate-900">
            Reviews {reviews.length > 0 ? `(${reviews.length})` : ""}
          </h2>
          <div className="mt-2 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet. Be the first after your trip.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{review.reviewerName}</span>
                    <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-1">
                    <Stars value={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget car={car} />
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-800">Good to know</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
              <li>Book as a guest — no account needed.</li>
              <li>A car is considered available if it isn&apos;t reserved for your dates.</li>
              <li>Local renters use their NIC; foreigners use a passport.</li>
              <li>Online payment (PayHere / Stripe) is coming soon.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}