// Seam C — Nodes
// WAVE 4 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 4 — OPS &
// META").
//
// "Run workflow (accent, eyebrow RUN WORKFLOW): template ComboBox (the real
// template catalog, grouped by category). Engine: one beat, content 'Ran
// 'Social blast' — 8 steps, 6 deliverables.' + mono step-count chip.
// (Honest fake — no recursive engine; the subgraph phase owns real nesting
// later.)"
//
// Architecture call — own node type, same "your call" framing/reasoning as
// LocalizeNode.jsx's own header comment: a single ComboBox field + its own
// narrated readout, standalone like every other --cw-accent action node.
//
// "the REAL template catalog, grouped by category" (master) — reads
// data/templates/index.js's TEMPLATES directly (never a hand-copied
// roster): that array is already category-contiguous end to end (part-a.js:
// Quick start/Content/Research, then part-b.js: Approvals/Data/Operations —
// see that file's own header comment), which is exactly what ComboBox.jsx's
// own grouped-render contract needs ("contiguous groups in the caller's own
// array stay contiguous here, no re-sort needed") — so this needs no
// re-ordering, only a groupOf lookup, the SAME `modelGroup` precedent
// data/models.js already established for this exact ComboBox prop.
//
// This file mutates only its own node data (the template picker) — the
// derived step/deliverable counts and the narrated content line are written
// entirely by run/engine.js's own 'runworkflow' beat (which itself reads the
// SAME TEMPLATES catalog to derive real numbers off the real chosen
// template's graph — see that file's own header note on why "8 steps, 6
// deliverables" isn't an invented pair, it's 'social-blast' 's actual node/
// output count); this component only renders whatever that beat last wrote.

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { FlowArrow } from '@phosphor-icons/react';
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
import { TEMPLATES } from '../data/templates/index.js';

const TEMPLATE_OPTIONS = TEMPLATES.map((t) => ({ value: t.id, label: t.name }));
const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
function templateGroup(value) {
  return TEMPLATE_BY_ID.get(value)?.category || null;
}

function RunWorkflowNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const templateId = data.templateId || TEMPLATES[0].id;
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const done = data.runState === 'done';
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--runworkflow${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={FlowArrow} kind="Run Workflow" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Run Workflow</span>
        </div>
      </div>
      <p className="cw-caption">Runs a whole template as one step.</p>

      <FieldLabel>Template</FieldLabel>
      <ComboBox
        value={templateId}
        options={TEMPLATE_OPTIONS}
        groupOf={templateGroup}
        placeholder="Select a template..."
        onChange={(v) => updateNodeData(id, { templateId: v })}
        ariaLabel="Template"
      />

      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}
      {/* "+ mono step-count chip" (master) — same Fira Code readout class
          Gather's own live counter / Remix's op-stamp already use.
          data.steps/data.deliverables are the engine beat's own derived
          numbers (see this file's own header note), not re-computed here. */}
      {done && data.steps != null ? (
        <div className="cw-version-readout" style={{ marginTop: 6 }}>
          {`${data.steps} STEPS · ${data.deliverables} DELIVERABLES`}
        </div>
      ) : null}

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(RunWorkflowNode);
