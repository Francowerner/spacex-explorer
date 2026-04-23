/**
 * Formats user typing into YYYY-MM-DD with dashes, max 8 digits (year 4, month 2, day 2).
 * Prevents absurd years like 222222 in a single field.
 */
export function formatYmdTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
