import type { CarType, Transmission } from "@/lib/types";
import BrowseClient from "./BrowseClient";

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const initialFilters = {
    city: str(sp.city) || "",
    type: (str(sp.type) as CarType) || "",
    seats: str(sp.seats) || "",
    transmission: (str(sp.transmission) as Transmission) || "",
    withDriver: str(sp.withDriver) === "true",
  };
  return <BrowseClient initialFilters={initialFilters} />;
}