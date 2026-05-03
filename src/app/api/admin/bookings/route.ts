import type { BookingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-json";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);

function parseDateParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  const skip = (page - 1) * pageSize;

  const statusRaw = searchParams.get("status");
  const hotelId = searchParams.get("hotelId")?.trim() || undefined;
  const roomId = searchParams.get("roomId")?.trim() || undefined;
  const checkInFrom = parseDateParam(searchParams.get("checkInFrom"));
  const checkInTo = parseDateParam(searchParams.get("checkInTo"));

  let statusEquals: BookingStatus | undefined;
  if (statusRaw) {
    const s = statusEnum.safeParse(statusRaw);
    if (!s.success) {
      return jsonError(422, "VALIDATION_ERROR", "Invalid status filter.");
    }
    statusEquals = s.data;
  }

  const where = {
    ...(statusEquals ? { status: statusEquals } : {}),
    ...(roomId ? { roomId } : {}),
    ...(hotelId ? { room: { hotelId } } : {}),
    ...(checkInFrom || checkInTo
      ? {
          checkIn: {
            ...(checkInFrom ? { gte: checkInFrom } : {}),
            ...(checkInTo ? { lte: checkInTo } : {}),
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            hotelId: true,
            hotel: {
              select: { id: true, name: true, city: true, country: true },
            },
          },
        },
      },
    }),
  ]);

  const data = rows.map((b) => ({
    id: b.id,
    roomId: b.roomId,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    totalPrice: b.totalPrice.toString(),
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    room: b.room,
  }));

  return jsonOk({
    items: data,
    page,
    pageSize,
    total,
  });
}
