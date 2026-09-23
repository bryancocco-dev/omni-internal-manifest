/* Auto-renders swatches for every COLOUR --omni-* token in dist/tokens.css.
 * Reads computed values off :root + [data-theme="dark"] so it always reflects
 * whatever Style Dictionary just emitted. Non-colour tokens (typography,
 * spacing, radius, elevation, motion, layering) now live in their own
 * Foundations pages — see _fnd.js isColorKey(). */

import { isColorKey } from './_fnd.js';

export default {
  title: 'Foundations/Color',
  parameters: { layout: 'fullscreen' }
};

const swatchCSS = `
  .palette-wrap { font-family: var(--omni-font-family-sans); color: var(--omni-text-body, #394457); background: var(--omni-page-bg, #fff); min-height: 100vh; }
  .palette-section { padding: 20px 24px 4px; font: 600 11px/1 var(--omni-font-family-sans); letter-spacing: .12em; text-transform: uppercase; color: var(--omni-text-subhead, #8290ab); border-top: 1px solid var(--omni-rule-line, #d4d9e4); }
  .palette-section:first-of-type { border-top: none; padding-top: 32px; }
  .palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding: 12px 24px 24px; }
  .swatch { border: 1px solid var(--omni-rule-line, #d4d9e4); border-radius: 6px; overflow: hidden; background: var(--omni-panel-bg, #fff); display: flex; flex-direction: column; }
  .swatch-chip { height: 72px; background-image: linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%); background-size: 14px 14px; background-position: 0 0, 0 7px, 7px -7px, -7px 0; position: relative; }
  .swatch-chip::after { content:''; position:absolute; inset:0; background: var(--chip); }
  .swatch-body { padding: 10px 12px; font-size: 12px; }
  .swatch-name { font-weight: 600; color: var(--omni-text-body, #394457); margin-bottom: 2px; word-break: break-word; }
  .swatch-var  { font: 10px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subhead, #8290ab); word-break: break-all; margin-bottom: 4px; }
  .swatch-val  { font: 10px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subtle-01, #818ea6); text-transform: uppercase; }
`;

function readColorVars() {
  const root = getComputedStyle(document.documentElement);
  const out = [];
  const seen = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (_) { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      if (!rule.style) continue;
      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style[i];
        if (!prop.startsWith('--omni-')) continue;
        if (seen.has(prop)) continue;
        if (!isColorKey(prop.slice(7))) continue;   // colours only
        seen.add(prop);
        const val = root.getPropertyValue(prop).trim();
        if (val) out.push({ name: prop, value: val });
      }
    }
  }
  return out;
}

const TITLE_CASE = s => s.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const THEME_ORDER = ['page', 'overlay', 'panel', 'markdown', 'rule', 'icon', 'accent', 'text', 'user', 'nav', 'footer', 'brand', 'gradient', 'neutral', 'button'];
const PRIMITIVE_ORDER = ['neutral', 'brand', 'accent'];

function groupForVar(name) {
  const segs = name.replace('--omni-', '').split('-');
  if (segs[0] === 'primitive') {
    return { kind: 'Primitive', sub: segs[1], order: PRIMITIVE_ORDER.indexOf(segs[1]) };
  }
  const sub = segs[0];
  return { kind: 'Theme', sub, order: THEME_ORDER.indexOf(sub) };
}

function buildPalette() {
  const wrap = document.createElement('div');
  wrap.className = 'palette-wrap';
  const style = document.createElement('style');
  style.textContent = swatchCSS;
  wrap.appendChild(style);

  const all = readColorVars();
  const groups = new Map();
  for (const v of all) {
    const g = groupForVar(v.name);
    const key = `${g.kind} — ${TITLE_CASE(g.sub)}`;
    if (!groups.has(key)) groups.set(key, { order: g.kind === 'Primitive' ? g.order : 1000 + (g.order < 0 ? 999 : g.order), items: [] });
    groups.get(key).items.push(v);
  }

  const sorted = [...groups.entries()].sort((a, b) => a[1].order - b[1].order);

  for (const [label, { items }] of sorted) {
    const header = document.createElement('div');
    header.className = 'palette-section';
    header.textContent = `${label} · ${items.length}`;
    wrap.appendChild(header);
    const grid = document.createElement('div');
    grid.className = 'palette-grid';
    for (const { name, value } of items) {
      const card = document.createElement('div');
      card.className = 'swatch';
      const prettyName = name.replace('--omni-', '').replace(/-/g, ' ');
      card.innerHTML = `
        <div class="swatch-chip" style="--chip:${value}"></div>
        <div class="swatch-body">
          <div class="swatch-name">${prettyName}</div>
          <div class="swatch-var">${name}</div>
          <div class="swatch-val">${value}</div>
        </div>
      `;
      grid.appendChild(card);
    }
    wrap.appendChild(grid);
  }
  return wrap;
}

export const AllSwatches = {
  name: 'All swatches',
  render: () => buildPalette()
};

export const LightTheme = {
  name: 'Light — omni-classic',
  render: () => {
    document.documentElement.setAttribute('data-theme', 'light');
    return buildPalette();
  }
};

export const DarkTheme = {
  name: 'Dark — oai',
  render: () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    return buildPalette();
  }
};
