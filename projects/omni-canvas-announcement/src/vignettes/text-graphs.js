/* ------------------------------------------------------------------
   VIGNETTE — text-graphs (Exec C, "Welcome to Canvas" default loop).
   Owns the bottom row of the board: COPY (streaming launch copy doc)
   + INSIGHTS (bar chart), then the finale — camera pulls wide to the
   whole filled board (images + video + copy + chart, all in one
   place). Runs after graphics-gen + video-gen have already filled
   the top row; this content ACCUMULATES on top of theirs and stays
   on screen at cue end (resetToWash clears everything at loop end).
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';
import { AB_PANELS } from './ab-panels.js';
import { mountPromptBar, promptBeatPreState, promptBeat } from './prompt-beat.js';

const COPY_LINES = [
  "The coast doesn't hurry. Neither do we.",
  'Every curve of Highway 1, answered by ours.',
  'Golden hour, meet the machine built for it.',
];

const BARS = [
  { label: 'Meta',    value: 84, delta: 6,  tint: 1    },
  { label: 'YouTube', value: 71, delta: 9,  tint: 0.8  },
  { label: 'TikTok',  value: 63, delta: 12, tint: 0.65 },
  { label: 'CTV',     value: 58, delta: 4,  tint: 0.52 },
];
const MAX_VALUE    = Math.max(...BARS.map((b) => b.value));
// Bar heights are a PERCENTAGE of the (flexible) track, so the plot
// fills whatever height the card gives it.

const XTG_HTML = `
  <div class="xtg-wrap" id="xtg-wrap">

    <div class="xtg-zone xtg-zone--copy">
      <div class="xtg-eyebrow">Coastline Campaign — Copy</div>
      <div class="xtg-card xtg-doc-card" id="xtg-doc-card">
        <h3 class="xtg-card-title">Launch copy — Coastline Campaign</h3>
        <div class="xtg-doc-tags" id="xtg-doc-tags">
          <span class="xtg-tag">Coastline</span><span class="xtg-tag">Q4 Flight</span><span class="xtg-tag">US-wide</span>
        </div>
        <div class="xtg-doc-lines">
          ${COPY_LINES.map((_, i) => `
            <p class="xtg-line" data-line="${i}"><span class="xtg-line-text"></span><span class="xtg-caret"></span></p>
          `).join('')}
        </div>
        <div class="xtg-doc-meta">
          <span class="xtg-meta-chip">Claude Sonnet 4.6</span>
          <span class="xtg-meta-time">Just now</span>
        </div>
      </div>
    </div>

    <div class="xtg-zone xtg-zone--insights">
      <div class="xtg-eyebrow">Coastline Campaign — Insights</div>
      <div class="xtg-card xtg-chart-card" id="xtg-chart-card">
        <div class="xtg-chart-head">
          <h3 class="xtg-card-title" style="margin:0">Projected reach</h3>
          <span class="xtg-chart-badge">Q4 Flight</span>
        </div>
        <div class="xtg-plot-wrap">
          <div class="xtg-gridlines" id="xtg-gridlines"><i></i><i></i><i></i></div>
        <div class="xtg-chart-plot">
          ${BARS.map((b, i) => `
            <div class="xtg-bar-col" data-bar="${i}">
              <span class="xtg-bar-value">${b.value}<em class="xtg-bar-delta">▲${b.delta}</em></span>
              <div class="xtg-bar-track"><div class="xtg-bar-fill"></div></div>
              <span class="xtg-bar-label">${b.label}</span>
            </div>
          `).join('')}
        </div>
        </div>
        <div class="xtg-baseline"></div>
        <div class="xtg-legend" id="xtg-legend">
          <span class="xtg-lg"><i style="opacity:1"></i>Paid social</span>
          <span class="xtg-lg"><i style="opacity:.75"></i>Online video</span>
          <span class="xtg-lg"><i style="opacity:.5"></i>CTV</span>
        </div>
        <div class="xtg-stat-line">
          <span class="xtg-stat-num-wrap">+<span class="xtg-stat-num">0</span>%</span>
          <span class="xtg-stat-suffix">vs. last launch</span>
        </div>
      </div>
    </div>

  </div>
`;

/* ---- ABUNDANCE GRID (finale) ---------------------------------------
   A full masonry FIELD of extra generations that fills the entire
   finale frame and bleeds off every edge (frame at scale 0.272 covers
   world x -392..3056, y -30..2911 — the field spans beyond that).
   The main column zone (x 780-1880, y 210-2700) stays clear except
   above/below the stack. Fully deterministic — no randomness. */
