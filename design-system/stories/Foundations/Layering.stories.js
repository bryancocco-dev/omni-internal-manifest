/* Foundations / Layering — the z-index scale, lowest → highest, with an
 * overlapping stack so the ordering reads visually. */

import { page, section, readVars } from './_fnd.js';

export default {
  title: 'Foundations/Layering',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  .lz-list { display: grid; gap: 2px; max-width: 560px; }
  .lz-row { display: grid; grid-template-columns: 160px 90px 1fr; gap: 16px; align-items: baseline; padding: 11px 0; border-bottom: 1px solid var(--omni-rule-line); }
  .lz-row .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .lz-row .val { font: 12px var(--omni-font-family-mono); color: var(--omni-accent-primary); text-align: right; }
  .lz-row .desc { font: 11px var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .lz-stack { position: relative; height: 230px; margin-top: 8px; }
  .lz-card { position: absolute; width: 210px; border-radius: 10px; padding: 14px 16px; border: 1px solid var(--omni-rule-line); background: var(--omni-panel-bg); box-shadow: var(--omni-shadow-elevation-2); }
  .lz-card .tok { font: 11px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .lz-card .val { font: 10px var(--omni-font-family-mono); color: var(--omni-text-subhead); margin-top: 2px; }
`;

const ORDER = ['base', 'tooltip', 'dropdown', 'toast', 'modal', 'critical', 'chrome'];
const DESC = { base: 'default flow', tooltip: 'hover tips', dropdown: 'menus, selects', toast: 'transient toasts', modal: 'dialogs, drawers', critical: 'blocking alerts', chrome: 'app chrome / cursor' };

function build() {
  const tokens = readVars('z-')
    .sort((a, b) => ORDER.indexOf(a.key.replace('z-', '')) - ORDER.indexOf(b.key.replace('z-', '')));

  return page({
    title: 'Layering',
    sub: 'The z-index scale that keeps overlays predictable: tooltip 15 → dropdown 60 → toast 95 → modal 120 → critical 1000 → chrome 5000.',
    css: CSS
  }, (body) => {
    const wrap = section(body, 'Z-index scale', tokens.length);
    const list = document.createElement('div'); list.className = 'lz-list';
    for (const t of tokens) {
      const n = t.key.replace('z-', '');
      const row = document.createElement('div'); row.className = 'lz-row';
      row.innerHTML = `<span class="tok">z-${n}</span><span class="val">${t.value}</span><span class="desc">${DESC[n] || ''}</span>`;
      list.appendChild(row);
    }
    wrap.appendChild(list);

    const sWrap = section(body, 'Stacking order', null);
    const stack = document.createElement('div'); stack.className = 'lz-stack';
    tokens.forEach((t, i) => {
      const n = t.key.replace('z-', '');
      const card = document.createElement('div'); card.className = 'lz-card';
      card.style.left = `${i * 30}px`;
      card.style.top = `${i * 26}px`;
      card.style.zIndex = String(i + 1);
      card.innerHTML = `<div class="tok">z-${n}</div><div class="val">${t.value}</div>`;
      stack.appendChild(card);
    });
    sWrap.appendChild(stack);
  });
}

export const AllLayering = { name: 'Layering', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
