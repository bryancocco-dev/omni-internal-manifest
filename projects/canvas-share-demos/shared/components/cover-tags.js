/* ─────────────────────────────────────────────────────────────────────────
   cover-tags.js — the 8 micro-graphic tag lockups for the generative cover
   hero. Ported from canvas-book-ends/index.html (PLAN-COVERS.md §3):

     PRNG + shared helpers .......... book-ends 38030–38050, 38381–38474
     tagV1/V2/V3/V6/V7/V8/V9/V10 ..... book-ends 38475–38640
     armTagReveal / TAG_REVEAL_SEL ... book-ends 38357–38372

   Faithful port: same mulberry32 PRNG, same seedInt hash, same per-builder
   draw order (tagCoords before stampInstruments/agentStack/bar-loop, plain
   GEN_SEED stream vs ':tag'-suffixed side-stream kept separate exactly as
   source does) — a given seed must always resolve to the same serial,
   coordinates and readouts. Do not reorder any r()/mulberry32() call.

   Adaptations for the hero slot (not the book cover), per §3:
   - `seed` and `symbol` are passed in per call instead of read from
     location.search / a module-level `state.sym` — the only structural
     change the PRNG streams needed.
   - V1 INSTRUMENT collapses from a full-width left/right rail into an
     intrinsic-width right-aligned row (glyph · read · serial).
   - V4 SEAL and V8 MARK drop their card-border-straddle positioning
     (nothing to straddle here) and re-lay as right-aligned sign-off rows;
     SEAL gains a `.cbe-tag6-relay` wrapper that did not exist in the
     source (serial-then-badge, flush right).
   - armTagReveal no longer arms an IntersectionObserver (the book-ends
     lockup only revealed on scroll into a book cover further down the
     page) — the hero tag is above the fold, so this just flips the
     `.cbe-tag-live` class immediately; cover-tags.css holds the actual
     animation back with `animation-play-state: paused` while
     `.doc--intro-init` / `body.is-gated` own the screen, same mechanism
     hero.css already uses for the title/subtitle/meta rail, and delays
     the whole cascade to start after the meta rail's own 520ms cue.
   - Asset paths rewritten to shared/assets/covers|omni-logo.png; `--accent`
     literal in tagV7's inline fill swapped for `var(--doc-accent)`.
   ───────────────────────────────────────────────────────────────────── */

/* ---- public: slot order (1–8), matches TAG_BUILDERS below ---- */
export const GEN_TAGS = [
  { n: 1, name: 'INSTRUMENT' },
  { n: 2, name: 'SPEC' },
  { n: 3, name: 'ORBIT' },
  { n: 4, name: 'SEAL' },
  { n: 5, name: 'BARCODE' },
  { n: 6, name: 'LEDGER' },
  { n: 7, name: 'REGISTRY' },
  { n: 8, name: 'MARK' },
];

/* ---- PRNG (verbatim port — do not touch) ---- */
function seedInt(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---- shared seeded helpers (verbatim logic; GEN_SEED/state.sym globals
   replaced with explicit seed/symbol params — see file header) ---- */
function tagCoords(r) {
  var lat = (44 + r() * 4).toFixed(2);
  var lon = (5 + r() * 4).toFixed(2);
  if (lon.length < 5) lon = '0' + lon;
  return lat + 'N·' + lon + 'E';
}
function coordsHtml(coords) {
  var m = /^([\d.]+)N·([\d.]+)E$/.exec(coords);
  if (!m) return coords;
  return '<span class="cbe-coords" data-lat="' + m[1] + '" data-lon="' + m[2] + '">' + coords + '</span>';
}
function tagSerial(coords, symbol, seed) {
  return 'OMN·' + (symbol || 'a11').toUpperCase() + '/39 · ' + seed.toUpperCase() + ' · ' + coordsHtml(coords);
}
function stampInstruments(r) {
  var accIdx = 3 + Math.floor(r() * 25); // 3..27 — one draw, same range as source
  var read = '<span class="cbe-mgs-read">SIG·<b>' + String(accIdx * 5).padStart(3, '0') + '</b></span>';
  return { read: read };
}
function agentStack(r) {
  return ['GRAPHICS', 'VIDEO', 'AUDIO', 'TEXT'].map(function (n) {
    return { n: n, v: (1 + Math.floor(r() * 8)) + '.' + Math.floor(r() * 10) };
  });
}
function tagEl(cls, html) {
  var el = document.createElement('div');
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  return el;
}

/* ---- coordinate drift (Bryan 2026-07-24, book-ends 38423–38460 verbatim):
   the seeded coords stay the resting value; a document-level mousemove
   breathes a tiny ± offset onto the displayed digits, plotter-readout
   style. Timestamp-throttled at 33ms, NOT rAF — an automation pane can
   freeze rAF on an unfocused tab, and a pending rAF flag can wedge if the
   tab backgrounds mid-move; the 33ms gate costs the same ~30fps ceiling
   and updates synchronously inside the (already gesture-driven) event.
   Module top-level, so it binds exactly once no matter how many times
   buildCoverTag runs (contact sheets mount many tags on one page). Never
   binds under prefers-reduced-motion. ---- */
(function () {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var last = 0;
  function fmt(lat, lon) {
    var la = lat.toFixed(2);
    var lo = lon.toFixed(2);
    if (lo.length < 5) lo = '0' + lo;
    return la + 'N·' + lo + 'E';
  }
  document.addEventListener('mousemove', function (e) {
    var now = performance.now();
    if (now - last < 33) return;
    last = now;
    var dx = (e.clientX / window.innerWidth - 0.5);
    var dy = (e.clientY / window.innerHeight - 0.5);
    var els = document.querySelectorAll('.cbe-coords');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var lat = parseFloat(el.dataset.lat) + dy * 0.22;
      var lon = parseFloat(el.dataset.lon) + dx * 0.32;
      el.textContent = fmt(lat, lon);
    }
  }, { passive: true });
})();

