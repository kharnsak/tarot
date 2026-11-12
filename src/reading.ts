import { cardText, entryById, SPREADS, yesNo } from "./tarot";
import type { CardEntry } from "./tarot";
import type { Reading } from "./storage";
import { positions } from "./ui/copy";
import type { Focus } from "./ui/copy";

export type ResolvedCard = { card: CardEntry; reversed: boolean; label: string };

/** Which card text a saved reading shows. Older readings fall back to their topic. */
export function focusOf(r: Reading): Focus {
  if (r.focus) return r.focus;
  return r.topic === "love" ? "love" : r.topic === "work" ? "work" : "core";
}
export function isYesNo(r: Reading) {
  return r.spread === "yesno" || (!r.spread && r.topic === "decision" && r.cards.length === 1);
}
export function resolveCards(r: Reading): ResolvedCard[] {
  const labels = r.spread ? SPREADS[r.spread].positions.map((p) => p.label) : positions;
  return r.cards.map((id, i) => ({
    card: entryById.get(id)!,
    reversed: !!r.reversed?.[i],
    label: r.cards.length > 1 ? (labels[i] ?? "") : "",
  }));
}
/** Index of the card whose advice is the big quote. */
export const quoteIndex = (count: number) => (count === 3 ? 1 : 0);
export function quoteOf(r: Reading) {
  const cards = resolveCards(r);
  const c = cards[quoteIndex(cards.length)];
  return cardText(c.card, c.reversed, "advice");
}
export { yesNo };
