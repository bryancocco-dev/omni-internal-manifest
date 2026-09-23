#!/usr/bin/env python3
"""Regenerate review.html — the one-page treatment sheet.

Extracts the live CSS tokens, treatment styles, templates, and SVG-generator
engine straight out of index.html so the sheet can never drift from the app.
Run after any treatment change:  python3 make-review.py
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = (ROOT / 'index.html').read_text()
LINES = SRC.split('\n')


def find(pred, start=0):
    for i in range(start, len(LINES)):
        if pred(LINES[i]):
            return i
    sys.exit(f'anchor not found after line {start}')


def slice_lines(a, b):
    return '\n'.join(LINES[a:b])

# --- :root token block ---
r0 = find(lambda l: l.strip() == ':root {')
r1 = find(lambda l: l == '  }', r0)
css_root = slice_lines(r0, r1 + 1)

# --- font system: --font-sans lives in a later :root block ---
fs = find(lambda l: 'Font face system' in l)
css_root += '\n' + slice_lines(fs + 1, fs + 4)

# --- legacy bib-finale CSS (T01 back), reveal cascade excluded so the
#     sheet renders statically visible ---
f0 = find(lambda l: 'Bibliography finale — Swiss poster panel' in l)
f1 = find(lambda l: 'Reveal cascade — top row' in l, f0)
css_finale = slice_lines(f0, f1)

# --- CBE treatment styles ---
c0 = find(lambda l: '<style id="cbe-styles">' in l)
c1 = find(lambda l: l.strip() == '</style>', c0)
css_cbe = slice_lines(c0 + 1, c1)

# --- 20 templates ---
t0 = find(lambda l: 'CBE:START templates' in l)
t1 = find(lambda l: 'CBE:END templates' in l, t0)
templates = slice_lines(t0, t1 + 1)

# --- engine slice: CONTENT … GENMAP (no DOM dependencies) ---
e0 = find(lambda l: l.strip() == 'var CONTENT = {')
e1 = find(lambda l: '============ render ============' in l, e0)
engine = slice_lines(e0, e1)

# --- winners roster: single Python source, used both to emit the JS
#     array below and to seed the graveyard's continuing display-number
#     sequence (round 30 renumbering) ---
WINNERS = ['44', '45', '47', '39']
WINNERS_JS = ', '.join(f"'{w}'" for w in WINNERS)

# --- build-in strip (round 40) — Bryan: "duplicate this row and do some
#     very cool thing where the animation builds in as it moves on the
#     page." A second copy of the winners row where each ring assembles
#     as its card scrolls into view: a conic-gradient mask layer
#     intersected with the treatment's own baked ring mask sweeps the
#     marks in around the arc while the ring rotates into its resting
#     angle. Scrubbed by scroll (JS sets --build 0..1 per card,
#     staggered left to right) — scrolling back up un-builds it.
#     Kept as plain strings (not inside the page f-string) so the CSS/JS
#     braces don't need doubling. ---
BUILD_CSS = """
/* ================= build-in strip (round 40) ================= */
/* The ambient spin is off in this strip — the scroll scrub owns the
   transforms — and the reveal is split across two elements so no
   element ever carries two mask layers: the WRAPPER (.cbe-parallax
   for 44/45/47, an injected .sh-b39-wrap for 39) gets a conic-
   gradient mask that sweeps open around the ring's center, while the
   graphic inside keeps its own baked ring mask and rotates into its
   resting angle. Nested masks multiply naturally; the earlier
   same-element mask-composite:intersect attempt left a ~1px residue
   of the conic layer along the element's box edge (visible as a
   faint hairline across the card). The sweep window stays fixed in
   card space while the marks rotate into it. Sweep geometry is per
   treatment: conic center = the ring's real center in the wrapper's
   box, window tuned to the arc the card actually shows so the whole
   0..1 range produces visible change; a soft trailing edge fades
   each mark in as the edge passes instead of hard-slicing it. */
.sh-build-card .cbe-f44-arch,
.sh-build-card .cbe-f45-arch,
.sh-build-card .cbe-f47-arch,
.sh-build-card .cbe-f39-sym { animation: none; }
/* Extra runway above the strip — at the sheet's default zoom the row's
   top edge otherwise sits high enough in the first viewport that the
   scrub is ~90% done before the user ever scrolls. */
