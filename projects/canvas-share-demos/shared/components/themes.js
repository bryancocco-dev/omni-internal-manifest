/**
 * Theme layer + Themes picker.
 *
 * A theme is a real token set, not a label: it rewrites the document's --doc-*
 * semantics (surfaces, ink, rule, accent, display face) on <body>, so a switch
 * cascades through EVERY surface at once — access gate, nav, headings, links,
 * chart + table accents, footer, back-cover signature.
 *
 * Architecture (adapted from /TINKER/themes/index.html, mapped onto this
 * project's --doc-* layer, which wins on any style conflict):
 *   - body[data-theme]        → 'light' | 'dark' base (drives existing rules)
 *   - body[data-brand]        → theme id, for brand-specific hooks
 *   - inline --doc-* vars     → the palette itself (outranks :root + [data-theme])
 *
 * Every palette MUST carry the same keys (TOKEN_KEYS) — otherwise clearing one
 * theme leaks vars into the next. That invariant is enforced in applyTheme().
 */

const STORE_KEY = 'canvas-share:theme';
/* Resolved against THIS MODULE, not the page — consumers live at different
   depths (doc pages, the inbox) and a page-relative path 404s off-depth. */
const LOGO_BASE = new URL('../assets/brand-logos/', import.meta.url).href;
/* Per-brand 4k hero backgrounds (shared/assets/brand-heroes/<id>.jpg) —
   workspace themes swap the cover image; Corvache has NO entry here because
   the doc's own render IS its hero. */
const HERO_BASE = new URL('../assets/brand-heroes/', import.meta.url).href;
/* Brand WORDMARKS (shared/assets/brand-wordmarks/<id>.svg) — the brands' real
   logotype artwork (Wikimedia-sourced, viewBox-cropped to the letterforms).
   Rendered as alpha MASKS everywhere a brand name used to be live text, so
   they take the surrounding text color. `ar` = artwork aspect ratio (drives
   width), `scale` = per-brand optical height factor (a 14:1 PORSCHE reads
   bigger than a 2.4:1 NIKE at equal height, so long marks run shorter).
   Corvache has NO wordmark — its name set in Inter IS its wordmark. */
const WM_BASE = new URL('../assets/brand-wordmarks/', import.meta.url).href;
const BRAND_HEROES = ['bmw', 'porsche', 'apple', 'hermes', 'rollsroyce', 'spotify', 'airbnb', 'ikea', 'nike'];

/* The exact token set every palette controls. Same keys, every theme. */
const TOKEN_KEYS = [
  '--doc-page-bg', '--doc-paper-bg', '--doc-nested-bg',
  '--doc-ink', '--doc-ink-strong', '--doc-ink-subtle',
  '--doc-rule', '--doc-accent', '--doc-font-display',
  '--doc-display-tracking', '--doc-heading-tracking',
];

/**
 * Display tracking per face. The document's -2.2px cover / -0.6px heading
 * tracking is tuned to Inter's tight display metrics — pushing that onto a
 * Bodoni or a condensed Oswald crushes them. Infer a sane pair from the stack
 * so a theme's type lands composed rather than mangled.
 * @returns {[string, string]} [cover tracking, heading tracking]
 */
function trackingFor(t) {
  if (t.tracking) return t.tracking;
  const s = (t.fontStack || '').toLowerCase();
  if (/oswald/.test(s)) return ['0px', '0px'];            // already condensed
  if (/nunito/.test(s)) return ['-1.2px', '-0.35px'];
  if (/dm sans|manrope/.test(s)) return ['-1.7px', '-0.45px'];
  // Named display serifs ONLY. Never test bare /serif/ — every sans stack ends
  // in "sans-serif" and would false-positive into the serif tracking.
  if (/bodoni|cormorant|garamond|didot/.test(s)) return ['-0.4px', '-0.15px'];
  return ['-2.2px', '-0.6px']; // Inter metrics
}

