/* Emits public/components.json — a machine-readable export of every verbatim
 * component snippet in the catalog, so a NEW prototype project can fetch the
 * real patterns instead of reinventing. Also copies each project's extracted
 * CSS to public/library/<slug>.css (public, referenced by URL in the JSON).
 *
 * Pairs with public/CLAUDE.md (the designer hand-off doc) and tokens.css.
 * Run: npm run build:components
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ARCHIVED } from '../stories/_extract/curation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SNIP_DIR = join(ROOT, 'stories', '_extract', 'snippets');
const CSS_DIR = join(ROOT, 'stories', '_extract');
const STORIES_DIR = join(ROOT, 'stories', 'Components');
const BASE = 'https://omni-system-hazel.vercel.app';

// curation.js keys are '<project>/<snippetKey>' — the same raw snippet
// property key this script iterates below (e.g. 'toggle', 'chip_scopestatus'),
// so matching is direct.
const archivedByKey = new Map(Object.entries(ARCHIVED).map(([k, v]) => [k.toLowerCase(), v]));

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

const components = [];
const projects = {};

const snippetFiles = readdirSync(SNIP_DIR)
  .filter(f => f.endsWith('.js') && !f.startsWith('_'))
  .sort();

for (const file of snippetFiles) {
  const slug = basename(file, '.js');
  const mod = (await import(pathToFileURL(join(SNIP_DIR, file)).href)).default;
  projects[slug] = { label: LABELS[slug] || slug, css: `${BASE}/library/${slug}.css` };
  for (const [type, entry] of Object.entries(mod)) {
    if (!entry || !entry.html) continue;
    const curation = archivedByKey.get(`${slug}/${type}`.toLowerCase());
    components.push({
      project: slug,
      projectLabel: LABELS[slug] || slug,
      type,
      note: entry.note || '',
      ...(entry.bodyClass ? { bodyClass: entry.bodyClass } : {}),
      ...(entry.js ? { js: entry.js } : {}),
      html: entry.html,
      ...(curation ? { archived: true, supersededBy: curation.supersededBy, archiveReason: curation.reason || '' } : {})
    });
  }
}

// media's snippet is shared by gawdtable (dual provenance) — expose gawdtable too.
if (projects.media && !projects.gawdtable) {
  projects.gawdtable = { label: 'Gawdtable', css: `${BASE}/library/gawdtable.css`, sharesSnippetsWith: 'media' };
}

// publish each project's extracted CSS publicly so snippets are reproducible
const libDir = join(ROOT, 'public', 'library');
mkdirSync(libDir, { recursive: true });
let cssCount = 0;
for (const f of readdirSync(CSS_DIR).filter(f => f.endsWith('.css'))) {
  copyFileSync(join(CSS_DIR, f), join(libDir, f));
  cssCount++;
}

const activeComponents = components.filter(c => !c.archived);
const archivedComponents = components.filter(c => c.archived);

const out = {
  $schema: 'OMNI component library export',
  $usage: "Verbatim HTML+CSS patterns from the real OMNI prototypes. Reuse the MARKUP/structure; pull colours, fonts, and spacing from tokens.css via var(--omni-*) and re-skin — the snippets here carry each project's ORIGINAL hardcoded colours (see projects[slug].css), they are NOT token-driven. Full designer workflow: " + BASE + '/CLAUDE.md' + " Entries flagged archived:true are deprecated duplicates kept only for reference — build from the active set (componentCount / components without archived:true).",
  generated: new Date().toISOString(),
  tokens: { css: `${BASE}/tokens.css`, json: `${BASE}/tokens.json`, js: `${BASE}/tokens.js` },
  catalogUI: `${BASE}  (browse visually — Components; password-gated)`,
  projects,
  componentCount: activeComponents.length,
  archivedCount: archivedComponents.length,
  componentTypes: [...new Set(components.map(c => c.type))].sort(),
  components
};

writeFileSync(join(ROOT, 'public', 'components.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(`components.json: ${activeComponents.length} active + ${archivedComponents.length} archived across ${Object.keys(projects).length} projects, ${cssCount} CSS files → public/library/`);
