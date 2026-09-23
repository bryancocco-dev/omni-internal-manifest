/* ------------------------------------------------------------------
   VIGNETTE — ppt-board ("here's what you made").
   The finished Coastline campaign board lives INSIDE the app shell's
   own right canvas pane (cs-canvas-stage) as a scrollable document —
   a quiet document head (eyebrow/title/meta), then hero shot,
   projected-reach stats, a channel-mix chart, and the launch copy.
   No prompt typing here; the work already exists, so this cue is a
   reveal, not a generation. The camera glides from the establishing
   shot onto the pane, and the pane's own content scrolls to bring the
   board into frame — one continuous camera+scroll gesture, never a
   cut to a detached flat plane. Content stays on screen at cue end —
   ppt-export takes it from here.
------------------------------------------------------------------ */

import { CAMERA_GLIDE, CAMERA_SETTLE } from './camera.js';

const BARS = [
  { label: 'Meta',    value: 84, share: '32%', tint: 1    },
  { label: 'YouTube', value: 71, share: '27%', tint: 0.8  },
  { label: 'TikTok',  value: 63, share: '24%', tint: 0.65 },
  { label: 'CTV',     value: 58, share: '17%', tint: 0.52 },
];

const COPY_LINES = [
  "The coast doesn't hurry. Neither do we.",
  'Every curve of Highway 1, answered by ours.',
  'Golden hour, meet the machine built for it.',
];

const BODY_COPY = [
  'Corvache was built for roads that reward patience. The Coastline flight leads with the drive itself — golden-hour Pacific light, one unbroken ribbon of Highway 1, and a machine that never looks hurried.',
  'Every placement carries the same calm, assured voice. No spec sheets, no countdown clocks — the details speak once the road has.',
];

const FLIGHT_PHASES = [
  { label: 'Teaser',  left: 0,  width: 30, tint: 0.5  },
  { label: 'Launch',  left: 26, width: 42, tint: 1    },
  { label: 'Sustain', left: 62, width: 38, tint: 0.75 },
];

// ---- Geometry tables (px, within the 1000-wide doc column) ----------
// STACK — the normal vertical document: every module full-width,
// stacked in reading order with a 28px gap between each.
const STACK = {
  hero:   { left: 0, top: 0,    width: 1000, height: 560 },
  stats:  { left: 0, top: 588,  width: 1000, height: 148 },
  chart:  { left: 0, top: 764,  width: 1000, height: 430 },
  copy:   { left: 0,   top: 1222, width: 487,  height: 270 },
  body:   { left: 513, top: 1222, width: 487,  height: 270 },
  flight: { left: 0,   top: 1520, width: 1000, height: 290 },
};
const STACK_H = 1810;

// The bento roll-up beat is PARKED for now (Bryan's call): after the
// scroll-through, the story goes straight to the Download-as-PPT beat
// instead of re-composing into the bento. Flip this back on to
// restore the morph (BENTO below still carries the geometry).
const BENTO_BEAT = false;

// BENTO — the existing lockup geometry (unchanged from the shipped
// composition: hero 580 + side 394 top row, copy 580 + flight 394
// bottom row).
const BENTO = {
  hero:   { left: 0,   top: 0,   width: 580, height: 480 },
  stats:  { left: 606, top: 0,   width: 394, height: 128 },
  chart:  { left: 606, top: 148, width: 394, height: 332 },
  copy:   { left: 0,   top: 504, width: 580, height: 268 },
  body:   { left: 0,   top: 504, width: 580, height: 268 },   // provisional — tucks behind copy if re-enabled
  flight: { left: 606, top: 504, width: 394, height: 268 },
};
const BENTO_H = 772;

