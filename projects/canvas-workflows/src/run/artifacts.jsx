// ANDREW ROUND — C: THE DARKROOM (C1 "mock artifacts")
// PLAN.md "### C — THE DARKROOM" -> "C1 — mock artifacts".
//
// The produced-artifact set: ~10 bespoke inline-SVG "studies" (one per
// output format, Graphic gets two — a poster/social split for variety —
// which is where the "~10" comes from across exactly 10 formats). No
// network, no binaries, no raster images: everything here is vector shapes
// + greeked bars in the OMNI palette (#1858ee family) over warm neutrals,
// deterministically varied by a per-run `seed` (hue rotation ±12°, greeking
// pattern shuffle) — same seed always paints the same artifact, a NEW seed
// (engine.js mints one per nodeId+runCount) paints a visibly different one.
//
// Format buckets (PLAN.md C1/C3):
//   TEXT_FORMATS (Text/Email/Teams/Doc) — the node card and RunPreview both
//     keep showing the REAL streamed text (unchanged R2 behavior); the
//     artifact here is used ONLY for their filmstrip thumbnail, since a
//     56px-tall thumb of literal paragraph text is illegible anyway.
//   everything else (Graphic/Video/Audio/Presentation/Spreadsheet/Templated
//     Output) — this IS the artifact: the develop tray (OutputNode.jsx) and
//     RunPreview's big view both render it directly.
//
// One continuous seeded RNG sequence per render (mulberry32, seeded from the
// numeric `seed` prop — NOT Math.random, matching engine.js's own
// determinism requirement) drives, in order: which sub-variant a multi-kind
// format uses (Graphic's poster/social split), the accent hue offset, and
// every kind-specific layout number (bar widths, wave heights, grid
// highlights, ...). Consuming ARTIFACT_ASPECT/artifactKind independently
// (OutputNode/Filmstrip need the aspect ratio before they can even size the
// frame that will hold the real render) re-seeds its OWN fresh generator
// from the same `seed` — since kind-selection is always the FIRST draw from
// a fresh generator, both call sites agree on the same kind without sharing
// any mutable state.
//
// Every kind bakes in the SAME small chrome vocabulary so the set reads as
// one design studio's work: a corner registration tick (literally the same
// L-mark language as the node cards' own selection ticks, nodes.css
// `.cw-node.is-selected::before`) and a small Fira Code meta stamp — plus a
// shared, very low-opacity feTurbulence grain over the whole card, the one
// "photographic print" cue tying every format back to the darkroom idea
// even at rest (not just during the develop animation, which is CSS the
// caller owns — see OutputNode.jsx / nodes.css).

