// All UI strings live here. This is the adapter between the components and content/ui.json:
// each mapped string picks one random variant (once, when the app loads) and falls back to the
// literal below when the key is missing or empty.
import uiJson from "../../content/ui.json";
import type { SpreadId, Topic } from "../tarot";

type Vars = Record<string, string | number>;
const json = uiJson as unknown as Record<string, Record<string, unknown>>;
const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
const chosen = new Map<string, number>(); // one stable random pick per key per page load
/** Random variant of content/ui.json `group.key`, or `fallback`. {count}/{total}/{remaining} are filled from `vars`. */
export function variant(group: string, key: string, fallback: string, vars?: Vars): string {
  const list = json[group]?.[key];
  const ok = Array.isArray(list) ? list.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
  const id = `${group}.${key}`;
  if (ok.length && !chosen.has(id)) chosen.set(id, Math.floor(Math.random() * ok.length));
  const text = ok.length ? ok[chosen.get(id)! % ok.length] : fallback;
  return fill(text, vars);
}

export type Focus = "core" | "love" | "them" | "work" | "money";
export type FollowKey = "love" | "them" | "work" | "money" | "decision";

export type TopicChip = {
  id: string;
  topic: Topic;
  /** Fixed spread for this chip; null = the person toggles 1 or 3 cards. */
  spread: SpreadId | null;
  /** Which text of the card to read (cardText key). */
  focus: Focus;
  followKey: FollowKey | null;
  label: string;
  preset: string;
  examples: string[];
  followUps: string[];
};

export const chips: TopicChip[] = [
  {
    id: "love",
    spread: "love3",
    focus: "love",
    followKey: "love",
    topic: "love",
    label: "ความรัก",
    preset: "",
    examples: ["เรากับเขาจะไปต่อไหม", "ควรเปิดใจให้ใครใหม่หรือเปล่า"],
    followUps: ["ควรทำอะไรต่อ", "อะไรที่ฉันมองข้ามไป", "เดือนหน้าจะเป็นอย่างไร"],
  },
  {
    id: "mind",
    spread: "them3",
    focus: "them",
    followKey: "them",
    topic: "love",
    label: "เขาคิดยังไง",
    preset: "เขาคิดกับฉันอย่างไร",
    examples: ["เขาคิดกับฉันอย่างไร", "เขายังนึกถึงเราอยู่ไหม"],
    followUps: ["ฉันควรบอกความรู้สึกไหม", "ควรรอหรือปล่อยวาง", "ใจฉันต้องการอะไร"],
  },
  {
    id: "work",
    spread: "work3",
    focus: "work",
    followKey: "work",
    topic: "work",
    label: "งาน",
    preset: "",
    examples: ["ควรเปลี่ยนงานช่วงนี้ไหม", "งานที่ทำอยู่เหมาะกับฉันหรือเปล่า"],
    followUps: ["ควรเริ่มจากอะไรก่อน", "อุปสรรคตอนนี้คืออะไร", "โอกาสอยู่ตรงไหน"],
  },
  {
    id: "money",
    spread: "work3",
    focus: "money",
    followKey: "money",
    topic: "work",
    label: "เงิน",
    preset: "เรื่องการเงินของฉันช่วงนี้เป็นอย่างไร",
    examples: ["การเงินช่วงนี้เป็นอย่างไร", "ควรเริ่มออมหรือลงทุนไหม"],
    followUps: ["ควรระวังอะไร", "ควรเก็บหรือใช้", "ทำอย่างไรให้มั่นคงขึ้น"],
  },
  {
    id: "yesno",
    spread: "yesno",
    focus: "core",
    followKey: "decision",
    topic: "decision",
    label: "Yes / No",
    preset: "",
    examples: ["ควรตัดสินใจเรื่องนี้ไหม", "ตอนนี้เป็นจังหวะที่ใช่หรือเปล่า"],
    followUps: ["ถ้าเลือกทางนี้จะเป็นอย่างไร", "ควรรอก่อนไหม", "ขออีกมุมมอง"],
  },
  {
    id: "ask",
    spread: null,
    focus: "core",
    followKey: null,
    topic: "general",
    label: "ถามเอง",
    preset: "",
    examples: ["ช่วงนี้ฉันควรใส่ใจอะไร", "สัปดาห์นี้ใจฉันต้องการอะไร"],
    followUps: ["เล่าให้ละเอียดขึ้นอีกนิด", "ควรทำอะไรต่อ", "อะไรกำลังเปลี่ยนไป"],
  },
];

