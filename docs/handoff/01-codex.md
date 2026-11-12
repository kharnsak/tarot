# ใบสั่งงาน: CODEX (ข้อมูลและระบบ)

Repo: React 19 + Vite + TS. อ่าน `docs/handoff/00-README.md` ก่อน **แก้เฉพาะไฟล์ในคอลัมน์ Codex เท่านั้น** ห้ามแตะ UI/CSS

## งาน
1. **รวมข้อมูลไพ่เป็นชุดเดียว** สร้าง `src/data/cards.ts` จาก `content/cards.json` (schema ด้านล่าง) ย้ายของใน `src/tarot.ts` และ `src/minor-meanings.ts` ไปไว้ที่นี่ แล้วให้ `src/tarot.ts` export API:
   - `getDeck(mode: "major" | "full")` ค่าเริ่มต้นเป็น `"major"` (22 ใบ)
   - `drawCards(n, { seed?, allowReversed })` สับไพ่แบบ Fisher-Yates ใช้ `crypto.getRandomValues`
   - `dailyCard(userId, dateISO)` ต้องได้ใบเดิมตลอดวัน (seed = hash(userId+date))
   - `SPREADS`: `daily`(1), `yesno`(1), `love3`(อดีต/ปัจจุบัน/แนวโน้ม), `work3`(สถานการณ์/อุปสรรค/คำแนะนำ), `choice2`(ทาง A/ทาง B), `them3`(ใจเขา/ใจเรา/ความสัมพันธ์)
   - `yesNo(card, reversed)` คืน `"yes" | "no" | "maybe"` ตามตาราง `yesno` ใน cards.json
2. **โหราศาสตร์ไทย** `src/astro.ts`: รับวันเกิด → คืนวันเกิดตามแบบไทย (วันพุธกลางวัน/กลางคืนแยกกัน), ดาวประจำวัน, สีมงคล/สีกาลกิณี, ราศีตะวันตก ใช้เติมบรรทัดเฉพาะบุคคลในผลทำนาย (ข้อความดึงจาก `content/astro.json`)
3. **ภาพไพ่** สคริปต์ `scripts/import-cards.mjs`: อ่านภาพจาก `public/cards/raw/` → แปลงเป็น WebP 660×1050 (ใช้ sharp) → เขียน `public/cards/manifest.json` → **พิมพ์รายชื่อไพ่ที่ยังไม่มีรูป**
4. **ประวัติ + สตรีค** `src/storage.ts`: เก็บการดูดวงย้อนหลัง 100 ครั้ง, สตรีครายวัน (ข้ามคืนตามเวลาไทย Asia/Bangkok), กันข้อมูล localStorage พัง
5. **เทสต์** `tests/tarot.test.ts`: ไม่มีไพ่ซ้ำในสเปรด, ไพ่ประจำวันคงที่ตลอดวัน, ครบ 22/78 ใบ, ทุกใบมีข้อความครบทุกหัวข้อ, ตรวจสตรีคข้ามเที่ยงคืน

## schema `content/cards.json` (Grok จะส่งไฟล์นี้มา ระหว่างรอให้ทำ stub ไว้ 2 ใบ)
```json
{ "id": "the-star", "nameTh": "ดวงดาว", "nameEn": "The Star", "arcana": "major", "number": 17,
  "keywords": ["ความหวัง","ฟื้นตัว"],
  "upright":  { "core": "", "love": "", "work": "", "money": "", "them": "", "advice": "" },
  "reversed": { "core": "", "love": "", "work": "", "money": "", "them": "", "advice": "" },
  "yesno": { "upright": "yes", "reversed": "maybe" },
  "daily": "", "seo": { "title": "", "description": "", "article": "" } }
```

## เสร็จเมื่อ
`npm test` และ `npm run build` ผ่าน, commit ลง branch ของตัวเอง, ส่ง PR
