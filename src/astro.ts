import { loadedContent } from "./data/content";
import type { AstroContent, DayKey, ZodiacKey } from "./data/astro-types";

export type { AstroContent, DayKey, ZodiacKey } from "./data/astro-types";

// Structural facts only. All prose, lucky colours and unlucky (kalakini) colours come from
// content/astro.json so that the traditions are written by the content author, not hardcoded.
const DAYS: { key: DayKey; nameTh: string; planetTh: string }[] = [
  { key: "sunday", nameTh: "วันอาทิตย์", planetTh: "พระอาทิตย์" },
  { key: "monday", nameTh: "วันจันทร์", planetTh: "พระจันทร์" },
  { key: "tuesday", nameTh: "วันอังคาร", planetTh: "พระอังคาร" },
  { key: "wednesday_day", nameTh: "วันพุธ (กลางวัน)", planetTh: "พระพุธ" },
  { key: "thursday", nameTh: "วันพฤหัสบดี", planetTh: "พระพฤหัสบดี" },
  { key: "friday", nameTh: "วันศุกร์", planetTh: "พระศุกร์" },
  { key: "saturday", nameTh: "วันเสาร์", planetTh: "พระเสาร์" },
];
const WED_NIGHT = { key: "wednesday_night" as DayKey, nameTh: "วันพุธ (กลางคืน)", planetTh: "พระราหู" };

const SIGNS: { key: ZodiacKey; nameTh: string; from: [number, number] }[] = [
  { key: "capricorn", nameTh: "ราศีมังกร", from: [12, 22] },
  { key: "aquarius", nameTh: "ราศีกุมภ์", from: [1, 20] },
  { key: "pisces", nameTh: "ราศีมีน", from: [2, 19] },
  { key: "aries", nameTh: "ราศีเมษ", from: [3, 21] },
  { key: "taurus", nameTh: "ราศีพฤษภ", from: [4, 20] },
  { key: "gemini", nameTh: "ราศีเมถุน", from: [5, 21] },
  { key: "cancer", nameTh: "ราศีกรกฎ", from: [6, 21] },
  { key: "leo", nameTh: "ราศีสิงห์", from: [7, 23] },
  { key: "virgo", nameTh: "ราศีกันย์", from: [8, 23] },
  { key: "libra", nameTh: "ราศีตุลย์", from: [9, 23] },
  { key: "scorpio", nameTh: "ราศีพิจิก", from: [10, 23] },
  { key: "sagittarius", nameTh: "ราศีธนู", from: [11, 22] },
];

export type BirthInput = {
  /** "YYYY-MM-DD". A Buddhist-era year (> 2400) is converted automatically. */
  date: string;
  /** Optional "HH:mm" (24h). Only used to split Wednesday into day (before 18:00) and night. */
  time?: string;
};

export type AstroProfile = {
  isoDate: string;
  dayKey: DayKey;
  dayNameTh: string;
  planetTh: string;
  zodiacKey: ZodiacKey;
  zodiacTh: string;
  personality: string;
  luckyColors: string[];
  unluckyColors: string[];
  advice: string;
  zodiacPersonality: string;
  /** Personalised sentences ready to append to a reading (empty when content is missing). */
  lines: string[];
};

export function parseBirthDate(date: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  let y = Number(match[1]);
  const m = Number(match[2]),
    d = Number(match[3]);
  if (y > 2400) y -= 543;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (y < 1 || t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function westernSign(m: number, d: number) {
  if (m === 12 && d >= 22) return SIGNS[0]; // Capricorn spans the new year
  let found = SIGNS[0]; // before 20 Jan: still Capricorn
  for (const s of SIGNS.slice(1)) if (m > s.from[0] || (m === s.from[0] && d >= s.from[1])) found = s;
  return found;
}

export function thaiBirthDay(date: string, time?: string) {
  const p = parseBirthDate(date);
  if (!p) return null;
  const weekday = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); // 0 = Sunday
  if (weekday === 3 && time) {
    const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    if (t && Number(t[1]) >= 18 && Number(t[1]) < 24) return WED_NIGHT;
  }
  return DAYS[weekday];
}

export function astroProfile(input: BirthInput, content: AstroContent | undefined = loadedContent.astro): AstroProfile | null {
  const p = parseBirthDate(input.date);
  const day = thaiBirthDay(input.date, input.time);
  if (!p || !day) return null;
  const sign = westernSign(p.m, p.d);
  const dc = content?.days?.[day.key];
  const zc = content?.zodiac?.[sign.key];
  return {
    isoDate: `${String(p.y).padStart(4, "0")}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`,
    dayKey: day.key,
    dayNameTh: day.nameTh,
    planetTh: day.planetTh,
    zodiacKey: sign.key,
    zodiacTh: sign.nameTh,
    personality: dc?.personality ?? "",
    luckyColors: dc?.luckyColors ?? [],
    unluckyColors: dc?.unluckyColors ?? [],
    advice: dc?.advice ?? "",
    zodiacPersonality: zc?.personality ?? "",
    lines: [dc?.line, zc?.line].filter((s): s is string => !!s),
  };
}