/* ---- builders — internal v-numbers kept matching book-ends' own naming
   (v4/v5 were retired there; storage identity stays stable) so this file
   cross-references the source 1:1. TAG_BUILDERS maps the public 1–8 slot
   order onto them, exactly like book-ends' own TAG_BUILDERS array. ---- */

/* v1 INSTRUMENT — collapsed from a 56px-inset full-width rail to an
   intrinsic-width right-aligned row (glyph · read · serial); see §3. */
function tagV1(node, seed, symbol) {
  var r = mulberry32(seedInt(seed));
  var coords = tagCoords(r);
  var instr = stampInstruments(r);
  node.appendChild(tagEl('cbe-mgs',
    '<i class="cbe-mgs-glyph"></i>' +
    instr.read +
    '<span class="cbe-mgs-serial">' + tagSerial(coords, symbol, seed) + '</span>'));
}

/* v2 SPEC — the boxed lockup. `coords` and `tools` are two independent
   PRNG streams (plain seed vs ':tag' seed) — verbatim call pattern.
   FIX 3: the source's two data slots were book-ends' own hardcoded book
   cover — "760 × 950 PX" (that book cover's fixed export/print size, not
   this hero's) and "For BuildSubmarines.com" (book-ends' own demo client).
   Both are now caller-supplied: `dimensions` is the hero's real rendered
   pixel size, `clientName` is the document's own client. Every label, the
   structure, the letter-spacing and the seeded values stay verbatim —
   only these two data slots changed. */
function tagV2(node, seed, symbol, clientName, dimensions) {
  var r = mulberry32(seedInt(seed + ':tag'));
  var coords = tagCoords(mulberry32(seedInt(seed)));
  var tools = agentStack(r).map(function (t) {
    return t.n + '<i>' + t.v + '</i>';
  }).join('<br>');
  node.appendChild(tagEl('cbe-tag cbe-tag2', '' +
    '<div class="cbe-tag2-grid"><div>' +
      '<div class="cbe-tag2-head">' +
        '<span class="hbox"><span class="cbe-tag2-glyph"><img src="../../shared/assets/omni-logo.png" alt=""></span><b>©OMNI</b></span>' +
        '<span class="hcity">S F O</span>' +
      '</div>' +
      '<p class="cbe-tag2-line">ALGORITHMICALLY GENERATED</p>' +
      '<p class="cbe-tag2-line">DIMENSIONS: <span class="cbe-tag2-dim">' + dimensions + '</span> PX <i>· ' + seed.toUpperCase() + ' · ' + coordsHtml(coords) + '</i></p>' +
      '<div class="cbe-tag2-client">For ' + clientName + '</div>' +
    '</div>' +
    '<div class="cbe-tag2-tools">' + tools + '</div></div>'));
}

/* v3 ORBIT. FIX 3: the source hardcoded its own demo client as a slug
   ("BUILDSUBMARINES") next to the real ©OMNI mark — same leak as SPEC's
   client line, just re-lettered for this lockup's all-caps brand-word
   style. Derived from the same caller-supplied `clientName`, not a second
   hardcoded literal. */
function tagV3(node, seed, symbol, clientName) {
  var r = mulberry32(seedInt(seed + ':tag'));
  var coords = tagCoords(mulberry32(seedInt(seed)));
  var tools = agentStack(r).map(function (t) { return t.n; }).join('<br>');
  var clientSlug = (clientName || 'OMNI').toUpperCase().replace(/[^A-Z0-9]+/g, '') || 'OMNI';
  node.appendChild(tagEl('cbe-tag cbe-tag3', '' +
    '<div class="cbe-tag3-wrap">' +
      '<div class="cbe-tag3-name"><span>[GEN·39]</span><b>©OMNI</b><b>' + clientSlug + '</b></div>' +
      '<div class="cbe-tag3-meta">' +
        '<span>' + tools.replace(/<br>/g, ' · ') + '</span>' +
        '<span class="yr">' + coordsHtml(coords) + '&emsp;20&emsp;26</span>' +
      '</div>' +
    '</div>'));
}

