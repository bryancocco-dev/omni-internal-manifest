/* ------------------------------------------------------------------
   VIGNETTE — ppt-export ("the actual feature").
   Camera pulls back off the flat scroll canvas onto the live app
   shell's canvas sub-header, the cursor clicks the "Untitled Canvas"
   title crumb, the real title-dropdown menu opens (row order + labels
   + in-row generating→done sequence verbatim from
   SPEC-canvas-exports.md), and — with no toast anywhere — the row
   itself is the entire confirmation. Menu auto-closes; ppt-deck picks
   up the payoff from here. Prefix `xpe-` throughout.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

/* ---- icons: exact glyphs from SPEC-canvas-exports.md §3 for the ppt
   + xlsx rows (viewBox 0 0 16 16, stroke-width 1.5); PDF/PNG/agent/
   rename glyphs aren't captured verbatim in the spec (only labels +
   order are), so these reuse the app's existing 1.4-stroke line-icon
   vocabulary (canvas-shell.js ICON_* convention). ------------------ */
const ICON_PDF = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 2h4.7l2.7 2.7V13a.9.9 0 0 1-.9.9H4.6A.9.9 0 0 1 3.7 13V2.9A.9.9 0 0 1 4.6 2z"/><path d="M9.3 2v2.7H12"/><path d="M6 9.3h4M6 11.3h4"/></svg>`;
const ICON_PNG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2.3" y="3" width="11.4" height="10" rx="1.4"/><circle cx="6" cy="6.6" r="1"/><path d="M2.7 11.3l3.6-3.6L9 10.4l1.7-1.7 2.6 2.6"/></svg>`;
const ICON_PPT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.8" width="11" height="7.6" rx="1"/><path d="M5.6 8.2V6.8M8 8.2V5.2M10.4 8.2V6"/><path d="M8 10.4v2.2M8 12.6l-2.4 1.6M8 12.6l2.4 1.6"/></svg>`;
const ICON_XLSX = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 6.3h11M2.5 9.9h11M6.8 6.3v7.2"/></svg>`;
const ICON_AGENT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.7" width="10" height="7.3" rx="2"/><path d="M8 5.7V3.7"/><circle cx="8" cy="2.9" r="0.7" fill="currentColor" stroke="none"/><path d="M6 9v1.2M10 9v1.2"/></svg>`;
const ICON_RENAME = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3l2.7 2.7-6.7 6.7H3.6v-2.7z"/></svg>`;
const CHECK_SVG = `<path d="M3.2 8.6l3 3L12.8 5"/>`;

const ROWS = [
  { key: 'pdf',  label: 'Download as PDF',   icon: ICON_PDF,  generating: 'Rendering PDF…',      time: 1600 },
  { key: 'png',  label: 'Download as PNG',   icon: ICON_PNG,  generating: 'Rendering PNG…',      time: 1300 },
  { key: 'ppt',  label: 'Download as PPT',   icon: ICON_PPT,  generating: 'Generating deck…',    time: 3400 },
  { key: 'xlsx', label: 'Download as Excel', icon: ICON_XLSX, generating: 'Generating workbook…', time: 2800 },
];
const EXTRA_ROWS = [
  { key: 'agent',  label: 'Save Canvas Agent', icon: ICON_AGENT },
  { key: 'rename', label: 'Rename',            icon: ICON_RENAME },
];
const SAVED_LABEL = 'Saved to downloads';

function rowHTML(r) {
  const progress = r.key === 'ppt' ? '<span class="xpe-tmi-progress" data-progress></span>' : '';
  return `
    <button class="xpe-tmi" type="button" data-key="${r.key}">
      <span class="xpe-tmi-icon" data-icon>
        <span class="xpe-tmi-glyph" data-glyph>${r.icon}</span>
        <span class="xpe-tmi-spinner" data-spinner></span>
        <svg class="xpe-tmi-check" data-check viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CHECK_SVG}</svg>
      </span>
      <span class="xpe-tmi-label" data-label>${r.label}</span>
      ${progress}
    </button>`;
}

