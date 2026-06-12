// Logs into the admin panel and screenshots both tabs.
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const PORT = process.env.SHOOT_PORT || "3100";
const base = `http://localhost:${PORT}`;
mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
try {
  await page.goto(`${base}/admin`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD ?? "firststays2026");
  await page.click('button:has-text("Unlock")');
  await page.waitForSelector('text=Browse Airtable', { timeout: 8000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/05-admin-browse.png", fullPage: true });
  console.log("OK 05-admin-browse");

  await page.click('button:has-text("Manage Listings")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/06-admin-manage.png", fullPage: true });
  console.log("OK 06-admin-manage");
} catch (e) {
  console.error(`FAIL: ${e.message}`);
  await page.screenshot({ path: "screenshots/admin-error.png" }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
