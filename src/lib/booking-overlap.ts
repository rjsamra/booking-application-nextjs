import { prisma } from "@/lib/prisma";

/** Count overlapping non-cancelled bookings for a room, excluding one booking id (for updates). */
export async function countOverlappingBookings(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<number> {
  return prisma.booking.count({
    where: {
      roomId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { not: "CANCELLED" },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
}

export function nightCount(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}
