"use client";

import { BOOKING_NOTE_MAX_LENGTH } from "@/lib/booking-notes";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BookingDetail = {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  totalPrice: string;
  status: string;
  internalNotes: string | null;
  guestSpecialRequests: string | null;
  room: {
    id: string;
    name: string;
    pricePerNight: string;
    hotel: { id: string; name: string; city: string; country: string };
  };
};

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = String(params.bookingId ?? "");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        credentials: "include",
      });
      const body = (await res.json()) as {
        data?: BookingDetail;
        error?: { message?: string };
      };
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error?.message ?? "Booking not found.");
        return;
      }
      setBooking(body.data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!booking) return;
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      guestName: String(fd.get("guestName") ?? "").trim(),
      guestEmail: String(fd.get("guestEmail") ?? "").trim(),
      status: String(fd.get("status") ?? "").trim(),
      checkIn: String(fd.get("checkIn") ?? "").trim(),
      checkOut: String(fd.get("checkOut") ?? "").trim(),
      guestSpecialRequests: String(fd.get("guestSpecialRequests") ?? ""),
      internalNotes: String(fd.get("internalNotes") ?? ""),
    };
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as {
      data?: BookingDetail;
      error?: { message?: string };
    };
    setPending(false);
    if (!res.ok) {
      setError(body.error?.message ?? "Update failed.");
      return;
    }
    if (body.data) setBooking(body.data);
    router.refresh();
  }

  if (error && !booking) {
    return (
      <div>
        <Link href="/admin/bookings" className="text-sm text-teal-700 dark:text-teal-400">
          ← Bookings
        </Link>
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="text-sm font-medium text-teal-700 dark:text-teal-400"
      >
        ← Bookings
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Edit booking
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {booking.room.hotel.name} · {booking.room.name}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full space-y-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <section className="space-y-2 border-b border-zinc-100 pb-6 dark:border-zinc-800/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Guest special requests
          </h2>
          {!booking.guestSpecialRequests ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The guest did not submit special requests on the booking form.
            </p>
          ) : null}
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="sr-only">Guest special requests</span>
            <textarea
              key={`g-${booking.id}-${booking.guestSpecialRequests ?? ""}`}
              name="guestSpecialRequests"
              rows={4}
              maxLength={BOOKING_NOTE_MAX_LENGTH}
              defaultValue={booking.guestSpecialRequests ?? ""}
              placeholder="Guest-submitted requests; staff may correct typos."
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </section>

        <section className="space-y-2 border-b border-zinc-100 pb-6 dark:border-zinc-800/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Internal notes
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Staff-only — never shown to guests or on the public booking site.
          </p>
          {!booking.internalNotes ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No internal notes yet. Add context for your team.
            </p>
          ) : null}
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="sr-only">Internal notes</span>
            <textarea
              key={`i-${booking.id}-${booking.internalNotes ?? ""}`}
              name="internalNotes"
              rows={4}
              maxLength={BOOKING_NOTE_MAX_LENGTH}
              defaultValue={booking.internalNotes ?? ""}
              placeholder="Handoffs, disputes, operational context…"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </section>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Booking details
          </h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </label>
          <select
            name="status"
            defaultValue={booking.status}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Check-in
            </label>
            <input
              name="checkIn"
              type="date"
              required
              defaultValue={booking.checkIn}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Check-out
            </label>
            <input
              name="checkOut"
              type="date"
              required
              defaultValue={booking.checkOut}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Guest name
          </label>
          <input
            name="guestName"
            required
            defaultValue={booking.guestName}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Guest email
          </label>
          <input
            name="guestEmail"
            type="email"
            required
            defaultValue={booking.guestEmail}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Total (recalculated when dates change):{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            ${booking.totalPrice}
          </span>{" "}
          · nightly ${booking.room.pricePerNight}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        </div>
      </form>
    </div>
  );
}
