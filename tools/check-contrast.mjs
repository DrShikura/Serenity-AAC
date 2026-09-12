#!/usr/bin/env node
// Measures the real rendered contrast of every key face against its label, in
// every theme, straight out of the browser. Bright does not have to mean
// unreadable, and a child with low vision should not have to squint.
// Dev-only: needs Playwright and the app served locally.
//   node tools/serve.sh & node tools/check-contrast.mjs

import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:8080/index.html';
const THEMES = ['crayon', 'contrast', 'calm', 'dark'];
const MIN = 4.5;

const luminance = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const parse = (css) => css.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('.board .key');

let failures = 0;
for (const theme of THEMES) {
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(120);
  const samples = await page.evaluate(() => {
    const seen = new Map();
    for (const el of document.querySelectorAll('.key:not(.key--empty), .chip, .ctl, .nav')) {
      const face = [...el.classList].find((c) => c.startsWith('face-')) || el.classList[0];
      if (seen.has(face)) continue;
      const s = getComputedStyle(el);
      seen.set(face, { bg: s.backgroundColor, fg: s.color });
    }
    return Array.from(seen.entries());
  });

  for (const [name, { bg, fg }] of samples) {
    const r = ratio(parse(fg), parse(bg));
    const ok = r >= MIN;
    if (!ok) failures++;
    console.log(`${ok ? '  ok ' : '  ✗  '} ${theme.padEnd(9)} ${name.padEnd(16)} ${r.toFixed(2)}:1`);
  }
}
await browser.close();
console.log(failures ? `\n${failures} pair(s) below ${MIN}:1` : `\nAll pairs meet ${MIN}:1.`);
process.exit(failures ? 1 : 0);