const INTER = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Default group — the OMNI base. No palette: these CLEAR to :root /
   [data-theme='dark'], which is the real OMNI system. ───────────────────── */
const DEFAULTS = [
  { id: 'light', name: 'Omni Light', base: 'light', accent: '#1858ee', icon: 'sun' },
  { id: 'dark', name: 'Omni Dark', base: 'dark', accent: '#0de0e1', icon: 'moon' },
];

/* ── Workspace themes — real palettes. CORVACHE leads: it's this doc's brand.
   CORVACHE has no prior visual identity (verified across /TINKER/corvache),
   so this palette is authored from its established fiction: a quiet electric
   grand tourer — restrained carbon/graphite, bone ink, one sharp filament
   accent ("The Current"), coachbuilt rather than loud. ──────────────────── */
const WORKSPACE = [
  {
    id: 'corvache', name: 'Corvache', base: 'dark', accent: '#E3B23C', logo: 'corvache.svg',
    font: 'Inter:wght@400;500;600;700;800', fontStack: INTER,
    // The one genuinely established CORVACHE typographic gesture: its masthead
    // carries Figma display tracking of -1.92px (see /TINKER/corvache).
    tracking: ['-1.92px', '-0.6px'],
    palette: {
      '--doc-page-bg': '#0d0e10', '--doc-paper-bg': '#141619', '--doc-nested-bg': '#1a1d21',
      '--doc-ink': '#c9ccd2', '--doc-ink-strong': '#f2efe9', '--doc-ink-subtle': '#7d818b',
      '--doc-rule': '#262a30', '--doc-accent': '#E3B23C', '--doc-font-display': INTER,
    },
  },
  {
    id: 'bmw', name: 'BMW', base: 'light', accent: '#1C69D4', logo: 'bmw.svg', wordmark: 'bmw.svg', wmAr: 3.036, wmScale: 0.85,
    font: 'DM+Sans:wght@400;500;600;700', fontStack: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    palette: {
      '--doc-page-bg': '#F0F1F3', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#EAECEF',
      '--doc-ink': '#262626', '--doc-ink-strong': '#000000', '--doc-ink-subtle': '#666666',
      '--doc-rule': '#E5E7EA', '--doc-accent': '#1C69D4',
      '--doc-font-display': '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    },
  },
  {
    id: 'porsche', name: 'Porsche', base: 'light', accent: '#D5001C', logo: 'porsche.svg', wordmark: 'porsche.svg', wmAr: 14.556, wmScale: 0.65,
    font: 'Manrope:wght@400;500;700;800', fontStack: '"Manrope", "Helvetica Neue", Arial, sans-serif',
    palette: {
      '--doc-page-bg': '#F1F1F1', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#E8E8E8',
      '--doc-ink': '#252525', '--doc-ink-strong': '#010205', '--doc-ink-subtle': '#626669',
      '--doc-rule': '#DFDFDF', '--doc-accent': '#D5001C',
      '--doc-font-display': '"Manrope", "Helvetica Neue", Arial, sans-serif',
    },
  },
  {
    id: 'apple', name: 'Apple', base: 'light', accent: '#0071E3', logo: 'apple.svg', wordmark: 'apple.svg', wmAr: 2.77, wmScale: 1.0,
    font: '', fontStack: INTER,
    palette: {
      '--doc-page-bg': '#F5F5F7', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#EDEDF0',
      '--doc-ink': '#1D1D1F', '--doc-ink-strong': '#000000', '--doc-ink-subtle': '#6E6E73',
      '--doc-rule': '#E3E3E6', '--doc-accent': '#0071E3', '--doc-font-display': INTER,
    },
  },
  {
    id: 'hermes', name: 'Hermès', base: 'light', accent: '#FF6900', logo: 'hermes.svg', wordmark: 'hermes.svg', wmAr: 5.684, wmScale: 0.8,
    font: 'Cormorant+Garamond:wght@400;500;600;700', fontStack: '"Cormorant Garamond", Georgia, serif',
    palette: {
      '--doc-page-bg': '#FAF6F0', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#F3EDE3',
      '--doc-ink': '#2B2622', '--doc-ink-strong': '#14100D', '--doc-ink-subtle': '#7A7068',
      '--doc-rule': '#E8DFD1', '--doc-accent': '#FF6900',
      '--doc-font-display': '"Cormorant Garamond", Georgia, serif',
    },
  },
  {
    id: 'rollsroyce', name: 'Rolls-Royce', base: 'dark', accent: '#B08B4C', logo: 'rollsroyce.svg', wordmark: 'rollsroyce.svg', wmAr: 7.213, wmScale: 0.8,
    font: 'Bodoni+Moda:wght@400;500;600;700', fontStack: '"Bodoni Moda", Didot, Georgia, serif',
    palette: {
      '--doc-page-bg': '#0B0D12', '--doc-paper-bg': '#12151C', '--doc-nested-bg': '#191D26',
      '--doc-ink': '#C4C8D2', '--doc-ink-strong': '#F0EEE9', '--doc-ink-subtle': '#767C8B',
      '--doc-rule': '#232833', '--doc-accent': '#B08B4C',
      '--doc-font-display': '"Bodoni Moda", Didot, Georgia, serif',
    },
  },
  {
    id: 'spotify', name: 'Spotify', base: 'dark', accent: '#1DB954', logo: 'spotify.svg', wordmark: 'spotify.svg', wmAr: 3.621, wmScale: 1.0,
    font: 'Manrope:wght@400;500;700;800', fontStack: '"Manrope", "Helvetica Neue", Arial, sans-serif',
    palette: {
      '--doc-page-bg': '#0A0A0A', '--doc-paper-bg': '#121212', '--doc-nested-bg': '#1A1A1A',
      '--doc-ink': '#C7C7C7', '--doc-ink-strong': '#FFFFFF', '--doc-ink-subtle': '#7E7E7E',
      '--doc-rule': '#242424', '--doc-accent': '#1DB954',
      '--doc-font-display': '"Manrope", "Helvetica Neue", Arial, sans-serif',
    },
  },
  {
    id: 'airbnb', name: 'Airbnb', base: 'light', accent: '#FF385C', logo: 'airbnb.svg', wordmark: 'airbnb.svg', wmAr: 3.62, wmScale: 0.92,
    font: 'Nunito:wght@400;600;700;800', fontStack: '"Nunito", "Helvetica Neue", Arial, sans-serif',
    palette: {
      '--doc-page-bg': '#F7F7F7', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#F0F0F0',
      '--doc-ink': '#222222', '--doc-ink-strong': '#111111', '--doc-ink-subtle': '#717171',
      '--doc-rule': '#E4E4E4', '--doc-accent': '#FF385C',
      '--doc-font-display': '"Nunito", "Helvetica Neue", Arial, sans-serif',
    },
  },
  {
    id: 'ikea', name: 'IKEA', base: 'light', accent: '#0058A3', logo: 'ikea.svg', wordmark: 'ikea.svg', wmAr: 5.327, wmScale: 0.8,
    font: 'Noto+Sans:wght@400;500;600;700', fontStack: '"Noto Sans", Verdana, "Helvetica Neue", Arial, sans-serif',
    // Noto Sans is wider than Inter's display cut — ease the tracking so the
    // cover title lands composed instead of crushed.
    tracking: ['-1.4px', '-0.4px'],
    palette: {
      '--doc-page-bg': '#F5F5F5', '--doc-paper-bg': '#FFFFFF', '--doc-nested-bg': '#EDEDED',
      '--doc-ink': '#333333', '--doc-ink-strong': '#111111', '--doc-ink-subtle': '#767676',
      '--doc-rule': '#DFDFDF', '--doc-accent': '#0058A3',
      '--doc-font-display': '"Noto Sans", Verdana, "Helvetica Neue", Arial, sans-serif',
    },
  },
  {
    id: 'nike', name: 'Nike', base: 'dark', accent: '#FA5400', logo: 'nike.svg', wordmark: 'nike.svg', wmAr: 2.402, wmScale: 0.85,
    font: 'Oswald:wght@400;500;600;700', fontStack: '"Oswald", "Helvetica Neue", Arial, sans-serif',
    palette: {
      '--doc-page-bg': '#0B0B0B', '--doc-paper-bg': '#141414', '--doc-nested-bg': '#1C1C1C',
      '--doc-ink': '#C9C9C9', '--doc-ink-strong': '#FFFFFF', '--doc-ink-subtle': '#7E7E7E',
      '--doc-rule': '#262626', '--doc-accent': '#FA5400',
      '--doc-font-display': '"Oswald", "Helvetica Neue", Arial, sans-serif',
    },
  },
];

/* ── Your themes — accent-only saved themes (no palette, like the source). ── */
const SAVED = [
  { id: 'custom-1', name: 'Custom 1', base: 'dark', accent: '#6E56CF' },
  { id: 'custom-2', name: 'Custom 2', base: 'light', accent: '#0E8F9A' },
];

export const DEFAULT_THEME = 'corvache';
const ALL = () => [...DEFAULTS, ...WORKSPACE, ...SAVED];
export const findTheme = (id) => ALL().find((t) => t.id === id) || null;

/* ── icons ───────────────────────────────────────────────────────────────── */
const I = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l4 4"/></svg>`,
};