const BOARD_HTML = `
  <div class="xpb2-modules" data-modules>
    <figure class="xpb2-hero" data-hero>
      <img class="xpb2-hero-img" data-hero-img src="/shoot-01.webp" alt="Coastline campaign hero" />
      <figcaption class="xpb2-hero-cap" data-hero-cap>
        <span class="xpb2-hero-title">Coastline — golden hour</span>
        <span class="xpb2-hero-chip">Hero image</span>
      </figcaption>
    </figure>

    <div class="xpb2-stat-row" data-stat-row>
      <div class="xpb2-stat-card" data-stat-card>
        <span class="xpb2-stat-num-wrap">+<span class="xpb2-stat-num" data-stat-num="0">0</span>%</span>
        <span class="xpb2-stat-label">Projected reach</span>
      </div>
      <div class="xpb2-stat-card" data-stat-card>
        <span class="xpb2-stat-num-wrap"><span class="xpb2-stat-num" data-stat-num="1">0</span></span>
        <span class="xpb2-stat-label">Channels live</span>
      </div>
    </div>

    <div class="xpb2-chart-card" data-chart-card>
      <div class="xpb2-card-head">
        <span class="xpb2-card-title">Channel mix</span>
        <span class="xpb2-card-badge">Q4 Flight</span>
      </div>
      <div class="xpb2-chart-body">
        <div class="xpb2-yaxis" data-chart-chrome>
          <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
        </div>
        <div class="xpb2-plot-wrap">
          <div class="xpb2-gridlines" data-chart-chrome><i></i><i></i><i></i><i></i><i></i></div>
          <div class="xpb2-chart-plot" data-chart-plot>
            ${BARS.map((b, i) => `
              <div class="xpb2-bar-col" data-bar="${i}">
                <div class="xpb2-bar-track">
                  <div class="xpb2-bar-fill" data-bar-fill>
                    <span class="xpb2-bar-value" data-bar-value>${b.value}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="xpb2-labels-row">
          ${BARS.map((b) => `
            <span class="xpb2-bar-label" data-bar-label>${b.label}<em>${b.share}</em></span>
          `).join('')}
        </div>
      </div>
      <div class="xpb2-chart-foot" data-chart-chrome>
        <span>Indexed reach · 18–49</span><span>Source — Omni Audience</span>
      </div>
    </div>

    <div class="xpb2-copy-card" data-copy-card>
      <div class="xpb2-card-head">
        <span class="xpb2-card-title">Launch copy</span>
        <span class="xpb2-card-badge">3 Headlines</span>
      </div>
      <div class="xpb2-copy-lines" data-copy-lines>
        ${COPY_LINES.map((l, i) => `
          <p class="xpb2-copy-line" data-copy-line>
            <span class="xpb2-copy-num">0${i + 1}</span>
            <span class="xpb2-copy-text">${l}</span>
          </p>`).join('')}
      </div>
    </div>

    <div class="xpb2-body-card" data-body-card>
      <div class="xpb2-card-head">
        <span class="xpb2-card-title">Body copy</span>
        <span class="xpb2-card-badge">Primary</span>
      </div>
      <div class="xpb2-body-text" data-body-text>
        ${BODY_COPY.map((t) => `<p>${t}</p>`).join('')}
      </div>
    </div>

    <div class="xpb2-flight-card" data-flight-card>
      <div class="xpb2-card-head">
        <span class="xpb2-card-title">Flight plan</span>
        <span class="xpb2-card-badge">12 Weeks</span>
      </div>
      <div class="xpb2-flight-body">
        ${FLIGHT_PHASES.map((p) => `
          <div class="xpb2-flight-row" data-flight-row>
            <span class="xpb2-flight-name">${p.label}</span>
            <div class="xpb2-flight-track">
              <div class="xpb2-flight-fill" data-flight-fill style="left:${p.left}%;width:${p.width}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="xpb2-flight-foot" data-flight-foot>
        <span>OCT</span><span>NOV</span><span>DEC</span>
      </div>
    </div>
  </div>
`;

const DOC_HTML = `
  <div class="xpb2-scroller" data-scroller>
    <div class="xpb2-doc">
      <header class="xpb2-doc-head" data-doc-head>
        <span class="xpb2-doc-eyebrow">Corvache — Q4 Flight</span>
        <h2 class="xpb2-doc-title">Coastline Campaign</h2>
        <div class="xpb2-doc-meta"><span>Updated today</span><span>Board</span><span>6 modules</span></div>
      </header>
      ${BOARD_HTML}
    </div>
  </div>
`;

export function pptBoardVignette(tl, ctx) {
  const { canvasStage, canvasSide, hero, world } = ctx.canvas;

  // Hot-reload safety: cue builders run once per page load, but guard
  // against a stray re-run leaving a duplicate scroller behind.
  // Mounted on the PANE (canvasSide), not the stage — the stage grid
  // row starts below the frosted sub-header, so content mounted there
  // hard-clips at its edge and the glass never gets pixels to frost.
  // On the pane, the scroller passes UNDER .cs-canvas-top (z-index 5).
  const stale = canvasSide.querySelector('[data-scroller]');
  if (stale) stale.remove();
  canvasSide.insertAdjacentHTML('beforeend', DOC_HTML);

  const scroller    = canvasSide.querySelector('[data-scroller]');
  const docHead     = scroller.querySelector('[data-doc-head]');
  const modules     = scroller.querySelector('[data-modules]');
  const heroCard    = scroller.querySelector('[data-hero]');
  const heroImg     = scroller.querySelector('[data-hero-img]');
  const heroCap     = scroller.querySelector('[data-hero-cap]');
  const statRow     = scroller.querySelector('[data-stat-row]');
  const statCards   = Array.from(scroller.querySelectorAll('[data-stat-card]'));
  const statNums    = Array.from(scroller.querySelectorAll('[data-stat-num]'));
  const chartCard   = scroller.querySelector('[data-chart-card]');
  const barFills    = Array.from(scroller.querySelectorAll('[data-bar-fill]'));
  const barLabels   = Array.from(scroller.querySelectorAll('[data-bar-label]'));
  const barValues   = Array.from(scroller.querySelectorAll('[data-bar-value]'));
  const chartChrome = Array.from(scroller.querySelectorAll('[data-chart-chrome]'));
  const copyCard    = scroller.querySelector('[data-copy-card]');
  const copyLines   = Array.from(scroller.querySelectorAll('[data-copy-line]'));
  const copyTexts   = Array.from(scroller.querySelectorAll('.xpb2-copy-text'));
  const bodyCard    = scroller.querySelector('[data-body-card]');
  const bodyText    = scroller.querySelector('[data-body-text]');
  const flightCard  = scroller.querySelector('[data-flight-card]');
  const flightRows  = Array.from(scroller.querySelectorAll('[data-flight-row]'));
  const flightFills = Array.from(scroller.querySelectorAll('[data-flight-fill]'));
  const flightFoot  = scroller.querySelector('[data-flight-foot]');

  // Module elements, keyed to match the STACK/BENTO geometry tables.
  // Order matters for the roll-up stagger below — hero first.
  const MODULES = [
    { key: 'hero',   el: heroCard   },
    { key: 'stats',  el: statRow    },
    { key: 'chart',  el: chartCard  },
    { key: 'copy',   el: copyCard   },
    { key: 'body',   el: bodyCard   },
    { key: 'flight', el: flightCard },
  ];

  // Fixed setup (not animated): bar fill target heights.
  barFills.forEach((fill, i) => {
    fill.style.height = (BARS[i].value).toFixed(2) + '%';
    fill.style.background = `rgba(24, 88, 238, ${BARS[i].tint})`;
  });
  flightFills.forEach((fill, i) => {
    fill.style.background = `rgba(24, 88, 238, ${FLIGHT_PHASES[i].tint})`;
  });

  // STACK geometry applied directly (not just via tl.set below): the
  // scroll-target math further down measures scroller.offsetHeight
  // synchronously at build time, before the timeline has ticked, so
  // the real inline styles need to be in the DOM right now rather
  // than waiting on GSAP's render cycle.
  modules.style.height = STACK_H + 'px';
  MODULES.forEach(({ key, el }) => {
    const g = STACK[key];
    el.style.left = g.left + 'px';
    el.style.top = g.top + 'px';
    el.style.width = g.width + 'px';
    el.style.height = g.height + 'px';
  });

  // ----- Pre-state (pinned to 0): a normal vertical document — every
  //        module full-width, stacked in reading order (STACK). -----
  // The pane's own empty-state OMNI logo must NEVER appear in this
  // cut — this .set is added AFTER revealApp's same-position .set
  // (revealApp runs first in the merged cue), so it wins the tie.
  tl.set(hero, { opacity: 0 }, 0);
  tl.set(scroller, { y: 0 }, 0);
  // BLUR fade-in, sequenced AFTER the canvas itself has loaded in:
  // the pane sits empty through revealApp's establishing fade, then
  // the document racks in quickly — soft-focus to sharp — landing
  // right as the camera starts its push (1.95).
  tl.set(scroller, { filter: 'blur(22px)', opacity: 0 }, 0);
  tl.to(scroller, { filter: 'blur(0px)', opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.25);

  // Doc head + hero card + hero caption are already "on the page" —
  // visible from frame one. The camera glide + scroll carries the
  // reveal; no entrance tween needed for these.
  tl.set(docHead, { opacity: 1, y: 0 }, 0);
  tl.set(modules, { height: STACK_H }, 0);
  MODULES.forEach(({ key, el }) => tl.set(el, STACK[key], 0));

  tl.set(heroCard, { opacity: 1, y: 0, scale: 1 }, 0);
  tl.set(heroImg, { scale: 1 }, 0);
  tl.set(heroCap, { opacity: 1, y: 0 }, 0);

  tl.set(statCards, { opacity: 0, y: 16, scale: 0.96 }, 0);
  tl.call(() => { statNums.forEach((n) => { n.textContent = '0'; }); }, null, 0);
  tl.set(chartCard, { opacity: 0, y: 16, scale: 0.96 }, 0);
  tl.set(barFills, { scaleY: 0 }, 0);
  tl.set(barLabels, { opacity: 0 }, 0);
  tl.set(barValues, { opacity: 0, y: 6 }, 0);
  tl.set(chartChrome, { opacity: 0 }, 0);
  tl.set(copyCard, { opacity: 0, y: 16, scale: 0.97 }, 0);
  tl.set(copyLines, { opacity: 0, y: 8 }, 0);
  tl.set(bodyCard, { opacity: 0, y: 16, scale: 0.97 }, 0);
  tl.set(bodyText, { opacity: 0, y: 8 }, 0);
  tl.set(flightCard, { opacity: 0, y: 16, scale: 0.97 }, 0);
  tl.set(flightRows, { opacity: 0, x: -8 }, 0);
  tl.set(flightFills, { scaleX: 0 }, 0);
  tl.set(flightFoot, { opacity: 0 }, 0);
  // Copy writes itself in — start every line empty.
  tl.call(() => {
    copyTexts.forEach((el, i) => { el.textContent = ''; el.dataset.full = COPY_LINES[i]; });
  }, null, 0);

  // ----- Camera glides off the establishing shot onto the pane
  //        lockup — picks up right where revealApp (0→1.95) left off,
  //        so the fly-in reads as one continuous move. The camera
  //        then HOLDS here for the rest of the cue — the scroll does
  //        the storytelling from this point on. -----
  // Framing is anchored UPPER-LEFT on the pane, not centered: the
  // CORVACHE / Untitled Canvas crumb holds the top-left corner of the
  // frame while the zoom sits as deep as the card column allows
  // (0.885 — any closer and the cards' right edges crop). Offsets
  // derived so pane-left lands ~4px in and the sub-header hugs the top.
  const camPane = ctx.cameraFor(canvasSide, 0.88, { x: 5, y: 57 });
  tl.to(world, {
    x: camPane.x, y: camPane.y, scale: camPane.scale,
    duration: 1.4, ease: CAMERA_GLIDE,
  }, 1.95);

  // ----- Scroll targets, computed from the STACK-state document
  //        (already laid out above, so this reflects real measured
  //        height) and derived analytically for the post-morph BENTO
  //        state by swapping the modules-container height delta —
  //        every other contributor to document height (doc padding,
  //        doc head, modules margin-top) is identical in both
  //        states. -----
  const stageH = canvasSide.clientHeight;        // full pane, 1034 nominal
  const docH   = scroller.offsetHeight;           // STACK-state total doc height
  const SCROLL_MAX   = -Math.max(docH - stageH + 8, 0);
  const bentoDocH    = docH - (STACK_H - BENTO_H);
  const SCROLL_BENTO = -Math.max(bentoDocH - stageH + 8, 0);

  // ----- THE SCROLL-THROUGH — one long, continuous glide down the
  //        whole document (a single unhurried user scroll); the
  //        load-in animations ride it as each module enters view. -----
  // CAMERA_GLIDE (the project's bespoke butter curve): a long gentle
  // wind-up, one sweep through the middle, and an extra-long exhale
  // into the stop — far softer at both ends than a standard S-curve.
  tl.to(scroller, { y: SCROLL_MAX, duration: 3.4, ease: CAMERA_GLIDE }, 2.10);

  // ----- The board reveals as each module enters view. -----
  tl.to(statCards, {
    opacity: 1, y: 0, scale: 1, duration: 0.7, ease: CAMERA_SETTLE, stagger: 0.12,
  }, 2.55);

  // Numbers GROW — long, decelerating counts so they read as live data
  // settling rather than a value being stamped in.
  const statTargets = [38, 4];
  statNums.forEach((numEl, i) => {
    const proxy = { n: 0 };
    tl.to(proxy, {
      n: statTargets[i], duration: 1.6, ease: 'power3.out',
      onUpdate: () => { numEl.textContent = Math.round(proxy.n); },
    }, 2.70 + i * 0.10);
  });

  tl.to(chartCard, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: CAMERA_SETTLE }, 3.10);
  // Axis + gridlines draw first so the bars have a frame to grow into.
  tl.to(chartChrome, { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05 }, 3.25);

  const BAR_START = 3.40;
  barFills.forEach((fill, i) => {
    const t = BAR_START + i * 0.11;
    // Long, soft-landing grow — the buttery part.
    tl.to(fill, { scaleY: 1, duration: 0.85, ease: CAMERA_SETTLE }, t);
    tl.to(barLabels[i], { opacity: 1, duration: 0.45, ease: 'power2.out' }, t + 0.35);
    tl.to(barValues[i], { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, t + 0.55);
    // Ambient: each bar keeps breathing a hair after it lands, offset
    // per bar so the chart is never perfectly still. Trimmed short
    // (vs. the old 1.5s+ version) so every repeat fully resolves well
    // before the roll-up morph starts at 6.60 — never fights it.
    tl.to(fill, {
      scaleY: 0.982, duration: 0.72 - i * 0.04, ease: 'sine.inOut',
      yoyo: true, repeat: 1,
    }, t + 0.95);
  });

  tl.to(copyCard, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: CAMERA_SETTLE }, 3.75);
  tl.to(copyLines, {
    opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.13,
  }, 3.90);

  // ----- Body copy card reveals beside the launch copy. -----
  tl.to(bodyCard, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: CAMERA_SETTLE }, 3.90);
  tl.to(bodyText, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 4.05);

  // ----- Flight plan card reveals alongside the copy card. -----
  tl.to(flightCard, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: CAMERA_SETTLE }, 4.10);
  tl.to(flightRows, {
    opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.10,
  }, 4.25);
  // The flight bars are the FINALE — they hold empty through the
  // scroll and only sweep in once it has settled, the last one landing
  // exactly at cue end (6.60), the same instant the export beat's
  // camera starts its climb to the crumb.
  const FLIGHT_FILLS_START = 5.52;
  tl.to(flightFills, {
    scaleX: 1, duration: 0.8, ease: CAMERA_SETTLE, stagger: 0.14,
  }, FLIGHT_FILLS_START);
  tl.to(flightFoot, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 5.55);
  // (No ambient breathe on the flight fills here — at this pacing
  // their natural idle window sits right up against the roll-up
  // morph at 6.60, so a late repeat would visibly collide with it.)

  // Each headline TYPES itself in, one after the next. Scrub-safe:
  // tweened counters driving a textContent slice (never a one-way
  // write). 78cps (up from a slower baseline) so all three lines
  // finish by ~6.5, comfortably ahead of the 6.60 roll-up.
  let typeAt = 4.00;
  copyTexts.forEach((el, i) => {
    const full = COPY_LINES[i];
    const dur  = full.length / 78;
    const prox = { n: 0 };
    tl.to(prox, {
      n: full.length, duration: dur, ease: 'none',
      onUpdate: () => { el.textContent = full.slice(0, Math.round(prox.n)); },
    }, typeAt);
    typeAt += dur + 0.12;
  });

  // ----- THE ROLL-UP (parked behind BENTO_BEAT): stacked modules fly
  //        into the bento lockup. With the flag off, the cue ends on
  //        the resolved document instead and ppt-export's camera move
  //        to the title crumb IS the next beat — scroll, then straight
  //        to Download as PPT. -----
  if (BENTO_BEAT) {
    const T_MORPH = 6.60, DUR_MORPH = 1.05;
    MODULES.forEach(({ key, el }, i) => {
      tl.to(el, { ...BENTO[key], duration: DUR_MORPH, ease: CAMERA_SETTLE }, T_MORPH + i * 0.04);
    });
    tl.to(modules, { height: BENTO_H, duration: DUR_MORPH, ease: CAMERA_SETTLE }, T_MORPH);
    tl.to(scroller, { y: SCROLL_BENTO, duration: DUR_MORPH, ease: CAMERA_SETTLE }, T_MORPH);
  }

  // ----- Ken Burns: hero image drifts a breath deeper while the
  //        camera lingers — completes before this cue ends. -----
  const CUE_END = BENTO_BEAT ? 8.6 : 6.6;
  tl.to(heroImg, {
    scale: 1.075, xPercent: -1.2, duration: (CUE_END - 0.2) - 0.6, ease: 'sine.out',
  }, 0.6);

  // ----- Hold on the resolved document, then hand off to the export
  //        beat. -----
  tl.to({}, { duration: 0.1 }, CUE_END - 0.1);
}
