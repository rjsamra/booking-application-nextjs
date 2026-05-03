import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function HotelPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { rooms: { orderBy: { pricePerNight: "asc" } } },
  });

  if (!hotel) {
    notFound();
  }

  const today = new Date();
  const defaultCheckIn = addDaysISO(today, 7);
  const defaultCheckOut = addDaysISO(today, 9);

  const rooms = hotel.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    maxGuests: r.maxGuests,
    pricePerNight: r.pricePerNight.toString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
      >
        ← All hotels
      </Link>

      <article className="mt-6">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800">
          {hotel.imageUrl ? (
            <Image
              src={hotel.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          ) : null}
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {hotel.name}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {hotel.city}, {hotel.country}
        </p>
        {hotel.description ? (
          <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {hotel.description}
          </p>
        ) : null}
      </article>

      {rooms.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          No rooms are listed for this property yet.
        </p>
      ) : (
        <BookingForm
          hotelId={hotel.id}
          rooms={rooms}
          defaultCheckIn={defaultCheckIn}
          defaultCheckOut={defaultCheckOut}
        />
      )}
    </div>
  );
}
