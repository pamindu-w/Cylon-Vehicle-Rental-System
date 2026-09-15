import type { ReactNode } from "react";

export function Stars({ value, count }: { value: number | null; count?: number }) {
  const rounded = Math.round(value ?? 0);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex text-amber-500" aria-label={`${value ?? 0} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            className={`h-4 w-4 ${n <= rounded ? "fill-amber-500" : "fill-slate-200"}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.45 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        ))}
      </span>
      {value !== null && value !== undefined ? (
        <span className="text-xs font-medium text-slate-600">
          {value.toFixed(1)}
          {typeof count === "number" ? ` (${count})` : ""}
        </span>
      ) : (
        <span className="text-xs text-slate-400">No reviews yet</span>
      )}
    </span>
  );
}

export function RatingBadge({ value }: { value: number | null }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white"
      aria-label={`${value ?? 0} out of 5 stars`}
    >
      <svg className="h-3 w-3 fill-amber-300" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.45 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
      {value === null || value === undefined ? "New" : value.toFixed(1)}
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const options: readonly ReactNode[] = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-1">
      {options.map((n) => (
        <button
          key={String(n)}
          type="button"
          onClick={() => onChange(Number(n))}
          className="p-0.5"
          aria-label={`${String(n)} star${n === 1 ? "" : "s"}`}
        >
          <svg
            className={`h-8 w-8 ${Number(n) <= value ? "fill-amber-500" : "fill-slate-200 hover:fill-amber-300"}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.45 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}