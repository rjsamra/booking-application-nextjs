import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-json";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createHotelSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  country: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
});

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return jsonOk(hotels);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "INVALID_JSON", "Request body must be JSON.");
  }

  const parsed = createHotelSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", parsed.error.flatten().formErrors.join(" "));
  }

  const { name, city, country, description, imageUrl } = parsed.data;
  if (imageUrl && imageUrl.length > 0 && !URL.canParse(imageUrl)) {
    return jsonError(422, "VALIDATION_ERROR", "imageUrl must be a valid URL.");
  }
  const hotel = await prisma.hotel.create({
    data: {
      name,
      city,
      country,
      description: description || null,
      imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : null,
    },
  });
  return jsonOk(hotel, 201);
}
