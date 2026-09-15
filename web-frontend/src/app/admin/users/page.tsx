"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role, User } from "@/lib/types";
import { Alert, GhostButton, Spinner } from "@/components/ui";

type Filter = "ALL" | Role;

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
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
      setUsers(await adminApi.users(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEnabled(u: User) {
    if (!token) return;
    setBusy(u.id);
    setError("");
    setNotice("");
    try {
      const updated = await adminApi.setUserEnabled(token, u.id, !u.enabled);
      setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice(`${updated.fullName} ${updated.enabled ? "activated" : "suspended"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading users…" />;

  const visible = users.filter((u) => filter === "ALL" || u.role === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="text-sm text-slate-500">Every registered owner, agency and admin account.</p>

      <div className="mt-4 flex gap-2">
        {(["ALL", "OWNER", "ADMIN"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            } border border-slate-200`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase() + "s"}
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
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{u.fullName}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{u.businessName ?? "—"}</div>
                  <div className="text-xs text-slate-500">{u.accountType}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold uppercase tracking-wide text-slate-600">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.nic || u.passportNo || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      u.enabled
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border-red-200 bg-red-100 text-red-700"
                    }`}
                  >
                    {u.enabled ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === me?.id ? (
                    <span className="text-xs text-slate-400">you</span>
                  ) : (
                    <GhostButton
                      onClick={() => toggleEnabled(u)}
                      disabled={busy === u.id}
                      className={`px-3 py-1.5 text-xs ${
                        u.enabled ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {busy === u.id ? "Saving…" : u.enabled ? "Suspend" : "Activate"}
                    </GhostButton>
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