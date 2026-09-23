/*
 * Verbatim component extraction for the OMNI design-system catalog.
 *
 * Each story renders the REAL component from a source project — its exact
 * markup and its exact CSS, with no rewriting — inside an isolated <iframe>.
 * Because the iframe is its own document, the project's own :root / body
 * design tokens resolve natively and nothing bleeds in or out. The result is
 * pixel-identical to the component as it appears in the live project.
 *
 * A provenance strip above the frame records which project(s) ship this exact
 * component and any per-project notes, so duplicates across projects are
 * visible and comparable.
 */

// Per-project metadata: the verbatim CSS, the head <link>s (real font loading),
// and a display label. CSS/head are imported as raw strings by each project's
// story file and registered here via register().
const REGISTRY = {};

export function register(slug, { label, css, head }) {
  REGISTRY[slug] = { label: label || slug, css, head: head || '' };
  return slug;
}

/* ----------------------------------------------------------------------------
 * Archive / dedup — see _extract/curation.js for the manifest format.
 *
 * scripts/apply-curation.mjs comments out an archived entry's story export
 * (so Storybook's static index drops it from the sidebar) and replaces it
 * with a plain `registerArchived(project, type, snip)` call — NOT a named
 * export, so it's invisible to CSF's AST-based story discovery, but it still
 * runs at module-eval time (same as any other top-level statement in the
 * file), which is what makes the archived version's verbatim snippet data
 * available to the winning story's Archive drawer below, before that story
 * ever renders.
 * -------------------------------------------------------------------------- */
import { ARCHIVED } from './curation.js';

const ARCHIVED_SNIPPETS = {};

export function registerArchived(source, snipKey, snip) {
  ARCHIVED_SNIPPETS[`${source}/${String(snipKey).toLowerCase()}`] = snip;
  return snip;
}

// Reverse map: snippet OBJECT -> '<project>/<snippetKey>'. Populated by
// registerSnippets() (called from projects.js for every snippet module), so
// story() can identify EXACTLY which snippet a story renders — curation keys
// are snippet-key-granular ('media/chip_scopestatus'), and story-file types
// ('Chip') are too coarse: one file hosts many variants per project.
const SNIP_KEY_BY_OBJ = new Map();

export function registerSnippets(project, mod) {
  for (const [key, snip] of Object.entries(mod || {})) {
    if (snip && typeof snip === 'object') SNIP_KEY_BY_OBJ.set(snip, `${project}/${key}`.toLowerCase());
  }
}

// Entries in curation.js whose supersededBy names this exact snippet — i.e.
// this story is a winner with one or more archived duplicates. Returns null
// when there are none (the overwhelmingly common case).
function archivedFor(snipKey) {
  if (!snipKey) return null;
  const matches = Object.entries(ARCHIVED).filter(
    ([, v]) => v && String(v.supersededBy || '').toLowerCase() === snipKey
  );
  return matches.length ? matches.map(([key, v]) => ({ key, reason: v.reason || '' })) : null;
}

// Shared "muted / outline" chip style — the non-primary provenance chip in
// the strip below, and the archived-project chip in the Archive drawer.
const CHIP_MUTED_CSS =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-weight:600;font-size:11px;' +
  'background:var(--omni-panel-bg,#fff);color:var(--omni-text-body,#1b1d21);border:1px solid var(--omni-rule-line,#e2e4ea);';
const CHIP_PRIMARY_CSS =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-weight:600;font-size:11px;' +
  'background:var(--omni-accent-primary,#1858ee);color:var(--omni-text-button,#fff);';

/* ----------------------------------------------------------------------------
 * Copy affordances — "Copy code" (verbatim snippet HTML) and "Copy for Claude"
 * (a fill-in-the-blanks prompt pointing at this catalog's public CSS + a
 * standalone reference copy of the component, so a fresh Claude session can
 * restyle the pasted markup with OMNI tokens). Shared by the control row in
 * extracted() and by each archived item's header row in buildArchiveDrawer().
 * -------------------------------------------------------------------------- */
const COPY_BTN_CSS =
  'appearance:none;cursor:pointer;padding:4px 11px;font:600 11px Inter,system-ui,sans-serif;' +
  'color:var(--omni-text-subhead,#6b6d7a);background:var(--omni-panel-bg,#fff);' +
  'border:1px solid var(--omni-rule-line,#e2e4ea);border-radius:7px;white-space:nowrap;';
const COPY_BTN_SMALL_CSS =
  'appearance:none;cursor:pointer;padding:2px 8px;font:600 10px Inter,system-ui,sans-serif;' +
  'color:var(--omni-text-subhead,#6b6d7a);background:var(--omni-panel-bg,#fff);' +
  'border:1px solid var(--omni-rule-line,#e2e4ea);border-radius:6px;white-space:nowrap;opacity:.85;';

