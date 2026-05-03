"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string | null;
  imageUrl: string | null;
};

export default function EditHotelPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = String(params.hotelId ?? "");
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/hotels/${hotelId}`, {
        credentials: "include",
      });
      const body = (await res.json()) as {
        data?: Hotel;
        error?: { message?: string };
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error?.message ?? "Hotel not found.");
        return;
      }
      setHotel(body.data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hotel) return;
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || null,
      imageUrl: String(fd.get("imageUrl") ?? "").trim() || null,
    };
    const res = await fetch(`/api/admin/hotels/${hotelId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { error?: { message?: string } };
    setPending(false);
    if (!res.ok) {
      setError(body.error?.message ?? "Update failed.");
      return;
    }
    router.refresh();
    setHotel((h) => (h ? { ...h, ...payload } : h));
  }

  async function handleDelete() {
    if (!confirm("Delete this hotel and all its rooms and bookings?")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/hotels/${hotelId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleting(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? "Delete failed.");
      return;
    }
    router.push("/admin/hotels");
  }

  if (error && !hotel) {
    return (
      <div>
        <Link href="/admin/hotels" className="text-sm text-teal-700 dark:text-teal-400">
          ← Hotels
        </Link>
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!hotel) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div>
      <Link
        href="/admin/hotels"
        className="text-sm font-medium text-teal-700 dark:text-teal-400"
      >
        ← Hotels
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Edit hotel
      </h1>
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
          </label>
          <input
            name="name"
            required
            defaultValue={hotel.name}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            City
          </label>
          <input
            name="city"
            required
            defaultValue={hotel.city}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Country
          </label>
          <input
            name="country"
            required
            defaultValue={hotel.country}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={hotel.description ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Image URL
          </label>
          <input
            name="imageUrl"
            type="url"
            defaultValue={hotel.imageUrl ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-zinc-900 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            {deleting ? "Deleting…" : "Delete hotel"}
          </button>
        </div>
      </form>
    </div>
  );
}
