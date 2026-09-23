/* Foundations / Motion — transition durations and easing curves, each shown as
 * a looping demo so you can feel the speed and the curve. */

import { page, section, readVars } from './_fnd.js';

export default {
  title: 'Foundations/Motion',
  parameters: { layout: 'fullscreen' }
};

const CSS = `
  @keyframes mo-run { from { left: 0; } to { left: calc(100% - 16px); } }
  .mo-list { display: grid; gap: 4px; }
  .mo-row { display: grid; grid-template-columns: 230px 1fr; gap: 24px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--omni-rule-line); }
  .mo-meta .tok { font: 12px var(--omni-font-family-mono); color: var(--omni-text-body); font-weight: 600; }
  .mo-meta .val { font: 10px var(--omni-font-family-mono); color: var(--omni-text-subhead); display: block; margin-top: 3px; word-break: break-all; }
  .mo-track { position: relative; height: 16px; border-radius: 999px; background: var(--omni-panel-bg-04); }
  .mo-dot { position: absolute; top: 0; left: 0; width: 16px; height: 16px; border-radius: 50%; background: var(--omni-accent-primary); animation: mo-run var(--d, 1s) var(--e, ease) infinite alternate; }
`;

const DUR_ORDER = ['instant', 'fast', 'base', 'slow', 'slower'];
const EASE_ORDER = ['snap', 'smooth', 'bounce'];
const EASE_DESC = { snap: 'PRIMARY — springy', smooth: 'smooth deceleration', bounce: 'bouncier overshoot' };
const DUR_DESC = { instant: 'micro feedback', fast: 'default state change', base: 'button hover, tab switch', slow: 'drawer slide, panel expand', slower: 'reveal animations' };

function build() {
  const durs = readVars('transition-duration-')
    .sort((a, b) => DUR_ORDER.indexOf(a.key.replace('transition-duration-', '')) - DUR_ORDER.indexOf(b.key.replace('transition-duration-', '')));
  const eases = readVars('transition-easing-')
    .sort((a, b) => EASE_ORDER.indexOf(a.key.replace('transition-easing-', '')) - EASE_ORDER.indexOf(b.key.replace('transition-easing-', '')));

  return page({
    title: 'Motion',
    sub: 'Snap easing (cubic-bezier .22,1,.36,1) is the primary curve; 200ms (fast) is the canonical state-change duration. Each row loops so the timing is visible at a glance.',
    css: CSS
  }, (body) => {
    const dWrap = section(body, 'Duration', durs.length);
    const dl = document.createElement('div'); dl.className = 'mo-list';
    for (const d of durs) {
      const n = d.key.replace('transition-duration-', '');
      const row = document.createElement('div'); row.className = 'mo-row';
      row.innerHTML = `
        <div class="mo-meta"><span class="tok">${n}</span><span class="val">${d.value} · ${DUR_DESC[n] || ''}</span></div>
        <div class="mo-track"><span class="mo-dot" style="--d:${d.value}; --e:var(--omni-transition-easing-smooth)"></span></div>`;
      dl.appendChild(row);
    }
    dWrap.appendChild(dl);

    const eWrap = section(body, 'Easing', eases.length);
    const el = document.createElement('div'); el.className = 'mo-list';
    for (const e of eases) {
      const n = e.key.replace('transition-easing-', '');
      const row = document.createElement('div'); row.className = 'mo-row';
      row.innerHTML = `
        <div class="mo-meta"><span class="tok">${n}</span><span class="val">${e.value} · ${EASE_DESC[n] || ''}</span></div>
        <div class="mo-track"><span class="mo-dot" style="--d:1.4s; --e:var(${e.name})"></span></div>`;
      el.appendChild(row);
    }
    eWrap.appendChild(el);
  });
}

export const AllMotion = { name: 'Motion', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
