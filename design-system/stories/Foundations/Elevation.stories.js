/* Foundations / Elevation — the four shadow elevation tiers shown on lifted
 * cards, plus the focus-ring token on a sample control. */

import { page, section, readVars } from './_fnd.js';

export default {
  title: 'Foundations/Elevation',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  .el-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 28px; padding: 8px 0 20px; }
  .el-card { background: var(--omni-panel-bg); border: 1px solid var(--omni-rule-line); border-radius: 10px; padding: 20px; min-height: 120px; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; }
  .el-card .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .el-card .desc { font: 11px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .el-focus-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .el-input { background: var(--omni-panel-bg); border: 1px solid var(--omni-accent-primary); border-radius: 6px; padding: 10px 14px; font: 13px var(--omni-font-family-sans); color: var(--omni-text-body); min-width: 220px; }
  .el-focus-meta { font: 11px var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .el-focus-meta b { color: var(--omni-text-body); font-weight: 600; }
`;

const DESCS = {
  'elevation-1': 'subtle hover surfaces',
  'elevation-2': 'interactive — buttons, dropdowns',
  'elevation-3': 'branded card lift',
  'elevation-4': 'modal / critical overlay'
};
const ELEV_ORDER = ['elevation-1', 'elevation-2', 'elevation-3', 'elevation-4'];

function build() {
  const all = readVars('shadow-');
  const elevs = all.filter(t => /elevation-/.test(t.key))
    .sort((a, b) => ELEV_ORDER.indexOf(a.key.replace('shadow-', '')) - ELEV_ORDER.indexOf(b.key.replace('shadow-', '')));
  const focus = all.find(t => /focus-ring/.test(t.key));

  return page({
    title: 'Elevation',
    sub: 'Four multi-shadow elevation tiers — elevation-2 is the canonical interactive / dropdown shadow. The focus-ring sits at 22% accent alpha.',
    css: CSS
  }, (body) => {
    const wrap = section(body, 'Shadow elevation', elevs.length);
    const grid = document.createElement('div'); grid.className = 'el-grid';
    for (const e of elevs) {
      const n = e.key.replace('shadow-', '');
      const card = document.createElement('div'); card.className = 'el-card';
      card.style.boxShadow = `var(${e.name})`;
      card.innerHTML = `<span class="tok">${n}</span><span class="desc">${DESCS[n] || ''}</span>`;
      grid.appendChild(card);
    }
    wrap.appendChild(grid);

    if (focus) {
      const fWrap = section(body, 'Focus ring', 1);
      const row = document.createElement('div'); row.className = 'el-focus-row';
      const input = document.createElement('div');
      input.className = 'el-input';
      input.style.boxShadow = `var(${focus.name})`;
      input.textContent = 'Focused input';
      const meta = document.createElement('div');
      meta.className = 'el-focus-meta';
      meta.innerHTML = `<b>focus-ring</b> · ${focus.value}`;
      row.appendChild(input); row.appendChild(meta);
      fWrap.appendChild(row);
    }
  });
}

export const AllElevation = { name: 'Elevation', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