const AB_L = 1200, AB_T = 400;              // plane offset (world -> plane-local)
const AB_COL_X = [-1098, -628, -158, 312, 912, 1392, 2442, 2912, 3382];
const AB_MID_COLS = new Set([912, 1392]);    // overlap the main column: top/bottom only
const AB_W = 380, AB_GAP = 84;
const AB_HEIGHTS = [285, 210, 140, 250, 430, 225, 320, 215, 460, 255, 190, 340];
const AB_WIDTHS  = [380, 340, 380, 380, 300, 380, 340, 380, 320, 380, 360, 340];
const AB_STARTS = [-340, -240, -300, -190, -350, -270, -220, -330, -260, -310];

// Every photo/poster appears EXACTLY ONCE across the whole field (and
// none repeat the main column's shoot images or the hero video).
const AB_VIDEOS = ['/ab-flower.jpg','/ab-eye.jpg','/ab-kangaroo.jpg','/ab-amalfi.jpg','/ab-dogs.jpg','/ab-v-art-museum.jpg','/ab-v-birds-over-river.jpg','/ab-v-cat-on-bed.jpg','/ab-v-chameleon.jpg','/ab-v-cloud-man.jpg','/ab-v-gold-rush.jpg','/ab-v-happy-cat.jpg','/ab-v-lagos.jpg','/ab-v-big-eyed-fluff-ball.jpg','/ab-v-mitten-astronaut.jpg','/ab-v-monster-with-melting-candle.jpg','/ab-v-octopus-and-crab.jpg','/ab-v-origami-undersea.jpg','/ab-v-paper-airplanes.jpg','/ab-v-petri-dish-pandas.jpg','/ab-v-photoreal-train.jpg','/ab-v-santorini.jpg','/ab-v-ships-in-coffee.jpg','/ab-v-stack-of-tvs.jpg','/ab-v-tiny-construction.jpg','/ab-v-victoria-crowned-pigeon.jpg','/ab-v-wooly-mammoth.jpg','/ab-v-zen-garden-gnome.jpg'];
const AB_IMGS   = ['/ab-welder-sunset.jpg','/ab-cultural-dancers.jpg','/ab-builder-illustration.jpg','/ab-submarine.jpg','/ab-tablets.jpg','/ab-roblox.jpg','/ab-field-02.jpg','/ab-mei.jpg','/ab-bb-cards-2.jpg','/ab-bb-detail-1.jpg','/ab-bb-detail-4.jpg','/ab-bb-griffin.jpg'];
const AB_MEDIA = [];
for (let i = 0; i < Math.max(AB_VIDEOS.length, AB_IMGS.length); i++) {
  if (AB_VIDEOS[i]) AB_MEDIA.push(['video', AB_VIDEOS[i], 'Video']);
  if (AB_IMGS[i])   AB_MEDIA.push(['img',   AB_IMGS[i],   '']);
}

