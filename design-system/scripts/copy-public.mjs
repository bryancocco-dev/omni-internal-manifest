/* After Storybook builds to dist-storybook/, copy the publicly-fetchable
 * token files (tokens.css, tokens.json, tokens.js) into dist-storybook/
 * root and re-copy versions.html so the Vercel deploy serves:
 *   /                → Storybook UI
 *   /tokens.css      → for prototypes to <link>
 *   /tokens.json     → for dev teams (W3C DTCG format)
 *   /tokens.js       → ES module export
 *   /versions.html   → per-project git history page
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out  = join(root, 'dist-storybook');

if (!existsSync(out)) mkdirSync(out, { recursive: true });

const copies = [
  ['dist/tokens.css',         'tokens.css'],
  ['dist/tokens.json',        'tokens.json'],
  ['dist/tokens.js',          'tokens.js'],
  ['public/versions.html',    'versions.html']
];

for (const [src, dest] of copies) {
  const srcPath = join(root, src);
  const destPath = join(out, dest);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`copied ${src} → dist-storybook/${dest}`);
  } else {
    console.warn(`skipped missing ${src}`);
  }
}
