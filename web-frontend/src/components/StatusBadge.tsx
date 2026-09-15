export function StatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const palette: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    HIDDEN: "bg-slate-100 text-slate-600 border-slate-200",
    DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-sky-100 text-sky-700 border-sky-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  };
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex rounded-full border font-semibold uppercase tracking-wide ${palette[status] ?? "bg-slate-100 text-slate-600 border-slate-200"} ${pad}`}
    >
      {status}
    </span>
  );
}