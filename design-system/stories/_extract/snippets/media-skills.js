// AUTO-EXTRACTED verbatim markup from media-skills/index.html — do not hand-edit.
// CAVEAT: the Audience + Plan board content itself is NOT in index.html — it is
// fetched at runtime from views/*.html fragments (see PLAN.md "Fragments are
// fetched by ms.js"). Each snippet below is lifted verbatim from its source
// fragment. Because the generic extract-project-css.mjs only captures
// index.html's own inline <style> blocks, fragment-scoped CSS (audl-/audoa-/
// audc-/plana-/audt- classes) and the shared ms.css chart-token / .ms-source /
// .ms-ai-attr utilities live nowhere in the auto-extracted media-skills.css —
// so every snippet ships its own scoped <style> carrying exactly the rules
// (verbatim declarations, consolidated to their final cascaded values) its
// markup needs, plus the --ms-mono/--ms-chart-*/--ms-pos/--ms-neg tokens under
// body.ms-app where referenced. Fragments also gate entrance/build animation
// behind a JS-added `.is-visible` class (ms.js IntersectionObserver) that never
// runs in the static iframe; each data-reveal root below carries `is-visible`
// verbatim-equivalent to its real settled DOM state so it renders at rest.
export default {
  card_audience: {
    note: '.audl-card — audience list card: photo, rank + AI badge, boolean definition-builder (source chips + AND/OR/INCLUDE term rows), People/Households stat pair',
    minHeight: 300,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace;--ms-chart-2:#7289ef;--ms-chart-3:#22b573;--ms-chart-6:#f59e0b}
body.ms-app[data-theme="dark"]{--ms-chart-2:#5b7cfa;--ms-chart-3:#4ade9f;--ms-chart-6:#f5a623}
.audl-card{display:flex;gap:24px;padding:24px;border-radius:8px;background:var(--card-bg);border:none;cursor:pointer;transition:background .18s ease}
.audl-card:hover{background:var(--hover-tint)}
.audl-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.audl-photo{flex:none;width:200px;height:200px;border-radius:6px;overflow:hidden;background:var(--panel-bg-3)}
.audl-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px}
.audl-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.audl-rank{flex:none;font:500 13px/1 var(--ms-mono);color:var(--text-subtle)}
.audl-name{margin:0;font-size:20px;font-weight:600;line-height:1.3;color:var(--text-strong)}
.audl-chip-ai{display:inline-flex;align-items:center;gap:4px;padding:4px 8px 4px 4px;border-radius:4px;background:var(--accent-soft);color:var(--accent);font:400 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em}
.audl-chip-ai svg{width:8px;height:8px}
.audl-desc{margin:10px 0 0;font-size:14px;font-weight:400;line-height:1.6;color:var(--text-subtle);max-width:66ch}
.audl-builder-row-wrap{display:flex;align-items:stretch;gap:16px;flex-wrap:wrap}
.audl-builder{position:relative;flex:1 1 500px;display:flex;flex-direction:column;gap:8px;padding:12px 16px;border:.5px solid var(--line);border-radius:8px;background:var(--card-bg)}
.audl-sources{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding-bottom:8px}
.audl-source-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 8px 4px 4px;border-radius:4px;background:var(--accent-soft);color:var(--accent);font:400 10px/1.6 var(--ms-mono)}
.audl-source-chip svg{width:8px;height:10px;color:currentColor}
.audl-dot{flex:none;width:4px;height:4px;border-radius:50%}
.audl-dot[data-src="comscore"]{background:var(--ms-chart-6)}
.audl-dot[data-src="acxiom"]{background:var(--ms-chart-2)}
.audl-dot[data-src="corvache"]{background:var(--ms-chart-3)}
.audl-term-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.audl-op{font:400 12px/1.6 var(--ms-mono);color:var(--text-strong)}
.audl-term-chip{display:inline-flex;align-items:center;gap:4px;padding:4px;border-radius:4px;background:var(--panel-bg-3);color:var(--text-subtle);font:400 10px/1.6 var(--ms-mono);text-transform:capitalize}
.audl-term-chip .audl-ico-folder{width:10px;height:9px;color:var(--text-subtle)}
.audl-term-chip .audl-ico-chevron{width:7px;height:4px;color:var(--text-subtle);margin:0 1px}
.audl-stats{flex:1 1 220px;min-width:200px;display:flex;align-items:center;justify-content:flex-start;gap:32px;padding:15px 24px;border-radius:12px;background:var(--card-bg)}
.audl-stat{display:flex;flex-direction:column;align-items:flex-start}
.audl-stat-num{font-size:32px;font-weight:400;line-height:1.3;color:var(--text-strong);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.audl-stat-label{font:500 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle)}
</style>
<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">
  <symbol id="audl-ico-data" viewBox="0 0 8 10"><path d="M4 10C5.988 10 8 9.313 8 8V2C8 0.687 5.988 0 4 0C2.012 0 0 0.687 0 2V8C0 9.313 2.012 10 4 10ZM4 9C2.139 9 1 8.3525 1 8V7.366C1.7705 7.785 2.8885 8 4 8C5.1115 8 6.2295 7.785 7 7.366V8C7 8.3525 5.861 9 4 9ZM4 1C5.861 1 7 1.6475 7 2C7 2.3525 5.861 3 4 3C2.139 3 1 2.3525 1 2C1 1.6475 2.139 1 4 1ZM1 3.366C1.7705 3.785 2.8885 4 4 4C5.1115 4 6.2295 3.785 7 3.366V4C7 4.3525 5.861 5 4 5C2.139 5 1 4.3525 1 4V3.366ZM1 5.366C1.7705 5.785 2.8885 6 4 6C5.1115 6 6.2295 5.785 7 5.366V6C7 6.3525 5.861 7 4 7C2.139 7 1 6.3525 1 6V5.366Z" fill="currentColor"/></symbol>
  <symbol id="audl-ico-folder" viewBox="0 0 10 9"><path d="M9 1H4.707L3.8535 0.1465C3.80713 0.100001 3.75203 0.0631219 3.69137 0.0379808C3.6307 0.0128398 3.56567 -6.75704e-05 3.5 2.66008e-07H1C0.4485 2.66008e-07 0 0.4485 0 1V8C0 8.5515 0.4485 9 1 9H9C9.5515 9 10 8.5515 10 8V2C10 1.4485 9.5515 1 9 1ZM1 8V2H9L9.001 8H1Z" fill="currentColor"/></symbol>
  <symbol id="audl-ico-chevron" viewBox="0 0 7 4"><path d="M0.5 0.5L3.5 3.5L6.5 0.5" stroke="currentColor" stroke-width="0.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>
<article class="audl-card is-visible" data-reveal data-goto-view="overview" role="button" tabindex="0">
  <div class="audl-photo"><div style="width:100%;height:100%;background:var(--panel-bg-3)" title="[photo placeholder — assets/img/audl-affluent.png not extracted (not a top-level project image)]"></div></div>
  <div class="audl-body">
    <div class="audl-head">
      <span class="audl-rank">1</span>
      <h3 class="audl-name">Affluent Travelers</h3>
      <span class="audl-chip-ai">✦ AI</span>
    </div>
    <p class="audl-desc">Quality-seeking 45-64 year olds with high household incomes. Luxury-oriented, risk-averse, and highly receptive to premium brands across digital channels.</p>
    <div class="audl-builder-row-wrap">
      <div class="audl-builder">
        <div class="audl-sources">
          <span class="audl-source-chip" data-build="pop"><svg class="audl-ico-data"><use href="#audl-ico-data"></use></svg>Comscore</span>
          <span class="audl-source-chip" data-build="pop"><svg class="audl-ico-data"><use href="#audl-ico-data"></use></svg>Acxiom</span>
          <span class="audl-source-chip" data-build="pop"><svg class="audl-ico-data"><use href="#audl-ico-data"></use></svg>Corvache Data</span>
        </div>
        <div class="audl-term-row">
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="comscore"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Luxury Auto Intentions<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
          <span class="audl-op">AND</span>
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="acxiom"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Tech Savvy<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
          <span class="audl-op">AND</span>
        </div>
        <div class="audl-term-row">
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="corvache"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Mid-High Income<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
          <span class="audl-op">OR</span>
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="corvache"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Existing US Corvache Customers<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
        </div>
        <div class="audl-term-row">
          <span class="audl-op">INCLUDE</span>
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="acxiom"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Read 2026 EV Safety Reports<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
          <span class="audl-op">AND</span>
          <span class="audl-term-chip" data-build="pop"><span class="audl-dot" data-src="corvache"></span><svg class="audl-ico-folder"><use href="#audl-ico-folder"></use></svg>Safety Aware<svg class="audl-ico-chevron"><use href="#audl-ico-chevron"></use></svg></span>
        </div>
      </div>
      <div class="audl-stats">
        <div class="audl-stat"><span class="audl-stat-num" data-countup>2.1M</span><span class="audl-stat-label">People</span></div>
        <div class="audl-stat"><span class="audl-stat-num" data-countup>889K</span><span class="audl-stat-label">Households</span></div>
      </div>
    </div>
  </div>
</article>`
  },

  stattile: {
    note: '.audoa-tile — stat tile row: eyebrow-less label + big value tiles for quick-glance demographic facts',
    minHeight: 110,
    bodyClass: 'ms-app',
    html: `<style>
.audoa-tilerow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.audoa-tile{background:var(--card-bg);border:.5px solid var(--line);border-radius:8px;padding:16px 18px}
.audoa-tile-label{font-size:12.5px;color:var(--text-subtle);margin:0 0 8px}
.audoa-tile-value{font-size:21px;font-weight:400;color:var(--text-strong);margin:0}
</style>
<div class="audoa-tilerow is-visible" data-reveal>
  <div class="audoa-tile" data-reveal><p class="audoa-tile-label">Gender split</p><p class="audoa-tile-value" data-countup>50/50</p></div>
  <div class="audoa-tile" data-reveal><p class="audoa-tile-label">Marital status</p><p class="audoa-tile-value" data-countup>63% married</p></div>
  <div class="audoa-tile" data-reveal><p class="audoa-tile-label">Top HHI bracket</p><p class="audoa-tile-value" data-countup>$300-500K</p></div>
  <div class="audoa-tile" data-reveal><p class="audoa-tile-label">College educated</p><p class="audoa-tile-value" data-countup>67%</p></div>
</div>`
  },

  chart_bar: {
    note: '.audoa-panel .audoa-bars — vertical demographic/index bar chart: % labels over bars, category axis row, Source caption',
    minHeight: 300,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace}
.audoa-eyebrow{font:500 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle);margin:0 0 12px}
.audoa-panel{background:var(--card-bg);border:.5px solid var(--line);border-radius:8px;padding:18px 20px}
.audoa-panel-title{font-size:13px;color:var(--text-subtle);margin:0 0 16px}
.audoa-bars{display:flex;align-items:flex-end;gap:10px;height:150px;margin-bottom:8px}
.audoa-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px}
.audoa-bar-pct{font-size:11px;color:var(--text-subtle)}
.audoa-bar-shape{width:100%;max-width:34px;border-radius:4px 4px 2px 2px;background:var(--accent)}
.audoa-bar-cat{font-size:10.5px;color:var(--text-subtle);text-align:center}
.ms-source{font-size:10.5px;color:var(--text-subtle);opacity:.85;margin-top:10px}
</style>
<p class="audoa-eyebrow">Demographics</p>
<div class="audoa-panel is-visible" data-reveal>
  <p class="audoa-panel-title">Age Group</p>
  <div class="audoa-bars">
    <div class="audoa-bar-col"><span class="audoa-bar-pct">13%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:65%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">16%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:80%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">12%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:60%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">20%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:100%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">20%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:100%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">10%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:50%"></span></div>
    <div class="audoa-bar-col"><span class="audoa-bar-pct">8%</span><span class="audoa-bar-shape" data-build="bar-v" style="height:40%"></span></div>
  </div>
  <div class="audoa-bars" style="height:auto;margin-bottom:0;">
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">18-24</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">25-34</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">35-44</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">45-54</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">55-64</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">65-74</span></div>
    <div class="audoa-bar-col" style="height:auto;"><span class="audoa-bar-cat">75+</span></div>
  </div>
  <div class="ms-source">Source: Google</div>
</div>`
  },

  callout_ai: {
    note: '.audoa-card + .ms-ai-attr — sparkle-eyebrow AI-generated Executive Summary/Insight card with model attribution line',
    minHeight: 190,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace}
