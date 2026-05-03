import { describe, expect, it } from "vitest";

import {
  BOOKING_NOTE_MAX_LENGTH,
  validateBookingNoteField,
} from "./booking-notes";

describe("validateBookingNoteField", () => {
  it("allows empty and whitespace-only", () => {
    expect(validateBookingNoteField("", "Special requests")).toBeNull();
    expect(validateBookingNoteField("   ", "Special requests")).toBeNull();
  });

  it("allows text within limit", () => {
    const s = "a".repeat(BOOKING_NOTE_MAX_LENGTH);
    expect(validateBookingNoteField(s, "Note")).toBeNull();
  });

  it("rejects when trimmed content exceeds max length", () => {
    const s = "a".repeat(BOOKING_NOTE_MAX_LENGTH + 1);
    expect(validateBookingNoteField(s, "Special requests")).toBe(
      `Special requests must be at most ${BOOKING_NOTE_MAX_LENGTH.toLocaleString()} characters.`,
    );
  });
});
