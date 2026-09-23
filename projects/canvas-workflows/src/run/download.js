// DELIVERABLE DOWNLOADS — PLAN.md "## DELIVERABLE DOWNLOADS — the run hands
// you the files". Bryan: "after you have deliverables how do you access/
// download them?" -> today view-only -> approved this build. All client-
// side and REAL: Blob + anchor downloads, no backend, works on the deployed
// static demo exactly like the dev build.
//
// Pure functions in, one small impure trigger at the bottom. Every caller —
// RunPreview's header Download button, OutputNode's own hover chip on a
// completed card, and (CANVAS-NATIVE DELIVERABLES) the header's own
// "N DELIVERED" download-all (state.jsx) — funnels through the SAME
// `downloadArtifact(descriptor)` so nothing can ever disagree on filename,
// file shape, or pipeline behavior. `descriptor` is the flat shape every
// call site can already assemble from data it owns:
//   { nodeId, format, content, seed, poster, seq, version? }
// `seq` is `data.seq` off the node's own React Flow data — state.jsx's
// renumber() stamps a BFS-order 0-based `seq` onto EVERY node unconditionally
// (see that file), unlike the visible "01/02/03" card badge (`data.number`)
// which ONLY task/human/params/generate nodes get — an Output node never
// wears one of those. `seq` is the one per-node ordinal actually reachable
// from this seam's three files without editing state.jsx/App.jsx (both out
// of this dispatch's file grant), so it's what the filename's "node NN"
// token below is built from. `version` (CANVAS-NATIVE DELIVERABLES) is the
// optional 1-based version number OutputNode's own chip passes when there's
// real multi-version history to disambiguate — see buildFilename's own
// comment.
//
// Three file shapes, chosen by format (PLAN.md "File generation"):
//   - Visual formats (Graphic/Video/Audio/Presentation/Templated Output,
//     and any VARIANT STUDIO `poster:true` artifact): PNG at 2x, rasterized
//     from the EXACT SAME SVG the app renders on screen — run/artifacts.jsx's
//     <Artifact> or run/posters.jsx's <Poster>, called here "by descriptor"
//     (format+seed / poster+seed) via react-dom/server's renderToStaticMarkup
//     rather than reading any live DOM node, so this stays a pure function of
//     the descriptor and works identically no matter which surface (a node
//     that might not even be mounted/visible, e.g. a "Download all" pass
//     over the whole dock) triggered it.
//   - Text-family (Text/Email/Teams/Doc — run/artifacts.jsx's isTextFormat):
//     .md with the REAL streamed content verbatim (Teams's "**bold**",
//     Email's "Subject:" line, ... — all valid/meaningful markdown as-is,
//     nothing stripped) plus a small front-matter header.
//   - Spreadsheet: .csv built from the SAME parseMarkdownTable gen/
//     generate.js already exports for RunPreview's own table view — one
//     parser, not a second one for this file.
//
// Filenames — kebab "<brand-or-workflow>_<format>_<node NN>[_seed].ext"
// (PLAN.md, verbatim example: ridgeline-roast_key-visual_05_9E3F.png):
//   - brand: the ONE brand concept in this app is RIDGELINE ROAST (run/
//     posters.jsx's fixed fictional coffee brand) — used whenever
//     `poster:true`. Everything else has no "brand", so it falls back to
//     the live workflow title (App.jsx's title-dropdown button, read
//     straight off the DOM — see readWorkflowTitle() below for why: that
//     title is local component state with no context/prop path into this
//     seam's files, same read-the-rendered-DOM-instead pattern state.jsx's
//     own glideTo already uses for --cw-panel-w).
//   - format: for the 6 PNG "kinds" (poster/social/video/deck/audio/
//     template — run/artifacts.jsx's artifactKind()) a human label rather
//     than the raw format string, e.g. poster -> "key-visual", matching the
//     literal meta-stamp already printed ON the artifact itself (kPoster's
//     "KV · <hex4>") — "the filename sells the pipeline story" (PLAN.md).
//     Spreadsheet/Text/Email/Teams/Doc just use their own lowercased name.
//   - node NN: `seq` (see above), 1-based, zero-padded.
//   - _seed: the SAME 4-hex-digit stamp already baked into the artifact's
//     own corner meta-label (a fresh, file-local hex4() — artifacts.jsx's/
//     posters.jsx's own copies are private, and this codebase's own stated
//     convention is a small helper like this is fine to duplicate rather
//     than reach into another seam's file to export one, see RunPreview.jsx's
//     header comment on FORMAT_ICONS for the same call). Present only on
//     PNGs — a seed doesn't mean anything on a .md/.csv (the seed only ever
//     drives the SVG artifact's own look, never the real streamed content),
//     matching the spec's own "[_seed]" bracket.

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import Artifact, { artifactAspect, artifactKind, isTextFormat, photoForArtifact } from './artifacts.jsx'
import Poster, { POSTER_ASPECT, photoForPosterSeed } from './posters.jsx'
import { parseMarkdownTable } from '../gen/generate.js'

