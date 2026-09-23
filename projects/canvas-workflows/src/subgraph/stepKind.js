// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS" -> "### Step-cards"):
// "small glyph tile (kindTag's color if present, else the parent task's)".
// A step's kindTag (when set — always paired with sourceData, written only
// by state.jsx's convertToSubgraph) is one of this schema's real node
// `type`s; this maps each to the SAME icon + kind-color every full node of
// that type already renders with elsewhere (CardEyebrow's own icon per
// node file, nodes.css's `--accent`/`--cw-kind-*` per `.cw-node--<type>`
// rule) — a step should look like a shrunken preview of the real thing it
// snapshotted, not invent a second icon language. Duplicated here (not
// imported from each node file) for the same cross-seam reason shared.jsx's
// own KIND_COLORS/MOCK_AGENTS tables are duplicated rather than imported —
// this folder is neither seam B nor seam C, and a plain data table is cheap
// to keep in step with the handful of places it's mirrored from.
import {
  ClipboardText,
  FileText,
  GitBranch,
  Hourglass,
  NotePencil,
  Sparkle,
  SlidersHorizontal,
  StopCircle,
  User,
} from '@phosphor-icons/react';

export const STEP_KIND_META = {
  task: { icon: ClipboardText, color: 'var(--cw-accent)' },
  human: { icon: User, color: 'var(--cw-kind-human)' },
  output: { icon: FileText, color: 'var(--cw-accent)' },
  logic: { icon: GitBranch, color: 'var(--cw-kind-logic)' },
  wait: { icon: Hourglass, color: 'var(--cw-kind-wait)' },
  stop: { icon: StopCircle, color: 'var(--cw-kind-stop)' },
  generate: { icon: Sparkle, color: 'var(--cw-accent)' },
  note: { icon: NotePencil, color: 'var(--cw-warn-text)' },
  params: { icon: SlidersHorizontal, color: 'var(--cw-text-3)' },
};

// "...else the parent task's" — every seeded/manually-added step (no
// kindTag) falls back to exactly the Task card's own icon + accent, since
// an untagged step reads as generic in-task work, the same identity the
// wrapping card itself carries.
export const DEFAULT_STEP_KIND_META = { icon: ClipboardText, color: 'var(--cw-accent)' };

export function stepKindMeta(kindTag) {
  return (kindTag && STEP_KIND_META[kindTag]) || DEFAULT_STEP_KIND_META;
}