/* ── font loading (lazy, once per family) ────────────────────────────────── */
const loaded = new Set();
function loadFont(spec) {
  if (!spec || loaded.has(spec)) return;
  loaded.add(spec);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(l);
}

/* ── apply ───────────────────────────────────────────────────────────────── */
let current = DEFAULT_THEME;
export const currentTheme = () => current;

export function applyTheme(id, { persist = true } = {}) {
  const t = findTheme(id) || findTheme(DEFAULT_THEME);
  if (!t) return;
  const body = document.body;

  // Always clear the full key set first — same keys every time, so no leaks.
  TOKEN_KEYS.forEach((k) => body.style.removeProperty(k));

  body.dataset.theme = t.base;
  body.dataset.brand = t.id;

  if (t.palette) {
    loadFont(t.font);
    Object.entries(t.palette).forEach(([k, v]) => body.style.setProperty(k, v));
    const [display, heading] = trackingFor(t);
    body.style.setProperty('--doc-display-tracking', display);
    body.style.setProperty('--doc-heading-tracking', heading);
  } else if (t.accent && !DEFAULTS.some((d) => d.id === t.id)) {
    // Saved themes are accent-only: they ride the base mode, retint the accent.
    body.style.setProperty('--doc-accent', t.accent);
  }

  current = t.id;
  if (persist) { try { localStorage.setItem(STORE_KEY, t.id); } catch { /* private mode */ } }
  document.dispatchEvent(new CustomEvent('theme:changed', { detail: { id: t.id, theme: t } }));
}