function buildAbCards() {
  // 1) positions only
  const slots = [];
  const cols = [1972, ...AB_COL_X];
  const JIT_X = [-30, 12, 28, -14, 4, 22, -26, 16];
  const JIT_Y = [10, -24, 22, -8, 28, -18, 4, -28];
  let jit = 0;
  cols.forEach((cx, ci) => {
    let hIdx = (ci * 3) % AB_HEIGHTS.length;
    const mid = AB_MID_COLS.has(cx);
    const ranges = mid ? [[-340, 190], [2716, 3260]]
                       : [[AB_STARTS[ci % AB_STARTS.length], 3260]];
    ranges.forEach(([y0, yMax]) => {
      let y = y0;
      while (true) {
        const h = AB_HEIGHTS[hIdx % AB_HEIGHTS.length];
        const w = AB_WIDTHS[hIdx % AB_WIDTHS.length];
        if (y + h > yMax) break;
        // Deterministic scatter + varied aspect ratios (narrow cards
        // centre in their column, so clearances only grow).
        slots.push({
          x: cx + Math.round((AB_W - w) / 2) + JIT_X[jit % JIT_X.length],
          y: y + JIT_Y[jit % JIT_Y.length],
          w, h,
        });
        jit++;
        y += h + AB_GAP; hIdx++;
      }
    });
  });
  // 2) keep ONLY slots that can appear in the finale frame (world rect
  //    -392..3056 × -30..2911, +margin) — everything is on camera, so
  //    everything must be unique.
  const FR = { x0: -472, x1: 3136, y0: -110, y1: 2991 };
  const visible = slots.filter((sl) => sl.x < FR.x1 && sl.x + sl.w > FR.x0 && sl.y < FR.y1 && sl.y + sl.h > FR.y0);

  // 3) STRICTLY-UNIQUE content: interleave unique media (47) with the
  //    unique media-skills panels (AB_PANELS, 18) nearest-first; any
  //    remainder gets audio/doc pattern-variant cards (each pattern
  //    distinct, pushed to the outermost ranks where they land at the
  //    frame edges).
  const CX = 1332, CY = 1440;
  const byDist = visible.map((sl, i) => ({ i, d: Math.hypot(sl.x + sl.w / 2 - CX, sl.y + sl.h / 2 - CY) }))
                        .sort((a, b) => a.d - b.d);
  const deck = [];
  let mi = 0, pi = 0;
  while (mi < AB_MEDIA.length || pi < AB_PANELS.length) {
    if (mi < AB_MEDIA.length) deck.push({ kind: AB_MEDIA[mi][0], payload: AB_MEDIA[mi][1], tag: AB_MEDIA[mi][2] }), mi++;
    if (mi < AB_MEDIA.length) deck.push({ kind: AB_MEDIA[mi][0], payload: AB_MEDIA[mi][1], tag: AB_MEDIA[mi][2] }), mi++;
    if (pi < AB_PANELS.length) deck.push({ kind: 'panel', payload: pi, tag: '' }), pi++;
  }
  byDist.forEach(({ i }, rank) => {
    const sl = visible[i];
    if (rank < deck.length) {
      Object.assign(sl, deck[rank], { v: rank });
    } else {
      const kind = rank % 2 === 0 ? 'audio' : 'doc';
      Object.assign(sl, { kind, payload: null, tag: kind === 'audio' ? 'Audio' : 'Copy', v: rank });
    }
  });
  return visible.map((sl) => [sl.x, sl.y, sl.w, sl.h, sl.kind, sl.payload, sl.tag, sl.v]);
}
export const AB_CARDS = buildAbCards();

