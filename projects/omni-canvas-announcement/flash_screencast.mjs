import puppeteer from 'puppeteer-core';
import fs from 'fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-bryancocco-TINKER/4d4f784e-950e-4873-ba02-19ab92c1fa47/scratchpad';

const cut = process.argv[2] || 'ppt';
const url = cut === 'full' ? 'http://localhost:8100/' : `http://localhost:8100/?cut=${cut}`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 938, height: 800, deviceScaleFactor: 1 });
await page.setCacheEnabled(false);

const client = await page.target().createCDPSession();
await client.send('Page.enable');

let frames = [];
client.on('Page.screencastFrame', async (frame) => {
  frames.push({ ts: frame.metadata.timestamp, data: frame.data });
  await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
});

await client.send('Page.startScreencast', { format: 'png', quality: 100, everyNthFrame: 1 });

const navStart = Date.now();
await page.goto(url, { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 800)); // capture past the flash window

await client.send('Page.stopScreencast');

console.log(`${cut}: captured ${frames.length} frames`);
frames.forEach((f, i) => {
  fs.writeFileSync(`${OUT}/cast-${cut}-${String(i).padStart(2,'0')}.png`, Buffer.from(f.data, 'base64'));
});
await browser.close();