// Hidden-textarea + execCommand fallback for browsers/contexts where the async
// Clipboard API is unavailable or denied (e.g. no clipboard permission grant).
// Never throws — worst case it silently returns false.
function fallbackCopyText(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;width:1px;height:1px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (e) {}
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
}

// Always resolves (never rejects) with a boolean — so callers never need a
// .catch and nothing ever throws to the console.
function copyText(text) {
  return new Promise((resolve) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => resolve(true),
          () => resolve(fallbackCopyText(text))
        );
        return;
      }
    } catch (e) { /* fall through to fallback */ }
    resolve(fallbackCopyText(text));
  });
}

// The "Copy for Claude" prompt template. <project>/<key> point at this
// catalog's public CSS + a standalone reference copy of the exact snippet.
function claudeCopyTemplate(project, key, html) {
  return 'Add this OMNI component to my project — reuse the markup below verbatim as the structure, then ' +
    'restyle it with the OMNI design tokens (var(--omni-*); workflow: https://omni-system-hazel.vercel.app/CLAUDE.md). ' +
    "The component's original CSS is https://omni-system-hazel.vercel.app/library/" + project + '.css ' +
    'and a standalone reference copy lives at https://omni-system-hazel.vercel.app/components/' + project + '--' + key + '.html' +
    '\n\n' + html;
}

function mkCopyButton(label, small) {
  const css = small ? COPY_BTN_SMALL_CSS : COPY_BTN_CSS;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = css;
  b.__copyLabel = label;
  b.__copyBaseCss = css;
  return b;
}

// Flip a copy button's label to "Copied ✓" (styled like the active
// Component/In-context segment) for ~1.5s, then restore it exactly.
function flashCopied(btn) {
  clearTimeout(btn.__copiedTimer);
  btn.textContent = 'Copied ✓';
  btn.style.cssText = btn.__copyBaseCss +
    'background:var(--omni-accent-primary,#1858ee);color:var(--omni-text-button,#fff);border-color:var(--omni-accent-primary,#1858ee);';
  btn.__copiedTimer = setTimeout(() => {
    btn.style.cssText = btn.__copyBaseCss;
    btn.textContent = btn.__copyLabel;
  }, 1500);
}

// Wire a copy button: getText() is called lazily on click (so it can read
// current closure state), copied via copyText(), and only flips the label on
// a confirmed successful copy.
function wireCopyButton(btn, getText) {
  btn.addEventListener('click', () => {
    let text = '';
    try { text = getText() || ''; } catch (e) { text = ''; }
    copyText(text).then((ok) => { if (ok) flashCopied(btn); });
  });
}

const LABELS = {
  'agents-store': 'Agents Store',
  'chat-hat': 'Chat Hat',
  'persona-subnav': 'Persona',
  'omni-agent-builder': 'Agent Builder',
  'media': 'Media',
  'gawdtable': 'Gawdtable',
  'lease-campaign-brief-handoff': 'Brief',
  'themes': 'Themes',
  'canvas-qa': 'QA',
  'publish-to-workspace': 'Publish',
  'copy-request-access': 'Access',
  'translations': 'Translations',
  'switching-canvas': 'Switching',
  'canvas-share-demos': 'Share Demos',
  'admin': 'Admin',
  'canvas-book-ends': 'Book Ends',
  'canvas-collab': 'Collab',
  'canvas-exports': 'Exports',
  'canvas-pdf-tables': 'PDF Tables',
  'media-skills': 'Media Skills',
  'canvas-workflows': 'Workflows',
  'gateway-v2': 'Gateway',
  'canvas-graphics': 'Graphics',
  'copy-agent': 'Copy Agent',
  'omni-manifest': 'Manifest'
};