.sh-buildline { margin-top: 320px; }
.sh-build-card {
  --sweep-from: 275deg; --sweep-span: 170deg; --sweep-soft: 10deg;
  --sweep-at: 50% 112%;
}
.sh-build-card.sh-b39 {
  --sweep-from: 340deg; --sweep-span: 135deg; --sweep-soft: 10deg;
  --sweep-at: 18% 118%;
}
.sh-build-card.sh-b44 { --sweep-soft: 24deg; }
.sh-build-card .cbe-parallax,
.sh-build-card .sh-b39-wrap {
  will-change: auto;
  -webkit-mask: conic-gradient(from var(--sweep-from) at var(--sweep-at),
        #000 calc(var(--build, 1) * var(--sweep-span)),
        transparent calc(var(--build, 1) * var(--sweep-span) + var(--sweep-soft)));
          mask: conic-gradient(from var(--sweep-from) at var(--sweep-at),
        #000 calc(var(--build, 1) * var(--sweep-span)),
        transparent calc(var(--build, 1) * var(--sweep-span) + var(--sweep-soft)));
}
.sh-b39-wrap { position: absolute; inset: 0; }
.sh-build-card .cbe-f44-arch { transform: translateX(-50%) rotate(calc((1 - var(--build, 1)) * -45deg)); }
.sh-build-card .cbe-f45-arch { transform: translateX(-50%) rotate(calc((1 - var(--build, 1)) * 50deg)); }
.sh-build-card .cbe-f47-arch { transform: translateX(-50%) rotate(calc((1 - var(--build, 1)) * -50deg)); }
.sh-build-card .cbe-f39-sym  { transform: translateY(56%) rotate(calc((1 - var(--build, 1)) * 12deg)); }
"""

BUILD_JS = """
  /* ---- build-in strip (round 40): duplicate winners row, each ring
     assembles as its card scrolls into view. Scrubbed, not timed —
     scroll position drives --build per card (staggered left to
     right), so scrolling back up un-builds it. Cards reuse the
     winners' display numbers (same treatments, demo strip) and
     deliberately skip DISPLAY_N — the graveyard's Python-side
     numbering is seeded from len(WINNERS) and must not shift. */
  var gridBuild = document.getElementById('gridBuild');
  WINNERS.forEach(function (id, i) {
    var card = document.createElement('div');
    card.className = 'sh-card sh-build-card sh-b' + id;
    var lbl = document.createElement('p');
    lbl.className = 'sh-lbl';
    lbl.innerHTML = '<b>' + padNum(i + 1) + ' — ' + F_NAME[id] + '</b><span>front · build-in</span>';
    var frame = document.createElement('div');
    frame.className = 'sh-frame sh-frame-front';
    var scale = document.createElement('div');
    scale.className = 'sh-scale';
    var boardEl = board('front', id);
    /* F39's sym originally had no .cbe-parallax wrapper — round 41
       gave it one for the app's parallax, so the conic sweep now
       lands on that wrapper via the shared .cbe-parallax rule and
       this injection is only a fallback for a wrapper-less clone
       (guard added round 43: injecting a second wrapper would
       double-mask the sweep). */
    var sym39 = boardEl.querySelector('.cbe-f39-sym');
    if (sym39 && !boardEl.querySelector('.cbe-parallax')) {
      var wrap39 = document.createElement('div');
      wrap39.className = 'sh-b39-wrap';
      sym39.parentNode.insertBefore(wrap39, sym39);
      wrap39.appendChild(sym39);
    }
    scale.appendChild(boardEl);
    frame.appendChild(scale);
    card.appendChild(lbl);
    card.appendChild(frame);
    gridBuild.appendChild(card);
    frame.addEventListener('click', function () { openLb(i); });
  });
  var shScroll = document.getElementById('shScroll');
  var buildCards = Array.prototype.slice.call(gridBuild.children);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    buildCards.forEach(function (c) { c.style.setProperty('--build', 1); });
  } else {
    var buildRaf = null;
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var updateBuild = function () {
      buildRaf = null;
      var vh = shScroll.clientHeight;
      buildCards.forEach(function (c, i) {
        var top = c.getBoundingClientRect().top;
        /* 0 as the card's top crosses 92% of the viewport, 1 by the
           time it reaches ~37% — the build plays out across the
           middle of the journey, with a small left-to-right stagger. */
        var raw = (vh * 0.92 - top) / (vh * 0.55);
        var p = Math.max(0, Math.min(1, raw - i * 0.09));
        c.style.setProperty('--build', easeOut(p).toFixed(4));
      });
    };
    shScroll.addEventListener('scroll', function () {
      if (!buildRaf) buildRaf = requestAnimationFrame(updateBuild);
    }, { passive: true });
    updateBuild();
  }
