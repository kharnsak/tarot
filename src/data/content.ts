// Loads Grok's content files if they exist. Vite resolves import.meta.glob at build time
// (a missing file simply yields {}); under plain Node (tests) it is undefined, so we fall back
// to empty and tests inject content explicitly.
import { normalizeCardsFile } from "./entries";
import type { CardContent } from "./entries";
import type { AstroContent } from "./astro-types";

const first = <T>(mods: Record<string, T>): T | undefined => Object.values(mods)[0];

const cardsMods: Record<string, unknown> =
  typeof import.meta.glob === "function"
    ? import.meta.glob("../../content/cards.json", { eager: true, import: "default" })
    : {};
const astroMods: Record<string, AstroContent> =
  typeof import.meta.glob === "function"
    ? import.meta.glob("../../content/astro.json", { eager: true, import: "default" })
    : {};

export const loadedContent: {
  cards: CardContent[];
  astro: AstroContent | undefined;
} = {
  cards: normalizeCardsFile(first(cardsMods)),
  astro: first(astroMods),
};
