#!/usr/bin/env node
/**
 * Pulls the verbatim <style> block(s) and Google-Fonts <link> tags out of a
 * sibling TINKER project's index.html, so the Storybook catalog can render
 * each project's real components inside an isolated iframe with byte-identical
 * CSS. Output: stories/_extract/<slug>.css  +  stories/_extract/<slug>.head.html
 *
 * Usage: node scripts/extract-project-css.mjs <slug> [relative/path/to/index.html]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const slug = process.argv[2];
if (!slug) {
  console.error('usage: extract-project-css.mjs <slug> [path/to/index.html]');
  process.exit(1);
}
const rel = process.argv[3] || `../${slug}/index.html`;
const srcPath = resolve(root, rel);
const html = readFileSync(srcPath, 'utf8');

// All <style>...</style> blocks, concatenated in source order.
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
const css = styles.join('\n\n/* ---- next <style> block ---- */\n\n');

// Font + preconnect <link> tags from the head so the iframe loads real fonts.
const links = [...html.matchAll(/<link[^>]*>/gi)]
  .map((m) => m[0])
  .filter((l) => /fonts\.googleapis|fonts\.gstatic|preconnect|stylesheet/i.test(l))
  .join('\n');

writeFileSync(resolve(root, `stories/_extract/${slug}.css`), css);
writeFileSync(resolve(root, `stories/_extract/${slug}.head.html`), links);

// Copy the project's top-level image assets so the iframe (with <base> set to
// /_assets/<slug>/) renders real imagery, not broken <img>s.
const srcDir = dirname(srcPath);
const assetDir = resolve(root, `public/_assets/${slug}`);
mkdirSync(assetDir, { recursive: true });
const IMG = /\.(png|jpe?g|svg|webp|gif|avif|ico)$/i;
let copied = 0;
for (const name of readdirSync(srcDir)) {
  const p = resolve(srcDir, name);
  if (statSync(p).isFile() && IMG.test(name)) {
    copyFileSync(p, resolve(assetDir, name));
    copied++;
  }
}

console.log(`[${slug}] ${styles.length} <style> block(s), ${css.length} bytes css; head links ${links.length} bytes; ${copied} assets copied`);
