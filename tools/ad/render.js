// usage: node render.js <url> <outdir> <fps> <start_frame> <end_frame>   |  node render.js <url> <outdir> stills t1,t2,...
const { chromium } = require('playwright');
(async () => {
  const [url, out, a, b, c] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('console:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto(url);
  await page.evaluate(() => window.ready);
  const stage = await page.$('#stage');
  if (a === 'stills') {
    for (const t of b.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await stage.screenshot({ path: `${out}/still_${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 85 });
    }
  } else {
    const fps = +a, f0 = +b, f1 = +c;
    for (let f = f0; f < f1; f++) {
      await page.evaluate(t => window.render(t), f / fps);
      await page.screenshot({ path: `${out}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    }
  }
  await browser.close();
})();
