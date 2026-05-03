"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type BookingFormState = { error?: string } | null;

function parseDateOnly(value: string, label: string): Date | BookingFormState {
  if (!value.trim()) {
    return { error: `Please choose ${label.toLowerCase()}.` };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `${label} must be a valid date.` };
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return { error: `${label} is not a valid calendar date.` };
  }
  return d;
}

function nightCount(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

export async function createBooking(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const hotelId = String(formData.get("hotelId") ?? "").trim();
  const roomId = String(formData.get("roomId") ?? "").trim();
  const checkInRaw = String(formData.get("checkIn") ?? "").trim();
  const checkOutRaw = String(formData.get("checkOut") ?? "").trim();
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();

  if (!hotelId || !roomId) {
    return { error: "Please choose a room." };
  }
  if (!guestName || !guestEmail) {
    return { error: "Please enter your name and email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return { error: "Please enter a valid email address." };
  }

  const checkInParsed = parseDateOnly(checkInRaw, "Check-in");
  if (checkInParsed instanceof Date === false) return checkInParsed;
  const checkOutParsed = parseDateOnly(checkOutRaw, "Check-out");
  if (checkOutParsed instanceof Date === false) return checkOutParsed;

  const checkIn = checkInParsed;
  const checkOut = checkOutParsed;

  if (checkOut <= checkIn) {
    return { error: "Check-out must be after check-in." };
  }

  const nights = nightCount(checkIn, checkOut);
  if (nights < 1) {
    return { error: "Book at least one night." };
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
  });
  if (!room) {
    return { error: "That room is not available for this hotel." };
  }

  const conflicts = await prisma.booking.count({
    where: {
      roomId: room.id,
      status: { not: "CANCELLED" },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (conflicts > 0) {
    return {
      error: "Those dates overlap another booking for this room. Try different dates.",
    };
  }

  const nightly = new Prisma.Decimal(room.pricePerNight.toString());
  const total = nightly.mul(nights);

  const booking = await prisma.booking.create({
    data: {
      roomId: room.id,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      totalPrice: total,
      status: "CONFIRMED",
    },
  });

  redirect(`/bookings/${booking.id}`);
}
