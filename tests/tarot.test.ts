import { test } from "node:test";
import assert from "node:assert/strict";
import { cards, cardById, interpretation } from "../src/tarot.ts";
import {
  dayKey,
  drawCards,
  isReading,
  loadJournal,
  saveJournal,
  streak,
} from "../src/storage.ts";
import type { Reading } from "../src/storage.ts";

const reading = (date: string, daily = true): Reading => ({
  id: date,
  createdAt: date + "T08:00:00Z",
  date,
  topic: "general",
  question: "",
  cards: ["the-sun"],
  daily,
});
test("the deck contains 78 unique cards, 22 major and 14 in each minor suit", () => {
  assert.equal(cards.length, 78);
  assert.equal(cardById.size, 78);
  assert.equal(cards.filter((c) => c.arcana === "major").length, 22);
  for (const suit of ["cups", "wands", "swords", "pentacles"])
    assert.equal(cards.filter((c) => c.suit === suit).length, 14);
  for (const card of cards) {
    assert.ok(card.thai);
    assert.ok(card.message.length > 50);
    assert.ok(card.advice);
    assert.equal(interpretation(card, "love"), card.love);
    assert.equal(interpretation(card, "work"), card.work);
  }
});
test("daily draws change at midnight in Thailand rather than UTC", () => {
  assert.equal(dayKey(new Date("2026-11-12T16:59:59Z")), "2026-11-12");
  assert.equal(dayKey(new Date("2026-11-12T17:00:00Z")), "2026-11-13");
});
test("streak counts distinct consecutive daily dates and allows an unopened today", () => {
  const list = [
    reading("2026-11-12"),
    reading("2026-11-12"),
    reading("2026-11-11"),
    reading("2026-11-10"),
    reading("2026-11-09", false),
  ];
  assert.equal(streak(list, new Date("2026-11-12T09:00Z")), 3);
  assert.equal(streak(list, new Date("2026-11-13T09:00Z")), 3);
  assert.equal(streak(list, new Date("2026-11-14T09:00Z")), 0);
});
test("shuffle never repeats cards within a spread or mutates the source deck", () => {
  const ids = cards.map((c) => c.id),
    copy = [...ids];
  for (let i = 0; i < 100; i++) {
    const result = drawCards(ids, 3);
    assert.equal(result.length, 3);
    assert.equal(new Set(result).size, 3);
    assert.ok(result.every((id) => cardById.has(id)));
  }
  assert.deepEqual(ids, copy);
});
test("invalid or stale stored data cannot enter a reading", () => {
  const good = reading("2026-11-12");
  assert.equal(isReading(good), true);
  for (const value of [
    null,
    {},
    { ...good, cards: ["missing"] },
    { ...good, cards: ["the-sun", "the-sun", "the-moon"] },
    { ...good, topic: "unknown" },
    { ...good, createdAt: "nope" },
    { ...good, daily: true, cards: ["the-sun", "the-moon", "the-star"] },
  ])
    assert.equal(isReading(value), false);
});
test("journal handles corrupt storage and unavailable storage without crashing", () => {
  let value = "broken-json";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => value,
      setItem: (_key: string, next: string) => {
        value = next;
      },
    },
  });
  assert.deepEqual(loadJournal(), { readings: [], storageUnavailable: true });
  value = JSON.stringify([reading("2026-11-12"), { broken: true }]);
  assert.equal(loadJournal().readings.length, 1);
  assert.equal(saveJournal([reading("2026-11-12")]), true);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("denied");
    },
  });
  assert.deepEqual(loadJournal(), { readings: [], storageUnavailable: true });
  assert.equal(saveJournal([]), false);
  Reflect.deleteProperty(globalThis, "localStorage");
});

