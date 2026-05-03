import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-json";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { BOOKING_NOTE_MAX_LENGTH } from "@/lib/booking-notes";
import { countOverlappingBookings, nightCount } from "@/lib/booking-overlap";
import { z } from "zod";

export const dynamic = "force-dynamic";

const noteField = z
  .string()
  .max(
    BOOKING_NOTE_MAX_LENGTH,
    `Notes must be at most ${BOOKING_NOTE_MAX_LENGTH.toLocaleString()} characters.`,
  );

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestName: z.string().trim().min(1),
  guestEmail: z.string().trim().email(),
  internalNotes: noteField.optional(),
  guestSpecialRequests: noteField.optional(),
});

function parseDateOnly(value: string): Date | null {
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ bookingId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { bookingId } = await ctx.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: {
        include: {
          hotel: { select: { id: true, name: true, city: true, country: true } },
        },
      },
    },
  });
  if (!booking) return jsonError(404, "NOT_FOUND", "Booking not found.");

  return jsonOk({
    id: booking.id,
    roomId: booking.roomId,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    totalPrice: booking.totalPrice.toString(),
    status: booking.status,
    internalNotes: booking.internalNotes,
    guestSpecialRequests: booking.guestSpecialRequests,
    createdAt: booking.createdAt.toISOString(),
    room: {
      id: booking.room.id,
      name: booking.room.name,
      pricePerNight: booking.room.pricePerNight.toString(),
      hotel: booking.room.hotel,
    },
  });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ bookingId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { bookingId } = await ctx.params;

  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Booking not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "INVALID_JSON", "Request body must be JSON.");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const parts = [
      ...flat.formErrors,
      ...Object.values(flat.fieldErrors).flat().filter(Boolean),
    ];
    return jsonError(
      422,
      "VALIDATION_ERROR",
      parts.length ? parts.join(" ") : "Validation failed.",
    );
  }

  const patch = parsed.data;
  const checkInParsed = parseDateOnly(patch.checkIn);
  const checkOutParsed = parseDateOnly(patch.checkOut);
  if (!checkInParsed) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid check-in date.");
  }
  if (!checkOutParsed) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid check-out date.");
  }
  const checkIn = checkInParsed;
  const checkOut = checkOutParsed;

  if (checkOut <= checkIn) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Check-out must be after check-in.",
    );
  }

  if (patch.status !== "CANCELLED") {
    const overlaps = await countOverlappingBookings(
      existing.roomId,
      checkIn,
      checkOut,
      bookingId,
    );
    if (overlaps > 0) {
      return jsonError(
        422,
        "OVERLAP",
        "Those dates overlap another active booking for this room.",
      );
    }
  }

  const nights = nightCount(checkIn, checkOut);
  if (nights < 1) {
    return jsonError(422, "VALIDATION_ERROR", "Book at least one night.");
  }

  const nightly = new Prisma.Decimal(existing.room.pricePerNight.toString());
  const totalPrice = nightly.mul(nights);

  const data: {
    status: (typeof patch)["status"];
    checkIn: Date;
    checkOut: Date;
    totalPrice: Prisma.Decimal;
    guestName: string;
    guestEmail: string;
    internalNotes?: string | null;
    guestSpecialRequests?: string | null;
  } = {
    status: patch.status,
    checkIn,
    checkOut,
    totalPrice,
    guestName: patch.guestName,
    guestEmail: patch.guestEmail,
  };

  if (patch.internalNotes !== undefined) {
    const t = patch.internalNotes.trim();
    data.internalNotes = t === "" ? null : t;
  }
  if (patch.guestSpecialRequests !== undefined) {
    const t = patch.guestSpecialRequests.trim();
    data.guestSpecialRequests = t === "" ? null : t;
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data,
    include: {
      room: {
        include: {
          hotel: { select: { id: true, name: true, city: true, country: true } },
        },
      },
    },
  });

  return jsonOk({
    id: booking.id,
    roomId: booking.roomId,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    totalPrice: booking.totalPrice.toString(),
    status: booking.status,
    internalNotes: booking.internalNotes,
    guestSpecialRequests: booking.guestSpecialRequests,
    createdAt: booking.createdAt.toISOString(),
    room: {
      id: booking.room.id,
      name: booking.room.name,
      pricePerNight: booking.room.pricePerNight.toString(),
      hotel: booking.room.hotel,
    },
  });
}
