/*
 * Curation manifest for the OMNI component catalog's archive/dedup system.
 *
 * Each entry marks one project's version of a component TYPE as a deprecated
 * duplicate of another project's version of the SAME type. The winning
 * (supersededBy) story keeps shipping in the sidebar as normal; the archived
 * entry's sidebar export gets commented out by scripts/apply-curation.mjs and
 * instead renders inside a collapsed "Archive" drawer appended below the
 * winning story (see the `archivedFor()` / `buildArchiveDrawer()` machinery
 * in _extract/lib.js) — so the duplicate stays inspectable without cluttering
 * the sidebar with near-identical rows.
 *
 * Key   — '<project>/<type>'
 *           <project>  the source-project slug, matching a register() call
 *                       in _extract/projects.js (e.g. 'media', 'chat-hat').
 *           <type>     the SNIPPET property key in the project's
 *                       _extract/snippets/<project>.js module (e.g. 'toggle',
 *                       'chip_scopestatus') — NOT the story-file title, which
 *                       is too coarse (one file hosts many variants). Matched
 *                       case-insensitively; lower-case by convention here.
 * Value — { supersededBy: '<project>/<type>',  // the winner, SAME <type>
 *           reason: '<short human-readable note>' }
 *
 * This file ships EMPTY. Nothing below has any effect until entries are
 * added here — no Archive drawers render, no sidebar exports are hidden, no
 * components.json flags are set, zero visual change to the catalog.
 *
 * Workflow once entries are filled in:
 *   1. Add/edit entries below.
 *   2. node scripts/apply-curation.mjs   — comments out the archived exports
 *      in stories/Components/*.stories.js (idempotent; also auto-restores
 *      any export whose entry was removed from this file).
 *   3. npm run build:components          — regenerates public/components.json
 *      with archived/supersededBy/archiveReason flags + active/archived counts.
 *
 * Example (illustration only — leave commented):
 * export const ARCHIVED = {
 *   'media/toggle': {
 *     supersededBy: 'chat-hat/toggle',
 *     reason: 'Byte-identical dip-switch; Chat Hat is the canonical source.'
 *   },
 * };
 */
