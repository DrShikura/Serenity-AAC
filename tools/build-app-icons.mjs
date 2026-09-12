#!/usr/bin/env node
// Rasterises the home-screen app icons from the crayon mark.
// Dev-only: needs Playwright (`npm install --save-dev playwright`). The PNGs it
// produces are committed, so you only need to run this if you change the mark.

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#fffaf0"/>
  <circle cx="50" cy="50" r="34" fill="none" stroke="#33251a" stroke-width="5" opacity=".3"/>
  <path d="M50 32 q-12 -13 -20 -2 q-7 10 20 30 q27 -20 20 -30 q-8 -11 -20 2 z"
        fill="#ff5a4a" stroke="#33251a" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="20" cy="24" r="6" fill="#ffd23f"/><circle cx="82" cy="28" r="6" fill="#5ddb7c"/>
  <circle cx="22" cy="78" r="6" fill="#66b7ff"/><circle cx="80" cy="76" r="6" fill="#bb8dff"/>
</svg>`;

// CHROMIUM_PATH lets you point at a Chromium you already have instead of
// letting Playwright download its own.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const size of [180, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${MARK.replace('<svg', `<svg width="${size}" height="${size}"`)}</body>`);
  writeFileSync(`assets/app-icon-${size}.png`, await page.screenshot());
  await page.close();
}
await browser.close();
console.log('Wrote assets/app-icon-{180,192,512}.png');