const AB_BAR_SETS = [
  [26, 44, 62, 38, 54, 30, 48, 60, 36, 50, 28, 42],
  [40, 24, 52, 60, 34, 48, 28, 56, 44, 30, 58, 36],
  [30, 52, 36, 58, 26, 44, 60, 32, 50, 40, 24, 54],
  [56, 34, 48, 26, 60, 38, 30, 52, 42, 58, 28, 46],
];
const AB_DOC_SETS = [
  [92, 86, 95, 70, 88, 55],
  [78, 94, 62, 90, 74, 48],
  [88, 60, 96, 82, 52, 76],
];
const AB_CHARTS = {
  line:  `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><polyline points="0,48 16,40 32,44 48,28 64,32 80,14 100,20" fill="none" stroke="#1858ee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="0,54 16,50 32,52 48,42 64,46 80,34 100,38" fill="none" stroke="rgba(24,88,238,0.35)" stroke-width="2" stroke-linecap="round"/></svg>`,
  donut: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="none" stroke="rgba(15,23,42,0.08)" stroke-width="9"/><circle cx="30" cy="30" r="22" fill="none" stroke="#1858ee" stroke-width="9" stroke-dasharray="96 138" stroke-linecap="round" transform="rotate(-90 30 30)"/><circle cx="30" cy="30" r="22" fill="none" stroke="rgba(24,88,238,0.4)" stroke-width="9" stroke-dasharray="34 200" stroke-dashoffset="-100" transform="rotate(-90 30 30)"/></svg>`,
  hbars: `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><rect x="0" y="4"  width="84" height="9" rx="4.5" fill="#1858ee"/><rect x="0" y="20" width="64" height="9" rx="4.5" fill="rgba(24,88,238,0.75)"/><rect x="0" y="36" width="48" height="9" rx="4.5" fill="rgba(24,88,238,0.5)"/><rect x="0" y="52" width="30" height="9" rx="4.5" fill="rgba(24,88,238,0.3)"/></svg>`,
  area:  `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0,46 L14,38 L28,42 L42,24 L56,30 L70,16 L84,22 L100,10 L100,60 L0,60 Z" fill="rgba(24,88,238,0.16)"/><polyline points="0,46 14,38 28,42 42,24 56,30 70,16 84,22 100,10" fill="none" stroke="#1858ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  vbars: `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><rect x="4"  y="26" width="12" height="34" rx="3" fill="#1858ee"/><rect x="26" y="12" width="12" height="48" rx="3" fill="rgba(24,88,238,0.8)"/><rect x="48" y="34" width="12" height="26" rx="3" fill="rgba(24,88,238,0.55)"/><rect x="70" y="20" width="12" height="40" rx="3" fill="rgba(24,88,238,0.35)"/><rect x="88" y="42" width="12" height="18" rx="3" fill="rgba(24,88,238,0.25)"/></svg>`,
};
const AB_CHART_KEYS = ['line', 'donut', 'hbars', 'area', 'vbars'];

function abCardHTML([x, y, w, h, kind, payload, tag, v], i) {
  const pos = `left:${AB_L + x}px;top:${AB_T + y}px;width:${w}px;height:${h}px;`;
  let inner = '';
  if (kind === 'img')   inner = `<div class="xab-media"><img src="${payload}" alt="" loading="lazy"/></div>`;
  if (kind === 'video') inner = `<div class="xab-media"><img src="${payload}" alt="" loading="lazy"/></div><div class="xab-play"><span class="xab-play-disc"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 5.2v13.6c0 .9 1 1.44 1.75.95l10.7-6.8a1.1 1.1 0 0 0 0-1.9l-10.7-6.8c-.75-.49-1.75.05-1.75.95Z"/></svg></span></div>`;
  if (kind === 'audio') inner = `<div class="xab-audio">${AB_BAR_SETS[v % AB_BAR_SETS.length].map((bh) => `<i style="height:${bh}px"></i>`).join('')}</div>`;
  if (kind === 'doc')   inner = `<div class="xab-doc"><div class="xab-doc-title"></div>${AB_DOC_SETS[v % AB_DOC_SETS.length].map((wd) => `<div class="xab-doc-line" style="width:${wd}%"></div>`).join('')}</div>`;
  if (kind === 'chart') inner = `<div class="xab-chart">${AB_CHARTS[AB_CHART_KEYS[v % AB_CHART_KEYS.length]]}</div>`;
  if (kind === 'panel') inner = (AB_PANELS[payload] ? AB_PANELS[payload](h) : '');
  const panelCls = (kind === 'audio' || kind === 'doc' || kind === 'chart' || kind === 'panel') ? ' xab-card--panel' : '';
  const skel = (i % 9 === 4) ? `<div class="xab-skel" data-ab-skel><div class="xab-skel-band" data-ab-band></div></div>` : '';
  return `<figure class="xab-card${panelCls}" data-ab-card style="${pos}">${inner}${tag ? `<span class="xab-tag">${tag}</span>` : ''}${skel}</figure>`;
}

