/* Foundations / Typography — renders live samples for every font-* token:
 * families, weights, the size ramp, line-heights, and letter-spacing. Values
 * read off the emitted tokens.css so the page never drifts from the source. */

import { page, section, readVars, px } from './_fnd.js';

export default {
  title: 'Foundations/Typography',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  .ty-fam { display: grid; gap: 14px; }
  .ty-fam .row { border: 1px solid var(--omni-rule-line); border-radius: 8px; background: var(--omni-panel-bg); padding: 18px 20px; }
  .ty-fam .label { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .ty-fam .label .name { font: 600 12px var(--omni-font-family-mono); color: var(--omni-text-body); text-transform: capitalize; }
  .ty-fam .label .var  { font: 10px var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .ty-fam .sample { font-size: 26px; color: var(--omni-text-body-high-contrast); line-height: 1.2; }
  .ty-fam .stack  { font: 10px/1.5 var(--omni-font-family-mono); color: var(--omni-text-subtle-01); margin-top: 8px; word-break: break-all; }

  .ty-weights { display: grid; gap: 2px; }
  .ty-weights .row { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: baseline; padding: 12px 0; border-bottom: 1px solid var(--omni-rule-line); }
  .ty-weights .meta { font: 11px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .ty-weights .meta b { color: var(--omni-text-body); font-weight: 600; }
  .ty-weights .sample { font-size: 22px; color: var(--omni-text-body-high-contrast); }

  .ty-sizes { display: grid; gap: 2px; }
  .ty-sizes .row { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--omni-rule-line); }
  .ty-sizes .meta { font: 11px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subhead); }
  .ty-sizes .meta b { color: var(--omni-text-body); font-weight: 600; }
  .ty-sizes .meta .desc { display: block; color: var(--omni-text-subtle-01); margin-top: 2px; text-transform: none; letter-spacing: 0; }
  .ty-sizes .sample { color: var(--omni-text-body-high-contrast); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .ty-blocks { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .ty-block { border: 1px solid var(--omni-rule-line); border-radius: 8px; background: var(--omni-panel-bg); padding: 16px 18px; }
  .ty-block .meta { font: 11px var(--omni-font-family-mono); color: var(--omni-text-subhead); margin-bottom: 8px; }
  .ty-block .meta b { color: var(--omni-text-body); font-weight: 600; }
  .ty-block p { margin: 0; font-size: 14px; color: var(--omni-text-body); }
  .ty-block .ls { font-size: 15px; color: var(--omni-text-body-high-contrast); }
`;

const FAMILY_SAMPLE = 'The quick brown fox jumps';
const PARA = 'Precision marketing built on a shared design language — every surface drawn from the same OMNI token set.';

const sortBySize = arr => [...arr].sort((a, b) => (px(a.value) || 0) - (px(b.value) || 0));

function build() {
  return page({
    title: 'Typography',
    sub: 'Inter for UI, Fira Code for mono, Instrument Serif for display. One size ramp, five weights, and the line-height / letter-spacing scales that drive every text style.',
    css: CSS
  }, (body) => {
    // ── Families ──
    const fams = readVars('font-family-');
    const famWrap = section(body, 'Type families', fams.length);
    const fg = document.createElement('div'); fg.className = 'ty-fam';
    for (const f of fams) {
      const which = f.key.replace('font-family-', '');
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `
        <div class="label"><span class="name">${which}</span><span class="var">${f.name}</span></div>
        <div class="sample" style="font-family: var(${f.name})">${FAMILY_SAMPLE}</div>
        <div class="stack">${f.value}</div>`;
      fg.appendChild(row);
    }
    famWrap.appendChild(fg);

    // ── Weights ──
    const weights = readVars('font-weight-');
    const wWrap = section(body, 'Weights', weights.length);
    const wg = document.createElement('div'); wg.className = 'ty-weights';
    for (const w of [...weights].sort((a, b) => (+a.value) - (+b.value))) {
      const name = w.key.replace('font-weight-', '');
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `
        <div class="meta"><b>${name}</b> · ${w.value}</div>
        <div class="sample" style="font-weight:${w.value}">${FAMILY_SAMPLE}</div>`;
      wg.appendChild(row);
    }
    wWrap.appendChild(wg);

    // ── Sizes ──
    const sizes = sortBySize(readVars('font-size-'));
    const sWrap = section(body, 'Size ramp', sizes.length);
    const sg = document.createElement('div'); sg.className = 'ty-sizes';
    for (const s of sizes) {
      const name = s.key.replace('font-size-', '').replace('-', '.');
      const desc = s.desc ? `<span class="desc">${s.desc}</span>` : '';
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `
        <div class="meta"><b>size-${name}</b> · ${s.value}${desc}</div>
        <div class="sample" style="font-size:${s.value}">Aa — the quick brown fox</div>`;
      sg.appendChild(row);
    }
    sWrap.appendChild(sg);

    // ── Line height ──
    const lhs = readVars('font-line-height-');
    const lhWrap = section(body, 'Line height', lhs.length);
    const lg = document.createElement('div'); lg.className = 'ty-blocks';
    for (const lh of [...lhs].sort((a, b) => (+a.value) - (+b.value))) {
      const name = lh.key.replace('font-line-height-', '');
      const b = document.createElement('div'); b.className = 'ty-block';
      b.innerHTML = `<div class="meta"><b>${name}</b> · ${lh.value}</div><p style="line-height:${lh.value}">${PARA}</p>`;
      lg.appendChild(b);
    }
    lhWrap.appendChild(lg);

    // ── Letter spacing ──
    const lss = readVars('font-letter-spacing-');
    const lsWrap = section(body, 'Letter spacing', lss.length);
    const lsg = document.createElement('div'); lsg.className = 'ty-blocks';
    for (const ls of lss) {
      const name = ls.key.replace('font-letter-spacing-', '');
      const b = document.createElement('div'); b.className = 'ty-block';
      b.innerHTML = `<div class="meta"><b>${name}</b> · ${ls.value}</div><div class="ls" style="letter-spacing:${ls.value}">Navigation Label</div>`;
      lsg.appendChild(b);
    }
    lsWrap.appendChild(lsg);
  });
}

export const AllType = { name: 'Type scale', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