/* v6 SEAL — §3 re-lay: no card border to straddle here, so the badge and
   serial (still each their own top-level `.cbe-tag-live` root, exactly as
   book-ends keeps them — see the CSS choreography) are wrapped in a new
   `.cbe-tag6-relay` flex row: serial on the left, badge flush right. The
   real omni-logo.png asset, not a masked substitute (book-ends round 45). */
function tagV6(node, seed, symbol) {
  var coords = tagCoords(mulberry32(seedInt(seed)));
  var wrap = document.createElement('div');
  wrap.className = 'cbe-tag6-relay';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.appendChild(tagEl('cbe-tag6-serial', tagSerial(coords, symbol, seed)));
  wrap.appendChild(tagEl('cbe-tag6-badge', '<img src="../../shared/assets/omni-logo.png" alt="OMNI+">'));
  node.appendChild(wrap);
}

/* v7 BARCODE — the bar-drawing loop and its draw count are seed-dependent
   (the loop runs until x >= 116); verbatim port, do not restructure the
   branching or the r() call order. Accent fill swapped to var(--doc-accent). */
function tagV7(node, seed, symbol) {
  var r = mulberry32(seedInt(seed + ':tag'));
  var coords = tagCoords(mulberry32(seedInt(seed)));
  var bars = '';
  var x = 0.5;
  var xs = [];
  while (x < 116) {
    var w = r() < 0.3 ? 2.4 : (r() < 0.5 ? 1.6 : 0.8);
    xs.push([x, w]);
    x += w + 0.9 + r() * 1.8;
  }
  var accBar = Math.floor(r() * xs.length);
  xs.forEach(function (b, i) {
    bars += '<rect x="' + b[0].toFixed(1) + '" y="0" width="' + b[1] + '" height="22" fill="' +
      (i === accBar ? 'var(--doc-accent)' : 'currentColor') + '"/>';
  });
  node.appendChild(tagEl('cbe-tag cbe-tag7', '' +
    '<svg class="cbe-tag7-bars" viewBox="0 0 120 22" aria-hidden="true">' + bars + '</svg>' +
    '<div class="cbe-tag7-line">' + tagSerial(coords, symbol, seed) + '</div>'));
}

/* v8 LEDGER. */
function tagV8(node, seed, symbol) {
  var r = mulberry32(seedInt(seed + ':tag'));
  var coords = tagCoords(mulberry32(seedInt(seed)));
  var rows = agentStack(r).map(function (t) {
    return '<div class="row"><span>' + t.n + '</span><i>' + t.v + '</i></div>';
  }).join('');
  node.appendChild(tagEl('cbe-tag cbe-tag8', '' +
    '<div class="cbe-tag8-box">' +
      '<div class="cbe-tag8-title"><b>©OMNI</b><span>GEN·39</span></div>' +
      rows +
      '<div class="cbe-tag8-foot">' + seed.toUpperCase() + ' · ' + coordsHtml(coords) + '</div>' +
    '</div>'));
}

/* v9 REGISTRY — the brutalist-globe registration mark. The energy comet
   layer is kept in the DOM (with its per-copy inline delays) but never
   animated or shown, matching book-ends round 68 exactly: only the static
   .cbe-tag9-wire strokes render. Width/height attrs dropped from the svg
   root — cover-tags.css sizes it in `em` instead. */
function tagV9(node, seed, symbol) {
  var coords = tagCoords(mulberry32(seedInt(seed)));
  node.appendChild(tagEl('cbe-tag cbe-tag9', '' +
    '<svg class="cbe-tag9-mark" viewBox="0 0 24 24" aria-hidden="true">' +
      '<ellipse class="cbe-tag9-wire" cx="12" cy="12" rx="10" ry="7" fill="none" pathLength="100" stroke="currentColor" stroke-width="1.6"/>' +
      '<ellipse class="cbe-tag9-wire" cx="12" cy="12" rx="5" ry="7" fill="none" pathLength="100" stroke="currentColor" stroke-width="1.6"/>' +
      '<line class="cbe-tag9-wire" x1="12" y1="5" x2="12" y2="19" pathLength="100" stroke="currentColor" stroke-width="1.6"/>' +
      '<line class="cbe-tag9-wire" x1="2" y1="12" x2="22" y2="12" pathLength="100" stroke="currentColor" stroke-width="1.6"/>' +
      '<ellipse class="cbe-tag9-energy" cx="12" cy="12" rx="10" ry="7" fill="none" pathLength="100" stroke-width="1.6" style="animation-delay:.65s"/>' +
      '<ellipse class="cbe-tag9-energy" cx="12" cy="12" rx="5" ry="7" fill="none" pathLength="100" stroke-width="1.6" style="animation-delay:1.35s"/>' +
      '<line class="cbe-tag9-energy" x1="12" y1="5" x2="12" y2="19" pathLength="100" stroke-width="1.6" style="animation-delay:2.05s"/>' +
      '<line class="cbe-tag9-energy" x1="2" y1="12" x2="22" y2="12" pathLength="100" stroke-width="1.6" style="animation-delay:2.75s"/>' +
      '<circle class="cbe-tag9-core" cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>' +
    '</svg>' +
    '<div class="cbe-tag9-text"><b>©OMNI REGISTERED GRAPHIC</b><span>' + tagSerial(coords, symbol, seed) + '</span></div>'));
}

