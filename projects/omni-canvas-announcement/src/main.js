/* ------------------------------------------------------------------
   MAIN — wires together the stage, timeline, and all vignettes.
   Query params:
     ?capture=1   strip card chrome, show only the 938×800 stage
     ?slow=1      half-speed for QA
     ?cut=ppt     Export-to-PPT announcement cut
     ?cut=canvas  "Canvas generally" announcement cut
   (no ?cut / ?cut=full = the original ~22s feature loop, unchanged)
------------------------------------------------------------------ */

import { gsap } from 'gsap';
import { Timeline } from './timeline.js';
import { mountLauncher, logoIntro, tilesIntro, revealApp, resetToWash } from './vignettes/launcher.js';
import { mountCanvasShell, cameraFor } from './vignettes/canvas-shell.js';
import { chatHatVignette }   from './vignettes/chat-hat.js';
import { personaVignette }    from './vignettes/persona.js';
import { agentsVignette }     from './vignettes/agents.js';
import { featureFlexVignette } from './vignettes/feature-flex.js';

const params = new URLSearchParams(location.search);
if (params.get('capture') === '1') document.body.dataset.capture = '1';

// ----- DOM refs -----
const stage      = document.getElementById('stage');
const stageBg    = document.getElementById('stage-bg');
const layerBook  = document.getElementById('layer-bookend');
const layerVig   = document.getElementById('layer-vignette');
const cursor     = document.getElementById('stage-cursor');

const launcher = mountLauncher(layerBook);  // intro overlay: logo + app tiles
const canvas   = mountCanvasShell(layerVig);

const ctx = {
  stage, stageBg, launcher, cursor, canvas, cameraFor,
};

// ----- HUD wiring -----
const hudCue  = document.getElementById('hud-cue');
const hudTime = document.getElementById('hud-time');
const hudBtn  = document.getElementById('hud-toggle');
const hudRestart = document.getElementById('hud-restart');

const timeline = new Timeline({
  onTick: (t, cue) => {
    // Report EFFECTIVE seconds — what you actually watch, and what the
    // exported MP4 timestamps match.
    hudTime.textContent = (t / timeline.master.timeScale()).toFixed(2) + 's';
    hudCue.textContent  = 'cue: ' + cue;
    if (typeof paintScrub === 'function') paintScrub();
  },
});

// ----- Compose master timeline -----
// The structure is:
//   1. OPEN bookend  (~2.3s) — Frame 0 → bloom open
//   2. Chat Hat       (~4.0s) — chips + cursor click
//   3. Multi-modal    (~3.8s) — image/text/chart tiles
//   4. Agents         (~3.6s) — fleet of pills lighting up
//   5. Feature flex   (~4.0s) — model selector swap
//   6. CLOSE bookend  (~2.4s) — Canvas collapses to wordmark
// Total roughly ~20s. Adjustable.

// The app world starts hidden behind the launcher intro; revealApp()
// fades it in at the establishing shot.
gsap.set(canvas.world, { opacity: 0 });

// ----- Cut selection -----
// Each cut is a cue list. The two announcement cuts lazy-load their
// vignette module; if it's missing or throws, we fall back to the full
// loop so the page never renders blank mid-build.
const CUT = (params.get('cut') || 'full').toLowerCase();

// ----- Card copy (left panel) — cut-aware. Title stays "Canvas." for
// every cut; only the eyebrow + body strings swap. Default/#1 copy is
// already baked into index.html so it needs no lookup entry here. -----
const CARD_COPY = {
  ppt: {
    // Plain hierarchy for this cut: no eyebrow, no serif flourish —
    // and the body alludes to quality without claiming formatting we
    // can't guarantee yet.
    plain: true,
    eyebrow: '',
    title: 'Export Canvas to PowerPoint',
    body: 'Export any canvas straight to PowerPoint — slides built from your work, ready to refine.',
  },
  // DRAFT copy for the next two announcements — confirm with Bryan
  // before these travel anywhere.
  persona: {
    plain: true,
    eyebrow: '',
    title: 'Personas in Canvas',
    body: 'Describe an audience and Canvas builds the persona set — then sit down and talk with them.',
  },
  excel: {
    plain: true,
    eyebrow: '',
    title: 'Excel in Canvas',
    body: 'Canvas writes the formulas, shows its work, and moves across sheets like it built them.',
  },
};
{
  const copy = CARD_COPY[CUT];
  if (copy) {
    const eyebrowEl = document.getElementById('card-eyebrow');
    const bodyEl    = document.getElementById('card-body');
    if (eyebrowEl) eyebrowEl.textContent = copy.eyebrow;
    if (bodyEl)    bodyEl.textContent    = copy.body;
    if (copy.title) {
      const titleEl = document.getElementById('card-title');
      if (titleEl) titleEl.innerHTML = `<em>${copy.title}</em>`;
    }
    if (copy.plain) document.getElementById('card')?.classList.add('card--plain');
  }
}

