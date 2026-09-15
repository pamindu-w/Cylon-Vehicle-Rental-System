"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingsApi, carsApi, imageUrl } from "@/lib/api";
import { ApiError, type Booking, type Car, type IdType } from "@/lib/types";
import { formatPrice, formatDate, rentalDays, today } from "@/lib/utils";
import { Alert, Checkbox, Field, Input, PrimaryButton, Select, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

export default function BookForm({
  carId,
  initialStart,
  initialEnd,
  initialWithDriver,
}: {
  carId: number;
  initialStart: string;
  initialEnd: string;
  initialWithDriver: boolean;
}) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [withDriver, setWithDriver] = useState(initialWithDriver);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestIdType, setGuestIdType] = useState<IdType>("NIC");
  const [guestIdNumber, setGuestIdNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  useEffect(() => {
    carsApi
      .get(carId)
      .then(setCar)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load car"))
      .finally(() => setLoading(false));
  }, [carId]);

  const days = rentalDays(start, end);
  const daily =
    (car?.dailyPrice ?? 0) +
    (withDriver && car?.withDriver ? car.driverDailyPrice ?? 0 : 0);
  const total = days * daily;

  const datesValid = Boolean(start && end && new Date(end) >= new Date(start));

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        carId,
        guestName,
        guestEmail,
        guestPhone,
        guestIdType,
        guestIdNumber,
        startDate: start,
        endDate: end,
        withDriver,
        pickupLocation: pickupLocation || undefined,
      });
      setDone(booking);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Loading car…" />;

  if (!car) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert kind="error">{loadError || "Car not found"}</Alert>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-bold text-emerald-800">Booking received 🎉</h1>
          <p className="mt-1 text-sm text-emerald-700">
            Your booking is <b>pending</b> — the owner will confirm shortly. No payment was taken.
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">
              #{done.id} · {car.make} {car.model}
            </h2>
            <StatusBadge status={done.status} size="md" />
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Guest</dt>
              <dd className="font-semibold text-slate-800">{done.guestName}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">ID</dt>
              <dd className="font-semibold text-slate-800">
                {done.guestIdType}: {done.guestIdNumber}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Dates</dt>
              <dd className="font-semibold text-slate-800">
                {formatDate(done.startDate)} → {formatDate(done.endDate)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Driver</dt>
              <dd className="font-semibold text-slate-800">{done.withDriver ? "Yes" : "No"}</dd>
            </div>
            {done.pickupLocation ? (
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Pickup</dt>
                <dd className="font-semibold text-slate-800">{done.pickupLocation}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <dt className="text-slate-500">Total</dt>
              <dd className="text-sm font-extrabold text-amber-700">{formatPrice(done.totalPrice)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Reference: please note your booking number {done.id} when contacting the owner.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="font-semibold text-amber-600 hover:text-amber-700">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/cars" className="hover:text-amber-600">
          Cars
        </Link>
        {" / "}
        <Link href={`/cars/${car.id}`} className="hover:text-amber-600">
          {car.make} {car.model}
        </Link>
        {" / "}
        <span className="text-slate-700">Booking</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h1 className="text-2xl font-bold text-slate-900">Confirm your booking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Rent as a guest — no account required. The owner confirms your request by email.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            {car.imageUrls[0] ? (
              <img
                src={imageUrl(car.imageUrls[0])}
                alt=""
                className="h-14 w-20 rounded-lg object-cover"
              />
            ) : null}
            <div>
              <div className="font-bold text-slate-900">
                {car.make} {car.model}
              </div>
              <div className="text-xs text-slate-500">
                {car.city} · {car.transmission} · {car.seats} seats
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Rental dates</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Start date">
                <Input
                  type="date"
                  min={today()}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="End date">
                <Input
                  type="date"
                  min={start || today()}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>
            {car.withDriver ? (
              <div className="mt-3">
                <Checkbox
                  label={`Rent with driver (+ ${formatPrice(car.driverDailyPrice)}/day)`}
                  checked={withDriver}
                  onChange={setWithDriver}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Your details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="As on your ID"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                />
              </Field>
              <Field label="ID type">
                <Select
                  value={guestIdType}
                  onChange={(e) => setGuestIdType(e.target.value as IdType)}
                >
                  <option value="NIC">Sri Lankan NIC</option>
                  <option value="PASSPORT">Passport</option>
                </Select>
              </Field>
              <Field
                label={guestIdType === "NIC" ? "NIC number" : "Passport number"}
                hint={
                  guestIdType === "NIC"
                    ? "e.g. 851234567V or 199532144556"
                    : "For foreign/visitor renters"
                }
              >
                <Input
                  value={guestIdNumber}
                  onChange={(e) => setGuestIdNumber(e.target.value)}
                />
              </Field>
              <Field label="Pickup location" hint="Optional">
                <Input
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Bandaranaike Airport"
                />
              </Field>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-bold text-slate-900">Price summary</h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base ({formatPrice(car.dailyPrice)}/day)</span>
                <span>{days ? formatPrice(car.dailyPrice * days) : "—"}</span>
              </div>
              {withDriver && car.withDriver ? (
                <div className="flex justify-between text-slate-600">
                  <span>Driver ({formatPrice(car.driverDailyPrice)}/day)</span>
                  <span>{days ? formatPrice((car.driverDailyPrice ?? 0) * days) : "—"}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Days</span>
                <span>{days || "—"}</span>
              </div>
              <div className="my-2 border-t border-slate-100" />
              <div className="flex justify-between text-lg font-extrabold text-slate-900">
                <span>Total</span>
                <span className="text-amber-700">{days ? formatPrice(total) : "—"}</span>
              </div>
            </div>
            <PrimaryButton
              className="mt-4 w-full"
              disabled={submitting || !datesValid || !guestName || !guestEmail || !guestPhone || !guestIdNumber}
              onClick={submit}
            >
              {submitting ? "Booking…" : "Confirm booking"}
            </PrimaryButton>
            {!datesValid && (start || end) ? (
              <p className="mt-2 text-center text-xs text-red-600">Please choose valid start and end dates.</p>
            ) : null}
            {error ? (
              <div className="mt-3">
                <Alert kind="error">{error}</Alert>
              </div>
            ) : null}
            <p className="mt-3 text-center text-xs text-slate-500">
              Free cancellation until the owner confirms.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}