/* v8/MARK (public slot 8) — the bare OMNI badge, no type. §3 re-lay: was a
   left-anchored circle straddling the card's bottom border; here it is
   just the badge, flush to the tag slot's right edge (the mount itself is
   already right-aligned). No PRNG draws — nothing downstream reads r()
   after a builder runs, so skipping tagCoords here can't shift any other
   slot's stream. */
function tagV10(node) {
  node.appendChild(tagEl('cbe-tag10', '<img src="../../shared/assets/omni-logo.png" alt="OMNI+">'));
}

var TAG_BUILDERS = [null, tagV1, tagV2, tagV3, tagV6, tagV7, tagV8, tagV9, tagV10];

/* ---- public: build one tag (1–8) into `mount`, clearing it first.
   `seed` drives every seeded value (same seed ⇒ same serial/coords/
   readouts forever); `symbol` is a ring id like 'a19', read by tagSerial.
   `seed`/`symbol`/`clientName`/`dimensions` are all optional for
   defensive/standalone use — the real resolution (parsing ?gen=/?cover=,
   reading the document's meta.clientName, measuring the hero) lives in
   cover-gen.js + renderer.js, not here.

   clientName/dimensions (FIX 3): only SPEC (tagV2) and ORBIT (tagV3) read
   these — see their own comments. Defaults exist purely so a caller that
   forgets to pass them still gets a plausible, non-hardcoded-client
   result instead of a silent blank: 'OMNI+' rather than any specific
   company, and the live viewport (this hero is a 100vw × 100vh surface,
   so that IS its real rendered pixel size) rather than a fixed literal. */
export function buildCoverTag(mount, opts) {
  if (!mount) return;
  opts = opts || {};
  var tagN = Number(opts.tag) || 2;
  var seed = (opts.seed ? String(opts.seed) : Math.random().toString(36).slice(2, 6)).toLowerCase();
  /* symbol is documented as a plain ring id ('a19'), but cover-gen.js's
     resolveCoverTemplate() actually resolves + passes the full GEN_SYMBOLS
     entry ({ key, id, name, rings }) straight through — accept either
     shape so tagSerial always gets a plain id string. */
  var rawSymbol = opts.symbol;
  if (rawSymbol && typeof rawSymbol === 'object') rawSymbol = rawSymbol.id || rawSymbol.key;
  var symbol = (rawSymbol ? String(rawSymbol) : 'a11').toLowerCase();
  var clientName = opts.clientName ? String(opts.clientName) : 'OMNI+';
  var dimensions = opts.dimensions ? String(opts.dimensions)
    : (typeof window !== 'undefined' ? Math.round(window.innerWidth) + ' × ' + Math.round(window.innerHeight) : '');
  mount.innerHTML = '';
  var fn = TAG_BUILDERS[tagN] || tagV2;
  fn(mount, seed, symbol, clientName, dimensions);
}

/* ---- public: arm the build-in choreography. The book-ends source used a
   scroll-triggered IntersectionObserver per tag root (armTagReveal,
   38357–38372) because that lockup sits low in a scrolling book cover.
   This hero tag is above the fold and always in view, so arming just
   means flipping `.cbe-tag-live` on straight away — cover-tags.css is
   what actually holds the animation back (`animation-play-state: paused`
   while `.doc--intro-init`/`body.is-gated` own the screen, and a
   --tag-reveal-delay so the cascade starts after the meta rail's own
   520ms docHeroUp cue), exactly the pattern hero.css already uses for the
   title/subtitle/meta rail. ---- */
var TAG_REVEAL_SEL = '.cbe-mgs, .cbe-tag, .cbe-tag6-badge, .cbe-tag6-serial, .cbe-tag10';
export function armTagReveal(mount) {
  if (!mount) return;
  var nodes = mount.querySelectorAll(TAG_REVEAL_SEL);
  for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('cbe-tag-live');
}
