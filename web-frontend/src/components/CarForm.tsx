"use client";

import { useRef, useState } from "react";
import { carsApi } from "@/lib/api";
import { ApiError, CAR_TYPES, FUEL_TYPES, type Car, type CarInput, type CarStatus, type CarType, type Transmission } from "@/lib/types";
import { Alert, Checkbox, Field, GhostButton, Input, PrimaryButton, Select, Textarea } from "@/components/ui";

export default function CarForm({ car, token }: { car?: Car; token: string }) {
  const editing = Boolean(car);
  const [make, setMake] = useState(car?.make ?? "");
  const [model, setModel] = useState(car?.model ?? "");
  const [year, setYear] = useState(String(car?.year ?? 2020));
  const [type, setType] = useState<CarType>(car?.type ?? "SEDAN");
  const [transmission, setTransmission] = useState<Transmission>(car?.transmission ?? "AUTOMATIC");
  const [seats, setSeats] = useState(String(car?.seats ?? 5));
  const [fuel, setFuel] = useState(car?.fuel ?? "PETROL");
  const [dailyPrice, setDailyPrice] = useState(String(car?.dailyPrice ?? ""));
  const [withDriver, setWithDriver] = useState(car?.withDriver ?? false);
  const [driverDailyPrice, setDriverDailyPrice] = useState(String(car?.driverDailyPrice ?? "2500"));
  const [city, setCity] = useState(car?.city ?? "");
  const [lat, setLat] = useState(car?.lat !== null && car?.lat !== undefined ? String(car.lat) : "");
  const [lng, setLng] = useState(car?.lng !== null && car?.lng !== undefined ? String(car.lng) : "");
  const [description, setDescription] = useState(car?.description ?? "");
  const [status, setStatus] = useState<CarStatus>(car?.status ?? "DRAFT");

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setFileError("");
    const incoming = Array.from(list);
    const tooBig = incoming.some((f) => f.size > 5 * 1024 * 1024);
    const badType = incoming.some((f) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type));
    if (tooBig || badType) {
      setFileError("Each photo must be JPG/PNG/WebP and up to 5 MB.");
      return;
    }
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: CarInput = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        type,
        transmission,
        seats: Number(seats),
        fuel,
        dailyPrice: Number(dailyPrice),
        withDriver,
        driverDailyPrice: withDriver ? Number(driverDailyPrice) : undefined,
        city: city.trim(),
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        description: description.trim() || undefined,
        status,
      };
      if (editing && car) {
        await carsApi.update(token, car.id, payload);
      } else {
        const created = await carsApi.create(token, payload, files);
        setCreatedId(created.id);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save car");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {saved ? (
        <Alert kind="success">
          Car {editing ? "updated" : "created"} successfully.
          {createdId ? (
            <a href={`/dashboard/cars/${createdId}`} className="ml-2 font-semibold underline">
              Manage photos
            </a>
          ) : editing ? (
            <a href={`/dashboard/cars/${car?.id}`} className="ml-2 font-semibold underline">
              Edit photos
            </a>
          ) : null}
        </Alert>
      ) : null}
      {error ? <Alert kind="error">{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make">
          <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" required />
        </Field>
        <Field label="Model">
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Axio" required />
        </Field>
        <Field label="Year">
          <Input type="number" min={1950} max={2100} value={year} onChange={(e) => setYear(e.target.value)} required />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as CarType)}>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Transmission">
          <Select value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission)}>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </Select>
        </Field>
        <Field label="Seats">
          <Input type="number" min={1} max={60} value={seats} onChange={(e) => setSeats(e.target.value)} required />
        </Field>
        <Field label="Fuel">
          <Select value={fuel} onChange={(e) => setFuel(e.target.value as Car["fuel"])}>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Daily price (LKR)">
          <Input type="number" min={0} value={dailyPrice} onChange={(e) => setDailyPrice(e.target.value)} required />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Colombo" required />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as CarStatus)}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active (visible to renters)</option>
            <option value="HIDDEN">Hidden</option>
          </Select>
        </Field>
        <Field label="Latitude" hint="Optional — used for the pickup map">
          <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="6.9324" />
        </Field>
        <Field label="Longitude" hint="Optional — used for the pickup map">
          <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="79.8509" />
        </Field>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Checkbox
          label="Offer rent-with-driver option"
          checked={withDriver}
          onChange={setWithDriver}
        />
        {withDriver ? (
          <div className="mt-3 max-w-xs">
            <Field label="Driver daily price (LKR)">
              <Input type="number" min={0} value={driverDailyPrice} onChange={(e) => setDriverDailyPrice(e.target.value)} required />
            </Field>
          </div>
        ) : null}
      </div>
      {!editing ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Photos</div>
              <div className="text-xs text-slate-500">
                Add up to 10 photos of your vehicle. JPG/PNG/WebP, up to 5 MB each.
              </div>
            </div>
            <GhostButton type="button" onClick={() => fileRef.current?.click()}>
              + Add photos
            </GhostButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => pickFiles(e.target.files)}
            />
          </div>
          {fileError ? (
            <div className="mt-3">
              <Alert kind="error">{fileError}</Alert>
            </div>
          ) : null}
          {files.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="group relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 shadow transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <Field label="Description" hint="Optional">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, features, notes…" />
      </Field>
      <PrimaryButton disabled={saving} type="submit">
        {saving ? "Saving…" : editing ? "Save changes" : "Create car"}
      </PrimaryButton>
    </form>
  );
}