// ---------------------------------------------------------------------------
// New API
// ---------------------------------------------------------------------------
import { readFileSync, existsSync } from "node:fs";
import {
  SPREADS,
  buildDeck,
  dailyCard,
  drawCards as drawNew,
  drawSpread,
  getDeck,
  yesNo,
} from "../src/tarot.ts";
import { MAX_HISTORY, addReading, streakInfo } from "../src/storage.ts";
import { TEXT_KEYS, validateCardContent, normalizeCardsFile } from "../src/data/entries.ts";
import { createRng } from "../src/data/rng.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/cards.fixture.json", import.meta.url), "utf8"));
const contentPath = new URL("../content/cards.json", import.meta.url);
const real = existsSync(contentPath) ? normalizeCardsFile(JSON.parse(readFileSync(contentPath, "utf8"))) : [];

test("getDeck returns 22 major cards by default and 78 for full", () => {
  assert.equal(getDeck().length, 22);
  assert.ok(getDeck("major").every((c) => c.arcana === "major"));
  assert.equal(getDeck("full").length, 78);
  assert.equal(new Set(getDeck("full").map((c) => c.id)).size, 78);
});
test("every card exposes all six text topics for both orientations", () => {
  for (const c of getDeck("full"))
    for (const side of [c.upright, c.reversed])
      for (const k of TEXT_KEYS) assert.ok(side[k].trim(), `${c.id}.${k}`);
});
test("content fixture validates and is merged over the legacy deck", () => {
  for (const c of fixture) assert.deepEqual(validateCardContent(c), []);
  assert.ok(validateCardContent({ ...fixture[0], upright: { ...fixture[0].upright, love: "" } }).length > 0);
  const star = buildDeck(fixture, "major").find((c) => c.id === "the-star")!;
  assert.equal(star.fromContent, true);
  assert.equal(star.upright.love, "love-up");
  assert.equal(star.daily, "daily-star");
  assert.equal(star.number, 17);
  assert.equal(buildDeck(fixture).find((c) => c.id === "the-sun")!.fromContent, false);
  // invalid entries are ignored rather than breaking the deck
  assert.equal(buildDeck([{ ...fixture[0], daily: "" }]).find((c) => c.id === "the-fool")!.fromContent, false);
});
test("when content/cards.json exists, all its cards are complete", () => {
  const problems = real.flatMap((c) => validateCardContent(c));
  assert.deepEqual(problems, []);
  const ids = new Set(getDeck("full").map((c) => c.id));
  for (const c of real) assert.ok(ids.has(c.id), `unknown id ${c.id}`);
});
test("drawCards never repeats a card, in any spread size", () => {
  for (let i = 0; i < 200; i++) {
    for (const n of [1, 2, 3, 10, 22]) {
      const out = drawNew(n, { allowReversed: true });
      assert.equal(out.length, n);
      assert.equal(new Set(out.map((d) => d.card.id)).size, n);
    }
  }
  assert.throws(() => drawNew(23));
  assert.throws(() => drawNew(79, { mode: "full" }));
});
test("seeded draws are reproducible and different seeds differ", () => {
  const a = drawNew(3, { seed: "x", allowReversed: true }).map((d) => [d.card.id, d.reversed]);
  const b = drawNew(3, { seed: "x", allowReversed: true }).map((d) => [d.card.id, d.reversed]);
  assert.deepEqual(a, b);
  const seeds = new Set(Array.from({ length: 50 }, (_, i) => drawNew(1, { seed: `s${i}` })[0].card.id));
  assert.ok(seeds.size > 5);
  assert.ok(drawNew(3, { allowReversed: false }).every((d) => !d.reversed));
});
test("rng is uniform enough: every card appears in single draws", () => {
  const rng = createRng("uniform");
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 10000; i++) counts[rng.int(10)]++;
  for (const c of counts) assert.ok(c > 800 && c < 1200, String(c));
});
test("dailyCard is stable for the whole day, upright, and varies by user and date", () => {
  const a = dailyCard("user-1", "2026-11-12");
  for (let i = 0; i < 20; i++) assert.equal(dailyCard("user-1", "2026-11-12").card.id, a.card.id);
  assert.equal(a.reversed, false);
  const ids = new Set<string>();
  for (let d = 1; d <= 28; d++) ids.add(dailyCard("user-1", `2026-11-${String(d).padStart(2, "0")}`).card.id);
  assert.ok(ids.size > 8);
  const users = new Set(Array.from({ length: 40 }, (_, i) => dailyCard(`u${i}`, "2026-11-12").card.id));
  assert.ok(users.size > 8);
});
test("SPREADS define the six spreads with position labels and unique draws", () => {
  assert.deepEqual(Object.keys(SPREADS).sort(), ["choice2", "daily", "love3", "them3", "work3", "yesno"]);
  assert.deepEqual(
    Object.values(SPREADS).map((s) => s.count),
    [1, 1, 3, 3, 2, 3],
  );
  for (const s of Object.values(SPREADS)) assert.equal(s.positions.length, s.count);
  assert.deepEqual(SPREADS.love3.positions.map((p) => p.label), ["อดีต", "ปัจจุบัน", "แนวโน้ม"]);
  assert.deepEqual(SPREADS.choice2.positions.map((p) => p.label), ["ทาง A", "ทาง B"]);
  for (const id of Object.keys(SPREADS) as (keyof typeof SPREADS)[]) {
    const out = drawSpread(id, { mode: "full" });
    assert.equal(new Set(out.map((d) => d.card.id)).size, SPREADS[id].count);
  }
  assert.ok(drawSpread("daily", { allowReversed: true }).every((d) => !d.reversed));
});
test("yesNo reads the yesno table by orientation", () => {
  const [fool, star] = buildDeck(fixture).filter((c) => c.id === "the-fool" || c.id === "the-star");
  assert.equal(yesNo(fool, false), "yes");
  assert.equal(yesNo(fool, true), "maybe");
  assert.equal(yesNo(star, true), "no");
});
test("history is capped at 100 and addReading dedupes by id, newest first", () => {
  let list: Reading[] = [];
  for (let i = 0; i < 130; i++) list = addReading(list, { ...reading("2026-01-01", false), id: `r${i}` });
  assert.equal(list.length, MAX_HISTORY);
  assert.equal(list[0].id, "r129");
  assert.equal(addReading(list, { ...list[5] }).length, MAX_HISTORY);
  assert.equal(addReading(list, { ...list[5] })[0].id, list[5].id);
});
test("new reading fields (spread, reversed) are validated", () => {
  const good = { ...reading("2026-11-12", false), cards: ["the-sun", "the-moon", "the-star"], spread: "love3", reversed: [false, true, false] };
  assert.equal(isReading(good), true);
  assert.equal(isReading({ ...good, spread: "choice2" }), false);
  assert.equal(isReading({ ...good, spread: "nope" }), false);
  assert.equal(isReading({ ...good, reversed: [true] }), false);
  assert.equal(isReading({ ...reading("2026-11-12", false), cards: ["the-sun", "the-moon"], spread: "choice2" }), true);
});
test("streak crosses midnight in Bangkok, not UTC", () => {
  // 2026-11-12 23:30 Bangkok = 16:30Z; 00:30 Bangkok on the 13th = 17:30Z on the 12th
  const before = new Date("2026-11-12T16:30:00Z"),
    after = new Date("2026-11-12T17:30:00Z");
  assert.equal(dayKey(before), "2026-11-12");
  assert.equal(dayKey(after), "2026-11-13");
  const list = [reading("2026-11-11"), reading("2026-11-12")];
  assert.equal(streak(list, before), 2);
  assert.equal(streakInfo(list, before).doneToday, true);
  // just after Bangkok midnight today is open again but the streak survives until the day ends
  assert.equal(streak(list, after), 2);
  assert.equal(streakInfo(list, after).doneToday, false);
  // a whole missed Bangkok day breaks it
  assert.equal(streak(list, new Date("2026-11-13T17:30:00Z")), 0);
  assert.equal(streakInfo([...list, reading("2026-11-01"), reading("2026-11-02"), reading("2026-11-03")], before).longest, 3);
});
test("loadJournal drops duplicates and caps at 100", () => {
  const many = Array.from({ length: 140 }, (_, i) => ({ ...reading("2026-11-12", false), id: `id${i}` }));
  const store = JSON.stringify([...many, many[0]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => store, setItem() {} } });
  assert.equal(loadJournal().readings.length, 100);
  Reflect.deleteProperty(globalThis, "localStorage");
});