import { useId, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Seeded RNG — mulberry32. Deterministic, fast, no dependency; engine.js's
// own non-negotiable is "NO Math.random" and this file shares that spirit
// end to end so a given (nodeId, runCount) always paints identically.
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

// FNV-1a — turns "nodeId:runCount" into the numeric seed engine.js patches
// onto data.output. Deterministic per PLAN.md C2 ("seed = deterministic per
// nodeId+runCount... NO Math.random"); a run counter lives in engine.js
// itself (this file has no notion of "runs").
export function makeSeed(nodeId, runCount) {
  const s = `${nodeId}:${runCount}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function ri(rand, min, max) {
  return Math.floor(min + rand() * (max - min + 1))
}
function pct(rand, min, max) {
  return min + rand() * (max - min)
}
function hex4(seed) {
  return (seed % 0xffff).toString(16).toUpperCase().padStart(4, '0')
}
function mmss(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
// A row of "greeked" (Inter-standing-in) body-text bar widths, seeded.
function bars(rand, n, maxW, minFrac = 0.5, maxFrac = 0.95) {
  return Array.from({ length: n }, () => maxW * pct(rand, minFrac, maxFrac))
}
function barsAt(x, y, widths, color, opacity, hgt = 7, gap = 7) {
  let cy = y
  return widths.map((wd, i) => {
    const el = (
      <rect key={i} x={x} y={cy} width={Math.max(4, wd)} height={hgt} rx={Math.min(2, hgt / 2)} fill={color} opacity={opacity} />
    )
    cy += hgt + gap
    return el
  })
}

// ---------------------------------------------------------------------------
// Palette — OMNI Brand500 family (hue-rotated ±12° per instance below) over
// WARM neutrals (deliberately not the app's own cool --cw-* grays: these are
// meant to read as physical produced media sitting in the instrument, not as
// more app chrome). Video is the one dark/cinematic exception in the set —
// intentional variety, not an inconsistency.
// ---------------------------------------------------------------------------
const PAPER = '#F4EEE2'
const PAPER_2 = '#E9DFC9'
const INK = '#2A251D'
const INK_SOFT = '#8C8271'
const CHARCOAL = '#221D17'
const ACCENT = '#1858EE'
const META_FONT = "'Fira Code','JetBrains Mono',ui-monospace,monospace"

// ---------------------------------------------------------------------------
// REAL CAR DELIVERABLES (PLAN.md "## REAL CAR DELIVERABLES") — the art-layer
// swap for the poster/social/video kinds (Graphic + Video formats). Own copy
// of the four campaign photos (run/posters.jsx keeps an identical one — see
// that file's own header on why this file stays self-contained rather than
// importing across the seam).
// ---------------------------------------------------------------------------
const CAR_PHOTOS = [
  { id: 'studio', src: '/assets/deliverables/car-studio.jpg', w: 1143, h: 1200 },
  { id: 'landscape', src: '/assets/deliverables/car-landscape.jpg', w: 1000, h: 667 },
  { id: 'villa', src: '/assets/deliverables/car-villa.jpg', w: 1400, h: 613 },
  { id: 'driver', src: '/assets/deliverables/car-driver.jpg', w: 1200, h: 896 },
]
// One seeded draw, weighted toward the closest-aspect photo for THIS frame
// (closest = weight 4, then 3/2/1) — aspect honesty without collapsing every
// card of a format onto the same single photo; see posters.jsx's identical
// helper for the full reasoning.
function photoForFrame(rand, frameW, frameH) {
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
const PHOTO_KINDS = new Set(['poster', 'social', 'video'])
// Neutral top+bottom vignette (never colorway-tinted here — this file has no
// colorway concept, just PAPER/CHARCOAL) sitting between the photo and each
// kind's own furniture, so the meta stamp/corner tick/greeked text stay
// legible without the photo going flat.
function vignetteDefs(uid) {
  return (
    <defs>
      <linearGradient id={`${uid}vg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
        <stop offset="26%" stopColor="#000000" stopOpacity="0" />
        <stop offset="66%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.68" />
      </linearGradient>
    </defs>
  )
}
function photoBackdrop(uid, photo, w, h, wash, washOpacity) {
  return (
    <>
      <image href={photo.src} x="0" y="0" width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      {wash && <rect width={w} height={h} fill={wash} opacity={washOpacity} />}
      <rect width={w} height={h} fill={`url(#${uid}vg)`} />
    </>
  )
}

