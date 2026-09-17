"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { ApiError, type AccountType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Alert, Field, Input, PrimaryButton } from "@/components/ui";

const ACCOUNT_TABS: { value: AccountType; label: string; description: string }[] = [
  {
    value: "LOCAL",
    label: "Sri Lankan",
    description: "Register with your national NIC",
  },
  {
    value: "FOREIGNER",
    label: "Foreigner",
    description: "Register with your passport + nationality",
  },
];

type Mode = "RENTER" | "OWNER";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("RENTER");
  const [tab, setTab] = useState<AccountType>("LOCAL");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [nationality, setNationality] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const identity = tab === "LOCAL" ? { nic } : { passportNo, nationality };
      const res =
        mode === "RENTER"
          ? await authApi.registerCustomer({ email, password, fullName, phone, accountType: tab, ...identity })
          : await authApi.register({ email, password, fullName, businessName, phone, accountType: tab, ...identity });
      login(res.token, res.user);
      router.push(mode === "RENTER" ? "/my-rentals" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Renters book cars and track their bookings. Owners and agencies list vehicles.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("RENTER")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "RENTER" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            I&apos;m renting a car
          </button>
          <button
            type="button"
            onClick={() => setMode("OWNER")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "OWNER" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            I&apos;m an owner / agency
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {ACCOUNT_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.value
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          {ACCOUNT_TABS.find((t) => t.value === tab)?.description}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                required
              />
            </Field>
            <Field label="Full name">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As on your ID"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                required
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                minLength={8}
                required
              />
            </Field>
            {mode === "OWNER" ? (
              <Field label="Business name" hint="Optional">
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </Field>
            ) : null}

            {tab === "LOCAL" ? (
              <Field
                label="NIC number"
                hint="e.g. 851234567V (old) or 199532144556 (new)"
              >
                <Input value={nic} onChange={(e) => setNic(e.target.value)} required />
              </Field>
            ) : (
              <>
                <Field label="Passport number">
                  <Input value={passportNo} onChange={(e) => setPassportNo(e.target.value)} required />
                </Field>
                <Field label="Nationality">
                  <Input value={nationality} onChange={(e) => setNationality(e.target.value)} required />
                </Field>
              </>
            )}
          </div>

          {error ? <Alert kind="error">{error}</Alert> : null}
          <PrimaryButton className="w-full" disabled={submitting} type="submit">
            {submitting
              ? "Creating account…"
              : mode === "RENTER"
                ? "Create account & start booking"
                : "Register & start listing"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}