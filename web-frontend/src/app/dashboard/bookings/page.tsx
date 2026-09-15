"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError, type Booking, type BookingStatus } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Alert, Spinner, PrimaryButton, GhostButton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

export default function OwnerBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setBookings(await bookingsApi.mine(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: BookingStatus) {
    if (!token) return;
    setActionId(id);
    setError("");
    try {
      await bookingsApi.setStatus(token, id, status);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Could not set status to ${status}`);
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <Spinner label="Loading bookings…" />;

  const pending = bookings.filter((b) => b.status === "PENDING");
  const others = bookings.filter((b) => b.status !== "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
      <p className="text-sm text-slate-500">{bookings.length} total</p>

      {error ? (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">
            No bookings yet.{" "}
            <Link href="/dashboard/cars" className="font-semibold text-amber-600 hover:text-amber-700">
              Check your listings
            </Link>
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="mt-5">
              <h2 className="text-lg font-bold text-amber-700">Pending approval ({pending.length})</h2>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {pending.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    actionId={actionId}
                    onConfirm={() => setStatus(b.id, "CONFIRMED")}
                    onCancel={() => setStatus(b.id, "CANCELLED")}
                  />
                ))}
              </div>
            </section>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No pending bookings.</p>
          )}

          {others.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-800">All bookings</h2>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {others.map((b) => (
                  <BookingCard key={b.id} booking={b} actionId={actionId} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking: b,
  actionId,
  onConfirm,
  onCancel,
}: {
  booking: Booking;
  actionId: number | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-900">
            #{b.id} · {b.carMake} {b.carModel}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {formatDate(b.startDate)} → {formatDate(b.endDate)} · {b.withDriver ? "with driver" : "self-drive"}
          </div>
        </div>
        <StatusBadge status={b.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">Guest</dt>
          <dd className="font-medium text-slate-800">{b.guestName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">ID</dt>
          <dd className="font-medium text-slate-800">
            {b.guestIdType}: {b.guestIdNumber}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-bold text-amber-700">{formatPrice(b.totalPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Pickup</dt>
          <dd className="font-medium text-slate-800">{b.pickupLocation || "—"}</dd>
        </div>
      </dl>
      {onConfirm && onCancel ? (
        <div className="mt-3 flex gap-2">
          <PrimaryButton
            disabled={actionId === b.id}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={onConfirm}
          >
            Confirm
          </PrimaryButton>
          <GhostButton
            disabled={actionId === b.id}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onCancel}
          >
            Decline
          </GhostButton>
        </div>
      ) : null}
    </div>
  );
}