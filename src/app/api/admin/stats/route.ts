import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-json";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const [
    hotelCount,
    roomCount,
    bookingCount,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
  ] = await Promise.all([
    prisma.hotel.count(),
    prisma.room.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
  ]);

  return jsonOk({
    hotelCount,
    roomCount,
    bookingCount,
    bookingsByStatus: {
      PENDING: pendingBookings,
      CONFIRMED: confirmedBookings,
      CANCELLED: cancelledBookings,
    },
  });
}
