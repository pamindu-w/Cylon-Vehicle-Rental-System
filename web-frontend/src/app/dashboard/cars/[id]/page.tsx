"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { carsApi, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError, type Car } from "@/lib/types";
import { Alert, GhostButton, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import CarForm from "@/components/CarForm";

export default function EditCarPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [imgError, setImgError] = useState("");
  const [imgSaving, setImgSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      setCar(await carsApi.getForOwner(token, id));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load car");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadImages(files: FileList | null) {
    if (!token || !files || files.length === 0) return;
    setImgSaving(true);
    setImgError("");
    try {
      await carsApi.uploadImages(token, id, Array.from(files));
      await load();
    } catch (e) {
      setImgError(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setImgSaving(false);
    }
  }

  async function deleteImage(imageId: number) {
    if (!token || !confirm("Delete this image?")) return;
    setImgError("");
    try {
      await carsApi.deleteImage(token, id, imageId);
      await load();
    } catch (e) {
      setImgError(e instanceof ApiError ? e.message : "Failed to delete image");
    }
  }

  if (loading) return <Spinner label="Loading car…" />;
  if (!token) return null;
  if (!car || loadError) {
    return (
      <div>
        <Alert kind="error">{loadError || "Car not found"}</Alert>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/cars" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
        ← Back to my cars
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {car.make} {car.model}
        </h1>
        <div className="flex items-center gap-3">
          <StatusBadge status={car.status} size="md" />
          <Link href={`/cars/${car.id}`} target="_blank" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            View on site ↗
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-slate-900">Listing details</h2>
        <CarForm token={token} car={car} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Photos {car.imageUrls.length > 0 ? `(${car.imageUrls.length})` : ""}</h2>
          <div className="flex items-center gap-2">
            {imgSaving ? <span className="text-xs text-slate-500">Uploading…</span> : null}
            <GhostButton
              disabled={imgSaving}
              onClick={() => fileRef.current?.click()}
            >
              + Upload photos
            </GhostButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadImages(e.target.files)}
            />
          </div>
        </div>
        {imgError ? (
          <div className="mt-3">
            <Alert kind="error">{imgError}</Alert>
          </div>
        ) : null}
        {car.imageUrls.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No photos uploaded yet. JPG/PNG/WebP up to 5 MB each.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {car.imageUrls.map((url, i) => {
              const imgId = car.imageIds[i];
              return (
                <div key={url} className="group relative">
                  <img src={imageUrl(url)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm" />
                  {typeof imgId === "number" ? (
                    <button
                      onClick={() => deleteImage(imgId)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 shadow transition group-hover:opacity-100"
                      aria-label="Delete image"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}