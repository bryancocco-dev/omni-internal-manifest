// Seam C — Nodes
// WAVE 4 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 4 — OPS &
// META (Handoff, Run workflow, Guardrail, Localize, Optimize)").
//
// "Handoff (human amber, eyebrow HANDOFF): owner ComboBox (Mara Lindqvist,
// Owen Reilly, Elena Rios, Daniel Okafor), due chip (Fri · EOD), note
// field. Engine: PAUSES (reuses pause machinery + breathing ring/stamp —
// stamp reads "WITH ANDREW"); resume button "Mark returned". Skip allowed."
//
// Architecture call (own node type, not a HumanNode `kind` — stated here per
// the dispatch's "decide whether it's a HumanNode kind or its own type off
// the shared pieces, state it" instruction, the same "your call" framing
// Wave 3's Style Reference / Remix got): HumanNode.jsx's entire anatomy (the
// free-text `ask` field, the free/choice Segmented, OptionsEditor, and the
// per-option branch handles it feeds) is built around collecting a
// HUMAN-SUPPLIED VALUE that may steer which handle fires next — none of
// that applies to Handoff, which always resolves to one plain 'out' the
// instant it's marked returned. Its own fields (owner/due/note) are
// entirely different data with no overlap. Folding a `kind: 'handoff'` into
// HumanNode would mean hiding every one of those pieces behind extra
// conditionals for a card that shares only the PAUSE MACHINERY with Human
// Intervention, not its anatomy — the same "isn't a genuine anatomical
// sibling" call RemixNode.jsx's own header comment made for Remix against
// Compare/Style Reference. So this reuses the SHARED PIECES instead
// (shared.jsx's CardEyebrow/RunStamp/InHandle/OutHandle/Reveal, the
// existing human-amber --cw-kind-human token per the master's own color
// discipline, and run/engine.js's already-generic waitForHuman/
// continueHuman/pendingHumans pause primitives — keyed by nodeId, not by
// node type, so they generalize to a second pausing type for free) rather
// than forking HumanNode.jsx's own JSX, and without touching that file at
// all.
//
// This file mutates only its own node data (updateNodeData) — the pause
// itself and the "Returned by <owner>." content line are written entirely
// by run/engine.js's own 'handoff' beat; this component only renders
// whatever that beat last wrote, the same read-only-render posture every
// other run-driven card in this app takes toward its own engine case.

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { UserSwitch } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  GenerationBox,
  InHandle,
  OutHandle,
} from './shared.jsx';
import ComboBox from './ComboBox.jsx';
import Reveal from './Reveal.jsx';
import { useFlowState } from '../state.jsx';

// "owner ComboBox (Mara Lindqvist, Owen Reilly, Elena Rios, Daniel Okafor)"
// (master, verbatim roster + order) — Bryan's own standing cast for these
// prototypes.
const OWNER_OPTIONS = [
  { value: 'Mara Lindqvist', label: 'Mara Lindqvist' },
  { value: 'Owen Reilly', label: 'Owen Reilly' },
  { value: 'Elena Rios', label: 'Elena Rios' },
  { value: 'Daniel Okafor', label: 'Daniel Okafor' },
];

// "stamp reads 'WITH MARA'" (master) — the CURRENTLY selected owner's
// first name, all-caps, not a hardcoded literal: a Handoff assigned to Jack
// reads "WITH JACK" while paused, same "the card reflects the live field"
// posture every other stamp override in this app takes (SignalNode.jsx's
// own isMiss override is the direct precedent). Defensive fallback (owner
// is always set once the ComboBox has a value) rather than a throw.
function withStampLabel(owner) {
  const first = (owner || '').trim().split(' ')[0];
  return first ? `WITH ${first.toUpperCase()}` : undefined;
}

function HandoffNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  // RUN PHASE (R1) — continueHuman(nodeId, value) is generic over any
  // pausing node (keyed by nodeId in engine.js's pendingHumans map, not by
  // node.type) — same context function HumanNode.jsx already calls.
  const { continueHuman } = useFlowState();

  const owner = data.owner || OWNER_OPTIONS[0].value;
  const due = data.due ?? 'Fri · EOD';
  const note = data.note || '';
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const paused = data.runState === 'paused';
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--handoff${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={UserSwitch} kind="Handoff" />
        {/* "stamp reads 'WITH ANDREW'" — override only while paused; done
            stays the plain default "DONE ✓" (SignalNode.jsx's own
            isMiss-only-overrides-the-miss precedent). */}
        <RunStamp runState={data.runState} label={paused ? withStampLabel(owner) : undefined} />
        <div className="cw-card-title-row">
          <span className="cw-title">Handoff</span>
        </div>
      </div>
      <p className="cw-caption">Pauses the run and hands this step to a person.</p>

      <FieldLabel>Owner</FieldLabel>
      <ComboBox
        value={owner}
        options={OWNER_OPTIONS}
        placeholder="Select an owner..."
        onChange={(v) => updateNodeData(id, { owner: v })}
        ariaLabel="Handoff owner"
      />

      <FieldLabel>Due</FieldLabel>
      <input
        type="text"
        className="cw-input cw-ref-chip nodrag nopan"
        placeholder="Fri · EOD"
        value={due}
        onChange={(e) => updateNodeData(id, { due: e.target.value })}
        aria-label="Due"
        spellCheck={false}
      />

      <FieldLabel>Note</FieldLabel>
      <input
        type="text"
        className="cw-input nodrag nopan"
        placeholder="What does the owner need to know?"
        value={note}
        onChange={(e) => updateNodeData(id, { note: e.target.value })}
        aria-label="Handoff note"
      />

      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}

      {/* RUN PHASE (R2 item 2) — the node "goes live" while paused, same
          Reveal-wrapped mount-only-while-paused shape HumanNode.jsx uses for
          its own live answer block. One fixed action, no value to collect —
          `continueHuman` just needs any truthy value to unblock the
          engine's waitForHuman; 'returned' is a self-documenting sentinel,
          never branched on (Handoff always advances its one plain 'out'). */}
      <Reveal open={paused}>
        <div className="cw-human-live nodrag nopan">
          <button
            type="button"
            className="cw-human-live-submit"
            style={{ flex: 1 }}
            onClick={() => continueHuman?.(id, 'returned')}
          >
            Mark returned
          </button>
        </div>
      </Reveal>

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(HandoffNode);
