/** Max length for guest special requests and internal notes (plain text MVP). */
export const BOOKING_NOTE_MAX_LENGTH = 5000;

export function validateBookingNoteField(
  value: string,
  label: string,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length > BOOKING_NOTE_MAX_LENGTH) {
    return `${label} must be at most ${BOOKING_NOTE_MAX_LENGTH.toLocaleString()} characters.`;
  }
  return null;
}
