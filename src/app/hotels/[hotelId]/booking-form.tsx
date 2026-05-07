"use client";

import { BOOKING_NOTE_MAX_LENGTH } from "@/lib/booking-notes";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { BookingFormState } from "./actions";
import { createBooking } from "./actions";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  maxGuests: number;
  pricePerNight: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Booking…" : "Confirm booking"}
    </button>
  );
}

export function BookingForm({
  hotelId,
  rooms,
  defaultCheckIn,
  defaultCheckOut,
}: {
  hotelId: string;
  rooms: RoomOption[];
  defaultCheckIn: string;
  defaultCheckOut: string;
}) {
  const [state, formAction] = useActionState<BookingFormState, FormData>(
    createBooking,
    null,
  );

  return (
    <form
      action={formAction}
      className="mt-10 w-full space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="hotelId" value={hotelId} />
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Book a stay
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Check-in
          <input
            type="date"
            name="checkIn"
            required
            defaultValue={defaultCheckIn}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Check-out
          <input
            type="date"
            name="checkOut"
            required
            defaultValue={defaultCheckOut}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Room
        </legend>
        <div className="space-y-2">
          {rooms.map((room) => (
            <label
              key={room.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/80 dark:border-zinc-800 dark:has-[:checked]:border-teal-500 dark:has-[:checked]:bg-teal-950/40"
            >
              <input
                type="radio"
                name="roomId"
                value={room.id}
                required
                className="mt-1"
              />
              <span className="flex-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {room.name}
                </span>
                {room.description ? (
                  <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
                    {room.description}
                  </span>
                ) : null}
                <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-500">
                  Up to {room.maxGuests} guests ·{" "}
                  {usd.format(Number(room.pricePerNight))}{" "}
                  / night
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Full name
          <input
            type="text"
            name="guestName"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            name="guestEmail"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Special requests (optional)
          <textarea
            name="guestSpecialRequests"
            rows={4}
            maxLength={BOOKING_NOTE_MAX_LENGTH}
            placeholder="Accessibility, late arrival, celebrations…"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          Tell us about accessibility needs, arrival time, or celebrations.
          We’ll do our best to accommodate — specifics may be subject to
          availability and are not a guarantee of a particular room.
        </p>
      </div>

      {state?.error ? (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
