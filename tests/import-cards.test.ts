import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error plain .mjs script without types
import { matchName } from "../scripts/import-cards.mjs";

test("import-cards matches filenames loosely", () => {
  const id = (f: string) => matchName(f)?.id;
  assert.equal(id("17.png"), "the-star");
  assert.equal(id("the_star.jpg"), "the-star");
  assert.equal(id("Star.JPG"), "the-star");
  assert.equal(id("17-the-star.webp"), "the-star");
  assert.equal(id("00_fool.png"), "the-fool");
  assert.equal(id("0.png"), "the-fool");
  assert.equal(id("21.png"), "the-world");
  assert.equal(id("wheel of fortune.png"), "wheel-of-fortune");
  assert.equal(id("high_priestess.png"), "the-high-priestess");
  assert.equal(id("priestess.png"), "the-high-priestess");
  assert.equal(id("strength.png"), "strength");
  assert.equal(id("ace_of_cups.png"), "ace-of-cups");
  assert.equal(id("2-of-swords.png"), "two-of-swords");
  assert.equal(id("Queen Pentacles.png"), "queen-of-pentacles");
  assert.equal(id("cups10.png"), "ten-of-cups");
  assert.equal(id("22.png"), undefined);
  assert.equal(id("random.png"), undefined);
});
