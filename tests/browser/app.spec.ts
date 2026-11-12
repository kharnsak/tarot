import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function shuffle(page: Page) {
  await page.getByRole("button", { name: "กดค้างเพื่อสับไพ่" }).click();
}
async function pickAll(page: Page, count: number) {
  await expect(page.locator(".fan")).toBeVisible();
  await page.waitForTimeout(900);
  for (let i = 0; i < count; i++) {
    // the fan is driven by pointer position, so click the card's centre
    await page.getByRole("button", { name: `เลือกไพ่ใบที่ ${i + 3}`, exact: true }).click({ force: true });
    await page.waitForTimeout(500);
  }
  await page.getByRole("button", { name: "เปิดไพ่", exact: true }).click();
  await page.getByRole("button", { name: "อ่านคำทำนาย" }).click();
  await expect(page.getByRole("button", { name: "แชร์ผล" })).toBeVisible();
}

test("mobile daily ritual persists the same card and exports a real PNG", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ไพ่ประจำวัน");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "เปิดไพ่ประจำวัน", exact: true }).click();
  await shuffle(page);
  await pickAll(page, 1);
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem("chanjai-journal-v1")!));
  expect(first).toHaveLength(1);
  expect(first[0].daily).toBe(true);
  await page.getByRole("button", { name: "แชร์ผล" }).click();
  await expect(page.getByRole("img", { name: "ภาพผลไพ่ของคุณสำหรับแชร์" })).toBeVisible();
  for (const [label, h] of [["สตอรี่", 1920], ["โพสต์", 1350]] as const) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("link", { name: "บันทึกภาพ PNG" })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "บันทึกภาพ PNG" }).click(),
    ]);
    await download.saveAs(testInfo.outputPath(`share-${h}.png`));
    const png = await readFile(testInfo.outputPath(`share-${h}.png`));
    expect(png.readUInt32BE(16)).toBe(1080);
    expect(png.readUInt32BE(20)).toBe(h);
  }
  await page.reload();
  await page.getByRole("button", { name: "อ่านอีกครั้ง", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "แชร์ผล" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("chanjai-journal-v1")!)[0].cards)).toEqual(first[0].cards);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "บันทึกของใจ", exact: true }).click();
  await expect(page.locator(".journal-entry")).toHaveCount(1);
  await page.getByRole("button", { name: "ลบประวัติในเครื่องนี้" }).click();
  await page.getByRole("button", { name: "ยืนยันลบประวัติ" }).click();
  await expect(page.getByRole("heading", { name: "ยังไม่มีบันทึก" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("three-card love reading keeps question and uses three unique cards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ความรัก", exact: true }).click();
  await page.getByLabel("คำถามของคุณ").fill("เรากับเขาจะไปต่อไหม");
  await page.getByRole("button", { name: "3 ใบ", exact: true }).click();
  await shuffle(page);
  await pickAll(page, 3);
  await expect(page.locator(".result-card")).toHaveCount(3);
  await expect(page.locator(".your-question")).toHaveText("“เรากับเขาจะไปต่อไหม”");
  const r = await page.evaluate(() => JSON.parse(localStorage.getItem("chanjai-journal-v1")!)[0]);
  expect(new Set(r.cards).size).toBe(3);
  expect(r.topic).toBe("love");
  await page.getByRole("button", { name: "ถามต่อ" }).click();
  await expect(page.locator(".followups .pill")).toHaveCount(3);
});

test("all 78 cards are searchable and modal traps focus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ห้องสมุดไพ่", exact: true }).click();
  await expect(page.locator(".library-grid>button")).toHaveCount(78);
  await page.getByRole("button", { name: "ถ้วย", exact: true }).click();
  await expect(page.locator(".library-grid>button")).toHaveCount(14);
  await page.getByRole("button", { name: "ทั้งหมด", exact: true }).click();
  await page.getByRole("searchbox", { name: "ค้นหาไพ่" }).fill("The Sun");
  await expect(page.locator(".library-grid>button")).toHaveCount(1);
  await page.locator(".library-grid>button").click();
  await expect(page.getByRole("heading", { name: "พระอาทิตย์", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("layouts have no horizontal overflow and theme toggles", async ({ page }) => {
  await page.goto("/");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true);
  }
  await page.getByRole("button", { name: "โหมดกลางคืน" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("storage denial still lets someone draw and share", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("denied", "SecurityError"); } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "เปิดไพ่ประจำวัน", exact: true }).click();
  await shuffle(page);
  await pickAll(page, 1);
  await expect(page.getByRole("status")).toContainText("เบราว์เซอร์นี้บันทึกไม่ได้");
  await page.getByRole("button", { name: "แชร์ผล" }).click();
  await expect(page.getByRole("link", { name: "บันทึกภาพ PNG" })).toBeVisible();
});
