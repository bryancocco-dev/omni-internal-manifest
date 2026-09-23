// Seam C — Nodes

import { memo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ClipboardText } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  GenerationBox,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  Segmented,
  Chip,
  UsesRow,
  AttachmentsList,
  QuietRow,
  InHandle,
  OutHandle,
  AGENT_NAMES,
  MOCK_AGENTS,
  UpstreamEchoRow,
  // SUBGRAPHS — the "n steps ↗" chip's entry point (PLAN.md "### Enter /
  // surface"); see shared.jsx's own header comment on dispatchEnterSteps.
  dispatchEnterSteps,
  CHIP_MOCK_ATTACHMENTS, headlineCase, EditableTitle } from './shared.jsx';
import Reveal from './Reveal.jsx';
import ComboBox from './ComboBox.jsx';
// MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC") — same
// neither-seam data/models.js module GenerateNode.jsx already imports from;
// see that file's own header comment on why C can read it directly.
import { AUTO_MODEL_VALUE, TASK_MODEL_OPTIONS, modelGroup } from '../data/models.js';
// PLATFORM CHROME — see GenerateNode.jsx's identical import for the reasoning.
import { openBrowser } from '../components/BrowserModal.jsx';

// COMBO-BOX PASS — AGENT_NAMES is a flat string array (shared.jsx); ComboBox
// wants {value,label} rows. Same 4 names every render, so this is computed
// once at module scope rather than re-mapped inside the component.
const AGENT_OPTIONS = AGENT_NAMES.map((name) => ({ value: name, label: name }));

function TaskNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const agentSelectRef = useRef(null);
  const [instructionsOpen, setInstructionsOpen] = useState(() => !!data.agentInstructions);

  const number = data.number;
  const title = data.title || 'Task / Action';
  const instructions = data.instructions || '';
  const agent = data.agent || '';
  const repeat = data.repeat || 'once';
  // MODEL-AGNOSTIC POSTURE — "default 'Auto — the agent picks'" (PLAN.md).
  const model = data.model || AUTO_MODEL_VALUE;
  const attachments = data.attachments || [];
  const uses = agent && MOCK_AGENTS[agent] ? MOCK_AGENTS[agent].uses : null;
  // NODE BREATHE PHASE — the uses-list/caption pair renders as TWO Reveals
  // (one open, one closed, never both) rather than the ternary's old
  // either/or, so picking an agent "grows" the card instead of snapping
  // straight to the taller layout. `uses` goes null the instant `agent` is
  // cleared — same render the uses-Reveal starts closing — so its own list
  // freezes the last non-null value to show during that close (mirrors
  // FlowCanvas.jsx's issues-pill `lastIssuesRef` pattern for the identical
  // "still animating out, source data already changed" problem).
  const lastUsesRef = useRef(uses);
  if (uses) lastUsesRef.current = uses;
  const displayUses = uses || lastUsesRef.current;
  // RUN PHASE (R2 items 1/3) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const running = data.runState === 'running';
  const hasGeneration = running || !!data.output?.content;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  // SUBGRAPHS — "a quiet 'n steps ↗' chip row at card bottom... during a
  // run it reads 'step 2/3'" (PLAN.md "### Model") — "Parent chip counts
  // up" 1/3 -> 3/3 (Verify), never through a 0/3. `current` favors whichever
  // step is actively in-flight (queued OR running — the cascade's own
  // 35%-queued/65%-running split within one step's slice, engine.js) so the
  // readout advances to "N" the instant step N starts its beat, not only
  // once it's already mid-run; once nothing is in-flight (a beat between
  // steps' own commits, or before the very first commit lands) it falls
  // back to how many have already settled 'done', floored at 1 while ANY
  // steps beat is live at all — so a run in progress never idles back to a
  // bare "0".
  const steps = data.steps;
  const stepCount = Array.isArray(steps?.nodes) ? steps.nodes.length : 0;
  const hasSteps = stepCount > 0;
  const stepsLive = data.runState === 'running' || data.runState === 'queued';
  const stepsDoneCount = hasSteps ? steps.nodes.filter((s) => s.runState === 'done').length : 0;
  const stepsActiveIndex = hasSteps
    ? steps.nodes.findIndex((s) => s.runState === 'running' || s.runState === 'queued')
    : -1;
  const stepsCurrent = Math.min(
    stepCount,
    Math.max(stepsLive ? 1 : 0, stepsActiveIndex >= 0 ? stepsActiveIndex + 1 : stepsDoneCount),
  );
  const stepsLabel = hasSteps
    ? stepsLive
      ? `Step ${stepsCurrent}/${stepCount}`
      : `${stepCount} step${stepCount === 1 ? '' : 's'} ↗`
    : '';
  // Same "freeze the last real value through the close animation" trick as
  // displayUses above (and shared.jsx's UpstreamEchoRow) — Reveal keeps this
  // chip mounted while it collapses, so the label read during that
  // animation must stay whatever it was, not blank the instant `hasSteps`
  // flips false (e.g. the last step just got deleted inside the subview).
  const lastStepsLabelRef = useRef(stepsLabel);
  if (hasSteps) lastStepsLabelRef.current = stepsLabel;
  const displayStepsLabel = hasSteps ? stepsLabel : lastStepsLabelRef.current;

  function handleChip(kind) {
    if (kind === 'agent') {
      agentSelectRef.current?.focus();
      return;
    }
    const mock = CHIP_MOCK_ATTACHMENTS[kind];
    // F2 (QA FINDINGS LEDGER) — "dedupe-on-add per (kind,name)": every
    // +Knowledge base/+Skill/+Tool/+File chip mints the SAME mock name every
    // click (CHIP_MOCK_ATTACHMENTS has one fixture per kind, not a pool), so
    // repeat clicks used to just stack identical rows forever. A click that
    // matches an attachment already on the card is now a no-op instead —
    // the existing row is right there to remove (F2's own × fix, just
    // above) if the user actually wants a fresh one.
    const alreadyAttached = attachments.some((a) => a.kind === mock.kind && a.name === mock.name);
    if (alreadyAttached) return;
    const attachment = {
      id: `${kind}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      name: mock.name,
      kind: mock.kind,
    };
    updateNodeData(id, { attachments: [...attachments, attachment] });
  }

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--task${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={ClipboardText} number={number} kind="Task / Action" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <EditableTitle
            title={title}
            display={headlineCase(title)}
            onCommit={(next) => updateNodeData(id, { title: next })}
          />
        </div>
      </div>

      {/* MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC")
          — "Task cards gain a MODEL row... default 'Auto — the agent
          picks'". Placed as the card's own FIRST field row, mirroring
          GenerateNode.jsx's identical model-row-first layout now that both
          node kinds pick a model the same way — one consistent shape across
          the two pickers this phase touches. */}
      <FieldLabel>Model</FieldLabel>
      <ComboBox
        value={model}
        options={TASK_MODEL_OPTIONS}
        /* Flat list (Bryan: "just list the models in here no reason to call
           out anthroptic company name or whatever") — provider marks on the
           rows carry recognition; the section headers retire. */
        placeholder="Select a model..."
        onChange={(v) => updateNodeData(id, { model: v || null })}
        ariaLabel="Task model"
        onBrowseAll={() => openBrowser('models')}
      />

      {/* COMFY ROUND (CP2, item 5) / WAVE 2 — read-only echo of whatever's
          wired into this task from a Params or Audience node, above TASK
          INSTRUCTIONS per spec. Renders nothing (a collapsed Reveal) when
          no echoable source is connected. */}
      <UpstreamEchoRow nodeId={id} />

      <FieldLabel>Task instructions</FieldLabel>
      <textarea
        className="cw-textarea nodrag nopan"
        placeholder="Guidance for this whole task..."
        rows={3}
        value={instructions}
        onChange={(e) => updateNodeData(id, { instructions: e.target.value })}
      />

      <div className="cw-card-chip-row">
        <Chip kind="agent" label="Agent" onClick={() => handleChip('agent')} />
        <Chip kind="knowledge" label="Knowledge base" onClick={() => handleChip('knowledge')} />
        <Chip kind="skill" label="Skill" onClick={() => handleChip('skill')} />
        <Chip kind="tool" label="Tool" onClick={() => handleChip('tool')} />
        <Chip kind="file" label="File" onClick={() => handleChip('file')} />
      </div>

      {/* NODE BREATHE PHASE — "each attachment sub-card... add AND remove"
          (PLAN.md). Reveal is rendered unconditionally; ITS `open` prop is
          what used to be this block's `attachments.length > 0 &&` guard —
          keeping that guard here instead would unmount Reveal on every
          empty state and defeat its own close animation.
          F2 (QA FINDINGS LEDGER) — the inner list now goes through
          AttachmentsList (shared.jsx), which wires the per-row × (hover-
          reveal, Reveal-staged so a removed chip collapses instead of
          vanishing) that this block never had. */}
      <Reveal open={attachments.length > 0}>
        <AttachmentsList attachments={attachments} onChange={(next) => updateNodeData(id, { attachments: next })} />
      </Reveal>

      <div className={`cw-subcard${agent ? '' : ' is-empty'}`}>
        {/* UI ELEVATION (E2 item 2) — plain caps label + accent dot instead
            of an icon-tile+title header; see nodes.css .cw-agent-label. */}
        <span className="cw-agent-label">
          <span className="cw-agent-label-dot" aria-hidden="true" />
          Agent
        </span>

        {/* COMBO-BOX PASS (PLAN.md) — was a plain <select>;
            data contract unchanged (onChange still writes data.agent exactly
            as before, so the uses-Reveal above and CompiledPanel's SUBAGENTS
            aggregation keep working untouched). agentSelectRef still gets
            handed straight to the component (forwardRef) so the "+ Agent"
            chip's existing agentSelectRef.current?.focus() call (handleChip
            above) keeps opening this exact field with no changes on its
            end — ComboBox opens itself on focus. */}
        <ComboBox
          ref={agentSelectRef}
          value={agent}
          options={AGENT_OPTIONS}
          placeholder="Select an agent..."
          onChange={(v) => updateNodeData(id, { agent: v || null })}
          ariaLabel="Agent"
        />

        <Reveal open={!!uses}>
          <>
            <FieldLabel>Uses</FieldLabel>
            {displayUses?.map((u) => (
              <UsesRow key={u.name} name={u.name} kind={u.kind} />
            ))}
          </>
        </Reveal>
        <Reveal open={!uses}>
          <p className="cw-caption">Select an agent to see the knowledge bases and tools it uses.</p>
        </Reveal>

        {/* Integrated-sweep FAIL C2 — this row was a dead affordance (no
            handler, no backing field). It now reveals a small per-agent
            guidance textarea persisted on the node (data.agentInstructions),
            breathing open/closed through the same Reveal as everything else
            in this card. Starts open when guidance already exists so saved
            text is never hidden behind a closed toggle. */}
        <QuietRow onClick={() => setInstructionsOpen((v) => !v)}>
          {instructionsOpen ? 'Hide instructions' : 'Add instructions'}
        </QuietRow>
        <Reveal open={instructionsOpen}>
          <textarea
            className="cw-textarea nodrag nopan"
            placeholder="Extra guidance for this agent..."
            rows={2}
            value={data.agentInstructions || ''}
            onChange={(e) => updateNodeData(id, { agentInstructions: e.target.value })}
          />
        </Reveal>
      </div>

      <FieldLabel>Repeat</FieldLabel>
      <Segmented
        ariaLabel="Repeat"
        value={repeat}
        onChange={(v) => updateNodeData(id, { repeat: v })}
        options={[
          { value: 'once', label: 'Once' },
          { value: 'schedule', label: 'Schedule' },
          { value: 'until', label: 'Until' },
          { value: 'times', label: 'Times' },
        ]}
      />

      {/* RUN PHASE (R2 item 3) — the task's own generation, streamed live
          into data.output.content (R1's engine); collapsed to 3 lines with
          a "Show more" toggle per PLAN.md R2.3. NODE BREATHE PHASE wraps its
          appearance/disappearance in Reveal — purely the visual mount, never
          touches when/how the run engine itself sets runState or content. */}
      <Reveal open={hasGeneration}>
        <>
          <FieldLabel>Generated</FieldLabel>
          <GenerationBox content={data.output?.content} streaming={running} clamp />
        </>
      </Reveal>

      {/* SUBGRAPHS — "a quiet 'n steps ↗' chip row at card bottom" (PLAN.md
          "### Model"). One of the three "Enter steps" entry points; the
          other two are shared.jsx's NodeCommandMenu row and the Enter
          hotkey (FlowCanvas.jsx) — all funnel into the same cw:enter-steps
          event, so seeding-on-first-entry only has to live in one place
          (state.jsx's enterTaskSteps, called from FlowCanvas.jsx's
          listener). stopPropagation keeps the click from also selecting/
          dragging the card underneath it (nodrag/nopan alone silences RF's
          OWN drag start, not a parent onClick some future wrapper might add
          — cheap insurance, matches this file's other nodrag buttons). */}
      <Reveal open={hasSteps}>
        <button
          type="button"
          className="cw-steps-chip nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            dispatchEnterSteps(id);
          }}
        >
          {displayStepsLabel}
        </button>
      </Reveal>

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(TaskNode);
