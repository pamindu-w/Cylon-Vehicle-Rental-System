"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CarList, CarStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Alert, GhostButton, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

type Filter = "ALL" | CarStatus;

export default function AdminCars() {
  const { token } = useAuth();
  const [cars, setCars] = useState<CarList[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<{ id: number; kind: "status" | "delete" } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setCars(await adminApi.cars(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cars");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(c: CarList) {
    if (!token) return;
    const next = c.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    setBusy({ id: c.id, kind: "status" });
    setError("");
    setNotice("");
    try {
      const updated = await adminApi.setCarStatus(token, c.id, next);
      setCars((prev) =>
        prev.map((p) =>
          p.id === updated.id ? { ...p, status: updated.status } : p,
        ),
      );
      setNotice(`${updated.make} ${updated.model} ${updated.status.toLowerCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteCar(c: CarList) {
    if (!token) return;
    if (!window.confirm(`Delete ${c.make} ${c.model}? This only works if it has no bookings.`)) return;
    setBusy({ id: c.id, kind: "delete" });
    setError("");
    setNotice("");
    try {
      await adminApi.deleteCar(token, c.id);
      setCars((prev) => prev.filter((p) => p.id !== c.id));
      setNotice(`${c.make} ${c.model} deleted`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading cars…" />;

  const visible = cars.filter((c) => filter === "ALL" || c.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cars</h1>
      <p className="text-sm text-slate-500">Every listing across all owners, including drafts and hidden cars.</p>

      <div className="mt-4 flex gap-2">
        {(["ALL", "ACTIVE", "HIDDEN", "DRAFT"] as Filter[]).map((f) => (
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
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Car</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {c.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(c.imageUrls[0])} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          no photo
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {c.make} {c.model} <span className="text-xs font-normal text-slate-400">#{c.id}</span>
                      </div>
                      <div className="text-xs text-slate-500">{c.year} · {c.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{c.ownerName}</td>
                <td className="px-4 py-3 text-slate-600">{c.city}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{formatPrice(c.dailyPrice)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <GhostButton
                      onClick={() => toggleStatus(c)}
                      disabled={busy?.id === c.id && busy.kind === "status"}
                      className="px-3 py-1.5 text-xs"
                    >
                      {busy?.id === c.id && busy.kind === "status"
                        ? "Saving…"
                        : c.status === "ACTIVE"
                          ? "Hide"
                          : "Activate"}
                    </GhostButton>
                    <GhostButton
                      onClick={() => deleteCar(c)}
                      disabled={busy?.id === c.id}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      {busy?.id === c.id && busy.kind === "delete" ? "Deleting…" : "Delete"}
                    </GhostButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}