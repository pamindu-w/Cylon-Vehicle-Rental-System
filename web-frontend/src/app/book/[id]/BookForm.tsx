"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingsApi, carsApi, imageUrl } from "@/lib/api";
import { ApiError, type Booking, type Car } from "@/lib/types";
import { formatPrice, formatDate, rentalDays, today } from "@/lib/utils";
import { Alert, Checkbox, Field, Input, PrimaryButton, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";

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
  const router = useRouter();
  const { user, token } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [withDriver, setWithDriver] = useState(initialWithDriver);

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
    if (!token) return;
    setError("");
    setSubmitting(true);
    try {
      const booking = await bookingsApi.create(token, {
        carId,
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
    const statusLabel =
      done.status === "CANCELLED"
        ? "Your booking was cancelled."
        : done.status === "CONFIRMED"
          ? "The owner confirmed your booking."
          : "Done — the owner will confirm you as soon as possible.";
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-bold text-emerald-800">Booking received 🎉</h1>
          <p className="mt-1 text-sm text-emerald-700">{statusLabel}</p>
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
              <dt className="text-slate-500">Renter</dt>
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
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link href="/my-rentals" className="font-semibold text-amber-600 hover:text-amber-700">
            View in My rentals →
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="font-semibold text-amber-600 hover:text-amber-700">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!isCustomer || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">You need an account to book</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Browsing cars is free and open to everyone. To place a rental request and track whether
            the owner confirms or declines it, sign up as a renter first.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton onClick={() => router.push("/register")}>Create a renter account</PrimaryButton>
            <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const idLabel = user.accountType === "FOREIGNER" ? `Passport: ${user.passportNo}` : `NIC: ${user.nic}`;

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
            Your details come from your account. The owner confirms your request and you&apos;ll see
            the result in <b>My rentals</b>.
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
            <h2 className="font-bold text-slate-900">Renting as</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-semibold text-slate-800">{user.fullName}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-semibold text-slate-800">{user.email}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-semibold text-slate-800">{user.phone}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <dt className="text-slate-500">ID</dt>
                <dd className="font-semibold text-slate-800">{idLabel}</dd>
              </div>
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
              disabled={submitting || !datesValid}
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
              Free cancellation while your booking is pending — and up to 24 hours before pickup once confirmed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}