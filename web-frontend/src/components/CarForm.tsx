"use client";

import { useState } from "react";
import { carsApi } from "@/lib/api";
import { ApiError, CAR_TYPES, FUEL_TYPES, type Car, type CarInput, type CarStatus, type CarType, type Transmission } from "@/lib/types";
import { Alert, Checkbox, Field, Input, PrimaryButton, Select, Textarea } from "@/components/ui";

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
      await (editing && car ? carsApi.update(token, car.id, payload) : carsApi.create(token, payload));
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
          {editing ? (
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
      <Field label="Description" hint="Optional">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, features, notes…" />
      </Field>
      <PrimaryButton disabled={saving} type="submit">
        {saving ? "Saving…" : editing ? "Save changes" : "Create car"}
      </PrimaryButton>
    </form>
  );
}