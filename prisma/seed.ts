import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

/** Mock catalog: hotels and nested rooms for local / demo databases. */
const MOCK_HOTELS = [
  {
    name: "Harborline Hotel",
    city: "Portland",
    country: "United States",
    description:
      "Waterfront views, quiet rooms, and a short walk to the old town market.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    rooms: [
      {
        name: "Harbor Queen",
        description: "Queen bed, harbor view, rainfall shower.",
        maxGuests: 2,
        pricePerNight: 189,
      },
      {
        name: "Family Corner Suite",
        description: "Two queens, sitting area, ideal for small families.",
        maxGuests: 4,
        pricePerNight: 259,
      },
      {
        name: "Harbor Twin",
        description: "Two twin beds, city side, compact and bright.",
        maxGuests: 2,
        pricePerNight: 149,
      },
    ],
  },
  {
    name: "Cedar House Inn",
    city: "Banff",
    country: "Canada",
    description:
      "Wood-fired lobby, mountain air, and trails that start at the back door.",
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
    rooms: [
      {
        name: "Alpine King",
        description: "King bed, balcony, heated floors.",
        maxGuests: 2,
        pricePerNight: 220,
      },
      {
        name: "Loft Studio",
        description: "Open plan with kitchenette and workspace.",
        maxGuests: 2,
        pricePerNight: 175,
      },
    ],
  },
  {
    name: "City Garden Suites",
    city: "Tokyo",
    country: "Japan",
    description:
      "Shinjuku-adjacent suites with tatami nook, pocket Wi‑Fi, and late checkout.",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    rooms: [
      {
        name: "Garden Deluxe",
        description: "King, small garden terrace, soaking tub.",
        maxGuests: 2,
        pricePerNight: 285,
      },
      {
        name: "Family Tatami",
        description: "Two beds plus futon space for children.",
        maxGuests: 5,
        pricePerNight: 310,
      },
    ],
  },
  {
    name: "Palm Court Resort",
    city: "Barcelona",
    country: "Spain",
    description:
      "Courtyard pool, rooftop tapas bar, ten minutes to the beach by tram.",
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
    rooms: [
      {
        name: "Poolside Double",
        description: "Ground floor, direct pool access.",
        maxGuests: 2,
        pricePerNight: 198,
      },
      {
        name: "Rooftop Junior Suite",
        description: "Panoramic city view, separate living area.",
        maxGuests: 3,
        pricePerNight: 340,
      },
      {
        name: "Standard Twin",
        description: "Courtyard view, quiet wing.",
        maxGuests: 2,
        pricePerNight: 142,
      },
    ],
  },
] as const;

function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  // Auth: idempotent; re-hash demo password each seed so login is always "password".
  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    create: { code: "ADMIN", label: "Administrator" },
    update: { label: "Administrator" },
  });

  const passwordHash = await bcrypt.hash("password", 10);
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    create: {
      email: "test@example.com",
      passwordHash,
      roleId: adminRole.id,
    },
    update: { passwordHash, roleId: adminRole.id },
  });

  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();

  for (const hotel of MOCK_HOTELS) {
    await prisma.hotel.create({
      data: {
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        description: hotel.description,
        imageUrl: hotel.imageUrl,
        rooms: {
          create: hotel.rooms.map((r) => ({
            name: r.name,
            description: r.description,
            maxGuests: r.maxGuests,
            pricePerNight: r.pricePerNight,
          })),
        },
      },
    });
  }

  const harbor = await prisma.hotel.findFirst({
    where: { name: "Harborline Hotel" },
    include: { rooms: true },
  });

  const harborQueen = harbor?.rooms.find((r) => r.name === "Harbor Queen");
  if (harborQueen) {
    const nightly = Number(harborQueen.pricePerNight);
    const t0 = addUtcDays(new Date(), 120);
    const t1 = addUtcDays(new Date(), 123);
    const t2 = addUtcDays(new Date(), 200);
    const t3 = addUtcDays(new Date(), 202);

    await prisma.booking.create({
      data: {
        roomId: harborQueen.id,
        checkIn: t0,
        checkOut: t1,
        guestName: "Alex Demo",
        guestEmail: "alex.demo@example.com",
        totalPrice: new Prisma.Decimal((nightly * 3).toFixed(2)),
        status: "CONFIRMED",
      },
    });

    await prisma.booking.create({
      data: {
        roomId: harborQueen.id,
        checkIn: t2,
        checkOut: t3,
        guestName: "Jamie Cancelled",
        guestEmail: "jamie.cancelled@example.com",
        totalPrice: new Prisma.Decimal((nightly * 2).toFixed(2)),
        status: "CANCELLED",
      },
    });
  }

  const [hotelCount, roomCount, bookingCount, roleCount, userCount] =
    await Promise.all([
      prisma.hotel.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.role.count(),
      prisma.user.count(),
    ]);

  console.log("Seed complete (auth + mock data):", {
    roles: roleCount,
    users: userCount,
    hotels: hotelCount,
    rooms: roomCount,
    bookings: bookingCount,
    adminLogin: "test@example.com / password",
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