export function textGraphsVignette(tl, ctx) {
  const { world, scrollS3, scrollStack, scrollAbundance } = ctx.canvas;
  scrollS3.innerHTML = XTG_HTML;
  scrollAbundance.innerHTML = AB_CARDS.map(abCardHTML).join('');
  const abCards = Array.from(scrollAbundance.querySelectorAll('[data-ab-card]'));
  const abSkels = Array.from(scrollAbundance.querySelectorAll('[data-ab-skel]'));
  const abBands = Array.from(scrollAbundance.querySelectorAll('[data-ab-band]'));
  const layerFeature = scrollS3; // query root (section slot on the scroll canvas)
  const pb = mountPromptBar(scrollS3);

  const wrap           = layerFeature.querySelector('#xtg-wrap');
  const copyEyebrow     = layerFeature.querySelector('.xtg-zone--copy .xtg-eyebrow');
  const insightsEyebrow = layerFeature.querySelector('.xtg-zone--insights .xtg-eyebrow');

  const docCard   = layerFeature.querySelector('#xtg-doc-card');
  const docTitle  = docCard.querySelector('.xtg-card-title');
  const lineEls   = Array.from(docCard.querySelectorAll('.xtg-line'));
  const lineTexts = lineEls.map((l) => l.querySelector('.xtg-line-text'));
  const carets    = lineEls.map((l) => l.querySelector('.xtg-caret'));
  const docMeta   = docCard.querySelector('.xtg-doc-meta');

  const chartCard  = layerFeature.querySelector('#xtg-chart-card');
  const chartTitle = chartCard.querySelector('.xtg-card-title');
  const barCols    = Array.from(chartCard.querySelectorAll('.xtg-bar-col'));
  const barFills   = barCols.map((c) => c.querySelector('.xtg-bar-fill'));
  const barValues  = barCols.map((c) => c.querySelector('.xtg-bar-value'));
  const barLabels  = barCols.map((c) => c.querySelector('.xtg-bar-label'));
  const baseline   = chartCard.querySelector('.xtg-baseline');
  const statLine   = chartCard.querySelector('.xtg-stat-line');
  const statNum    = chartCard.querySelector('.xtg-stat-num');
  const gridlines  = chartCard.querySelector('#xtg-gridlines');
  const legend     = chartCard.querySelector('#xtg-legend');
  const docTags    = docCard.querySelector('#xtg-doc-tags');

  // Fixed setup (not animated): bar fill target heights + accent tint.
  // Only opacity/tint of the ONE accent (#1858ee) varies per bar.
  barFills.forEach((fill, i) => {
    fill.style.height = ((BARS[i].value / MAX_VALUE) * 100).toFixed(2) + '%';
    fill.style.background = `rgba(24, 88, 238, ${BARS[i].tint})`;
  });
  lineTexts.forEach((t) => { t.textContent = ''; });
  statNum.textContent = '0';

  // ----- Pre-state (position 0): the whole section starts BELOW its
  //        resting spot and rides up as the camera tracks down. -----
  tl.set(wrap, { opacity: 0, y: 170 }, 0);
  tl.set([copyEyebrow, insightsEyebrow], { opacity: 0, y: -6 }, 0);
  tl.set([docCard, chartCard], { opacity: 0, y: 18, scale: 0.97 }, 0);
  tl.set(docTitle, { opacity: 0, y: 8 }, 0);
  tl.set(carets, { opacity: 0 }, 0);
  tl.set(docMeta, { opacity: 0, y: 8 }, 0);
  tl.set(chartTitle, { opacity: 0, y: 8 }, 0);
  tl.set(barFills, { scaleY: 0 }, 0);
  tl.set(barValues, { opacity: 0, y: 6 }, 0);
  tl.set(barLabels, { opacity: 0 }, 0);
  tl.set(baseline, { scaleX: 0 }, 0);
  tl.set(statLine, { opacity: 0, y: 8 }, 0);
  tl.set(gridlines, { opacity: 0 }, 0);
  tl.set(legend, { opacity: 0, y: 6 }, 0);
  tl.set(docTags, { opacity: 0, y: 6 }, 0);
  tl.set(abCards, { opacity: 0, y: 26, scale: 0.94, transformOrigin: '50% 60%' }, 0);
  promptBeatPreState(tl, ctx, pb);
  tl.set(abSkels, { opacity: 1 }, 0);
  tl.set(abBands, { xPercent: -160 }, 0);

  // ----- Camera tracks DOWN the scroll canvas to S3 (video exits top) -----
  const camDown = ctx.cameraFor(scrollS3, 0.84, { y: -6 });
  const CAM1_DUR = 1.0;
  tl.to(world, {
    x: camDown.x, y: camDown.y, scale: camDown.scale,
    duration: 1.15, ease: CAMERA_GLIDE,
  }, 0);

  // ----- STORY BEAT: blinking caret → typed prompt → Generate click.
  promptBeat(tl, ctx, pb, { at: 0.85, text: 'Now write launch copy and chart our reach' });

  // The section rides up into its slot from the bottom of the frame.
  tl.to(wrap, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 4.45);

  // ----- Zones reveal as the camera settles -----
  const ZONES_IN = 4.6;
  tl.to([copyEyebrow, insightsEyebrow], {
    opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.06,
  }, ZONES_IN);
  tl.to(docCard,   { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, ZONES_IN + 0.05);
  tl.to(chartCard, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, ZONES_IN + 0.13);

  const TITLES_IN = ZONES_IN + 0.4; // 0.9
  tl.to(docTitle,   { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, TITLES_IN);
  tl.to(chartTitle, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, TITLES_IN + 0.05);
  tl.to(docMeta,    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, TITLES_IN + 0.15);
  tl.to(docTags,    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, TITLES_IN + 0.1);

  // ----- COPY: three lines stream in, one at a time, char-by-char.
  //        Scrub-safe: a tweened counter drives onUpdate → textContent
  //        slice. A thin caret sits right after the typed text (pure
  //        DOM flow, no positioning math) and fades once its line is
  //        done, before the next line's caret appears. -----
  const CHARS_PER_SEC = 78;
  let cursor = TITLES_IN + 0.3; // 1.2
  lineTexts.forEach((textEl, i) => {
    const text  = COPY_LINES[i];
    const caret = carets[i];
    const dur   = text.length / CHARS_PER_SEC;
    const proxy = { n: 0 };

    tl.set(caret, { opacity: 1 }, cursor);
    tl.to(proxy, {
      n: text.length,
      duration: dur,
      ease: 'none',
      onUpdate: () => { textEl.textContent = text.slice(0, Math.round(proxy.n)); },
    }, cursor);

    const caretFadeAt = cursor + dur + 0.05;
    tl.to(caret, { opacity: 0, duration: 0.18, ease: 'power2.out' }, caretFadeAt);

    cursor = caretFadeAt + 0.18 + 0.08; // gap before next line's caret
  });
  const copyDoneAt = cursor;

  // ----- INSIGHTS: baseline draws, bars grow up staggered, axis +
  //        value labels fade with them, stat line counts up. -----
  const BARS_IN = TITLES_IN + 0.05;
  tl.to(baseline, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, BARS_IN);
  tl.to(gridlines, { opacity: 1, duration: 0.4, ease: 'power2.out' }, BARS_IN);

  const BAR_START   = BARS_IN + 0.12;
  const BAR_STAGGER = 0.09;
  const BAR_DUR     = 0.5;
  barFills.forEach((fill, i) => {
    const t = BAR_START + i * BAR_STAGGER;
    tl.to(fill, { scaleY: 1, duration: BAR_DUR, ease: 'power3.out' }, t);
    tl.to(barLabels[i], { opacity: 1, duration: 0.28, ease: 'power2.out' }, t + 0.1);
    tl.to(barValues[i], { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }, t + 0.33);
  });
  const barsDoneAt = BAR_START + (barFills.length - 1) * BAR_STAGGER + BAR_DUR;

  const STAT_IN = barsDoneAt + 0.15;
  const statProxy = { n: 0 };
  tl.to(statProxy, {
    n: 38, duration: 0.75, ease: 'power2.out',
    onUpdate: () => { statNum.textContent = Math.round(statProxy.n); },
  }, STAT_IN);
  tl.to(statLine, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, STAT_IN);
  tl.to(legend,   { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, STAT_IN + 0.1);
  const statDoneAt = STAT_IN + 0.75;

  // ----- THE FINALE — both cards have settled; the camera pulls WIDE
  //        to the entire filled board (images + video + copy + chart,
  //        all in one place). Long luxurious pull-back, then a still
  //        hold — no other motion runs during it. Content is left on
  //        screen; resetToWash clears the layers at loop end, not us. -----
  const settledAt = Math.max(copyDoneAt, statDoneAt) + 0.25;
  // Pull back — slower, wider — to the FULL vertical stack, while an
  // ABUNDANCE of other generations pops in around the main column:
  // more images, video posters, audio waveforms, charts, doc cards.
  const camWide = ctx.cameraFor(scrollStack, 0.272, { y: 0 });
  const CAM2_DUR = 2.3;
  tl.to(world, {
    x: camWide.x, y: camWide.y, scale: camWide.scale,
    duration: CAM2_DUR, ease: CAMERA_GLIDE,
  }, settledAt);

  // Cards pop in as a RING spreading out from the main column — the
  // whole field materialises outward as the frame widens, filling the
  // frame and bleeding past every edge. Deterministic distance sort.
  const CX = 1332, CY = 1440; // world centre of the main stack
  const order = AB_CARDS
    .map((c, i) => ({ i, d: Math.hypot(c[0] + c[2] / 2 - CX, c[1] + c[3] / 2 - CY) }))
    .sort((a, b) => a.d - b.d);
  order.forEach(({ i }, n) => {
    if (!abCards[i]) return;
    tl.to(abCards[i], {
      opacity: 1, y: 0, scale: 1,
      duration: 0.55, ease: 'back.out(1.4)',
    }, settledAt + 0.4 + n * 0.028);
  });

  // A few of them are still "generating" — skeletons shimmer, then
  // resolve while the wide shot holds (the canvas feels alive).
  abSkels.forEach((skel, i) => {
    const t = settledAt + 1.7 + (i % 6) * 0.45;
    tl.to(abBands[i], { xPercent: 160, duration: 0.75, ease: 'power1.inOut' }, t);
    tl.to(skel, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, t + 0.55);
  });


  // The hold BREATHES — a barely-perceptible continued zoom-out keeps
  // the finale alive without reading as motion (ends inside the hold).
  const camBreathe = ctx.cameraFor(scrollStack, 0.2665, { y: 0 });
  tl.to(world, {
    x: camBreathe.x, y: camBreathe.y, scale: camBreathe.scale,
    duration: 2.4, ease: 'power1.inOut',
  }, settledAt + CAM2_DUR + 0.1);

  // Long luxurious hold on the full board.
  const HOLD_END = settledAt + CAM2_DUR + 2.6;
  tl.to({}, { duration: 0.05 }, HOLD_END);
}