export const labelFor = (slug) => REGISTRY[slug]?.label || LABELS[slug] || slug;

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Many components in the source projects ship a hidden baseline (opacity:0 +
// a small transform) and are revealed at runtime by JS/scroll handlers that
// never fire inside the static catalog frame. After the frame settles, force
// any still-hidden reveal-staged element to its on-screen state — but only
// elements that are animated/transitioned (so intentional translucency is left
// alone). This reproduces the component as it looks once settled in the app.
const REVEAL_SCRIPT =
  '<script>(function(){' +
  'function r(skipAnimated){var e=document.querySelectorAll("*");' +
  'for(var i=0;i<e.length;i++){var el=e[i],cs=getComputedStyle(el);' +
  'if(cs.opacity!=="0")continue;' +
  // Leave popovers / tooltips / dropdowns / overlays in their hidden resting
  // state — those are interaction-gated, not entrance reveals (Tier 2).
  'var p=cs.position;if(p==="absolute"||p==="fixed"||p==="sticky")continue;' +
  'var an=cs.animationName||"none",tp=cs.transitionProperty||"";' +
  // First pass settles only static reveals; animated entrances play first.
  'if(skipAnimated&&an!=="none")continue;' +
  'if(an!=="none"||/opacity|transform|all/.test(tp)){el.style.setProperty("opacity","1","important");}}}' +
  'function go(){requestAnimationFrame(function(){r(true);setTimeout(function(){r(false);},750);});}' +
  'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",go);}else{go();}})();<\/script>';

/* ----------------------------------------------------------------------------
 * In-context locator.
 *
 * The "In context" toggle swaps the snippet iframe for the project's REAL page
 * (served same-origin from /_assets/<slug>/index.html), then finds the same
 * element the snippet was lifted from and wraps it in a green hairline.
 *
 * We derive a selector by parsing ONLY the snippet root's opening tag, preferring
 * stable hooks (id > aria-label > data-* > class/role) and deliberately ignoring
 * the inline style="" the extractor injected to force resting state — those
 * styles don't exist in the live page. A snippet may override via ctx:{ sel }.
 * -------------------------------------------------------------------------- */
function selForEl(el) {
  if (!el || el.nodeType !== 1) return null;
  const tag = el.tagName.toLowerCase();
  const esc = (s) => s.replace(/(["\\])/g, '\\$1');
  const id = el.getAttribute('id');
  if (id) return '#' + esc(id);
  const aria = el.getAttribute('aria-label');
  if (aria) return tag + '[aria-label="' + esc(aria) + '"]';
  const data = Array.from(el.attributes).filter((a) => /^data-/.test(a.name)).slice(0, 2);
  if (data.length) return tag + data.map((a) => (a.value !== '' ? '[' + a.name + '="' + esc(a.value) + '"]' : '[' + a.name + ']')).join('');
  const cls = el.getAttribute('class');
  if (cls) {
    // drop interaction-state classes the live element won't carry at rest
    const STATE = /^(is-active|in-view|active|open|show|visible|confirmed|up|down|selected)$/;
    const classes = cls.split(/\s+/).filter(Boolean).filter((c) => !STATE.test(c)).slice(0, 3);
    if (classes.length) return tag + '.' + classes.map(esc).join('.');
  }
  const role = el.getAttribute('role');
  if (role) return tag + '[role="' + esc(role) + '"]';
  return null; // only inline styles / no stable hook on this element
}

function rootSelector(html) {
  if (!html) return null;
  let root;
  try { const c = document.createElement('div'); c.innerHTML = html; root = c.firstElementChild; }
  catch (e) { return null; }
  if (!root) return null;
  // Prefer the snippet root's own hook. Snippets frequently wrap the real
  // component in a bespoke inline-styled layout div (to give it height/centring
  // in the catalog) which carries no stable hook — in that case descend to the
  // first descendant that does, so e.g. a grid wrapper resolves to its `.side-rail`.
  const direct = selForEl(root);
  if (direct) return direct;
  const kids = root.querySelectorAll('*');
  for (let i = 0; i < kids.length; i++) { const s = selForEl(kids[i]); if (s) return s; }
  return null;
}

function textKey(html) {
  try { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140); }
  catch (e) { return ''; }
}

// The snippet root was captured WITH its interaction-open state (e.g. a modal's
// `.open`, an active tab's `.active`). The live element sits at rest without
// those, so re-applying them lets the project's OWN css render the authentic
// open/active appearance — far better than brute-forcing display/position.
function rootClasses(html) {
  if (!html) return [];
  const m = html.match(/^\s*<[a-zA-Z][\w-]*([^>]*)>/);
  if (!m) return [];
  const c = /class\s*=\s*"([^"]*)"/i.exec(m[1]);
  return c ? c[1].split(/\s+/).filter(Boolean) : [];
}

// Pick the best of several candidates: prefer a visible one whose text best
// overlaps the snippet's text (disambiguates a non-unique selector).
function pickMatch(nodes, key, win) {
  if (!nodes.length) return null;
  if (nodes.length === 1) return nodes[0];
  let best = nodes[0], bestScore = -Infinity;
  for (const n of nodes) {
    const cs = win.getComputedStyle(n);
    const vis = (n.offsetWidth > 0 || n.offsetHeight > 0) && cs.visibility !== 'hidden';
    const t = (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    let i = 0; while (i < key.length && i < t.length && key[i] === t[i]) i++;
    const score = i + (vis ? 60 : 0);
    if (score > bestScore) { bestScore = score; best = n; }
  }
  return best;
}

// Draw a green hairline frame + "Used here" label OVER the located element,
// force-revealing it (and its ancestors) first if it's interaction-gated and
// hidden at rest, then scroll it to centre. The marker is a fixed overlay
// (never clipped by the element's own overflow) kept pinned as the live page
// scrolls. Returns true if the component had to be revealed from a hidden state.
function highlightTarget(win, doc, el, stateClasses) {
  if (stateClasses && stateClasses.length) {
    stateClasses.forEach((c) => { if (!el.classList.contains(c)) el.classList.add(c); });
  }
  const hidden = !(el.offsetWidth > 0 || el.offsetHeight > 0);
  let p = el;
  for (let i = 0; i < 6 && p && p !== doc.body; i++) {
    const cs = win.getComputedStyle(p);
    if (cs.display === 'none') p.style.setProperty('display', 'block', 'important');
    if (cs.visibility === 'hidden') p.style.setProperty('visibility', 'visible', 'important');
    if (parseFloat(cs.opacity) === 0) p.style.setProperty('opacity', '1', 'important');
    p = p.parentElement;
  }

  let ov = doc.getElementById('__omni_ctx_overlay');
  if (!ov) {
    ov = doc.createElement('div');
    ov.id = '__omni_ctx_overlay';
    ov.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;box-sizing:border-box;' +
      'border:2px solid #16b364;border-radius:5px;' +
      'box-shadow:0 0 0 4px rgba(22,179,100,.20),0 0 18px 3px rgba(22,179,100,.42);' +
      'transition:left .18s ease,top .18s ease,width .18s ease,height .18s ease;';
    const lab = doc.createElement('div');
    lab.id = '__omni_ctx_label';
    lab.textContent = 'Used here';
    lab.style.cssText = 'position:absolute;left:-2px;background:#16b364;color:#fff;' +
      'font:600 10px/1.7 Inter,system-ui,sans-serif;letter-spacing:.04em;padding:0 7px;' +
      'border-radius:4px;white-space:nowrap;';
    ov.appendChild(lab);
    doc.body.appendChild(ov);
  }
  const lab = ov.firstChild;
  const place = () => {
    if (win.innerWidth === 0) return; // iframe mid-(re)layout — don't pin to a collapsed box
    const r = el.getBoundingClientRect();
    if (!(r.width || r.height)) { ov.style.display = 'none'; return; }
    ov.style.display = 'block';
    ov.style.left = r.left + 'px';
    ov.style.top = r.top + 'px';
    ov.style.width = r.width + 'px';
    ov.style.height = r.height + 'px';
    lab.style.top = r.top < 24 ? '2px' : '-20px'; // keep label on-screen near page top
  };
  place();
  const center = () => { if (win.innerWidth === 0) return; try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {} place(); };
  center();
  // Heavy source pages (React hydration, lazy-loaded media, late reflow) keep
  // resizing for a while — a flex top-nav lays out narrow, then jumps to full
  // width well after a fixed timeout would have stopped watching. Re-pin on a
  // poll until the target's box holds still for ~1s, capped at 9s, so the
  // overlay tracks the component instead of freezing on a mid-layout transient.
  let lastKey = '', stable = 0;
  const settle = win.setInterval(() => {
    if (win.innerWidth === 0) { stable = 0; return; }
    const r = el.getBoundingClientRect();
    const k = Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + ',' + Math.round(r.height);
    if (k !== lastKey) { lastKey = k; stable = 0; place(); }
    else if (++stable > 6) win.clearInterval(settle);
  }, 160);
  win.setTimeout(() => win.clearInterval(settle), 9000);
  [150, 400, 800, 1300].forEach((t) => win.setTimeout(center, t));
  try { const ro = new win.ResizeObserver(place); ro.observe(el); ro.observe(doc.documentElement); ro.observe(doc.body); win.setTimeout(() => ro.disconnect(), 9000); } catch (e) {}

  if (win.__omniCtxPlace) {
    win.removeEventListener('scroll', win.__omniCtxPlace, true);
    win.removeEventListener('resize', win.__omniCtxPlace);
  }
  win.__omniCtxPlace = place;
  win.addEventListener('scroll', place, true);
  win.addEventListener('resize', place);
  return hidden;
}

/*
 * Render an extracted component.
 *
 *   source   – slug of the project the CSS/markup is lifted from (drives styling)
 *   usedIn   – array of slugs that ship this exact component (provenance chips);
 *              defaults to [source]
 *   note     – optional per-variant note shown in the provenance strip
 *   html     – the verbatim markup snippet
 *   minHeight– iframe min height before content measures (px)
 *   bg       – body background inside the frame (defaults to the project --pg-bg)
 *   pad      – body padding inside the frame
 *   archived – [{ key, reason }] of curation.js entries this story supersedes
 *              (set automatically by story()/storiesFor(); not passed by hand)
 *   snipKey  – '<project>/<key>' for this exact snippet, from SNIP_KEY_BY_OBJ
 *              (set automatically by story()/storiesFor(); drives "Copy for
 *              Claude"'s <project>/<key> URLs; not passed by hand)
 */
export function extracted({ source, usedIn, note, html, minHeight = 96, bg, pad = '28px', bodyClass = '', width = 1280, js = '', ctx = null, archived = null, snipKey = null }) {
  const meta = REGISTRY[source];
  if (!meta) {
    const err = document.createElement('pre');
    err.textContent = `extracted(): project "${source}" not registered — call register() in its story file first.`;
    err.style.cssText = 'color:#b00;font:13px monospace;padding:16px';
    return err;
  }
  const chips = (usedIn && usedIn.length ? usedIn : [source]);
  const theme = currentTheme();

  const wrap = document.createElement('div');
  // width:100% (not shrink-to-fit) so the iframe's width:100% can't enter a
  // circular layout that collapses the frame to ~2px while a heavy source page
  // loads in context mode — which would strand the highlight on a 0-width frame.
  wrap.style.cssText = 'font-family:Inter,system-ui,sans-serif;width:100%;max-width:' + width + 'px;';

  // ---- provenance strip (lives in the catalog DOM, not the iframe) ----
  const strip = document.createElement('div');
  strip.style.cssText =
    'display:flex;align-items:center;gap:8px;flex-wrap:wrap;' +
    'padding:8px 12px;margin-bottom:0;border:1px solid var(--omni-rule-line,#e2e4ea);' +
    'border-bottom:0;border-radius:8px 8px 0 0;background:var(--omni-panel-bg-02,#f6f7f9);' +
    'font:12px Inter,system-ui,sans-serif;color:var(--omni-text-subhead,#6b6d7a);';
  const usedLabel = document.createElement('span');
  usedLabel.textContent = 'Used in';
  usedLabel.style.cssText = 'text-transform:uppercase;letter-spacing:.1em;font-weight:600;font-size:10px;';
  strip.appendChild(usedLabel);
  chips.forEach((slug) => {
    const chip = document.createElement('span');
    chip.textContent = labelFor(slug);
    const primary = slug === source;
    chip.style.cssText = primary ? CHIP_PRIMARY_CSS : CHIP_MUTED_CSS;
    strip.appendChild(chip);
  });
  if (note) {
    const n = document.createElement('span');
    n.textContent = note;
    n.style.cssText = 'margin-left:auto;font-style:italic;opacity:.8;';
    strip.appendChild(n);
  }

  // ---- isolated iframe with the project's real CSS + verbatim markup ----
  const hasArchive = !!(archived && archived.length);
  const frame = document.createElement('iframe');
  frame.setAttribute('title', `${labelFor(source)} — extracted component`);
  frame.style.cssText =
    'width:100%;border:1px solid var(--omni-rule-line,#e2e4ea);' +
    // When an Archive drawer follows, the frame hands the bottom-rounding +
    // bottom border off to the drawer's collapsed summary row, so the two
    // read as one continuous card with a single hairline between them —
    // same technique the strip above already uses against this frame's top.
    (hasArchive ? 'border-bottom:0;border-radius:0;' : 'border-radius:0 0 8px 8px;') +
    `display:block;background:transparent;min-height:${minHeight}px;`;
  const background = bg || 'var(--pg-bg, var(--bg-canvas, #fff))';
  // <base> so the project's relative asset URLs (omni-logo.png, gfx-*.svg, …)
  // resolve to the copies under public/_assets/<slug>/.
  const base = '<base href="' + location.origin + '/_assets/' + source + '/">';
  const doc =
    '<!doctype html><html data-theme="' + theme + '"><head><meta charset="utf-8">' +
    base +
    meta.head +
    '<style>' + meta.css + '</style>' +
    // Neutralise the project's full-page layout (height:100%/100vh, overflow:hidden,
    // display:grid on body/.app) so the extracted fragment flows and measures.
    '<style>html,body{height:auto!important;min-height:0!important;max-height:none!important;' +
    'overflow:visible!important;display:block!important;margin:0}' +
    'body{padding:' + pad + ';background:' + background + ';box-sizing:border-box}' +
    // Let the project's real CSS transitions + keyframe animations run as authored
    // (hover/focus/checked motion, spinners, pulses, entrance reveals). Only kill
    // smooth-scroll (no value in a static frame) and force ScrollReveal's hidden
    // [data-sr] baseline visible since its JS never runs here.
    '*{scroll-behavior:auto!important}' +
    '[data-sr]{opacity:1!important;transform:none!important;filter:none!important}</style>' +
    // Tier 3: optional per-snippet bespoke script runs last (after the generic
    // reveal) to reproduce JS-generated content the static frame never builds
    // itself — e.g. the celebration starfield, count-up meters, typewriters.
    '</head><body class="' + bodyClass + '" data-theme="' + theme + '">' + html + REVEAL_SCRIPT +
    (js ? '<script>' + js + '<\/script>' : '') + '</body></html>';
  frame.srcdoc = doc;

  // ---- mode toggle (Component vs In context) — additive, leaves strip intact ----
  // In context the frame shows the WHOLE source page, so it should use the full
  // available width (drop the component-mode max-width cap) and as much viewport
  // height as remains below the control row — not a fixed 620px letterbox.
  const ctxHeightPx = () => {
    let top = 0;
    try { top = frame.getBoundingClientRect().top; } catch (e) {}
    return Math.max(560, Math.round((window.innerHeight || 900) - top - 16));
  };
  const selector = (ctx && ctx.sel) || rootSelector(html);
  const key = textKey(html);
  const stateClasses = (ctx && ctx.reveal === false) ? [] : rootClasses(html);

  const controlRow = document.createElement('div');
  controlRow.style.cssText =
    'display:flex;align-items:center;gap:10px;padding:6px 12px;' +
    'border-top:1px solid var(--omni-rule-line,#e2e4ea);' +
    'border-left:1px solid var(--omni-rule-line,#e2e4ea);border-right:1px solid var(--omni-rule-line,#e2e4ea);' +
    'background:var(--omni-panel-bg-02,#f6f7f9);font:12px Inter,system-ui,sans-serif;color:var(--omni-text-subhead,#6b6d7a);';
  const status = document.createElement('span');
  status.style.cssText = 'font-size:11px;opacity:.9;';
  const seg = document.createElement('div');
  seg.style.cssText = 'display:inline-flex;border:1px solid var(--omni-rule-line,#e2e4ea);border-radius:7px;overflow:hidden;background:var(--omni-panel-bg,#fff);';
  const mkBtn = (label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.style.cssText = 'appearance:none;border:0;background:transparent;cursor:pointer;padding:4px 11px;font:600 11px Inter,system-ui,sans-serif;color:var(--omni-text-subhead,#6b6d7a);';
    return b;
  };
  const btnComp = mkBtn('Component');
  const btnCtx = mkBtn('In context');
  seg.appendChild(btnComp); seg.appendChild(btnCtx);

  // ---- copy affordances, grouped with the toggle on the right ----
  const actions = document.createElement('div');
  actions.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:8px;';
  const btnCopyCode = mkCopyButton('Copy code');
  const btnCopyClaude = mkCopyButton('Copy for Claude');
  wireCopyButton(btnCopyCode, () => html);
  wireCopyButton(btnCopyClaude, () => {
    let snipKeyRest = '';
    if (snipKey) {
      const idx = snipKey.indexOf('/');
      snipKeyRest = idx >= 0 ? snipKey.slice(idx + 1) : snipKey;
    }
    return claudeCopyTemplate(source, snipKeyRest, html);
  });
  actions.appendChild(btnCopyCode);
  actions.appendChild(btnCopyClaude);
  actions.appendChild(seg);
  controlRow.appendChild(status); controlRow.appendChild(actions);

  let mode = 'component';
  const paint = () => {
    btnComp.style.background = mode === 'component' ? 'var(--omni-accent-primary,#1858ee)' : 'transparent';
    btnComp.style.color = mode === 'component' ? 'var(--omni-text-button,#fff)' : 'var(--omni-text-subhead,#6b6d7a)';
    btnCtx.style.background = mode === 'context' ? 'var(--omni-accent-primary,#1858ee)' : 'transparent';
    btnCtx.style.color = mode === 'context' ? 'var(--omni-text-button,#fff)' : 'var(--omni-text-subhead,#6b6d7a)';
  };

  const resize = () => {
    try {
      const b = frame.contentDocument && frame.contentDocument.body;
      if (b) frame.style.height = Math.max(minHeight, b.scrollHeight) + 'px';
    } catch (e) {/* cross-origin guard, srcdoc is same-origin so fine */}
  };

  const locateInContext = () => {
    let tries = 0;
    const tick = () => {
      if (mode !== 'context') return;
      let win, docx;
      try { win = frame.contentWindow; docx = frame.contentDocument; }
      catch (e) { status.textContent = 'Source page is cross-origin — cannot locate.'; return; }
      if (!docx || !docx.body) { if (tries++ < 40) setTimeout(tick, 120); return; }
      let el = null;
      if (selector) { try { el = pickMatch(Array.from(docx.querySelectorAll(selector)), key, win); } catch (e) { el = null; } }
      if (el) {
        const wasHidden = highlightTarget(win, docx, el, stateClasses);
        status.textContent = wasHidden ? '● Highlighted in source — revealed from its resting (hidden) state' : '● Highlighted in its real page location';
        status.style.color = '#16b364';
      } else if (tries++ < 40) {
        setTimeout(tick, 120);
      } else {
        status.textContent = selector ? 'Showing source page — couldn’t auto-locate this component' : 'Showing source page — no stable anchor to highlight';
        status.style.color = 'var(--omni-text-subhead,#6b6d7a)';
      }
    };
    tick();
  };

  frame.addEventListener('load', () => {
    if (mode === 'component') { resize(); setTimeout(resize, 250); setTimeout(resize, 800); }
    else { locateInContext(); }
  });

  const toComponent = () => {
    mode = 'component'; paint();
    status.textContent = ''; status.style.color = 'var(--omni-text-subhead,#6b6d7a)';
    wrap.style.maxWidth = width + 'px';
    frame.style.height = minHeight + 'px';
    frame.removeAttribute('src');
    frame.srcdoc = doc;
  };
  const toContext = () => {
    mode = 'context'; paint();
    status.textContent = 'Loading source page…'; status.style.color = 'var(--omni-text-subhead,#6b6d7a)';
    wrap.style.maxWidth = 'none';
    frame.style.height = ctxHeightPx() + 'px';
    frame.removeAttribute('srcdoc');
    frame.src = location.origin + '/_assets/' + source + '/index.html';
  };
  btnComp.addEventListener('click', () => { if (mode !== 'component') toComponent(); });
  btnCtx.addEventListener('click', () => { if (mode !== 'context') toContext(); });
  // Keep the context frame filling the viewport as the window resizes; self-cleans
  // once this story's frame is detached (Storybook swapped in another story).
  const onResize = () => {
    if (!frame.isConnected) { window.removeEventListener('resize', onResize); return; }
    if (mode === 'context') frame.style.height = ctxHeightPx() + 'px';
  };
  window.addEventListener('resize', onResize);
  paint();

  wrap.appendChild(strip);
  wrap.appendChild(controlRow);
  wrap.appendChild(frame);
  if (hasArchive) wrap.appendChild(buildArchiveDrawer(archived, source));
  return wrap;
}

/*
 * Collapsed-by-default "Archive — N deprecated version(s)" drawer, appended
 * below a winning story's frame when curation.js has one or more entries
 * whose supersededBy names this exact project/type. Expanding it lazily
 * renders each archived version through the SAME extracted() pipeline used
 * above (own source project -> own CSS/assets via its own <base>), each
 * preceded by a small header: the archived project's chip, the reason, and
 * who it was superseded by.
 */
function buildArchiveDrawer(entries, winnerSource) {
  const n = entries.length;
  const box = document.createElement('div');
  box.style.cssText = 'width:100%;';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.style.cssText =
    'display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;text-align:left;cursor:pointer;' +
    'appearance:none;margin:0;padding:8px 12px;' +
    'border:1px solid var(--omni-rule-line,#e2e4ea);border-radius:0 0 8px 8px;' +
    'background:var(--omni-panel-bg-02,#f6f7f9);font:600 12px Inter,system-ui,sans-serif;color:var(--omni-text-subhead,#6b6d7a);';

  const chev = document.createElement('span');
  chev.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  chev.style.cssText = 'display:inline-flex;flex:0 0 auto;transition:transform .15s ease;';

  const label = document.createElement('span');
  label.textContent = `Archive — ${n} deprecated version${n === 1 ? '' : 's'}`;

  toggleBtn.appendChild(chev);
  toggleBtn.appendChild(label);

  const content = document.createElement('div');
  content.style.cssText =
    'display:none;border:1px solid var(--omni-rule-line,#e2e4ea);border-top:0;border-radius:0 0 8px 8px;' +
    'overflow:hidden;background:var(--omni-panel-bg,#fff);';

  let built = false;
  const build = () => {
    if (built) return;
    built = true;
    entries.forEach(({ key, reason }, idx) => {
      const archivedSource = key.split('/')[0];
      const snip = ARCHIVED_SNIPPETS[key];

      const head = document.createElement('div');
      head.style.cssText =
        'display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;' +
        (idx > 0 ? 'border-top:1px solid var(--omni-rule-line,#e2e4ea);' : '') +
        'background:var(--omni-panel-bg-02,#f6f7f9);font:12px Inter,system-ui,sans-serif;color:var(--omni-text-subhead,#6b6d7a);';

      const chip = document.createElement('span');
      chip.textContent = labelFor(archivedSource);
      chip.style.cssText = CHIP_MUTED_CSS;
      head.appendChild(chip);

      if (reason) {
        const reasonEl = document.createElement('span');
        reasonEl.textContent = reason;
        reasonEl.style.cssText = 'font-style:italic;opacity:.85;';
        head.appendChild(reasonEl);
      }

      if (snip) {
        const miniActions = document.createElement('div');
        miniActions.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const miniCode = mkCopyButton('Copy code', true);
        const miniClaude = mkCopyButton('Copy for Claude', true);
        wireCopyButton(miniCode, () => snip.html);
        wireCopyButton(miniClaude, () => {
          const miniKey = key.length > archivedSource.length ? key.slice(archivedSource.length + 1) : '';
          return claudeCopyTemplate(archivedSource, miniKey, snip.html);
        });
        miniActions.appendChild(miniCode);
        miniActions.appendChild(miniClaude);
        head.appendChild(miniActions);
      }

      const supersededEl = document.createElement('span');
      supersededEl.textContent = `superseded by ${labelFor(winnerSource)}`;
      supersededEl.style.cssText =
        'margin-left:auto;text-transform:uppercase;letter-spacing:.06em;font-weight:600;font-size:10px;' +
        'opacity:.75;white-space:nowrap;';
      head.appendChild(supersededEl);

      const body = document.createElement('div');
      body.style.cssText = 'padding:10px 12px 12px;';
      if (snip) {
        const usedIn = archivedSource === 'media' ? ['media', 'gawdtable'] : [archivedSource];
        body.appendChild(extracted({ source: archivedSource, usedIn, ...snip, snipKey: key }));
      } else {
        const warn = document.createElement('div');
        warn.textContent = `Archived snippet not found for "${key}" — run scripts/apply-curation.mjs.`;
        warn.style.cssText = 'font:12px Inter,system-ui,sans-serif;color:#b00;';
        body.appendChild(warn);
      }

      content.appendChild(head);
      content.appendChild(body);
    });
  };

  let open = false;
  toggleBtn.addEventListener('click', () => {
    open = !open;
    build();
    content.style.display = open ? 'block' : 'none';
    toggleBtn.setAttribute('aria-expanded', String(open));
    chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    toggleBtn.style.borderRadius = open ? '0' : '0 0 8px 8px';
    toggleBtn.style.borderBottom = open ? '0' : '1px solid var(--omni-rule-line,#e2e4ea)';
  });

  box.appendChild(toggleBtn);
  box.appendChild(content);
  return box;
}

// Human descriptor per component TYPE (keyed by the story-title segment, e.g.
// title 'Components/TopNav' -> 'TopNav'). Used to enrich the auto sidebar name
// so a base export reads "Agents Store — global top-nav bar" rather than just
// the project label. Variant exports pass their own opts.name and skip this.
const TYPE_DESC = {
  TopNav: 'global top-nav bar',
  Tabs: 'canvas / content tabs',
  SideRail: 'vertical side rail',
  NavList: 'rail navigation list',
  Buttons: 'buttons',
  SectionHeader: 'section header',
  Cards: 'content card',
  Chip: 'chip / pill',
  Toggle: 'toggle switch',
  Input: 'input field',
  Dropdown: 'dropdown selector',
  Menu: 'popover menu',
  Avatar: 'avatar / presence stack',
  Table: 'data table',
  Modal: 'modal dialog',
  Toast: 'toast notification',
  Banner: 'banner notice',
  EmptyState: 'empty state',
  StatusRing: 'fidelity meter',
  ChatMessage: 'chat message bubble',
  PanelSwitch: 'panel switcher',
  ChapterNav: 'chapter pager',
  Lightbox: 'edit-mode lightbox',
  Footer: 'page footer',
  Hero: 'hero / cover board',
  BrandBadge: 'OMNI+ brand badge',
  Celebration: 'celebration overlay',
  Segmented: 'segmented control',
  Blockquote: 'pull-quote',
  Callout: 'callout',
  Progress: 'progress bar',
  KeyValue: 'key / value facts',
  Markdown: 'markdown body',
  NumberedList: 'numbered list',
  OptionCard: 'option card',
  EditToolbar: 'edit toolbar',
  PersonaSubnav: 'persona sub-navigation bar',
  Drawer: 'right-edge drawer panel',
  Editor: 'code / JSON editor panel',
  Collab: 'audience collaboration affordance',
  Lookbook: 'style picker lookbook',
  Sheet: 'printed-page export mockup',
  Ladder: 'wide-table fit ladder',
  Reply: 'drafted stakeholder reply',
  Stats: 'metric / stat tile',
  Venn: 'audience-overlap diagram',
  StrategyCards: 'strategy comparison card',
  DoDont: "do / don't comparison",
  Charts: 'analytics chart',
  Comments: 'inline comment thread',
  Interstitial: 'full-canvas transition cover',
  Receipt: 'action receipt',
  Accordion: 'collapsible accordion'
};

export const descFor = (type) => TYPE_DESC[type] || '';

/*
 * Thin factory for a type-grouped story export. `snip` is one entry from a
 * project's snippets/<slug>.js module ({ note, minHeight, pad, html }).
 * media and gawdtable are byte-identical clones, so a media source defaults to
 * dual provenance unless usedIn is overridden. `opts.type` (the story-title
 * segment) drives the descriptive sidebar name; an explicit opts.name wins.
 */
export function story(source, snip, opts = {}) {
  const usedIn = opts.usedIn || (source === 'media' ? ['media', 'gawdtable'] : [source]);
  let name = opts.name;
  if (!name) {
    const desc = opts.type ? descFor(opts.type) : '';
    name = desc ? `${labelFor(source)} — ${desc}` : labelFor(source);
  }
  const snipKey = snip ? SNIP_KEY_BY_OBJ.get(snip) : null;
  const archived = archivedFor(snipKey);
  return { name, render: () => extracted({ source, usedIn, ...(snip || {}), archived, snipKey }) };
}

// Bind a component TYPE so each story file declares its descriptor once:
//   const s = storiesFor('TopNav');
//   export const AgentsStore = s('agents-store', as.topnav);
export function storiesFor(type) {
  return (source, snip, opts = {}) => story(source, snip, { type, ...opts });
}
