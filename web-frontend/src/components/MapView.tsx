"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export interface MapCar {
  id: number;
  name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  dailyPrice: number;
}

function makePin(number: number): L.DivIcon {
  return L.divIcon({
    className: "lanka-pin",
    html: `
      <div style="position:relative;width:34px;height:42px;transform:translate(-17px,-42px)">
        <svg width="34" height="42" viewBox="0 0 34 42">
          <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25C34 7.6 26.4 0 17 0z" fill="#d97706"/>
          <circle cx="17" cy="17" r="11" fill="#fff"/>
          <text x="17" y="21.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">${number}</text>
        </svg>
      </div>`,
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
}

export default function MapView({ cars }: { cars: MapCar[] }) {
  const withCoords = cars.filter((c) => c.lat !== null && c.lng !== null);
  if (withCoords.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        No location data available for these cars
      </div>
    );
  }

  const bounds = L.latLngBounds(withCoords.map((c) => [c.lat as number, c.lng as number] as [number, number]));

  return (
    <div className="h-96 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom
        className="z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((car, index) => (
          <Marker
            key={car.id}
            position={[car.lat as number, car.lng as number]}
            icon={makePin(index + 1)}
          >
            <Popup>
              <div className="min-w-40 p-1">
                <Link href={`/cars/${car.id}`} className="text-sm font-bold text-slate-900 hover:text-amber-600">
                  {car.name}
                </Link>
                <div className="text-xs text-slate-500">{car.city}</div>
                <div className="mt-1 text-sm font-bold text-amber-700">{formatPrice(car.dailyPrice)}/day</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}