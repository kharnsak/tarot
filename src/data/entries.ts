import type { Card } from "./cards";

export type YesNo = "yes" | "no" | "maybe";
export const TEXT_KEYS = ["core", "love", "work", "money", "them", "advice"] as const;
export type TextKey = (typeof TEXT_KEYS)[number];
export type CardTexts = Record<TextKey, string>;

/** Shape of one card in content/cards.json (see docs/handoff/02-grok.md). */
export type CardContent = {
  id: string;
  nameTh: string;
  nameEn: string;
  arcana: "major" | "minor";
  number?: number;
  suit?: string;
  keywords: string[];
  upright: CardTexts;
  reversed: CardTexts;
  yesno: { upright: YesNo; reversed: YesNo };
  daily: string;
  seo: { title: string; description: string; article: string };
};

/** A legacy Card enriched with the full content schema. */
export type CardEntry = Card & {
  nameTh: string;
  nameEn: string;
  number: number | null;
  keywords: string[];
  upright: CardTexts;
  reversed: CardTexts;
  yesno: { upright: YesNo; reversed: YesNo };
  daily: string;
  seo: { title: string; description: string; article: string };
  /** true when the texts came from content/cards.json, false for the legacy fallback. */
  fromContent: boolean;
};

const isYesNo = (v: unknown): v is YesNo => v === "yes" || v === "no" || v === "maybe";
const filled = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Returns a list of human-readable problems; empty means the card is complete. */
export function validateCardContent(value: unknown): string[] {
  const c = value as Partial<CardContent> | null;
  if (!c || typeof c !== "object") return ["not an object"];
  const id = String(c.id ?? "?");
  const problems: string[] = [];
  for (const f of ["id", "nameTh", "nameEn", "daily"] as const)
    if (!filled(c[f])) problems.push(`${id}: missing ${f}`);
  if (c.arcana !== "major" && c.arcana !== "minor") problems.push(`${id}: bad arcana`);
  if (!Array.isArray(c.keywords) || !c.keywords.length || !c.keywords.every(filled))
    problems.push(`${id}: keywords`);
  for (const side of ["upright", "reversed"] as const)
    for (const k of TEXT_KEYS)
      if (!filled(c[side]?.[k])) problems.push(`${id}: ${side}.${k} empty`);
  for (const side of ["upright", "reversed"] as const)
    if (!isYesNo(c.yesno?.[side])) problems.push(`${id}: yesno.${side}`);
  for (const k of ["title", "description", "article"] as const)
    if (!filled(c.seo?.[k])) problems.push(`${id}: seo.${k} empty`);
  return problems;
}

/** Accepts either `[...]` or `{ cards: [...] }`. */
export function normalizeCardsFile(file: unknown): CardContent[] {
  if (Array.isArray(file)) return file as CardContent[];
  const inner = (file as { cards?: unknown } | null)?.cards;
  return Array.isArray(inner) ? (inner as CardContent[]) : [];
}

const fallbackYesNo = (energy: Card["energy"]) => ({
  upright: (energy === "open" ? "yes" : energy === "pause" ? "no" : "maybe") as YesNo,
  reversed: (energy === "pause" ? "no" : "maybe") as YesNo,
});

function fromLegacy(card: Card): CardEntry {
  const texts: CardTexts = {
    core: card.message,
    love: card.love,
    work: card.work,
    money: card.work,
    them: card.love,
    advice: card.advice,
  };
  return {
    ...card,
    nameTh: card.thai,
    nameEn: card.name,
    number: null,
    keywords: [card.keyword],
    upright: texts,
    // No reversed text exists in the legacy data; reuse upright until content/cards.json arrives.
    reversed: { ...texts },
    yesno: fallbackYesNo(card.energy),
    daily: card.message,
    seo: { title: card.name, description: card.message, article: "" },
    fromContent: false,
  };
}

/**
 * Merge content over the legacy deck. Invalid or unknown content entries are ignored
 * so a half-finished content file can never break the app.
 */
export function buildEntries(legacy: readonly Card[], content: readonly CardContent[] = []): CardEntry[] {
  const byId = new Map<string, CardContent>();
  for (const c of content) if (c && validateCardContent(c).length === 0) byId.set(c.id, c);
  return legacy.map((card, index) => {
    const base = fromLegacy(card);
    const c = byId.get(card.id);
    if (!c) return base;
    return {
      ...base,
      nameTh: c.nameTh,
      nameEn: c.nameEn,
      number: typeof c.number === "number" ? c.number : card.arcana === "major" ? index : null,
      keywords: c.keywords,
      upright: c.upright,
      reversed: c.reversed,
      yesno: c.yesno,
      daily: c.daily,
      seo: c.seo,
      fromContent: true,
    };
  });
}