export const positions = ["ที่ผ่านมา", "ตอนนี้", "ข้างหน้า"];

export const REVERSED_LABEL = "กลับหัว";

/** Pick the chip that best describes a saved reading. */
export function chipOf(r: { topic: Topic; focus?: Focus }): TopicChip {
  const by = (id: string) => chips.find((c) => c.id === id)!;
  if (r.focus === "them") return by("mind");
  if (r.focus === "money") return by("money");
  if (r.focus === "love") return by("love");
  if (r.focus === "work") return by("work");
  return r.topic === "love" ? by("love") : r.topic === "work" ? by("work") : r.topic === "decision" ? by("yesno") : by("ask");
}

export const ui = {
  brand: "จันทร์ใจ",
  brandSub: "CHANJAI",
  skip: "ข้ามไปยังเนื้อหา",
  close: "ปิดหน้าต่าง",
  nav: { settings: "ตั้งค่าวันเกิด", library: "ห้องสมุดไพ่", journal: "บันทึกของใจ", about: "เกี่ยวกับเรา", dark: "โหมดกลางคืน", light: "โหมดกลางวัน" },
  greet: { morning: "สวัสดีตอนเช้า", noon: "สวัสดีตอนบ่าย", evening: "สวัสดีตอนเย็น", night: "สวัสดีตอนค่ำ" },
  home: {
    dailyTitle: "ไพ่ประจำวัน",
    dailySub: "หนึ่งใบ หนึ่งข้อความสำหรับวันนี้",
    dailyCta: variant("home", "dailyButton", "เปิดไพ่ประจำวัน"),
    dailyDone: "อ่านอีกครั้ง",
    topicsTitle: variant("home", "askPrompt", "อยากถามเรื่องอะไร"),
    streak: (n: number) => (n > 0 ? variant("streak", "label", `ต่อเนื่อง ${n} วัน`, { count: n }) : "เริ่มวันแรกวันนี้"),
    /** Encouragement line from content/ui.json streak copy. */
    streakNote: (s: { current: number; longest: number; doneToday: boolean }) => {
      const key = s.current >= 30 ? "day30" : s.current >= 7 ? "day7" : s.current >= 3 ? "day3" : s.current >= 1 ? "day1" : s.longest > 0 ? "broken" : "";
      return key ? variant("streak", key, "") : "";
    },
    luckyColors: "สีมงคลวันนี้",
    streakHint: "นับวันที่เปิดไพ่ประจำวัน",
    disclaimer: variant("disclaimer", "short", "เพื่อความบันเทิงและการไตร่ตรอง ไม่ใช่คำทำนายที่แน่นอน"),
  },
  settings: {
    title: "วันเกิดของคุณ",
    sub: "ไม่บังคับ ใส่แล้วแม่หมอจะเติมประโยคส่วนตัวและสีมงคลให้",
    date: "วันเกิด",
    time: "เวลาเกิด (ไม่บังคับ)",
    hint: "เก็บเฉพาะในเบราว์เซอร์นี้ ไม่ส่งไปที่ไหน",
    save: "บันทึก",
    clear: "ลบวันเกิดออก",
  },
  steps: ["ตั้งจิต", "หยิบไพ่", "คำทำนาย"],
  setup: {
    dailyTitle: "นึกถึงวันนี้ของคุณ",
    dailySub: "หายใจลึก ๆ แล้วสับไพ่ด้วยใจที่สงบ",
    title: variant("shuffle", "title", "ตั้งคำถามในใจ"),
    sub: "พิมพ์สั้น ๆ หรือข้ามไปก็ได้",
    label: "คำถามของคุณ",
    placeholder: variant("home", "askPlaceholder", "พิมพ์คำถามที่นี่"),
    examples: "ลองถามแบบนี้",
    spread1: "1 ใบ",
    spread3: "3 ใบ",
    spreadLabel: "จำนวนไพ่",
    spreadHint3: "ที่ผ่านมา · ตอนนี้ · ข้างหน้า",
    holdHint: variant("shuffle", "instruction", "กดค้างที่สำรับเพื่อสับไพ่"),
    holdAria: "กดค้างเพื่อสับไพ่",
    holding: variant("shuffle", "shuffling", "กำลังสับ... ปล่อยเมื่อรู้สึกใช่"),
  },
  pick: {
    title: (n: number, total: number) => {
      const t = variant("pick", "title", "หยิบไพ่ที่ใช่");
      return total === 1 ? t : `${t} (${n}/${total})`;
    },
    counter: (count: number, total: number) => variant("pick", "counter", `เลือกแล้ว ${count} จาก ${total} ใบ`, { count, total, remaining: total - count }),
    sub: variant("pick", "instruction", "ไล่นิ้วผ่านพัดไพ่ ปล่อยนิ้วเพื่อหยิบใบนั้น"),
    pickedAll: "ครบแล้ว",
    reveal: "เปิดไพ่",
    revealing: variant("reveal", "waiting", "กำลังเปิดไพ่"),
    read: "อ่านคำทำนาย",
    cardAria: (n: number) => `เลือกไพ่ใบที่ ${n}`,
    again: "สับใหม่",
  },
  result: {
    title: "ข้อความถึงคุณ",
    share: variant("share", "button", "แชร์ผล"),
    ask: "ถามต่อ",
    askTitle: variant("result", "askMore", "อยากถามต่อเรื่องอะไร"),
    advice: variant("result", "adviceLabel", "คำแนะนำ"),
    done: "เสร็จแล้ว",
    again: variant("result", "drawAgain", "เปิดไพ่อีกครั้ง"),
    yesno: variant("result", "yesnoLabel", "มุมมองสำหรับคำถามนี้"),
    reversed: REVERSED_LABEL,
    personal: "จากวันเกิดของคุณ",
    labels: {
      core: variant("result", "coreLabel", "ภาพรวม"),
      love: variant("result", "loveLabel", "ความรัก"),
      work: variant("result", "workLabel", "การงาน"),
      money: variant("result", "moneyLabel", "การเงิน"),
      them: variant("result", "themLabel", "ใจของเขา"),
    } as Record<Focus, string>,
    /** Big Yes/No answer plus a short ui.json phrase. */
    verdict: {
      yes: { big: "ใช่", sub: variant("result", "yes", "ไปต่อได้") },
      no: { big: "ไม่ใช่", sub: variant("result", "no", "ชะลอไว้ก่อน") },
      maybe: { big: "ยังไม่ชัด", sub: variant("result", "maybe", "ขึ้นกับคุณ") },
    },
  },
  share: {
    title: "เก็บไว้ใกล้ใจ",
    sub: "บันทึกเป็นภาพ หรือส่งต่อให้ใครสักคน",
    back: "กลับไปอ่านข้อความ",
    story: "สตอรี่",
    feed: "โพสต์",
    save: variant("share", "saveImage", "บันทึกภาพ PNG"),
    send: "แชร์ภาพ",
    imgAlt: "ภาพผลไพ่ของคุณสำหรับแชร์",
    loading: "กำลังจัดภาพ",
    error: variant("errors", "generic", "สร้างภาพไม่สำเร็จ ลองใหม่อีกครั้ง"),
    private: "ภาพไม่แสดงคำถามส่วนตัวของคุณ",
    shareError: "แชร์ไม่สำเร็จ บันทึกภาพแล้วแชร์จากแกลเลอรีได้เลย",
    sheetTitle: "ข้อความจากไพ่จันทร์ใจ",
    site: "CHANJAI TAROT",
    dailyLabel: "ไพ่ประจำวัน",
  },
  library: {
    eyebrow: "LIBRARY",
    title: "ไพ่ทั้ง 78 ใบ",
    sub: "รู้จักความหมายของไพ่แต่ละใบ",
    search: "ค้นหาชื่อไพ่",
    searchAria: "ค้นหาไพ่",
    count: (n: number) => `พบ ${n} ใบ`,
    back: "กลับไปที่ห้องสมุดไพ่",
    tabs: [
      ["all", "ทั้งหมด"],
      ["major", "ไพ่หลัก"],
      ["cups", "ถ้วย"],
      ["wands", "ไม้เท้า"],
      ["swords", "ดาบ"],
      ["pentacles", "เหรียญ"],
    ] as [string, string][],
    empty: "ยังไม่พบไพ่ที่ค้นหา",
    emptyHint: "ลองค้นหาชื่อภาษาไทยหรืออังกฤษ",
    all: "ดูไพ่ทั้งหมด",
    message: "ข้อความจากไพ่",
    love: "ความรัก",
    work: "การงานและการเงิน",
    note: "ความหมายแบบไพ่ตั้งตรง เพื่อการเรียนรู้และไตร่ตรอง",
  },
  journal: {
    title: "บันทึกของใจ",
    sub: "ย้อนกลับมาอ่านวันที่ผ่านมา",
    local: "เก็บเฉพาะในเบราว์เซอร์นี้ ไม่ซิงก์ข้ามเครื่อง",
    noStorage: "เบราว์เซอร์นี้บันทึกไม่ได้ ประวัติอยู่ชั่วคราวจนกว่าจะปิดหน้า",
    emptyTitle: "ยังไม่มีบันทึก",
    emptyText: "เมื่อเปิดไพ่ ผลจะมาอยู่ที่นี่",
    cardsCount: (n: number) => `${n} ใบ`,
    del: "ลบประวัติในเครื่องนี้",
    delConfirm: (n: number) => `ลบประวัติทั้งหมด ${n} รายการ?`,
    delWarn: "ลบแล้วเรียกคืนไม่ได้",
    delYes: "ยืนยันลบประวัติ",
    delNo: "เก็บบันทึกไว้",
    daily: "ไพ่ประจำวัน",
  },
  about: {
    title: "จันทร์ใจ",
    p1: "พื้นที่เล็ก ๆ ให้คุณหยุดพัก และฟังเสียงของตัวเอง ไพ่ทุกใบเป็นคำชวนมองชีวิตอีกมุม ด้วยภาษาที่อ่อนโยน ไม่ตัดสิน",
    values: [
      ["ฟรีทุกวัน", "ไพ่ประจำวันกลับมาเปิดได้ทุกวัน"],
      ["เป็นส่วนตัว", "ไม่ต้องสมัคร ข้อมูลอยู่ในเครื่องคุณ"],
      ["ไตร่ตรอง", "เพื่อความบันเทิง ไม่ใช่คำแนะนำทางการแพทย์ การเงิน หรือกฎหมาย"],
    ] as [string, string][],
    cta: "เปิดไพ่ประจำวัน",
  },
  toast: {
    close: "ปิดข้อความ",
    noSave: "เบราว์เซอร์นี้บันทึกไม่ได้ เก็บผลเป็นภาพไว้ก่อนปิดหน้านะ",
    erased: "ลบประวัติแล้ว",
    eraseFail: "ยังลบข้อมูลไม่ได้",
  },
};
