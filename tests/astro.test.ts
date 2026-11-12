import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { astroProfile, parseBirthDate, thaiBirthDay, westernSign } from "../src/astro.ts";

const astro = JSON.parse(readFileSync(new URL("./fixtures/astro.fixture.json", import.meta.url), "utf8"));

test("Thai birth day by weekday (2026-11-12 is a Thursday, 2026-11-11 a Wednesday)", () => {
  assert.equal(thaiBirthDay("2026-11-12")!.key, "thursday");
  assert.equal(thaiBirthDay("2026-11-08")!.key, "sunday");
  assert.equal(thaiBirthDay("2026-11-14")!.key, "saturday");
});
test("Wednesday splits into day and night at 18:00; other days ignore time", () => {
  assert.equal(thaiBirthDay("2026-11-11")!.key, "wednesday_day");
  assert.equal(thaiBirthDay("2026-11-11", "17:59")!.key, "wednesday_day");
  assert.equal(thaiBirthDay("2026-11-11", "18:00")!.key, "wednesday_night");
  assert.equal(thaiBirthDay("2026-11-11", "23:30")!.key, "wednesday_night");
  assert.equal(thaiBirthDay("2026-11-12", "22:00")!.key, "thursday");
});
test("Buddhist-era years and invalid dates", () => {
  assert.deepEqual(parseBirthDate("2569-11-12"), { y: 2026, m: 11, d: 12 });
  assert.equal(parseBirthDate("2026-02-30"), null);
  assert.equal(parseBirthDate("nope"), null);
  assert.equal(astroProfile({ date: "2026-13-01" }, astro), null);
});
test("western sign boundaries", () => {
  const cases: [number, number, string][] = [
    [1, 19, "capricorn"], [1, 20, "aquarius"], [2, 18, "aquarius"], [2, 19, "pisces"], [3, 20, "pisces"],
    [3, 21, "aries"], [4, 19, "aries"], [4, 20, "taurus"], [5, 21, "gemini"], [6, 21, "cancer"], [7, 22, "cancer"],
    [7, 23, "leo"], [8, 23, "virgo"], [9, 23, "libra"], [10, 23, "scorpio"], [11, 21, "scorpio"], [11, 22, "sagittarius"],
    [12, 21, "sagittarius"], [12, 22, "capricorn"], [12, 31, "capricorn"], [1, 1, "capricorn"],
  ];
  for (const [m, d, key] of cases) assert.equal(westernSign(m, d).key, key, `${m}/${d}`);
});
test("profile pulls text from content and degrades gracefully without it", () => {
  const p = astroProfile({ date: "2026-12-30", time: "20:00" }, astro);
  // 2026-12-30 is a Wednesday
  assert.equal(p!.dayKey, "wednesday_night");
  assert.equal(p!.planetTh, "พระราหู");
  assert.equal(p!.zodiacKey, "capricorn");
  assert.deepEqual(p!.luckyColors, ["เทา"]);
  assert.deepEqual(p!.unluckyColors, ["ขาว"]);
  assert.deepEqual(p!.lines, ["line-night", "line-cap"]);
  const bare = astroProfile({ date: "2026-12-30" }, undefined)!;
  assert.equal(bare.dayKey, "wednesday_day");
  assert.deepEqual(bare.luckyColors, []);
  assert.deepEqual(bare.lines, []);
});
