"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HotelRow = {
  id: string;
  name: string;
  city: string;
  country: string;
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<HotelRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/hotels", { credentials: "include" });
      const body = (await res.json()) as {
        data?: HotelRow[];
        error?: { message?: string };
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load hotels.");
        return;
      }
      setHotels(body.data ?? []);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hotels
        </h1>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 dark:hover:bg-teal-500"
        >
          New hotel
        </Link>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      {!hotels && !error ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : null}

      {hotels?.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          No hotels yet. Create one to get started.
        </p>
      ) : null}

      {hotels && hotels.length > 0 ? (
        <ul className="mt-8 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {hotels.map((h) => (
            <li key={h.id}>
              <Link
                href={`/admin/hotels/${h.id}/edit`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
              >
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {h.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                    {h.city}, {h.country}
                  </span>
                </span>
                <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  Edit →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
