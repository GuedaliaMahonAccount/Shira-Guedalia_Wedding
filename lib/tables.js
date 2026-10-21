/**
 * Wedding Seating — Table Definitions
 * ====================================
 * Central configuration for all 11 wedding tables.
 * This is the single source of truth used by both
 * the public seating page and the admin interface.
 *
 * Table numbers are FIXED and deterministic:
 *   Men's tables:   1–5, 10
 *   Women's tables:  6–9, 11
 */

export const TABLES = [
  { number: 1, category: "חברים של החתן", section: "גברים", seats: 12 },
  { number: 2, category: "משפחה של החתן", section: "גברים", seats: 12 },
  { number: 3, category: "משפחה של הכלה", section: "גברים", seats: 12 },
  { number: 4, category: "חברים של המשפחה של החתן", section: "גברים", seats: 12 },
  { number: 5, category: "חברים של המשפחה של הכלה", section: "גברים", seats: 12 },
  { number: 6, category: "חברות של הכלה", section: "נשים", seats: 12 },
  { number: 7, category: "משפחה של הכלה", section: "נשים", seats: 12 },
  { number: 8, category: "משפחה של החתן", section: "נשים", seats: 12 },
  { number: 9, category: "חברים של המשפחה של החתן והכלה ביחד", section: "נשים", seats: 12 },
  { number: 10, category: "רזרבה", section: "גברים", seats: 12 },
  { number: 11, category: "רזרבה", section: "נשים", seats: 12 },
];

export const COUPLE_TABLE = {
  number: 1000,
  category: "שולחן חתן וכלה",
  section: "חתן וכלה",
  seats: 2,
  isCouple: true,
};

export const MEN_TABLES = TABLES.filter(t => t.section === "גברים");
export const WOMEN_TABLES = TABLES.filter(t => t.section === "נשים");

export const ALL_TABLES_WITH_COUPLE = [...TABLES, COUPLE_TABLE];

/**
 * Look up a table definition by number.
 * Supports tables 1–11 and table 1000.
 */
export function getTableByNumber(num) {
  const n = parseInt(num, 10);
  return ALL_TABLES_WITH_COUPLE.find(t => t.number === n);
}

