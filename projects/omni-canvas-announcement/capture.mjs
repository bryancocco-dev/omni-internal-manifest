/* ------------------------------------------------------------------
   MP4 capture — renders the bare 938×800 stage to an MP4 at the
   original spec. Drives the installed Chrome via puppeteer-core,
   seeks the GSAP master timeline frame-by-frame (forward-only, so it
   stays deterministic / scrub-safe), captures at 2× for crispness,
   and pipes PNG frames straight into ffmpeg (downscaled to 938×800).

   Usage:  node capture.mjs [fps] [--cut=ppt|canvas]
   No --cut (or --cut=full) captures the original loop to its
   original filename; a named cut goes to omni-announce-<cut>.mp4.
   Needs the dev server running on http://localhost:8100
------------------------------------------------------------------ */

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let FPS = 30, CUT = 'full';
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--cut=')) CUT = a.slice(6).toLowerCase();
  else if (a.startsWith('--fps=')) FPS = Number(a.slice(6));
  else if (/^\d+$/.test(a)) FPS = Number(a);
}
const PAGE_URL = 'http://localhost:8100/?capture=1' + (CUT === 'full' ? '' : `&cut=${CUT}`);
const W = 938, H = 800;
const OUT_DIR = new URL('./export/', import.meta.url).pathname;
const OUT = OUT_DIR + (CUT === 'full' ? 'omni-canvas-announcement.mp4' : `omni-announce-${CUT}.mp4`);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
});

const page = await browser.newPage();
// Roomy viewport so the fixed 938×800 card never collides with a
// scrollbar gutter (which in headless shrinks the layout viewport and
// bleeds page-bg into the right/bottom edges of the capture).
await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
await page.goto(PAGE_URL, { waitUntil: 'networkidle0', timeout: 60000 });

// Kill any document overflow / scrollbars outright.
await page.addStyleTag({ content: 'html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:#e8ecfa!important;}' });

// Wait until the timeline is built + fonts ready, then pause it.
await page.waitForFunction(
  () => window.__omni && window.__omni.timeline.cues.length > 0,
  { timeout: 30000 },
);
await page.evaluate(() => document.fonts.ready);

const { rawDuration, timeScale } = await page.evaluate(() => {
  const m = window.__omni.timeline.master;
  window.__omni.timeline.pause();
  m.pause();
  return { rawDuration: m.duration(), timeScale: m.timeScale() };
});

// Capture the #stage element directly (clips exactly to its 938×800
// box) so no page background outside the stage bleeds into the frame.
const stageEl = await page.$('#stage');

const effDuration = rawDuration / timeScale;
const totalFrames = Math.round(effDuration * FPS);
console.log(`raw=${rawDuration.toFixed(2)}s  timeScale=${timeScale}  effective=${effDuration.toFixed(2)}s`);
console.log(`Rendering ${totalFrames} frames @ ${FPS}fps  →  ${OUT}`);

// ffmpeg reads a PNG stream from stdin, downscales 2× → 938×800.
const ff = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-framerate', String(FPS),
  '-i', '-',
  '-vf', `scale=${W}:${H}:flags=lanczos`,
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-crf', '17',
  '-preset', 'slow',
  '-movflags', '+faststart',
  OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < totalFrames; i++) {
  const rawTime = Math.min((i / FPS) * timeScale, rawDuration);
  // Forward-only seek + one rAF so blur / blend / backdrop layers paint.
  await page.evaluate((t) => {
    window.__omni.timeline.master.time(t);
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, rawTime);

  const png = await stageEl.screenshot({ type: 'png', optimizeForSpeed: true });
  if (!ff.stdin.write(png)) {
    await new Promise((r) => ff.stdin.once('drain', r));
  }
  if (i % 60 === 0) process.stdout.write(`  frame ${i}/${totalFrames}\r`);
}

ff.stdin.end();
await new Promise((res, rej) => { ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))); });
await browser.close();
console.log(`\nDone → ${OUT}`);
