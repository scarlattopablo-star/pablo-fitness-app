import { chromium } from '@playwright/test';
import { readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'public', 'social-templates');
const outDir = join(__dirname, '..', 'public', 'social-images');

async function main() {
  const files = readdirSync(templatesDir).filter(f => f.endsWith('.html')).sort();
  console.log(`Exporting ${files.length} templates to PNG...`);

  const browser = await chromium.launch({ headless: true });

  for (const file of files) {
    const name = basename(file, '.html');
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

    // Check if it's a tall carousel template
    const content = (await import('fs')).readFileSync(join(templatesDir, file), 'utf-8');
    if (content.includes('1350px')) {
      await page.setViewportSize({ width: 1080, height: 1350 });
    }

    await page.goto(`file:///${join(templatesDir, file).replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
    await page.close();
    console.log(`  ✓ ${name}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${files.length} images saved in: ${outDir}`);
}

main().catch(console.error);
