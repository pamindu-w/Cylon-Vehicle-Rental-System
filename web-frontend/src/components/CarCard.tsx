import Link from "next/link";
import { imageUrl } from "@/lib/api";
import type { CarList } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { RatingBadge } from "@/components/Stars";
import { StatusBadge } from "@/components/StatusBadge";

const TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
  TUK: "Tuk tuk",
  MINIVAN: "Minivan",
  JEEP: "4WD Jeep",
  BUS: "Bus",
  OTHER: "Other",
};

export default function CarCard({ car }: { car: CarList }) {
  const image = car.imageUrls[0];
  return (
    <Link
      href={`/cars/${car.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={imageUrl(image)}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M5 11l1.5-4.5a1 1 0 01.95-.7h9.1a1 1 0 01.95.7L19 11" strokeLinecap="round" />
              <path d="M3.5 11h17v5h-17z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7" cy="16.5" r="1.8" />
              <circle cx="17" cy="16.5" r="1.8" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <RatingBadge value={car.averageRating} />
        </div>
        {car.status !== "ACTIVE" ? (
          <div className="absolute right-3 top-3">
            <StatusBadge status={car.status} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold text-slate-900">
            {car.make} {car.model}{" "}
            <span className="text-sm font-medium text-slate-500">{car.year}</span>
          </h3>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{TYPE_LABELS[car.type] ?? car.type}</span>
          <span>·</span>
          <span>{car.transmission === "AUTOMATIC" ? "Automatic" : "Manual"}</span>
          <span>·</span>
          <span>{car.seats} seats</span>
          <span>·</span>
          <span>{car.fuel}</span>
        </div>
        <span className="mt-1 text-sm font-medium text-slate-600">
          {car.city}
          {car.withDriver ? " · driver available" : ""}
        </span>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-extrabold text-slate-900">{formatPrice(car.dailyPrice)}</span>
            <span className="text-xs text-slate-500">per day</span>
          </div>
        </div>
      </div>
    </Link>
  );
}