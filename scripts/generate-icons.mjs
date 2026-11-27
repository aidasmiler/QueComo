// Renders the PWA PNG icons from public/favicon.svg using Playwright's Chromium.
// Usage: node scripts/generate-icons.mjs (only needed when the logo changes).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const root = join(import.meta.dirname, '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8');
const icons = [
  { file: 'pwa-192.png', size: 192, padding: 0 },
  { file: 'pwa-512.png', size: 512, padding: 0 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0, square: true },
  { file: 'pwa-maskable-512.png', size: 512, padding: 0.12, square: true },
];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
for (const icon of icons) {
  const inner = Math.round(icon.size * (1 - icon.padding * 2));
  // Square variants fill the background so iOS/Android masks don't show transparent corners.
  const markup = icon.square ? svg.replace('rx="16"', 'rx="0"') : svg;
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(
    `<html><body style="margin:0;display:grid;place-items:center;width:${icon.size}px;height:${icon.size}px;background:${icon.square ? '#50634A' : 'transparent'}">` +
      `<div style="width:${inner}px;height:${inner}px">${markup.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: join(root, 'public', icon.file), omitBackground: !icon.square });
  console.log(`✓ public/${icon.file}`);
}
await browser.close();
