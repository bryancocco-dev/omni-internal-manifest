// Seam C — Nodes

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Power } from '@phosphor-icons/react';
import { CardEyebrow, FieldLabel, NodeActionsToolbar, RunStamp, RunCornerTicks, useRunFinale, Segmented, OutHandle } from './shared.jsx';

function TriggerNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const mode = data.mode || 'manual';
  const autoStart = !!data.autoStart;
  // RUN PHASE (R2 item 1) — omit the attribute entirely at idle/undefined so
  // no new [data-run-state="..."] selector can ever match a rest-state node;
  // engine.js also writes the literal string 'idle' back after a stop, so
  // this has to check the value, not just truthiness.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  return (
    // MOTION PHASE (M2 item 1) — `--cw-seq` (BFS order, state.jsx) drives the
    // materialize entrance's per-card stagger; nodes.css reads it via
    // calc(var(--cw-seq, 0) * 55ms) as the animation-delay.
    <div
      className={`cw-node cw-node--trigger${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={Power} kind="Trigger" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Trigger</span>
        </div>
      </div>

      <FieldLabel>How it starts</FieldLabel>
      <Segmented
        ariaLabel="Trigger mode"
        value={mode}
        onChange={(v) => updateNodeData(id, { mode: v })}
        options={[
          { value: 'manual', label: 'Manual' },
          { value: 'scheduled', label: 'Scheduled' },
        ]}
      />

      <label className="cw-toggle-row nodrag nopan">
        <span className={`cw-switch${autoStart ? ' is-on' : ''}`}>
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => updateNodeData(id, { autoStart: e.target.checked })}
          />
          <span className="cw-switch-thumb" />
        </span>
        <span className="cw-toggle-copy">
          <span className="cw-toggle-title">Auto-start</span>
          <span className="cw-caption">Run as soon as the canvas opens, without waiting for a prompt.</span>
        </span>
      </label>

      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(TriggerNode);
