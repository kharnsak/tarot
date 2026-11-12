import { cardById } from "./tarot";
import type { Topic } from "./tarot";

export type Reading = {
  id: string;
  date: string;
  createdAt: string;
  topic: Topic;
  question: string;
  cards: string[];
  daily: boolean;
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
    [1, 3].includes(v.cards.length) &&
    (!v.daily || v.cards.length === 1) &&
    new Set(v.cards).size === v.cards.length &&
    v.cards.every((id) => cardById.has(id))
  );
}
export function loadJournal(): Journal {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return {
      readings: Array.isArray(data) ? data.filter(isReading).slice(0, 150) : [],
      storageUnavailable: false,
    };
  } catch {
    return { readings: [], storageUnavailable: true };
  }
}
export function saveJournal(readings: Reading[]) {
  try {
    localStorage.setItem(key, JSON.stringify(readings.slice(0, 150)));
    return true;
  } catch {
    return false;
  }
}
export function randomIndex(limit: number) {
  const range = 0x100000000,
    max = range - (range % limit),
    random = new Uint32Array(1);
  do {
    crypto.getRandomValues(random);
  } while (random[0] >= max);
  return random[0] % limit;
}
export function drawCards(ids: string[], count: number) {
  const pool = [...ids];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
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
