/* Regenerates THEMES_CURRENTLY_ON_DEV.md — the devs' theme-color hand-off doc —
 * from tokens/tokens.json, byte-faithful to the format they originally shipped.
 *
 * tokens.json is the single source of colour truth (tune there, rebuild here).
 * This script holds only the STRUCTURE (section grouping, token order, the
 * exact SCSS $variable names + casing, and the static shadow rows / prose) —
 * never colour values. Every hex comes from tokens.json.
 *
 *   _colors.scss      ⇆  color.primitive.*            (the "Variable" tables)
 *   _theme-registry   ⇆  color.theme.{dark,light}.*   (the "Reference" column)
 *
 * Output: handoff/THEMES_CURRENTLY_ON_DEV.md
 * Run:    npm run build:theme-md
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const tokens = JSON.parse(readFileSync(join(ROOT, 'tokens', 'tokens.json'), 'utf8'));
const PRIM = tokens.color.primitive;
const BT = '`';

// ── primitive helpers ────────────────────────────────────────────────────
// SCSS $variable name for a primitive (bright-white is the one camelCase name).
const scssName = (group, key) =>
  group === 'neutral' && key === 'bright-white' ? '$neutral-brightWhite' : `$${group}-${key}`;
const primHex = (group, key) => PRIM[group][key].$value;

// Resolve a semantic token's $value → { ref, hex }.
//   {color.primitive.brand.cyan01}  → { ref: '$brand-cyan01', hex: '#0de0e1' }
//   #f3f5f9                          → { ref: 'literal',       hex: '#f3f5f9' }
const REF_RE = /^\{color\.primitive\.(\w+)\.([\w-]+)\}$/;
function resolve(value) {
  const m = REF_RE.exec(value);
  if (m) return { ref: scssName(m[1], m[2]), hex: primHex(m[1], m[2]) };
  return { ref: 'literal', hex: value };
}
const swatch = (hex) => {
  const h = hex.replace('#', '').slice(0, 6);
  return `![](https://placehold.co/15x15/${h}/${h}.png)`;
};
const get = (theme, path) => path.split('.').reduce((o, k) => o[k], tokens.color.theme[theme]).$value;
const code = (s) => BT + s + BT;

// ── primitive groups (Core Color Variables) ──────────────────────────────
const PRIM_GROUPS = [
  { title: 'Neutrals',    group: 'neutral', keys: ['black', 'white', 'bright-white'] },
  { title: 'Light Scale', group: 'neutral', keys: ['light00', 'light01', 'light02', 'light03', 'light04'] },
  { title: 'Dark Scale',  group: 'neutral', keys: ['dark00', 'dark01', 'dark02', 'dark03', 'dark035', 'dark04', 'dark05', 'dark06', 'gray'] },
  { title: 'Brand Colors', group: 'brand',  keys: ['cyan01', 'cyan02', 'green01', 'blue01', 'blue02', 'red', 'purple01', 'purple'] }
];

// ── semantic sections (per theme). [mdToken, tokens.json path]. ───────────
const SECTIONS = [
  { title: 'Page Colors',       kind: 'color', rows: [['page-bg', 'page.bg'], ['split-screen-backing', 'page.split-screen-backing']] },
  { title: 'Overlay Colors',    kind: 'color', rows: [['overlay-lightbox', 'overlay.lightbox']] },
  { title: 'UI Colors',         kind: 'color', rows: [['panel-bg', 'panel.bg'], ['panel-bg-02', 'panel.bg-02'], ['panel-bg-03', 'panel.bg-03'], ['panel-bg-04', 'panel.bg-04'], ['markdown-code-bg', 'markdown.code-bg'], ['line-rule', 'rule.line'], ['icon-brand', 'icon.brand'], ['icon-neutral', 'icon.neutral']] },
  { title: 'Accent Colors',     kind: 'color', rows: [['accent-primary', 'accent.primary'], ['accent-branded', 'accent.branded']] },
  { title: 'Shadow Properties', kind: 'shadow' },
  { title: 'Text Colors',       kind: 'color', rows: [['text-body', 'text.body'], ['text-body-high-contrast', 'text.body-high-contrast'], ['text-subhead', 'text.subhead'], ['text-subtle-01', 'text.subtle-01'], ['text-subtle-02', 'text.subtle-02'], ['text-button', 'text.button']] },
  { title: 'User Feedback',     kind: 'color', rows: [['user-feedback-option-hover-bg', 'user-feedback.option-hover-bg']] },
  { title: 'Navigation Colors', kind: 'color', rows: [['nav-bg', 'nav.bg'], ['nav-selected-tab', 'nav.selected-tab'], ['nav-selected-tab-bg', 'nav.selected-tab-bg'], ['nav-footer-bg', 'nav.footer-bg'], ['footer-bg', 'footer.bg']] },
  { title: 'Brand Colors',      kind: 'color', rows: [['brand-oai', 'brand.oai'], ['brand-writer', 'brand.writer'], ['brand-video', 'brand.video'], ['brand-audio', 'brand.audio'], ['brand-graphics', 'brand.graphics']] },
  { title: 'Gradient Colors',   kind: 'color', rows: [['gradient-stop-1', 'gradient.stop-1'], ['gradient-stop-2', 'gradient.stop-2']] },
  { title: 'Neutrals Mapping',  kind: 'color', rows: [['neutral-surface', 'neutral-semantic.surface'], ['neutral-dark-to-light', 'neutral-semantic.dark-to-light']] },
  { title: 'Button Colors',     kind: 'color', rows: [['button-secondary', 'button.secondary'], ['button-secondary-hover', 'button.secondary-hover'], ['button-high-contrast', 'button.high-contrast']] }
];

// Reference-column overrides for the one SCSS interpolation the doc uses.
const REF_OVERRIDE = { 'oai overlay-lightbox': '#{$neutral-dark06}60' };

// Static shadow rows (non-colour; not in tokens.json). [token, reference, value]
const SHADOWS = {
  oai: [
    ['shadow-x', 'literal', '0'], ['shadow-y', 'literal', '0'], ['shadow-blur', 'literal', '0'],
    ['shadow-color', 'literal', '#ffffff00'], ['shadow-spread', 'literal', '0'],
    ['modal-shadow', 'literal', '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)']
  ],
  'omni-classic': [
    ['shadow-x', 'literal', '0'], ['shadow-y', 'literal', '4'], ['shadow-blur', 'literal', '10'],
    ['shadow-color', 'literal', '#cccccc4d'], ['shadow-spread', 'literal', '2'],
    ['modal-shadow', 'literal', '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)']
  ]
};

const THEMES = [
  { key: 'dark', label: 'oai', heading: code('oai') + ' (Dark — Default)' },
  { key: 'light', label: 'omni-classic', heading: code('omni-classic') + ' (Light)' }
];

// ── renderers ─────────────────────────────────────────────────────────────
function renderPrimitives() {
  let out = `## Core Color Variables\n\nThese are the raw color variables referenced throughout the themes.\n`;
  for (const { title, group, keys } of PRIM_GROUPS) {
    out += `\n### ${title}\n\n| Swatch | Variable | Hex |\n|--------|----------|-----|\n`;
    for (const k of keys) {
      const hex = primHex(group, k);
      out += `| ${swatch(hex)} | ${code(scssName(group, k))} | ${code(hex)} |\n`;
    }
  }
  return out;
}

function renderTheme(theme) {
  let out = `## Theme: ${theme.heading}\n`;
  for (const sec of SECTIONS) {
    out += `\n### ${sec.title}\n\n`;
    if (sec.kind === 'shadow') {
      out += `| Token | Reference | Value |\n|-------|-----------|-------|\n`;
      for (const [tok, ref, val] of SHADOWS[theme.label]) {
        out += `| ${code(tok)} | ${ref} | ${code(val)} |\n`;
      }
      continue;
    }
    out += `| Swatch | Token | Reference | Hex |\n|--------|-------|-----------|-----|\n`;
    for (const [mdTok, path] of sec.rows) {
      const { ref, hex } = resolve(get(theme.key, path));
      const override = REF_OVERRIDE[`${theme.label} ${mdTok}`];
      const refStr = override ? code(override) : (ref === 'literal' ? 'literal' : code(ref));
      out += `| ${swatch(hex)} | ${code(mdTok)} | ${refStr} | ${code(hex)} |\n`;
    }
  }
  return out;
}

function renderComparison() {
  const CATS = {
    'Page Colors': 'Page', 'Overlay Colors': 'Overlay', 'UI Colors': 'UI', 'Accent Colors': 'Accent',
    'Text Colors': 'Text', 'User Feedback': 'Feedback', 'Navigation Colors': 'Nav', 'Brand Colors': 'Brand',
    'Gradient Colors': 'Gradient', 'Neutrals Mapping': 'Neutrals', 'Button Colors': 'Button'
  };
  let out = `## Side-by-Side Token Comparison\n\nUse this table to quickly compare a single semantic token between themes.\n\n`;
  out += `| Category | Token | ${code('oai')} (dark) | ${code('omni-classic')} (light) |\n|----------|-------|--------------|-------------------------|\n`;
  for (const sec of SECTIONS) {
    if (sec.kind === 'shadow') {
      const oai = Object.fromEntries(SHADOWS.oai.map(([t, , v]) => [t, v]));
      const omni = Object.fromEntries(SHADOWS['omni-classic'].map(([t, , v]) => [t, v]));
      for (const t of ['shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color', 'shadow-spread']) {
        out += `| Shadow | ${code(t)} | ${code(oai[t])} | ${code(omni[t])} |\n`;
      }
      continue;
    }
    for (const [mdTok, path] of sec.rows) {
      const oai = resolve(get('dark', path)).hex;
      const omni = resolve(get('light', path)).hex;
      out += `| ${CATS[sec.title]} | ${code(mdTok)} | ${code(oai)} | ${code(omni)} |\n`;
    }
  }
  return out;
}

const HEADER = `# Theme Color Reference

This document describes the semantic color tokens defined in [${code('_theme-registry.scss')}](./_theme-registry.scss) and maps them to their underlying SCSS variables from [${code('../abstracts/_colors.scss')}](../abstracts/_colors.scss).

Two themes are registered:

- **${code('oai')}** — Default (dark) theme. Applied at ${code(':root')}.
- **${code('omni-classic')}** — Light theme. Applied via ${code(':root[data-theme="omni-classic"]')}.

Each semantic token becomes a CSS custom property in the form ${code('--semantic-<token>')}. Color tokens additionally get alpha variants (${code('--semantic-<token>-10')} through ${code('--semantic-<token>-90')}).
`;

const USAGE = `## Usage

Reference a semantic token in CSS via the auto-generated custom property:

\`\`\`css
.my-component {
  background: var(--semantic-panel-bg);
  color: var(--semantic-text-body);
  border: 1px solid var(--semantic-line-rule);
}
\`\`\`

Color tokens also expose alpha variants ${code('--semantic-<token>-10')} … ${code('--semantic-<token>-90')} (in 10% increments) generated automatically by [${code('_theme-registry.scss')}](./_theme-registry.scss):

\`\`\`css
.overlay {
  background: var(--semantic-panel-bg-50);
}
\`\`\`
`;

// content blocks each end with a single \n; '\n---\n\n' yields:
//   …line<blank>---<blank>heading — matching the original cadence.
const doc = [
  HEADER,
  renderPrimitives(),
  renderTheme(THEMES[0]),
  renderTheme(THEMES[1]),
  renderComparison(),
  USAGE
].join('\n---\n\n');

const outDir = join(ROOT, 'handoff');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'THEMES_CURRENTLY_ON_DEV.md');
writeFileSync(outPath, doc, 'utf8');
console.log(`theme hand-off written → ${outPath} (${doc.length} bytes)`);
