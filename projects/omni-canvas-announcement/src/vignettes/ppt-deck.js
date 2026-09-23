/* ------------------------------------------------------------------
   VIGNETTE — ppt-deck (THE PAYOFF).
   Camera tracks back onto the flat scroll canvas, down to S2, where a
   real deck of 16:9 slides — built from the Coastline board's own
   content — flies in as a staggered fan, then settles into a clean
   grid. Camera pulls back slowly to hold the full assembled deck: the
   "it actually looks like a presentable deck" money shot. This is the
   quality bar the whole cut is judged on — genuine slide proportions,
   generous margins, real type hierarchy, content pulled from the
   campaign. Prefix `xpd-` throughout.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const BARS = [
  { label: 'Meta',    value: 84, tint: 1    },
  { label: 'YouTube', value: 71, tint: 0.8  },
  { label: 'TikTok',  value: 63, tint: 0.65 },
  { label: 'CTV',     value: 58, tint: 0.52 },
];
const MAX_VALUE = Math.max(...BARS.map((b) => b.value));

const COPY_LINES = [
  "The coast doesn't hurry. Neither do we.",
  'Every curve of Highway 1, answered by ours.',
  'Golden hour, meet the machine built for it.',
];

// Slide size: 320×180 (exact 16:9). Final grid layout (top-left, within the 668×604 stack): a near-
// square block — 2 rows of 2, plus the closing slide centered below —
// so the wide pull-back camera fills the stage instead of framing a
// wide, short strip surrounded by empty canvas.
const SLIDES = [
  { kind: 'cover', grid: { x: 0,   y: 0   }, fan: { x: 104, y: 194, rot: -9, scale: 0.84 } },
  { kind: 'image', grid: { x: 348, y: 0   }, fan: { x: 139, y: 208, rot: -4, scale: 0.88 } },
  { kind: 'chart', grid: { x: 0,   y: 208 }, fan: { x: 174, y: 218, rot: 1,  scale: 0.94 } },
  { kind: 'copy',  grid: { x: 348, y: 208 }, fan: { x: 209, y: 208, rot: 5,  scale: 0.88 } },
  { kind: 'grid',  grid: { x: 174, y: 416 }, fan: { x: 244, y: 194, rot: 10, scale: 0.84 } },
];

function slideBodyHTML(kind) {
  if (kind === 'cover') {
    return `<div class="xpd-slide-cover">
      <span class="xpd-slide-eyebrow">Q4 Launch — Media Plan</span>
      <h3 class="xpd-slide-title">Corvache<br/><em>Coastline</em></h3>
      <span class="xpd-slide-sub">Omnicom Precision Marketing</span>
    </div>`;
  }
  if (kind === 'image') {
    return `<div class="xpd-slide-image">
      <img src="/shoot-02.webp" alt="" data-ken-burns />
      <span class="xpd-slide-image-cap">Hero — golden hour</span>
    </div>`;
  }
  if (kind === 'chart') {
    return `<div class="xpd-slide-chart">
      <span class="xpd-slide-chart-title">Projected reach</span>
      <div class="xpd-chart-plot">
        ${BARS.map((b) => `
          <div class="xpd-chart-col">
            <div class="xpd-chart-track"><div class="xpd-chart-fill" style="height:${((b.value / MAX_VALUE) * 100).toFixed(1)}%;background:rgba(24,88,238,${b.tint})"></div></div>
            <span class="xpd-chart-label">${b.label}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }
  if (kind === 'copy') {
    return `<div class="xpd-slide-copy">
      <span class="xpd-slide-copy-title">Message pillars</span>
      <ul class="xpd-copy-list">
        ${COPY_LINES.map((l) => `<li><span class="xpd-copy-dot"></span>${l}</li>`).join('')}
      </ul>
    </div>`;
  }
  // grid
  return `<div class="xpd-slide-grid">
    <span class="xpd-slide-grid-title">Shoot selects</span>
    <div class="xpd-grid-thumbs">
      <img src="/shoot-01.webp" alt=""/><img src="/shoot-02.webp" alt=""/>
      <img src="/shoot-03.webp" alt=""/><img src="/shoot-04.webp" alt=""/>
    </div>
  </div>`;
}

const DECK_HTML = `
  <div class="xpd-deck" data-deck>
    <div class="xpd-inner">
      <div class="xpd-eyebrow" data-eyebrow>Corvache — Coastline Deck</div>
      <div class="xpd-stack" data-stack>
        ${SLIDES.map((s, i) => `
          <div class="xpd-slide" data-slide data-idx="${i}">
            <div class="xpd-slide-body">${slideBodyHTML(s.kind)}</div>
            <div class="xpd-slide-foot">
              <span class="xpd-slide-mark">OMNI<i>✦</i></span>
              <span class="xpd-slide-num">0${i + 1}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
`;

export function pptDeckVignette(tl, ctx) {
  const { world, scrollCanvas, scrollS2 } = ctx.canvas;

  scrollS2.innerHTML = DECK_HTML;

  const deck    = scrollS2.querySelector('[data-deck]');
  const eyebrow = scrollS2.querySelector('[data-eyebrow]');
  const stack   = scrollS2.querySelector('[data-stack]');
  const slides  = Array.from(scrollS2.querySelectorAll('[data-slide]'));
  const kbImg   = scrollS2.querySelector('[data-ken-burns]');

  // ----- Pre-state (pinned to 0) -----
  tl.set(scrollCanvas, { opacity: 0 }, 0);
  tl.set(deck, { opacity: 1 }, 0);
  tl.set(eyebrow, { opacity: 0, y: 8 }, 0);
  slides.forEach((el, i) => {
    const s = SLIDES[i];
    tl.set(el, {
      opacity: 0,
      x: s.fan.x, y: s.fan.y + 140,
      rotate: s.fan.rot * 1.4,
      scale: s.fan.scale * 0.85,
    }, 0);
  });
  tl.set(kbImg, { scale: 1 }, 0);

  // ----- Camera tracks back onto the flat canvas, down to S2 -----
  const cam = ctx.cameraFor(scrollS2, 0.82, { x: 0, y: -6 });
  tl.to(world, { x: cam.x, y: cam.y, scale: cam.scale, duration: 1.1, ease: CAMERA_GLIDE }, 0);
  tl.to(scrollCanvas, { opacity: 1, duration: 0.55, ease: 'power2.inOut' }, 0.15);

  tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.15);

  // ----- BEAT 1 — slides fly in as a staggered fan/cascade -----
  const FAN_START = 1.30;
  slides.forEach((el, i) => {
    const s = SLIDES[i];
    tl.to(el, {
      opacity: 1, x: s.fan.x, y: s.fan.y, rotate: s.fan.rot, scale: s.fan.scale,
      duration: 0.5, ease: 'back.out(1.25)',
    }, FAN_START + i * 0.12);
  });
  const fanDoneAt = FAN_START + (slides.length - 1) * 0.12 + 0.5;

  // ----- Hold on the fanned deck before it regroups -----
  const GRID_START = fanDoneAt + 0.35;

  // ----- BEAT 2 — the fan settles into a clean grid -----
  slides.forEach((el, i) => {
    const s = SLIDES[i];
    tl.to(el, {
      x: s.grid.x, y: s.grid.y, rotate: 0, scale: 1,
      duration: 0.6, ease: 'back.out(1.1)',
    }, GRID_START + i * 0.09);
  });
  const gridDoneAt = GRID_START + (slides.length - 1) * 0.09 + 0.6;

  // ----- Camera pulls back slowly to hold the full assembled deck -----
  const camWide = ctx.cameraFor(stack, 0.98, { x: 0, y: 20 });
  const PULLBACK_START = GRID_START + 0.25;
  const PULLBACK_DUR = 2.0;
  tl.to(world, {
    x: camWide.x, y: camWide.y, scale: camWide.scale,
    duration: PULLBACK_DUR, ease: CAMERA_GLIDE,
  }, PULLBACK_START);

  // ----- Subtle Ken Burns on the full-bleed image slide — completes
  //        well before the cue ends. -----
  const CUE_END = PULLBACK_START + PULLBACK_DUR + 2.4;
  tl.to(kbImg, { scale: 1.05, duration: CUE_END - gridDoneAt - 0.3, ease: 'power1.out' }, gridDoneAt);

  // ----- Long luxurious hold on the full deck. -----
  tl.to({}, { duration: 0.05 }, CUE_END - 0.05);
}
