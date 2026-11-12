# แผนแบ่งงาน: Chanjai Tarot รอบปรับใหม่

ทำตามลำดับ: **Codex กับ Grok เริ่มพร้อมกัน** → **Antigravity** เริ่มได้ทันทีเหมือนกัน แต่ห้ามแตะไฟล์ของคนอื่น

| เครื่องมือ | งาน | ไฟล์ที่เป็นเจ้าของ (แก้ได้คนเดียว) |
|---|---|---|
| **Codex** | ข้อมูลไพ่ 78 ใบ, ระบบสุ่ม/สเปรด, โหราศาสตร์ไทย, ประวัติ, ต่อรูปไพ่ | `src/tarot.ts`, `src/minor-meanings.ts`, `src/data/**`, `src/storage.ts`, `src/astro.ts`, `public/cards/**`, `tests/*.test.ts` |
| **Grok** | เขียนภาษาทั้งหมด: คำทำนาย 78 ใบ, เสียงแม่หมอ, ข้อความปุ่ม/หน้าจอ | ส่งออกเป็นไฟล์ `content/*.json` เท่านั้น (ไม่เขียนโค้ด) |
| **Antigravity** | UI/UX ใหม่ทั้งหมด: สี ขาว-ดำ-ทอง, ฟอนต์, แอนิเมชันมือหยิบไพ่, หน้าแชร์ | `src/App.tsx`, `src/ReadingFlow.tsx`, `src/Dialog.tsx`, `src/art.tsx`, `src/share.ts`, `src/styles.css`, `index.html`, `tests/browser/**` |

## สัญญากลาง (ทุกตัวต้องยึด)
- รหัสไพ่: `the-fool`, `the-magician` … `the-world` / `ace-of-cups` … `king-of-pentacles`
- ข้อความทุกคำบนจอมาจาก `content/ui.json` และ `content/cards.json` (Grok เขียน, Codex โหลดเข้า `src/data/`)
- Antigravity ใช้ข้อมูลผ่าน `import { ... } from "./tarot"` เท่านั้น ห้าม hardcode คำทำนายใน UI

## เรื่องไพ่ 21 ใบ
สำรับทาโรต์มาตรฐาน (Rider-Waite-Smith) มี **78 ใบ** = Major Arcana 22 ใบ + Minor Arcana 56 ใบ
ไฟล์ 21 ใบ น่าจะเป็น Major Arcana ที่ขาดไป 1 ใบ (เช็คว่าขาดใบไหน)
**แนะนำ:** เปิดตัวด้วย Major 22 ใบก่อน (ไพ่ประจำวัน + สเปรด 1–3 ใบใช้ได้เต็มที่ แอปไทยหลายเจ้าก็ทำแบบนี้)
หาภาพใบที่ขาดมาเพิ่มอีก 1 ใบ แล้วค่อยเพิ่ม Minor 56 ใบทีหลัง

> "แม่นที่สุด" = ยึดความหมายดั้งเดิมจาก A.E. Waite, *The Pictorial Key to the Tarot* (1910, เป็นสาธารณสมบัติ) ซึ่งเป็นต้นฉบับของสำรับที่คนไทยใช้กันมากที่สุด ไม่แต่งความหมายขึ้นเอง
