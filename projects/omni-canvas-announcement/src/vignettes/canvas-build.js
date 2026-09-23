/* ------------------------------------------------------------------
   VIGNETTE — "Canvas, generally": the canvas builds itself.
   Beat 1  Camera flies to the chat hat; chips pop in; the phantom
           cursor rises from below frame and clicks Creative Brief.
   Beat 2  Camera flies to the canvas side; cursor drifts off-frame.
   Beat 3  The OMNI ✦ empty-state hero dissolves and a brief-board
           composition materializes, staggered: headline skeleton,
           image tile (scan reveal), chart tile (bars grow), a
           3-cell stat row.
   Beat 4  Camera pulls back to admire the whole board; gentle
           parallax drift; short hold, then hand off to resetToWash.

   NOTE ON THE CHAT-HAT BEAT: chat-hat.js's chatHatVignette() plays
   its own reveal + click sequence at ~4.35s raw (camera 1.3s + pop
   0.95s + cursor arrival 0.9s + click settle ~0.8s) — reusing it
   wholesale would blow this cue's ≤8.5s raw budget once the build
   (~3.2s) and pull-back (~1.3s) beats are added. Per the brief's
   fallback clause, this module writes its own compressed version of
   the same motion recipe (camera glide → panel pop-open → sheen
   sweep → chip stagger → cursor click), reusing the established
   chat-aux-panel / chip DOM + CSS classes, timed to land near the
   brief's ~3.0s target instead. chat-hat.js is left untouched.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';
import '../styles/canvas-build.css';

const BOARD_HTML = `
  <div class="xcb-wrap">
    <span class="xcb-eyebrow">Creative Brief</span>
    <div class="xcb-grid">
      <div class="xcb-card xcb-headline">
        <span class="xcb-line xcb-line--accent"></span>
        <span class="xcb-line" style="width:88%"></span>
        <span class="xcb-line" style="width:74%"></span>
        <span class="xcb-line" style="width:52%"></span>
      </div>
      <div class="xcb-card xcb-image">
        <span class="xcb-tag">Image</span>
        <div class="xcb-scan-area">
          <span class="xcb-scan"></span>
        </div>
      </div>
      <div class="xcb-card xcb-chart">
        <span class="xcb-tag">Chart</span>
        <div class="xcb-bars">
          <span class="xcb-bar" style="--h:52%"></span>
          <span class="xcb-bar" style="--h:78%"></span>
          <span class="xcb-bar" style="--h:38%"></span>
          <span class="xcb-bar" style="--h:66%"></span>
          <span class="xcb-bar" style="--h:94%"></span>
        </div>
      </div>
      <div class="xcb-stats">
        <div class="xcb-stat"><span class="xcb-stat-num">24</span><span class="xcb-stat-label">Concepts</span></div>
        <div class="xcb-stat"><span class="xcb-stat-num">3.2&times;</span><span class="xcb-stat-label">Reach lift</span></div>
        <div class="xcb-stat"><span class="xcb-stat-num">6</span><span class="xcb-stat-label">Channels</span></div>
      </div>
    </div>
  </div>
`;

/** Mount (or reclaim, on HMR) the board layer inside the canvas stage.
 *  Guarded by a DOM query, not just a module-level var, so it survives
 *  Vite re-executing this module while the canvas stage persists. */
function ensureBoard(host) {
  let el = host.querySelector('.xcb-board');
  if (el) return el;
  el = document.createElement('div');
  el.className = 'vig-layer xcb-board';
  el.innerHTML = BOARD_HTML;
  host.appendChild(el);
  return el;
}

