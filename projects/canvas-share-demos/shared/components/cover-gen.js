/**
 * Generative cover — ring data + template resolution + DOM assembly.
 * Ports the OMNI+ Book Ends F39 FANLIGHT ring system onto the read-only
 * hero. See PLAN-COVERS.md (repo root) §1-§2 for the geometry contract this
 * file implements verbatim — the per-symbol numbers are measured, not
 * guessed, and are not re-derived here.
 *
 * The tag module (cover-tags.js) may not exist on disk yet — it's a
 * parallel, independently-built file. Imported tolerantly so this module
 * (and the ring + light-board work it owns) is verifiable standalone: with
 * no tag module present, applyGenerativeCover() still renders a correctly
 * positioned, empty tag slot.
 */
let buildCoverTag = null;
let armTagReveal = null;
try {
  ({ buildCoverTag, armTagReveal } = await import('./cover-tags.js'));
} catch (e) {
  /* parallel task — cover-tags.js not built yet, or failed to load. The
     ring + light board render correctly either way; only the tag slot's
     CONTENTS are skipped. */
}

/* Assets resolved against THIS MODULE (not the page) so every demo depth
   loads correctly, same pattern as themes.js's LOGO_BASE/HERO_BASE. */
const ASSET_BASE = new URL('../assets/covers/', import.meta.url).href;
const assetUrl = (file) => `${ASSET_BASE}${file}`;

/* Shared centre, PLAN §1: "the bore sits below the hero's bottom-left
   corner and the crown sweeps up and across." Every symbol shares CY;
   every symbol shares CX too EXCEPT tick, which pulls its shared centre
   left per the table's own per-ring cx column. */
const CY = 1.298;
const CX = 0.3364;
const CX_TICK = -0.0374;

/**
 * GEN_SYMBOLS — the six ring treatments. Each ring in `rings` carries
 * exactly the columns from PLAN-COVERS.md §1's per-symbol table:
 * k (--ring-k), zoom (--ring-zoom), dur (--ring-dur), cx/cy (--ring-cx/cy),
 * src (mask asset). TICK renders three concentric rings, BUBBLE two, the
 * rest one — differing durations are intentional (they must read as
 * separate instruments, not one rigid object).
 *
 * FIX 4 (PLAN-COVERS.md, fix round): RAYS's --ring-zoom is tuned from the
 * source's 'contain' to 48% — at the hero's own aspect (1.6, narrower than
 * book-ends' 1.869 frame), 'contain' put too little of the ray-wheel's hub
 * area in view, reading as ~6 wide bars with a lot of empty board on the
 * left; 48% brings the visible slice in closer to the hub, giving the ~14
 * finer, denser rays the reference shows. This is the one symbol that
 * needed it — TICK/BUBBLE/BURST/FIELD/GRID were tested against the same
 * reference and left at their §1 values (see PLAN's own bar: tune only
 * where it clearly improves things). Geometry (k, cx/cy) is untouched.
 */
export const GEN_SYMBOLS = [
  {
    key: 'rays', id: 'a11', name: 'RAYS',
    rings: [
      { k: 4.971, zoom: '78%', dur: '600s', cx: CX, cy: CY, src: assetUrl('p49-a11.tworing.svg') },
    ],
  },
  {
    key: 'tick', id: 'a03', name: 'TICK',
    rings: [
      { k: 4.971, zoom: '80%', dur: '600s', cx: CX_TICK, cy: CY, src: assetUrl('p49-a03.ring.svg') },
      { k: 6.462, zoom: '80%', dur: '840s', cx: CX_TICK, cy: CY, src: assetUrl('p49-a03.ring.svg') },
      { k: 4.723, zoom: '55%', dur: '450s', cx: CX_TICK, cy: CY, src: assetUrl('p49-a03.ring.svg') },
    ],
  },
  {
    key: 'bubble', id: 'a06', name: 'BUBBLE',
    rings: [
      { k: 4.971, zoom: '46%', dur: '600s', cx: CX, cy: CY, src: assetUrl('p49-a06.ring.svg') },
      { k: 6.462, zoom: '62%', dur: '420s', cx: CX, cy: CY, src: assetUrl('p49-a06.ring.svg') },
    ],
  },
  {
    key: 'burst', id: 'a07', name: 'BURST',
    rings: [
      { k: 4.971, zoom: '78%', dur: '600s', cx: CX, cy: CY, src: assetUrl('p49-a07.ring.svg') },
    ],
  },
  {
    key: 'field', id: 'a19', name: 'FIELD',
    rings: [
      { k: 4.971, zoom: '78%', dur: '600s', cx: CX, cy: CY, src: assetUrl('p49-a19.ring.svg') },
    ],
  },
  {
    key: 'grid', id: 'a21', name: 'GRID',
    rings: [
      { k: 4.971, zoom: '70%', dur: '600s', cx: CX, cy: CY, src: assetUrl('p49-a21.ring.svg') },
    ],
  },
];

const findSymbol = (idOrKey) => {
  if (!idOrKey) return null;
  const v = String(idOrKey).toLowerCase();
  return GEN_SYMBOLS.find((s) => s.key === v || s.id === v) || null;
};

const randomSeed = () => Math.random().toString(36).slice(2, 6).padEnd(4, '0');
const isValidSeed = (s) => typeof s === 'string' && /^[0-9a-z]{1,8}$/i.test(s);
/* Board palette (see cover-gen.css's "palette pin" block, which is the
   part that actually resolves the colours). 'omni' is the default: these
   are generic OMNI templates, so they open on the fixed OMNI blue/light
   board no matter what brand theme the surrounding document is wearing.
   'theme' opts back into the original behaviour — derive board + ink from
   --doc-accent — which brand reskins / Omni Dark still want. */
