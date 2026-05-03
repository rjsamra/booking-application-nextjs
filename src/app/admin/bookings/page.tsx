"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BookingItem = {
  id: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  status: string;
  totalPrice: string;
  room: {
    id: string;
    name: string;
    hotel: { id: string; name: string; city: string; country: string };
  };
};

type ListResponse = {
  items: BookingItem[];
  page: number;
  pageSize: number;
  total: number;
};

export default function AdminBookingsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", "15");
    if (status) qs.set("status", status);
    (async () => {
      const res = await fetch(`/api/admin/bookings?${qs}`, {
        credentials: "include",
      });
      const body = (await res.json()) as {
        data?: ListResponse;
        error?: { message?: string };
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load bookings.");
        return;
      }
      setData(body.data ?? null);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, status]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Bookings
      </h1>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="status"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      {!data && !error ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          No bookings match your filters.
        </p>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Hotel / Room</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.items.map((b) => (
                  <tr key={b.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.guestName}</div>
                      <div className="text-xs text-zinc-500">{b.guestEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.room.hotel.name}</div>
                      <div className="text-xs text-zinc-500">{b.room.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.checkIn} → {b.checkOut}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">${b.totalPrice}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-600"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-600"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
