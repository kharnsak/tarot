import { createContext, useContext, useId } from "react";
import type { Card } from "./tarot";

export const ArtworkContext = createContext<Record<string, string>>({});
const star = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r} Q${x + 1} ${y - 1} ${x + r} ${y} Q${x + 1} ${y + 1} ${x} ${y + r} Q${x - 1} ${y + 1} ${x - r} ${y} Q${x - 1} ${y - 1} ${x} ${y - r}Z"/>`;
const face =
  '<path d="M91 128q5-5 10 0m18 0q5-5 10 0M108 132l-2 10h7m-11 10q8 6 16 0" fill="none" stroke="#624a61" stroke-width="1.4" stroke-linecap="round"/>';
const sun = `<g transform="translate(0,-4)">${Array.from({ length: 16 }, (_, i) => `<path d="M110 69l-3-18 3-10 3 10Z" transform="rotate(${i * 22.5} 110 134)" fill="#e2c490"/>`).join("")}<circle cx="110" cy="134" r="39" fill="#e4c994" stroke="#f5e6bc"/>${face}<path d="M74 218q36-30 72 0m-79 13q43-31 86 0m-87 12q44-25 88 0" stroke="#d4b889" fill="none"/><path d="M110 198v49m0-20q-27 0-23-18 19 1 23 18m0 12q27 0 23-18-19 1-23 18" fill="#b8b59a" stroke="#787b73"/><circle cx="110" cy="192" r="10" fill="#d9bc80"/>${star(54, 174, 5)}${star(168, 178, 4)}</g>`;
const moon = `<circle cx="111" cy="120" r="51" fill="#d9cfe4"/><circle cx="135" cy="102" r="47" fill="#716381"/><path d="M88 116q9-5 14 0m-4 8-4 10h7m-13 8q8 4 14-1" stroke="#726179" fill="none"/><path d="M55 225l31-62 24 32 25-44 32 74" fill="#a39eb9" stroke="#dbd0df"/><path d="M50 237q28-14 60 0t62 0m-122 9q28-14 60 0t62 0" fill="none" stroke="#cdc0d2"/>${star(52, 80, 7)}${star(165, 132, 7)}${star(154, 58, 4)}`;
const tallStar = `<path d="m110 72 9 43 34 14-34 14-9 44-9-44-34-14 34-14Z" fill="#f1e3b7"/><circle cx="110" cy="129" r="12" fill="#a999c0" stroke="#eedcaf"/>${star(60, 93, 7)}${star(160, 96, 7)}${star(62, 168, 5)}${star(158, 171, 5)}<path d="M56 220q54-32 108 0m-100 11q46-24 92 0m-80 10q34-16 68 0" fill="none" stroke="#dbcfab"/>`;
const cup = (x: number, y: number, scale = 1) =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-15-17h30v11Q15 11 0 11T-15-6Z" fill="#cfb987"/><path d="M0 11v15m-11 0h22M-16-12q-13-1-9 8t11 5m30-13q13-1 9 8T14 1" fill="none" stroke="#e4cca0" stroke-width="2"/></g>`;
const wand = (x: number, y: number, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M0-53v106" stroke="#dac6a4" stroke-width="5" stroke-linecap="round"/><path d="M0-20q-23-4-15-22Q1-39 0-20m0 50q23-4 15-22Q-1 11 0 30" fill="#a5b49e"/></g>`;
const sword = (x: number, y: number, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="m0-66-7 20 4 60h6l4-60Z" fill="#ddd9df"/><path d="M-17 17h34M0 17v26" stroke="#ddc197" stroke-width="5"/><circle cy="46" r="5" fill="#ddc197"/></g>`;
const coin = (x: number, y: number, r = 24) =>
  `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#c6b994" stroke="#e4d6b7"/><path d="${Array.from(
    { length: 5 },
    (_, i) => {
      const angle = ((i * 144 - 90) * Math.PI) / 180;
      return `${i ? "L" : "M"}${Math.cos(angle) * r * 0.7} ${Math.sin(angle) * r * 0.7}`;
    },
  ).join("")}Z" fill="none" stroke="#81725c" stroke-width="1.5"/></g>`;