/**
 * Theme SWEEP — the picker's transition. Instead of an instant token swap
 * (reads as a blink), the new theme draws DOWN over the old like a sheet:
 * the View Transition's new snapshot reveals through a feathered vertical
 * mask (see themes.css ::view-transition rules) while the old state recedes
 * with a focus-pull blur, and an accent filament rides the reveal edge —
 * the same trailing-edge grammar as the intro sheet-lift. The filament is
 * spawned INSIDE the commit so it lives in the NEW snapshot (masked with
 * it) and reads the NEW theme's accent. No View Transitions / reduced
 * motion → plain immediate apply (current behavior).
 */
export function sweepTheme(id) {
  if (typeof document.startViewTransition !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyTheme(id);
    return;
  }
  let filament = null;
  const vt = document.startViewTransition(() => {
    applyTheme(id);
    filament = document.createElement('div');
    filament.className = 'doc-theme-sweep';
    filament.setAttribute('aria-hidden', 'true');
    document.body.appendChild(filament);
  });
  vt.finished.finally(() => { if (filament) filament.remove(); });
}

/** Restore the persisted theme (or the CORVACHE default) before first paint. */
export function initTheme() {
  let id = DEFAULT_THEME;
  try { id = localStorage.getItem(STORE_KEY) || DEFAULT_THEME; } catch { /* ignore */ }
  applyTheme(findTheme(id) ? id : DEFAULT_THEME, { persist: false });
}

