/* Foundations / Icons — the OMNI icon library: BOTH Boxicons sets so the
 * design team can browse everything.
 *   • Boxicons v3 (new) — redesigned set, basic pack, regular weight
 *     (cdn.boxicons.com). Rounded style + thin weight are Boxicons Pro (paid),
 *     so the free CDN ships regular/normal only.
 *   • Boxicons v2 (classic) — regular / solid / logos (jsdelivr).
 * v2 and v3 both use the `.bx` / `bx-*` class names and both ship a font named
 * "boxicons", so on one page they collide. We keep v2 native (jsdelivr <link>)
 * and NAMESPACE v3: every `bx` token in its CSS → `bx3` (catches the
 * `[class^="bx"]` base selectors too), font-face renamed to "bx3font", relative
 * font URLs made absolute. v3 icons render as `<i class="bx3 bx3-name">`; the
 * copied markup is always the real `<i class='bx bx-name'>`. Boxicons is
 * free/open-source (MIT). */

import { page } from './_fnd.js';

export default {
  title: 'Foundations/Icons',
  parameters: { layout: 'fullscreen' }
};

const V2_CSS = 'https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css';
const V3_CSS = 'https://cdn.boxicons.com/3.0.8/fonts/basic/boxicons.min.css';
const V3_BASE = 'https://cdn.boxicons.com/3.0.8/fonts/basic/';

const PAGE_CSS = `
  .ic-bar { position: sticky; top: 0; z-index: 5; background: var(--omni-page-bg); padding: 10px 0 14px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .ic-search { flex: 1 1 260px; max-width: 380px; box-sizing: border-box; font: 13px var(--omni-font-family-sans); padding: 10px 14px; border: 1px solid var(--omni-rule-line); border-radius: 8px; background: var(--omni-panel-bg); color: var(--omni-text-body); outline: none; }
  .ic-search:focus { border-color: var(--omni-accent-primary); box-shadow: var(--omni-shadow-focus-ring); }
  .ic-seg { display: inline-flex; border: 1px solid var(--omni-rule-line); border-radius: 8px; overflow: hidden; flex: 0 0 auto; }
  .ic-seg button { font: 600 10.5px/1 var(--omni-font-family-mono); letter-spacing: .08em; text-transform: uppercase; padding: 10px 15px; background: var(--omni-panel-bg); color: var(--omni-text-subhead); border: none; border-left: 1px solid var(--omni-rule-line); cursor: pointer; transition: background 120ms ease, color 120ms ease; }
  .ic-seg button:first-child { border-left: none; }
  .ic-seg button:hover { color: var(--omni-text-body); }
  .ic-seg button.on { background: var(--omni-accent-primary); color: var(--omni-text-button); }
  .ic-note { font: 11px/1.6 var(--omni-font-family-mono); color: var(--omni-text-subtle-01); padding: 16px 0; }
  .ic-sec { font: 600 11px/1 var(--omni-font-family-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--omni-text-subhead); margin: 26px 0 16px; padding-top: 22px; border-top: 1px solid var(--omni-rule-line); display: flex; gap: 8px; align-items: baseline; }
  .ic-sec:first-child { border-top: none; padding-top: 0; }
  .ic-sec .ct { color: var(--omni-text-subtle-01); font-weight: 500; }
  .ic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
  .ic-cell { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 16px 8px; border: 1px solid var(--omni-rule-line); border-radius: 8px; background: var(--omni-panel-bg); cursor: pointer; transition: border-color 140ms ease, transform 140ms ease; }
  .ic-cell:hover { border-color: var(--omni-accent-primary); transform: translateY(-1px); }
  .ic-cell i { font-size: 26px; line-height: 1; color: var(--omni-text-body); }
  .ic-cell .nm { font: 9.5px/1.3 var(--omni-font-family-mono); color: var(--omni-text-subhead); text-align: center; word-break: break-all; }
  .ic-cell.copied .nm { color: var(--omni-accent-primary); }
`;

const fetchCss = (href) => fetch(href).then(r => r.text());
const names = (css, re) => [...new Set([...css.matchAll(re)].map(m => m[1]))];

