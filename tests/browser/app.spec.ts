import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function draw(page: import("@playwright/test").Page, count = 1) {
  await page
    .getByRole("button", { name: /พร้อมแล้ว สับไพ่กัน|ตั้งใจ แล้วสับไพ่/ })
    .click();
  for (let i = 0; i < count; i++)
    await page
      .getByRole("button", { name: `เลือกไพ่ใบที่ ${i + 1}`, exact: true })
      .click();
  await page.getByRole("button", { name: "อ่านข้อความจากไพ่" }).click();
  await expect(
    page.getByRole("button", { name: "แชร์เป็นภาพสวย ๆ" }),
  ).toBeVisible();
}
test("mobile daily ritual persists the same card and exports a real PNG", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ให้ไพ่กระซิบ",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: testInfo.outputPath("home-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "เปิดไพ่ประจำวัน", exact: true })
    .click();
  await draw(page);
  const first = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("chanjai-journal-v1")!),
  );
  expect(first).toHaveLength(1);
  expect(first[0].daily).toBe(true);
  await page.getByRole("button", { name: "แชร์เป็นภาพสวย ๆ" }).click();
  await expect(
    page.getByRole("img", { name: "ภาพผลไพ่ของคุณสำหรับแชร์" }),
  ).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "บันทึกภาพ PNG" }).click(),
  ]);
  await download.saveAs(testInfo.outputPath("share.png"));
  const png = await readFile(testInfo.outputPath("share.png"));
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(1440);
  await page.reload();
  await page.getByRole("button", { name: "อ่านข้อความของวันนี้" }).click();
  await expect(
    page.getByRole("heading", { name: "ข้อความเล็ก ๆ สำหรับวันนี้" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chanjai-journal-v1")!).length,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chanjai-journal-v1")!)[0].cards,
    ),
  ).toEqual(first[0].cards);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "เปิดเมนู" }).click();
  await page
    .getByRole("button", { name: "บันทึกของใจ", exact: true })
    .first()
    .click();
  await expect(page.locator(".journal-entry")).toHaveCount(1);
  await page.getByRole("button", { name: "ลบประวัติในเครื่องนี้" }).click();
  await page.getByRole("button", { name: "ยืนยันลบประวัติ" }).click();
  await expect(
    page.getByRole("heading", { name: "หน้ากระดาษแรกกำลังรอคุณ" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("three-card work reading keeps question and uses three unique cards", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: /การงาน & การเงิน งาน เงิน/ }).click();
  await page.getByLabel("คำถามของคุณ").fill("ควรเปลี่ยนงานในช่วงนี้ไหม");
  await page.getByRole("button", { name: /ไพ่ 3 ใบ ที่ผ่านมา/ }).click();
  await draw(page, 3);
  await expect(page.locator(".result-card")).toHaveCount(3);
  await expect(page.locator(".your-question")).toHaveText(
    "“ควรเปลี่ยนงานในช่วงนี้ไหม”",
  );
  const r = await page.evaluate(
    () => JSON.parse(localStorage.getItem("chanjai-journal-v1")!)[0],
  );
  expect(new Set(r.cards).size).toBe(3);
  expect(r.topic).toBe("work");
  await page.screenshot({
    path: testInfo.outputPath("reading-three.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "แชร์เป็นภาพสวย ๆ" }).click();
  await expect(
    page.getByRole("img", { name: "ภาพผลไพ่ของคุณสำหรับแชร์" }),
  ).toBeVisible();
  const [shareDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "บันทึกภาพ PNG" }).click(),
  ]);
  await shareDownload.saveAs(testInfo.outputPath("share-three.png"));
  await page.getByRole("button", { name: "กลับไปอ่านข้อความ" }).click();
  await page.getByRole("button", { name: "เปิดไพ่อีกครั้ง" }).click();
  await page.getByRole("button", { name: "Yes / No", exact: true }).click();
  await draw(page);
  await expect(page.locator(".result-card")).toHaveCount(1);
});
test("all 78 cards are searchable, filters and details work, modal traps focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ห้องสมุดไพ่", exact: true }).click();
  await expect(page.locator(".library-grid>button")).toHaveCount(78);
  await page.getByRole("button", { name: "ถ้วย", exact: true }).click();
  await expect(page.locator(".library-grid>button")).toHaveCount(14);
  await page.getByRole("button", { name: "ทั้งหมด", exact: true }).click();
  await page.getByRole("searchbox", { name: "ค้นหาไพ่" }).fill("The Sun");
  await expect(page.locator(".library-grid>button")).toHaveCount(1);
  await page.locator(".library-grid>button").click();
  await expect(
    page.getByRole("heading", { name: "พระอาทิตย์", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "กลับไปที่ห้องสมุดไพ่" }).click();
  await page.getByRole("searchbox").fill("ไม่มีชื่อนี้");
  await expect(
    page.getByRole("heading", { name: "ยังไม่พบไพ่ที่ค้นหา" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ดูไพ่ทั้งหมด" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "ปิดหน้าต่าง" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("desktop and small phone layouts have no horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("home-desktop.png"),
    fullPage: true,
  });
  for (const width of [1440, 1024, 768, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    ).toBe(true);
  }
});
test("storage denial still lets someone draw and share without pretending it is saved", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "เปิดไพ่ประจำวัน", exact: true })
    .click();
  await draw(page);
  await expect(page.getByRole("status")).toContainText(
    "เบราว์เซอร์นี้บันทึกไม่ได้",
  );
  await page.getByRole("button", { name: "แชร์เป็นภาพสวย ๆ" }).click();
  await expect(page.getByRole("link", { name: "บันทึกภาพ PNG" })).toBeVisible();
});
test("mobile three-card reading fits and custom artwork works in results and sharing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route("**/cards/manifest.json", (route) =>
    route.fulfill({ json: { "the-sun": "/cards/custom-sun.svg" } }),
  );
  await page.route("**/cards/custom-sun.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="350"><rect width="220" height="350" fill="#d4b790"/></svg>',
    }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "chanjai-journal-v1",
      JSON.stringify([
        {
          id: "custom-test",
          date: "2026-11-12",
          createdAt: "2026-11-12T08:00:00Z",
          topic: "love",
          question: "คำถามส่วนตัว",
          cards: ["the-sun", "the-moon", "the-star"],
          daily: false,
        },
      ]),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "เปิดเมนู" }).click();
  await page
    .getByRole("button", { name: "บันทึกของใจ", exact: true })
    .first()
    .click();
  await page.locator(".journal-entry").click();
  await expect(page.locator(".result-card")).toHaveCount(3);
  await expect(page.locator(".result-cards img")).toHaveAttribute(
    "src",
    "/cards/custom-sun.svg",
  );
  expect(
    await page
      .locator(".dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "แชร์เป็นภาพสวย ๆ" }).click();
  await expect(page.getByRole("link", { name: "บันทึกภาพ PNG" })).toBeVisible();
});
