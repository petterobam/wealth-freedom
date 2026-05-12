import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:5175';
const OUT = path.resolve('docs/screenshots/_debug');
const fs = await import('fs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'zh-CN' });

  const pages = [
    { path: '/prepayment-calculator', name: 'prepayment', delay: 3000 },
    { path: '/retirement-planner', name: 'retirement', delay: 3000 },
    { path: '/large-expense-planner', name: 'large-expense', delay: 3000 },
  ];

  for (const p of pages) {
    console.log(`Capturing ${p.name}...`);
    const page = await context.newPage();
    await page.goto(BASE + '#' + p.path, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(p.delay);
    await page.screenshot({ path: path.join(OUT, `${p.name}.png`), fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log('Done');
})();
