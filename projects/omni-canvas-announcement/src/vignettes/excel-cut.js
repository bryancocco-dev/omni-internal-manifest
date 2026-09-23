/* ------------------------------------------------------------------
   VIGNETTE — excel-cut ("Excel in Canvas"). Two cues sharing one
   camera move, merged-with-launch like ppt-board / persona-build:

     excelDocVignette()    — open already inside the app. A quiet
       Corvache Q4 budget table (8 channels × months + totals row,
       every number already resolved — the "content already exists"
       spine rule) BUILDS IN as a staggered cascade riding the camera
       push to the pane lockup, then a real interaction: the cursor
       clicks the "Flighting" sheet tab, the active state transfers,
       and the table pages — a horizontal slide, Budget out left /
       Flighting in from the right — to a second, completely different
       -looking sheet: the REAL designed Flighting gantt (ported from
       media-skills/plan-b.html), not the same grid with new strings.
       The "navigates multiple sheets" product point, made real.
       Built from the REAL designed table component (canvas-exports/
       index.html's .scope-table system — table-board-style controls
       row + .scope-table-wrap > <table class="scope-table"> with the
       checkbox column, sortable headers, and hairline row styling),
       ported verbatim into excel-cut.css (that project is a separate
       repo) rather than an invented grid. The sheet-tab strip is
       structural (shares the shell's .cs-tab active register) — a
       hairline baseline the active tab visually interrupts, not a
       floating pill.

     excelExportVignette() — the real feature: title-crumb click →
       LIVE dropdown (PDF/PPT/DOC/XLS + divider + Save Canvas Agent/
       Rename, per BRIEF-excel.md) → hover sweep → click "Download as
       XLS". No loader in the real product for this row, so the cut
       ends right there — a short confident hold on the clicked/
       selected row, then straight to the reset wash. The cursor's
       pre-state here continues from wherever excelDocVignette's sheet
       -tab click left it (no re-entry from off-frame). Forked from
       ppt-export.js's xpe- menu/row shell to the `xxl-` prefix (the
       generate/progress/saved machinery was NOT carried over — this
       cut has no loader beat) — ppt-export.js itself is untouched.

   Prefix `xed-` for the budget-doc content, `xxl-` for the dropdown.
------------------------------------------------------------------ */

import { CAMERA_GLIDE, CAMERA_SETTLE } from './camera.js';

/* ==================================================================
   excelDocVignette — the quiet budget table.
   ================================================================== */

// 8 channels — every row total = oct+nov+dec, every column total sums
// its channels, and the grand total ties out both ways (checked below
// in dev — see the console.assert at module load).
const CHANNELS = [
  { label: 'Meta',         oct: 84, nov: 92, dec: 101, total: 277 },
  { label: 'YouTube',      oct: 61, nov: 66, dec: 71,  total: 198 },
  { label: 'TikTok',       oct: 48, nov: 53, dec: 57,  total: 158 },
  { label: 'CTV',          oct: 35, nov: 38, dec: 41,  total: 114 },
  { label: 'Programmatic', oct: 40, nov: 44, dec: 47,  total: 131 },
  { label: 'Audio',        oct: 22, nov: 24, dec: 26,  total: 72  },
  { label: 'OOH',          oct: 30, nov: 33, dec: 35,  total: 98  },
  { label: 'Search',       oct: 26, nov: 28, dec: 30,  total: 84  },
];
// Bottom totals row — every number already resolved (spine rule: the
// work already exists, we never watch it be authored from nothing).
const TOTAL_OCT = 346, TOTAL_NOV = 378, TOTAL_DEC = 408, TOTAL_GRAND = 1132;

if (import.meta.env?.DEV) {
  console.assert(
    CHANNELS.every((c) => c.oct + c.nov + c.dec === c.total),
    '[excel-cut] a Budget-sheet row does not sum to its own total',
  );
  console.assert(
    CHANNELS.reduce((s, c) => s + c.oct, 0) === TOTAL_OCT &&
    CHANNELS.reduce((s, c) => s + c.nov, 0) === TOTAL_NOV &&
    CHANNELS.reduce((s, c) => s + c.dec, 0) === TOTAL_DEC,
    '[excel-cut] a Budget-sheet month column does not sum to its totals-row cell',
  );
  console.assert(
    TOTAL_OCT + TOTAL_NOV + TOTAL_DEC === TOTAL_GRAND &&
    CHANNELS.reduce((s, c) => s + c.total, 0) === TOTAL_GRAND,
    '[excel-cut] the Budget-sheet grand total does not tie out',
  );
}

