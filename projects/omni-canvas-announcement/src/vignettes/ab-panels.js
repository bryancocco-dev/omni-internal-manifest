/* ------------------------------------------------------------------
   AB-PANELS — a library of 18 small "canvas output" card interiors,
   mined from the OMNI Media Skills prototype's component vocabulary
   (index bars, stat tiles, donuts, flighting gantt rows, channel
   mixes, budget rows) and stylized for the announcement's abundance
   grid (see text-graphs.js AB_CARDS / abCardHTML — those cards render
   at 380px wide, h between 140-285px, and appear zoomed out ~27%, so
   shapes + color blocking read better than fine text).

   Every builder is `(h) => htmlString` — the INTERIOR only, meant to
   fill a card whose outer shell (bg #fff, border, radius, shadow)
   already exists. Pure static markup: no scripts, no animation, no
   external assets. Strict OMNI light theme — one accent (#1858ee),
   varied only via rgba/color-mix tints, plus neutral greys
   rgba(15,23,42,…). All classes prefixed xpn-. See ../styles/ab-panels.css.
------------------------------------------------------------------ */

// Two shared breakpoints: below T1 a row-list panel shows its minimum
// row count, between T1-T2 a middle count, at/above T2 its max —
// "taller cards can show an extra row" from the brief.
const T1 = 175;
const T2 = 230;

/* ---- shared fake-but-plausible data (Meridian Card Services /
   Transatlantic Launch — the media-skills campaign world) ---------- */
const SEG_A = 'Affluent Travelers';
const SEG_B = 'Eco-Conscious Millennials';
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

/* ==================================================================
   1. AUDIENCE STAT TILE — big number + delta
   ================================================================== */
