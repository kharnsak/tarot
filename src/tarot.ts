import { cards } from "./data/cards";
import type { Card } from "./data/cards";
import { buildEntries } from "./data/entries";
import type { CardEntry } from "./data/entries";
import { loadedContent } from "./data/content";
import { createRng, hashSeed, secureRng, shuffle } from "./data/rng";
import type { Rng } from "./data/rng";

export { cards };
export type { Card, CardEntry };
export type { CardContent, CardTexts, YesNo } from "./data/entries";
import type { YesNo } from "./data/entries";

export type Topic = "general" | "love" | "work" | "decision";

export const cardById = new Map(cards.map((card) => [card.id, card]));
export const topics: {
  id: Topic;
  label: string;
  title: string;
  subtitle: string;
  prompt: string;
}[] = [
  {
    id: "love",
    label: "ความรัก",
    title: "เรื่องของหัวใจ",
    subtitle: "ความรัก คนคุย และความสัมพันธ์",
    prompt: "ตอนนี้ฉันควรดูแลความสัมพันธ์อย่างไร",
  },
  {
    id: "work",
    label: "การงาน & การเงิน",
    title: "เส้นทางที่กำลังเดิน",
    subtitle: "งาน เงิน และโอกาสที่รออยู่",
    prompt: "ฉันควรให้ความสำคัญกับอะไรในเรื่องงาน",
  },
  {
    id: "general",
    label: "ภาพรวมชีวิต",
    title: "ฟังเสียงข้างใน",
    subtitle: "รู้จักตัวเองในอีกมุมที่อ่อนโยน",
    prompt: "มีอะไรที่ฉันควรใส่ใจในช่วงนี้",
  },
  {
    id: "decision",
    label: "Yes / No",
    title: "เมื่อใจยังลังเล",
    subtitle: "อีกหนึ่งมุมมองก่อนตัดสินใจ",
    prompt: "ทางเลือกนี้สอดคล้องกับสิ่งที่ฉันต้องการไหม",
  },
];
export function interpretation(card: Card, topic: Topic) {
  return topic === "love"
    ? card.love
    : topic === "work"
      ? card.work
      : card.message;
}
/** @deprecated use yesNo(); kept for the current UI. */
export function decision(card: Card) {
  return card.energy === "open"
    ? "มีพื้นที่ให้ลอง"
    : card.energy === "pause"
      ? "พักก่อนสักนิด"
      : "มองข้อมูลให้ชัดอีกนิด";
}

// ---------------------------------------------------------------------------
// New API (deck modes, seeded draws, spreads, yes/no). The exports above are kept for the
// current UI; `decision()` is superseded by `yesNo()`.
// ---------------------------------------------------------------------------

export type DeckMode = "major" | "full";
const entries: CardEntry[] = buildEntries(cards, loadedContent.cards);
export const entryById = new Map(entries.map((e) => [e.id, e]));

/** Rebuild the deck from explicit content (tests, previews). */
export function buildDeck(content: Parameters<typeof buildEntries>[1], mode: DeckMode = "major") {
  const all = buildEntries(cards, content);
  return mode === "major" ? all.filter((c) => c.arcana === "major") : all;
}

/** "major" = 22 Major Arcana (default); "full" = all 78 cards. */
export function getDeck(mode: DeckMode = "major"): CardEntry[] {
  return mode === "major" ? entries.filter((c) => c.arcana === "major") : [...entries];
}

export type DrawnCard = { card: CardEntry; reversed: boolean };
export type DrawOptions = {
  /** Same seed => same result. Omit for crypto.getRandomValues. */
  seed?: string | number;
  allowReversed?: boolean;
  mode?: DeckMode;
  /** Draw from a custom deck instead (e.g. buildDeck()). */
  deck?: readonly CardEntry[];
};

function makeRng(seed: DrawOptions["seed"]): Rng {
  return seed === undefined ? secureRng : createRng(seed);
}

/** Fisher-Yates shuffle, then take n. Never repeats a card; never mutates the deck. */
export function drawCards(n: number, opts: DrawOptions = {}): DrawnCard[] {
  const deck = opts.deck ?? getDeck(opts.mode ?? "major");
  if (!Number.isInteger(n) || n < 0 || n > deck.length)
    throw new RangeError(`cannot draw ${n} cards from a deck of ${deck.length}`);
  const rng = makeRng(opts.seed);
  const picked = shuffle(deck, rng).slice(0, n);
  return picked.map((card) => ({ card, reversed: !!opts.allowReversed && rng.int(2) === 1 }));
}

/**
 * The card of the day: deterministic for (userId, date), always upright.
 * seed = hash(userId + date). `dateISO` should be the Bangkok day, e.g. dayKey().
 */
export function dailyCard(userId: string, dateISO: string, opts: Pick<DrawOptions, "mode" | "deck"> = {}): DrawnCard {
  return drawCards(1, { ...opts, seed: hashSeed(`${userId}|${dateISO}`), allowReversed: false })[0];
}

export type SpreadId = "daily" | "yesno" | "love3" | "work3" | "choice2" | "them3";
export type Spread = {
  id: SpreadId;
  count: number;
  /** Which text of the card to read for this spread. */
  focus: "core" | "love" | "work" | "money" | "them" | "advice";
  positions: { key: string; label: string }[];
};
export const SPREADS: Record<SpreadId, Spread> = {
  daily: { id: "daily", count: 1, focus: "core", positions: [{ key: "today", label: "ไพ่ประจำวัน" }] },
  yesno: { id: "yesno", count: 1, focus: "core", positions: [{ key: "answer", label: "คำตอบ" }] },
  love3: {
    id: "love3",
    count: 3,
    focus: "love",
    positions: [
      { key: "past", label: "อดีต" },
      { key: "present", label: "ปัจจุบัน" },
      { key: "trend", label: "แนวโน้ม" },
    ],
  },
  work3: {
    id: "work3",
    count: 3,
    focus: "work",
    positions: [
      { key: "situation", label: "สถานการณ์" },
      { key: "obstacle", label: "อุปสรรค" },
      { key: "advice", label: "คำแนะนำ" },
    ],
  },
  choice2: {
    id: "choice2",
    count: 2,
    focus: "core",
    positions: [
      { key: "a", label: "ทาง A" },
      { key: "b", label: "ทาง B" },
    ],
  },
  them3: {
    id: "them3",
    count: 3,
    focus: "them",
    positions: [
      { key: "them", label: "ใจเขา" },
      { key: "me", label: "ใจเรา" },
      { key: "relationship", label: "ความสัมพันธ์" },
    ],
  },
};

/** Draw a whole spread. Reversed cards are allowed except for the daily card. */
export function drawSpread(id: SpreadId, opts: Omit<DrawOptions, "allowReversed"> & { allowReversed?: boolean } = {}) {
  const spread = SPREADS[id];
  const drawn = drawCards(spread.count, { ...opts, allowReversed: id === "daily" ? false : (opts.allowReversed ?? true) });
  return drawn.map((d, i) => ({ ...d, position: spread.positions[i] }));
}

/** Text of a card for a given side/field, e.g. cardText(card, true, "love"). */
export function cardText(card: CardEntry, reversed: boolean, key: keyof CardEntry["upright"]) {
  return (reversed ? card.reversed : card.upright)[key];
}

/** Yes/No/Maybe from the card's `yesno` table. */
export function yesNo(card: CardEntry, reversed: boolean): YesNo {
  return reversed ? card.yesno.reversed : card.yesno.upright;
}
