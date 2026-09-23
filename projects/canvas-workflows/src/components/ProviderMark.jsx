// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 2 — Model Library
// modal") introduced this file as a deliberately-NOT-a-logo instrument
// glyph family. MODEL LIBRARY REDESIGN (PLAN.md "## MODEL LIBRARY
// REDESIGN") explicitly OVERRIDES that posture — Bryan: "use the real icon
// from the actual brands to represent the model" — so this file now draws
// the REAL brand marks, sourced only from simple-icons (devDependency,
// `npm i -D simple-icons`; per-brand path data copied in below — tree-
// shaken, no runtime package dependency), never hand-invented paths. Same
// one-component API as before (`<ProviderMark provider size />`) so every
// existing consumer upgrades automatically with zero edits on their part —
// ComboBox.jsx's popover section headers/option rows, this modal's own
// rail rows, and the grid cards below all keep calling this exactly as
// they did before this pass.
//
// Brand data, all copied verbatim from simple-icons (github.com/
// simple-icons/simple-icons, checked at v16.28.0):
//   Anthropic — siAnthropic     (#191919) the angular "A" logomark
//   Google    — siGooglegemini  (#8E75B2) the Gemini four-point sparkle
//   Meta      — siMeta          (#0467DF) the infinity ribbon
//   Mistral   — siMistralai     (#FA520F) the checkerboard mark
//   OpenAI    — NOT IN simple-icons (flagged below) — keeps this file's
//               original hand-drawn "orbit" glyph.
//   Local     — no brand exists (it's this demo's "on-prem / local disk"
//               bucket, not a company) — keeps its original hand-drawn
//               "server rack" glyph, unconditionally, per PLAN.md.
//
// FLAGGED GAP: simple-icons has never carried an OpenAI mark (verified
// directly against the full ~3450-icon v16.28.0 export list — no
// `siOpenai`, only the unrelated `siOpenaigym`). Per PLAN.md's own fallback
// clause — "fallback: keep current glyph for any brand the package lacks
// — flag it" — OpenAI keeps its original stroke-drawn two-circle "orbit"
// glyph rather than a from-memory approximation of their real mark:
// recreating a trademarked logo without an authentic source file is
// exactly the "hand-invented path" PLAN.md's HOW clause rules out.
//
// GRID: brand paths render in their official viewBox (0 0 24 24) as filled
// shapes (no stroke), inset into this file's existing 0 0 20 20 grid via a
// fixed transform (scale 0.625, translate 2.5 2.5 — a 15-unit glyph
// centered in the 20-unit box) so every mark sits at roughly the same
// optical size/margin the hand-drawn stroke glyphs already used —
// "normalized so the family still sits on one grid" (PLAN.md).
//
// COLOR: `mono` (default true) draws in `currentColor`. Every pre-existing
// consumer calls `<ProviderMark provider size />` with no color prop and,
// unchanged, keeps inheriting text color exactly as before — "anywhere a
// mark rides currentColor chrome (combo rows, rail), monochrome is fine"
// (PLAN.md). Only the Model Library grid CARDS opt in with `mono={false}`
// to show real brand color — "Marks may carry their BRAND colors ... on
// the cards" (PLAN.md). OpenAI/Local's hand-drawn glyphs have no brand hex
// to lose either way — they render in currentColor regardless of `mono`.

const STROKE = 1.6

// Scales a brand mark's native 24x24 viewBox content down into this file's
// shared 20x20 grid at the same ~2.5-unit inset the hand-drawn glyphs use.
const BRAND_TRANSFORM = 'translate(2.5 2.5) scale(0.625)'

