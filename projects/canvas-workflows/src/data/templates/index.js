// TEMPLATES PHASE — barrel (PLAN.md "### TP2 / TP3"). Combines TP2's
// part-a.js (Quick start / Content / Research, 15) with TP3's part-b.js
// (Approvals / Data / Operations, 15) into the flat array TP1's
// TemplateList.jsx reads and groups by `category`. Each entry is already a
// fully-built `{id, name, category, blurb, size, build()}` object per
// `./builder.js`'s `template()` — this file only concatenates; TP3 must not
// touch this file.
import a from './part-a.js'
import b from './part-b.js'

export const TEMPLATES = [...a, ...b]
