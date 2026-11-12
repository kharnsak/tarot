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
