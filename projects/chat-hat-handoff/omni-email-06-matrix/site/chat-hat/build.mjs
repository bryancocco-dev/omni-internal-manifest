#!/usr/bin/env node
// site/chat-hat/build.mjs — PLAN.md §AP
//
// Concatenates the ordered partials listed in src/manifest.json into
// site/chat-hat/index.html. No dependencies. Node >= 18.
//
//   node build.mjs            build src/ -> index.html
//   node build.mjs --check    build to a temp file, diff against the
//                             committed index.html byte-for-byte,
//                             exit 1 on any difference
//   node build.mjs --watch    rebuild on any change under src/
//                             (fs.watch, recursive, 150ms debounce),
//                             one line printed per rebuild
//
// Paths resolve relative to this file, not the caller's cwd, so it
// works the same whether invoked as `node site/chat-hat/build.mjs`
// from the repo root or `node build.mjs` from inside site/chat-hat.

import { readFileSync, writeFileSync, mkdtempSync, rmSync, watch } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(HERE, 'src');
const MANIFEST_PATH = path.join(SRC_DIR, 'manifest.json');
const OUT_PATH = path.join(HERE, 'index.html');

function loadManifest() {
  let raw;
  try {
    raw = readFileSync(MANIFEST_PATH, 'utf8');
  } catch (err) {
    throw new Error(`cannot read manifest at ${MANIFEST_PATH}: ${err.message}`);
  }
  let list;
  try {
    list = JSON.parse(raw);
  } catch (err) {
    throw new Error(`manifest at ${MANIFEST_PATH} is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`manifest at ${MANIFEST_PATH} must be a non-empty JSON array of partial paths`);
  }
  return list;
}

function buildBuffer() {
  const manifest = loadManifest();
  const chunks = manifest.map((rel) => {
    const p = path.join(SRC_DIR, rel);
    try {
      return readFileSync(p);
    } catch (err) {
      throw new Error(`manifest entry "${rel}" -> cannot read ${p}: ${err.message}`);
    }
  });
  return { buffer: Buffer.concat(chunks), count: manifest.length };
}

function doBuild() {
  const { buffer, count } = buildBuffer();
  writeFileSync(OUT_PATH, buffer);
  console.log(`built index.html (${buffer.length} bytes from ${count} partials)`);
  return buffer;
}

function doCheck() {
  const { buffer } = buildBuffer();
  let committed;
  try {
    committed = readFileSync(OUT_PATH);
  } catch (err) {
    console.error(`CHECK FAILED: cannot read committed ${OUT_PATH}: ${err.message}`);
    process.exit(1);
  }

  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'chat-hat-build-check-'));
  const tmpFile = path.join(tmpDir, 'index.html');
  writeFileSync(tmpFile, buffer);

  if (buffer.equals(committed)) {
    console.log(`CHECK OK: src/ builds byte-identical to index.html (${buffer.length} bytes)`);
    rmSync(tmpDir, { recursive: true, force: true });
    process.exit(0);
  }

  let firstDiff = -1;
  const n = Math.min(buffer.length, committed.length);
  for (let i = 0; i < n; i++) {
    if (buffer[i] !== committed[i]) { firstDiff = i; break; }
  }
  if (firstDiff === -1) firstDiff = n; // one is a prefix of the other
  console.error(`CHECK FAILED: built output (${buffer.length} bytes, saved at ${tmpFile}) differs from committed index.html (${committed.length} bytes) at byte offset ${firstDiff}`);
  process.exit(1);
}

function doWatch() {
  console.log(`watching src/ for changes (Ctrl+C to stop)...`);
  doBuild();
  let timer = null;
  watch(SRC_DIR, { recursive: true }, () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      try {
        doBuild();
      } catch (err) {
        console.error(`rebuild failed: ${err.message}`);
      }
    }, 150);
  });
}

const args = process.argv.slice(2);
try {
  if (args.includes('--check')) {
    doCheck();
  } else if (args.includes('--watch')) {
    doWatch();
  } else {
    doBuild();
  }
} catch (err) {
  console.error(`build failed: ${err.message}`);
  process.exit(1);
}