const pStat = (h) => {
  const tiny = h < 160;
  const compact = h < 200;
  return `
    <div class="xpn-root xpn-stat${tiny ? ' xpn-stat--tiny' : compact ? ' xpn-stat--compact' : ''}">
      <div class="xpn-eyebrow">Audience Stat</div>
      <div class="xpn-stat-body">
        <div class="xpn-stat-num">4.8<span class="xpn-stat-unit">M</span></div>
        <div class="xpn-stat-label">Total reach &mdash; ${SEG_A}</div>
        ${tiny ? '' : `<div class="xpn-chip"><span class="xpn-chip-arrow">&#9650;</span>18% vs. last quarter</div>`}
      </div>
    </div>
  `;
};

/* ==================================================================
   2. POPULATION-VS-AUDIENCE INDEX BAR ROWS
   ================================================================== */
const IDX_ROWS = [
  { l: 'CTV',    pop: 48, aud: 71, idx: 148 },
  { l: 'Social', pop: 63, aud: 89, idx: 141 },
  { l: 'OLV',    pop: 41, aud: 57, idx: 139 },
  { l: 'Audio',  pop: 36, aud: 44, idx: 122 },
  { l: 'Search', pop: 70, aud: 76, idx: 109 },
];
const pIdxBars = (h) => {
  const n = h < T1 ? 3 : h < T2 ? 4 : 5;
  const rows = IDX_ROWS.slice(0, n);
  return `
    <div class="xpn-root xpn-idx">
      <div class="xpn-eyebrow-row">
        <span class="xpn-eyebrow">Index vs. Population</span>
        <span class="xpn-idx-legend"><i class="xpn-idx-dot xpn-idx-dot--ghost"></i>Pop<i class="xpn-idx-dot xpn-idx-dot--fill"></i>Aud</span>
      </div>
      <div class="xpn-idx-rows">
        ${rows.map((r) => `
          <div class="xpn-idx-row">
            <span class="xpn-idx-label">${r.l}</span>
            <div class="xpn-idx-track">
              <div class="xpn-idx-ghost" style="width:${r.pop}%"></div>
              <div class="xpn-idx-fill" style="width:${r.aud}%"></div>
            </div>
            <span class="xpn-idx-num">${r.idx}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   3. AGE-BAND HISTOGRAM
   ================================================================== */
const HIST_BANDS  = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const HIST_VALUES = [14, 29, 24, 17, 10, 6];
const HIST_MAX = Math.max(...HIST_VALUES);
const pHistogram = (h) => {
  const showVals = h >= T1;
  return `
    <div class="xpn-root xpn-hist">
      <div class="xpn-eyebrow">Age Distribution</div>
      <div class="xpn-hist-plot">
        ${HIST_BANDS.map((b, i) => {
          const pct = Math.round((HIST_VALUES[i] / HIST_MAX) * 100);
          const tint = (0.32 + (HIST_VALUES[i] / HIST_MAX) * 0.68).toFixed(2);
          return `
            <div class="xpn-hist-col">
              ${showVals ? `<span class="xpn-hist-val">${HIST_VALUES[i]}%</span>` : ''}
              <div class="xpn-hist-bar" style="height:${pct}%;background:rgba(24,88,238,${tint})"></div>
              <span class="xpn-hist-lbl">${b}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   4. GENDER / SPLIT DONUT WITH LEGEND
   ================================================================== */
const DONUT_SEGS = [
  { l: 'Female',      v: 54, tint: 1    },
  { l: 'Male',        v: 41, tint: 0.5  },
  { l: 'Non-binary',  v: 5,  tint: 0.22 },
];
const pDonut = (h) => {
  const R = 15.9155; // radius so circumference == 100 (percent-friendly)
  let acc = 0;
  const arcs = DONUT_SEGS.map((s) => {
    const dash = `${s.v} ${100 - s.v}`;
    const offset = 25 - acc; // start at 12 o'clock, clockwise
    acc += s.v;
    return `<circle cx="21" cy="21" r="${R}" fill="none" stroke="rgba(24,88,238,${s.tint})"
      stroke-width="6.2" stroke-dasharray="${dash}" stroke-dashoffset="${offset}"/>`;
  }).join('');
  return `
    <div class="xpn-root xpn-donut">
      <div class="xpn-eyebrow">Gender Split</div>
      <div class="xpn-donut-body">
        <div class="xpn-donut-wrap">
          <svg viewBox="0 0 42 42" class="xpn-donut-svg">
            <circle cx="21" cy="21" r="${R}" fill="none" stroke="rgba(15,23,42,0.07)" stroke-width="6.2"/>
            ${arcs}
          </svg>
          <span class="xpn-donut-center">54<small>%</small></span>
        </div>
        <div class="xpn-donut-legend">
          ${DONUT_SEGS.map((s) => `
            <div class="xpn-donut-leg-row">
              <i class="xpn-donut-swatch" style="background:rgba(24,88,238,${s.tint})"></i>
              <span class="xpn-donut-leg-lbl">${s.l}</span>
              <span class="xpn-donut-leg-val">${s.v}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

/* ==================================================================
   5. AUDIENCE COMPARE — 2-COLUMN MINI
   ================================================================== */
const CMP_ROWS = [
  { m: 'Reach',    a: '4.8M', b: '3.1M' },
  { m: 'Index',    a: '148',  b: '112'  },
  { m: 'Affinity', a: '8.4',  b: '6.1'  },
];
const pCompare = (h) => {
  const n = h < T1 ? 2 : 3;
  const rows = CMP_ROWS.slice(0, n);
  return `
    <div class="xpn-root xpn-cmp">
      <div class="xpn-eyebrow">Audience Compare</div>
      <div class="xpn-cmp-body">
        <div class="xpn-cmp-head">
          <span class="xpn-cmp-name xpn-cmp-name--a"><i></i>${SEG_A}</span>
          <span class="xpn-cmp-name xpn-cmp-name--b"><i></i>${SEG_B}</span>
        </div>
        <div class="xpn-cmp-rows">
          ${rows.map((r) => `
            <div class="xpn-cmp-row">
              <span class="xpn-cmp-val xpn-cmp-val--a">${r.a}</span>
              <span class="xpn-cmp-metric">${r.m}</span>
              <span class="xpn-cmp-val xpn-cmp-val--b">${r.b}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

/* ==================================================================
   6. MEDIA-PLAN FLIGHTING GANTT ROWS
   ================================================================== */
const GANTT_ROWS = [
  { l: 'CTV',    segs: [[1, 3]] },
  { l: 'Social', segs: [[0, 6]] },
  { l: 'OLV',    segs: [[2, 3]] },
  { l: 'Audio',  segs: [[3, 2]] },
];
const pGantt = (h) => {
  const n = h < T1 ? 2 : h < T2 ? 3 : 4;
  const rows = GANTT_ROWS.slice(0, n);
  const wk = 100 / WEEKS.length;
  return `
    <div class="xpn-root xpn-gantt">
      <div class="xpn-eyebrow">Flighting</div>
      <div class="xpn-gantt-body">
        <div class="xpn-gantt-weeks">${WEEKS.map((w) => `<span>${w}</span>`).join('')}</div>
        <div class="xpn-gantt-rows">
          ${rows.map((r, ri) => `
            <div class="xpn-gantt-row">
              <span class="xpn-gantt-label">${r.l}</span>
              <div class="xpn-gantt-track">
                <div class="xpn-gantt-grid">${WEEKS.map(() => '<span></span>').join('')}</div>
                ${r.segs.map(([start, len]) => `
                  <div class="xpn-gantt-bar" style="left:${start * wk}%;width:${len * wk}%;background:rgba(24,88,238,${1 - ri * 0.18})"></div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

/* ==================================================================
   7. CHANNEL-MIX STACKED HORIZONTAL BAR
   ================================================================== */
const MIX_SEGS = [
  { l: 'CTV',    v: 32, tint: 1    },
  { l: 'Social', v: 24, tint: 0.8  },
  { l: 'OLV',    v: 20, tint: 0.6  },
  { l: 'Audio',  v: 14, tint: 0.42 },
  { l: 'Search', v: 10, tint: 0.26 },
];
const pChannelMix = (h) => {
  const showLegend = h >= T1;
  return `
    <div class="xpn-root xpn-mix">
      <div class="xpn-eyebrow">Channel Mix</div>
      <div class="xpn-mix-body">
        <div class="xpn-mix-bar">
          ${MIX_SEGS.map((s) => `<div class="xpn-mix-seg" style="width:${s.v}%;background:rgba(24,88,238,${s.tint})"></div>`).join('')}
        </div>
        ${showLegend ? `
          <div class="xpn-mix-legend">
            ${MIX_SEGS.map((s) => `
              <span class="xpn-mix-leg-item">
                <i class="xpn-mix-swatch" style="background:rgba(24,88,238,${s.tint})"></i>${s.l}
                <b>${s.v}%</b>
              </span>
            `).join('')}
          </div>
        ` : `<div class="xpn-mix-summary">CTV leads at 32% of spend</div>`}
      </div>
    </div>
  `;
};

/* ==================================================================
   8. BUDGET ALLOCATION ROWS WITH VALUES
   ================================================================== */
const BUDGET_ROWS = [
  { l: 'CTV',    v: '$420K', pct: 82 },
  { l: 'Social', v: '$310K', pct: 60 },
  { l: 'OLV',    v: '$260K', pct: 51 },
  { l: 'Audio',  v: '$180K', pct: 35 },
  { l: 'Search', v: '$130K', pct: 25 },
];
const pBudget = (h) => {
  const n = h < T1 ? 3 : h < T2 ? 4 : 5;
  const rows = BUDGET_ROWS.slice(0, n);
  return `
    <div class="xpn-root xpn-budget">
      <div class="xpn-eyebrow-row">
        <span class="xpn-eyebrow">Budget Allocation</span>
        <span class="xpn-eyebrow-tag">Meridian</span>
      </div>
      <div class="xpn-budget-rows">
        ${rows.map((r) => `
          <div class="xpn-budget-row">
            <span class="xpn-budget-label">${r.l}</span>
            <div class="xpn-budget-track"><div class="xpn-budget-fill" style="width:${r.pct}%"></div></div>
            <span class="xpn-budget-val">${r.v}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   9. REACH CURVE (area/line)
   ================================================================== */
const pReachCurve = (h) => `
  <div class="xpn-root xpn-reach">
    <div class="xpn-eyebrow">Cumulative Reach</div>
    <div class="xpn-reach-head">
      <span class="xpn-reach-num">71<small>%</small></span>
      <span class="xpn-reach-sub">Reach 18&ndash;34 &middot; unduplicated</span>
    </div>
    <div class="xpn-reach-chart">
      <svg viewBox="0 0 100 46" preserveAspectRatio="none">
        <path d="M0,42 L10,26 L20,15 L30,9 L40,6 L50,4.4 L60,3.4 L70,2.8 L80,2.4 L90,2.1 L100,2 L100,46 L0,46 Z" fill="rgba(24,88,238,0.14)"/>
        <polyline points="0,42 10,26 20,15 30,9 40,6 50,4.4 60,3.4 70,2.8 80,2.4 90,2.1 100,2" fill="none" stroke="#1858ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
`;

/* ==================================================================
   10. KPI SPARK-ROW — 3 mini stats with tiny sparklines
   ================================================================== */
const KPI_COLS = [
  { l: 'Reach',     v: '4.8M',   pts: '0,16 12,14 24,10 36,9 48,5 60,3' },
  { l: 'Frequency', v: '3.2x',   pts: '0,10 12,11 24,9 36,10 48,9 60,10' },
  { l: 'CPM',       v: '$18.40', pts: '0,4 12,7 24,9 36,12 48,14 60,16' },
];
const pKpiSparkRow = (h) => `
  <div class="xpn-root xpn-kpi">
    <div class="xpn-eyebrow">KPI Snapshot</div>
    <div class="xpn-kpi-row">
      ${KPI_COLS.map((c) => `
        <div class="xpn-kpi-col">
          <span class="xpn-kpi-lbl">${c.l}</span>
          <span class="xpn-kpi-num">${c.v}</span>
          <svg class="xpn-kpi-spark" viewBox="0 0 60 20" preserveAspectRatio="none">
            <polyline points="${c.pts}" fill="none" stroke="#1858ee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `).join('')}
    </div>
  </div>
`;

/* ==================================================================
   11. HEATMAP GRID (5x7 intensity cells)
   ================================================================== */
const HEAT_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HEAT_VALUES = [
  [0.25, 0.30, 0.28, 0.32, 0.35, 0.50, 0.42],
  [0.40, 0.42, 0.45, 0.44, 0.48, 0.60, 0.55],
  [0.55, 0.58, 0.60, 0.62, 0.65, 0.72, 0.68],
  [0.82, 0.85, 0.88, 0.90, 0.95, 0.98, 0.90],
  [0.30, 0.28, 0.32, 0.35, 0.40, 0.50, 0.44],
];
const pHeatmap = (h) => `
  <div class="xpn-root xpn-heat">
    <div class="xpn-eyebrow">Daypart Heatmap</div>
    <div class="xpn-heat-body">
      <div class="xpn-heat-days">${HEAT_DAYS.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="xpn-heat-grid">
        ${HEAT_VALUES.flat().map((v) => `<div class="xpn-heat-cell" style="background:rgba(24,88,238,${v})"></div>`).join('')}
      </div>
    </div>
  </div>
`;

/* ==================================================================
   12. FUNNEL (3-4 stages)
   ================================================================== */
const FUNNEL_STAGES = [
  { l: 'Awareness',     pct: 100, tint: 1    },
  { l: 'Consideration', pct: 68,  tint: 0.72 },
  { l: 'Intent',        pct: 39,  tint: 0.48 },
  { l: 'Conversion',    pct: 14,  tint: 0.26 },
];
const pFunnel = (h) => {
  const n = h < T1 ? 3 : 4;
  const stages = FUNNEL_STAGES.slice(0, n);
  return `
    <div class="xpn-root xpn-funnel">
      <div class="xpn-eyebrow">Conversion Funnel</div>
      <div class="xpn-funnel-rows">
        ${stages.map((s) => `
          <div class="xpn-funnel-row">
            <div class="xpn-funnel-bar${s.tint < 0.55 ? ' xpn-funnel-bar--dark-text' : ''}" style="width:${s.pct}%;background:rgba(24,88,238,${s.tint})">
              <span class="xpn-funnel-lbl">${s.l}</span>
              <span class="xpn-funnel-val">${s.pct}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   13. SCORECARD TILES (2x2)
   ================================================================== */
const SCORE_TILES = [
  { l: 'Reach',     v: '4.8M' },
  { l: 'Frequency', v: '3.2x' },
  { l: 'GRP',       v: '620'  },
  { l: 'CPM',       v: '$18.40' },
];
const pScorecard = (h) => {
  const tier = h < 165 ? ' xpn-score--xs' : h < 215 ? ' xpn-score--sm' : '';
  return `
    <div class="xpn-root xpn-score${tier}">
      <div class="xpn-eyebrow">Scorecard</div>
      <div class="xpn-score-grid">
        ${SCORE_TILES.map((t) => `
          <div class="xpn-score-tile">
            <span class="xpn-score-lbl">${t.l}</span>
            <span class="xpn-score-val">${t.v}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   14. PACING DIAL (half donut)
   ================================================================== */
const pPacingDial = (h) => `
  <div class="xpn-root xpn-dial">
    <div class="xpn-eyebrow">Campaign Pacing</div>
    <div class="xpn-dial-wrap">
      <svg viewBox="0 0 120 66" class="xpn-dial-svg">
        <path d="M10,60 A50,50 0 0 1 110,60" class="xpn-dial-track"/>
        <path d="M10,60 A50,50 0 0 1 110,60" pathLength="100" class="xpn-dial-fill" stroke-dasharray="78 100"/>
      </svg>
      <div class="xpn-dial-center">
        <span class="xpn-dial-num">78<small>%</small></span>
        <span class="xpn-dial-sub">On pace</span>
      </div>
    </div>
  </div>
`;

/* ==================================================================
   15. WEEKLY GRP BARS
   ================================================================== */
const GRP_VALUES = [86, 102, 95, 110, 88, 124];
const GRP_TARGET = 100;
const GRP_MAX = Math.max(...GRP_VALUES, GRP_TARGET) * 1.1;
const pWeeklyGrp = (h) => `
  <div class="xpn-root xpn-grp">
    <div class="xpn-eyebrow">Weekly GRP</div>
    <div class="xpn-grp-plot">
      <div class="xpn-grp-target" style="bottom:${(GRP_TARGET / GRP_MAX) * 100}%"></div>
      ${GRP_VALUES.map((v, i) => `
        <div class="xpn-grp-col">
          <div class="xpn-grp-bar" style="height:${(v / GRP_MAX) * 100}%;background:rgba(24,88,238,${v >= GRP_TARGET ? 1 : 0.42})"></div>
          <span class="xpn-grp-lbl">${WEEKS[i]}</span>
        </div>
      `).join('')}
    </div>
  </div>
`;

/* ==================================================================
   16. CPM TREND LINE WITH DOTS
   ================================================================== */
const CPM_POINTS = [
  { x: 0,   y: 4,  v: '$21.40' },
  { x: 20,  y: 10 },
  { x: 40,  y: 16 },
  { x: 60,  y: 22 },
  { x: 80,  y: 27 },
  { x: 100, y: 32, v: '$16.80' },
];
const pCpmTrend = (h) => `
  <div class="xpn-root xpn-cpm">
    <div class="xpn-eyebrow">CPM Trend</div>
    <div class="xpn-cpm-head">
      <span class="xpn-cpm-val">$21.40</span>
      <span class="xpn-cpm-arrow">&rarr;</span>
      <span class="xpn-cpm-val xpn-cpm-val--end">$16.80</span>
    </div>
    <div class="xpn-cpm-chart">
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" class="xpn-cpm-svg">
        <polyline points="${CPM_POINTS.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#1858ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        ${CPM_POINTS.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.2" fill="#1858ee"/>`).join('')}
      </svg>
    </div>
  </div>
`;

/* ==================================================================
   17. PLATFORM TABLE MICRO-ROWS
   ================================================================== */
const PLATFORM_ROWS = [
  { n: 'YouTube', impr: '1.8M', cpm: '$14.20', idx: 132 },
  { n: 'Meta',    impr: '1.4M', cpm: '$11.80', idx: 118 },
  { n: 'TikTok',  impr: '980K', cpm: '$9.60',  idx: 145 },
  { n: 'Hulu',    impr: '620K', cpm: '$22.40', idx: 104 },
  { n: 'Spotify', impr: '410K', cpm: '$8.20',  idx: 96  },
];
const pPlatformTable = (h) => {
  const n = h < T1 ? 3 : h < T2 ? 4 : 5;
  const rows = PLATFORM_ROWS.slice(0, n);
  return `
    <div class="xpn-root xpn-tbl">
      <div class="xpn-eyebrow">Platform Delivery</div>
      <div class="xpn-tbl-head">
        <span>Platform</span><span>Impr.</span><span>CPM</span><span>Idx</span>
      </div>
      <div class="xpn-tbl-rows">
        ${rows.map((r) => `
          <div class="xpn-tbl-row">
            <span class="xpn-tbl-name">${r.n}</span>
            <span class="xpn-tbl-num">${r.impr}</span>
            <span class="xpn-tbl-num">${r.cpm}</span>
            <span class="xpn-tbl-idx${r.idx >= 100 ? ' xpn-tbl-idx--up' : ''}">${r.idx}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

/* ==================================================================
   18. INDEX SCATTER DOTS
   ================================================================== */
const SCATTER_DOTS = [
  { x: 72, y: 18, r: 5,   a: 0.95, label: SEG_A },
  { x: 40, y: 30, r: 3.4, a: 0.55 },
  { x: 58, y: 45, r: 3,   a: 0.4  },
  { x: 25, y: 50, r: 2.6, a: 0.3  },
  { x: 80, y: 55, r: 3,   a: 0.45 },
  { x: 15, y: 20, r: 2.6, a: 0.25 },
];
const pIndexScatter = (h) => `
  <div class="xpn-root xpn-scatter">
    <div class="xpn-eyebrow">Affinity Map</div>
    <div class="xpn-scatter-plot">
      <svg viewBox="0 0 100 70" class="xpn-scatter-svg" preserveAspectRatio="none">
        <line x1="50" y1="0" x2="50" y2="70" class="xpn-scatter-axis"/>
        <line x1="0" y1="35" x2="100" y2="35" class="xpn-scatter-axis"/>
        ${SCATTER_DOTS.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="rgba(24,88,238,${d.a})"/>`).join('')}
      </svg>
      <span class="xpn-scatter-callout" style="left:${SCATTER_DOTS[0].x}%;top:${SCATTER_DOTS[0].y}%">${SCATTER_DOTS[0].label}</span>
      <span class="xpn-scatter-axis-lbl xpn-scatter-axis-lbl--x">Reach &rarr;</span>
      <span class="xpn-scatter-axis-lbl xpn-scatter-axis-lbl--y">Index &uarr;</span>
    </div>
  </div>
`;

export const AB_PANELS = [
  pStat,            // 1  audience stat tile
  pIdxBars,         // 2  population-vs-audience index bar rows
  pHistogram,       // 3  age-band histogram
  pDonut,           // 4  gender/split donut with legend
  pCompare,         // 5  audience compare 2-column mini
  pGantt,           // 6  media-plan flighting gantt rows
  pChannelMix,      // 7  channel-mix stacked horizontal bar
  pBudget,          // 8  budget allocation rows with values
  pReachCurve,      // 9  reach curve (area/line)
  pKpiSparkRow,     // 10 KPI spark-row (3 mini stats + sparklines)
  pHeatmap,         // 11 heatmap grid (5x7 intensity cells)
  pFunnel,          // 12 funnel (3-4 stages)
  pScorecard,       // 13 scorecard tiles (2x2)
  pPacingDial,      // 14 pacing dial (half donut)
  pWeeklyGrp,       // 15 weekly GRP bars
  pCpmTrend,        // 16 CPM trend line with dots
  pPlatformTable,   // 17 platform table micro-rows
  pIndexScatter,    // 18 index scatter dots
];
