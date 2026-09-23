// VARIANT STUDIO — "3 — the poster pack (taste-critical)" (PLAN.md).
//
// ONE fictional brand, RIDGELINE ROAST (small-batch coffee) — same demo
// energy as Figma Weave's own Café Cacique reference, zero copied copy:
// ~10 typography-led ad comps as pure inline SVG (no photos, no external
// anything), each reading as a FINISHED AD rather than a greeked study.
// Drawing on run/artifacts.jsx's established "produced media" voice — warm
// paper, graphite ink, sparing Brand500 accents, Fira Code meta, a corner
// registration tick — but this file is fully self-contained (artifacts.jsx
// exports no internals to share) so its own small seeded-RNG/chrome helpers
// below intentionally mirror that file's conventions rather than import
// them.
//
// Seed drives, in a single continuous mulberry32 sequence (same discipline
// as artifacts.jsx — no Math.random anywhere): which of the 10 LAYOUTS runs,
// which of the 3 COLORWAYS paints it, which HEADLINE it sets, and every
// per-layout "jitter" number (mark rotation, badge radius, bar heights, ...)
// — so a given seed always paints identically and a new seed (state.jsx
// mints one per variant slot, or seed+1 on a per-card Re-run) visibly
// reshuffles the comp without ever looking random-noise "off-brand".
//
// Every layout shares one 4:5 poster frame (POSTER_ASPECT) — variant cards
// and the GENERATE node's own preview both size their frame off this fixed
// constant, no per-seed lookup needed (contrast run/artifacts.jsx's
// per-format aspect table, which this pack doesn't need since it only ever
// paints one kind of artifact).

