# ภาพไพ่ของคุณ

นำภาพไพ่ที่มีสิทธิ์ใช้งานมาใส่ในโฟลเดอร์นี้ แล้วจับคู่รหัสไพ่กับพาธใน `manifest.json` เช่น:

```json
{
  "the-sun": "/cards/the-sun.webp",
  "the-moon": "/cards/the-moon.webp",
  "ace-of-cups": "/cards/ace-of-cups.webp"
}
```

ภาพที่ยังไม่ได้ใส่จะใช้ภาพ SVG ชั่วคราวที่วาดสำหรับต้นแบบนี้ สัดส่วนแนะนำ 22:35 ควรใช้ WebP/JPEG ขนาดประมาณ 660×1050 หรือใหญ่กว่า ชื่อไพ่ Major Arcana ดูใน `src/tarot.ts`; Minor Arcana ใช้ `{ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king}-of-{wands|cups|swords|pentacles}`

ใช้พาธภายในเว็บไซต์ เพื่อให้การบันทึกภาพแชร์ทำงานโดยไม่มีข้อจำกัด CORS ไม่ต้องใส่ token หรือ secret ใน manifest
