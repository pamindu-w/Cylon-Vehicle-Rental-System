"use client";

import { useState } from "react";
import { imageUrl } from "@/lib/api";

export default function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-300">
        <svg className="h-20 w-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M5 11l1.5-4.5a1 1 0 01.95-.7h9.1a1 1 0 01.95.7L19 11" strokeLinecap="round" />
          <path d="M3.5 11h17v5h-17z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="16.5" r="1.8" />
          <circle cx="17" cy="16.5" r="1.8" />
        </svg>
      </div>
    );
  }

  const current = Math.min(active, images.length - 1);
  return (
    <div>
      <img
        src={imageUrl(images[current])}
        alt={`${alt} — photo ${current + 1}`}
        className="aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover shadow-sm"
      />
      {images.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current ? "border-amber-600" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <img src={imageUrl(img)} alt="" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}