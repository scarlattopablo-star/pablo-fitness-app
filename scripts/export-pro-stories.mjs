import { chromium } from '@playwright/test';
import { readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'public', 'social-templates');
const outDir = join(__dirname, '..', 'public', 'social-images');

async function main() {
  const files = readdirSync(templatesDir).filter(f => f.startsWith('story-pro-')).sort();
  console.log(`Exporting ${files.length} pro stories...`);

  const browser = await chromium.launch({ headless: true });

  for (const file of files) {
    const name = basename(file, '.html');
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const filePath = join(templatesDir, file).split('\\').join('/');
    await page.goto(`file:///${filePath}`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
    await page.close();
    console.log(`  ✓ ${name}`);
  }

  await browser.close();
  console.log(`\nDone! ${files.length} stories in: ${outDir}`);
}

main().catch(console.error);