/* ── picker panel ────────────────────────────────────────────────────────── */
const mark = (t) => (t.logo
  ? `<span class="doc-th-ico" style="color:${t.accent}"><span class="doc-th-brand" style="--m:url('${LOGO_BASE}${t.logo}')"></span></span>`
  : `<span class="doc-th-ico" style="color:${t.accent}">${I[t.icon] || `<span class="doc-th-dot" style="background:${t.accent}"></span>`}</span>`);

/* Brand name slot: the REAL wordmark artwork where one exists (masked span —
   rides the row's currentColor so it inks at rest / accents when active);
   live text only for wordmark-less entries (defaults, Corvache, saved). */
const wmSpan = (t, h, cls) =>
  `<span class="${cls}" role="img" aria-label="${t.name}" style="--m:url('${WM_BASE}${t.wordmark}'); aspect-ratio:${t.wmAr}; height:${(h * (t.wmScale || 1)).toFixed(2)}px"></span>`;

function rows(list, withEdit) {
  return list.map((t) => `
    <div class="doc-th-row">
      <button class="doc-th-apply" type="button" role="menuitem" data-theme="${t.id}" aria-label="${t.name}">
        ${mark(t)}${t.wordmark ? wmSpan(t, 13, 'doc-th-wm') : `<span class="doc-th-name">${t.name}</span>`}
      </button>
      ${withEdit ? `<button class="doc-th-edit" type="button" aria-label="Edit ${t.name}">${I.pencil}</button>` : ''}
    </div>`).join('');
}

export function initThemePicker() {
  const logo = document.querySelector('.doc-header__logo');
  if (!logo) return;
  logo.classList.add('is-theme-trigger');
  logo.setAttribute('role', 'button');
  logo.setAttribute('tabindex', '0');
  logo.setAttribute('title', 'Themes');

  let panel = null;
  let overlay = null;

  const close = () => {
    if (!panel) return;
    panel.classList.add('is-closing');
    const p = panel; const o = overlay;
    panel = null; overlay = null;
    setTimeout(() => { p.remove(); o?.remove(); }, 160);
  };

  // Re-highlight whenever a theme actually commits (sweeps apply async);
  // no-ops while the panel is closed.
  document.addEventListener('theme:changed', () => syncActive());

  function syncActive() {
    panel?.querySelectorAll('.doc-th-apply').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.theme === current);
    });
  }

  function open() {
    if (panel) { close(); return; }
    overlay = document.createElement('div');
    overlay.className = 'doc-th-overlay';
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);

    panel = document.createElement('div');
    panel.className = 'doc-th-panel';
    panel.setAttribute('role', 'menu');
    panel.innerHTML = `
      <div class="doc-th-head">
        <span class="doc-th-title">Themes</span>
        <button class="doc-th-close" type="button" aria-label="Close">${I.close}</button>
      </div>
      <div class="doc-th-divider"></div>
      <div class="doc-th-group">Default</div>
      ${rows(DEFAULTS, false)}
      <div class="doc-th-group">Workspace themes</div>
      ${rows(WORKSPACE, false)}
      <div class="doc-th-group">Your themes</div>
      ${rows(SAVED, true)}
      <button class="doc-th-create" type="button">${I.plus}<span>Create your own</span></button>`;
    document.body.appendChild(panel);

    // Anchor under the logo, left-aligned to it, clamped into the viewport.
    const r = logo.getBoundingClientRect();
    panel.style.top = `${r.bottom + 12}px`;
    panel.style.left = `${Math.max(12, r.left)}px`;

    panel.addEventListener('click', (e) => e.stopPropagation());
    panel.querySelector('.doc-th-close').addEventListener('click', close);
    // The sweep applies the theme inside an async View Transition callback,
    // so the active row can't be synced inline — theme:changed (fired by
    // applyTheme at commit time) is the truth on both paths.
    panel.querySelectorAll('.doc-th-apply').forEach((b) => {
      b.addEventListener('click', () => sweepTheme(b.dataset.theme));
    });
    syncActive();
  }

  logo.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  logo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', close);
}

