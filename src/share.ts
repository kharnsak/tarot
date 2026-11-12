import { cardById, interpretation, topics } from "./tarot";
import { cardSvg } from "./art";
import { thaiDate } from "./storage";
import type { Reading } from "./storage";

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines = 5,
) {
  const words = Array.from(
    new Intl.Segmenter("th", { granularity: "word" }).segment(text),
    (s) => s.segment,
  );
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (ctx.measureText(line + word).width > width && line) {
      lines.push(line.trim());
      line = word;
    } else line += word;
  }
  if (line) lines.push(line.trim());
  lines
    .slice(0, maxLines)
    .forEach((text, i) =>
      ctx.fillText(
        text + (i === maxLines - 1 && lines.length > maxLines ? "…" : ""),
        x,
        y + i * lineHeight,
      ),
    );
  return Math.min(lines.length, maxLines) * lineHeight;
}
export async function createShareImage(
  reading: Reading,
  artwork: Record<string, string>,
) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างภาพ");
  const bg = ctx.createLinearGradient(0, 0, 1080, 1440);
  bg.addColorStop(0, "#332340");
  bg.addColorStop(0.5, "#21182e");
  bg.addColorStop(1, "#13101d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1440);
  const glow = ctx.createRadialGradient(540, 450, 20, 540, 450, 650);
  glow.addColorStop(0, "#9373a040");
  glow.addColorStop(1, "#9373a000");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1440);
  ctx.strokeStyle = "#d4b98b70";
  ctx.lineWidth = 1;
  ctx.strokeRect(35, 35, 1010, 1370);
  ctx.strokeRect(46, 46, 988, 1348);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e6cc9f";
  ctx.font = '42px "Noto Serif Thai"';
  ctx.fillText("☾ จันทร์ใจ", 540, 128);
  ctx.fillStyle = "#c5b7cd";
  ctx.font = '21px "Noto Sans Thai"';
  ctx.fillText(
    `${reading.daily ? "ไพ่ประจำวันของฉัน" : topics.find((t) => t.id === reading.topic)?.label} · ${thaiDate(new Date(reading.createdAt))}`,
    540,
    181,
  );
  const selected = reading.cards.map((id) => cardById.get(id)!);
  const count = selected.length,
    cardWidth = count === 1 ? 300 : 238,
    cardHeight = (cardWidth * 350) / 220;
  for (const [i, card] of selected.entries()) {
    let image: HTMLImageElement;
    try {
      image = await loadImage(
        artwork[card.id] ||
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(card, `share-${i}`))}`,
      );
    } catch {
      image = await loadImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(card, `fallback-${i}`))}`,
      );
    }
    const x =
        540 - (count * cardWidth + (count - 1) * 35) / 2 + i * (cardWidth + 35),
      y = count === 1 ? 245 : 285;
    ctx.save();
    ctx.shadowColor = "#0008";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 12);
    ctx.clip();
    ctx.drawImage(image, x, y, cardWidth, cardHeight);
    ctx.restore();
    if (count === 3) {
      ctx.fillStyle = "#d8c1e4";
      ctx.font = '22px "Noto Sans Thai"';
      ctx.fillText(
        ["สิ่งที่ผ่านมา", "สิ่งที่เป็นอยู่", "แนวทางข้างหน้า"][i],
        x + cardWidth / 2,
        y + cardHeight + 47,
      );
    }
  }
  let y = count === 1 ? 800 : 785;
  ctx.fillStyle = "#f4e7d7";
  ctx.font = '38px "Noto Serif Thai"';
  ctx.fillText(
    count === 1 ? selected[0].keyword : "ค่อย ๆ ฟังเสียงข้างใน",
    540,
    y,
  );
  y += 65;
  ctx.fillStyle = "#ddd3e3";
  ctx.font = '25px "Noto Sans Thai"';
  if (count === 1)
    y += wrap(
      ctx,
      interpretation(selected[0], reading.topic),
      540,
      y,
      810,
      45,
      5,
    );
  else
    for (const card of selected) {
      y += wrap(ctx, `${card.thai} · ${card.keyword}`, 540, y, 820, 42, 2);
      y += 14;
    }
  ctx.strokeStyle = "#d4b98b50";
  ctx.beginPath();
  ctx.moveTo(430, 1150);
  ctx.lineTo(650, 1150);
  ctx.stroke();
  ctx.fillStyle = "#d9bd93";
  ctx.font = '24px "Noto Serif Thai"';
  ctx.fillText("คำตอบที่สำคัญที่สุด ยังอยู่ในใจคุณ", 540, 1210);
  ctx.fillStyle = "#aa9cb7";
  ctx.font = '19px "Noto Sans Thai"';
  ctx.fillText(
    "เพื่อความบันเทิงและการไตร่ตรอง ไม่ใช่คำทำนายที่แน่นอน",
    540,
    1284,
  );
  ctx.fillStyle = "#d6c5a4";
  ctx.font = '20px "Cormorant Garamond"';
  ctx.fillText(
    "C H A N J A I   ·   A   M O M E N T   F O R   Y O U",
    540,
    1348,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("ไม่สามารถบันทึกภาพได้")),
      "image/png",
    ),
  );
}