const FULL_CUES = () => [
  ['logo',         (tl) => logoIntro(tl, ctx)],
  ['tiles',        (tl) => tilesIntro(tl, ctx)],
  ['launch',       (tl) => revealApp(tl, ctx)],
  ['chat-hat',     (tl) => chatHatVignette(tl, ctx)],
  ['persona',      (tl) => personaVignette(tl, ctx)],
  ['agents',       (tl) => agentsVignette(tl, ctx)],
  ['feature-flex', (tl) => featureFlexVignette(tl, ctx)],
  ['reset',        (tl) => resetToWash(tl, ctx)],
];

async function composeCues() {
  if (CUT === 'ppt') {
    try {
      const [{ pptBoardVignette }, { pptExportVignette }] =
        await Promise.all([
          import('./vignettes/ppt-board.js'),
          import('./vignettes/ppt-export.js'),
        ]);
      return [
        // No tiles beat in this cut — the story is the EXPORT, not the
        // app picker. Neutralise the launcher tiles HERE, in the first
        // cue (master t=0) — a tl.set at a later cue's own position 0
        // only applies once the master timeline actually reaches that
        // cue's start; at true master t=0 (and for the whole logo cue
        // before it) it hadn't fired yet, so the tiles sat visible in
        // their raw default layout — the first-run tab/tile flash.
        ['logo', (tl) => {
          logoIntro(tl, ctx);
          tl.set(Object.values(ctx.launcher.tiles), { x: 0, y: 0, scale: 1, opacity: 0 }, 0);
        }],
        // Reveal straight into the app and keep flying: the board cue
        // picks up the SAME camera move and scrolls the canvas pane to
        // reveal the campaign board — one continuous shot, no cut to
        // a detached flat plane.
        ['ppt-board', (tl) => {
          revealApp(tl, ctx);
          pptBoardVignette(tl, ctx);
        }],
        ['ppt-export',(tl) => pptExportVignette(tl, ctx)],
        // (ppt-deck payoff parked — the scene now ends on the download
        //  confirmation + a slow pull-back to the wide shot.)
        ['reset',     (tl) => resetToWash(tl, ctx)],
      ];
    } catch (e) { console.warn('[cut:ppt] module unavailable — falling back to full loop', e); }
  }
  if (CUT === 'persona') {
    try {
      const [{ personaBuildVignette }, { personaChatVignette }] =
        await Promise.all([
          import('./vignettes/persona-build.js'),
          import('./vignettes/persona-chat.js'),
        ]);
      return [
        // Neutralise the launcher tiles in the FIRST cue (master t=0) —
        // see the ppt branch above for why (a later cue's own position
        // 0 doesn't apply at true master t=0, which is what let the
        // tiles flash visible for the logo cue's duration).
        ['logo', (tl) => {
          logoIntro(tl, ctx);
          tl.set(Object.values(ctx.launcher.tiles), { x: 0, y: 0, scale: 1, opacity: 0 }, 0);
        }],
        // No tiles beat — straight into the app; revealApp + the
        // build cue's first beats ride the SAME camera move (ppt-board
        // pattern), one continuous shot.
        ['persona-build', (tl) => {
          revealApp(tl, ctx);
          personaBuildVignette(tl, ctx);
        }],
        ['persona-chat', (tl) => personaChatVignette(tl, ctx)],
        ['reset', (tl) => resetToWash(tl, ctx)],
      ];
    } catch (e) { console.warn('[cut:persona] module unavailable — falling back to full loop', e); }
  }
  if (CUT === 'excel') {
    try {
      const { excelDocVignette, excelExportVignette } = await import('./vignettes/excel-cut.js');
      return [
        // Neutralise the launcher tiles in the FIRST cue (master t=0) —
        // see the ppt branch above for why (a later cue's own position
        // 0 doesn't apply at true master t=0, which is what let the
        // tiles flash visible for the logo cue's duration).
        ['logo', (tl) => {
          logoIntro(tl, ctx);
          tl.set(Object.values(ctx.launcher.tiles), { x: 0, y: 0, scale: 1, opacity: 0 }, 0);
        }],
        // No tiles beat — straight into the app; revealApp + the
        // budget-doc's first beats ride the SAME camera move (ppt-board
        // pattern), one continuous shot, no long establishing dwell.
        ['excel-doc', (tl) => {
          revealApp(tl, ctx);
          excelDocVignette(tl, ctx);
        }],
        ['excel-export', (tl) => excelExportVignette(tl, ctx)],
        ['reset', (tl) => resetToWash(tl, ctx)],
      ];
    } catch (e) { console.warn('[cut:' + CUT + '] module unavailable — falling back to full loop', e); }
  }
  if (CUT === 'canvas') {
    try {
      const { canvasBuildVignette } = await import('./vignettes/canvas-build.js');
      return [
        ['logo',   (tl) => logoIntro(tl, ctx)],
        ['tiles',  (tl) => tilesIntro(tl, ctx)],
        ['launch', (tl) => revealApp(tl, ctx)],
        ['canvas-build', (tl) => canvasBuildVignette(tl, ctx)],
        ['reset',        (tl) => resetToWash(tl, ctx)],
      ];
    } catch (e) { console.warn('[cut:canvas] module unavailable — falling back to full loop', e); }
  }
  if (CUT === 'classic') return FULL_CUES();

  // DEFAULT — the "Welcome to Canvas" narrative: one canvas fills up
  // with images → video → copy + chart → pull-wide payoff. Guarded
  // dynamic imports so a missing module mid-build falls back to the
  // classic loop instead of a blank page.
  try {
    const [{ graphicsGenVignette }, { videoGenVignette }, { textGraphsVignette }] =
      await Promise.all([
        import('./vignettes/graphics-gen.js'),
        import('./vignettes/video-gen.js'),
        import('./vignettes/text-graphs.js'),
      ]);
    return [
      ['logo',         (tl) => logoIntro(tl, ctx)],
      ['tiles',        (tl) => tilesIntro(tl, ctx)],
      ['launch',       (tl) => revealApp(tl, ctx)],
      ['chat-hat',     (tl) => chatHatVignette(tl, ctx)],
      ['graphics-gen', (tl) => graphicsGenVignette(tl, ctx)],
      ['video-gen',    (tl) => videoGenVignette(tl, ctx)],
      ['text-graphs',  (tl) => textGraphsVignette(tl, ctx)],
      ['reset',        (tl) => resetToWash(tl, ctx)],
    ];
  } catch (e) { console.warn('[welcome] modules unavailable — falling back to classic loop', e); }
  return FULL_CUES();
}