// Corner registration tick — the SAME L-mark language as a selected node
// card (nodes.css `.cw-node.is-selected::before`), the one signature every
// artifact in the set shares so the studio's hand reads consistently.
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
function metaLabel(x, y, text, color, anchor = 'start') {
  return (
    <text x={x} y={y} fill={color} fontFamily={META_FONT} fontSize="10.5" letterSpacing="0.4" textAnchor={anchor}>
      {text}
    </text>
  )
}
// Shared filter defs — hue-rotate (the seeded ±12° accent variation) always
// present; the grain filter (a low baseFrequency feTurbulence remapped to a
// pure black/alpha noise via feColorMatrix, so it works as an overlay on ANY
// background color) is skipped for `compact` renders (filmstrip thumbs —
// invisible at 56px, not worth the paint cost repeated across a whole row).
function defsBlock(uid, hueDeg, seed, includeGrain) {
  return (
    <defs>
      <filter id={`${uid}h`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="hueRotate" values={String(hueDeg)} />
      </filter>
      {includeGrain && (
        <filter id={`${uid}g`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={(seed % 97) + 1}
            stitchTiles="stitch"
            result="n"
          />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.4 0.4 0.4 0 0" />
        </filter>
      )}
    </defs>
  )
}
function grainRect(uid, w, h, opacity) {
  return <rect width={w} height={h} filter={`url(#${uid}g)`} opacity={opacity} />
}

// ---------------------------------------------------------------------------
// Geometry — one viewBox per kind; artifactAspect() (below) hands the SAME
// numbers to the caller as a CSS `aspect-ratio` string so the frame sizes
// itself with zero JS measurement, matching this codebase's Reveal-style
// "no measuring" convention.
// ---------------------------------------------------------------------------
const GEO = {
  poster: { w: 320, h: 400 }, // key-visual poster, 4:5
  social: { w: 320, h: 320 }, // social crop, 1:1
  video: { w: 400, h: 225 }, // video frame, 16:9
  email: { w: 320, h: 256 }, // email render
  deck: { w: 400, h: 225 }, // deck cover, 16:9 title slide
  doc: { w: 300, h: 424 }, // doc page, A4-ish
  sheet: { w: 400, h: 300 }, // spreadsheet grid
  audio: { w: 400, h: 160 }, // audio waveform card
  chat: { w: 320, h: 320 }, // Teams chat card (thumb-only)
  note: { w: 320, h: 256 }, // Text note card (thumb-only)
  template: { w: 300, h: 424 }, // Templated Output — doc shape, dashed placeholders
}

// Text-family formats — real streamed text everywhere except the filmstrip
// thumb (PLAN.md C1/C3). Kept as the canonical list OutputNode.jsx and
// RunPreview.jsx both branch on, so the two seams can never disagree about
// which formats keep their real-content path.
export const TEXT_FORMATS = new Set(['Text', 'Email', 'Teams', 'Doc'])
export function isTextFormat(format) {
  return TEXT_FORMATS.has(format)
}

// Filmstrip thumb badge (PLAN.md C4 "format tag") — short, file-extension-
// flavored abbreviations rather than a truncated format name, on-voice with
// the rest of the app's Fira Code meta tags.
export const FORMAT_ABBR = {
  Graphic: 'GFX',
  Video: 'VID',
  Audio: 'AUD',
  Presentation: 'PPT',
  Spreadsheet: 'XLS',
  'Templated Output': 'TPL',
  Email: 'EML',
  Doc: 'DOC',
  Teams: 'MSG',
  Text: 'TXT',
}

function kindFor(format, rand) {
  switch (format) {
    case 'Graphic':
      return rand() < 0.5 ? 'poster' : 'social'
    case 'Video':
      return 'video'
    case 'Audio':
      return 'audio'
    case 'Presentation':
      return 'deck'
    case 'Spreadsheet':
      return 'sheet'
    case 'Templated Output':
      return 'template'
    case 'Email':
      return 'email'
    case 'Doc':
      return 'doc'
    case 'Teams':
      return 'chat'
    case 'Text':
    default:
      return 'note'
  }
}

// Kind-selection is always the FIRST draw off a fresh generator (both here
// and inside the Artifact component's own memo below) — so this and the
// actual rendered artifact always agree on which sub-variant a seed picked,
// without the two ever sharing a generator instance.
export function artifactKind(format, seed) {
  return kindFor(format, mulberry32(seed >>> 0))
}
export function artifactAspect(format, seed) {
  const g = GEO[artifactKind(format, seed)] || GEO.note
  return `${g.w} / ${g.h}`
}
// FIT + VERSION STEPPER, part A — the numeric twin of artifactAspect(), same
// GEO lookup. nodes.css's `.cw-node--stage-sized` sizes the card off this
// value via a `--cw-stage-ratio` custom property (a plain CSS calc() can't
// parse artifactAspect()'s `"w / h"` string) — see that rule's own header
// comment for the diagnosis/fix this feeds.
export function artifactRatio(format, seed) {
  const g = GEO[artifactKind(format, seed)] || GEO.note
  return g.w / g.h
}

// REAL CAR DELIVERABLES — the photo pick is always the THIRD draw off a
// fresh generator (kind, then hueDeg, then this — matching the Artifact
// component's own memo below), so this and the actual rendered artifact
// always agree on which of the four campaign photos a (format, seed) pair
// picked, without sharing a generator instance — same "replay the front of
// the sequence" pattern artifactKind()/artifactAspect() above already use.
// Returns null for every non-photo kind (email/deck/doc/sheet/audio/chat/
// note/template — PLAN.md scopes the swap to Graphic + Video only), which
// download.js treats as "nothing to inline, rasterize as before."
export function photoForArtifact(format, seed) {
  const rand = mulberry32(seed >>> 0)
  const kind = kindFor(format, rand) // draw 1
  rand() // draw 2 — hueDeg, unused here
  if (!PHOTO_KINDS.has(kind)) return null
  const g = GEO[kind] || GEO.note
  return photoForFrame(rand, g.w, g.h) // draw 3
}

// ===========================================================================
// Kind renderers — each takes { rand, uid, hueDeg, seed, compact, g } and
// returns the INNER content of an <svg> (defs through chrome); the Artifact
// component below owns the actual <svg viewBox> wrapper. `compact` (the
// filmstrip thumb path) drops grain + meta stamp + corner tick — just the
// core artwork, legible at 56px tall.
// ===========================================================================

function kPoster(ctx) {
  const { rand, uid, hueDeg, seed, compact, g, photo } = ctx
  const w = g.w
  const h = g.h
  const headline = pct(rand, 0.56, 0.74) * (w - 48)
  const sub1 = pct(rand, 0.32, 0.5) * (w - 48)
  const sub2 = pct(rand, 0.2, 0.4) * (w - 48)
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      {vignetteDefs(uid)}
      {/* REAL CAR DELIVERABLES — the old accent circle/ring/line "art" is
          gone; a real campaign photo IS the art now (object-fit:cover via
          preserveAspectRatio="xMidYMid slice"). The three greeked bars below
          are the KEPT furniture (a headline+subhead placeholder block, same
          spirit as posters.jsx's real headline text) — just recolored to sit
          on the vignette's dark bottom edge instead of flat paper. */}
      {photo ? photoBackdrop(uid, photo, w, h) : <rect width={w} height={h} fill={PAPER} />}
      <rect x="24" y={h - 108} width={headline} height="16" rx="3" fill={photo ? PAPER : INK} opacity={photo ? 0.94 : 0.86} />
      <rect x="24" y={h - 82} width={sub1} height="9" rx="2" fill={photo ? PAPER : INK_SOFT} opacity={photo ? 0.8 : 0.68} />
      <rect x="24" y={h - 66} width={sub2} height="9" rx="2" fill={photo ? PAPER : INK_SOFT} opacity={photo ? 0.64 : 0.5} />
      {!compact && metaLabel(24, h - 24, `KV · ${hex4(seed)}`, photo ? PAPER : INK_SOFT)}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.055)}
    </>
  )
}