.audoa-card{background:var(--card-bg);border:none;border-radius:8px;padding:22px 24px}
.audoa-eyebrow{font:500 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle);margin:0 0 12px}
.audoa-spark{width:11px;height:11px;color:var(--accent);margin-right:6px;display:inline-block;vertical-align:-1px;flex:none}
.audoa-prose{font-size:13.5px;line-height:1.7;color:var(--text-body);margin:0}
.ms-ai-attr{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-subtle);border-top:.5px solid var(--line);padding-top:10px;margin-top:14px}
</style>
<section class="audoa-card is-visible" data-reveal>
  <p class="audoa-eyebrow"><svg class="audoa-spark" viewBox="0 0 8.25 8.25" aria-hidden="true"><path d="M4.22326 6.18192L3.23359 5.64419L2.69303 4.66133C2.67215 4.623 2.64125 4.59099 2.60359 4.56869C2.56593 4.54638 2.52292 4.53461 2.47909 4.53461C2.43506 4.53467 2.39185 4.54644 2.35394 4.56873C2.31603 4.59101 2.28481 4.62299 2.26352 4.66133L1.72296 5.64419L0.743092 6.18192C0.704647 6.20317 0.672612 6.23425 0.650309 6.27196C0.628005 6.30967 0.616244 6.35262 0.616244 6.39637C0.616244 6.44012 0.628005 6.48307 0.650309 6.52077C0.672612 6.55848 0.704647 6.58956 0.743092 6.61081L1.72296 7.14854L2.26352 8.12328C2.28481 8.16163 2.31603 8.1936 2.35394 8.21588C2.39185 8.23817 2.43506 8.24995 2.47909 8.25C2.52292 8.25 2.56593 8.23823 2.60359 8.21592C2.64125 8.19362 2.67215 8.16161 2.69303 8.12328L3.23359 7.14854L4.22326 6.61081C4.26171 6.58956 4.29374 6.55848 4.31604 6.52077C4.33835 6.48307 4.35011 6.44012 4.35011 6.39637C4.35011 6.35262 4.33835 6.30967 4.31604 6.27196C4.29374 6.23425 4.26171 6.20317 4.22326 6.18192ZM0.127114 1.59343L0.799958 1.96059L1.16904 2.62991C1.19016 2.6682 1.22124 2.70013 1.25902 2.72238C1.2968 2.74462 1.33989 2.75636 1.3838 2.75636C1.4277 2.75636 1.47079 2.74462 1.50857 2.72238C1.54635 2.70013 1.57743 2.6682 1.59855 2.62991L1.96437 1.95246L2.63721 1.58531C2.6757 1.5643 2.7078 1.53339 2.73017 1.4958C2.75253 1.45822 2.76433 1.41535 2.76433 1.37168C2.76433 1.32801 2.75253 1.28514 2.73017 1.24756C2.7078 1.20997 2.6757 1.17906 2.63721 1.15805L1.96437 0.795771L1.59528 0.126449C1.57416 0.0881627 1.54309 0.0562265 1.50531 0.0339814C1.46753 0.0117364 1.42443 0 1.38053 0C1.33663 0 1.29353 0.0117364 1.25575 0.0339814C1.21797 0.0562265 1.1869 0.0881627 1.16578 0.126449L0.799958 0.795771L0.127114 1.16292C0.0886266 1.18393 0.0565223 1.21485 0.0341603 1.25243C0.0117982 1.29001 0 1.33288 0 1.37655C0 1.42023 0.0117982 1.4631 0.0341603 1.50068C0.0565223 1.53826 0.0886266 1.56917 0.127114 1.59019V1.59343ZM8.11934 3.09535L7.08068 2.53L6.51235 1.4984C6.49147 1.46007 6.46057 1.42806 6.42291 1.40576C6.38525 1.38345 6.34224 1.37168 6.29841 1.37168C6.25494 1.37231 6.2124 1.38436 6.17512 1.40661C6.13783 1.42887 6.10713 1.46053 6.08611 1.4984L5.51452 2.53L4.47749 3.09535C4.43883 3.11639 4.4066 3.14742 4.38418 3.18516C4.36176 3.2229 4.34999 3.26596 4.35011 3.30979C4.35011 3.35339 4.36194 3.39618 4.38436 3.43364C4.40679 3.4711 4.43896 3.50184 4.47749 3.52261L5.51452 4.08796L6.08611 5.12118C6.1074 5.15953 6.13862 5.1915 6.17653 5.21378C6.21443 5.23607 6.25765 5.24785 6.30168 5.2479C6.34551 5.2479 6.38852 5.23613 6.42618 5.21382C6.46383 5.19152 6.49474 5.15951 6.51562 5.12118L7.08394 4.08796L8.12261 3.52261C8.16114 3.50184 8.19331 3.4711 8.21573 3.43364C8.23815 3.39618 8.24999 3.35339 8.24999 3.30979C8.24979 3.26563 8.23753 3.22234 8.21452 3.18457C8.19151 3.1468 8.15861 3.11596 8.11934 3.09535Z" fill="currentColor"/></svg>Executive Summary</p>
  <p class="audoa-prose">Affluent travelers are a high-value, low-volume segment of 2.1M adults aged 45-64 with household incomes predominantly between $300K-$500K. They are defined by a rare but powerful combination of financial conservatism and luxury-seeking behavior - they spend premium but justify it through quality, not status. Their strongest media affinities lie in streaming audio (Apple Music, 420Ix) and premium news (NY Times, 348Ix), with Instagram leading social at 158Ix. Geographically concentrated in coastal metros, particularly the Northeast and California. Key strategic flag: high index signals across finance and health categories suggest a values-led creative approach will outperform aspirational messaging for this audience.</p>
  <div class="ms-ai-attr">Generated by claude-opus-4.5 based on: Google, MRI-Simmons 2024, Nielsen Audio</div>