function Svg({ size, style, className, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// A real brand mark: one filled simple-icons path (official viewBox always
// 0 0 24 24) inset into the shared 20x20 grid. `color` is either the brand
// hex (mono=false) or 'currentColor' (mono, the default). `mark` is a
// stable per-brand identifier (data-mark) — simple-icons ships exactly one
// hex per brand, tuned for a light background; browsermodal.css uses this
// hook to fall back to currentColor for the one brand (Anthropic, see
// AnthropicMark below) whose single hex is near-black and would otherwise
// disappear on a dark card in dark theme. Scoped to `.cw-mcard-mark` only
// (browsermodal.css's own comment on the rule) so it never touches the
// mono `currentColor` contexts (rail, ComboBox), which never had this
// problem to begin with.
function BrandSvg({ size, style, className, path, color, mark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} style={style} data-mark={mark} aria-hidden="true">
      <path d={path} fill={color} transform={BRAND_TRANSFORM} />
    </svg>
  )
}

// ---- simple-icons path data, copied verbatim (icon slug + brand hex noted
// per PLAN.md's "inline the real path strings" instruction) ---------------
const SI_ANTHROPIC = {
  hex: '#191919',
  path: 'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
}
const SI_GOOGLEGEMINI = {
  hex: '#8E75B2',
  path: 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81',
}
const SI_META = {
  hex: '#0467DF',
  path: 'M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z',
}
const SI_MISTRALAI = {
  hex: '#FA520F',
  path: 'M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z',
}

function AnthropicMark({ mono, ...props }) {
  return <BrandSvg {...props} path={SI_ANTHROPIC.path} color={mono ? 'currentColor' : SI_ANTHROPIC.hex} mark="anthropic" />
}

function GoogleMark({ mono, ...props }) {
  return <BrandSvg {...props} path={SI_GOOGLEGEMINI.path} color={mono ? 'currentColor' : SI_GOOGLEGEMINI.hex} mark="google" />
}

function MetaMark({ mono, ...props }) {
  return <BrandSvg {...props} path={SI_META.path} color={mono ? 'currentColor' : SI_META.hex} mark="meta" />
}

function MistralMark({ mono, ...props }) {
  return <BrandSvg {...props} path={SI_MISTRALAI.path} color={mono ? 'currentColor' : SI_MISTRALAI.hex} mark="mistral" />
}

// OpenAI — flagged gap (see file header): original hand-drawn glyph, always
// currentColor (no authentic brand hex to carry).
function OpenAIMark({ mono, ...props }) {
  return (
    <Svg {...props}>
      <circle cx="7.6" cy="12.2" r="4.2" />
      <circle cx="13.6" cy="7.4" r="2.5" />
    </Svg>
  )
}

// Local — deliberately never a brand mark (no brand exists); always
// currentColor.
function LocalMark({ mono, ...props }) {
  return (
    <Svg {...props}>
      <rect x="4" y="4.2" width="12" height="3.1" rx="1.1" />
      <rect x="4" y="8.45" width="12" height="3.1" rx="1.1" />
      <rect x="4" y="12.7" width="12" height="3.1" rx="1.1" />
      <circle cx="13.2" cy="5.75" r="0.65" fill="currentColor" stroke="none" />
    </Svg>
  )
}

const MARKS = {
  Anthropic: AnthropicMark,
  OpenAI: OpenAIMark,
  Google: GoogleMark,
  Meta: MetaMark,
  Mistral: MistralMark,
  Local: LocalMark,
}

// Fallback for a provider name outside the six-entry roster (defensive only
// — data/models.js's PROVIDERS is closed today): a plain small ring, same
// stroke voice, reads as "unknown/other" rather than rendering nothing.
function GenericMark({ mono, ...props }) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="5.2" />
    </Svg>
  )
}

// `size` — legible at 14-16px in both themes (PLAN.md); default 16 matches
// the palette's own icon-tile glyph size. `mono` (default true) draws in
// `currentColor` so every pre-existing caller (ComboBox popover rows/
// section headers, this modal's rail) is unaffected by this pass; pass
// `mono={false}` to show a mark's real brand color (Model Library grid
// cards only).
export default function ProviderMark({ provider, size = 16, className, style, mono = true }) {
  const Mark = MARKS[provider] || GenericMark
  return <Mark size={size} className={className} style={style} mono={mono} />
}