const money = (n) => '$' + n + 'K';

/* ------------------------------------------------------------------
   Flighting sheet — the REAL designed gantt from media-skills'
   plan-b.html (Corvache media plan "Flighting" module — Figma-sampled
   bars), not an invented table. Ported: the .planb-gantt anatomy
   (month header / week header / flat label+track rows / absolutely-
   positioned .planb-bar spans / legend), classes kept verbatim,
   colors remapped to --omni-* tokens. Adapted: 12 week columns across
   Oct/Nov/Dec 2026 (vs. the source's Jan–Mar), 8 flat channel rows (no
   group nesting — flat reads cleaner at this width), bar spans re-
   authored per channel to imply Teaser/Launch/Sustain phases through
   placement alone (no colored chips — no-floating-tags rule). No
   bucket switcher, no interactivity, no totals row (a gantt has none —
   correct, not an omission) — a single static render. Sized up from
   the source's 40px rows / 7px bars for legibility at this pane's zoom.
   ------------------------------------------------------------------ */
const GANTT_MONTHS = [
  { label: 'October 2026',  span: 4 },
  { label: 'November 2026', span: 4 },
  { label: 'December 2026', span: 4 },
];
const GANTT_WEEKS = [
  { label: '06 Oct' }, { label: '13 Oct' }, { label: '20 Oct' }, { label: '27 Oct' },
  { label: '03 Nov' }, { label: '10 Nov' }, { label: '17 Nov' }, { label: '24 Nov' },
  { label: '01 Dec' }, { label: '08 Dec' }, { label: '15 Dec' }, { label: '22 Dec' },
];
const GANTT_COLS = GANTT_WEEKS.length; // 12 — full Q4 in week units
// Bar spans in week units (0–12), placement alone implies the flight
// shape — a long single bar reads as a full-quarter Launch, a short
// early bar reads Teaser, a late-starting bar reads Sustain.
const GANTT_ROWS = [
  { name: 'Meta',         bars: [[0, 12]] },
  { name: 'YouTube',      bars: [[2, 10]] },
  { name: 'TikTok',       bars: [[0, 2], [8, 12]] },
  { name: 'CTV',          bars: [[5, 12]] },
  { name: 'Programmatic', bars: [[0, 12]] },
  { name: 'Audio',        bars: [[0, 3], [4, 9]] },
  { name: 'OOH',          bars: [[1, 4]] },
  { name: 'Search',       bars: [[1, 11]] },
];

