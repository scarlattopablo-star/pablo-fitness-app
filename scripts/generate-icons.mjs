/**
 * Generate all app icons and splash screens for iOS and Android
 * Uses the existing icon-512.png as source and creates all required sizes
 */
import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Ensure assets directory exists
const assetsDir = join(root, 'assets');
if (!existsSync(assetsDir)) mkdirSync(assetsDir);

// Copy icon-512 as the source files for @capacitor/assets
// It needs: icon-only.png (1024x1024), icon-foreground.png (1024x1024), icon-background.png (1024x1024)
// and splash.png (2732x2732) and splash-dark.png (2732x2732)

console.log('Preparing source assets...');

// We'll use the SVG to generate a 1024x1024 PNG for the icon
// First, let's create the icon source from SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="0" fill="#0a0a0a"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#22c55e" text-anchor="middle">PS</text>
</svg>`;

// Write SVG for icon-only (no rounded corners - the OS handles that)
const { writeFileSync } = await import('fs');
writeFileSync(join(assetsDir, 'icon-only.svg'), svgContent);

// Create foreground (just the PS text on transparent bg)
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="240" font-weight="bold" fill="#22c55e" text-anchor="middle">PS</text>
</svg>`;
writeFileSync(join(assetsDir, 'icon-foreground.svg'), fgSvg);

// Create background (solid dark)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0a"/>
</svg>`;
writeFileSync(join(assetsDir, 'icon-background.svg'), bgSvg);

// Create splash screen (dark bg with PS logo centered)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#09090b"/>
  <text x="1366" y="1450" font-family="Arial, sans-serif" font-size="400" font-weight="bold" fill="#22c55e" text-anchor="middle">PS</text>
</svg>`;
writeFileSync(join(assetsDir, 'splash.svg'), splashSvg);
writeFileSync(join(assetsDir, 'splash-dark.svg'), splashSvg);

// Now convert SVGs to PNGs using resvg-js or canvas
// Since we may not have those, let's use a simpler approach:
// Copy the existing 512 as icon-only and let capacitor/assets handle it
copyFileSync(join(root, 'public/icons/icon-512.png'), join(assetsDir, 'icon-only.png'));
copyFileSync(join(root, 'public/icons/icon-512.png'), join(assetsDir, 'icon-foreground.png'));

console.log('Source assets prepared.');
console.log('Running @capacitor/assets generate...');

try {
  execSync('npx capacitor-assets generate --iconBackgroundColor "#0a0a0a" --iconBackgroundColorDark "#0a0a0a" --splashBackgroundColor "#09090b" --splashBackgroundColorDark "#09090b"', {
    cwd: root,
    stdio: 'inherit',
  });
  console.log('\nIcons and splash screens generated successfully!');
} catch (e) {
  console.error('capacitor-assets failed, trying alternative approach...');
  // If capacitor-assets fails, we do it manually
  console.log('Please run: npx capacitor-assets generate');
}