/** Active brand for co-brand surfaces (the intro cover, the nav lockup, the
    hero background). Returns null on the plain OMNI light/dark themes — no
    partnership to show. heroUrl is null for brands without a backdrop
    (Corvache: the doc's own render is the hero). */
export function getActiveBrand() {
  const t = findTheme(current);
  if (!t || !t.logo) return null;
  return {
    id: t.id,
    name: t.name,
    logoUrl: LOGO_BASE + t.logo,
    heroUrl: BRAND_HEROES.includes(t.id) ? `${HERO_BASE}${t.id}.jpg` : null,
    wordmarkUrl: t.wordmark ? WM_BASE + t.wordmark : null,
    wmAr: t.wmAr || null,
    wmScale: t.wmScale || 1,
  };
}

/* ── brand lockup — the payoff. A true co-brand in the nav: the OMNI mark, a
   restrained ×, then the active brand's mark + name set in that brand's own
   display face. Only brand (workspace) themes get it — the OMNI defaults are
   not a partnership, so the lockup collapses away. ────────────────────────── */
export function renderBrandLockup(mount) {
  const lockup = document.createElement('span');
  lockup.className = 'doc-cobrand';
  const paint = () => {
    const t = findTheme(current);
    const isBrand = !!(t && t.logo);
    lockup.hidden = !isBrand;
    if (!isBrand) { lockup.innerHTML = ''; return; }
    // Name slot = the brand's real wordmark when one exists (em-sized against
    // the lockup's M so the canon ratios hold on every surface that mounts
    // this component); Corvache keeps its Inter-set name — that IS its mark.
    lockup.innerHTML = `
      <span class="doc-cobrand__x" aria-hidden="true">×</span>
      <span class="doc-cobrand__mark" style="--m:url('${LOGO_BASE}${t.logo}')"></span>
      ${t.wordmark
        ? `<span class="doc-cobrand__wm" role="img" aria-label="${t.name}" style="--m:url('${WM_BASE}${t.wordmark}'); aspect-ratio:${t.wmAr}; --wm-scale:${t.wmScale || 1}"></span>`
        : `<span class="doc-cobrand__name">${t.name}</span>`}`;
    // Replay the entrance on every theme change so the swap reads deliberate.
    lockup.classList.remove('is-in');
    void lockup.offsetWidth;
    lockup.classList.add('is-in');
  };
  paint();
  document.addEventListener('theme:changed', paint);
  mount.appendChild(lockup);
  return lockup;
}

/* ── theme signature — quiet themed attribution, proves theming is intentional
   craft rather than a skin. Sits in the colophon. ─────────────────────────── */
export function renderThemeSignature(mount) {
  const el = document.createElement('span');
  el.className = 'doc-th-signature';
  const paint = () => {
    const t = findTheme(current);
    el.innerHTML = `${t.logo
      ? `<span class="doc-th-sig-mark" style="--m:url('${LOGO_BASE}${t.logo}')"></span>`
      : `<span class="doc-th-sig-dot"></span>`}<span class="doc-th-sig-text">${t.name} theme</span>`;
  };
  paint();
  document.addEventListener('theme:changed', paint);
  mount.appendChild(el);
  return el;
}
