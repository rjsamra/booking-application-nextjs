import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isDatabaseUnavailable(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "ECONNREFUSED" || error.code === "P1001")
  );
}

function DbUnavailableMessage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Staybook
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Cannot reach PostgreSQL. Start the database with{" "}
          <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-sm dark:bg-amber-900/60">
            npm run db:up
          </code>
          , then run{" "}
          <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-sm dark:bg-amber-900/60">
            npm run db:setup
          </code>{" "}
          to apply migrations and load sample hotels.
        </p>
      </main>
    </div>
  );
}

export default async function Home() {
  let hotels;
  try {
    hotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
      include: {
        rooms: {
          select: { pricePerNight: true },
          orderBy: { pricePerNight: "asc" },
          take: 1,
        },
      },
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
    return <DbUnavailableMessage />;
  }

  const currency = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Staybook
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Simple hotel booking
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Find your next stay
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Browse hotels, pick a room, and reserve your dates in a few steps.
          </p>
        </div>

        {hotels.length === 0 ? (
          <p className="mt-12 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No hotels yet. Run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
              npm run db:setup
            </code>{" "}
            to start PostgreSQL, apply migrations, and load sample listings.
          </p>
        ) : (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {hotels.map((hotel) => {
              const from = hotel.rooms[0]?.pricePerNight;
              return (
                <li key={hotel.id}>
                  <Link
                    href={`/hotels/${hotel.id}`}
                    className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-teal-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-500/30"
                  >
                    <div className="relative aspect-[16/10] bg-zinc-200 dark:bg-zinc-800">
                      {hotel.imageUrl ? (
                        <Image
                          src={hotel.imageUrl}
                          alt=""
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {hotel.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {hotel.city}, {hotel.country}
                      </p>
                      {hotel.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {hotel.description}
                        </p>
                      ) : null}
                      {from != null ? (
                        <p className="mt-4 text-sm font-medium text-teal-800 dark:text-teal-300">
                          From {currency.format(Number(from))}{" "}
                          <span className="font-normal text-zinc-500 dark:text-zinc-500">
                            / night
                          </span>
                        </p>
                      ) : null}
                      <span className="mt-4 inline-flex text-sm font-semibold text-teal-700 group-hover:text-teal-800 dark:text-teal-400 dark:group-hover:text-teal-300">
                        View rooms →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
