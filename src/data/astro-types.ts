export type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday_day"
  | "wednesday_night"
  | "thursday"
  | "friday"
  | "saturday";

export type ZodiacKey =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

/**
 * Proposed schema for content/astro.json (02-grok.md only describes it in prose).
 * Every field is optional so partial content never breaks the app.
 * {
 *   "days":   { "sunday": DayContent, ..., "wednesday_day": DayContent, "wednesday_night": DayContent },
 *   "zodiac": { "aries": ZodiacContent, ... }
 * }
 */
export type DayContent = {
  personality?: string;
  luckyColors?: string[];
  unluckyColors?: string[];
  advice?: string;
  /** One personalised sentence to append to a reading. */
  line?: string;
};
export type ZodiacContent = { personality?: string; advice?: string; line?: string };
export type AstroContent = {
  days?: Partial<Record<DayKey, DayContent>>;
  zodiac?: Partial<Record<ZodiacKey, ZodiacContent>>;
};
