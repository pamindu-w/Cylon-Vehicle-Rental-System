"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import CarForm from "@/components/CarForm";

export default function NewCarPage() {
  const { token } = useAuth();
  if (!token) return null;

  return (
    <div>
      <Link href="/dashboard/cars" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
        ← Back to my cars
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Add a car</h1>
      <p className="text-sm text-slate-500">
        Set it to <b>Active</b> to make it visible to renters.
      </p>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <CarForm token={token} />
      </div>
    </div>
  );
}