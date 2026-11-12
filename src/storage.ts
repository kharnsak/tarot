import { cardById, SPREADS } from "./tarot";
import type { SpreadId, Topic } from "./tarot";
import { parseBirthDate } from "./astro";
import { secureRng, shuffle } from "./data/rng";

/** Maximum readings kept in history. */
export const MAX_HISTORY = 100;

export type Reading = {
  id: string;
  date: string;
  createdAt: string;
  topic: Topic;
  question: string;
  cards: string[];
  daily: boolean;
  /** Added with the new spreads; absent on older saved readings. */
  spread?: SpreadId;
  /** Parallel to `cards`: true when that card was drawn reversed. */
  reversed?: boolean[];
  /** Which card text the reading shows (cardText key). Absent on older readings. */
  focus?: "core" | "love" | "them" | "work" | "money";
};
export type Journal = { readings: Reading[]; storageUnavailable: boolean };
const key = "chanjai-journal-v1";
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function thaiDate(date = new Date(), short = false) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  }).format(date);
}
export function isReading(value: unknown): value is Reading {
  if (!value || typeof value !== "object") return false;
  const v = value as Reading;
  return (
    typeof v.id === "string" &&
    typeof v.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.createdAt === "string" &&
    !Number.isNaN(Date.parse(v.createdAt)) &&
    ["general", "love", "work", "decision"].includes(v.topic) &&
    typeof v.question === "string" &&
    v.question.length <= 500 &&
    typeof v.daily === "boolean" &&
    Array.isArray(v.cards) &&
    v.cards.length >= 1 &&
    v.cards.length <= 3 &&
    (!v.daily || v.cards.length === 1) &&
    (v.spread === undefined ||
      (typeof v.spread === "string" && Object.hasOwn(SPREADS, v.spread) && SPREADS[v.spread].count === v.cards.length)) &&
    (v.reversed === undefined ||
      (Array.isArray(v.reversed) && v.reversed.length === v.cards.length && v.reversed.every((r) => typeof r === "boolean"))) &&
    (v.focus === undefined || ["core", "love", "them", "work", "money"].includes(v.focus)) &&
    new Set(v.cards).size === v.cards.length &&
    v.cards.every((id) => cardById.has(id))
  );
}
export function loadJournal(): Journal {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const seen = new Set<string>();
    const readings = Array.isArray(data)
      ? data.filter(isReading).filter((r) => !seen.has(r.id) && !!seen.add(r.id))
      : [];
    return {
      readings: readings.slice(0, MAX_HISTORY),
      storageUnavailable: false,
    };
  } catch {
    return { readings: [], storageUnavailable: true };
  }
}
export function saveJournal(readings: Reading[]) {
  try {
    localStorage.setItem(key, JSON.stringify(readings.slice(0, MAX_HISTORY)));
    return true;
  } catch {
    return false;
  }
}
export function randomIndex(limit: number) {
  return secureRng.int(limit);
}
/** Shuffle ids (Fisher-Yates, crypto RNG) and take `count`. Does not mutate `ids`. */
export function drawCards(ids: string[], count: number) {
  return shuffle(ids, secureRng).slice(0, count);
}
/** Newest first, capped at MAX_HISTORY. Returns a new array. */
export function addReading(readings: Reading[], next: Reading) {
  return [next, ...readings.filter((r) => r.id !== next.id)].slice(0, MAX_HISTORY);
}
export function streak(readings: Reading[], now = new Date()) {
  const days = new Set(readings.filter((r) => r.daily).map((r) => r.date));
  const dayMs = 86400000;
  let cursor = Date.parse(dayKey(now) + "T00:00:00Z");
  if (!days.has(dayKey(now))) cursor -= dayMs;
  let count = 0;
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) {
    count++;
    cursor -= dayMs;
  }
  return count;
}

/** Current streak plus the longest run ever recorded in the (capped) history. */
export function streakInfo(readings: Reading[], now = new Date()) {
  const days = [...new Set(readings.filter((r) => r.daily).map((r) => r.date))].sort();
  let longest = 0,
    run = 0,
    prev = 0;
  for (const day of days) {
    const t = Date.parse(day + "T00:00:00Z");
    run = prev && t - prev === 86400000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  return {
    current: streak(readings, now),
    longest,
    doneToday: days.includes(dayKey(now)),
  };
}

// --- anonymous id (seeds the daily card) and optional birth data -------------------------
const uidKey = "chanjai-uid-v1";
let memoryUid = "";
export function userId() {
  try {
    let id = localStorage.getItem(uidKey);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(uidKey, id);
    }
    return id;
  } catch {
    return (memoryUid ||= crypto.randomUUID());
  }
}
const birthKey = "chanjai-birth-v1";
export type Birth = { date: string; time?: string };
export function loadBirth(): Birth | undefined {
  try {
    const v = JSON.parse(localStorage.getItem(birthKey) || "null");
    if (v && typeof v.date === "string" && parseBirthDate(v.date)) {
      return { date: v.date, time: typeof v.time === "string" && /^\d{1,2}:\d{2}$/.test(v.time) ? v.time : undefined };
    }
  } catch {
    /* storage unavailable */
  }
  return undefined;
}
export function saveBirth(birth?: Birth) {
  try {
    if (birth) localStorage.setItem(birthKey, JSON.stringify(birth));
    else localStorage.removeItem(birthKey);
    return true;
  } catch {
    return false;
  }
}
