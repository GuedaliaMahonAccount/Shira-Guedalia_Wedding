/**
 * Wedding Seating — Table Definitions
 * ====================================
 * Central configuration for all 9 wedding tables.
 * This is the single source of truth used by both
 * the public seating page and the admin interface.
 *
 * Table numbers are FIXED and deterministic:
 *   Men's tables:   1–5
 *   Women's tables:  6–9
 */

export const TABLES = [
  { number: 1, category: "חברים של החתן", section: "גברים" },
  { number: 2, category: "משפחה של החתן", section: "גברים" },
  { number: 3, category: "משפחה של הכלה", section: "גברים" },
  { number: 4, category: "חברים של המשפחה של החתן", section: "גברים" },
  { number: 5, category: "חברים של המשפחה של הכלה", section: "גברים" },
  { number: 6, category: "חברות של הכלה", section: "נשים" },
  { number: 7, category: "משפחה של הכלה", section: "נשים" },
  { number: 8, category: "משפחה של החתן", section: "נשים" },
  { number: 9, category: "חברים של המשפחה של החתן והכלה ביחד", section: "נשים" },
];

export const MEN_TABLES = TABLES.filter(t => t.section === "גברים");
export const WOMEN_TABLES = TABLES.filter(t => t.section === "נשים");

/**
 * Look up a table definition by number.
 * Returns undefined if the number is not 1–9.
 */
export function getTableByNumber(num) {
  return TABLES.find(t => t.number === num);
}
