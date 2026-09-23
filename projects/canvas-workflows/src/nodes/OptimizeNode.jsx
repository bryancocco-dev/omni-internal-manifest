// Seam C — Nodes
// WAVE 4 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 4 — OPS &
// META").
//
// "Optimize (accent, eyebrow OPTIMIZE): cycles stepper (×2), in + out.
// Engine: content 'Cycle 1: sharpened hook · Cycle 2: tightened CTA —
// projected lift +18%.' (Agentic flourish, honest demo fake.)"
//
// Architecture call — own node type, same "your call" framing/reasoning as
// LocalizeNode.jsx's own header comment (read there for the fuller "why not
// an existing kind family" argument, identical for this node): a stepper
// field + its own narrated-cycle readout, standalone like every other
// --cw-accent action node.
//
// This file mutates only its own node data (the cycles stepper) — the
// per-cycle narrative + projected lift are written entirely by
// run/engine.js's own 'optimize' beat; this component only renders whatever
// that beat last wrote.

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { TrendUp, Minus, Plus } from '@phosphor-icons/react';
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
} from './shared.jsx';

// "cycles stepper (×2)" (master) — ×2 is the DEFAULT (data/blocks.js's own
// 'optimize' makeData()), not a cap; capped here at the length of
// run/engine.js's own OPTIMIZE_ACTIONS roster (6) so every cycle the engine
// narrates is a genuinely distinct action, never a repeat within one run.
// Floor of 1 — "cycles" is meaningless at zero.
const CYCLES_MIN = 1;
const CYCLES_MAX = 4;

function OptimizeNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const cycles = Math.max(CYCLES_MIN, Math.min(CYCLES_MAX, data.cycles ?? 2));
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  function stepCycles(delta) {
    updateNodeData(id, { cycles: Math.max(CYCLES_MIN, Math.min(CYCLES_MAX, cycles + delta)) });
  }

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--optimize${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={TrendUp} kind="Optimize" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Optimize</span>
        </div>
      </div>
      <p className="cw-caption">Runs improvement cycles over the work.</p>

      {/* Read-only echo — above the main field, same footing every other
          in+out content node's own echo row takes. */}
      <UpstreamEchoRow nodeId={id} />

      <FieldLabel>Cycles</FieldLabel>
      {/* Same stepper shape LogicNode.jsx's SplitBody / SignalNode.jsx's
          MeasureBody already reuse (cw-budget-row/-btn/-value, generic
          unscoped rules) — "reuse, don't invent" over a bespoke control. */}
      <div className="cw-budget-row">
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Fewer cycles"
          disabled={cycles <= CYCLES_MIN}
          onClick={() => stepCycles(-1)}
        >
          <Minus weight="bold" size={11} />
        </button>
        <span className="cw-budget-value">{`${cycles} cycle${cycles === 1 ? '' : 's'}`}</span>
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="More cycles"
          disabled={cycles >= CYCLES_MAX}
          onClick={() => stepCycles(1)}
        >
          <Plus weight="bold" size={11} />
        </button>
      </div>

      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(OptimizeNode);
