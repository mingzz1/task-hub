/* README용 스크린샷 캡처 — dev 서버(5173)가 떠 있어야 한다.
   헤드리스 Chrome은 빈 프로필로 시작하므로 샘플 데이터가 표시된다.
   사용법: node scripts/screenshots.mjs */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5173";
const OUT = "docs/screenshots";
const VIEWS = [
  ["board", "보드"],
  ["calendar", "캘린더"],
  ["review", "완료 · 성과"],
  ["meetings", "미팅 · 1:1"],
  ["bookmarks", "북마크"],
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.waitForSelector(".app");

for (const [file, label] of VIEWS) {
  await page.evaluate((l) => {
    const btn = [...document.querySelectorAll("button.nav-item")].find((b) => b.textContent.includes(l));
    if (btn) btn.click();
  }, label);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/${file}.png` });
  console.log("saved", `${OUT}/${file}.png`);
}

await browser.close();