import { useId, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Seeded RNG — mulberry32, same implementation as run/artifacts.jsx (kept
// local rather than imported — see file header). Deterministic, no deps.
// ---------------------------------------------------------------------------
function mulberry32(a) {
  let t = a >>> 0
  return function rand() {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
function ri(rand, min, max) {
  return Math.floor(min + rand() * (max - min + 1))
}
function pct(rand, min, max) {
  return min + rand() * (max - min)
}
function pick(rand, arr) {
  return arr[ri(rand, 0, arr.length - 1)]
}
function hex4(seed) {
  return (seed % 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

// ---------------------------------------------------------------------------
// Copy — invented fresh, in the register PLAN.md's two examples set (short,
// confident, small-batch-roaster energy). No copy is borrowed from any real
// brand or reference deck.
// ---------------------------------------------------------------------------
const HEADLINES = [
  'ALTITUDE IS A FLAVOR.',
  'ROASTED TUESDAY. GONE FRIDAY.',
  'SLOW ROAST. FAST SELLOUT.',
  'GROWN HIGH. BREWED HONEST.',
  'SMALL BATCH, LOUD FLAVOR.',
  'EVERY BAG HAS A HILL TO CLIMB.',
  'PICKED BY HAND. ROASTED BY US.',
  'ONE RIDGE. ONE ROAST. ONE CUP.',
  "BITTER IS A CHOICE. WE DIDN'T MAKE IT.",
  'WAKE UP THE HARD WAY.',
]
const TAGLINE = 'SMALL-BATCH COFFEE ROASTERS'
const ORIGINS = ['HIGHLAND BLOCK NO.4', 'NORTH RIDGE LOT 12', 'CLOUDLINE PARCEL 7', 'BACKSLOPE LOT 3', 'SUMMIT ROW NO.9']
const PROCESSES = ['WASHED', 'NATURAL', 'HONEY', 'ANAEROBIC']
const ROASTS = ['LIGHT ROAST', 'FILTER ROAST', 'OMNI ROAST', 'MEDIUM ROAST']
const TASTING_NOTES = [
  'STONE FRUIT', 'BROWN SUGAR', 'CEDAR', 'DARK CHOCOLATE', 'BERGAMOT',
  'TOASTED HAZELNUT', 'RED APPLE', 'CARAMEL', 'BLACK TEA', 'MAPLE',
]
const CUPPING_ATTRS = ['AROMA', 'ACIDITY', 'BODY', 'SWEETNESS', 'FINISH']

function shuffleSample(rand, arr, n) {
  const pool = [...arr]
  const out = []
  for (let i = 0; i < n && pool.length; i += 1) {
    out.push(pool.splice(ri(rand, 0, pool.length - 1), 1)[0])
  }
  return out
}

// ---------------------------------------------------------------------------
// Colorways — 3 seeded palettes (PLAN.md: "3 seeded colorways"), a discrete
// rotation rather than artifacts.jsx's continuous hue-rotate filter — print
// stock/ink variety reads more like a real ad library than a hue slider
// would. `headlineInk` is the one field that ever diverges from `ink` (the
// rust colorway prints headlines in a warm terracotta so Brand500 stays the
// SPARING accent PLAN.md asks for, never the dominant color).
// ---------------------------------------------------------------------------
const COLORWAYS = [
  {
    id: 'paper',
    bg: '#F4EEE2',
    bg2: '#E9DFC9',
    ink: '#2A251D',
    inkSoft: '#8C8271',
    accent: '#1858EE',
    headlineInk: '#2A251D',
    // REAL CAR DELIVERABLES — the duotone wash opacity photoBase() lays over
    // a real photo (below), kept light on purpose: the photo, not the wash,
    // should read as the dominant visual. The vignette (always-on, see
    // vignetteDefs) plus each layout's own local scrim (SCRIM_OPACITY,
    // below) do the actual legibility work at the specific spots type sits.
    photoTint: 0.22,
  },
  {
    id: 'charcoal',
    bg: '#241F19',
    bg2: '#2E2820',
    ink: '#F4EEE2',
    inkSoft: '#B7AC98',
    accent: '#5B8CFF',
    headlineInk: '#F4EEE2',
    photoTint: 0.3,
  },
  {
    id: 'rust',
    bg: '#F1E3CF',
    bg2: '#E6CBA3',
    ink: '#3A2617',
    inkSoft: '#8C6A4A',
    accent: '#1858EE',
    headlineInk: '#B5502D',
    photoTint: 0.2,
  },
]

const META_FONT = "'Fira Code','JetBrains Mono',ui-monospace,monospace"
const HEAD_FONT = "'Inter','Helvetica Neue',Arial,sans-serif"

// ---------------------------------------------------------------------------
// REAL CAR DELIVERABLES (PLAN.md "## REAL CAR DELIVERABLES") — the art layer
// swap. The same four real campaign photos every image-family deliverable in
// the app draws from (this file keeps its own copy — see file header: this
// pack is deliberately self-contained rather than importing run/artifacts.jsx
// internals). Native w/h feed photoForFrame's aspect-honesty pick below.
// ---------------------------------------------------------------------------
export const CAR_PHOTOS = [
  { id: 'studio', src: '/assets/deliverables/car-studio.jpg', w: 1143, h: 1200 },
  { id: 'landscape', src: '/assets/deliverables/car-landscape.jpg', w: 1000, h: 667 },
  { id: 'villa', src: '/assets/deliverables/car-villa.jpg', w: 1400, h: 613 },
  { id: 'driver', src: '/assets/deliverables/car-driver.jpg', w: 1200, h: 896 },
]

// One seeded draw, weighted toward whichever photo's native aspect is
// closest to the target frame (closest = weight 4, then 3/2/1 down the
// ranking) — "aspect honesty" (PLAN.md) without ever collapsing a whole wall
// of cards onto the SAME single photo: all four stay reachable so a run with
// several Graphic/Generate nodes still shows real variety, not a repeat.
export function photoForFrame(rand, frameW, frameH) {
  const frameAspect = frameW / frameH
  const ranked = [...CAR_PHOTOS].sort(
    (a, b) => Math.abs(Math.log(a.w / a.h / frameAspect)) - Math.abs(Math.log(b.w / b.h / frameAspect)),
  )
  const weights = [4, 3, 2, 1]
  let roll = rand() * weights.reduce((s, x) => s + x, 0)
  for (let i = 0; i < ranked.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) return ranked[i]
  }
  return ranked[0]
}

// Vignette — a fixed black top+bottom fade (never tinted per-colorway: real
// ad vignettes read as neutral-dark regardless of brand palette) sitting
// between the photo and the colorway wash's own flat tint. Every layout below
// parks its real text near an edge (never dead-center), so this alone buys
// most of the legibility scrim PLAN.md asks for; the few layouts that DO
// center content add their own local scrim on top (see each layout).
function vignetteDefs(uid) {
  return (
    <linearGradient id={`${uid}vg`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
      <stop offset="24%" stopColor="#000000" stopOpacity="0" />
      <stop offset="68%" stopColor="#000000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.54" />
    </linearGradient>
  )
}
// The art-layer swap itself — every layout's old `<rect fill={cw.bg}>` first
// paint call becomes this: the real photo (object-fit:cover via
// preserveAspectRatio="xMidYMid slice" — never letterboxed/stretched, PLAN.md
// "Aspect honesty"), the colorway's own duotone wash so it stays on-brand,
// then the neutral vignette for edge legibility. `photo` null (shouldn't
// happen in the demo path, but a graceful floor) falls back to the flat
// colorway bg exactly as before this pass.
function photoBase(uid, photo, w, h, cw) {
  if (!photo) return <rect width={w} height={h} fill={cw.bg} />
  return (
    <>
      <image href={photo.src} x="0" y="0" width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      <rect width={w} height={h} fill={cw.bg} opacity={cw.photoTint} />
      <rect width={w} height={h} fill={`url(#${uid}vg)`} />
    </>
  )
}
// Local scrim — for the handful of layouts whose real text/number/badge
// content sits away from the vignette's own top/bottom edges (dead-center
// compositions, or a tall field list spanning the frame's clear midsection).
// A soft-cornered translucent band in the colorway's own bg, laid AFTER
// photoBase/vignette and BEFORE the type it backs. Flat, colorway-INDEPENDENT
// opacity (not cw.photoTint-relative) — first pass stacked this on top of
// each colorway's own wash, which on charcoal (the darkest bg) compounded
// with the wash + vignette into a near-solid black card, losing the photo
// entirely. A fixed light/heavy pair reads the same across all three washes
// and still leaves the photo as the dominant visual everywhere.
const SCRIM = 0.34
const SCRIM_HEAVY = 0.42
function scrimBand(x, y, w, h, color, opacity, rx = 0) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={color} opacity={opacity} />
}

// Corner registration tick — the SAME L-mark language as a selected node
// card / run/artifacts.jsx's own artifacts, the one signature tying every
// produced-media surface in this app back to the same studio.
function cornerTick(w, h, color) {
  const m = Math.min(w, h) * 0.032 + 6
  const len = Math.min(w, h) * 0.09 + 4
  const sw = Math.max(1.4, Math.min(w, h) * 0.007)
  const x = w - m
  const y = h - m
  return (
    <g stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.8">
      <line x1={x - len} y1={y} x2={x} y2={y} />
      <line x1={x} y1={y - len} x2={x} y2={y} />
    </g>
  )
}
function metaStamp(x, y, text, color, anchor = 'start') {
  return (
    <text x={x} y={y} fill={color} fontFamily={META_FONT} fontSize="9.5" letterSpacing="0.4" textAnchor={anchor}>
      {text}
    </text>
  )
}
function grainDefs(uid, seed) {
  return (
    <filter id={`${uid}g`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={(seed % 97) + 1} stitchTiles="stitch" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.35 0.35 0.35 0 0" />
    </filter>
  )
}
function grainRect(uid, w, h, opacity) {
  return <rect width={w} height={h} filter={`url(#${uid}g)`} opacity={opacity} />
}

// Brand mark — a small angular ridge-line silhouette (three peaks), the
// pack's one recurring "logo" so every layout reads as the same studio's
// work even though the composition changes underneath it.
function ridgeMark(x, y, s, color) {
  return (
    <path
      d={`M ${x} ${y + s * 0.62} L ${x + s * 0.27} ${y + s * 0.06} L ${x + s * 0.48} ${y + s * 0.36} L ${x + s * 0.72} ${y - s * 0.08} L ${x + s} ${y + s * 0.62} Z`}
      fill={color}
    />
  )
}
function wordmark(x, y, size, color, anchor, full) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontFamily={HEAD_FONT}
      fontWeight="800"
      fontSize={size}
      letterSpacing={size * 0.02}
      textAnchor={anchor || 'start'}
    >
      {full ? 'RIDGELINE ROAST' : 'RIDGELINE'}
    </text>
  )
}

// Naive but self-contained word-wrap: no real font-metrics measurement (this
// is a generated illustration, not typeset copy), just an average-char-width
// heuristic tuned for a heavy sans at the sizes this file actually uses.
function wrapText(text, maxWidth, fontSize, weight = 800) {
  const avgChar = fontSize * (weight >= 700 ? 0.6 : 0.53)
  const maxChars = Math.max(4, Math.floor(maxWidth / avgChar))
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines
}
function headlineBlock(lines, x, y, size, color, lineHeight, anchor = 'start') {
  return (
    <g fontFamily={HEAD_FONT} fontWeight="800" fontSize={size} fill={color} textAnchor={anchor} style={{ textTransform: 'uppercase' }}>
      {lines.map((line, i) => (
        <text key={i} x={x} y={y + i * lineHeight} letterSpacing={-size * 0.01}>
          {line}
        </text>
      ))}
    </g>
  )
}

// ===========================================================================
// The 10 layouts. Each receives { rand, uid, w, h, cw (colorway), headline,
// seed, compact } and returns the INNER content of an <svg> (bg through
// chrome) — the Poster component below owns the <svg viewBox> wrapper.
// `compact` (filmstrip thumbs) drops grain + meta stamp + corner tick, same
// convention as run/artifacts.jsx.
// ===========================================================================

// 1 — big-type statement: the headline IS the poster.
function lBigType(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const size = pct(rand, 34, 42)
  const lines = wrapText(headline, w - 48, size)
  const lh = size * 1.02
  const totalH = lines.length * lh
  const startY = h * pct(rand, 0.34, 0.42) - totalH / 2 + size
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(0, startY - size * 1.05, w, totalH + size * 0.55, cw.bg, SCRIM)}
      {ridgeMark(28, 28, 22, cw.accent)}
      {wordmark(60, 44, 11, photo ? '#FFFFFF' : cw.inkSoft, 'start', false)}
      {headlineBlock(lines, 24, startY, size, cw.headlineInk, lh)}
      <rect x="24" y={h - 46} width="34" height="2" fill={cw.accent} />
      {!compact && metaStamp(24, h - 24, TAGLINE, photo ? '#FFFFFF' : cw.inkSoft)}
      {!compact && metaStamp(w - 24, h - 24, `NO.${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft, 'end')}
    </>
  )
}

// 2 — altitude hero: a huge elevation figure + a light contour-line motif.
function lAltitude(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const ft = ri(rand, 5600, 6800)
  const contourY = h * pct(rand, 0.4, 0.48)
  const contours = Array.from({ length: 4 }, (_, i) => {
    const yy = contourY + i * 13
    const amp = 10 - i * 1.6
    const d = `M -10 ${yy} Q ${w * 0.25} ${yy - amp} ${w * 0.5} ${yy} T ${w + 10} ${yy}`
    return <path key={i} d={d} fill="none" stroke={cw.accent} strokeWidth="1" opacity={0.5 - i * 0.09} />
  })
  const lines = wrapText(headline, w - 48, 20)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(0, h * 0.34 - 62, w, 104, cw.bg, SCRIM)}
      {contours}
      <text x="24" y={h * 0.34} fontFamily={HEAD_FONT} fontWeight="800" fontSize="72" fill={cw.headlineInk} letterSpacing="-2">
        {ft.toLocaleString()}
      </text>
      <text x="24" y={h * 0.34 + 22} fontFamily={HEAD_FONT} fontWeight="700" fontSize="14" fill={cw.accent} letterSpacing="2">
        FEET ABOVE SEA LEVEL
      </text>
      {photo && scrimBand(0, h - 30 - (lines.length - 1) * 23 - 26, w, (lines.length - 1) * 23 + 40, cw.bg, SCRIM)}
      {headlineBlock(lines, 24, h - 30 - (lines.length - 1) * 23, 20, photo ? cw.headlineInk : cw.ink, 23)}
      {ridgeMark(w - 58, 26, 26, cw.accent)}
      {!compact && metaStamp(24, 30, 'RIDGELINE', photo ? '#FFFFFF' : cw.inkSoft)}
      {!compact && metaStamp(w - 24, h - 46, `LOT ${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft, 'end')}
    </>
  )
}

// 3 — stacked-repeat wordmark (diagonal texture) behind a single clean card.
function lStackedDiagonal(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const rows = []
  const rowH = 30
  const rotate = -18
  for (let y = -60; y < h + 60; y += rowH) {
    rows.push(
      <text key={y} x="-40" y={y} fontFamily={HEAD_FONT} fontWeight="800" fontSize="22" fill={cw.inkSoft} opacity="0.16" letterSpacing="2">
        {'RIDGELINE '.repeat(6)}
      </text>,
    )
  }
  const cardY = h * pct(rand, 0.36, 0.44)
  const cardH = h * 0.26
  const lines = wrapText(headline, w - 96, 17)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      <g transform={`rotate(${rotate} ${w / 2} ${h / 2})`}>{rows}</g>
      {/* Card is already an opaque scrim — no extra legibility work needed here. */}
      <rect x="0" y={cardY} width={w} height={cardH} fill={cw.bg2} />
      <rect x="0" y={cardY} width={w} height="2" fill={cw.accent} />
      <rect x="0" y={cardY + cardH - 2} width={w} height="2" fill={cw.accent} />
      {headlineBlock(lines, 24, cardY + 30, 17, cw.headlineInk, 21)}
      {!compact && metaStamp(24, h - 24, 'ROASTED IN SMALL BATCHES', photo ? '#FFFFFF' : cw.inkSoft)}
      {!compact && metaStamp(w - 24, h - 24, `${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft, 'end')}
    </>
  )
}

// 4 — stacked-repeat wordmark, horizontal-band variant: a logotype lockup up
// top, availability/price line at the bottom.
function lStackedBands(ctx) {
  const { rand, uid, w, h, cw, seed, compact, photo } = ctx
  const bandH = 46
  const bands = []
  for (let y = h * 0.42, i = 0; y < h - 10; y += bandH, i += 1) {
    bands.push(
      <text
        key={i}
        x={i % 2 === 0 ? 20 : w - 20}
        y={y}
        fontFamily={HEAD_FONT}
        fontWeight="800"
        fontSize="30"
        fill={i % 2 === 0 ? cw.headlineInk : cw.inkSoft}
        opacity={i % 2 === 0 ? 1 : 0.35}
        textAnchor={i % 2 === 0 ? 'start' : 'end'}
        letterSpacing="-0.5"
      >
        ROAST
      </text>,
    )
  }
  const roast = pick(rand, ROASTS)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(0, 14, w, 108, cw.bg, SCRIM)}
      {photo && scrimBand(0, h * 0.42 - 34, w, h - 40 - (h * 0.42 - 34), cw.bg, SCRIM - 0.14)}
      <g transform={`translate(0 -6)`}>
        {ridgeMark(w / 2 - 16, 40, 32, cw.accent)}
        {wordmark(w / 2, 108, 26, cw.headlineInk, 'middle', true)}
      </g>
      <line x1="24" y1={h * 0.36} x2={w - 24} y2={h * 0.36} stroke={cw.inkSoft} strokeWidth="1" opacity="0.35" />
      {bands}
      {/* Bottom band is already opaque — reads fine straight over the photo. */}
      <rect x="0" y={h - 40} width={w} height="40" fill={cw.accent} />
      <text x="24" y={h - 15} fontFamily={META_FONT} fontSize="11" fontWeight="700" fill="#fff" letterSpacing="1">
        {roast} · 12OZ BAG
      </text>
      {!compact && metaStamp(w - 24, h - 15, `${hex4(seed)}`, 'rgba(255,255,255,.75)', 'end')}
    </>
  )
}

// 5 — spec-sheet / label motif: the back-of-bag technical field grid.
function lSpecSheet(ctx) {
  const { rand, uid, w, h, cw, seed, compact, photo } = ctx
  const fields = [
    ['ORIGIN', pick(rand, ORIGINS)],
    ['ALTITUDE', `${ri(rand, 5600, 6800).toLocaleString()} FT`],
    ['PROCESS', pick(rand, PROCESSES)],
    ['ROAST', pick(rand, ROASTS)],
    ['LOT', `RR-${hex4(seed)}`],
  ]
  let y = 118
  const rowH = 42
  const rows = fields.map(([label, value], i) => {
    const el = (
      <g key={label}>
        <text x="24" y={y} fontFamily={META_FONT} fontSize="10" fontWeight="700" fill={cw.inkSoft} letterSpacing="1.5">
          {label}
        </text>
        <text x={w - 24} y={y} fontFamily={HEAD_FONT} fontSize="15" fontWeight="700" fill={cw.headlineInk} textAnchor="end">
          {value}
        </text>
        {i < fields.length - 1 && <line x1="24" y1={y + 14} x2={w - 24} y2={y + 14} stroke={cw.inkSoft} strokeWidth="1" opacity="0.22" />}
      </g>
    )
    y += rowH
    return el
  })
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {/* Header band is already opaque; the field-row zone + footer aren't,
          so they get their own scrim panel over the photo. */}
      {photo && scrimBand(0, 92, w, h - 92 - 46, cw.bg, SCRIM_HEAVY)}
      {photo && scrimBand(0, h - 46, w, 46, cw.bg, SCRIM)}
      <rect x="0" y="0" width={w} height="72" fill={cw.bg2} />
      {ridgeMark(24, 20, 26, cw.accent)}
      {wordmark(60, 38, 15, cw.headlineInk, 'start', false)}
      <text x="60" y="54" fontFamily={META_FONT} fontSize="9.5" fill={cw.inkSoft} letterSpacing="1">
        {TAGLINE}
      </text>
      {rows}
      <rect x="24" y={h - 56} width={w - 48} height="1" fill={cw.inkSoft} opacity="0.3" />
      {!compact && metaStamp(24, h - 24, 'NET WT 12 OZ (340G)', cw.inkSoft)}
      {!compact && metaStamp(w - 24, h - 24, 'SPEC SHEET', cw.inkSoft, 'end')}
    </>
  )
}

// 6 — tasting-note stack: a vertical, numbered technical list.
function lTastingNotes(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const notes = shuffleSample(rand, TASTING_NOTES, 4)
  let y = 168
  const rows = notes.map((note, i) => {
    const el = (
      <g key={note}>
        <text x="24" y={y} fontFamily={META_FONT} fontSize="12" fontWeight="700" fill={cw.accent}>
          {String(i + 1).padStart(2, '0')}
        </text>
        <text x="52" y={y} fontFamily={HEAD_FONT} fontSize="19" fontWeight="700" fill={cw.headlineInk} letterSpacing="-0.2">
          {note}
        </text>
        <line x1="24" y1={y + 14} x2={w - 24} y2={y + 14} stroke={cw.inkSoft} strokeWidth="1" opacity="0.22" />
      </g>
    )
    y += 46
    return el
  })
  const hlLines = wrapText(headline, w - 48, 18)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(0, 22, w, y - 22 + 12, cw.bg, SCRIM_HEAVY)}
      <text x="24" y="52" fontFamily={META_FONT} fontSize="10" fontWeight="700" fill={cw.inkSoft} letterSpacing="2">
        TASTING NOTES
      </text>
      {rows}
      {headlineBlock(hlLines, 24, h - 26 - (hlLines.length - 1) * 22, 18, cw.headlineInk, 22)}
      {ridgeMark(w - 50, 28, 22, cw.accent)}
      {!compact && metaStamp(w - 24, 52, `${hex4(seed)}`, cw.inkSoft, 'end')}
    </>
  )
}

// 7 — badge / stamp composition: a concentric seal centered on the frame.
function lBadge(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const cx = w / 2
  const cy = h * pct(rand, 0.36, 0.42)
  const rOuter = 78
  const ticks = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2
    const r1 = rOuter - 3
    const r2 = rOuter + (i % 2 === 0 ? 7 : 4)
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * r1}
        y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2}
        y2={cy + Math.sin(a) * r2}
        stroke={cw.accent}
        strokeWidth="1.4"
        opacity="0.7"
      />
    )
  })
  const hlLines = wrapText(headline, w - 56, 16)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {/* A seal reads as stamped ON the photo — a solid disc behind the
          rings/type, not just a translucent band, so it actually looks like
          product packaging rather than a legibility patch. */}
      {photo && <circle cx={cx} cy={cy} r={rOuter + 6} fill={cw.bg} opacity="0.92" />}
      {photo && scrimBand(0, h - 30 - (hlLines.length - 1) * 21 - 24, w, (hlLines.length - 1) * 21 + 42, cw.bg, SCRIM)}
      {ticks}
      <circle cx={cx} cy={cy} r={rOuter - 12} fill="none" stroke={cw.accent} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={rOuter - 20} fill="none" stroke={cw.inkSoft} strokeWidth="1" opacity="0.5" />
      {ridgeMark(cx - 16, cy - 22, 32, cw.headlineInk)}
      <text x={cx} y={cy + 30} fontFamily={HEAD_FONT} fontWeight="800" fontSize="12" fill={cw.headlineInk} textAnchor="middle" letterSpacing="1.5">
        SINGLE ORIGIN
      </text>
      <text x={cx} y={cy + 44} fontFamily={META_FONT} fontWeight="700" fontSize="8.5" fill={cw.inkSoft} textAnchor="middle" letterSpacing="1.5">
        EST. RIDGELINE
      </text>
      {headlineBlock(hlLines, w / 2, h - 30 - (hlLines.length - 1) * 21, 16, cw.headlineInk, 21, 'middle')}
      {!compact && metaStamp(24, h - 24, `SEAL NO.${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft)}
    </>
  )
}

// 8 — label sticker: a jar-label rectangle with a corner fold + die-line.
function lLabelSticker(ctx) {
  const { rand, uid, w, h, cw, seed, compact, photo } = ctx
  const note = pick(rand, TASTING_NOTES)
  const origin = pick(rand, ORIGINS)
  const lx = 30
  const ly = 56
  const lw = w - 60
  const lh = h - 130
  const fold = 26
  return (
    <>
      {/* The die-cut negative space around the sticker shows the photo — the
          label itself stays a flat opaque card (unchanged) so it reads as
          real packaging art-directed against a lifestyle shot, not a photo
          with text stamped on top. */}
      {photoBase(uid, photo, w, h, { ...cw, bg: cw.bg2 })}
      <rect x={lx} y={ly} width={lw} height={lh} fill={cw.bg} stroke={cw.inkSoft} strokeWidth="1" strokeDasharray="3 3" opacity="1" />
      <path d={`M ${lx + lw - fold} ${ly} L ${lx + lw} ${ly} L ${lx + lw} ${ly + fold} Z`} fill={cw.bg2} stroke={cw.inkSoft} strokeWidth="1" />
      <g transform={`translate(${lx + 20} ${ly + 46})`}>
        {ridgeMark(0, -20, 28, cw.accent)}
        {wordmark(38, 4, 17, cw.headlineInk, 'start', false)}
      </g>
      <line x1={lx + 20} y1={ly + 66} x2={lx + lw - 20} y2={ly + 66} stroke={cw.inkSoft} strokeWidth="1" opacity="0.3" />
      <text x={lx + 20} y={ly + 96} fontFamily={HEAD_FONT} fontWeight="700" fontSize="14" fill={cw.headlineInk}>
        {note}
      </text>
      <text x={lx + 20} y={ly + 116} fontFamily={META_FONT} fontSize="9.5" fill={cw.inkSoft} letterSpacing="0.5">
        {origin}
      </text>
      <rect x={lx + 20} y={ly + lh - 34} width={lw - 40} height="1" fill={cw.inkSoft} opacity="0.3" />
      <text x={lx + 20} y={ly + lh - 16} fontFamily={META_FONT} fontSize="9" fill={cw.inkSoft} letterSpacing="1">
        {TAGLINE}
      </text>
      {!compact && metaStamp(24, h - 24, `BATCH ${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft)}
      {!compact && metaStamp(w - 24, h - 24, 'DIE LINE — DO NOT PRINT', photo ? '#FFFFFF' : cw.inkSoft, 'end')}
    </>
  )
}

// 9 — minimal wordmark: extremely reductive, almost all negative space.
function lMinimal(ctx) {
  const { rand, uid, w, h, cw, seed, compact, photo } = ctx
  const cy = h * pct(rand, 0.46, 0.52)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(w * 0.14, cy - 66, w * 0.72, 128, cw.bg, SCRIM_HEAVY, 10)}
      {ridgeMark(w / 2 - 13, cy - 44, 26, cw.accent)}
      {wordmark(w / 2, cy + 4, 22, cw.headlineInk, 'middle', false)}
      <rect x={w / 2 - 16} y={cy + 20} width="32" height="2" fill={cw.accent} />
      <text x={w / 2} y={cy + 42} fontFamily={META_FONT} fontSize="9" fill={cw.inkSoft} textAnchor="middle" letterSpacing="2">
        {TAGLINE}
      </text>
      {!compact && metaStamp(w / 2, h - 24, `NO.${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft, 'middle')}
    </>
  )
}

// 10 — cupping score: a small technical scorecard diagram.
function lCupping(ctx) {
  const { rand, uid, w, h, cw, headline, seed, compact, photo } = ctx
  const attrs = CUPPING_ATTRS.map((name) => ({ name, score: pct(rand, 0.58, 0.95) }))
  const barX = 96
  const barW = w - barX - 24
  let y = 130
  const rows = attrs.map((a) => {
    const el = (
      <g key={a.name}>
        <text x="24" y={y + 4} fontFamily={META_FONT} fontSize="10" fontWeight="700" fill={cw.inkSoft} letterSpacing="1">
          {a.name}
        </text>
        <rect x={barX} y={y - 7} width={barW} height="8" rx="4" fill={cw.inkSoft} opacity="0.18" />
        <rect x={barX} y={y - 7} width={barW * a.score} height="8" rx="4" fill={cw.accent} />
      </g>
    )
    y += 26
    return el
  })
  const hlLines = wrapText(headline, w - 48, 16)
  return (
    <>
      {photoBase(uid, photo, w, h, cw)}
      {photo && scrimBand(0, 20, w, y - 20 + 10, cw.bg, SCRIM_HEAVY)}
      <text x="24" y="48" fontFamily={META_FONT} fontSize="10" fontWeight="700" fill={cw.inkSoft} letterSpacing="2">
        CUPPING SCORE
      </text>
      {ridgeMark(w - 50, 28, 22, cw.accent)}
      {rows}
      {headlineBlock(hlLines, 24, h - 30 - (hlLines.length - 1) * 21, 16, cw.headlineInk, 21)}
      {!compact && metaStamp(w - 24, h - 24, `SAMPLE ${hex4(seed)}`, photo ? '#FFFFFF' : cw.inkSoft, 'end')}
    </>
  )
}

const LAYOUTS = [
  lBigType,
  lAltitude,
  lStackedDiagonal,
  lStackedBands,
  lSpecSheet,
  lTastingNotes,
  lBadge,
  lLabelSticker,
  lMinimal,
  lCupping,
]

// One fixed 4:5 frame for the whole pack (PLAN.md part 2: "the artifact
// frame (4:5)") — no per-seed lookup needed, unlike run/artifacts.jsx's
// per-format aspect table.
const W = 320
const H = 400
export const POSTER_ASPECT = `${W} / ${H}`
// FIT + VERSION STEPPER, part A — the numeric twin of POSTER_ASPECT.
// OutputNode.jsx/GenerateNode.jsx feed this to nodes.css's `--cw-stage-ratio`
// custom property (a plain CSS calc() can't parse a `"w / h"` string) so a
// card carrying a delivered stage can size itself off the SAME ratio the
// frame's own `aspect-ratio` uses — see that file's own header comment.
export const POSTER_RATIO = W / H
export const POSTER_LAYOUT_COUNT = LAYOUTS.length

// Layout choice is always the FIRST draw off a fresh generator (both here
// and inside the Poster component's own memo below — the exact same
// relationship run/artifacts.jsx's artifactKind()/Artifact keep, see that
// file's own comment) — so this and the actual rendered poster always agree
// on which of the 10 comps a seed picked, without the two ever sharing a
// generator instance. Exported so state.jsx can pick VARIANT slot seeds
// that don't repeat a layout across one grid — a plain 10-way uniform
// draw per card has a ~61% chance some layout repeats 3+ times in a
// 10-card grid (independently verified), which reads as a lack of
// imagination on a wall that's supposed to sell "10 different comps".
export function posterLayoutIndex(seed) {
  return ri(mulberry32(seed >>> 0), 0, LAYOUTS.length - 1)
}

// WAVE 3 — THE VERB EXPANSION (PLAN.md "### WAVE 3 — CREATIVE CHAIN"). Style
// Reference's own card previews "3 mini swatches derived from its seed"
// (master contract), and a Generate wired to one "LOCKS" its poster's
// colorway to that SAME seed. Both need the identical colorway pick — this
// is that pick, factored out to its own pure step (a fresh mulberry32
// seeded straight off the STYLE node's own seed, first/only draw) so a
// Style Reference card's swatch preview and a locked Generate's actual
// poster always agree for the same seed, with zero shared state between the
// two call sites (SignalNode.jsx / GenerateNode.jsx).
export function colorwayForSeed(seed) {
  return COLORWAYS[ri(mulberry32(seed >>> 0), 0, COLORWAYS.length - 1)]
}

// REAL CAR DELIVERABLES — the photo pick is always the FOURTH draw off a
// fresh generator (layout, colorway, headline, then this), same "replay the
// front of the sequence with a throwaway generator" pattern
// posterLayoutIndex()/colorwayForSeed() already use above — so this and the
// Poster component's own internal pick always agree for a given seed without
// sharing a generator instance. download.js calls this to know WHICH photo
// file to inline as a data URI before rasterizing (see that file).
export function photoForPosterSeed(seed) {
  const rand = mulberry32(seed >>> 0)
  ri(rand, 0, LAYOUTS.length - 1) // layout (unused here)
  ri(rand, 0, COLORWAYS.length - 1) // colorway (unused here)
  pick(rand, HEADLINES) // headline (unused here)
  return photoForFrame(rand, W, H)
}

// ===========================================================================
// Public component — <Poster seed compact className />. Self-contained SVG
// (own defs, uniquely id'd via useId()), pure function of `seed` so many
// instances (a whole 10-card grid, plus filmstrip thumbs, plus a RunPreview
// hero) can render the SAME seed identically without collisions or re-rolls.
// `photoHref` (REAL CAR DELIVERABLES) is download.js's own override: when
// present it's an already-resolved data: URI for whichever photo this seed
// picked, so the rasterized SVG has zero external references left to race
// against canvas draw — see that file's header comment. Every live on-screen
// caller omits it and gets the plain /assets/... path, which the browser
// just loads like any other <img>, no canvas involved.
// ===========================================================================
export default function Poster({ seed = 0, compact = false, className, colorwaySeed, photoHref }) {
  const rawUid = useId()
  const uid = useMemo(() => `rr${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`, [rawUid])

  const content = useMemo(() => {
    const rand = mulberry32(seed >>> 0)
    // Fixed draw order (layout, then colorway, then headline, then photo,
    // then every per-layout jitter number) — same seed always paints
    // identically, and the FIRST draw matches posterLayoutIndex() above
    // exactly.
    const layoutFn = LAYOUTS[ri(rand, 0, LAYOUTS.length - 1)]
    // WAVE 3 — THE VERB EXPANSION. "its poster colorway LOCKS to the
    // style's seed" (master contract, Style Reference). `colorwaySeed` (a
    // connected Style Reference node's own seed, threaded in by
    // GenerateNode.jsx) swaps the colorway OBJECT for an independently-
    // seeded pick via colorwayForSeed — but the draw from `rand` still
    // ALWAYS happens (its result just goes unused when overridden) so every
    // draw AFTER it (headline, photo, per-layout jitter) keeps the exact
    // same SEQUENCE POSITION either way. CDP-found the hard way while
    // verifying this exact wave: skipping the draw outright (an earlier
    // version of this line) shifted headline/jitter to the position
    // colorway used to occupy, so a locked poster visibly changed its
    // HEADLINE too, not just its palette — a real behavior bug, not just a
    // comment inaccuracy. With the draw unconditional, a locked poster
    // still varies its composition/copy normally; only its palette is
    // pinned to the style. Omitted (the default, every pre-existing call
    // site): behaves byte-identically to before this wave — same draw, same
    // result, just never overridden.
    const colorwayDraw = ri(rand, 0, COLORWAYS.length - 1)
    const cw = colorwaySeed != null ? colorwayForSeed(colorwaySeed) : COLORWAYS[colorwayDraw]
    const headline = pick(rand, HEADLINES)
    // REAL CAR DELIVERABLES — one campaign photo, shared by every layout
    // (the frame is fixed 4:5 for the whole pack, so one photoForFrame call
    // covers all 10 rather than a per-layout lookup). `photoHref` swaps in
    // download.js's pre-inlined data URI without changing WHICH photo was
    // picked or disturbing this draw's sequence position.
    const pickedPhoto = photoForFrame(rand, W, H)
    const photo = photoHref ? { ...pickedPhoto, src: photoHref } : pickedPhoto
    const body = layoutFn({ rand, uid, w: W, h: H, cw, headline, seed, compact, photo })
    return (
      <>
        <defs>
          {vignetteDefs(uid)}
          {!compact && grainDefs(uid, seed)}
        </defs>
        {body}
        {!compact && grainRect(uid, W, H, 0.05)}
        {!compact && cornerTick(W, H, cw.accent)}
      </>
    )
  }, [seed, uid, compact, colorwaySeed, photoHref])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
