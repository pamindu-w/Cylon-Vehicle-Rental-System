"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Booking, BookingStatus } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { Alert, GhostButton, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

type Filter = "ALL" | BookingStatus;

export default function AdminBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setBookings(await adminApi.bookings(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(b: Booking) {
    if (!token) return;
    if (!window.confirm(`Cancel booking #${b.id} for ${b.guestName}?`)) return;
    setBusy(b.id);
    setError("");
    setNotice("");
    try {
      const updated = await adminApi.setBookingStatus(token, b.id, "CANCELLED");
      setBookings((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice(`Booking #${updated.id} cancelled`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading bookings…" />;

  const visible = bookings.filter((b) => filter === "ALL" || b.status === filter);
  const cancellable = (s: BookingStatus) => s !== "CANCELLED" && s !== "COMPLETED";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
      <p className="text-sm text-slate-500">Every booking on the platform, across all owners.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["ALL", "PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            } border border-slate-200`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mt-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    #{b.id} · {b.carMake} {b.carModel}
                  </div>
                  <div className="text-xs text-slate-500">
                    {b.guestIdType} · {b.guestIdNumber}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{b.guestName}</div>
                  <div className="text-xs text-slate-500">{b.guestEmail}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  <div className="text-xs text-slate-400">{b.withDriver ? "with driver" : "self-drive"}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">{formatPrice(b.totalPrice)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {cancellable(b.status) ? (
                    <GhostButton
                      onClick={() => cancel(b)}
                      disabled={busy === b.id}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      {busy === b.id ? "Cancelling…" : "Cancel"}
                    </GhostButton>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}