export function pptExportVignette(tl, ctx) {
  const { world, canvasSide, scrollCanvas, shell } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  const crumb      = canvasSide.querySelector('.cs-canvas-crumb');
  const crumbCaret = crumb.querySelector('.cs-caret');
  // Plain <i> is a non-replaced inline box — CSS transforms don't apply
  // to those per spec. Force inline-block once so the rotate tween below
  // actually renders (structural fix, not animated, safe to set once).
  crumbCaret.style.display = 'inline-block';

  const menu = document.createElement('div');
  menu.className = 'xpe-title-menu';
  menu.innerHTML = `
    ${ROWS.map(rowHTML).join('')}
    <div class="xpe-title-menu-divider" aria-hidden="true"></div>
    ${EXTRA_ROWS.map(rowHTML).join('')}
  `;
  canvasSide.appendChild(menu);

  // Position the menu just under the crumb — SPEC: top: calc(100% + 12px); left: 0
  // (relative to the title-wrap). Computed once against the static layout.
  const crumbRect = crumb.getBoundingClientRect();
  const sideRect  = canvasSide.getBoundingClientRect();
  menu.style.top  = (crumbRect.bottom - sideRect.top + 12) + 'px';
  menu.style.left = (crumbRect.left - sideRect.left) + 'px';

  const rows       = Array.from(menu.querySelectorAll('.xpe-tmi'));
  const otherRows  = rows.filter((r) => r.dataset.key !== 'ppt');
  const divider    = menu.querySelector('.xpe-title-menu-divider');
  const pptRow     = menu.querySelector('[data-key="ppt"]');
  const pptGlyph   = pptRow.querySelector('[data-glyph]');
  const pptSpinner = pptRow.querySelector('[data-spinner]');
  const pptCheck   = pptRow.querySelector('[data-check]');
  const pptLabel   = pptRow.querySelector('[data-label]');
  const pptIcon    = pptRow.querySelector('[data-icon]');
  const pptProgress = pptRow.querySelector('[data-progress]');
  const PPT_LABEL_DEFAULT = ROWS.find((r) => r.key === 'ppt').label;

  // ================================================================
  // PRE-STATE (position 0) — idempotent every loop.
  // ================================================================
  tl.set(scrollCanvas, { opacity: 0 }, 0);

  tl.set(menu, { opacity: 0, y: -6, scale: 0.97 }, 0);
  tl.set(rows, { backgroundColor: 'rgba(24,88,238,0)', opacity: 1 }, 0);
  tl.set(divider, { opacity: 1 }, 0);
  tl.set(crumbCaret, { rotate: 0 }, 0);

  tl.set(pptGlyph, { opacity: 1 }, 0);
  tl.set(pptSpinner, { opacity: 0, rotate: 0 }, 0);
  tl.set(pptCheck, { opacity: 0, scale: 0.5 }, 0);
  tl.set(pptIcon, { backgroundColor: 'rgba(15,23,42,0.04)', color: '#394457' }, 0);
  tl.set(pptProgress, { scaleX: 0 }, 0);
  tl.add(() => { pptLabel.textContent = PPT_LABEL_DEFAULT; }, 0);
  tl.set(pptLabel, { opacity: 1, color: '#394457' }, 0);

  tl.set(cursor, { opacity: 0, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ================================================================
  // BEAT 1 — camera pulls back off the pane lockup onto the shell's
  //          canvas sub-header. The board (now on scrollCanvas's
  //          successor, the in-pane scroller) simply stays put behind
  //          the crumb it flies to — same continuity the board cue set up.
  // ================================================================
  // Offset tuned so the app's top edge sits flush with the frame top
  // (~-6px camera y) — the page wash must never show above the canvas
  // at this zoom; the frame stays entirely inside the app.
  const camCrumb = ctx.cameraFor(crumb, 1.35, { x: 0, y: -287 });
  tl.to(world, { x: camCrumb.x, y: camCrumb.y, scale: camCrumb.scale, duration: 1.25, ease: CAMERA_GLIDE }, 0);

  // ================================================================
  // BEAT 2 — cursor rises, clicks the title crumb (starts only once
  //          the camera above has settled — targetIn() reads live
  //          layout so it must not fire mid-fly).
  // ================================================================
  tl.to(cursor, { opacity: 1, duration: 0.18 }, 1.25);
  tl.to(cursor, {
    x: () => targetIn(crumbCaret, ctx.stage).x,
    y: () => targetIn(crumbCaret, ctx.stage).y,
    duration: 0.55, ease: 'power3.out',
  }, 1.25);

  const Tclick1 = 1.90;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.55, ease: 'power2.out' }, Tclick1);
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, Tclick1);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, Tclick1 + 0.08);
  tl.to(crumbCaret, { rotate: 180, duration: 0.28, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }, Tclick1);

  // ================================================================
  // BEAT 3 — the real title-dropdown menu springs open.
  // ================================================================
  const Tmenu = 2.05;
  tl.to(menu, { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }, Tmenu);

  // ================================================================
  // BEAT 4 — cursor scans down to "Download as PPT", hovers, clicks.
  // ================================================================
  const Tscan = 2.55;
  tl.to(cursor, {
    x: () => targetIn(pptRow, ctx.stage).x,
    y: () => targetIn(pptRow, ctx.stage).y,
    duration: 0.6, ease: 'power2.inOut',
  }, Tscan);
  // The rows light up under the cursor as it sweeps down — PDF, then
  // PNG, each hover releasing as the next takes over (neutral hover
  // tint; only the PPT row earns the brand tint on arrival).
  const pdfRow = menu.querySelector('[data-key="pdf"]');
  const pngRow = menu.querySelector('[data-key="png"]');
  const HOVER  = 'rgba(15,23,42,0.05)';
  const CLEAR  = 'rgba(24,88,238,0)';
  tl.to(pdfRow, { backgroundColor: HOVER, duration: 0.12, ease: 'power2.out' }, Tscan + 0.14);
  tl.to(pdfRow, { backgroundColor: CLEAR, duration: 0.18, ease: 'power2.out' }, Tscan + 0.34);
  tl.to(pngRow, { backgroundColor: HOVER, duration: 0.12, ease: 'power2.out' }, Tscan + 0.30);
  tl.to(pngRow, { backgroundColor: CLEAR, duration: 0.18, ease: 'power2.out' }, Tscan + 0.50);
  tl.to(pptRow, { backgroundColor: 'rgba(24,88,238,0.06)', duration: 0.22, ease: 'power2.out' }, Tscan + 0.55);
  tl.to(pptLabel, { color: '#1858ee', duration: 0.22, ease: 'power2.out' }, Tscan + 0.55);
  tl.to(pptIcon, { backgroundColor: '#1858ee', color: '#ffffff', scale: 1.05, duration: 0.22, ease: 'power2.out' }, Tscan + 0.55);

  const Tclick2 = 3.45;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.5, ease: 'power2.out' }, Tclick2);
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, Tclick2);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, Tclick2 + 0.08);

  // ================================================================
  // BEAT 5 — in-row generation: spinner + "Generating deck…" + the
  //          bottom-edge accent hairline (SPEC §4, real 3400ms scaled
  //          down to ~1.7s raw so the cut stays in budget).
  // ================================================================
  const Tgen = 3.55;
  tl.to(otherRows, { opacity: 0.4, duration: 0.22, ease: 'power2.out' }, Tgen);
  tl.to(divider, { opacity: 0.4, duration: 0.22, ease: 'power2.out' }, Tgen);
  tl.to(pptRow, { backgroundColor: 'rgba(24,88,238,0.05)', duration: 0.15, ease: 'power2.out' }, Tgen);

  tl.to(pptGlyph, { opacity: 0, duration: 0.12, ease: 'power2.in' }, Tgen + 0.05);
  tl.to(pptSpinner, { opacity: 1, duration: 0.12, ease: 'power2.out' }, Tgen + 0.05);
  tl.to(pptSpinner, { rotate: 1440, duration: 2.6, ease: 'none' }, Tgen + 0.05);

  tl.to(pptLabel, { opacity: 0, duration: 0.12, ease: 'power2.in' }, Tgen);
  tl.add(() => { pptLabel.textContent = ROWS.find((r) => r.key === 'ppt').generating; }, Tgen + 0.12);
  tl.to(pptLabel, { opacity: 1, duration: 0.16, ease: 'power2.out' }, Tgen + 0.12);
  tl.to(pptLabel, { color: '#394457', duration: 0.01 }, Tgen);

  const GEN_DUR = 1.7;
  tl.to(pptProgress, { scaleX: 0.96, duration: GEN_DUR, ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }, Tgen + 0.05);

  // ================================================================
  // BEAT 6 — done: check + "Saved to downloads" (accent). No toast —
  //          the row IS the entire confirmation.
  // ================================================================
  const Tdone = Tgen + GEN_DUR;
  // Progress runs to full as the check lands — parked at 0.96 it reads
  // as an off-center rule under the Saved state (10px inset left, ~21px
  // right); completed, it sits symmetric.
  tl.to(pptProgress, { scaleX: 1, duration: 0.18, ease: 'power2.out' }, Tdone);
  tl.to(pptSpinner, { opacity: 0, duration: 0.10, ease: 'power2.in' }, Tdone);
  tl.fromTo(pptCheck, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(2.2)' }, Tdone + 0.05);
  tl.to(pptIcon, { backgroundColor: '#1858ee', color: '#ffffff', scale: 1, duration: 0.18, ease: 'power2.out' }, Tdone);

  tl.to(pptLabel, { opacity: 0, duration: 0.10, ease: 'power2.in' }, Tdone);
  tl.add(() => { pptLabel.textContent = SAVED_LABEL; }, Tdone + 0.10);
  tl.to(pptLabel, { opacity: 1, color: '#1858ee', duration: 0.15, ease: 'power2.out' }, Tdone + 0.10);

  // Hold on the "Saved to downloads" check state. This is the beat
  // that sells the feature — at the cut's 1.7 timeScale it needs ~1.6
  // raw to read as a confident confirmation rather than a flash.
  const Tclose = Tdone + 1.6;

  // ================================================================
  // BEAT 7 — the menu auto-closes on its own (no user click needed).
  // ================================================================
  tl.to(cursor, { opacity: 0, x: '+=60', y: '+=50', duration: 0.55, ease: 'power2.in' }, Tclose - 0.25);
  tl.to(menu, { opacity: 0, y: -6, scale: 0.97, duration: 0.30, ease: 'power2.inOut' }, Tclose);
  tl.to(crumbCaret, { rotate: 0, duration: 0.32, ease: 'power2.inOut' }, Tclose);

  // Rows quietly restore beneath the now-invisible menu (defensive —
  // position-0 pinning already covers the next loop, this just keeps
  // mid-timeline state clean).
  tl.to(otherRows, { opacity: 1, duration: 0.01 }, Tclose + 0.3);
  tl.to(divider, { opacity: 1, duration: 0.01 }, Tclose + 0.3);
  tl.to(pptRow, { backgroundColor: 'rgba(24,88,238,0)', duration: 0.01 }, Tclose + 0.3);

  // ================================================================
  // BEAT 8 — the finish: no camera move. A short settle on the closed
  //          menu, then the reset cue dissolves the whole scene back
  //          into the OMNI logo bookend and the loop replays.
  // ================================================================
  // Tight out: the menu-close + caret settle take ~0.3 — end the cue
  // right behind them so the scene never sits frozen before the fade.
  const CUE_END = Tclose + 0.45;
  tl.to({}, { duration: 0.1 }, CUE_END - 0.1);
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
