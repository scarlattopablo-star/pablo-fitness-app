import { test, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Play Store requires: 1080×1920 (minimum) phone screenshots, 2-8 total
// We use Pixel 5 viewport (393×851) scaled to deliver high-res screenshots
const OUTPUT_DIR = path.join(process.cwd(), "play-store-assets", "screenshots");

test.use({ ...devices["Pixel 5"] });

test.beforeAll(() => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
});

const pages = [
  { path: "/", name: "01-landing-home" },
  { path: "/planes", name: "02-planes" },
  { path: "/planes/ganancia-muscular", name: "03-plan-detail" },
  { path: "/registro-gratis", name: "04-registro-gratis" },
  { path: "/login", name: "05-login" },
];

for (const p of pages) {
  test(`Screenshot ${p.name}`, async ({ page, context }) => {
    // Pre-accept cookies via localStorage to hide the banner
    await context.addInitScript(() => {
      try { localStorage.setItem("cookie-consent", "accepted"); } catch {}
      try { localStorage.setItem("cookies_accepted", "true"); } catch {}
    });
    await page.goto(p.path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Dismiss cookie banner if still visible
    try {
      const aceptar = page.getByRole("button", { name: /aceptar/i });
      if (await aceptar.isVisible({ timeout: 1500 }).catch(() => false)) {
        await aceptar.click();
        await page.waitForTimeout(500);
      }
    } catch {}
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${p.name}.png`),
      fullPage: false,
    });
  });
}
