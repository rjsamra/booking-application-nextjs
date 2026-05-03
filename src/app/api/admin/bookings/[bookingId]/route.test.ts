import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonError } from "@/lib/api-json";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { GET, PATCH } from "./route";

const adminOk = {
  session: { user: { id: "u1", role: "ADMIN" as const } },
};

const bookingId = "booking-1";
const ctx = { params: Promise.resolve({ bookingId }) };

function getRequest() {
  return new Request(
    `http://localhost/api/admin/bookings/${bookingId}`,
  );
}

function patchRequest(body: unknown) {
  return new Request(
    `http://localhost/api/admin/bookings/${bookingId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

const existingBooking = {
  id: bookingId,
  roomId: "room-1",
  checkIn: new Date("2026-03-01T00:00:00.000Z"),
  checkOut: new Date("2026-03-05T00:00:00.000Z"),
  guestName: "Prior",
  guestEmail: "prior@example.com",
  totalPrice: { toString: () => "400.00" },
  status: "CONFIRMED" as const,
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  room: {
    id: "room-1",
    name: "Deluxe",
    hotelId: "h1",
    pricePerNight: { toString: () => "100.00" },
  },
};

const updatedBooking = {
  ...existingBooking,
  checkIn: new Date("2026-06-01T00:00:00.000Z"),
  checkOut: new Date("2026-06-05T00:00:00.000Z"),
  guestName: "Bob",
  guestEmail: "bob@example.com",
  status: "CONFIRMED" as const,
  totalPrice: { toString: () => "400.00" },
  room: {
    id: "room-1",
    name: "Deluxe",
    pricePerNight: { toString: () => "100.00" },
    hotel: {
      id: "h1",
      name: "Grand",
      city: "Lyon",
      country: "FR",
    },
  },
};

describe("GET /api/admin/bookings/[bookingId]", () => {
  const findUnique = vi.mocked(prisma.booking.findUnique);
  const guard = vi.mocked(requireAdmin);

  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockResolvedValue(adminOk as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns guard response when requireAdmin fails", async () => {
    guard.mockResolvedValueOnce(
      jsonError(401, "UNAUTHORIZED", "Authentication required."),
    );
    const res = await GET(getRequest(), ctx);
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when booking is missing", async () => {
    findUnique.mockResolvedValueOnce(null);
    const res = await GET(getRequest(), ctx);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Booking not found." },
    });
  });

  it("returns 200 jsonOk with room and hotel shape", async () => {
    findUnique.mockResolvedValueOnce({
      id: bookingId,
      roomId: "room-1",
      checkIn: new Date("2026-04-01T00:00:00.000Z"),
      checkOut: new Date("2026-04-04T00:00:00.000Z"),
      guestName: "Ada",
      guestEmail: "ada@example.com",
      totalPrice: { toString: () => "300.00" },
      status: "PENDING",
      createdAt: new Date("2026-03-20T08:00:00.000Z"),
      room: {
        id: "room-1",
        name: "Standard",
        pricePerNight: { toString: () => "99.50" },
        hotel: {
          id: "h1",
          name: "Inn",
          city: "Nice",
          country: "FR",
        },
      },
    } as never);

    const res = await GET(getRequest(), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: {
        id: bookingId,
        roomId: "room-1",
        checkIn: "2026-04-01",
        checkOut: "2026-04-04",
        guestName: "Ada",
        guestEmail: "ada@example.com",
        totalPrice: "300.00",
        status: "PENDING",
        createdAt: "2026-03-20T08:00:00.000Z",
        room: {
          id: "room-1",
          name: "Standard",
          pricePerNight: "99.50",
          hotel: {
            id: "h1",
            name: "Inn",
            city: "Nice",
            country: "FR",
          },
        },
      },
    });
  });
});

describe("PATCH /api/admin/bookings/[bookingId]", () => {
  const findUnique = vi.mocked(prisma.booking.findUnique);
  const update = vi.mocked(prisma.booking.update);
  const count = vi.mocked(prisma.booking.count);
  const guard = vi.mocked(requireAdmin);

  const validBody = {
    status: "CONFIRMED" as const,
    checkIn: "2026-06-01",
    checkOut: "2026-06-05",
    guestName: "Bob",
    guestEmail: "bob@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockResolvedValue(adminOk as never);
    findUnique.mockResolvedValue(existingBooking as never);
    count.mockResolvedValue(0);
    update.mockResolvedValue(updatedBooking as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not call findUnique when requireAdmin fails", async () => {
    guard.mockResolvedValueOnce(
      jsonError(403, "FORBIDDEN", "Admin access required."),
    );
    const res = await PATCH(patchRequest(validBody), ctx);
    expect(res.status).toBe(403);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when booking is missing", async () => {
    findUnique.mockResolvedValueOnce(null);
    const res = await PATCH(patchRequest(validBody), ctx);
    expect(res.status).toBe(404);
    expect(count).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 422 INVALID_JSON when body is not JSON", async () => {
    const req = new Request(
      `http://localhost/api/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json{",
      },
    );
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be JSON.",
      },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 422 VALIDATION_ERROR when Zod validation fails", async () => {
    const res = await PATCH(
      patchRequest({
        status: "CONFIRMED",
        checkIn: "2026-06-01",
        checkOut: "2026-06-05",
        guestName: "Bob",
        guestEmail: "not-an-email",
      }),
      ctx,
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(count).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 422 when check-out is on or before check-in", async () => {
    const res = await PATCH(
      patchRequest({
        ...validBody,
        checkIn: "2026-06-10",
        checkOut: "2026-06-10",
      }),
      ctx,
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Check-out must be after check-in.",
      },
    });
    expect(count).not.toHaveBeenCalled();
  });

  it("returns 422 OVERLAP when countOverlappingBookings finds overlaps", async () => {
    count.mockResolvedValueOnce(2);
    const res = await PATCH(patchRequest(validBody), ctx);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: {
        code: "OVERLAP",
        message:
          "Those dates overlap another active booking for this room.",
      },
    });
    expect(count).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("skips overlap count when status is CANCELLED and still updates", async () => {
    const cancelledUpdate = {
      ...updatedBooking,
      status: "CANCELLED" as const,
    };
    update.mockResolvedValueOnce(cancelledUpdate as never);

    const res = await PATCH(
      patchRequest({ ...validBody, status: "CANCELLED" }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(count).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect((await res.json()).data.status).toBe("CANCELLED");
  });

  it("updates booking and returns jsonOk response shape", async () => {
    const res = await PATCH(patchRequest(validBody), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: {
        id: bookingId,
        roomId: "room-1",
        checkIn: "2026-06-01",
        checkOut: "2026-06-05",
        guestName: "Bob",
        guestEmail: "bob@example.com",
        totalPrice: "400.00",
        status: "CONFIRMED",
        createdAt: "2026-02-01T00:00:00.000Z",
        room: {
          id: "room-1",
          name: "Deluxe",
          pricePerNight: "100.00",
          hotel: {
            id: "h1",
            name: "Grand",
            city: "Lyon",
            country: "FR",
          },
        },
      },
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: bookingId },
      data: expect.objectContaining({
        status: "CONFIRMED",
        guestName: "Bob",
        guestEmail: "bob@example.com",
      }),
      include: {
        room: {
          include: {
            hotel: { select: { id: true, name: true, city: true, country: true } },
          },
        },
      },
    });
    const updateArg = update.mock.calls[0]![0]!;
    expect(updateArg.data.checkIn).toEqual(
      new Date("2026-06-01T00:00:00.000Z"),
    );
    expect(updateArg.data.checkOut).toEqual(
      new Date("2026-06-05T00:00:00.000Z"),
    );
    expect(updateArg.data.totalPrice?.toString?.()).toBe("400");
  });
});