// ---- scope-table furniture, copied verbatim from canvas-exports/
// index.html's markup (search icon, checkbox check glyph, sort-arrow
// pair) so the component reads identically — same glyphs, same
// structure, just re-hosted here since that's a separate repo. ------
const SEARCH_ICON_SVG = `<svg class="scope-table-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const CLEAR_ICON_SVG = `<svg viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const CHECK_ICON_SVG = `<svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SORT_ICONS_SVG = `<span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span>`;

const COLUMNS = [
  { key: 'ch',    label: 'Channel', type: 'text'   },
  { key: 'oct',   label: 'Oct',     type: 'number' },
  { key: 'nov',   label: 'Nov',     type: 'number' },
  { key: 'dec',   label: 'Dec',     type: 'number' },
  { key: 'total', label: 'Total',   type: 'number' },
];

// Numeric columns (Oct/Nov/Dec/Total) right-align their header — label
// + sort-icon group flush right, same edge as the money cells below —
// via xed-th-num; Channel stays left-aligned (default, no class).
function sortHeadTh(col, i) {
  const cls = [col.type === 'number' ? 'xed-th-num' : null, col.key === 'total' ? 'xed-total-col' : null]
    .filter(Boolean).join(' ');
  return `<th${cls ? ` class="${cls}"` : ''}><button class="scope-sort-btn" type="button" tabindex="-1" data-col="${i}" data-type="${col.type}"><span>${col.label}</span>${SORT_ICONS_SVG}</button></th>`;
}

function dataRowHTML(c, fmt) {
  return `<tr data-row>
    <td class="scope-select"><button class="scope-checkbox" type="button" tabindex="-1" aria-label="Select row">${CHECK_ICON_SVG}</button></td>
    <td>${c.label}</td>
    <td class="xed-money">${fmt(c.oct)}</td>
    <td class="xed-money">${fmt(c.nov)}</td>
    <td class="xed-money">${fmt(c.dec)}</td>
    <td class="xed-money xed-total-col">${fmt(c.total)}</td>
  </tr>`;
}

function budgetTableHTML() {
  return `
    <div class="scope-table-wrap" data-sheet="budget">
      <table class="scope-table" aria-label="Q4 media budget by channel">
        <thead>
          <tr data-thead-row>
            <th class="scope-select-th">
              <button class="scope-checkbox scope-checkbox--header" type="button" tabindex="-1" aria-label="Select all rows">${CHECK_ICON_SVG}</button>
            </th>
            ${COLUMNS.map(sortHeadTh).join('')}
          </tr>
        </thead>
        <tbody>
          ${CHANNELS.map((c) => dataRowHTML(c, money)).join('')}
          <tr class="row-selected xed-row-total" data-row-total>
            <td class="scope-select"></td>
            <td>Total</td>
            <td class="xed-money">${money(TOTAL_OCT)}</td>
            <td class="xed-money">${money(TOTAL_NOV)}</td>
            <td class="xed-money">${money(TOTAL_DEC)}</td>
            <td class="xed-money xed-total-col">${money(TOTAL_GRAND)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// ---- Flighting gantt markup — ported from plan-b.html's buildGanttDom
// (flat rows only; no is-group wrapper since we skip the grouping tier).
function ganttBarsHTML(bars) {
  return bars.map(([a, b]) => {
    const left = (a / GANTT_COLS * 100).toFixed(2);
    const width = ((b - a) / GANTT_COLS * 100).toFixed(2);
    return `<span class="planb-bar" style="left:${left}%;width:${width}%"></span>`;
  }).join('');
}

function ganttRowHTML(row) {
  return `<div class="planb-gantt-row" data-row>
    <span class="planb-gantt-label">${row.name}</span>
    <div class="planb-gantt-track">
      <div class="planb-gantt-track-grid" style="grid-template-columns:repeat(${GANTT_COLS},1fr)">${'<span></span>'.repeat(GANTT_COLS - 1)}</div>
      ${ganttBarsHTML(row.bars)}
    </div>
  </div>`;
}

function ganttHTML() {
  return `
    <div class="scope-table-wrap" data-sheet="flighting">
      <div class="planb-gantt">
        <div class="planb-gantt-inner">
          <div class="planb-gantt-header">
            <div class="planb-gantt-months" style="grid-template-columns:${GANTT_MONTHS.map((m) => m.span + 'fr').join(' ')}">
              ${GANTT_MONTHS.map((m) => `<span class="planb-gantt-month">${m.label}</span>`).join('')}
            </div>
            <div class="planb-gantt-weeks-row" style="grid-template-columns:repeat(${GANTT_COLS},1fr)" data-thead-row>
              ${GANTT_WEEKS.map((w) => `<span class="planb-gantt-week">${w.label}</span>`).join('')}
            </div>
          </div>
          <div class="planb-gantt-rows">
            ${GANTT_ROWS.map(ganttRowHTML).join('')}
          </div>
        </div>
      </div>
      <div class="planb-gantt-legend">
        <span class="planb-gantt-legend-swatch"></span>
        Flight window
      </div>
    </div>`;
}

const DOC_HTML = `
  <div class="xed-scroller" data-scroller>
    <div class="xed-doc">
      <header class="xed-doc-head" data-doc-head>
        <span class="xed-doc-eyebrow">Corvache — Q4 Flight</span>
        <h2 class="xed-doc-title">Q4 Media Budget</h2>
        <div class="xed-doc-meta"><span>Updated today</span><span>Workbook</span><span>8 channels</span></div>
      </header>

      <div class="scope-table-controls" data-controls>
        <div class="scope-table-search">
          ${SEARCH_ICON_SVG}
          <input type="search" placeholder="Filter rows…" autocomplete="off" tabindex="-1" readonly />
          <div class="scope-table-affordances">
            <button class="scope-table-clear" type="button" tabindex="-1" aria-label="Clear filter">${CLEAR_ICON_SVG}</button>
            <span class="scope-table-count">8 rows</span>
          </div>
        </div>
      </div>

      <div class="xed-sheet-stack" data-grid>
        ${budgetTableHTML()}
        ${ganttHTML()}
      </div>

      <!-- NAVIGATES MULTIPLE SHEETS — a structural sheet-tab strip along
           the workbook's bottom edge (now the workbook's own bottom
           edge, since the footnote was pulled): tabs sit on a shared
           hairline baseline, the active tab connects into it — white
           surface, hairline on its three exposed sides, open bottom
           edge. Budget starts active; the cursor beat below clicks
           Flighting, swapping the active state and crossfading the
           table beneath. -->
      <div class="xed-sheet-tabs" data-sheet-tabs>
        <span class="xed-sheet-tab" data-sheet-tab="budget">Budget</span>
        <span class="xed-sheet-tab" data-sheet-tab="flighting">Flighting</span>
        <span class="xed-sheet-tab" data-sheet-tab="reach">Reach</span>
      </div>
    </div>
  </div>
`;

// Structural tab colors — literal hex/rgba, not var()s (GSAP can't
// tween CSS custom-property functions as colors). Lifted straight
// from this file's own --omni-* usage elsewhere (ppt-export.js /
// agents.js use the same literals for the same tokens).
const TAB_ACTIVE   = { backgroundColor: '#ffffff', borderColor: '#DEE1E5', color: '#1858ee', fontWeight: 600 };
const TAB_INACTIVE = { backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(255,255,255,0)', color: '#818ea6', fontWeight: 500 };
const TAB_HOVER_BG = 'rgba(15,23,42,0.04)';

export function excelDocVignette(tl, ctx) {
  const { canvasSide, world, hero } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  // Hot-reload safety, same guard pattern as ppt-board / persona-build.
  const stale = canvasSide.querySelector('[data-scroller]');
  if (stale) stale.remove();
  canvasSide.insertAdjacentHTML('beforeend', DOC_HTML);

  const scroller     = canvasSide.querySelector('[data-scroller]');
  const eyebrow      = scroller.querySelector('.xed-doc-eyebrow');
  const title        = scroller.querySelector('.xed-doc-title');
  const meta         = scroller.querySelector('.xed-doc-meta');
  const controls     = scroller.querySelector('[data-controls]');
  const budgetWrap   = scroller.querySelector('[data-sheet="budget"]');
  const flightWrap   = scroller.querySelector('[data-sheet="flighting"]');
  const theadRow     = budgetWrap.querySelector('[data-thead-row]');
  const rows         = Array.from(budgetWrap.querySelectorAll('[data-row]'));
  const rowTotal     = budgetWrap.querySelector('[data-row-total]');
  const flightRows   = Array.from(flightWrap.querySelectorAll('[data-row]'));
  const sheetTabs    = scroller.querySelector('[data-sheet-tabs]');
  const tabBudget    = scroller.querySelector('[data-sheet-tab="budget"]');
  const tabFlighting = scroller.querySelector('[data-sheet-tab="flighting"]');

  // ================================================================
  // PRE-STATE (position 0) — idempotent every loop. The doc BUILDS IN
  // as a staggered cascade riding the camera push: every piece starts
  // hidden + offset, landing in reading order — doc head, filter bar,
  // table header, the 8 channel rows, Total row last as punctuation.
  // Values inside each row are static the instant it arrives — no
  // counters; the rows ARRIVING is the build, not the numbers.
  // Sheet state resets every loop: Budget sheet visible + its tab
  // active, Flighting sheet hidden + its tab resting — no bleed from
  // the previous loop's click.
  // ================================================================
  // The pane's normal EMPTY state (the OMNI ✦ logo) is what's on screen
  // first — not force-hidden for this cut anymore. revealApp already
  // sets hero opacity:1 at this same position-0; this repeats it
  // explicitly so the cut is self-contained/idempotent regardless of
  // call order. The doc's white surface (scroller — covers everything
  // that paints white underneath it: the scope-table card bg, the
  // filter-bar bg, all of it) starts fully hidden; it's part of the
  // build now, not furniture that was already there.
  tl.set(hero, { opacity: 1 }, 0);
  tl.set(scroller, { y: 0, filter: 'blur(0px)', opacity: 0 }, 0);

  const REVEAL_Y = 12;
  tl.set([eyebrow, title, meta, controls, theadRow, ...rows, rowTotal, sheetTabs], { opacity: 0, y: REVEAL_Y }, 0);

  // Sheet-swap pre-state: Budget at rest (x:0, opaque). Flighting
  // parked 28px off to the right, transparent — its page-turn slide-in
  // origin — with its own rows pulled back a further touch for the
  // ripple that rides on top of the wrap-level slide.
  tl.set(budgetWrap, { x: 0, opacity: 1 }, 0);
  tl.set(flightWrap, { x: 28, opacity: 0 }, 0);
  tl.set(flightRows, { x: 10, opacity: 0 }, 0);
  tl.set(tabBudget, TAB_ACTIVE, 0);
  tl.set(tabFlighting, TAB_INACTIVE, 0);

  tl.set(cursor, { opacity: 0, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ================================================================
  // BEAT — camera glides off the establishing shot straight onto the
  //         pane lockup (identical framing math to ppt-board / persona
  //         -build: the crumb holds the top-left corner, zoomed as
  //         deep as the doc column allows). Picks up right where
  //         revealApp (0 → 1.95) left off — one continuous move, no
  //         long dwell on the establishing shot.
  // ================================================================
  // Zoomed a touch deeper than the ppt-board/persona pane framing
  // (0.885 — the documented safe max for this pane before the doc
  // column's edges crop) so the non-scrolling budget table reads as
  // filling the frame rather than floating in a void.
  const camPane = ctx.cameraFor(canvasSide, 0.885, { x: 5, y: 57 });
  const CAM_START = 1.95, CAM_DUR = 1.3;
  const CAM_END = CAM_START + CAM_DUR; // 3.25 — reveal lands right at/just after this
  tl.to(world, {
    x: camPane.x, y: camPane.y, scale: camPane.scale,
    duration: CAM_DUR, ease: CAMERA_GLIDE,
  }, CAM_START);

  // ================================================================
  // BEAT — the handoff. The empty-canvas OMNI logo dissolves out (the
  //         house pattern — graphics-gen.js's hero dissolve, same
  //         duration/ease) right as the doc's white surface fades in
  //         underneath it — the surface leads the first cascade piece
  //         (eyebrow) by a beat, so the plane arriving reads as part
  //         of the build, not pre-existing furniture. Starts BEFORE
  //         the camera push begins (the wide establishing shot reads
  //         as "just starting to populate"), then rides the push
  //         through to the lockup.
  // ================================================================
  tl.to(hero, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 1.30);
  tl.to(scroller, { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, 1.25);

  // House butter throughout the cascade itself: 0.7s CAMERA_SETTLE,
  // small y+opacity entrances, explicit positions.
  const REVEAL_DUR = 0.7;
  const reveal = (el, t) => tl.to(el, { opacity: 1, y: 0, duration: REVEAL_DUR, ease: CAMERA_SETTLE }, t);

  reveal(eyebrow, 1.35);
  reveal(title,   1.42);
  reveal(meta,    1.54);
  reveal(controls, 1.70);
  reveal(theadRow, 1.85);

  const ROW_STAGGER = 0.09;
  let rowT = 2.00;
  rows.forEach((row) => {
    reveal(row, rowT);
    rowT += ROW_STAGGER;
  });

  // Total row — the punctuation. A slightly bigger beat after the last
  // channel row, landing a hair after the camera settles (CAM_END).
  const T_TOTAL = rowT + 0.13; // ≈ 2.85
  reveal(rowTotal, T_TOTAL);

  // NAVIGATES MULTIPLE SHEETS — the sheet-tab strip, the workbook's
  // own bottom edge now, builds in right with the Total row.
  const T_TABS = T_TOTAL + 0.04;
  reveal(sheetTabs, T_TABS);
  const cascadeEnd = T_TABS + REVEAL_DUR; // ≈ 3.59 — a hair past CAM_END (3.25)

  // ================================================================
  // BEAT — the sheet click. A real beat to read the finished Budget
  //         sheet once everything has landed and the camera is at
  //         rest, then the cursor rises (house off-frame idiom),
  //         moves to the Flighting tab, hovers, clicks — the active
  //         state transfers (identical structural treatment to
  //         Budget's) and the table pages over to the Flighting
  //         gantt. Cursor position/style tweens read live layout at
  //         fire time, so
  //         everything here is scheduled strictly after the cascade
  //         above has resolved (function-value gotcha).
  // ================================================================
  const T_READ_BUDGET_END = cascadeEnd + 0.41; // ≈ 4.00

  tl.to(cursor, { opacity: 1, duration: 0.18 }, T_READ_BUDGET_END);
  tl.to(cursor, {
    x: () => targetIn(tabFlighting, ctx.stage).x,
    y: () => targetIn(tabFlighting, ctx.stage).y,
    duration: 0.6, ease: 'power2.out',
  }, T_READ_BUDGET_END);
  const T_ARRIVE = T_READ_BUDGET_END + 0.6; // ≈ 4.60

  tl.to(tabFlighting, { backgroundColor: TAB_HOVER_BG, duration: 0.18, ease: 'power2.out' }, T_ARRIVE);

  const T_CLICK = T_ARRIVE + 0.25; // ≈ 4.85
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.5, ease: 'power2.out' }, T_CLICK);
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, T_CLICK);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, T_CLICK + 0.08);

  // Active state transfers Budget → Flighting (structural treatment,
  // not a separate class-toggle — tweened so it reads as one swap),
  // and the table pages underneath in lockstep.
  const T_SWAP = T_CLICK + 0.05; // a hair after the click registers
  const SWAP_DUR = 0.25;
  tl.to(tabBudget, { ...TAB_INACTIVE, duration: SWAP_DUR, ease: 'power2.out' }, T_SWAP);
  tl.to(tabFlighting, { ...TAB_ACTIVE, duration: SWAP_DUR, ease: 'power2.out' }, T_SWAP);

  // The page-turn: Budget slides out left + fades (quick, power2.in —
  // it's leaving), Flighting slides in from the right + fades in
  // (CAMERA_SETTLE — it's arriving and landing). Different durations
  // and eases on purpose: this reads as paging to the next sheet of a
  // workbook, not a same-spot alpha crossfade of near-identical tables
  // — reinforced by the gantt itself looking nothing like the money
  // grid it replaces.
  const OUT_DUR = 0.25;
  tl.to(budgetWrap, { x: -28, opacity: 0, duration: OUT_DUR, ease: 'power2.in' }, T_SWAP);

  const IN_DUR = 0.45;
  tl.to(flightWrap, { x: 0, opacity: 1, duration: IN_DUR, ease: CAMERA_SETTLE }, T_SWAP);

  // Flighting's own rows ripple in on top of the wrap-level slide —
  // a small extra x+opacity settle, staggered, so the incoming sheet
  // reads as populating, not just materializing as one flat block.
  const RIPPLE_STAGGER = 0.03;
  tl.to(flightRows, {
    x: 0, opacity: 1, duration: 0.35, ease: CAMERA_SETTLE, stagger: RIPPLE_STAGGER,
  }, T_SWAP + 0.05);

  const T_FLIGHT_SETTLED = T_SWAP + IN_DUR; // ≈ 5.35

  // ----- Read beat on the Flighting sheet, then straight into the
  //        export beat's camera move to the crumb — the cursor stays
  //        right where it is, at the Flighting tab, so the next cue
  //        continues its path rather than re-entering from scratch. -----
  const READ_FLIGHT = 1.0;
  const CUE_END = T_FLIGHT_SETTLED + READ_FLIGHT; // ≈ 6.35
  tl.to({}, { duration: 0.1 }, CUE_END - 0.1);
}

/* ==================================================================
   excelExportVignette — forked wholesale from ppt-export.js's xpe-
   machinery (dropdown/spinner/progress/saved), prefix `xxl-`. LIVE
   row set + order per BRIEF-excel.md; target row is "Download as
   XLS" (last of the four format rows this time, so the hover sweep
   touches one extra row before landing).
   ================================================================== */

const ICON_PDF = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 2h4.7l2.7 2.7V13a.9.9 0 0 1-.9.9H4.6A.9.9 0 0 1 3.7 13V2.9A.9.9 0 0 1 4.6 2z"/><path d="M9.3 2v2.7H12"/><path d="M6 9.3h4M6 11.3h4"/></svg>`;
const ICON_PPT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.8" width="11" height="7.6" rx="1"/><path d="M5.6 8.2V6.8M8 8.2V5.2M10.4 8.2V6"/><path d="M8 10.4v2.2M8 12.6l-2.4 1.6M8 12.6l2.4 1.6"/></svg>`;
const ICON_DOC = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 2h4.7l2.7 2.7V13a.9.9 0 0 1-.9.9H4.6A.9.9 0 0 1 3.7 13V2.9A.9.9 0 0 1 4.6 2z"/><path d="M9.3 2v2.7H12"/><path d="M5.6 8h4.8M5.6 10h4.8M5.6 12h3"/></svg>`;
const ICON_XLS = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 6.3h11M2.5 9.9h11M6.8 6.3v7.2"/></svg>`;
const ICON_AGENT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.7" width="10" height="7.3" rx="2"/><path d="M8 5.7V3.7"/><circle cx="8" cy="2.9" r="0.7" fill="currentColor" stroke="none"/><path d="M6 9v1.2M10 9v1.2"/></svg>`;
const ICON_RENAME = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3l2.7 2.7-6.7 6.7H3.6v-2.7z"/></svg>`;

const ROWS = [
  { key: 'pdf', label: 'Download as PDF', icon: ICON_PDF },
  { key: 'ppt', label: 'Download as PPT', icon: ICON_PPT },
  { key: 'doc', label: 'Download as DOC', icon: ICON_DOC },
  { key: 'xls', label: 'Download as XLS', icon: ICON_XLS },
];
const EXTRA_ROWS = [
  { key: 'agent',  label: 'Save Canvas Agent', icon: ICON_AGENT },
  { key: 'rename', label: 'Rename',            icon: ICON_RENAME },
];

function rowHTML(r) {
  return `
    <button class="xxl-tmi" type="button" data-key="${r.key}">
      <span class="xxl-tmi-icon" data-icon>
        <span class="xxl-tmi-glyph" data-glyph>${r.icon}</span>
      </span>
      <span class="xxl-tmi-label" data-label>${r.label}</span>
    </button>`;
}

export function excelExportVignette(tl, ctx) {
  const { canvasSide } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  const crumb      = canvasSide.querySelector('.cs-canvas-crumb');
  const crumbCaret = crumb.querySelector('.cs-caret');
  crumbCaret.style.display = 'inline-block';

  const menu = document.createElement('div');
  menu.className = 'xxl-title-menu';
  menu.innerHTML = `
    ${ROWS.map(rowHTML).join('')}
    <div class="xxl-title-menu-divider" aria-hidden="true"></div>
    ${EXTRA_ROWS.map(rowHTML).join('')}
  `;
  canvasSide.appendChild(menu);

  const crumbRect = crumb.getBoundingClientRect();
  const sideRect  = canvasSide.getBoundingClientRect();
  menu.style.top  = (crumbRect.bottom - sideRect.top + 12) + 'px';
  menu.style.left = (crumbRect.left - sideRect.left) + 'px';

  const rows       = Array.from(menu.querySelectorAll('.xxl-tmi'));
  const xlsRow     = menu.querySelector('[data-key="xls"]');
  const xlsLabel   = xlsRow.querySelector('[data-label]');
  const xlsIcon    = xlsRow.querySelector('[data-icon]');

  const pdfRow = menu.querySelector('[data-key="pdf"]');
  const pptRow = menu.querySelector('[data-key="ppt"]');
  const docRow = menu.querySelector('[data-key="doc"]');

  // ================================================================
  // PRE-STATE (position 0) — idempotent every loop.
  // ================================================================
  tl.set(menu, { opacity: 0, y: -6, scale: 0.97 }, 0);
  tl.set(rows, { backgroundColor: 'rgba(24,88,238,0)', opacity: 1 }, 0);
  tl.set(crumbCaret, { rotate: 0 }, 0);

  tl.set(xlsIcon, { backgroundColor: 'rgba(15,23,42,0.04)', color: '#394457' }, 0);
  tl.set(xlsLabel, { opacity: 1, color: '#394457' }, 0);

  // Cursor continues its path from the sheet-tab click that closed the
  // previous cue — visible, parked on the Flighting tab — rather than
  // re-entering from off-frame. Read live layout at build time (the
  // previous cue's page-turn doesn't move the tab itself).
  const tabFlighting = canvasSide.querySelector('[data-sheet-tab="flighting"]');
  const flightingPos = targetIn(tabFlighting, ctx.stage);
  tl.set(cursor, { opacity: 1, scale: 1, x: flightingPos.x, y: flightingPos.y }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ================================================================
  // BEAT 1 — camera pushes off the budget-doc lockup onto the shell's
  //          canvas sub-header (identical framing math to ppt-export:
  //          app top edge flush with the frame top).
  // ================================================================
  const camCrumb = ctx.cameraFor(crumb, 1.35, { x: 0, y: -287 });
  tl.to(ctx.canvas.world, { x: camCrumb.x, y: camCrumb.y, scale: camCrumb.scale, duration: 1.25, ease: CAMERA_GLIDE }, 0);

  // ================================================================
  // BEAT 2 — cursor rises, clicks the title crumb.
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
  // BEAT 3 — the LIVE title-dropdown menu springs open.
  // ================================================================
  const Tmenu = 2.05;
  tl.to(menu, { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }, Tmenu);

  // ================================================================
  // BEAT 4 — cursor scans down through PDF → PPT → DOC, hovers each,
  //          then lands + clicks "Download as XLS" (the last format
  //          row — one extra hover-tap vs. ppt-export's 3rd-row target).
  // ================================================================
  const Tscan = 2.55;
  tl.to(cursor, {
    x: () => targetIn(xlsRow, ctx.stage).x,
    y: () => targetIn(xlsRow, ctx.stage).y,
    duration: 0.65, ease: 'power2.inOut',
  }, Tscan);

  const HOVER = 'rgba(15,23,42,0.05)';
  const CLEAR = 'rgba(24,88,238,0)';
  tl.to(pdfRow, { backgroundColor: HOVER, duration: 0.12, ease: 'power2.out' }, Tscan + 0.12);
  tl.to(pdfRow, { backgroundColor: CLEAR, duration: 0.16, ease: 'power2.out' }, Tscan + 0.30);
  tl.to(pptRow, { backgroundColor: HOVER, duration: 0.12, ease: 'power2.out' }, Tscan + 0.28);
  tl.to(pptRow, { backgroundColor: CLEAR, duration: 0.16, ease: 'power2.out' }, Tscan + 0.46);
  tl.to(docRow, { backgroundColor: HOVER, duration: 0.12, ease: 'power2.out' }, Tscan + 0.44);
  tl.to(docRow, { backgroundColor: CLEAR, duration: 0.16, ease: 'power2.out' }, Tscan + 0.62);
  tl.to(xlsRow, { backgroundColor: 'rgba(24,88,238,0.06)', duration: 0.22, ease: 'power2.out' }, Tscan + 0.68);
  tl.to(xlsLabel, { color: '#1858ee', duration: 0.22, ease: 'power2.out' }, Tscan + 0.68);
  tl.to(xlsIcon, { backgroundColor: '#1858ee', color: '#ffffff', scale: 1.05, duration: 0.22, ease: 'power2.out' }, Tscan + 0.68);

  const Tclick2 = 3.60;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.5, ease: 'power2.out' }, Tclick2);
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, Tclick2);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, Tclick2 + 0.08);
  const Tclick2End = Tclick2 + 0.28;

  // ================================================================
  // BEAT 5 — the finish: no loader in the real product for this row —
  //          the click IS the payoff. A short confident hold on the
  //          clicked/selected "Download as XLS" row (still tinted
  //          from the hover-sweep landing above), then tight out — no
  //          menu-close animation, no camera move; the shared reset
  //          wash dissolves the whole scene straight to the logo.
  // ================================================================
  const HOLD = 0.6;
  const CUE_END = Tclick2End + HOLD;
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