"""

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Canvas Book Ends — Treatment Sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
{css_root}
{css_finale}
{css_cbe}

/* ================= sheet chrome ================= */
/* 20 simultaneous CSS masks at the app's native 4096px would blow GPU
   texture memory — the sheet swaps every mask to 1024px copies. */
.cbe-sym,
.bib-finale-shape-layer {{ -webkit-mask-image: url('bib-shape.1k.png'); mask-image: url('bib-shape.1k.png'); }}
.cbe-sym[data-mask="2"] {{ -webkit-mask-image: url('bib-shape-2.1k.png'); mask-image: url('bib-shape-2.1k.png'); }}
.cbe-sym[data-mask="3"] {{ -webkit-mask-image: url('bib-shape-3.1k.png'); mask-image: url('bib-shape-3.1k.png'); }}
.cbe-sym[data-mask="4"] {{ -webkit-mask-image: url('bib-shape-4.1k.png'); mask-image: url('bib-shape-4.1k.png'); }}
.cbe-sym[data-mask="5"] {{ -webkit-mask-image: url('bib-shape-5.1k.png'); mask-image: url('bib-shape-5.1k.png'); }}
/* F15's crop is a single symbol zoomed to 640% — the 1k swap above
   is for GPU headroom across ~20 simultaneous masks in the contact
   grid, and stretched that far it shows visible softness at the
   crop edge. One symbol at this scale doesn't need the downgrade. */
.cbe-frame-sym {{ -webkit-mask-image: url('bib-shape.png'); mask-image: url('bib-shape.png'); }}
* {{ box-sizing: border-box; }}
body.sheet {{
  margin: 0;
  background: #eceef1;
  font-family: var(--font-sans);
  color: var(--text-strong);
  -webkit-font-smoothing: antialiased;
  height: 100vh;
  overflow: hidden;
}}
.sh-scroll {{ height: 100vh; overflow-y: auto; overflow-x: hidden; }}
.sh-head {{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 40px 20px;
  background: #fff;
  border-bottom: 1px solid var(--line);
}}
.sh-id .sh-eyebrow {{
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--text-subtle);
  margin: 0 0 6px;
}}
.sh-id h1 {{
  font-weight: 300; font-size: 32px; letter-spacing: -1.2px;
  margin: 0; line-height: 1;
}}
.sh-sec {{ padding: 36px 40px 10px; }}
.sh-cutline {{
  margin: 140px 0 96px;
  border-top: 1px solid rgba(15, 23, 42, 0.28);
  padding-top: 14px;
}}
.sh-cutline span {{
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #9b9dac;
}}
#gridCut .sh-frame {{ opacity: 0.82; }}
.sh-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, 372px);
  gap: 28px 22px;
  justify-content: start;
}}
.sh-lbl {{
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-subtle);
  margin: 0 0 8px;
}}
.sh-lbl b {{ color: var(--text-strong); font-weight: 600; }}
.sh-frame {{
  width: 372px; overflow: hidden;
  background: var(--card-bg);
  box-shadow: 0 1px 3px rgba(16,24,40,.16), 0 0 0 1px rgba(16,24,40,.05);
  cursor: zoom-in;
}}
.sh-frame:hover {{ box-shadow: 0 2px 10px rgba(16,24,40,.2), 0 0 0 1px var(--accent); }}
.sh-frame-front {{ height: 465px; }}
.sh-frame-back  {{ height: 414px; }}
.sh-scale {{ width: 760px; transform: scale(0.4895); transform-origin: top left; }}
.sh-board-front {{
  width: 760px; height: 950px;
  position: relative; overflow: hidden;
  background: var(--card-bg);
}}
.sh-board-front > .cbe-ff {{ height: 100%; }}
/* lightbox — prefixed .cbe-rvlb (review-lightbox) so it can never
   collide with the app's own .lb meta-label class reused in the
   extracted templates (that collision is what hid every label the
   first time this sheet shipped — never reuse a bare 2-letter class
   for sheet-only chrome again). */
.cbe-rvlb {{
  position: fixed; inset: 0; z-index: 99;
  display: none; align-items: center; justify-content: center;
  flex-direction: column; gap: 14px;
  background: rgba(14, 18, 26, 0.66);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  cursor: zoom-out;
}}
.cbe-rvlb.open {{ display: flex; }}
.cbe-rvlb-stage {{ transform-origin: center center; box-shadow: 0 12px 60px rgba(0,0,0,.5); }}
.cbe-rvlb-cap {{
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,.85);
}}
.cbe-rvlb-cap i {{ font-style: normal; color: rgba(255,255,255,.5); margin: 0 10px; }}

{BUILD_CSS}
@media print {{
  body.sheet {{ background: #fff; }}
  .sh-grid {{ grid-template-columns: repeat(2, 372px); }}
  .cbe-rvlb {{ display: none !important; }}
  .sh-frame {{ box-shadow: 0 0 0 1px #ddd; }}
}}
</style>
</head>
<body class="sheet">
<div class="sh-scroll" id="shScroll">

<header class="sh-head">
  <div class="sh-id">
    <p class="sh-eyebrow">Canvas Book Ends · Cover-Treatment Lab</p>
    <h1>Treatment Sheet</h1>
  </div>
</header>

<section class="sh-sec">
  <div class="sh-grid" id="gridFronts"></div>
  <div class="sh-cutline sh-buildline"><span>Build-in — scroll</span></div>
  <div class="sh-grid" id="gridBuild"></div>
  <div class="sh-grid" id="gridCut"></div>
  <!--GY-->
</section>
</div>

{templates}

<div class="cbe-rvlb" id="cbeRvlb"><div class="cbe-rvlb-stage" id="cbeRvlbStage"></div><div class="cbe-rvlb-cap" id="cbeRvlbCap"></div></div>

<script>
(function () {{
  'use strict';
{engine}

  /* ---- sheet runtime (mirror of the app's render fill) ----
     titleOverride powers the COLOSSUS length-test strip: swap
     CONTENT.title in for this one render, then restore it — CONTENT
     is a shared singleton read by both the [data-cbe] fill loop and
     the F10 accent-word logic below. */
  function renderTreatment(kind, id, titleOverride) {{
    var tpl = document.getElementById('cbe-' + kind + '-' + id);
    var node = tpl.content.firstElementChild.cloneNode(true);
    var savedTitle = CONTENT.title;
    if (titleOverride) CONTENT.title = titleOverride;
    node.querySelectorAll('[data-cbe]').forEach(function (el) {{
      var key = el.dataset.cbe;
      if (CONTENT[key] != null) el.textContent = CONTENT[key];
    }});
    node.querySelectorAll('[data-cbe-gen]').forEach(function (m) {{
      var g = GENMAP[m.dataset.cbeGen];
      if (g) g(m);
    }});
    if (id === '02') node.style.setProperty('--cbe-rot', ROT + 'deg');
    if (kind === 'front' && id === '10') accentTitle(node, 1);
    if (kind === 'front' && id === '12') accentTitle(node, 2);
    if (titleOverride) CONTENT.title = savedTitle;
    return node;
  }}

  function isColossus(kind, id) {{
    return kind === 'front' && (id === '08' || id === '09' || id === '10' || id === '12');
  }}

  /* fitTitle needs real layout — clientWidth/clientHeight on a node
     that isn't yet connected to the document (or sits under a
     display:none ancestor) return 0. Every call site below builds
     its DOM fully, ATTACHES it, then calls this. Mirrors the app's
     0.85 scale for F12 COLOSSUS·DUO ("slightly smaller" than F10). */
  function fitColossusIfNeeded(kind, id, boardEl) {{
    if (!isColossus(kind, id)) return;
    var wrap = boardEl.querySelector('.cbe-ff-title-wrap');
    var titleEl = boardEl.querySelector('.cbe-ff-title');
    var fitScale = id === '12' ? 0.85 : 1;
    if (wrap && titleEl) fitTitle(titleEl, {{ maxWidth: wrap.clientWidth * fitScale, maxHeight: wrap.clientHeight * fitScale }});
  }}

  function board(kind, id, titleOverride) {{
    var b = document.createElement('div');
    b.className = kind === 'front' ? 'sh-board-front' : 'sh-board-back';
    b.appendChild(renderTreatment(kind, id, titleOverride));
    return b;
  }}

  var ORDER = [];
  /* Presentation numbering (round 30, Bryan: "renumber every 01 02 03,
     etc … so its easy to reference in presentation"). The F##/B## ids
     stay the storage/sort identity everywhere else (templates, CSS,
     the F_T/B_T roster) — this is purely a display-label swap: one
     running sequence across the winners grid, continued by the
     graveyard's own numbering below (seeded from WINNERS.length). */
  var DISPLAY_N = 0;
  function padNum(n) {{ return (n < 10 ? '0' : '') + n; }}
  function buildGrid(kind, gridId, idFilter) {{
    var grid = document.getElementById(gridId);
    var idsForSide = kind === 'front' ? F_IDS : B_IDS;
    if (idFilter) idsForSide = idsForSide.filter(function (id) {{ return idFilter.indexOf(id) !== -1; }});
    var namesForSide = kind === 'front' ? F_NAME : B_NAME;
    idsForSide.forEach(function (id) {{
      var card = document.createElement('div');
      card.className = 'sh-card';
      DISPLAY_N++;
      var num = padNum(DISPLAY_N);
      var lbl = document.createElement('p');
      lbl.className = 'sh-lbl';
      lbl.innerHTML = '<b>' + num + ' — ' + namesForSide[id] + '</b><span>' + (kind === 'front' ? 'front' : 'back') + '</span>';
      var frame = document.createElement('div');
      frame.className = 'sh-frame ' + (kind === 'front' ? 'sh-frame-front' : 'sh-frame-back');
      var scale = document.createElement('div');
      scale.className = 'sh-scale';
      var boardEl = board(kind, id);
      scale.appendChild(boardEl);
      frame.appendChild(scale);
      card.appendChild(lbl);
      card.appendChild(frame);
      grid.appendChild(card);
      fitColossusIfNeeded(kind, id, boardEl);
      var idx = ORDER.length;
      ORDER.push({{ kind: kind, id: id, num: num }});
      frame.addEventListener('click', function () {{ openLb(idx); }});
    }});
  }}

  /* ---- lightbox ---- */
  var rvlb = document.getElementById('cbeRvlb');
  var rvlbStage = document.getElementById('cbeRvlbStage');
  var rvlbCap = document.getElementById('cbeRvlbCap');
  var current = -1;

  function openLb(idx) {{
    current = (idx + ORDER.length) % ORDER.length;
    var item = ORDER[current];
    /* 'open' first — the stage must have a real display:flex box
       BEFORE fitColossusIfNeeded measures it. */
    rvlb.classList.add('open');
    var boardEl = board(item.kind, item.id);
    rvlbStage.replaceChildren(boardEl);
    fitColossusIfNeeded(item.kind, item.id, boardEl);
    var h = item.kind === 'front' ? 950 : 845;
    var s = Math.min((window.innerWidth * 0.9) / 760, (window.innerHeight * 0.86) / h);
    rvlbStage.style.transform = 'scale(' + s + ')';
    rvlbStage.style.width = '760px';
    rvlbStage.style.height = Math.round(h * s) / s + 'px';
    rvlbStage.style.marginTop = -Math.round(h * (1 - s) / 2) + 'px';
    rvlbStage.style.marginBottom = -Math.round(h * (1 - s) / 2) + 'px';
    var itemName = item.kind === 'front' ? F_NAME[item.id] : B_NAME[item.id];
    rvlbCap.innerHTML = item.num + ' — ' + itemName +
      '<i>·</i>' + (item.kind === 'front' ? 'front cover' : 'back cover') +
      '<i>·</i>' + (current + 1) + ' / ' + ORDER.length;
  }}
  function closeLb() {{ rvlb.classList.remove('open'); current = -1; }}
  rvlb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) {{
    if (!rvlb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') openLb(current + 1);
    if (e.key === 'ArrowLeft') openLb(current - 1);
  }});

  /* Winners above the line, everything else quarantined below it
     (Bryan, round 19: "43, 44, 45, and 46 are the winners, put all
     of the losers under a line with some space"). */
  var WINNERS = [{WINNERS_JS}];
  var CUT = F_IDS.filter(function (id) {{ return WINNERS.indexOf(id) === -1; }});
  buildGrid('front', 'gridFronts', WINNERS);
  if (CUT.length) buildGrid('front', 'gridCut', CUT);
{BUILD_JS}
}})();
</script>
</body>
</html>
"""