</section>`
  },

  accordion: {
    note: '.plana-acc — collapsible parameter accordion: chevron + mono eyebrow bar, fields grid, nested audience mini-card row',
    minHeight: 380,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace}
.plana-frag *{box-sizing:border-box}
.plana-mono{font-family:var(--ms-mono)}
.plana-eyebrow{font:500 10px/1.6 var(--ms-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text-subtle)}
.plana-chevron{flex:none;transition:transform 380ms cubic-bezier(.16,1,.3,1);color:var(--text-subtle)}
.plana-chevron.is-open{transform:rotate(180deg)}
.plana-acc{background:var(--card-bg);border:.5px solid var(--line);border-radius:8px;overflow:hidden}
.plana-acc-bar{width:100%;display:flex;align-items:center;gap:8px;padding:13px 20px;background:none;border:0;cursor:pointer;text-align:left;font-family:inherit}
.plana-acc-bar:hover{background:var(--hover-tint)}
.plana-acc-bar .plana-eyebrow{color:var(--text-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;min-width:0}
.plana-acc-body{display:flex;flex-direction:column;gap:24px;padding:0 24px 20px}
.plana-fields-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px 32px}
.plana-field{display:flex;flex-direction:column;gap:6px}
.plana-field-label{font-size:14px;font-weight:500;color:var(--text-subtle)}
.plana-field-value{font-size:14px;font-weight:400;color:var(--text-body)}
.plana-field-value.plana-accent-text{color:var(--accent)}
.plana-filechip{display:inline-flex;align-items:center;gap:8px;background:var(--panel-bg-3);border-radius:8px;padding:10px 14px;font-size:11px;font-weight:500;color:var(--text-body);width:fit-content}
.plana-filechip svg{flex:none;color:var(--text-subtle)}
.plana-aud-label{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-subtle)}
.plana-audcard{border:.5px solid var(--line);border-radius:8px;background:var(--panel-bg-3);overflow:hidden}
.plana-audcard-bar{width:100%;display:flex;align-items:flex-start;gap:16px;padding:16px;background:none;border:0;cursor:pointer;text-align:left;font-family:inherit}
.plana-audcard-photo{width:78px;height:78px;border-radius:6px;flex:none}
.plana-audcard-main{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:6px}
.plana-audcard-title-row{display:flex;align-items:center;gap:8px}
.plana-audcard-name{font-size:16px;font-weight:600;color:var(--text-body)}
.plana-aichip{display:inline-flex;align-items:center;gap:4px;background:var(--accent-soft);color:var(--accent);font-size:10px;font-weight:600;letter-spacing:.5px;padding:2px 8px;border-radius:12px}
.plana-audcard-blurb{font-size:13px;line-height:1.5;color:var(--text-subtle);max-width:560px}
.plana-audcard-stats{display:flex;gap:24px;flex:none;align-self:center}
.plana-audcard-stat{text-align:center}
.plana-audcard-stat b{display:block;font-size:18px;font-weight:400;color:var(--text-strong);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.plana-audcard-stat span{font:500 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle)}
</style>
<div class="plana-frag">
  <div class="plana-acc is-open" id="planaParamsAcc">
    <button type="button" class="plana-acc-bar" data-plana-toggle="acc" aria-expanded="true" aria-controls="planaParamsBody">
      <svg class="plana-chevron is-open" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="plana-eyebrow">Plan Parameters (7)</span>
    </button>
    <div class="plana-acc-body" id="planaParamsBody">
      <div class="plana-fields-grid">
        <div class="plana-field"><span class="plana-field-label">Budget</span><span class="plana-field-value">$18,000</span></div>
        <div class="plana-field"><span class="plana-field-label">Optimization KPI(s)</span><span class="plana-field-value plana-accent-text plana-mono">AWARENESS</span></div>
        <div class="plana-field"><span class="plana-field-label">Flight Window</span><span class="plana-field-value">01 MAR - 24 MAY 2026</span></div>
        <div class="plana-field"><span class="plana-field-label">Markets</span><span class="plana-field-value">US, EMEA</span></div>
        <div class="plana-field"><span class="plana-field-label">Frequency Target</span><span class="plana-field-value">3.4x</span></div>
        <div class="plana-field">
          <span class="plana-field-label">Brief</span>
          <span class="plana-filechip">
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true"><path d="M1.5 1.5h6.8L11.5 4.7v8.8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M8 1.5v3.5h3.5" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
            MarketBrief123.pdf
          </span>
        </div>
      </div>
      <span class="plana-aud-label">Audience</span>
      <div class="plana-audcard" id="planaAudCard">
        <button type="button" class="plana-audcard-bar" data-plana-toggle="audcard" aria-expanded="false" aria-controls="planaAudCardBody">
          <svg class="plana-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="plana-audcard-photo" style="background:var(--panel-bg-3)" title="[photo placeholder — assets/img/plan-audience-performance.png not extracted (not a top-level project image)]"></div>
          <div class="plana-audcard-main">
            <div class="plana-audcard-title-row">
              <span class="plana-audcard-name">Performance Enthusiasts</span>
              <span class="plana-aichip">✦ AI</span>
            </div>
            <p class="plana-audcard-blurb">High-income, brand-loyal drivers who prioritise performance credentials and prestige engineering. Primary consideration audience for Corvache model launches and loyalty campaigns.</p>
          </div>
          <div class="plana-audcard-stats">
            <div class="plana-audcard-stat"><b>2.1M</b><span>People</span></div>
            <div class="plana-audcard-stat"><b>889K</b><span>Households</span></div>
          </div>
        </button>
      </div>
    </div>
  </div>
</div>`
  },

  table_source: {
    note: '.audt-bib-table — Swiss "Source Inventory" bibliography table: numbered rows, link-styled source name, mono type column, relevance dot + tier',
    minHeight: 480,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace;--ms-chart-2:#7289ef;--ms-neg:#e0556b}
body.ms-app[data-theme="dark"]{--ms-chart-2:#5b7cfa;--ms-neg:#ff6b7a}
.audt-bib-h{font-family:var(--font-sans);font-weight:600;font-size:32px;line-height:1.2;letter-spacing:-.6px;color:var(--text-strong);margin:0 0 16px}
.audt-bib-summary{font-family:var(--font-sans);font-size:14px;line-height:1.6;font-weight:400;color:var(--text-body);margin:0 0 28px;max-width:860px}
.audt-bib-summary [data-countup]{color:var(--text-strong);font-weight:600}
.audt-bib-table-wrap{overflow-x:auto}
.audt-bib-table{width:100%;min-width:780px;border-collapse:collapse;font-family:var(--font-sans);font-variant-numeric:tabular-nums}
.audt-bib-table thead th{font-family:var(--ms-mono);font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle);text-align:left;padding:0 14px 10px 0;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:bottom}
.audt-bib-table thead th:last-child{padding-right:0}
.audt-bib-table tbody td{padding:12px 14px 12px 0;border-bottom:1px solid var(--line);font-size:12px;line-height:1.55;color:var(--text-body);vertical-align:top}
.audt-bib-table tbody td:last-child{padding-right:0}
.audt-bib-table tbody tr:last-child td{border-bottom:0}
.audt-bib-table tbody tr{transition:background 160ms ease}
.audt-bib-table tbody tr:hover{background:var(--hover-tint)}
.audt-bib-n{width:30px;font-family:var(--ms-mono);font-size:9px;color:var(--text-subtle);letter-spacing:.05em;font-variant-numeric:tabular-nums;white-space:nowrap;padding-top:14px!important}
.audt-bib-source{width:25%;min-width:200px}
.audt-bib-source a{color:var(--accent);text-decoration:none;background-image:linear-gradient(currentColor,currentColor);background-position:0 100%;background-repeat:no-repeat;background-size:100% 1px;padding-bottom:1px;transition:opacity 200ms ease}
.audt-bib-source a:hover{opacity:.72}
.audt-bib-tag{width:12%;min-width:100px;font-family:var(--ms-mono);font-size:9px;color:var(--text-subtle);white-space:nowrap;padding-top:14px!important}
.audt-bib-rel{width:12%;min-width:100px;padding-top:14px!important}
.audt-bib-rel-pip{display:inline-flex;align-items:center;gap:8px;font-family:var(--ms-mono);font-size:9px;color:var(--text-body);white-space:nowrap}
.audt-bib-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;display:inline-block}
.audt-bib-rel.critical{color:var(--ms-neg)}
.audt-bib-rel.high{color:var(--ms-chart-2)}
.audt-bib-rel.medium{color:var(--text-subtle)}
.audt-bib-rel.critical .audt-bib-rel-pip,.audt-bib-rel.high .audt-bib-rel-pip,.audt-bib-rel.medium .audt-bib-rel-pip{color:var(--text-body)}
.audt-bib-coverage{color:var(--text-subtle);font-size:12px;line-height:1.55}
</style>
<section class="audt-bib is-visible" data-reveal>
  <h2 class="audt-bib-h">Source Inventory</h2>
  <p class="audt-bib-summary"><span data-countup>10</span> sources gathered across syndicated panels, proprietary audience data, and AI-generated synthesis for the Sustainable Luxury Audiences session. Primary themes: audience sizing &amp; definitions, demographic &amp; psychographic profiling, media consumption indices, geographic distribution, and cross-audience comparison.</p>
  <div class="audt-bib-table-wrap">
    <table class="audt-bib-table" aria-label="Source inventory">
      <thead>
        <tr><th>#</th><th>Source</th><th>Type</th><th>Relevance</th><th>Key Coverage</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="audt-bib-n">01</td>
          <td class="audt-bib-source"><a href="#" onclick="return false;">Comscore</a></td>
          <td class="audt-bib-tag">Provider</td>
          <td class="audt-bib-rel critical"><span class="audt-bib-rel-pip"><span class="audt-bib-dot" data-build="pop"></span>Critical</span></td>
          <td class="audt-bib-coverage">Data-source chip on all three Audience list cards (Affluent Travelers, Eco-Conscious Millennials, Luxury on a Budget Travelers); underlies the Streaming Video rows in Media channel &amp; platform interests.</td>
        </tr>
        <tr>
          <td class="audt-bib-n">02</td>
          <td class="audt-bib-source"><a href="#" onclick="return false;">Acxiom</a></td>
          <td class="audt-bib-tag">Provider</td>
          <td class="audt-bib-rel critical"><span class="audt-bib-rel-pip"><span class="audt-bib-dot" data-build="pop"></span>Critical</span></td>
          <td class="audt-bib-coverage">Data-source chip and boolean definition-builder inputs on all three Audience list cards and both header cards in Audience Comparison.</td>
        </tr>
        <tr>
          <td class="audt-bib-n">03</td>
          <td class="audt-bib-source"><a href="#" onclick="return false;">Corvache Data</a></td>
          <td class="audt-bib-tag">Proprietary</td>
          <td class="audt-bib-rel critical"><span class="audt-bib-rel-pip"><span class="audt-bib-dot" data-build="pop"></span>Critical</span></td>
          <td class="audt-bib-coverage">People / Households totals (2.1M/889K &middot; 3.8M/850K &middot; 6.8M/1.3M), the Overlap matrix (34% / 19%), and both Overlap-per-channel Venn pairs.</td>
        </tr>
        <tr>
          <td class="audt-bib-n">04</td>
          <td class="audt-bib-source"><a href="#" onclick="return false;">MRI-Simmons 2024</a></td>
          <td class="audt-bib-tag">Syndicated Panel</td>
          <td class="audt-bib-rel critical"><span class="audt-bib-rel-pip"><span class="audt-bib-dot" data-build="pop"></span>Critical</span></td>
          <td class="audt-bib-coverage">Demographics bar groups (Gender, Marital, Education, Age, Household Income, Children), the stat tile row, and Top Media Platforms index bars.</td>
        </tr>
        <tr>
          <td class="audt-bib-n">05</td>
          <td class="audt-bib-source"><a href="#" onclick="return false;">Nielsen Audio</a></td>
          <td class="audt-bib-tag">Syndicated Panel</td>
          <td class="audt-bib-rel high"><span class="audt-bib-rel-pip"><span class="audt-bib-dot" data-build="pop"></span>High</span></td>
          <td class="audt-bib-coverage">Media Behaviors panel and the Streaming Audio column of Media channel &amp; platform interests.</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>`
  },

  chart_venn: {
    note: '.audc-venn-panel — two-circle audience-overlap Venn with leader-line labels + floating %-overlap callout badge',
    minHeight: 300,
    bodyClass: 'ms-app',
    html: `<style>
