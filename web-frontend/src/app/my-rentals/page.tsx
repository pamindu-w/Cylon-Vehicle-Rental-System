"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { bookingsApi, reviewsApi } from "@/lib/api";
import { ApiError, type Booking } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { Alert, GhostButton, PrimaryButton, Spinner, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingInput } from "@/components/Stars";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/lib/auth";

function RentalCard({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const { token } = useAuth();

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canReview = booking.status === "COMPLETED" && !booking.hasReview && !reviewed;

  async function cancel() {
    if (!token || !window.confirm("Cancel this booking?")) return;
    setCancellingId(booking.id);
    setActionError("");
    try {
      await bookingsApi.cancel(token, booking.id);
      onChanged();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  }

  async function submitReview() {
    if (!token || rating < 1) return;
    setReviewing(true);
    setActionError("");
    try {
      await reviewsApi.create(token, {
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewed(true);
      onChanged();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Failed to submit review");
    } finally {
      setReviewing(false);
    }
  }

  const cancelledText =
    booking.status === "CANCELLED"
      ? "This booking was cancelled or declined by the owner."
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/cars/${booking.carId}`} className="font-bold text-slate-900 hover:text-amber-600">
            {booking.carMake} {booking.carModel}
          </Link>
          <div className="text-xs text-slate-500">Booking #{booking.id}</div>
        </div>
        <StatusBadge status={booking.status} size="md" />
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between border-b border-slate-100 pb-1">
          <dt className="text-slate-500">Dates</dt>
          <dd className="font-semibold text-slate-800">
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
          <dt className="text-slate-500">Driver</dt>
          <dd className="font-semibold text-slate-800">{booking.withDriver ? "Yes" : "No"}</dd>
        </div>
        {booking.pickupLocation ? (
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <dt className="text-slate-500">Pickup</dt>
            <dd className="font-semibold text-slate-800">{booking.pickupLocation}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-b border-slate-100 pb-1">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold text-amber-700">{formatPrice(booking.totalPrice)}</dd>
        </div>
      </dl>

      {cancelledText ? <p className="mt-3 text-xs text-red-600">{cancelledText}</p> : null}
      {actionError ? (
        <div className="mt-3">
          <Alert kind="error">{actionError}</Alert>
        </div>
      ) : null}

      {canCancel ? (
        <div className="mt-4">
          <GhostButton disabled={cancellingId === booking.id} onClick={cancel}>
            {cancellingId === booking.id ? "Cancelling…" : "Cancel booking"}
          </GhostButton>
          <p className="mt-2 text-xs text-slate-500">
            Free cancellation while pending or up to 24 hours before pickup.
          </p>
        </div>
      ) : null}

      {canReview ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">Leave a review</h3>
          <p className="mt-1 text-xs text-slate-500">
            How was your trip in the {booking.carMake} {booking.carModel}?
          </p>
          <div className="mt-2">
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <div className="mt-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)…"
            />
          </div>
          <PrimaryButton className="mt-2" disabled={reviewing || rating < 1} onClick={submitReview}>
            {reviewing ? "Submitting…" : "Submit review"}
          </PrimaryButton>
        </div>
      ) : null}

      {booking.status === "COMPLETED" && (booking.hasReview || reviewed) ? (
        <p className="mt-3 text-xs text-emerald-700">You have already reviewed this trip.</p>
      ) : null}
    </div>
  );
}

export default function MyRentalsPage() {
  const { token, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setBookings(await bookingsApi.myRentals(token));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load your rentals");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthGate requireRole="CUSTOMER">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My rentals</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your booking requests and their status — confirmed, pending or declined.
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="text-sm font-semibold text-slate-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? <Spinner label="Loading your rentals…" /> : null}
          {error ? <Alert kind="error">{error}</Alert> : null}
          {!loading && !error && bookings?.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-600">You haven&apos;t rented any cars yet.</p>
              <Link href="/cars" className="mt-3 inline-block font-semibold text-amber-600 hover:text-amber-700">
                Browse cars →
              </Link>
            </div>
          ) : null}
          {bookings?.map((booking) => (
            <RentalCard key={booking.id} booking={booking} onChanged={load} />
          ))}
        </div>
      </div>
    </AuthGate>
  );
}