// Generate tarot card art with the OpenAI Images API in the deck's existing style.
// Usage: OPENAI_API_KEY=... node scripts/gen-cards.mjs [--only=the-fool,ace-of-cups] [--skip-existing] [--minor-only]
// Reference images (style anchors) are sent with every request; output goes to public/cards/raw/<id>.png,
// then run `npm run import-cards` to convert to webp + update the manifest.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";

const STYLE = `Illustrate one tarot card for a Thai-inspired deck. Match the attached reference cards exactly in style:
clean line-art illustration, soft gradients, gold foil outlines, no photorealism.
Palette: royal purple (#6B3FA0), lavender, soft pink (#F4B6C8), ivory/cream (#FFF7E6), gold (#D4AF37).
Ornate Thai kanok gold border with lotus corners, the same frame on every card.
Cream name plate at the bottom with the card name in English and its Thai transliteration.
Characters are Thai/Southeast Asian in soft Thai-inspired clothing, calm gentle faces.
Keep Rider-Waite-Smith symbolism and composition (same objects and count of suit symbols).
Suits: Wands = golden lotus-tipped staffs, Cups = gold Thai goblets, Swords = slim gold Thai swords, Pentacles = gold coins with a lotus star.
Portrait, no extra text, no watermark, no nudity.`;

const REFS = ["public/cards/the-sun.webp", "public/cards/the-star.webp", "public/cards/judgement.webp"];
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const only = args.only ? new Set(args.only.split(",")) : null;
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error("Set OPENAI_API_KEY");

const cards = JSON.parse(await readFile("scripts/card-prompts.json", "utf8"))
  .filter((c) => (!only || only.has(c.id)) && (!("minor-only" in args) || !c.number));
await mkdir("public/cards/raw", { recursive: true });
const refs = await Promise.all(REFS.map(async (p) => new Blob([await readFile(p)], { type: "image/webp" })));

for (const c of cards) {
  const out = `public/cards/raw/${c.id}.png`;
  if ("skip-existing" in args && (await access(out).then(() => true, () => false))) continue;
  const form = new FormData();
  form.append("model", process.env.IMAGE_MODEL || "gpt-image-1");
  form.append("size", "1024x1536");
  form.append("quality", process.env.IMAGE_QUALITY || "high");
  form.append("prompt", `${STYLE}\n\nCard: ${c.number ? c.number + " — " : ""}${c.name}. Scene: ${c.scene}.`);
  refs.forEach((b, i) => form.append("image[]", b, `ref${i}.webp`));
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
    const json = await res.json();
    if (res.ok && json.data?.[0]?.b64_json) {
      await writeFile(out, Buffer.from(json.data[0].b64_json, "base64"));
      console.log("ok", c.id);
      break;
    }
    console.error(`fail ${c.id} (try ${attempt}):`, json.error?.message || res.status);
    if (attempt === 3) process.exitCode = 1;
  }
}
