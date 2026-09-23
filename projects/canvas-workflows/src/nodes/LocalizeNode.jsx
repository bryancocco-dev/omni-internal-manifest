// Seam C — Nodes
// WAVE 4 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 4 — OPS &
// META").
//
// "Localize (accent, eyebrow LOCALIZE): markets multi-chips (DE, FR, JP, MX
// defaults). Engine: content = per-market lines; single out (downstream
// Gather is the pattern; a template will show it)."
//
// Architecture call (own node type, "your call" per the dispatch — same
// framing Wave 3's Style Reference/Remix got): doesn't slot into LogicNode's
// structural branch/join family or SignalNode's pure-value-source family
// (RemixNode.jsx's own header comment states the identical reasoning this
// file follows) — it's a content-echoing action with one field (a fixed
// market roster) and its own per-market readout, the same STANDALONE-file
// footing every other --cw-accent action node (Task/Output/Generate/Remix)
// already holds despite sharing that one color family.
//
// This file mutates only its own node data — the per-market content lines
// are written entirely by run/engine.js's own 'localize' beat; this
// component only renders whatever that beat last wrote.

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Translate } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  GenerationBox,
  UpstreamEchoRow,
  InHandle,
  OutHandle,
  ToggleChipRow,
} from './shared.jsx';

// "markets multi-chips (DE, FR, JP, MX defaults)" (master, verbatim roster —
// a closed preset, same "X multi-chips (A, B, C defaults)" phrasing this
// dispatch's own Guardrail bullet uses, read the identical way: all four
// selected by default, per data/blocks.js's own 'localize' makeData()).
// run/engine.js keeps its own copy of this SAME roster (pointer-commented)
// for its per-market content lines — same small-table duplication
// convention SOURCE_KIND_OPTIONS/SOURCE_KIND_INGEST already established.
const LOCALIZE_MARKET_OPTIONS = ['DE', 'FR', 'JP', 'MX'];

function LocalizeNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const markets = Array.isArray(data.markets) ? data.markets : LOCALIZE_MARKET_OPTIONS;
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  function toggleMarket(m) {
    const next = markets.includes(m) ? markets.filter((x) => x !== m) : [...markets, m];
    updateNodeData(id, { markets: next });
  }

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--localize${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={Translate} kind="Localize" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Localize</span>
        </div>
      </div>
      <p className="cw-caption">Adapts the work for each selected market.</p>

      {/* Read-only echo — above the main field, same footing every other
          in+out content node's own echo row takes. */}
      <UpstreamEchoRow nodeId={id} />

      <FieldLabel>Markets</FieldLabel>
      <ToggleChipRow options={LOCALIZE_MARKET_OPTIONS} selected={markets} onToggle={toggleMarket} />

      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(LocalizeNode);
