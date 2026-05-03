import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { nightCount } from "./booking-overlap";

describe("nightCount", () => {
  it("returns 1 for a single overnight stay", () => {
    const checkIn = new Date("2026-01-01T15:00:00.000Z");
    const checkOut = new Date("2026-01-02T15:00:00.000Z");
    expect(nightCount(checkIn, checkOut)).toBe(1);
  });

  it("returns the number of nights for a multi-night stay", () => {
    const checkIn = new Date("2026-03-10T14:00:00.000Z");
    const checkOut = new Date("2026-03-13T11:00:00.000Z");
    expect(nightCount(checkIn, checkOut)).toBe(3);
  });

  it("returns 0 when check-out is same instant as check-in", () => {
    const d = new Date("2026-06-01T12:00:00.000Z");
    expect(nightCount(d, d)).toBe(0);
  });

  it("returns negative value when check-out is before check-in", () => {
    const checkIn = new Date("2026-01-05T12:00:00.000Z");
    const checkOut = new Date("2026-01-03T12:00:00.000Z");
    expect(nightCount(checkIn, checkOut)).toBe(-2);
  });
});