export function canvasBuildVignette(tl, ctx) {
  const { world, chatHat, chips, hero, canvasSide } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring = cursor.querySelector('.cursor-ring');

  const panel = chatHat.querySelector('.chat-aux-panel');
  const body = chatHat.querySelector('.chat-aux-body');
  const toggleSvg = chatHat.querySelector('.chat-aux-toggle svg');
  const bodyH = body.scrollHeight || 260;

  // Diagonal sheen — reuses the established ch-fr-sheen visual (already
  // styled in canvas-ui.css for the real chat-hat reveal); idempotent.
  let sheen = panel.querySelector('.ch-fr-sheen');
  if (!sheen) {
    sheen = document.createElement('span');
    sheen.className = 'ch-fr-sheen';
    panel.appendChild(sheen);
  }

  const board = ensureBoard(ctx.canvas.canvasStage);
  const eyebrow = board.querySelector('.xcb-eyebrow');
  const headline = board.querySelector('.xcb-headline');
  const headlineLines = Array.from(board.querySelectorAll('.xcb-line'));
  const imageTile = board.querySelector('.xcb-image');
  const scan = board.querySelector('.xcb-scan');
  const chartTile = board.querySelector('.xcb-chart');
  const bars = Array.from(board.querySelectorAll('.xcb-bar'));
  const statsRow = board.querySelector('.xcb-stats');
  const statNums = Array.from(board.querySelectorAll('.xcb-stat'));

  const pickChip = chips[0]; // Creative Brief
  const pickCaret = pickChip.querySelector('.chat-aux-chip-caret');

  // ================================================================
  // Position 0 — pin every one-way / loop-carried state (gotcha pack:
  // everything must be re-established here, never left to carry over).
  // ================================================================
  tl.set(panel, { boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);
  tl.set(body, { maxHeight: 0, overflow: 'hidden' }, 0);
  tl.set(toggleSvg, { rotation: 0, transformOrigin: '50% 50%' }, 0);
  tl.set(chips, { opacity: 0, y: 4 }, 0);
  tl.set(sheen, { opacity: 0, backgroundPosition: '130% 0' }, 0);
  tl.set(pickChip, { background: '#ffffff', borderColor: '#e8e9ed', color: '#394457', scale: 1 }, 0);
  tl.set(pickCaret, { color: '#818ea6', x: 0 }, 0);
  // Cursor parks fully BELOW the frame (rise-from-below idiom — same as
  // tilesIntro): opacity 1 but clipped off-stage until it rises.
  tl.set(cursor, { opacity: 1, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  tl.set(board, { opacity: 0 }, 0);
  tl.set(eyebrow, { opacity: 0, y: 8 }, 0);
  tl.set(headlineLines, { scaleX: 0, transformOrigin: 'left center' }, 0);
  tl.set(imageTile, { opacity: 0, y: 18, scale: 0.97 }, 0);
  tl.set(scan, { top: '-40%' }, 0);
  tl.set(chartTile, { opacity: 0, y: 18, scale: 0.97 }, 0);
  tl.set(bars, { scaleY: 0, transformOrigin: 'bottom center' }, 0);
  tl.set(statsRow, { opacity: 0, y: 14 }, 0);
  tl.set(statNums, { opacity: 0, y: 10 }, 0);

  // ================================================================
  // BEAT 1 — chat-hat opens; chips pop in; cursor clicks Creative
  // Brief. (~2.3s raw — compressed chat-hat.js recipe, see file note.)
  // ================================================================
  const cam1 = ctx.cameraFor(chatHat, 0.82, { x: 0, y: 20 });
  tl.to(world, { x: cam1.x, y: cam1.y, scale: cam1.scale, duration: 0.95, ease: CAMERA_GLIDE }, 0);

  const T = 0.48; // panel pop-open start
  tl.to(body, { maxHeight: bodyH, duration: 0.42, ease: 'power2.inOut' }, T);
  tl.to(toggleSvg, { rotation: 180, duration: 0.42, ease: 'power2.inOut' }, T);
  tl.to(panel, { boxShadow: '0 0 30px 6px rgba(24,88,238,0.42), 0 0 74px 18px rgba(24,88,238,0.20)', duration: 0.20, ease: 'power2.out' }, T);
  tl.to(panel, { boxShadow: '0 0 0 0 rgba(24,88,238,0)', duration: 0.32, ease: 'power2.in' }, T + 0.20);
  tl.to(sheen, { opacity: 1, duration: 0.12, ease: 'power1.out' }, T + 0.05);
  tl.to(sheen, { backgroundPosition: '-30% 0', duration: 0.50, ease: 'power2.inOut' }, T + 0.05);
  tl.to(sheen, { opacity: 0, duration: 0.16, ease: 'power1.in' }, T + 0.45);

  chips.forEach((chip, i) => {
    tl.to(chip, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }, T + 0.27 + i * 0.032);
  });
  tl.set(body, { maxHeight: 'none' }, T + 0.55);

  // Cursor rise — start only once the camera fly (ends 0.95) has
  // settled, since targetIn() reads live layout under the world's
  // current transform when the tween begins.
  const C = 0.98;
  tl.to(cursor, {
    x: () => targetIn(pickChip, ctx.stage).x,
    y: () => targetIn(pickChip, ctx.stage).y,
    duration: 0.78, ease: 'power3.out',
  }, C);

  const Tc = C + 0.85; // ~1.83 — cursor has arrived + brief settle
  tl.to(pickChip, { background: 'color-mix(in srgb, #1858ee 8%, #ffffff)', borderColor: 'color-mix(in srgb, #1858ee 35%, #e8e9ed)', color: '#0a0a0a', duration: 0.14, ease: 'power2.out' }, Tc);
  tl.to(pickCaret, { color: '#1858ee', x: 3, duration: 0.16, ease: 'power2.out' }, Tc);
  tl.to(pickChip, { scale: 0.96, duration: 0.07, ease: 'power2.in' }, Tc);
  tl.to(pickChip, { scale: 1, duration: 0.20, ease: 'power2.out' }, Tc + 0.07);
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.6, duration: 0.42, ease: 'power2.out' }, Tc);
  tl.to(cursor, { scale: 0.9, duration: 0.06, ease: 'power2.in' }, Tc);
  tl.to(cursor, { scale: 1, duration: 0.18, ease: 'power2.out' }, Tc + 0.06);

  // ================================================================
  // BEAT 2 — camera flies to the canvas side; cursor drifts off.
  // (~0.85s raw)
  // ================================================================
  const BEAT2 = Tc + 0.45; // ~2.28 — chip settle has landed
  const cam2 = ctx.cameraFor(canvasSide, 0.75);
  tl.to(world, { x: cam2.x, y: cam2.y, scale: cam2.scale, duration: 0.85, ease: CAMERA_GLIDE }, BEAT2);
  tl.to(cursor, { opacity: 0, x: '+=90', y: '-=50', duration: 0.45, ease: 'power2.in' }, BEAT2);

  // ================================================================
  // BEAT 3 — the canvas builds itself: hero dissolves, brief board
  // materializes staggered. (~2.9s raw — the hero moment.)
  // ================================================================
  const BEAT3 = BEAT2 + 0.85; // ~3.13 — camera has landed on canvas side
  tl.to(hero, { opacity: 0, filter: 'blur(10px)', duration: 0.5, ease: 'power2.inOut' }, BEAT3);
  tl.to(board, { opacity: 1, duration: 0.4, ease: 'power2.out' }, BEAT3 + 0.15);
  tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, BEAT3 + 0.15);

  tl.to(headlineLines, { scaleX: 1, duration: 0.45, ease: 'power2.out', stagger: 0.09 }, BEAT3 + 0.35);

  tl.to(imageTile, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, BEAT3 + 0.25);
  tl.to(scan, { top: '120%', duration: 0.85, ease: 'sine.inOut' }, BEAT3 + 0.55);

  tl.to(chartTile, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, BEAT3 + 0.35);
  tl.to(bars, { scaleY: 1, duration: 0.5, ease: 'back.out(1.5)', stagger: 0.07 }, BEAT3 + 0.65);

  tl.to(statsRow, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, BEAT3 + 0.95);
  tl.to(statNums, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 }, BEAT3 + 1.10);

  // ================================================================
  // BEAT 4 — pull back to admire; gentle parallax; short hold; the
  // central resetToWash cue (next on the master timeline) fades the
  // whole world, so no exit fade of our own is needed here.
  // ================================================================
  const BEAT4 = BEAT3 + 2.85; // board has fully materialized (~1.5s in) + a read hold
  const cam4 = ctx.cameraFor(canvasSide, 0.6);
  tl.to(world, { x: cam4.x, y: cam4.y, scale: cam4.scale, duration: 0.8, ease: CAMERA_GLIDE }, BEAT4);
  tl.to(headline, { y: '-=4', duration: 0.7, ease: 'sine.inOut' }, BEAT4 + 0.15);
  tl.to(imageTile, { y: '+=5', duration: 0.7, ease: 'sine.inOut' }, BEAT4 + 0.15);
  tl.to(chartTile, { y: '-=5', duration: 0.7, ease: 'sine.inOut' }, BEAT4 + 0.15);
  // Short hold to admire before the reset cue takes over.
  tl.to({}, { duration: 0.35 }, BEAT4 + 0.95);
}

/** Convert an element's center to coords inside the stage. */
function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width / 2 - 5,
    y: r.top - sr.top + r.height / 2 - 3,
  };
}
