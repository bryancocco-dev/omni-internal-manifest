// Seam C — Nodes

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Hourglass } from '@phosphor-icons/react';
import { CardEyebrow, NodeActionsToolbar, RunStamp, RunCornerTicks, useRunFinale, InHandle, OutHandle } from './shared.jsx';
import ComboBox from './ComboBox.jsx';

// COMBO-BOX PASS — same 3 units every render, computed once at module scope
// (mirrors TaskNode.jsx's AGENT_OPTIONS).
const UNIT_OPTIONS = [
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
];

function WaitNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const amount = data.amount ?? '10';
  const unit = data.unit || 'minutes';
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--wait${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={Hourglass} kind="Wait / Delay" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Wait / Delay</span>
        </div>
      </div>
      <p className="cw-caption">Pauses for a set time</p>

      <div className="cw-wait-row">
        <input
          type="text"
          inputMode="numeric"
          className="cw-input cw-input--amount nodrag nopan"
          value={amount}
          onChange={(e) => updateNodeData(id, { amount: e.target.value })}
        />
        {/* COMBO-BOX PASS (PLAN.md) — was a plain <select>;
            data contract unchanged (onChange still writes data.unit exactly
            as before). className carries the existing --unit flex sizing
            straight through onto ComboBox's own root wrapper. */}
        <ComboBox
          className="cw-select-wrap--unit"
          value={unit}
          options={UNIT_OPTIONS}
          onChange={(v) => updateNodeData(id, { unit: v })}
          ariaLabel="Wait unit"
        />
      </div>

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(WaitNode);