export const ARCHIVED = {
  // ── shell chrome — Brief's captures match the current canvas-workflows shell ──
  'agents-store/topnav': { supersededBy: 'lease-campaign-brief-handoff/topnav', reason: 'Store-only chrome on the same header shell; older simplified canvas-tab icon.' },
  'chat-hat/topnav': { supersededBy: 'lease-campaign-brief-handoff/topnav', reason: 'Same header shell; older simplified canvas-tab icon vs the current swirl.' },
  'media/topnav': { supersededBy: 'lease-campaign-brief-handoff/topnav', reason: 'Same header shell plus a hidden version-switch; older canvas-tab icon.' },
  'omni-agent-builder/topnav': { supersededBy: 'lease-campaign-brief-handoff/topnav', reason: 'Same header shell reskinned for the builder; older canvas-tab icon.' },
  'agents-store/tabs': { supersededBy: 'lease-campaign-brief-handoff/tabs', reason: 'Fewer, all-disabled tabs; older canvas icon.' },
  'chat-hat/tabs': { supersededBy: 'lease-campaign-brief-handoff/tabs', reason: 'Only two canvas tabs shown; older canvas icon.' },
  'media/tabs': { supersededBy: 'lease-campaign-brief-handoff/tabs', reason: 'Reduced tab set; older canvas icon.' },
  'omni-agent-builder/tabs': { supersededBy: 'lease-campaign-brief-handoff/tabs', reason: 'Reduced to Graphics + agent tabs; older canvas icon.' },
  'chat-hat/siderail': { supersededBy: 'lease-campaign-brief-handoff/siderail', reason: 'Byte-identical markup; Brief is the more actively worked rail lineage.' },
  'media/siderail': { supersededBy: 'lease-campaign-brief-handoff/siderail', reason: 'Same narrow rail, missing the tooltip markup the winner carries.' },
  'chat-hat/navlist': { supersededBy: 'lease-campaign-brief-handoff/navlist', reason: 'Same accordion; wrapping aside is aria-hidden while visibly shown — an a11y bug the winner lacks.' },
  'media/navlist': { supersededBy: 'lease-campaign-brief-handoff/navlist', reason: 'Bare list capture without the rail-panel wrapper or rail actions.' },
  'chat-hat/panelswitch': { supersededBy: 'lease-campaign-brief-handoff/panelswitch', reason: 'Same markup, thinner captured state.' },
  'media/panelswitch': { supersededBy: 'lease-campaign-brief-handoff/panelswitch', reason: 'Byte-identical; Brief kept as the more active lineage.' },
  'agents-store/footer': { supersededBy: 'lease-campaign-brief-handoff/footer', reason: 'Same footer; only whitespace differs.' },
  'omni-agent-builder/footer': { supersededBy: 'lease-campaign-brief-handoff/footer', reason: 'Byte-identical footer.' },
  'media/chapternav': { supersededBy: 'lease-campaign-brief-handoff/chapternav', reason: 'Same chapter pager with a less complete captured state.' },

  // ── controls ──
  'lease-campaign-brief-handoff/button': { supersededBy: 'chat-hat/button', reason: 'Captures only the Share button, byte-identical to part of Chat Hat’s fuller set.' },
  'chat-hat/toggle': { supersededBy: 'lease-campaign-brief-handoff/toggle', reason: 'Bare dip-switch pair; winner shows the same control in real menu context.' },
  'media/toggle': { supersededBy: 'lease-campaign-brief-handoff/toggle', reason: 'Byte-identical bare dip-switch pair.' },
  'chat-hat/input': { supersededBy: 'media/input', reason: 'Same composer, missing the model selector.' },
  'lease-campaign-brief-handoff/input': { supersededBy: 'media/input', reason: 'Same composer, cut off before the Send button.' },
  'chat-hat/menu': { supersededBy: 'lease-campaign-brief-handoff/menu', reason: 'Same add-menu with only 4 of the 6 items.' },
  'media/menu': { supersededBy: 'lease-campaign-brief-handoff/menu', reason: 'Same add-menu, same 4-item subset.' },

  // ── display bits ──
  'lease-campaign-brief-handoff/chip': { supersededBy: 'chat-hat/chip', reason: 'Same composer chip; mono/28px styling drifted from the current shell.' },
  'media/chip': { supersededBy: 'chat-hat/chip', reason: 'Byte-identical to Brief’s capture; same drift from the current shell.' },
  'media/chip_scopestatus': { supersededBy: 'chat-hat/chip_scopestatus', reason: 'Identical CSS; omits the neutral state.' },
  'media/chip_metricdelta': { supersededBy: 'chat-hat/chip_metricdelta', reason: 'Byte-identical bar an inert demo wrapper.' },
  'lease-campaign-brief-handoff/avatar': { supersededBy: 'chat-hat/avatar', reason: 'Byte-identical presence facepile.' },
  'media/avatar': { supersededBy: 'chat-hat/avatar', reason: 'Byte-identical presence facepile.' },
  'omni-agent-builder/avatar': { supersededBy: 'chat-hat/avatar', reason: 'Missing dark-theme rules and two collaborator colour variants.' },
  'media/brandbadge': { supersededBy: 'lease-campaign-brief-handoff/brandbadge', reason: 'Byte-identical badge; downstream clone lineage.' },
  'agents-store/toast': { supersededBy: 'omni-agent-builder/toast', reason: 'Byte-identical launch toast copied from Agent Builder; winner reflects the real show state.' },

  // ── heavy overlays ──
  'omni-agent-builder/modal': { supersededBy: 'agents-store/modal', reason: 'Duplicate Version History dialog; missing aria-hidden, older lineage.' },
  'lease-campaign-brief-handoff/modal': { supersededBy: 'media/modal', reason: 'Duplicate instructions dialog; missing the 8 resize handles the current shell has.' },
  'chat-hat/table': { supersededBy: 'media/table', reason: 'Duplicate KPI table; missing the Conversions row.' },

  // ── content blocks ──
  'chat-hat/card': { supersededBy: 'media/card', reason: 'Byte-identical GAWDTABLE cover; Media is its purpose-built home.' },
  'omni-agent-builder/sectionheader': { supersededBy: 'lease-campaign-brief-handoff/sectionheader', reason: 'Same canvas header on an older class scheme absent from the current shell.' },
  'lease-campaign-brief-handoff/chatmessage': { supersededBy: 'chat-hat/chatmessage', reason: 'Same bubble system, two of the three states.' },
  'media/chatmessage': { supersededBy: 'chat-hat/chatmessage', reason: 'Byte-identical single-bubble subset.' },
  // cross-type: media's "hero" is a mislabeled copy of Brief's end-card
  'media/hero': { supersededBy: 'lease-campaign-brief-handoff/endcard', reason: 'Mislabeled capture of the same .bib-finale end-card the Brief ships as endcard.' },
};
