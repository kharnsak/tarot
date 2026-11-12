import { cardById } from "./tarot";
import { cardSvg } from "./art";
import { thaiDate } from "./storage";
import type { Reading } from "./storage";
import { chips, positions, ui } from "./ui/copy";

export type ShareFormat = "story" | "feed";
const SIZES: Record<ShareFormat, [number, number]> = { story: [1080, 1920], feed: [1080, 1350] };

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), (s) => s.segment);
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    if (ctx.measureText(line + word).width > width && line) {
      out.push(line.trim());
      line = word;
    } else line += word;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}
function gold(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#B8913A");
  g.addColorStop(0.45, "#E9CF8A");
  g.addColorStop(0.7, "#B8913A");
  g.addColorStop(1, "#D9BC72");
  return g;
}

export async function createShareImage(reading: Reading, artwork: Record<string, string>, format: ShareFormat = "story") {
  const [W, H] = SIZES[format];
  const story = format === "story";
  await Promise.all([
    document.fonts.load('400 30px "Anuphan"', "ไพ่ จันทร์ใจ"),
    document.fonts.load('600 60px "Anuphan"', "ไพ่ จันทร์ใจ"),
    document.fonts.load('italic 500 30px "Cormorant Garamond"', "CHANJAI"),
  ]).catch(() => {});
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // ivory ground with a very soft light
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FAF8F3");
  bg.addColorStop(1, "#F1ECE1");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const light = ctx.createRadialGradient(W / 2, H * 0.3, 20, W / 2, H * 0.3, W * 0.8);
  light.addColorStop(0, "rgba(233,207,138,.22)");
  light.addColorStop(1, "rgba(233,207,138,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = gold(ctx, 0, 0, W, H);
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 58, W - 116, H - 116);
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const top = story ? 150 : 128;
  ctx.fillStyle = gold(ctx, W / 2 - 150, 0, W / 2 + 150, 0);
  ctx.font = '600 44px "Anuphan"';
  ctx.fillText(ui.brand, W / 2, top);
  ctx.fillStyle = "#6B6660";
  ctx.font = '400 28px "Anuphan"';
  const label = reading.daily ? ui.share.dailyLabel : (chips.find((c) => c.topic === reading.topic)?.label ?? "");
  ctx.fillText(`${label} · ${thaiDate(new Date(reading.createdAt))}`, W / 2, top + 54);

  const selected = reading.cards.map((id) => cardById.get(id)!);
  const count = selected.length;
  const cw = count === 1 ? (story ? 460 : 360) : count === 2 ? (story ? 380 : 300) : story ? 304 : 290;
  const ch = (cw * 350) / 220;
  const gap = count === 1 ? 0 : 30;
  const cy = story ? (count === 1 ? 330 : 400) : count === 1 ? 210 : 240;
  for (const [i, card] of selected.entries()) {
    let image: HTMLImageElement;
    try {
      image = await loadImage(artwork[card.id] || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(card, `s${i}`))}`);
    } catch {
      image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(card, `f${i}`))}`);
    }
    const x = W / 2 - (count * cw + (count - 1) * gap) / 2 + i * (cw + gap);
    ctx.save();
    ctx.shadowColor = "rgba(40,30,10,.38)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 28;
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.roundRect(x, cy, cw, ch, 16);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, cy, cw, ch, 16);
    ctx.clip();
    ctx.drawImage(image, x, cy, cw, ch);
    ctx.restore();
    if (count > 1) {
      ctx.fillStyle = "#8A6A22";
      ctx.font = '500 26px "Anuphan"';
      ctx.fillText(positions[i], x + cw / 2, cy + ch + 50);
      ctx.fillStyle = "#111";
      ctx.font = '600 32px "Anuphan"';
      ctx.fillText(card.thai, x + cw / 2, cy + ch + 96);
    }
  }
  let y = cy + ch + (count > 1 ? 96 : 0);
  if (count === 1) {
    ctx.fillStyle = "#111";
    ctx.font = '600 48px "Anuphan"';
    ctx.fillText(selected[0].thai, W / 2, y + 84);
    ctx.fillStyle = "#8A6A22";
    ctx.font = 'italic 500 34px "Cormorant Garamond"';
    ctx.fillText(selected[0].name, W / 2, y + 132);
    y += 132;
  }

  // the big line
  const quote = selected[count === 3 ? 1 : 0].keyword;
  const qsize = story ? 70 : 58;
  ctx.fillStyle = "#111";
  ctx.font = `600 ${qsize}px "Anuphan"`;
  const ql = lines(ctx, quote, W - 220).slice(0, 3);
  y += story ? 130 : 108;
  ql.forEach((l, i) => ctx.fillText(l, W / 2, y + qsize + i * qsize * 1.3));
  y += qsize + (ql.length - 1) * qsize * 1.3;

  if (story && count > 1) {
    y += 110;
    ctx.font = '400 32px "Anuphan"';
    ctx.fillStyle = "#6B6660";
    for (const [i, card] of selected.entries()) {
      const row = `${positions[i]} · ${card.keyword}`;
      ctx.fillText(lines(ctx, row, W - 240)[0], W / 2, y + i * 58);
    }
  }

  // footer
  const fy = H - (story ? 150 : 118);
  ctx.strokeStyle = gold(ctx, W / 2 - 80, 0, W / 2 + 80, 0);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 70, fy - 62);
  ctx.lineTo(W / 2 + 70, fy - 62);
  ctx.stroke();
  ctx.fillStyle = gold(ctx, W / 2 - 160, 0, W / 2 + 160, 0);
  ctx.font = 'italic 500 34px "Cormorant Garamond"';
  ctx.fillText("C H A N J A I   T A R O T", W / 2, fy);
  ctx.fillStyle = "#6B6660";
  ctx.font = '400 22px "Anuphan"';
  ctx.fillText(ui.home.disclaimer, W / 2, fy + 44);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}