// Per-cut pacing (the classic loop's proven 1.45 stays untouched).
const CUT_TIMESCALE = { full: 1.45, classic: 1.45, ppt: 1.7, canvas: 1.45, persona: 1.7, excel: 1.7 };

gsap.set(canvas.chips, { opacity: 0 });

// The vignette builders call cameraFor()/measure layout, so the
// timeline MUST be built after the stylesheet + fonts have applied —
// otherwise pre-layout positions (e.g. the rail tools before the flex
// spacer pushes them to the bottom) get baked into the camera moves.
async function buildAndPlay() {
  // CSS + fonts are ready — reveal the page (kills the unstyled-DOM
  // flash and the font-swap flicker on first load).
  document.documentElement.classList.add('app-ready');

  const cues = await composeCues();
  for (const [name, builder] of cues) timeline.cue(name, builder);

  // Global pace preserves every cue's relative timing. ?slow=1
  // overrides for QA.
  const scale = CUT_TIMESCALE[CUT] || CUT_TIMESCALE.full;
  timeline.timeScale(params.get('slow') === '1' ? 0.5 : scale);
  buildScrub();
  timeline.play();

  // ?t=12.5 — deep-link straight to a timestamp, paused.
  const tParam = parseFloat(params.get('t'));
  if (!Number.isNaN(tParam)) {
    timeline.pause(); hudBtn.textContent = 'play';
    seekEff(tParam);
  }
}

const cssReady = new Promise((res) => {
  if (document.readyState === 'complete') res();
  else window.addEventListener('load', res, { once: true });
});
Promise.all([cssReady, document.fonts.ready]).then(buildAndPlay);

