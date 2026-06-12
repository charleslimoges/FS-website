// Usage: node scripts/shoot.mjs <name> <path> [waitSelector]
// Captures a full-page screenshot of http://localhost:3000<path> into screenshots/<name>.png
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const [, , name, routePath = "/", waitSelector] = process.argv;
const PORT = process.env.SHOOT_PORT || "3100";
const url = `http://localhost:${PORT}${routePath}`;

mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  console.log(`OK ${name} -> screenshots/${name}.png`);
} catch (e) {
  console.error(`FAIL ${name}: ${e.message}`);
  await page.screenshot({ path: `screenshots/${name}-error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