# --- graveyard: baked static cards of every killed treatment (round 21).
#     Recovered by the wf_2c333f91-a84 miners into graveyard/era*.html;
#     each file carries its own scoped <style> + .gy-card blocks. We strip
#     any standalone-page wrapper tags and inline the rest verbatim. ---
gy_html = ''
gy_dir = ROOT / 'graveyard'
if gy_dir.is_dir():
    frags = []
    for fp in sorted(gy_dir.glob('era*.html')):
        txt = fp.read_text()
        txt = re.sub(r'<!doctype[^>]*>|</?html[^>]*>|</?head[^>]*>|</?body[^>]*>|<meta[^>]*>|<title>.*?</title>|<link[^>]*>', '', txt, flags=re.I | re.S)
        frags.append(txt)
    joined = '\n'.join(frags)
    n = joined.count('class="gy-card"')
    if n:
        # Presentation numbering (round 30), same rule as the JS side above:
        # drop each card's stored O##/F##/P## id + its "killed round N" /
        # "superseded round N" span, replace with a running "NN — Name"
        # continuing straight out of the winners grid. The era*.html files
        # on disk keep their original ids untouched — this rewrite only
        # touches the in-memory string used to build review.html.
        _gy_counter = {'n': len(WINNERS)}

        def _gy_renumber(m):
            _gy_counter['n'] += 1
            return '<b>' + f"{_gy_counter['n']:02d}" + ' — ' + m.group(1) + '</b>'

        joined = re.sub(
            r'<b>[OFP]\d+[A-Z]?\s*(?:—|&mdash;)\s*([^<]*)</b><span>[^<]*</span>',
            _gy_renumber,
            joined,
        )
        gy_html = (
            '<style>'
            '.sh-gyline { margin: 160px 0 36px; border-top: 2px solid rgba(15,23,42,0.45); }'
            '.sh-gygrid { display: grid; grid-template-columns: repeat(auto-fill, 372px); gap: 28px 22px; justify-content: start; }'
            '.gy-card { min-width: 0; }'
            '.sh-gygrid > :not(.gy-card):not(style) { display: contents; }'
            ".gy-lbl { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Fira Code', ui-monospace, monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); margin: 0 0 8px; }"
            '.gy-lbl b { color: var(--text-strong); font-weight: 600; }'
            '.gy-frame { width: 372px; height: 465px; overflow: hidden; background: var(--card-bg); box-shadow: 0 1px 3px rgba(16,24,40,.16), 0 0 0 1px rgba(16,24,40,.05); opacity: 0.92; }'
            '.gy-scale { width: 760px; transform: scale(0.4895); transform-origin: top left; }'
            '.gy-board { width: 760px; height: 950px; position: relative; overflow: hidden; background: var(--card-bg); }'
            '</style>'
            '<div class="sh-cutline sh-gyline"><span>The graveyard</span></div>'
            f'<div class="sh-gygrid">{joined}</div>'
        )
page = page.replace('<!--GY-->', gy_html)

(ROOT / 'review.html').write_text(page)
print(f'review.html written — {len(page)} bytes')