hudBtn.addEventListener('click', () => {
  const paused = timeline.master.paused();
  if (paused) { timeline.play(); hudBtn.textContent = 'pause'; }
  else        { timeline.pause(); hudBtn.textContent = 'play';  }
});
hudRestart.addEventListener('click', () => timeline.restart());

/* ------------------------------------------------------------------
   SCRUBBER — drag the track to seek. All times shown are EFFECTIVE
   seconds (what you see / what the MP4 runs at), i.e. raw / timeScale.

   Backward seeks replay stepped-forward from 0: GSAP resolves tween
   start-values lazily, so a raw jump backwards corrupts the camera
   transforms. Forward seeks are a direct jump.
------------------------------------------------------------------ */
const hudTrack = document.getElementById('hud-track');
const hudSegs  = document.getElementById('hud-segs');
const hudFill  = document.getElementById('hud-fill');
const hudHead  = document.getElementById('hud-head');
const hudTicks = document.getElementById('hud-ticks');
const hudTip   = document.getElementById('hud-tip');

const effDuration = () => timeline.master.duration() / timeline.master.timeScale();

function seekEff(effT) {
  const m = timeline.master;
  const ts = m.timeScale();
  const raw = Math.max(0, Math.min(effT * ts, m.duration() - 0.001));
  if (raw >= m.time()) {
    m.time(raw);
  } else {
    m.time(0);
    const step = 0.1 * ts;
    for (let x = 0; x <= raw; x += step) m.time(x);
    m.time(raw);
  }
  paintScrub();
}

function buildScrub() {
  const dur = effDuration();
  const ts  = timeline.master.timeScale();

  hudSegs.innerHTML = timeline.cues.map((c) => {
    const w = ((c.end - c.start) / ts / dur) * 100;
    return `<div class="hud-seg" data-cue="${c.name}" style="width:${w}%"><span>${c.name}</span></div>`;
  }).join('');

  // Second ticks — every 5s, plus each cue boundary.
  const marks = [];
  for (let t = 0; t <= dur; t += 5) marks.push(t);
  hudTicks.innerHTML = marks
    .map((t) => `<span class="hud-tick" style="left:${(t / dur) * 100}%">${t}s</span>`)
    .join('');
}

function paintScrub() {
  const dur = effDuration();
  const eff = timeline.master.time() / timeline.master.timeScale();
  const pct = (eff / dur) * 100;
  hudFill.style.width = pct + '%';
  hudHead.style.left  = pct + '%';
  const cue = timeline.cues.find((c) => {
    const t = timeline.master.time();
    return t >= c.start && t < c.end;
  });
  [...hudSegs.children].forEach((el) => {
    el.classList.toggle('is-active', !!cue && el.dataset.cue === cue.name);
  });
}

const effFromEvent = (e) => {
  const r = hudTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  return pct * effDuration();
};

let scrubbing = false;
hudTrack.addEventListener('pointerdown', (e) => {
  scrubbing = true;
  hudTrack.setPointerCapture(e.pointerId);
  timeline.pause(); hudBtn.textContent = 'play';
  seekEff(effFromEvent(e));
});
hudTrack.addEventListener('pointermove', (e) => {
  const r = hudTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  hudTip.style.left = pct * 100 + '%';
  hudTip.textContent = (pct * effDuration()).toFixed(2) + 's';
  if (scrubbing) seekEff(pct * effDuration());
});
hudTrack.addEventListener('pointerup', (e) => {
  scrubbing = false;
  hudTrack.releasePointerCapture(e.pointerId);
});

// Click a cue label (with modifier-free double-click) to jump to its start.
hudSegs.addEventListener('dblclick', (e) => {
  const seg = e.target.closest('.hud-seg');
  if (!seg) return;
  const cue = timeline.cues.find((c) => c.name === seg.dataset.cue);
  if (cue) { timeline.pause(); hudBtn.textContent = 'play'; seekEff(cue.start / timeline.master.timeScale()); }
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const eff = timeline.master.time() / timeline.master.timeScale();
  const nudge = e.shiftKey ? 1 : 0.1;
  if (e.code === 'Space') {
    e.preventDefault();
    hudBtn.click();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault(); timeline.pause(); hudBtn.textContent = 'play'; seekEff(eff + nudge);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault(); timeline.pause(); hudBtn.textContent = 'play'; seekEff(eff - nudge);
  } else if (e.code === 'Home') {
    e.preventDefault(); seekEff(0);
  }
});

// expose for debugging in devtools
window.__omni = { timeline, ctx };
