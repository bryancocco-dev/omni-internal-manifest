// Seam C — Nodes

import { memo } from 'react';
import { StopCircle } from '@phosphor-icons/react';
import { CardEyebrow, NodeActionsToolbar, RunStamp, RunCornerTicks, useRunFinale, InHandle } from './shared.jsx';

function StopNode({ id, data = {}, selected }) {
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);
  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--stop${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={StopCircle} kind="Stop" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Stop</span>
        </div>
      </div>
      <p className="cw-caption">Ends the run here</p>

      <InHandle nodeId={id} />
    </div>
  );
}

export default memo(StopNode);
