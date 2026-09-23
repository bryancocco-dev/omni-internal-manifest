// AUTO-EXTRACTED verbatim markup from publish-to-workspace/index.html and
// publish-to-workspace/gateway/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, bodyClass, html, js }.
export default {
  menu_publish: {
    note: '.scope-table-menu — board kebab dropdown, open on "Publish to Workspace" (the entry point into the publish flow)',
    minHeight: 300,
    html: `<div class="qa-board-controls" style="position:static;display:flex;justify-content:flex-end;align-items:center;gap:8px;min-width:420px">
      <div class="scope-table-search collapsed">
        <svg class="scope-table-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="search" placeholder="Filter rows…" autocomplete="off" aria-label="Filter rows">
        <div class="scope-table-affordances">
          <button class="scope-table-clear" type="button" aria-label="Clear filter"><svg viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
          <span class="scope-table-count"></span>
        </div>
      </div>
      <div class="scope-table-menu-wrap">
        <button class="scope-table-menu-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="true">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3.5" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="12.5" r="1.4"/></svg>
        </button>
        <div class="scope-table-menu open" role="menu" aria-hidden="false">
          <button role="menuitem" class="scope-table-menu-item" data-action="publish">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 10.5v-8m0 0L4.5 6M8 2.5 11.5 6"/>
              <path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2"/>
            </svg>
            <span>Publish to Workspace</span>
          </button>
          <div class="scope-table-menu-divider" role="separator"></div>
          <button role="menuitem" class="scope-table-menu-item" data-action="download-csv">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"/></svg>
            <span>Download as CSV</span></button>
          <button role="menuitem" class="scope-table-menu-item" data-action="copy-all">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="8" height="9" rx="1.5"/><path d="M3 11.5V4a2 2 0 0 1 2-2h6.5"/></svg>
            <span>Copy all rows</span></button>
          <button role="menuitem" class="scope-table-menu-item" data-action="print">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5V2.5h8v3"/><rect x="2.5" y="5.5" width="11" height="6" rx="1"/><path d="M4 11V13.5h8V11"/></svg>
            <span>Print</span></button>
          <div class="scope-table-menu-divider" role="separator"></div>
          <button role="menuitem" class="scope-table-menu-item" data-action="reset">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.5"/><path d="M13 3v2.5h-2.5"/></svg>
            <span>Reset filters &amp; sort</span></button>
        </div>
      </div>
    </div>`
  },

  chip_published: {
    note: '.qa-pub-flag — inline "Published ✓" receipt chip left on the source board\'s controls row once it lands in Gateway',
    minHeight: 70,
    html: `<div class="qa-board-controls" style="position:static;display:inline-flex;align-items:center;gap:8px">
      <a class="qa-pub-flag" href="gateway/?published=kpi-snapshot-x7k2p">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 5.5L4 8l4.5-6"/></svg>
        <span>Published</span>
      </a>
      <div class="scope-table-search collapsed">
        <svg class="scope-table-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="search" placeholder="Filter rows…" autocomplete="off" aria-label="Filter rows">
        <div class="scope-table-affordances">
          <button class="scope-table-clear" type="button" aria-label="Clear filter"><svg viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
          <span class="scope-table-count"></span>
        </div>
      </div>
      <div class="scope-table-menu-wrap">
        <button class="scope-table-menu-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3.5" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="12.5" r="1.4"/></svg>
        </button>
      </div>
    </div>`
  },

  card_published: {
    note: '.gw-card.pub-card — compact Published-from-Canvas gateway tile, stat-preview variant (non-chart boards travel as a curated stat card)',
    minHeight: 330,
    html: `<section class="gw-card pub-card" data-pub-id="outcomes-forecast-8f21x">
      <div class="gwc-head">
        <div>
          <div class="gwc-eyebrow">Meridian Launch Brief · Canvas 1</div>
          <h3 class="gwc-title">Transatlantic Outcomes Forecast</h3>
        </div>
        <div class="gwc-right">
          <button class="row-more" type="button" aria-label="More options" aria-haspopup="menu">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
          </button>
        </div>
      </div>
      <div class="pubx pubx-stat">
        <div class="pubx-hero"><span class="v">$75.0M</span><span class="k">Recommended consolidated spend</span></div>
        <div class="pubx-stats">
          <div class="pubx-s"><span class="k">Impressions</span><span class="v">1.2–1.5B</span></div>
          <div class="pubx-s"><span class="k">Travelers reached</span><span class="v">5.4–6.2M</span></div>
          <div class="pubx-s"><span class="k">Approved accounts</span><span class="v">820–940k</span></div>
        </div>
      </div>
      <div class="pub-foot">
        <span class="gwc-src">2h ago &middot; Bryan Cocco</span>
        <a class="fg-link" href="#">Open in Canvas <svg viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"/></svg></a>
      </div>
    </section>`
  },

  card_published_wide: {
    note: '.gw-card.pub-card--wide — wide gateway tile carrying the LIVE Chart.js component + a Source/Published/By receipt block',
    minHeight: 420,
    html: `<section class="gw-card pub-card pub-card--wide" data-pub-id="kpi-snapshot-q4n8w">
      <div class="pub-wide-grid">
        <div class="pub-chartwrap"><canvas data-pub-chart="kpi-snapshot-q4n8w"></canvas></div>
        <div class="pub-side">
          <div class="gwc-head">
            <div>
              <div class="gwc-eyebrow">Meridian Launch Brief · Canvas 1</div>
              <h3 class="gwc-title">Diminishing Returns Curve</h3>
            </div>
            <div class="gwc-right">
              <button class="row-more" type="button" aria-label="More options" aria-haspopup="menu">
                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
              </button>
            </div>
          </div>
          <p class="pub-desc">Returns flatten past $85M — recommended spend sits just below the inflection point, with France’s response curve flattening earliest.</p>
          <div class="pub-meta">
            <span class="pub-m"><span class="k">Source</span><span class="v">Meridian Launch Brief · Canvas 1</span></span>
            <span class="pub-m"><span class="k">Published</span><span class="v">2h ago</span></span>
            <span class="pub-m"><span class="k">By</span><span class="v">Bryan Cocco</span></span>
          </div>
          <a class="fg-link" href="#">Open in Canvas <svg viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"/></svg></a>
        </div>
      </div>
    </section>`,
    js: `(function(){
      var el = document.querySelector('canvas[data-pub-chart="kpi-snapshot-q4n8w"]');
      if (!el || !window.Chart) return;
      var css = getComputedStyle(document.documentElement);
      var ACCENT = (css.getPropertyValue('--accent') || '#1858ee').trim();
      var SLATE = '#94a0b6', FBLUE = '#6f93e8';
      var MONO = "'Fira Code', ui-monospace, monospace";
      var GRID = 'rgba(15,23,42,0.07)';
      var SUBTLE = (css.getPropertyValue('--text-subtle') || '#818ea6').trim();
      var mk = function(label, data, color, opts){
        var base = { label: label, data: data, borderColor: color, backgroundColor: color,
          pointBackgroundColor: '#fff', pointBorderColor: color, pointBorderWidth: 1.5,
          pointRadius: 2.5, pointHoverRadius: 5, tension: 0.4, borderWidth: 2, fill: false };
        if (opts) for (var k in opts) base[k] = opts[k];
        return base;
      };
      var heroFill = function(ctx){
        var area = ctx.chart.chartArea; if (!area) return 'rgba(24,88,238,0)';
        var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        g.addColorStop(0, 'rgba(24,88,238,0.14)');
        g.addColorStop(1, 'rgba(24,88,238,0)');
        return g;
      };
      new Chart(el.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['$35M Spend','$55M Spend (Floor)','$75M Spend','$100M Spend (Stretch)','$125M Spend'],
          datasets: [
            mk('Consolidated Midpoint', [460,680,885,1025,1100], ACCENT, { borderWidth: 2.5, fill: true, backgroundColor: heroFill }),
            mk('US Midpoint', [340,510,645,770,845], SLATE),
            mk('France Midpoint', [110,175,240,255,270], FBLUE, { borderDash: [6,5] })
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: {
            legend: { display: true, position: 'top', align: 'start',
              labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 20, color: SUBTLE, font: { size: 10, family: MONO } } },
            tooltip: { enabled: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { color: SUBTLE, font: { size: 9, family: MONO } } },
            x: { grid: { display: false }, border: { color: GRID }, ticks: { color: SUBTLE, font: { size: 9, family: MONO } } }
          }
        }
      });
    })();`
  },

  sectionheader_published: {
    note: '.pub-band .pub-head — "Published from Canvas" band header with a live count pill, sits above the published tiles in Gateway',
    minHeight: 90,
    pad: '0',
    html: `<section class="insights pub-band">
      <div class="insights-inner" style="padding:28px 24px;">
        <div class="pub-head"><h2>Published from Canvas</h2><span class="panel-count">3</span></div>
      </div>
    </section>`
  }
};
