"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  hotelCount: number;
  roomCount: number;
  bookingCount: number;
  bookingsByStatus: {
    PENDING: number;
    CONFIRMED: number;
    CANCELLED: number;
  };
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      const body = (await res.json()) as {
        data?: Stats;
        error?: { message?: string };
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load stats.");
        return;
      }
      if (body.data) setStats(body.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Overview
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Manage hotels and reservations from the sidebar.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      {!stats && !error ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : null}

      {stats ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Hotels
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.hotelCount}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Rooms
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.roomCount}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Bookings
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.bookingCount}
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Pending {stats.bookingsByStatus.PENDING} · Confirmed{" "}
              {stats.bookingsByStatus.CONFIRMED} · Cancelled{" "}
              {stats.bookingsByStatus.CANCELLED}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/hotels"
          className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Manage hotels
        </Link>
        <Link
          href="/admin/bookings"
          className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Manage bookings
        </Link>
      </div>
    </div>
  );
}
