"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Car } from "@/lib/types";
import { formatPrice, rentalDays, today } from "@/lib/utils";
import { Checkbox, Field, Input, PrimaryButton } from "@/components/ui";

export default function BookingWidget({ car }: { car: Car }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [withDriver, setWithDriver] = useState(false);

  const days = rentalDays(start, end);
  const daily = car.dailyPrice + (withDriver && car.withDriver ? car.driverDailyPrice ?? 0 : 0);
  const total = days * daily;

  const valid = start && end && new Date(end) >= new Date(start);

  function goToBooking() {
    const params = new URLSearchParams({ start, end, withDriver: withDriver ? "1" : "0" });
    router.push(`/book/${car.id}?${params.toString()}`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-900">{formatPrice(car.dailyPrice)}</span>
        <span className="text-sm text-slate-500">per day</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input
            type="date"
            min={today()}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            data-testid="widget-start"
          />
        </Field>
        <Field label="End date">
          <Input
            type="date"
            min={start || today()}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            data-testid="widget-end"
          />
        </Field>
      </div>
      {car.withDriver ? (
        <div className="mt-4">
          <Checkbox
            label={`Rent with driver (+ ${formatPrice(car.driverDailyPrice)}/day)`}
            checked={withDriver}
            onChange={setWithDriver}
          />
        </div>
      ) : null}
      {days > 0 && valid ? (
        <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatPrice(daily)} × {days} day{days > 1 ? "s" : ""}
            </span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span data-testid="widget-total">{formatPrice(total)}</span>
          </div>
        </div>
      ) : null}
      <PrimaryButton
        className="mt-4 w-full"
        disabled={!valid}
        onClick={goToBooking}
        data-testid="widget-book"
      >
        Book now
      </PrimaryButton>
      {car.status !== "ACTIVE" ? (
        <p className="mt-2 text-center text-xs text-red-600">This car is not currently available.</p>
      ) : null}
    </div>
  );
}