export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `Rs ${new Intl.NumberFormat("en-LK").format(value)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function rentalDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (Number.isNaN(diff) || diff < 0) return 0;
  return diff + 1;
}

export function initialField(initial: string): string {
  return initial ? initial[0].toUpperCase() : "?";
}