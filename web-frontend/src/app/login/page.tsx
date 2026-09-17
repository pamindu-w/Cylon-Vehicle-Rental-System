"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { ApiError } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Alert, Field, Input, PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authApi.login(email, password);
      login(res.token, res.user);
      router.push(
        res.user.role === "ADMIN"
          ? "/admin"
          : res.user.role === "OWNER"
            ? "/dashboard"
            : "/my-rentals",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Renters, car owners and agencies all sign in here.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <Alert kind="error">{error}</Alert> : null}
          <PrimaryButton className="w-full" disabled={submitting} type="submit">
            {submitting ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}