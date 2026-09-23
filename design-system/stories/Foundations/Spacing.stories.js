/* Foundations / Spacing — the 4px-based space scale rendered as proportional
 * bars. Values read live off tokens.css. */

import { page, section, readVars, px } from './_fnd.js';

export default {
  title: 'Foundations/Spacing',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  .sp-list { display: grid; gap: 2px; }
  .sp-row { display: grid; grid-template-columns: 150px 64px 1fr; gap: 18px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--omni-rule-line); }
  .sp-row .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .sp-row .val { font: 11px var(--omni-font-family-mono); color: var(--omni-text-subhead); text-align: right; }
  .sp-bar { height: 16px; border-radius: 3px; background: var(--omni-accent-primary); min-width: 1px; }
`;

function build() {
  const tokens = readVars('space-').sort((a, b) => (px(a.value) || 0) - (px(b.value) || 0));
  return page({
    title: 'Spacing',
    sub: 'A 4px-based scale. space-6 (12px) is the most-used row/column gap; space-4 (8px) the most-used tight pair. Bars are drawn to scale.',
    css: CSS
  }, (body) => {
    const wrap = section(body, 'Space scale', tokens.length);
    const list = document.createElement('div'); list.className = 'sp-list';
    for (const t of tokens) {
      const n = t.key.replace('space-', '');
      const row = document.createElement('div'); row.className = 'sp-row';
      row.innerHTML = `
        <span class="tok">space-${n}</span>
        <span class="val">${t.value}</span>
        <div class="sp-bar" style="width:${px(t.value) || 0}px"></div>`;
      list.appendChild(row);
    }
    wrap.appendChild(list);
  });
}

export const AllSpacing = { name: 'Space scale', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