const isValidPalette = (p) => p === 'omni' || p === 'theme';

/**
 * Resolve which cover to render, per PLAN-COVERS.md §5 (no visible
 * switchers — everything is URL-driven and hidden):
 *   ?cover=a19 | rays|tick|bubble|burst|field|grid  — pins the treatment
 *   ?tag=2                                          — 1-8, pins the lockup
 *   ?gen=klvy                                       — pins the seed
 *   ?palette=omni|theme                             — pins the board palette
 *   ?cover=photo                                    — forces the photo hero
 *   no param                                        — cover.template in the JSON
 *
 * @param {object} cover - content.cover from the demo's content JSON.
 *   Reads cover.template = { symbol, tag, palette } if present.
 * @param {string|URLSearchParams} [search] - location.search (or an
 *   already-built URLSearchParams).
 * @returns {{symbol: object, tag: number, seed: string, palette: string}|null}
 *   null means "render the classic <img> hero" (no template resolved, or
 *   ?cover=photo explicitly forced it).
 */
export function resolveCoverTemplate(cover, search) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
  const coverParam = params.get('cover');
  if (coverParam === 'photo') return null;

  const base = (cover && cover.template) || null;
  const symbol = (coverParam && findSymbol(coverParam)) || (base && findSymbol(base.symbol)) || null;
  if (!symbol) return null; // nothing to render generatively — photo (or nothing) stands

  const tagParam = parseInt(params.get('tag'), 10);
  const tag = tagParam >= 1 && tagParam <= 8 ? tagParam : (base && base.tag) || 1;

  const seedParam = params.get('gen');
  const seed = isValidSeed(seedParam) ? seedParam : randomSeed();

  const paletteParam = params.get('palette');
  const palette = isValidPalette(paletteParam) ? paletteParam
    : (base && isValidPalette(base.palette)) ? base.palette
    : 'omni';

  return { symbol, tag, seed, palette };
}

/**
 * Builds the ring graphic into `hero`'s existing `.doc-hero__media` and
 * fills the (already-mounted) `.doc-hero__tag` slot. Call once, after the
 * hero's generative markup shell exists (renderHero builds that shell —
 * see renderer.js). Synchronous: the tag-module import above has already
 * settled by the time any caller can reach this (ESM top-level await
 * blocks this module's own evaluation, which blocks anything importing
 * it, transitively, until the try/catch above resolves).
 *
 * @param {HTMLElement} hero - the `.doc-hero` root.
 * @param {{symbol: object, tag: number, seed: string, palette: string,
 *   clientName?: string, dimensions?: string}} opts - resolveCoverTemplate()'s
 *   result, plus the two document-bound fields renderHero() adds
 *   (clientName/dimensions — FIX 3, consumed by SPEC/ORBIT; see cover-tags.js).
 */
export function applyGenerativeCover(hero, opts) {
  if (!hero || !opts || !opts.symbol) return;
  const { symbol, tag, seed, palette, clientName, dimensions } = opts;

  // cover-gen.css's palette-pin block reads this: 'omni' (default) shadows
  // --doc-accent/--doc-paper-bg/--doc-ink-* to fixed OMNI light values for
  // this whole subtree; 'theme' declares nothing, so those four keep
  // inheriting live from body (themes.js) exactly as before this attribute
  // existed.
  hero.setAttribute('data-gen-palette', palette === 'theme' ? 'theme' : 'omni');

  const media = hero.querySelector('.doc-hero__media');
  if (media) {
    media.innerHTML = '';
    symbol.rings.forEach((ring) => {
      const div = document.createElement('div');
      div.className = 'doc-hero__ring';
      div.setAttribute('aria-hidden', 'true');
      div.style.setProperty('--ring-k', ring.k);
      div.style.setProperty('--ring-zoom', ring.zoom);
      div.style.setProperty('--ring-cx', ring.cx);
      div.style.setProperty('--ring-cy', ring.cy);
      div.style.setProperty('--ring-dur', ring.dur);
      div.style.setProperty('--ring-src', `url("${ring.src}")`);
      media.appendChild(div);
    });
  }

  const tagMount = hero.querySelector('.doc-hero__tag');
  if (tagMount) {
    if (buildCoverTag) buildCoverTag(tagMount, { tag, seed, symbol, clientName, dimensions });
    if (armTagReveal) armTagReveal(tagMount);
  }
}

/**
 * FIX 3 follow-up: applyGenerativeCover() (via renderHero()) runs BEFORE
 * the hero is attached to the document, so the best it can pass for
 * `dimensions` is window.innerWidth/innerHeight — which can be stale at
 * that point (confirmed empirically: headless Chrome measured 87px short
 * of the requested viewport height when read this early; real browsers hit
 * the same class of bug when e.g. a mobile address bar collapses after
 * first paint). The hero is a 100vw × 100vh surface, so its own laid-out
 * box IS its real rendered pixel size — call this once the hero is
 * actually in the document (renderDoc(), right after appendChild) to patch
 * the tag's DIMENSIONS slot with the true measured value. No-op for a
 * photo hero, or for any tag but SPEC (the only one with a dims slot).
 *
 * @param {HTMLElement} hero - the `.doc-hero` root, already in the document.
 */
export function updateGenCoverDimensions(hero) {
  if (!hero || !hero.classList.contains('doc-hero--gen')) return;
  const dimEl = hero.querySelector('.doc-hero__tag .cbe-tag2-dim');
  if (!dimEl) return;
  const rect = hero.getBoundingClientRect();
  dimEl.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
}
