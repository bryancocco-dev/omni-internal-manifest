# OMNI Design System — prototype starter

This project builds prototypes against the **OMNI design system** (the OAI/OMNI internal manifest). Colours, fonts, spacing, and component patterns all come from the live system — **pull from there, don't reinvent.**

Live system: https://omni-system-hazel.vercel.app  (browse the catalog — password-gated)

---

## 1 · Colours, fonts, spacing — use the tokens

Add this one line to the `<head>` of any HTML prototype:

```html
<link rel="stylesheet" href="https://omni-system-hazel.vercel.app/tokens.css">
```

Then use `var(--omni-*)` for **everything**. Never hardcode a hex. The most-used tokens:

| Group | Tokens |
|---|---|
| Surfaces | `--omni-page-bg`, `--omni-panel-bg`, `--omni-panel-bg-02/03/04`, `--omni-nav-bg`, `--omni-footer-bg` |
| Text | `--omni-text-body`, `--omni-text-body-high-contrast`, `--omni-text-subhead`, `--omni-text-subtle-01`, `--omni-text-button` |
| Accent | `--omni-accent-primary` (the brand blue), `--omni-accent-branded` |
| Lines | `--omni-rule-line` (default divider, 0.5px) |
| Brand | `--omni-brand-oai / writer / video / audio / graphics` |
| Type | `--omni-font-family-sans` (Inter), `--omni-font-family-mono` (Fira Code), `--omni-font-family-display` (Instrument Serif) |
| Spacing | `--omni-space-1 … 40` (4px scale; `--omni-space-6` = 12px is the default gap) |
| Radius | `--omni-radius-small` (6px, most-used), `-medium`, `-large`, `-pill` |
| Elevation | `--omni-shadow-elevation-1 … 4` (elevation-2 = default interactive) |
| Motion | `--omni-transition-duration-fast` (200ms), `--omni-transition-easing-snap` |

Full machine-readable list: https://omni-system-hazel.vercel.app/tokens.json

## 2 · Light / dark theme

The default (`:root`) is the light **omni-classic** theme. Switch to the dark **oai** theme by setting `data-theme="dark"` on `<html>` or `<body>` — every `--omni-*` token flips automatically. Text that sits **on the accent** must use `--omni-text-button` (white in light, dark in dark) so it stays legible on either accent.

## 3 · Components — reuse the real patterns

The catalog has verbatim HTML+CSS for every component across the OMNI prototypes (top-nav, tabs, side rail, cards, chips, modals, toasts, tables, avatars, hero, …). Fetch the machine-readable export:

```
https://omni-system-hazel.vercel.app/components.json
```

Each entry is `{ project, projectLabel, type, note, html }`. The CSS that styles a project's snippets is at `https://omni-system-hazel.vercel.app/library/<project>.css`.

> **Important:** these snippets carry each project's **original hardcoded colours**, not `--omni-*` tokens. Reuse the **markup / structure**, then **re-skin with `var(--omni-*)`** so the new prototype follows the live palette and themes correctly.

Browse them visually at https://omni-system-hazel.vercel.app → **Components** (password-gated).

**Icons** — the OMNI icon set is [Boxicons](https://boxicons.com) (free, open-source). Add `<link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css">` and use `<i class='bx bx-name'></i>` (regular), `bxs-` (solid), or `bxl-` (logos). Browse the full set at **Foundations → Icons** in the catalog.

## 4 · Conventions

- **Single-file static HTML** prototypes (no build step) unless asked otherwise.
- Inter / Fira Code / Instrument Serif via the token font stack.
- Hairline dividers are **0.5px** in `--omni-rule-line`.
- Deploy to **Vercel**; if it needs gating, use the standard Basic-Auth `middleware.js` pattern the other OMNI prototypes use (ask Claude to add it).

## 5 · Getting started

Drop this file in your project root as `CLAUDE.md`, then just describe what you want — e.g.:

> "Build a settings page using the OMNI top-nav and cards, with a light/dark toggle."

Claude will link `tokens.css`, pull the relevant patterns from `components.json`, and theme everything with `var(--omni-*)`.
