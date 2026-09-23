/* QA frame-shots: node shots.mjs <t1> <t2> ... (EFFECTIVE seconds)
   Seeks the master timeline forward-only to each time (converting via
   timeScale) and screenshots #stage → scratchpad shot-<t>.png */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-bryancocco-TINKER/4d4f784e-950e-4873-ba02-19ab92c1fa47/scratchpad';
const times = process.argv.slice(2).map(Number);
const url = process.env.CUT ? `http://localhost:8100/?cut=${process.env.CUT}` : 'http://localhost:8100/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text()); });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction(() => window.__omni && window.__omni.timeline.cues.length > 0, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);

const info = await page.evaluate(() => {
  const m = window.__omni.timeline.master; window.__omni.timeline.pause(); m.pause();
  return { dur: m.duration(), ts: m.timeScale(), cues: window.__omni.timeline.cues.map(c => `${c.name}@${(c.start / m.timeScale()).toFixed(1)}-${(c.end / m.timeScale()).toFixed(1)}s(eff)`) };
});
console.log(`raw=${info.dur.toFixed(1)}s ts=${info.ts} eff=${(info.dur / info.ts).toFixed(1)}s`);
console.log('cues:', info.cues.join('  '));

const stage = await page.$('#stage');
let last = 0;
for (const t of times.sort((a, b) => a - b)) {
  await page.evaluate(([from, to]) => {
    const m = window.__omni.timeline.master;
    const raw = Math.min(to * m.timeScale(), m.duration() - 0.01);
    for (let x = from * m.timeScale(); x <= raw; x += 0.06) m.time(x);
    m.time(raw);
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, [last, t]);
  last = t;
  await stage.screenshot({ path: `${OUT}/shot-${t}.png` });
  console.log(`shot-${t}.png`);
}
await browser.close();