body.ms-app{--ms-mono:'Fira Code','JetBrains Mono',ui-monospace,monospace;--ms-chart-2:#7289ef}
body.ms-app[data-theme="dark"]{--ms-chart-2:#5b7cfa}
.audc-mod{--audc-a:var(--accent);--audc-b:var(--ms-chart-2);--audc-callout-bg:color-mix(in srgb, white 92%, var(--ms-chart-2) 8%);--audc-callout-ink:#14151a;margin-top:32px}
.audc-eyebrow{font:500 10px/1.6 var(--ms-mono);text-transform:uppercase;letter-spacing:.14em;color:var(--text-subtle);margin:0 0 16px;padding-bottom:12px}
.audc-venn-panel{background:var(--card-bg);border:none;border-radius:8px;padding:24px 24px 16px}
.audc-venn-row{display:flex;align-items:center;gap:32px;flex-wrap:wrap}
.audc-venn-wrap{display:flex;align-items:center;gap:16px;flex:1 1 460px}
.audc-venn-labelcol{display:flex;align-items:center;gap:10px;flex:1 1 60px;min-width:0}
.audc-venn-labelcol.audc-align-end{justify-content:flex-end}
.audc-venn-leader{flex:1 1 auto;height:1px;min-width:12px}
.audc-venn-leader.audc-leader-a{background:var(--audc-a)}
.audc-venn-leader.audc-leader-b{background:var(--audc-b)}
.audc-venn-label{font-size:14px;font-weight:600;color:var(--text-body);white-space:nowrap;flex:none}
.audc-venn-svgbox{position:relative;flex:none;width:240px;height:190px}
.audc-venn-svgbox svg{width:100%;height:100%;display:block;overflow:visible}
.audc-venn-stroke{stroke-width:2px;stroke-opacity:.9}
.audc-venn-stroke.audc-venn-a{fill:var(--audc-a);fill-opacity:.32;stroke:var(--audc-a)}
.audc-venn-stroke.audc-venn-b{fill:var(--audc-b);fill-opacity:.62;stroke:var(--audc-b)}
.audc-venn-badge{position:absolute;left:150px;top:-16px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--audc-callout-bg);border-radius:8px;padding:8px 14px 7px;text-align:center;box-shadow:0 6px 16px rgba(0,0,0,.28)}
.audc-venn-badge::after{content:'';position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);width:14px;height:8px;background:var(--audc-callout-bg);clip-path:polygon(0 0,100% 0,50% 100%)}
.audc-venn-badge-label{font-size:12px;font-weight:400;color:var(--audc-callout-ink);opacity:.7;line-height:1.3}
.audc-venn-badge-pct{font-size:16px;font-weight:400;color:var(--audc-callout-ink);line-height:1.2;font-variant-numeric:tabular-nums}
</style>
<section class="audc-mod is-visible" data-reveal>
  <p class="audc-eyebrow">Overall audience overlap</p>
  <div class="audc-venn-panel">
    <div class="audc-venn-row">
      <div class="audc-venn-wrap">
        <div class="audc-venn-labelcol">
          <span class="audc-venn-label">Affluent Travelers</span>
          <span class="audc-venn-leader audc-leader-a"></span>
        </div>
        <div class="audc-venn-svgbox">
          <svg viewBox="0 0 240 190" aria-hidden="true">
            <circle class="audc-venn-a audc-venn-stroke" cx="95" cy="95" r="82" data-build="pop"></circle>
            <circle class="audc-venn-b audc-venn-stroke" cx="142" cy="95" r="44" data-build="pop"></circle>
          </svg>
          <div class="audc-venn-badge">
            <span class="audc-venn-badge-label">Overlap</span>
            <span class="audc-venn-badge-pct" data-countup>82%</span>
          </div>
        </div>
        <div class="audc-venn-labelcol audc-align-end">
          <span class="audc-venn-leader audc-leader-b"></span>
          <span class="audc-venn-label">Eco-Conscious Millennials</span>
        </div>
      </div>
    </div>
  </div>
</section>`
  }
};