function scene(card: Card) {
  switch (card.scene) {
    case "sun":
      return sun;
    case "moon":
      return moon;
    case "star":
      return tallStar;
    case "lovers":
      return `<circle cx="110" cy="101" r="38" fill="#cba7ab"/>${star(110, 57, 9)}<path d="M63 232v-66q0-22 17-22t17 22v66m26 0v-66q0-22 17-22t17 22v66" fill="#c3afbd"/><circle cx="80" cy="128" r="12" fill="#debeaa"/><circle cx="140" cy="128" r="12" fill="#debeaa"/><path d="M91 185q19 17 38 0M64 244q46-17 92 0" stroke="#e4d4ac" fill="none"/><path d="M110 120c-28-22-29 14 0 25 29-11 28-47 0-25" fill="#edcfb9"/>`;
    case "tower":
      return `<path d="M75 242V122h70v120M69 122h82l-8-16h-16v11h-17v-11H93v11H77Z" fill="#aaa0b6" stroke="#dfcbd0"/><path d="M98 242v-39q12-16 24 0v39m-25-80v-19h11v19m9 25v-19h11v19" fill="#61566c"/><path d="m142 53-42 44h25l-38 46 66-59h-27l34-31Z" fill="#eed4a1"/>${star(58, 153, 8)}${star(166, 192, 9)}`;
    case "world":
      return `<ellipse cx="110" cy="155" rx="59" ry="83" fill="none" stroke="#d5c997" stroke-width="7" stroke-dasharray="2 9"/><ellipse cx="110" cy="155" rx="55" ry="80" fill="none" stroke="#c3c8a4"/><circle cx="110" cy="121" r="14" fill="#dcc4b3"/><path d="M91 231q-11-65 19-96 30 31 19 96" fill="#bcb1cf"/><path d="M110 160l-31 25m31-25 31 25" stroke="#dcc4b3" stroke-width="7" stroke-linecap="round"/>${star(48, 65, 9)}${star(172, 65, 9)}`;
    case "wheel":
      return `<circle cx="110" cy="151" r="65" fill="none" stroke="#dfc795" stroke-width="3"/><circle cx="110" cy="151" r="48" fill="none" stroke="#dfc795"/><circle cx="110" cy="151" r="15" fill="#dfc795"/>${Array.from({ length: 8 }, (_, i) => `<path d="M110 87v49" stroke="#dfc795" transform="rotate(${i * 45} 110 151)"/>`).join("")}${star(110, 57, 9)}`;
    case "justice":
      return `<path d="M110 82v139m-42 8h84M63 114h94m-85 0-20 51h40Zm76 0-20 51h40Z" stroke="#dec89e" stroke-width="2" fill="none"/><circle cx="110" cy="83" r="11" fill="#dfc896"/><path d="M51 165q21 21 42 0m34 0q21 21 42 0" fill="#c4b1cd" stroke="#dfc896"/>${star(110, 57, 8)}`;
    case "hermit":
      return `<path d="M65 242q5-85 45-132 40 47 45 132Z" fill="#9c94b6"/><circle cx="110" cy="108" r="16" fill="#d2b9aa"/><path d="m91 137-28 25m68-25 27 13m0-1v88" stroke="#dbc29a" stroke-width="5"/><path d="M48 159h28v36H48Z" fill="#c9b887" stroke="#e9d6ab"/>${star(62, 177, 11)}${star(154, 72, 8)}`;
    case "empress":
    case "emperor":
    case "hierophant":
    case "priestess":
      return `<path d="M65 236V111h90v125" stroke="#d9c499" fill="none"/><circle cx="110" cy="116" r="17" fill="#d9bcac"/><path d="M74 236q0-83 36-103 36 20 36 103Z" fill="#b9a6c7"/><path d="m91 93-7-21 18 9 8-18 8 18 18-9-7 21Z" fill="#e0c793"/><path d="M85 184q25-13 50 0v24q-25-13-50 0Z" stroke="#e6cfa7" fill="#9483a5"/>${star(49, 132, 8)}${star(172, 132, 8)}`;
    case "temperance":
      return `${cup(73, 138, 0.9)}${cup(147, 195, 0.9)}<path d="M77 145q69-14 70 31" stroke="#dcd0d7" stroke-width="3" fill="none"/><path d="M59 207q51 26 102 0" stroke="#d3c497" fill="none"/>${star(110, 78, 19)}`;
    case "strength":
      return `<path d="M78 92c-30-33-44 22-7 22 17 0 42-49 59-49 37 0 23 55-7 22" stroke="#dbc49b" fill="none" stroke-width="3"/><circle cx="110" cy="173" r="48" fill="#c6a67e"/><circle cx="110" cy="173" r="31" fill="#e1c59d"/><path d="m84 153 5-19 17 10m10 0 17-10 5 19" fill="#e1c59d"/><path d="M94 168h6m20 0h6m-19 12h6l-3 5Zm-7 11q7 7 14 0" stroke="#775e5c" fill="none"/>`;
    case "wands":
      return `${wand(110, 153)}${star(65, 100, 10)}${star(162, 200, 9)}<circle cx="110" cy="153" r="66" fill="none" stroke="#e2d0a5" opacity=".4"/>`;
    case "cups":
      return `${cup(110, 153, 2)}<path d="M61 230q49-22 98 0m-98 10q49-22 98 0" stroke="#dac9af" fill="none"/>${star(110, 73, 14)}${star(58, 125, 6)}${star(165, 125, 6)}`;
    case "swords":
      return `${sword(110, 156)}${star(62, 110, 10)}${star(164, 110, 10)}<path d="M65 237q45-18 90 0" fill="none" stroke="#d7c6ae"/>`;
    case "pentacles":
      return `${coin(110, 143, 49)}<path d="M67 238q43-57 86 0m-42-43v47M58 218q-6-45 16-58m88 58q6-45-16-58" stroke="#c3c8a1" stroke-width="2" fill="none"/>${star(110, 62, 9)}`;
    default:
      return `<circle cx="110" cy="144" r="53" fill="none" stroke="#e2cfa6"/><path d="M110 89v110M55 144h110" stroke="#e2cfa6" opacity=".4"/>${star(110, 144, 38)}${star(61, 77, 9)}${star(163, 217, 9)}<path d="M67 240q43-29 86 0" fill="none" stroke="#e2cfa6"/>`;
  }
}
const goldDefs = (id: string) =>
  `<linearGradient id="gf-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8913A"/><stop offset=".35" stop-color="#F0DB9C"/><stop offset=".6" stop-color="#B8913A"/><stop offset="1" stop-color="#E9CF8A"/></linearGradient>`;