// ---------------------------------------------------------------------------
// Fixed LIGHT token values — copied verbatim from styles/cw-tokens.css's base
// #workflow-root block (the light defaults; NOT the body[data-theme="dark"]
// overrides below them). PLAN.md: "downloads render against a FIXED LIGHT
// palette regardless of current theme... resolve token colors at render time
// from a fixed light map in download.js, documented." Every artifact SVG
// (run/artifacts.jsx / run/posters.jsx) already paints itself with its own
// literal hex "produced media" studio palette (PAPER/INK/ACCENT/CHARCOAL/...)
// — never a --cw-* var — so the rasterized PNG is already theme-independent
// by construction; a dark-mode user gets the exact same pixels a light-mode
// user would. This map is still the one documented "light truth" this file
// commits to for the small bit of chrome download.js itself paints (the
// canvas backstop fill in renderArtifactPngBlob below), so nothing here ever
// has to read a CURRENT, possibly-dark, resolved --cw-* value off a live DOM
// element to answer "what does light look like".
const LIGHT = {
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
}

// ---------------------------------------------------------------------------
// Small local helpers — deliberately self-contained (see file header).
// ---------------------------------------------------------------------------
function slugify(value) {
  return (
    String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file'
  )
}

function hex4(seed) {
  return (Math.abs(Number(seed) || 0) % 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

// 1-based, zero-padded — same padStart(2,'0') convention nodes/shared.jsx's
// CardEyebrow already uses for the visible "01/02/03" badge, applied here to
// `seq` instead of `number` (see file header for why).
function nodeNumberToken(seq) {
  const n = Number.isFinite(seq) ? seq + 1 : 1
  return String(Math.max(1, n)).padStart(2, '0')
}

// The live workflow title lives in App.jsx's own `useState('Untitled
// Workflow')` — local component state, no context/prop path reaches this
// seam's files. Reading its RENDERED text off the DOM (the title-dropdown
// button, always exactly one on screen) is the same cross-component pattern
// state.jsx's own glideTo relies on elsewhere in this codebase (measuring
// #workflow-root's own --cw-panel-w rather than importing CompiledPanel's
// internals) — a read, never a write, so it can't fight App.jsx's own state.
function readWorkflowTitle() {
  if (typeof document === 'undefined') return 'Untitled Workflow'
  const el = document.querySelector('.cw-header-titlebtn')
  const text = el?.textContent?.trim()
  return text || 'Untitled Workflow'
}

function brandToken(poster) {
  // RIDGELINE ROAST is the one brand concept anywhere in this app (run/
  // posters.jsx) — everything else falls back to the workflow's own title.
  return poster ? 'ridgeline-roast' : slugify(readWorkflowTitle())
}

// Kind -> filename label for the 6 PNG "kinds" (run/artifacts.jsx's
// artifactKind()) — a human label, not the raw format string, matching the
// literal meta-stamp already printed on the artifact itself (e.g. kPoster's
// "KV · <hex4>" corner stamp -> "key-visual" here). `poster` (VARIANT
// STUDIO's Ridgeline Roast pack) has no kind split of its own — every layout
// in that pack IS a key visual, so it's a fixed label, not a lookup.
const KIND_FILE_SLUG = {
  poster: 'key-visual',
  social: 'social',
  video: 'video-frame',
  deck: 'presentation-cover',
  audio: 'audio',
  template: 'template',
}
const TEXT_FILE_SLUG = { Text: 'text', Email: 'email', Teams: 'teams', Doc: 'doc' }

function formatToken({ format, seed, poster }) {
  if (poster) return 'key-visual'
  if (format === 'Spreadsheet') return 'spreadsheet'
  if (TEXT_FILE_SLUG[format]) return TEXT_FILE_SLUG[format]
  return KIND_FILE_SLUG[artifactKind(format, seed)] || slugify(format)
}

// PLAN.md pattern, verbatim: "<brand-or-workflow>_<format>_<node NN>[_seed].ext".
// CANVAS-NATIVE DELIVERABLES (PLAN.md "### 1") — "Download chip downloads
// the VISIBLE version (filename gains _v3)": `version` is the optional
// 1-based version number a caller (OutputNode's own per-card chip only —
// download-all stays on CURRENT versions, unsuffixed, PLAN.md "### 3")
// passes when there's real multi-version history to disambiguate; every
// existing call site that doesn't pass it gets the exact same filename as
// before this phase.
function buildFilename({ format, seed, poster, seq, version, ext, includeSeed }) {
  const parts = [brandToken(poster), formatToken({ format, seed, poster }), nodeNumberToken(seq)]
  if (version) parts.push(`v${version}`)
  const base = parts.join('_')
  return includeSeed ? `${base}_${hex4(seed)}.${ext}` : `${base}.${ext}`
}

// ---------------------------------------------------------------------------
// Text-family (.md) — PLAN.md: "REAL streamed content + a small front-matter
// header (format, produced-by node, workflow title)". Content is passed
// through byte-for-byte: Teams's "**bold**", Email's "Subject:" line, etc.
// are all valid/meaningful markdown as-is — nothing here re-parses or
// re-formats what engine.js actually produced (that re-parsing is
// RunPreview.jsx's OWN job, for its on-screen views, a different concern).
// ---------------------------------------------------------------------------
function buildMarkdownFile({ format, content, seq }) {
  const front = [
    '---',
    `format: ${format}`,
    `produced-by: Output node ${nodeNumberToken(seq)}`,
    `workflow: ${readWorkflowTitle()}`,
    '---',
    '',
    '',
  ].join('\n')
  return `${front}${String(content ?? '').trim()}\n`
}

// ---------------------------------------------------------------------------
// Spreadsheet (.csv) — reuses gen/generate.js's own table parser (the same
// one RunPreview.jsx's SpreadsheetBody already calls) rather than a second
// markdown-table parser. CRLF + RFC4180 quoting for maximum spreadsheet-app
// compatibility.
// ---------------------------------------------------------------------------
function csvCell(value) {
  const s = String(value ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function buildCsvFile(content) {
  const { headers, rows } = parseMarkdownTable(content)
  const lines = []
  if (headers.length) lines.push(headers.map(csvCell).join(','))
  rows.forEach((row) => lines.push(row.map(csvCell).join(',')))
  return `${lines.join('\r\n')}\r\n`
}

// ---------------------------------------------------------------------------
// Visual formats (.png) — "render the SAME artifact SVG (artifacts.jsx /
// posters.jsx by descriptor) to PNG at 2x via serialized-SVG -> Image ->
// canvas -> toBlob" (PLAN.md, verbatim pipeline). `renderToStaticMarkup`
// (react-dom/server, browser-safe entry — Vite resolves the package's own
// "browser" export condition, no Node APIs involved) builds the exact same
// markup React would have mounted, from nothing but the descriptor — no live
// DOM node required, so this works even for an artifact whose on-screen
// instance isn't the one that happened to trigger the download (e.g. the
// header's own "N DELIVERED" download-all pass).
//
// Fonts: the SVGs set explicit font-family stacks that already end in a
// generic fallback (run/artifacts.jsx's META_FONT/HEAD_FONT-equivalent
// literals: "'Fira Code',...,monospace" / "'Inter',...,sans-serif") — if the
// isolated data-URI Image context can't resolve the app's own webfonts (a
// known browser quirk for rasterizing SVG-as-image), it falls back to the
// generic family instead of rendering tofu. Verified by reading a produced
// PNG's actual pixels (see PLAN.md's own verify step) rather than assumed.
// ---------------------------------------------------------------------------
function parseAspect(aspect) {
  const [w, h] = String(aspect)
    .split('/')
    .map((n) => parseFloat(n.trim()))
  return { w: w || 1, h: h || 1 }
}

// ---------------------------------------------------------------------------
// REAL CAR DELIVERABLES (PLAN.md) — inlining the photo before rasterizing.
// The live on-screen <Poster>/<Artifact> just point their SVG <image> at the
// plain /assets/deliverables/*.jpg path, which is fine for a mounted DOM
// node (the browser loads it like any other <img>, no canvas involved). But
// this file's pipeline is SVG markup -> data:image/svg+xml URI -> Image() ->
// canvas.drawImage — and an <image href> that's itself still an external
// URL means the OUTER svg-as-Image load can resolve before that INNER photo
// has actually decoded, so the canvas silently draws the frame without it
// (a real bug caught exactly this way: the download "succeeded" but the PNG
// had a blank/empty art layer). Converting the photo to its OWN data: URI
// first and baking that directly into the SVG string removes every external
// reference from the pipeline — the single data: URI handed to Image() is
// then fully self-contained, nothing left to race.
// Cached per photo src (module-level, survives across downloads/re-runs —
// there are only ever 4 distinct files) so a "download all" pass or repeat
// downloads of the same photo don't re-fetch it every time.
const PHOTO_DATA_URI_CACHE = new Map()
function photoDataUri(src) {
  if (!src) return Promise.resolve(null)
  if (PHOTO_DATA_URI_CACHE.has(src)) return PHOTO_DATA_URI_CACHE.get(src)
  const promise = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`download.js: failed to fetch car photo ${src} (${res.status})`)
      return res.blob()
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error(`download.js: failed to read car photo ${src}`))
          reader.readAsDataURL(blob)
        }),
    )
    .catch((err) => {
      // Graceful floor, same spirit as the imageUrl fallback below: a photo
      // that somehow fails to inline shouldn't break the whole download —
      // the SVG falls back to its own plain-path <image href>, which still
      // rasterizes (just re-introduces the race this cache exists to avoid,
      // strictly better than no file at all).
      console.error('downloadArtifact: car photo inline failed, falling back to plain path:', err)
      return null
    })
  PHOTO_DATA_URI_CACHE.set(src, promise)
  return promise
}