function kSocial(ctx) {
  const { rand, uid, hueDeg, seed, compact, g, photo } = ctx
  const w = g.w
  const h = g.h
  const capW = pct(rand, 0.42, 0.64) * (w - 64)
  const handleW = capW * pct(rand, 0.4, 0.6)
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      {vignetteDefs(uid)}
      {/* The old "blob" image-post placeholder is gone — the real photo
          fills the post itself; the caption band below was ALREADY opaque
          so it needed no legibility work, only the icon chip up top does. */}
      {photo ? photoBackdrop(uid, photo, w, h) : <rect width={w} height={h} fill={PAPER} />}
      <rect
        x="20"
        y="20"
        width="34"
        height="34"
        rx="9"
        fill={photo ? 'rgba(0,0,0,0.32)' : 'none'}
        stroke={photo ? PAPER : INK_SOFT}
        strokeWidth="1.5"
        opacity={photo ? 0.92 : 0.5}
      />
      <circle cx="37" cy="37" r="6" fill={ACCENT} opacity="0.92" />
      <rect x="0" y={h - 60} width={w} height="60" fill={PAPER_2} opacity="0.92" />
      <circle cx="34" cy={h - 30} r="12" fill={ACCENT} opacity="0.55" />
      <rect x="56" y={h - 38} width={capW} height="8" rx="2" fill={INK} opacity="0.75" />
      <rect x="56" y={h - 24} width={handleW} height="7" rx="2" fill={INK_SOFT} opacity="0.55" />
      {!compact && metaLabel(w - 16, 30, 'SOC · 1:1', photo ? PAPER : INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function kVideo(ctx) {
  const { rand, uid, seed, compact, g, photo } = ctx
  const w = g.w
  const h = g.h
  const total = ri(rand, 18, 180)
  const cur = Math.floor(total * pct(rand, 0.25, 0.55))
  const scrub = pct(rand, 0.2, 0.7)
  const cx = w / 2
  const cy = h / 2
  const R = h * 0.24
  const frameNum = String(ri(rand, 10, 999)).padStart(4, '0')
  return (
    <>
      {/* No grain here (see file header): grain is black-at-alpha, invisible
          against a bg already this dark, and the vignette gradient below
          already gives the frame its own texture. */}
      {defsBlock(uid, 0, seed, false)}
      <defs>
        {/* REAL CAR DELIVERABLES — a real photo frame reads as an actual
            video thumbnail (a still pulled off the reel), not just a
            solid-charcoal placeholder — the radial vignette darkens deeper
            than before so the play button/timecode/frame-number chrome
            (kept, unchanged below) still reads crisp over any photo. */}
        <radialGradient id={`${uid}v`} cx="50%" cy="45%" r="75%">
          <stop offset="42%" stopColor={CHARCOAL} stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity={photo ? 0.58 : 0.55} />
        </radialGradient>
      </defs>
      {photo ? (
        <image href={photo.src} x="0" y="0" width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <rect width={w} height={h} fill={CHARCOAL} />
      )}
      <rect width={w} height={h} fill={`url(#${uid}v)`} />
      <g filter={`url(#${uid}h)`}>
        <circle cx={cx} cy={cy} r={R} fill={ACCENT} opacity="0.92" />
      </g>
      <path
        d={`M ${cx - R * 0.32} ${cy - R * 0.46} L ${cx - R * 0.32} ${cy + R * 0.46} L ${cx + R * 0.5} ${cy} Z`}
        fill={PAPER}
      />
      {!compact && (
        <>
          <text x="16" y="26" fill={PAPER} opacity="0.5" fontFamily={META_FONT} fontSize="11" letterSpacing="1">
            FRAME {frameNum}
          </text>
          <text
            x={w - 16}
            y={h - 14}
            textAnchor="end"
            fill={PAPER}
            opacity="0.82"
            fontFamily={META_FONT}
            fontSize="11"
          >
            {mmss(cur)} / {mmss(total)}
          </text>
          <rect x="16" y={h - 8} width={w - 32} height="2" rx="1" fill={PAPER} opacity="0.22" />
          <rect x="16" y={h - 8} width={(w - 32) * scrub} height="2" rx="1" fill={ACCENT} opacity="0.95" />
          {cornerTick(w, h, ACCENT)}
        </>
      )}
    </>
  )
}

function kEmail(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const nameW = pct(rand, 0.26, 0.4) * (w - 60)
  const subjW = pct(rand, 0.42, 0.62) * (w - 60)
  const p1 = bars(rand, ri(rand, 3, 4), w - 48, 0.55, 0.95)
  const p2 = bars(rand, ri(rand, 2, 3), w - 48, 0.45, 0.85)
  const words = ri(rand, 60, 190)
  const heroW = w - 48
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <g filter={`url(#${uid}h)`}>
        <circle cx="40" cy="40" r="14" fill={ACCENT} opacity="0.85" />
      </g>
      <rect x="64" y="30" width={nameW} height="9" rx="2" fill={INK} opacity="0.82" />
      <rect x="64" y="45" width={subjW} height="8" rx="2" fill={INK_SOFT} opacity="0.58" />
      <line x1="24" y1="68" x2={w - 24} y2="68" stroke={INK_SOFT} strokeWidth="1" opacity="0.18" />
      <rect x="24" y="82" width={heroW} height="64" rx="8" fill={ACCENT} opacity="0.08" />
      <g filter={`url(#${uid}h)`}>
        <path
          d={`M ${24 + heroW * 0.26} ${82 + 50} l ${heroW * 0.13} -22 l ${heroW * 0.13} 13 l ${heroW * 0.11} -17 l ${heroW * 0.15} 26 Z`}
          fill={ACCENT}
          opacity="0.48"
        />
        <circle cx={24 + heroW * 0.76} cy={82 + 18} r="7" fill={ACCENT} opacity="0.55" />
      </g>
      {barsAt(24, 162, p1, INK_SOFT, 0.6)}
      {barsAt(24, 162 + p1.length * 14 + 8, p2, INK_SOFT, 0.48)}
      <g filter={`url(#${uid}h)`}>
        <rect x="24" y={h - 34} width="86" height="20" rx="10" fill={ACCENT} opacity="0.92" />
      </g>
      <rect x="38" y={h - 27} width="52" height="6" rx="3" fill={PAPER} opacity="0.9" />
      {!compact && metaLabel(w - 16, 22, `DRAFT · ${words}W`, INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.045)}
    </>
  )
}

function kDeck(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const slides = ri(rand, 4, 6)
  const titleW = pct(rand, 0.5, 0.62) * (w - 64)
  const subW = pct(rand, 0.28, 0.4) * (w - 64)
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <defs>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PAPER} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={PAPER} />
      <rect width={w} height={h} fill={`url(#${uid}d)`} />
      <g filter={`url(#${uid}h)`}>
        <circle cx="40" cy="38" r="7" fill={ACCENT} opacity="0.85" />
        <rect x="52" y="31" width="12" height="12" rx="3" fill={ACCENT} opacity="0.5" />
        <path d="M70 44 L82 24 L94 44 Z" fill={ACCENT} opacity="0.38" />
      </g>
      <rect x="32" y={h * 0.46} width={titleW} height="18" rx="4" fill={INK} opacity="0.88" />
      <rect x="32" y={h * 0.46 + 28} width={subW} height="9" rx="2" fill={INK_SOFT} opacity="0.55" />
      <g filter={`url(#${uid}h)`}>
        <rect x="32" y={h * 0.46 + 44} width={titleW * 0.32} height="2.5" rx="1.25" fill={ACCENT} opacity="0.8" />
      </g>
      {!compact && metaLabel(w - 16, h - 16, `01 / ${slides} SLIDES`, INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function kDoc(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const titleW = pct(rand, 0.4, 0.58) * (w - 56)
  const groups = Array.from({ length: 4 }, () => bars(rand, ri(rand, 3, 5), w - 56, 0.55, 1))
  const pages = ri(rand, 1, 3)
  let cy = 96
  const groupEls = groups.map((grp, gi) => {
    const el = <g key={gi}>{barsAt(28, cy, grp, INK_SOFT, 0.55, 7, 12)}</g>
    cy += grp.length * 19 + 14
    return el
  })
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <rect x="28" y="40" width={titleW} height="14" rx="3" fill={INK} opacity="0.85" />
      <g filter={`url(#${uid}h)`}>
        <rect x="24" y="40" width="4" height="14" fill={ACCENT} opacity="0.8" />
      </g>
      <line x1="28" y1="66" x2={w - 28} y2="66" stroke={INK_SOFT} strokeWidth="1" opacity="0.22" />
      {groupEls}
      {!compact && metaLabel(w / 2, h - 18, `PAGE 1/${pages}`, INK_SOFT, 'middle')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function kSheet(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const cols = ri(rand, 4, 6)
  const rows = ri(rand, 5, 8)
  const padX = 20
  const padY = 18
  const headerH = 22
  const tabsH = 30
  const gridW = w - padX * 2
  const bodyH = h - padY * 2 - tabsH - headerH
  const colW = gridW / cols
  const rowH = bodyH / rows
  const highlightCells = new Set(
    Array.from({ length: 3 }, () => `${ri(rand, 0, rows - 1)}-${ri(rand, 0, cols - 1)}`),
  )
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`
      const cx0 = padX + c * colW
      const cy0 = padY + headerH + r * rowH
      if (highlightCells.has(key)) {
        cells.push(<rect key={`h${key}`} x={cx0} y={cy0} width={colW} height={rowH} fill={ACCENT} opacity="0.12" />)
      }
      if (rand() > 0.35) {
        const vw = colW * pct(rand, 0.3, 0.6)
        cells.push(
          <rect
            key={`v${key}`}
            x={cx0 + colW - vw - 6}
            y={cy0 + rowH / 2 - 3}
            width={vw}
            height="5"
            rx="1.5"
            fill={INK_SOFT}
            opacity="0.4"
          />,
        )
      }
    }
  }
  const vLines = Array.from({ length: cols + 1 }, (_, c) => (
    <line
      key={`vl${c}`}
      x1={padX + c * colW}
      y1={padY}
      x2={padX + c * colW}
      y2={padY + headerH + bodyH}
      stroke={INK_SOFT}
      strokeWidth="1"
      opacity="0.16"
    />
  ))
  const hLines = Array.from({ length: rows + 1 }, (_, r) => (
    <line
      key={`rl${r}`}
      x1={padX}
      y1={padY + headerH + r * rowH}
      x2={padX + gridW}
      y2={padY + headerH + r * rowH}
      stroke={INK_SOFT}
      strokeWidth="1"
      opacity="0.16"
    />
  ))
  const headLabels = Array.from({ length: cols }, (_, c) => (
    <rect
      key={`hl${c}`}
      x={padX + c * colW + 6}
      y={padY + 8}
      width={colW * 0.5}
      height="7"
      rx="2"
      fill={INK}
      opacity="0.55"
    />
  ))
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <g filter={`url(#${uid}h)`}>
        <rect x={padX} y={padY} width={gridW} height={headerH} fill={ACCENT} opacity="0.14" />
      </g>
      {headLabels}
      {cells}
      {vLines}
      {hLines}
      <rect x={padX} y={h - 26} width="50" height="20" rx="4" fill={PAPER} stroke={INK_SOFT} strokeWidth="1" opacity="0.8" />
      <rect x={padX + 54} y={h - 22} width="46" height="16" rx="4" fill={PAPER_2} opacity="0.55" />
      <rect x={padX + 104} y={h - 22} width="46" height="16" rx="4" fill={PAPER_2} opacity="0.4" />
      {!compact && metaLabel(w - 20, 16, `SHEET1 · ${rows}×${cols}`, INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.045)}
    </>
  )
}

function kAudio(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const total = ri(rand, 40, 260)
  const playedFrac = pct(rand, 0.25, 0.6)
  const barsN = 44
  const midY = h * 0.56
  const maxAmp = h * 0.3
  const waveX0 = 76
  const waveX1 = w - 24
  const step = (waveX1 - waveX0) / barsN
  const wave = Array.from({ length: barsN }, (_, i) => {
    const amp = maxAmp * (0.22 + 0.78 * Math.abs(Math.sin(i * 0.7 + seed * 0.001)) * pct(rand, 0.55, 1))
    return { x: waveX0 + i * step, amp, played: i / barsN < playedFrac }
  })
  const playheadX = waveX0 + (waveX1 - waveX0) * playedFrac
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <g filter={`url(#${uid}h)`}>
        <circle cx="38" cy={midY} r="22" fill={ACCENT} opacity="0.92" />
      </g>
      <path d={`M 32 ${midY - 9} L 32 ${midY + 9} L 48 ${midY} Z`} fill={PAPER} />
      <g filter={`url(#${uid}h)`}>
        {wave.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={midY - b.amp}
            width={Math.max(2, step * 0.55)}
            height={b.amp * 2}
            rx="1.5"
            fill={ACCENT}
            opacity={b.played ? 0.85 : 0.26}
          />
        ))}
      </g>
      <line x1={playheadX} y1={midY - maxAmp - 8} x2={playheadX} y2={midY + maxAmp + 8} stroke={ACCENT} strokeWidth="1.5" opacity="0.7" />
      {!compact && metaLabel(waveX0, midY + maxAmp + 24, '0:00', INK_SOFT)}
      {!compact && metaLabel(waveX1, midY + maxAmp + 24, mmss(total), INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.045)}
    </>
  )
}

function kChat(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const lines = bars(rand, ri(rand, 2, 3), w * 0.5, 0.55, 1)
  const bw = w * 0.62
  const bx = 44
  const by = h * 0.36
  const bh = 30 + lines.length * 20
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <g filter={`url(#${uid}h)`}>
        <circle cx="30" cy="30" r="13" fill={ACCENT} opacity="0.85" />
      </g>
      <rect x={bx} y={by} width={bw} height={bh} rx="14" fill={PAPER_2} stroke={INK_SOFT} strokeWidth="1" opacity="0.9" />
      <path d={`M ${bx + 18} ${by + bh} l 10 14 l 6 -14 Z`} fill={PAPER_2} stroke={INK_SOFT} strokeWidth="1" opacity="0.9" />
      {barsAt(bx + 16, by + 18, lines, INK_SOFT, 0.62, 7, 10)}
      {!compact && metaLabel(w - 16, 26, 'TEAMS', INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function kNote(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const headW = pct(rand, 0.45, 0.68) * (w - 56)
  const lines = bars(rand, ri(rand, 3, 5), w - 56, 0.4, 0.92)
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      <rect x="28" y="44" width={headW} height="13" rx="3" fill={INK} opacity="0.85" />
      <g filter={`url(#${uid}h)`}>
        <rect x="28" y="62" width={headW * 0.7} height="3" rx="1.5" fill={ACCENT} opacity="0.85" />
      </g>
      {barsAt(28, 90, lines, INK_SOFT, 0.55, 7, 12)}
      <g filter={`url(#${uid}h)`}>
        <rect x="28" y={h - 34} width="8" height="8" fill={ACCENT} opacity="0.8" />
      </g>
      {!compact && metaLabel(w - 16, 26, 'TEXT', INK_SOFT, 'end')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function kTemplate(ctx) {
  const { rand, uid, hueDeg, seed, compact, g } = ctx
  const w = g.w
  const h = g.h
  const dashGroups = [
    { y: 44, wd: pct(rand, 0.45, 0.6) * (w - 56), ht: 16 },
    { y: 84, wd: w - 56, ht: 46 },
    { y: 148, wd: (w - 56) * pct(rand, 0.7, 0.9), ht: 14 },
    { y: 172, wd: (w - 56) * pct(rand, 0.5, 0.75), ht: 14 },
    { y: 196, wd: (w - 56) * pct(rand, 0.6, 0.85), ht: 14 },
  ]
  return (
    <>
      {defsBlock(uid, hueDeg, seed, !compact)}
      <rect width={w} height={h} fill={PAPER} />
      {dashGroups.map((d, i) => (
        <rect
          key={i}
          x="28"
          y={d.y}
          width={d.wd}
          height={d.ht}
          rx="3"
          fill="none"
          stroke={INK_SOFT}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.55"
        />
      ))}
      <g filter={`url(#${uid}h)`}>
        <path d={`M ${w - 40} 0 L ${w} 0 L ${w} 40 Z`} fill={ACCENT} opacity="0.16" />
        <path d={`M ${w - 40} 0 L ${w} 40`} stroke={ACCENT} strokeWidth="1.5" fill="none" opacity="0.5" />
      </g>
      {!compact && metaLabel(w / 2, h - 18, 'TEMPLATE', INK_SOFT, 'middle')}
      {!compact && cornerTick(w, h, ACCENT)}
      {!compact && grainRect(uid, w, h, 0.05)}
    </>
  )
}

function renderKind(kind, ctx) {
  switch (kind) {
    case 'poster':
      return kPoster(ctx)
    case 'social':
      return kSocial(ctx)
    case 'video':
      return kVideo(ctx)
    case 'email':
      return kEmail(ctx)
    case 'deck':
      return kDeck(ctx)
    case 'doc':
      return kDoc(ctx)
    case 'sheet':
      return kSheet(ctx)
    case 'audio':
      return kAudio(ctx)
    case 'chat':
      return kChat(ctx)
    case 'template':
      return kTemplate(ctx)
    case 'note':
    default:
      return kNote(ctx)
  }
}

// ===========================================================================
// Public component — <Artifact format seed compact className />. Renders a
// complete, self-contained <svg> (own defs/filters, uniquely id'd via
// useId() so many instances can mount at once — a run with several Output
// nodes plus their filmstrip thumbs plus a RunPreview hero all render the
// SAME format+seed pair independently without id collisions). Pure function
// of (format, seed, compact) — memoized so OutputNode's per-chunk re-renders
// during an unrelated text stream don't rebuild this SVG on every tick.
// ===========================================================================
// `photoHref` (REAL CAR DELIVERABLES) is download.js's own override — an
// already-resolved data: URI for whichever photo this (format, seed) picked,
// so the rasterized SVG carries zero external references to race against
// canvas draw (see that file's header comment). Every live on-screen caller
// omits it and gets the plain /assets/... path, loaded like any other <img>.
export default function Artifact({ format, seed = 0, compact = false, className, photoHref }) {
  const rawUid = useId()
  const uid = useMemo(() => `art${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`, [rawUid])

  const { geo, content } = useMemo(() => {
    const rand = mulberry32(seed >>> 0)
    const kind = kindFor(format, rand) // draw 1
    const hueDeg = Math.round((rand() * 2 - 1) * 12) // draw 2, ±12° per PLAN.md C1
    const g = GEO[kind] || GEO.note
    // REAL CAR DELIVERABLES — draw 3, always consumed when this kind is one
    // of the three photo kinds (keeps sequence position stable regardless of
    // format, same discipline posters.jsx's colorwayDraw documents) so a
    // locked seed always reproduces the identical photo choice.
    const pickedPhoto = PHOTO_KINDS.has(kind) ? photoForFrame(rand, g.w, g.h) : null
    const photo = pickedPhoto && photoHref ? { ...pickedPhoto, src: photoHref } : pickedPhoto
    return { geo: g, content: renderKind(kind, { rand, uid, hueDeg, seed, compact, g, photo }) }
  }, [format, seed, uid, compact, photoHref])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