function backArt(id: string) {
  const g = `url(#gf-${id})`;
  const rays = Array.from(
    { length: 16 },
    (_, i) =>
      `<path d="M110 175 L110 ${i % 2 ? 104 : 92}" transform="rotate(${i * 22.5} 110 175)"/>`,
  ).join("");
  const dots = Array.from(
    { length: 24 },
    (_, i) =>
      `<circle cx="110" cy="${175 - 78}" r="1.3" transform="rotate(${i * 15} 110 175)"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="350" viewBox="0 0 220 350"><defs>${goldDefs(id)}<radialGradient id="bk-${id}" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="#1b1a1d"/><stop offset="1" stop-color="#09090a"/></radialGradient></defs><rect width="220" height="350" rx="12" fill="url(#bk-${id})"/><rect x="8" y="8" width="204" height="334" rx="7" fill="none" stroke="${g}" stroke-width="1.4"/><rect x="14" y="14" width="192" height="322" rx="4" fill="none" stroke="${g}" stroke-width=".6" opacity=".7"/><g fill="none" stroke="${g}" stroke-width=".9" stroke-linecap="round"><circle cx="110" cy="175" r="78"/><circle cx="110" cy="175" r="68" opacity=".55"/><circle cx="110" cy="175" r="30" opacity=".8"/>${rays}<path d="M126 148a30 30 0 1 0 0 54 24 24 0 0 1 0-54Z" fill="${g}" stroke="none"/></g><g fill="${g}">${dots}${star(110, 54, 7)}${star(110, 296, 7)}${star(40, 175, 5)}${star(180, 175, 5)}${star(32, 32, 5)}${star(188, 32, 5)}${star(32, 318, 5)}${star(188, 318, 5)}</g><path d="M60 44h100M60 306h100" stroke="${g}" stroke-width=".6" opacity=".6"/></svg>`;
}
export function cardSvg(card?: Card, suffix = "card") {
  const id = suffix.replace(/[^a-zA-Z0-9-]/g, "");
  if (!card) return backArt(id);
  const g = `url(#gf-${id})`;
  const tint = card.tint || "#a898c2";
  const font = "'Cormorant Garamond',Georgia,serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="350" viewBox="0 0 220 350"><defs>${goldDefs(id)}<linearGradient id="fc-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#262119"/><stop offset=".55" stop-color="#1a1714"/><stop offset="1" stop-color="#120f0c"/></linearGradient><filter id="mute-${id}"><feColorMatrix type="saturate" values=".38"/></filter></defs><rect width="220" height="350" rx="12" fill="url(#fc-${id})"/><rect x="8" y="8" width="204" height="334" rx="7" fill="none" stroke="${g}" stroke-width="1.2"/><rect x="14" y="14" width="192" height="322" rx="4" fill="none" stroke="${g}" stroke-width=".5" opacity=".6"/><g filter="url(#mute-${id})" fill="#ddcaa6" stroke-linecap="round"><rect x="24" y="40" width="172" height="214" rx="80" fill="${tint}" opacity=".2"/>${scene(card)}</g><text x="110" y="34" fill="${g}" font-size="13" font-style="italic" text-anchor="middle" font-family="${font}" letter-spacing="3">${card.numeral}</text><path d="M34 268h152" stroke="${g}" stroke-width=".7"/><text x="110" y="296" fill="#F3E6C8" font-size="${card.name.length > 19 ? "15" : "18"}" font-style="italic" text-anchor="middle" font-family="${font}" letter-spacing="1">${card.name}</text><text x="110" y="319" fill="#B8913A" font-size="8" text-anchor="middle" font-family="${font}" letter-spacing="4">CHANJAI TAROT</text></svg>`;
}
export function CardArt({
  card,
  className = "",
  decorative = false,
}: {
  card?: Card;
  className?: string;
  decorative?: boolean;
}) {
  const id = useId();
  const artwork = useContext(ArtworkContext);
  const path = card && artwork[card.id];
  return (
    <div
      className={`card-art ${card ? "face" : "back"} ${className}`}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : card
            ? `ไพ่ ${card.name} — ${card.thai}`
            : "หลังไพ่จันทร์ใจ"
      }
      aria-hidden={decorative || undefined}
    >
      {path || !card ? (
        <img
          src={path || `${import.meta.env.BASE_URL}cards/back.webp`}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.removeAttribute("hidden");
          }}
        />
      ) : null}
      <div
        hidden={!!path || !card}
        dangerouslySetInnerHTML={{ __html: cardSvg(card, id) }}
      />
    </div>
  );
}
