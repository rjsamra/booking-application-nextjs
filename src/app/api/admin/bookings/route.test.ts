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
import { GET } from "./route";

const adminOk = {
  session: { user: { id: "u1", role: "ADMIN" as const } },
};

function listRequest(search = "") {
  return new Request(`http://localhost/api/admin/bookings${search}`);
}

describe("GET /api/admin/bookings", () => {
  const count = vi.mocked(prisma.booking.count);
  const findMany = vi.mocked(prisma.booking.findMany);
  const guard = vi.mocked(requireAdmin);

  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockResolvedValue(adminOk as never);
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAdmin", () => {
    it("returns 401 when guard returns jsonError UNAUTHORIZED", async () => {
      guard.mockResolvedValueOnce(
        jsonError(401, "UNAUTHORIZED", "Authentication required."),
      );
      const res = await GET(listRequest());
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      expect(count).not.toHaveBeenCalled();
      expect(findMany).not.toHaveBeenCalled();
    });

    it("returns 403 when guard returns jsonError FORBIDDEN", async () => {
      guard.mockResolvedValueOnce(
        jsonError(403, "FORBIDDEN", "Admin access required."),
      );
      const res = await GET(listRequest());
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: { code: "FORBIDDEN", message: "Admin access required." },
      });
      expect(count).not.toHaveBeenCalled();
    });
  });

  describe("pagination", () => {
    it("defaults page to 1 and pageSize to 20 when query omitted", async () => {
      const res = await GET(listRequest());
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      const body = await res.json();
      expect(body.data.page).toBe(1);
      expect(body.data.pageSize).toBe(20);
    });

    it("caps pageSize at 100", async () => {
      await GET(listRequest("?pageSize=500"));
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
      const res = await GET(listRequest("?pageSize=500"));
      expect((await res.json()).data.pageSize).toBe(100);
    });

    it("treats page 0 and invalid page as 1", async () => {
      await GET(listRequest("?page=0"));
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      await GET(listRequest("?page=not-a-number"));
      expect(findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ skip: 0 }),
      );
    });

    it("uses default pageSize 20 when pageSize query is 0", async () => {
      await GET(listRequest("?pageSize=0"));
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
    });

    it("uses skip and take for page 3 and pageSize 10", async () => {
      await GET(listRequest("?page=3&pageSize=10"));
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe("filters", () => {
    it("adds where.status for valid status", async () => {
      await GET(listRequest("?status=CONFIRMED"));
      const arg = findMany.mock.calls[0]![0]!;
      expect(arg.where).toMatchObject({ status: "CONFIRMED" });
    });

    it("returns 422 for invalid status and does not call Prisma", async () => {
      const res = await GET(listRequest("?status=INVALID"));
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid status filter.",
        },
      });
      expect(count).not.toHaveBeenCalled();
      expect(findMany).not.toHaveBeenCalled();
    });

    it("adds where.roomId when roomId provided", async () => {
      await GET(listRequest("?roomId=room-1"));
      expect(findMany.mock.calls[0]![0]!.where).toMatchObject({
        roomId: "room-1",
      });
    });

    it("adds room.hotelId filter when hotelId provided", async () => {
      await GET(listRequest("?hotelId=hotel-9"));
      expect(findMany.mock.calls[0]![0]!.where).toMatchObject({
        room: { hotelId: "hotel-9" },
      });
    });

    it("adds checkIn gte/lte for valid checkInFrom and checkInTo", async () => {
      await GET(
        listRequest("?checkInFrom=2026-01-10&checkInTo=2026-01-20"),
      );
      const where = findMany.mock.calls[0]![0]!.where as {
        checkIn: { gte: Date; lte: Date };
      };
      expect(where.checkIn.gte.toISOString()).toBe(
        "2026-01-10T00:00:00.000Z",
      );
      expect(where.checkIn.lte.toISOString()).toBe(
        "2026-01-20T00:00:00.000Z",
      );
    });

    it("omits checkIn filter when date params do not match YYYY-MM-DD", async () => {
      await GET(listRequest("?checkInFrom=01-10-2026"));
      expect(findMany.mock.calls[0]![0]!.where).not.toHaveProperty("checkIn");
    });
  });

  describe("success", () => {
    it("returns 200 jsonOk envelope with mapped items", async () => {
      const checkIn = new Date("2026-02-01T00:00:00.000Z");
      const checkOut = new Date("2026-02-03T00:00:00.000Z");
      const createdAt = new Date("2026-01-15T12:00:00.000Z");
      count.mockResolvedValueOnce(1);
      findMany.mockResolvedValueOnce([
        {
          id: "b1",
          roomId: "r1",
          checkIn,
          checkOut,
          guestName: "Ada",
          guestEmail: "ada@example.com",
          totalPrice: { toString: () => "199.00" },
          status: "CONFIRMED",
          createdAt,
          room: {
            id: "r1",
            name: "Suite",
            hotelId: "h1",
            hotel: {
              id: "h1",
              name: "Grand",
              city: "Paris",
              country: "FR",
            },
          },
        },
      ] as never);

      const res = await GET(listRequest());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        data: {
          items: [
            {
              id: "b1",
              roomId: "r1",
              checkIn: "2026-02-01",
              checkOut: "2026-02-03",
              guestName: "Ada",
              guestEmail: "ada@example.com",
              totalPrice: "199.00",
              status: "CONFIRMED",
              createdAt: "2026-01-15T12:00:00.000Z",
              room: {
                id: "r1",
                name: "Suite",
                hotelId: "h1",
                hotel: {
                  id: "h1",
                  name: "Grand",
                  city: "Paris",
                  country: "FR",
                },
              },
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        },
      });
    });
  });
});
