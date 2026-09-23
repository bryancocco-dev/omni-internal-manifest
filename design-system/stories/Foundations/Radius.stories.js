/* Foundations / Radius & Borders — corner-radius tokens as rounded tiles, and
 * the border-width scale as ruled samples. Both are the "shape" primitives. */

import { page, section, readVars, px } from './_fnd.js';

export default {
  title: 'Foundations/Radius & Borders',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  .rd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; }
  .rd-cell { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .rd-chip { width: 100%; height: 96px; background: var(--omni-accent-primary); }
  .rd-chip.circle { width: 96px; }
  .rd-meta { text-align: center; }
  .rd-meta .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .rd-meta .val { font: 10px var(--omni-font-family-mono); color: var(--omni-text-subhead); display: block; margin-top: 2px; }

  .bd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  .bd-cell { border: 1px solid var(--omni-rule-line); border-radius: 8px; background: var(--omni-panel-bg); padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .bd-sample { height: 0; border-top-style: solid; border-top-color: var(--omni-text-body); }
  .bd-meta .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .bd-meta .val { font: 10px var(--omni-font-family-mono); color: var(--omni-text-subhead); margin-left: 6px; }
`;

const RADIUS_ORDER = ['micro', 'small', 'medium', 'large', 'xlarge', 'pill', 'circle'];
const BORDER_ORDER = ['hairline', 'thin', 'medium', 'thick'];
const ord = (arr, prefix) => (a, b) =>
  arr.indexOf(a.key.replace(prefix, '')) - arr.indexOf(b.key.replace(prefix, ''));

function build() {
  const radii = readVars('radius-').sort(ord(RADIUS_ORDER, 'radius-'));
  const borders = readVars('border-width-').sort(ord(BORDER_ORDER, 'border-width-'));
  return page({
    title: 'Radius & Borders',
    sub: 'Corner radii from micro (4px) to pill / circle, and the border-width scale — the live system’s default divider is the 0.5px hairline, not 1px.',
    css: CSS
  }, (body) => {
    const rWrap = section(body, 'Corner radius', radii.length);
    const rg = document.createElement('div'); rg.className = 'rd-grid';
    for (const r of radii) {
      const n = r.key.replace('radius-', '');
      const cell = document.createElement('div'); cell.className = 'rd-cell';
      const radius = n === 'circle' ? '50%' : r.value;
      cell.innerHTML = `
        <div class="rd-chip ${n === 'circle' ? 'circle' : ''}" style="border-radius:${radius}"></div>
        <div class="rd-meta"><span class="tok">${n}</span><span class="val">${r.value}</span></div>`;
      rg.appendChild(cell);
    }
    rWrap.appendChild(rg);

    const bWrap = section(body, 'Border width', borders.length);
    const bg = document.createElement('div'); bg.className = 'bd-grid';
    for (const b of borders) {
      const n = b.key.replace('border-width-', '');
      const cell = document.createElement('div'); cell.className = 'bd-cell';
      cell.innerHTML = `
        <div class="bd-meta"><span class="tok">${n}</span><span class="val">${b.value}</span></div>
        <div class="bd-sample" style="border-top-width:${b.value}"></div>`;
      bg.appendChild(cell);
    }
    bWrap.appendChild(bg);
  });
}

export const AllRadius = { name: 'Radius & borders', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
