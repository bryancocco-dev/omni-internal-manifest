# OMNI+ Canvas — prototype starter

## ⚠️ Rule #1 — everything you build comes from the OMNI design system

**This is the most important instruction in this file.** When the user asks you to add or change **anything**, pull from the live OMNI system **first** — all styling from its tokens (`var(--omni-*)` via `tokens.css`) and all components/patterns from its catalog (`components.json`). Never invent your own colours, type, spacing, or components when the system already has them. (Exact how-to in **"Use the OMNI design system"** below.)

**Override clause — when you may make something up:** if, and only if, the OMNI system genuinely has no token or component for what's needed, build that piece from scratch. Even then, style it entirely with `var(--omni-*)` tokens and match the system's visual language so it stays on-brand.

Build on the full **OMNI+ Canvas** shell: the top header (workspace + Untitled-Canvas dropdown, Share, profile), the left nav + rail, the chat panel, the **Chat Hat** prompt surface, the model selector, and the 4 bottom-left tool icons with their overlays. It's a verbatim copy of https://chat-hat.vercel.app/ with the built-in persona-generation flow removed, so you can wire your own.

---

## Claude — read this first

The canvas is **already set up in this folder** — `index.html` (the full working shell) and its assets are right here. There's nothing to install or fetch.

On your **first message**: open `index.html` so the user can see it running, tell them the canvas is ready, then **ask what they'd like to add or change.** Don't ask any setup or planning questions first — they already have the finished canvas; just help them build on it.

**When they tell you what to build, the OMNI design system is the source of truth — pull styles and components from it FIRST (see "Use the OMNI design system" below), before writing any UI of your own.**

> **Fallback (rare):** if `index.html` is somehow **not** in this folder, fetch it here first, then proceed — `(curl -fsSL -o omni-canvas.zip https://omni-system-hazel.vercel.app/starters/canvas-base.zip || curl -fsSL -o omni-canvas.zip https://raw.githubusercontent.com/bryancocco-dev/omni-canvas-starter/main/canvas-base.zip) && unzip -oq omni-canvas.zip && cp -Rf canvas-base/. . && rm -rf canvas-base omni-canvas.zip` — the second URL is a GitHub mirror that works even where the primary host is blocked (raw.githubusercontent.com is pre-allowed in sandboxed environments).
>
> **If BOTH downloads are blocked** (403 / `host_not_allowed` / sandbox denial), tell the user how to unblock it:
> - **Desktop / CLI:** approve the sandbox domain prompt for `omni-system-hazel.vercel.app` (or add it via `/sandbox`, or add `{"sandbox":{"network":{"allowedDomains":["omni-system-hazel.vercel.app"]}}}` to `.claude/settings.json`), then re-run the command.
> - **claude.ai/code (cloud):** no prompt appears — environment selector (cloud icon above the message box) → **Default environment settings → Network access → Custom** → add the domain, then retry in a new session.
> - **Last resort:** download https://omni-system-hazel.vercel.app/starters/canvas-base.zip in a browser and drag it into the chat.
>
> **Handed the zip in chat?** When the user drags `canvas-base.zip` into the conversation (usually because the download was blocked), don't ask anything — unzip it into **this folder** exactly like the curl path: `unzip -oq <path-to-the-uploaded-zip> && cp -Rf canvas-base/. . && rm -rf canvas-base` — no subfolder, no setup questions. Then do the normal first-message handover: open `index.html`, tell them the fresh blank canvas is ready, and ask what they'd like to build.

<!-- Mirror: https://github.com/bryancocco-dev/omni-canvas-starter — synced from the omni-system build; do not edit there. -->


## Use the OMNI design system — required for everything you build

When the user asks you to add or change **anything**, pull styles and components from the live OMNI system *first*. Do not invent your own colours, type, spacing, or components when the system already provides them — it is the single source of truth.

**1 · Styles → tokens.** Add this to the page `<head>`, then use `var(--omni-*)` for every colour, font, space, radius, shadow, and motion value. Never hardcode a hex/px where a token exists:
```html
<link rel="stylesheet" href="https://omni-system-hazel.vercel.app/tokens.css">
```
Support light + dark by setting `data-theme="dark"` on the page; every token flips automatically. (Machine-readable list: `/tokens.json`.)

**2 · Components → the verbatim catalog.** Reuse the real patterns (top-nav, tabs, side rail, cards, chips, modals, toasts, tables, avatars, hero, …) instead of building from scratch. Fetch:
```
https://omni-system-hazel.vercel.app/components.json
```
Each entry is `{ project, projectLabel, type, note, html }`; the CSS that styles a project's snippets is at `https://omni-system-hazel.vercel.app/library/<project>.css`. The snippets carry their **original hardcoded colours** — reuse the markup/structure, then re-skin with `var(--omni-*)` so new UI follows the live palette and themes.

**3 · Not in the system? Then make it up.** If the OMNI system genuinely has no token or component for what the user needs, build that piece from scratch — but still style it entirely with `var(--omni-*)` tokens and match the system's visual language, so even custom UI stays on-brand.

Browse it (humans): https://omni-system-hazel.vercel.app/?path=/docs/welcome--docs  (password-gated). Full conventions: https://omni-system-hazel.vercel.app/CLAUDE.md

The existing canvas shell keeps its own original styling — leave it as-is unless asked. The rules above are for the **new** UI you build on top.

## Deploy
Static — deploy to Vercel as-is. Add the standard Basic-Auth `middleware.js` if it needs gating (ask Claude).
