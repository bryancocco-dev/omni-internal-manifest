/* Shared helpers for the Foundations token-reference stories.
 *
 * readVars() pulls live --omni-* values straight off the loaded stylesheet so
 * every page reflects whatever Style Dictionary last emitted (no hard-coded
 * lists to drift). page() gives each story the same themed chrome — page-bg +
 * text-body — so the Theme toolbar toggle (light omni-classic / dark oai)
 * reskins the foundations pages too, not just the components.
 */

const NONCOLOR = new Set(['font', 'space', 'radius', 'border', 'shadow', 'transition', 'z']);

/** Read every --omni-* custom property whose name (minus the prefix) satisfies
 *  `match` (string prefix | RegExp | predicate). Returns [{name,key,value}]. */
export function readVars(match) {
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
        if (!prop.startsWith('--omni-') || seen.has(prop)) continue;
        const key = prop.slice(7);
        const ok = typeof match === 'function' ? match(key)
                 : typeof match === 'string'   ? key.startsWith(match)
                 : match.test(key);
        if (!ok) continue;
        seen.add(prop);
        const value = root.getPropertyValue(prop).trim();
        if (value) out.push({ name: prop, key, value });
      }
    }
  }
  return out;
}

/** True when a token is a colour (used by Color.stories to exclude the
 *  typography/spacing/etc. tokens that now live in their own pages). */
export const isColorKey = (key) => !NONCOLOR.has(key.split('-')[0]);

export const TITLE_CASE = (s) =>
  s.split('-').map(w => (w[0] || '').toUpperCase() + w.slice(1)).join(' ');

/** px value as a number (NaN if not a px dimension). */
export const px = (v) => (/px$/.test(v) ? parseFloat(v) : NaN);

const SHELL_CSS = `
  .fnd { font-family: var(--omni-font-family-sans); background: var(--omni-page-bg); color: var(--omni-text-body); min-height: 100vh; padding: 44px 32px 72px; box-sizing: border-box; }
  .fnd * { box-sizing: border-box; }
  .fnd-head { max-width: 1120px; margin: 0 auto; }
  .fnd-eyebrow { font: 600 10px/1 var(--omni-font-family-mono); letter-spacing: .22em; text-transform: uppercase; color: var(--omni-text-subhead); }
  .fnd-title { font-size: 30px; letter-spacing: -.02em; font-weight: 700; color: var(--omni-text-body-high-contrast); margin: 12px 0 8px; }
  .fnd-sub { font-size: 14px; line-height: 1.55; color: var(--omni-text-subhead); max-width: 660px; margin: 0; }
  .fnd-body { max-width: 1120px; margin: 0 auto; }
  .fnd-section { margin-top: 40px; }
  .fnd-section > h2 { font: 600 11px/1 var(--omni-font-family-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--omni-text-subhead); margin: 0 0 18px; padding-top: 22px; border-top: 1px solid var(--omni-rule-line); display: flex; gap: 8px; align-items: baseline; }
  .fnd-section > h2 .count { color: var(--omni-text-subtle-01); font-weight: 500; }
  .fnd-var  { font: 10px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subtle-01); word-break: break-all; }
  .fnd-name { font-weight: 600; color: var(--omni-text-body); }
  .fnd-meta { font: 10px/1.4 var(--omni-font-family-mono); color: var(--omni-text-subhead); }
`;

/** Build a Foundations page with a consistent header + body container. */
export function page({ eyebrow = 'OMNI · Foundations', title, sub, css = '' }, buildBody) {
  const root = document.createElement('div');
  root.className = 'fnd';
  const style = document.createElement('style');
  style.textContent = SHELL_CSS + css;
  root.appendChild(style);

  const head = document.createElement('div');
  head.className = 'fnd-head';
  head.innerHTML = `<div class="fnd-eyebrow">${eyebrow}</div><h1 class="fnd-title">${title}</h1>${sub ? `<p class="fnd-sub">${sub}</p>` : ''}`;
  root.appendChild(head);

  const body = document.createElement('div');
  body.className = 'fnd-body';
  buildBody(body);
  root.appendChild(body);
  return root;
}

/** Append a titled section (with optional count) and return its content node. */
export function section(parent, label, count) {
  const sec = document.createElement('section');
  sec.className = 'fnd-section';
  sec.innerHTML = `<h2>${label}${count != null ? ` <span class="count">· ${count}</span>` : ''}</h2>`;
  const content = document.createElement('div');
  sec.appendChild(content);
  parent.appendChild(sec);
  return content;
}
