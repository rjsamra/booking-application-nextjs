import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(d);
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: {
        include: { hotel: true },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const total = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(booking.totalPrice));

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400">
          Booking confirmed
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          You are set for {booking.room.hotel.name}
        </h1>
        <dl className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-500">Room</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
              {booking.room.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-500">Check-in</dt>
            <dd className="text-right">{formatDate(booking.checkIn)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-500">Check-out</dt>
            <dd className="text-right">{formatDate(booking.checkOut)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-500">Guest</dt>
            <dd className="text-right">{booking.guestName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-500">Email</dt>
            <dd className="break-all text-right">{booking.guestEmail}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <dt className="text-zinc-500 dark:text-zinc-500">Total</dt>
            <dd className="text-right text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {total}
            </dd>
          </div>
        </dl>
        <Link
          href="/"
          className="mt-8 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Back to hotels
        </Link>
      </div>
    </div>
  );
}
