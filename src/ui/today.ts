// Small "today" helpers for the home strip: moon phase, Thai day colour, lucky number / colour.
const SYNODIC = 29.530588853;

export function moonPhase(now = new Date()) {
  const jd = now.getTime() / 86400000 + 2440587.5;
  const age = (((jd - 2451550.1) % SYNODIC) + SYNODIC) % SYNODIC;
  const p = age / SYNODIC; // 0 new, .5 full
  const lit = (1 - Math.cos(2 * Math.PI * p)) / 2;
  const names = ["เดือนมืด", "จันทร์เสี้ยวข้างขึ้น", "ครึ่งดวงข้างขึ้น", "ค่อนดวงข้างขึ้น", "พระจันทร์เต็มดวง", "ค่อนดวงข้างแรม", "ครึ่งดวงข้างแรม", "จันทร์เสี้ยวข้างแรม"];
  return { p, lit, name: names[Math.round(p * 8) % 8], waxing: p < 0.5 };
}
/** SVG path of the lit part of the moon (radius r, centred on cx, cy). */
export function moonPath(p: number, r: number, cx: number, cy: number) {
  const k = Math.cos(2 * Math.PI * p);
  const rx = Math.max(0.01, Math.abs(k) * r).toFixed(2);
  const waxing = p < 0.5;
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  return `M${cx} ${cy - r}A${r} ${r} 0 0 ${outer} ${cx} ${cy + r}A${rx} ${r} 0 0 ${inner} ${cx} ${cy - r}Z`;
}

const DAYS = [
  ["วันอาทิตย์", "สีแดง", "#e5484d"],
  ["วันจันทร์", "สีเหลือง", "#f2c230"],
  ["วันอังคาร", "สีชมพู", "#f58fb0"],
  ["วันพุธ", "สีเขียว", "#3fa66b"],
  ["วันพฤหัสบดี", "สีส้ม", "#f0883e"],
  ["วันศุกร์", "สีฟ้า", "#4a9be8"],
  ["วันเสาร์", "สีม่วง", "#7b4dd8"],
] as const;
export function thaiDay(now = new Date()) {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "short" }).format(now);
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  const [day, colour, hex] = DAYS[Math.max(0, i)];
  return { day, colour, hex };
}

const NAMED: [string, string][] = [
  ["ขาวงาช้าง", "#f1ead8"], ["ชมพูอ่อน", "#f4b6c8"], ["ม่วงลาเวนเดอร์", "#aba1ce"], ["ม่วงเข้ม", "#6d4aa8"],
  ["ฟ้าอ่อน", "#9eaec6"], ["น้ำเงิน", "#3b4f9a"], ["เขียวมินต์", "#a5b49e"], ["เขียวเข้ม", "#3f7a5a"],
  ["ทอง", "#d6b25e"], ["เหลืองนวล", "#f0d98a"], ["ส้มอ่อน", "#eaa070"], ["แดงเข้ม", "#b8453f"],
  ["น้ำตาลทราย", "#c1a07e"], ["เทาควันไฟ", "#8c8696"],
];
function rgb(h: string) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
export function colourName(hex: string) {
  const a = rgb(hex);
  let best = NAMED[0], bd = Infinity;
  for (const c of NAMED) {
    const b = rgb(c[1]);
    const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return { name: best[0], hex: best[1] };
}
/** Lucky number 1-9 and colour derived from the day's card (same card => same answer). */
export function luckyFromCard(card: { id: string; number: number | null; tint: string }) {
  const seed = card.number ?? [...card.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return { number: (seed % 9) + 1, colour: colourName(card.tint) };
}