// inject the two stylesheets once: v2 native (<link>), v3 namespaced (<style>)
function ensureSets(v3raw) {
  if (!document.querySelector('link[data-bx2]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = V2_CSS; l.setAttribute('data-bx2', '');
    document.head.appendChild(l);
  }
  if (!document.querySelector('style[data-bx3]')) {
    const css = v3raw
      .replaceAll('bx', 'bx3')                                              // namespace selectors ("boxicons" has no "bx")
      .replace(/url\((["']?)\.\//g, (m, q) => 'url(' + q + V3_BASE)         // relative font URLs → absolute
      .replace(/font-family:\s*(["']?)boxicons\1/gi, (m, q) => 'font-family:' + q + 'bx3font' + q); // face decls only
    const s = document.createElement('style');
    s.setAttribute('data-bx3', ''); s.textContent = css;
    document.head.appendChild(s);
  }
}

function cell(realName, set) {
  const cls = set === 'v3' ? `bx3 ${realName.replace(/^bx-/, 'bx3-')}` : `bx ${realName}`;
  const markup = `<i class='bx ${realName}'></i>`;
  const el = document.createElement('div'); el.className = 'ic-cell'; el.title = markup;
  el.innerHTML = `<i class="${cls}" aria-hidden="true"></i><span class="nm">${realName}</span>`;
  el.addEventListener('click', () => {
    try { navigator.clipboard.writeText(markup); } catch (_) {}
    el.classList.add('copied');
    const nm = el.querySelector('.nm'); const orig = nm.textContent;
    nm.textContent = 'copied!';
    setTimeout(() => { nm.textContent = orig; el.classList.remove('copied'); }, 900);
  });
  return el;
}

function build() {
  return page({
    title: 'Icons',
    sub: 'The OMNI icon set — <a href="https://boxicons.com" target="_blank" rel="noopener" style="color:var(--omni-accent-primary)">Boxicons</a> (free, open-source), both libraries. <b>v3</b> is the new design (regular weight — the rounded / thin variant is Boxicons Pro); <b>v2</b> is the classic set. Click any icon to copy its markup.',
    css: PAGE_CSS
  }, (body) => {
    const bar = document.createElement('div'); bar.className = 'ic-bar';
    const input = document.createElement('input'); input.className = 'ic-search'; input.type = 'search'; input.placeholder = 'Filter icons…';
    const seg = document.createElement('div'); seg.className = 'ic-seg';
    seg.innerHTML = [['all', 'All'], ['v3', 'v3 · new'], ['v2', 'v2 · classic']]
      .map(([k, l], idx) => `<button data-set="${k}"${idx === 0 ? ' class="on"' : ''}>${l}</button>`).join('');
    bar.append(input, seg); body.appendChild(bar);

    const results = document.createElement('div'); body.appendChild(results);
    results.innerHTML = '<div class="ic-note">Loading both Boxicons sets…</div>';

    Promise.all([fetchCss(V3_CSS), fetchCss(V2_CSS)]).then(async ([v3raw, v2css]) => {
      ensureSets(v3raw);
      // wait for BOTH icon fonts before painting cells — otherwise the grid
      // renders with notdef boxes and won't repaint when the font arrives late.
      await Promise.all([
        document.fonts.load('16px bx3font').catch(() => {}),
        document.fonts.load('16px boxicons').catch(() => {})
      ]);
      const v3 = names(v3raw, /\.(bx-[a-z0-9-]+):+before\s*\{\s*content/gi);
      const v2 = names(v2css, /\.(bx[sl]?-[a-z0-9-]+):+before\s*\{\s*content/gi);
      const groups = [
        { label: 'Boxicons v3 · basic (regular)', set: 'v3', list: v3 },
        { label: 'Boxicons v2 · regular', set: 'v2', list: v2.filter(n => n.startsWith('bx-')) },
        { label: 'Boxicons v2 · solid', set: 'v2', list: v2.filter(n => n.startsWith('bxs-')) },
        { label: 'Boxicons v2 · logos', set: 'v2', list: v2.filter(n => n.startsWith('bxl-')) }
      ];

      let curSet = 'all';
      const render = () => {
        const q = input.value.trim().toLowerCase();
        results.innerHTML = '';
        let any = 0;
        for (const g of groups) {
          if (curSet !== 'all' && g.set !== curSet) continue;
          const f = q ? g.list.filter(n => n.includes(q)) : g.list;
          if (!f.length) continue;
          any += f.length;
          const h = document.createElement('div'); h.className = 'ic-sec';
          h.innerHTML = `${g.label} <span class="ct">· ${f.length}</span>`;
          const grid = document.createElement('div'); grid.className = 'ic-grid';
          for (const n of f) grid.appendChild(cell(n, g.set));
          results.append(h, grid);
        }
        if (!any) results.innerHTML = `<div class="ic-note">No icons match “${q || curSet}”.</div>`;
      };
      render();
      let t;
      input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 120); });
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-set]'); if (!b) return;
        curSet = b.dataset.set;
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        render();
      });
    }).catch(() => {
      results.innerHTML = '<div class="ic-note">Couldn’t reach the Boxicons CDNs. Check the connection and reload.</div>';
    });
  });
}

export const AllIcons = { name: 'All icons', render: () => build() };
export const LightTheme = { name: 'Light — omni-classic', render: () => { document.documentElement.setAttribute('data-theme', 'light'); return build(); } };
export const DarkTheme = { name: 'Dark — oai', render: () => { document.documentElement.setAttribute('data-theme', 'dark'); return build(); } };
