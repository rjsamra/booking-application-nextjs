import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-json";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchHotelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: z.string().trim().nullable().optional(),
});

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ hotelId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { hotelId } = await ctx.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });
  if (!hotel) return jsonError(404, "NOT_FOUND", "Hotel not found.");
  return jsonOk(hotel);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ hotelId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { hotelId } = await ctx.params;

  const existing = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Hotel not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "INVALID_JSON", "Request body must be JSON.");
  }

  const parsed = patchHotelSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", parsed.error.message);
  }

  const patch = parsed.data;
  if (patch.imageUrl && patch.imageUrl.length > 0 && !URL.canParse(patch.imageUrl)) {
    return jsonError(422, "VALIDATION_ERROR", "imageUrl must be a valid URL.");
  }

  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      ...(patch.name != null ? { name: patch.name } : {}),
      ...(patch.city != null ? { city: patch.city } : {}),
      ...(patch.country != null ? { country: patch.country } : {}),
      ...(patch.description !== undefined
        ? {
            description:
              patch.description == null || patch.description === ""
                ? null
                : patch.description,
          }
        : {}),
      ...(patch.imageUrl !== undefined
        ? {
            imageUrl:
              patch.imageUrl == null || patch.imageUrl === ""
                ? null
                : patch.imageUrl,
          }
        : {}),
    },
  });
  return jsonOk(hotel);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ hotelId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { hotelId } = await ctx.params;

  const existing = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Hotel not found.");

  await prisma.hotel.delete({ where: { id: hotelId } });
  return jsonOk({ id: hotelId, deleted: true });
}
