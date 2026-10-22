import { test } from "@playwright/test";
import * as path from "path";

test("Generate 1024x500 feature graphic JPEG", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const htmlPath = path.join(process.cwd(), "play-store-assets", "feature-graphic.html");
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(process.cwd(), "play-store-assets", "feature-graphic-1024x500.jpg"),
    clip: { x: 0, y: 0, width: 1024, height: 500 },
    type: "jpeg",
    quality: 75,
  });
  await context.close();
});
