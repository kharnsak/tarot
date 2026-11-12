// Usage: node --import tsx scripts/import-cards.mjs [--full] [--raw DIR] [--out DIR]
// Reads public/cards/raw/*, matches filenames to card ids loosely ("17", "star", "the_star",
// "2-of-cups", "queen wands"), writes 660x1050 WebP + manifest.json, lists missing cards.
import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { cards } from "../src/data/cards.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
};
const rawDir = opt("--raw", path.join(root, "public/cards/raw"));
const outDir = opt("--out", path.join(root, "public/cards"));
const W = 660,
  H = 1050;
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|tiff?|gif)$/i;

const majors = cards.filter((c) => c.arcana === "major");
const RANKS = {
  ace: "ace", a: "ace", one: "ace", 1: "ace",
  two: "two", 2: "two", three: "three", 3: "three", four: "four", 4: "four", five: "five", 5: "five",
  six: "six", 6: "six", seven: "seven", 7: "seven", eight: "eight", 8: "eight", nine: "nine", 9: "nine",
  ten: "ten", 10: "ten", page: "page", knave: "page", knight: "knight", queen: "queen", king: "king",
};
const SUITS = {
  wands: "wands", wand: "wands", staves: "wands", cups: "cups", cup: "cups",
  swords: "swords", sword: "swords", pentacles: "pentacles", pentacle: "pentacles", coins: "pentacles", coin: "pentacles",
};

const tokens = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    // split glued forms such as "cups02" or "17star"
    .flatMap((t) => t.match(/[a-z]+|\d+/g) ?? []);

/** Returns { id } | { ambiguous: [...] } | null */
export function matchName(file) {
  const t = tokens(file).filter((x) => x !== "of");
  if (!t.length) return null;
  // 1. minor: suit + rank
  const suit = t.map((x) => SUITS[x]).find(Boolean);
  if (suit) {
    const rank = t.map((x) => RANKS[x]).find(Boolean);
    return rank ? { id: `${rank}-of-${suit}` } : null;
  }
  // 2. major by name: every non-"the" token of the file is among the id's tokens
  const words = t.filter((x) => x !== "the" && !/^\d+$/.test(x));
  let byName = [];
  if (words.length)
    byName = majors.filter((c) => {
      const idTokens = c.id.split("-").filter((x) => x !== "the");
      return words.every((w) => idTokens.includes(w));
    });
  // 3. major by number (0-21)
  const num = t.find((x) => /^\d+$/.test(x));
  const byNum = num !== undefined && Number(num) <= 21 ? majors[Number(num)] : undefined;
  if (byName.length === 1) return { id: byName[0].id, conflict: byNum && byNum.id !== byName[0].id ? byNum.id : undefined };
  if (byName.length > 1) return byNum && byName.some((c) => c.id === byNum.id) ? { id: byNum.id } : { ambiguous: byName.map((c) => c.id) };
  if (byNum) return { id: byNum.id };
  return null;
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  if (!(await exists(rawDir))) {
    console.log(`No raw folder at ${rawDir}. Put the image files there and run again.`);
  }
  const files = (await exists(rawDir) ? await readdir(rawDir) : []).filter((f) => IMAGE_EXT.test(f)).sort();
  await mkdir(outDir, { recursive: true });
  const manifestPath = path.join(outDir, "manifest.json");
  let manifest = {};
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch {}
  const known = new Set(cards.map((c) => c.id));
  // drop stale entries whose file is gone
  for (const id of Object.keys(manifest))
    if (!known.has(id) || !(await exists(path.join(outDir, `${id}.webp`)))) delete manifest[id];

  const claimed = new Map();
  const unmatched = [], problems = [];
  for (const file of files) {
    const m = matchName(file);
    if (!m) { unmatched.push(file); continue; }
    if (m.ambiguous) { problems.push(`${file}: ambiguous (${m.ambiguous.join(", ")})`); continue; }
    if (!known.has(m.id)) { unmatched.push(file); continue; }
    if (m.conflict) problems.push(`${file}: name says ${m.id} but number says ${m.conflict}; using ${m.id}`);
    if (claimed.has(m.id)) { problems.push(`${file}: duplicate of ${claimed.get(m.id)} for ${m.id}; skipped`); continue; }
    claimed.set(m.id, file);
  }

  for (const [id, file] of claimed) {
    const src = path.join(rawDir, file);
    const meta = await sharp(src).metadata();
    const ratio = meta.width && meta.height ? meta.width / meta.height : 0;
    if (ratio && Math.abs(ratio - W / H) > 0.04)
      problems.push(`${file}: aspect ${ratio.toFixed(3)} differs from ${(W / H).toFixed(3)}; cropped to fit`);
    await sharp(src).rotate().resize(W, H, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toFile(path.join(outDir, `${id}.webp`));
    manifest[id] = `/cards/${id}.webp`;
    console.log(`ok   ${file} -> ${id}.webp`);
  }
  const sorted = Object.fromEntries(cards.filter((c) => manifest[c.id]).map((c) => [c.id, manifest[c.id]]));
  await writeFile(manifestPath, JSON.stringify(sorted, null, 2) + "\n");

  if (unmatched.length) console.log(`\nUnmatched files (rename to include a card name or number):\n  ${unmatched.join("\n  ")}`);
  if (problems.length) console.log(`\nWarnings:\n  ${problems.join("\n  ")}`);
  const pool = args.includes("--full") ? cards : majors;
  const missing = pool.filter((c) => !sorted[c.id]);
  console.log(`\n${pool.length - missing.length}/${pool.length} ${args.includes("--full") ? "cards" : "Major Arcana"} have images.`);
  if (missing.length) console.log(`Missing:\n${missing.map((c) => `  ${c.id}  (${c.name})`).join("\n")}`);
  if (!args.includes("--full")) console.log(`(${cards.length - majors.length} Minor Arcana not checked; use --full to include them.)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
