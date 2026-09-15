"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AdminReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Alert, GhostButton, Spinner } from "@/components/ui";
import { Stars } from "@/components/Stars";

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setReviews(await adminApi.reviews(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(r: AdminReview) {
    if (!token) return;
    if (!window.confirm(`Delete review #${r.id} left by ${r.reviewerName ?? "guest"}?`)) return;
    setBusy(r.id);
    setError("");
    setNotice("");
    try {
      await adminApi.deleteReview(token, r.id);
      setReviews((prev) => prev.filter((p) => p.id !== r.id));
      setNotice(`Review #${r.id} deleted`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading reviews…" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
      <p className="text-sm text-slate-500">Guest feedback across all cars.</p>

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

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No reviews on the platform yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Car</th>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Comment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">
                      {r.carMake} {r.carModel}
                    </span>
                    <span className="text-xs text-slate-400"> #{r.id}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.reviewerName ?? "Anonymous"}</td>
                  <td className="px-4 py-3">
                    <Stars value={r.rating} />
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-slate-600">
                    <span className="line-clamp-2">{r.comment || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <GhostButton
                      onClick={() => remove(r)}
                      disabled={busy === r.id}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      {busy === r.id ? "Deleting…" : "Delete"}
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}