async function buildArtifactMarkup({ format, seed, poster }) {
  const photo = poster ? photoForPosterSeed(seed) : photoForArtifact(format, seed)
  const photoHref = photo ? await photoDataUri(photo.src) : undefined
  const element = poster
    ? createElement(Poster, { seed, compact: false, photoHref })
    : createElement(Artifact, { format, seed, compact: false, photoHref })
  const aspect = poster ? POSTER_ASPECT : artifactAspect(format, seed)
  return { markup: renderToStaticMarkup(element), ...parseAspect(aspect) }
}

async function renderArtifactPngBlob({ format, seed, poster }, scale = 2) {
  const { markup, w, h } = await buildArtifactMarkup({ format, seed, poster })
  const pxW = Math.round(w * scale)
  const pxH = Math.round(h * scale)
  // Inject explicit pixel width/height onto the root <svg> (renderToStatic
  // Markup only ever emits the viewBox — Artifact/Poster size themselves via
  // CSS when mounted live) so the Image below decodes at a real, crisp 2x
  // intrinsic size rather than a browser's default replaced-element size.
  // A plain string .replace() only ever touches the FIRST match, i.e. the
  // root element — there is no nested <svg> in either component.
  const sized = markup.replace('<svg ', `<svg width="${pxW}" height="${pxH}" `)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () => reject(new Error(`download.js: artifact SVG failed to rasterize (${format})`))
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = pxW
  canvas.height = pxH
  const ctx = canvas.getContext('2d')
  // Backstop fill (see LIGHT's own header comment) — every kind renderer
  // already paints its own full-bleed opaque background rect, so this is
  // redundant-by-design insurance: the canvas's own base coat is explicitly
  // the fixed light surface, never a <canvas> element's implicit
  // transparent-black default, on any edge/antialiasing seam.
  ctx.fillStyle = LIGHT.surface
  ctx.fillRect(0, 0, pxW, pxH)
  ctx.drawImage(img, 0, 0, pxW, pxH)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// ---------------------------------------------------------------------------
// FINAL QUEUE — FQ-A "REAL ADAPTERS" — "PNG passthrough (no canvas
// re-render needed)" (PLAN.md). A real-image descriptor carries `imageUrl`
// (a same-origin `blob:` object URL minted at generation time by
// run/pollinations.js) — download re-fetches those SAME bytes and saves
// them AS-IS rather than rasterizing the SVG poster/artifact this format
// would otherwise fall back to; no canvas, no <Image>/toBlob round-trip.
// Extension follows the blob's own real mime type (pollinations can hand
// back jpeg or png depending on the model) instead of forcing `.png` on
// bytes that might not be — a mismatched extension is a bigger user-facing
// paper cut than this file's own naming convention staying perfectly
// uniform, and formatToken()/buildFilename() below are otherwise untouched
// (artifactKind(format, seed) already agrees with whichever kind a real
// photo was generated at, per engine.js's own imageKind selection).
// ---------------------------------------------------------------------------
function extFromMime(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/png') return 'png'
  return 'png' // unknown/absent mime — png is a safe, always-openable guess
}

// ---------------------------------------------------------------------------
// The trigger — the one impure bit. Blob URL + a throwaway anchor's own
// click(), revoked shortly after (not immediately: revoking on the same
// tick can cancel the download in some browsers).
// ---------------------------------------------------------------------------
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// downloadArtifact(descriptor) — the one entry point every surface calls.
// descriptor: { nodeId, format, content, seed, poster, seq, version?,
// imageUrl?, imageMime? } — the last two are FQ-A's own additions (see this
// file's own header comment above), undefined for every non-real artifact.
export async function downloadArtifact(descriptor = {}) {
  const { format = 'Text', content = '', seed = 0, poster = false, seq, version, imageUrl, imageMime } = descriptor
  if (imageUrl) {
    try {
      const filename = buildFilename({ format, seed, poster, seq, version, ext: extFromMime(imageMime), includeSeed: true })
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`imageUrl fetch responded ${res.status}`)
      triggerBlobDownload(await res.blob(), filename)
      return
    } catch (err) {
      // Graceful, same spirit as engine.js's own real-image fallback — an
      // object URL that somehow went stale shouldn't leave the user with no
      // file at all; fall through to the seeded SVG rasterize path below.
      console.error('downloadArtifact: real image fetch failed, falling back to the seeded artifact:', err)
    }
  }
  if (!poster && isTextFormat(format)) {
    const filename = buildFilename({ format, seed, poster, seq, version, ext: 'md', includeSeed: false })
    triggerBlobDownload(new Blob([buildMarkdownFile({ format, content, seq })], { type: 'text/markdown;charset=utf-8' }), filename)
    return
  }
  if (!poster && format === 'Spreadsheet') {
    const filename = buildFilename({ format, seed, poster, seq, version, ext: 'csv', includeSeed: false })
    triggerBlobDownload(new Blob([buildCsvFile(content)], { type: 'text/csv;charset=utf-8' }), filename)
    return
  }
  const filename = buildFilename({ format, seed, poster, seq, version, ext: 'png', includeSeed: true })
  const blob = await renderArtifactPngBlob({ format, seed, poster })
  triggerBlobDownload(blob, filename)
}

// downloadAllArtifacts(descriptors) — the header's own "N DELIVERED"
// download-all now (CANVAS-NATIVE DELIVERABLES; Filmstrip.jsx, its original
// caller, is gone). PLAN.md: "saves every deliverable in sequence (150ms
// apart — browsers throttle same-tick multi-downloads)". Each item is
// scheduled at a fixed i*stagger offset from call time (not chained off the
// previous item's own async completion) — every artifact here is a small
// inline-SVG or short string, so render time is negligible and the fixed
// cadence is what actually keeps the browser from seeing N clicks on one
// tick.
export function downloadAllArtifacts(descriptors = [], { stagger = 150 } = {}) {
  descriptors.forEach((descriptor, i) => {
    setTimeout(() => {
      downloadArtifact(descriptor).catch((err) => console.error('downloadAllArtifacts:', err))
    }, i * stagger)
  })
}
