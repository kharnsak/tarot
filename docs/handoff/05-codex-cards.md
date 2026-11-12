# ใบสั่งงาน CODEX: วาดไพ่ครบ 78 ใบ

ก๊อปข้อความด้านล่างไปแปะใน Codex (เชื่อมกับ repo `kharnsak/tarot`, branch `claude/vigilant-cerf-jdk8iu`)

```
Generate the full 78-card tarot deck art in the deck's existing style and wire it into the app.

1. Run: node scripts/gen-cards.mjs --skip-existing
   (needs OPENAI_API_KEY; uses gpt-image-1 with public/cards/the-sun|the-star|judgement.webp as style references;
   prompts are in scripts/card-prompts.json; output to public/cards/raw/<id>.png)
   If you can generate images natively instead of the API, use the same STYLE text and scene per card from those files.
2. Look at every image. Regenerate (--only=<id>) any card that breaks style: wrong palette, wrong frame, wrong count of suit symbols,
   garbled Thai text on the name plate, nudity, extra limbs. The Star must be modestly dressed.
3. Run: npm run import-cards   (converts to 660x1050 webp + writes public/cards/manifest.json; must report 0 missing with --full)
4. Commit public/cards/*.webp and manifest.json only (public/cards/raw is gitignored). Push to claude/vigilant-cerf-jdk8iu.
Report which cards were regenerated and any that still look off.
```

ค่าใช้จ่ายโดยประมาณ: gpt-image-1 คุณภาพ high ~ $0.25/ใบ → 78 ใบ ~ $20 (ถ้ารีเจนบางใบจะเพิ่มขึ้น) ลดได้ด้วย IMAGE_QUALITY=medium
