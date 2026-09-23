// Seam C — Nodes

import { memo, useEffect } from 'react';
import { useReactFlow, useNodeConnections, useNodesData, useUpdateNodeInternals } from '@xyflow/react';
import { GitBranch, ArrowsSplit, Repeat as RepeatIcon, ShieldWarning, ArrowsInSimple, Percent, Minus, Plus, Ranking, ShieldCheck } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  OptionsEditor,
  HandleLabelRows,
  InHandle,
  OutHandle,
  GenerationBox,
  UpstreamEchoRow,
  // WAVE 3 — THE VERB EXPANSION. Compare's own ranked-row thumbnails.
  ArtifactThumb,
  // WAVE 4 — THE VERB EXPANSION. Guardrail's own checks editor — see
  // shared.jsx's own header comment on this extraction.
  ToggleChipRow,
} from './shared.jsx';
import ComboBox from './ComboBox.jsx';

const LOGIC_META = {
  if: { icon: GitBranch, title: 'If / Else', caption: 'Branch on a condition' },
  switch: { icon: ArrowsSplit, title: 'Switch / Case', caption: 'Branch on a value' },
  foreach: { icon: RepeatIcon, title: 'For Each', caption: 'Repeat over a list' },
  try: { icon: ShieldWarning, title: 'Try / Catch', caption: 'Branch on failure' },
  // WAVE 1 — THE VERB EXPANSION (PLAN.md "### WAVE 1 — FLOW VERBS"). Both new
  // kinds join the SAME `logic` node type/component as if/switch/foreach/try
  // rather than minting their own node files — "Color discipline" (master
  // contract, "### Shared infrastructure") keeps them in the SAME fixed
  // --cw-kind-logic family, and every port-color roster in this app (flow.
  // css's `.react-flow__node-logic` rule, OmniEdge.jsx's EDGE_KIND_COLORS.
  // logic, nodes.css's .cw-node--logic band/glint rules) is keyed off the
  // node's TYPE, not its kind — so reusing `logic` gets "logic purple"
  // everywhere for free, with zero new CSS anywhere in this app.
  gather: { icon: ArrowsInSimple, title: 'Gather', caption: 'Waits for every incoming branch, then bundles them.' },
  split: { icon: Percent, title: 'A/B Split', caption: 'Splits into two weighted arms.' },
  // WAVE 3 — THE VERB EXPANSION (PLAN.md "### WAVE 3 — CREATIVE CHAIN").
  // "Compare (logic purple, eyebrow COMPARE): fan-in; criteria ComboBox...
  // logic purple per master; Gather's fan-in exemption precedent applies"
  // (this dispatch's own brief) — same `logic` type/component reuse Gather
  // itself already established for "many-in, one out, logic purple."
  compare: { icon: Ranking, title: 'Compare', caption: 'Scores incoming candidates and picks a winner.' },
  // WAVE 4 — THE VERB EXPANSION (PLAN.md "### WAVE 4 — OPS & META"). "Named
  // outs PASS / FLAG (try/catch anatomy)" (master, verbatim) — same `logic`
  // type/component reuse Compare/Gather/Split already established, joining
  // the SAME fixed --cw-kind-logic family for free (this file's own header
  // comment on WAVE 1's identical reasoning applies unchanged here).
  guardrail: { icon: ShieldCheck, title: 'Guardrail', caption: 'Checks the work against a set of rules.' },
};

// WAVE 4 — THE VERB EXPANSION. "checks multi-chips (Legal Playbook, Brand
// Guidelines, Claims register)" (master, verbatim roster — a closed preset,
// same "X multi-chips (A, B, C defaults)" phrasing this dispatch's own
// Localize bullet uses, read the identical way: all three selected by
// default, per blocks.js's own 'guardrail' makeData()). run/engine.js keeps
// its own copy of this SAME roster (pointer-commented) to resolve the
// seeded flagged-check's plausible note — same small-table duplication
// convention SOURCE_KIND_OPTIONS/SOURCE_KIND_INGEST already established,
// since engine.js never imports a node component's own local constants.
const GUARDRAIL_CHECK_OPTIONS = ['Legal Playbook', 'Brand Guidelines', 'Claims register'];

// WAVE 3 — THE VERB EXPANSION. "criteria ComboBox (Brand fit, Clarity,
// Energy)" (master, verbatim options). `value`/`label` the same string —
// same convention MEASURE_KPI_OPTIONS (SignalNode.jsx) already uses for a
// plain, human-readable ComboBox value with no separate internal slug.
// run/engine.js's own 'compare' beat reads `node.data.criteria` back out as
// this SAME string (its own copy, pointer-commented, per this codebase's
// established small-table duplication convention).
const COMPARE_CRITERIA_OPTIONS = [
  { value: 'Brand fit', label: 'Brand fit' },
  { value: 'Clarity', label: 'Clarity' },
  { value: 'Energy', label: 'Energy' },
];

// ---------------------------------------------------------------------------
// GATHER — "many-in legal... one out" (master contract). The join barrier
// that makes this node wait for every incoming branch already lives entirely
// in run/engine.js (runNode's own predecessor-join wait, F4 FIX) — this
// component only gives that wait "a face": a live "N OF M ARRIVED" readout,
// purely DERIVED off each upstream neighbor's own `data.runState`/
// `data.takenHandle` via the same useNodeConnections+useNodesData combo
// shared.jsx's own UpstreamEchoRow already established for "read a connected
// neighbor's live data with zero window-event round trip" (that component's
// own header comment: "updates live... with zero action needed from either
// node component") — never a local counter fed by cw:run-edge, which would
// need its own start/stop lifecycle wiring to reset correctly (and to stay
// silent on an unrelated Run-from-here elsewhere on the canvas). Because
// this is derived fresh from CURRENT data every render, it is automatically
// correct for a full run, a scoped Run-from-here that reaches this node, AND
// one that doesn't (an upstream neighbor this run never touches simply stays
// 'idle', so the count never lights up for it) — no reset event required.
function useGatherArrivals(nodeId) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'target', handleId: 'in' });
  const sourceIds = connections.map((c) => c.source);
  const sourcesData = useNodesData(sourceIds);
  let arrived = 0;
  let anyStarted = false;
  connections.forEach((c, i) => {
    const srcData = sourcesData[i]?.data;
    const runState = srcData?.runState;
    if (runState && runState !== 'idle') anyStarted = true;
    if (runState !== 'done') return;
    // A branching predecessor (if/try/switch/human-choice, or this wave's
    // own split) only actually FED this edge if it took the matching
    // handle — engine.js's own F4 join barrier makes exactly this same
    // FIRED/DEAD distinction (edgeState) for the barrier itself. A plain
    // pass-through predecessor (task/output/wait/generate/params/trigger/
    // foreach/gather) never sets `takenHandle` at all, so `taken == null`
    // reads as "always fired once done" for every one of those — matching
    // engine.js's own advance() default.
    const taken = srcData?.takenHandle;
    const handleId = c.sourceHandle ?? 'out';
    const fired = taken == null ? true : Array.isArray(taken) ? taken.includes(handleId) : taken === handleId;
    if (fired) arrived += 1;
  });
  return { arrived, total: connections.length, anyStarted };
}

function GatherStatus({ nodeId, data }) {
  const { arrived, total, anyStarted } = useGatherArrivals(nodeId);
  if (data.runState === 'done' && data.output?.content) {
    return <GenerationBox content={data.output.content} />;
  }
  if (total > 0 && anyStarted) {
    // Stamp language (RunStamp's own QUEUED/RUNNING/WAITING/DONE), Fira Code
    // via .cw-version-readout (OutputNode.jsx's own version-rail mono
    // readout — generic, unscoped rule, reused rather than inventing a new
    // one: this wave's file grant doesn't include nodes.css). `marginTop`
    // matches .cw-caption's own top margin (10px) for the same rhythm this
    // row replaces/follows.
    return (
      <div className="cw-version-readout" style={{ marginTop: 10 }}>
        {`${arrived} OF ${total} ARRIVED`}
      </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// A/B SPLIT — "TWO % fields locked to 100 (A stepper sets B)" (master
// contract). B is never its own stored field — only `data.percentA` is ever
// written, so the pair can never drift out of sync the way two independently
// editable numbers could ("Issues: sums enforced by UI so none new" is this
// wave's own verify line, for exactly that reason). The stepper reuses
// ParamsNode.jsx's own Budget-row classes verbatim (cw-budget-row/-btn/
// -value — generic, unscoped rules; nodes.css never nests them under
// .cw-node--params despite the name) rather than inventing new ones — this
// wave's file grant doesn't include nodes.css, and DESIGN BAR's own "reuse,
// don't invent" applies just as well to a control shape as to motion.
// ---------------------------------------------------------------------------
const SPLIT_MIN = 0;
const SPLIT_MAX = 100;
const SPLIT_STEP = 10;

function clampPercent(n) {
  return Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, n));
}

function SplitBody({ nodeId, data, updateNodeData }) {
  const percentA = clampPercent(data.percentA ?? 70);
  const percentB = 100 - percentA;

  function stepA(delta) {
    updateNodeData(nodeId, { percentA: clampPercent(percentA + delta) });
  }

  return (
    <>
      {/* WAVE 2 — THE VERB EXPANSION. "receiving Task/Generate/Split echo
          'AUDIENCE · from NN'" (master contract) — Split joins the same
          read-only echo Task/Generate already show, above its own main
          field (the ratio stepper) exactly like theirs sits above TASK
          INSTRUCTIONS / PROMPT. Renders nothing when nothing echoable is
          wired in (a Params or Audience node feeding this Split). */}
      <UpstreamEchoRow nodeId={nodeId} />
      <FieldLabel>Split ratio</FieldLabel>
      <div className="cw-budget-row">
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Decrease A share"
          disabled={percentA <= SPLIT_MIN}
          onClick={() => stepA(-SPLIT_STEP)}
        >
          <Minus weight="bold" size={11} />
        </button>
        <span className="cw-budget-value">{`A ${percentA}% · B ${percentB}%`}</span>
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Increase A share"
          disabled={percentA >= SPLIT_MAX}
          onClick={() => stepA(SPLIT_STEP)}
        >
          <Plus weight="bold" size={11} />
        </button>
      </div>
      {/* named A/B out handles, rendered like if/else's true/false rows —
          the SAME nth-child(1):nth-last-child(2)/(2):nth-last-child(1) CSS
          in nodes.css that makes If/Else's two branch rows "glint
          alternately on node hover" already matches ANY exactly-two-row
          .cw-handle-rows list inside .cw-node--logic, so this gets that
          motion treatment for free too. */}
      <HandleLabelRows
        nodeId={nodeId}
        items={[
          { handleId: 'a', label: `A · ${percentA}%` },
          { handleId: 'b', label: `B · ${percentB}%` },
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// COMPARE — WAVE 3, THE VERB EXPANSION. "criteria ComboBox... content =
// ranked mono list, data.winner set; card shows a small ranked row with the
// winner's thumb" (master contract). `data.ranked`/`data.winner` are both
// written entirely by run/engine.js's own 'compare' beat (this component
// never scores anything itself — same read-only-render posture Gather's own
// GatherStatus takes toward the join barrier one section up); this body
// just renders whatever the engine last wrote, or nothing before a first
// run. The winner's row gets `ArtifactThumb` (shared.jsx) since a candidate
// could be either a Generate node's raw poster or any other content node's
// run/artifacts.jsx artifact — same ambiguity that component already
// resolves for the shared deliverables panel/shelf.
// ---------------------------------------------------------------------------
function CompareBody({ nodeId, data, updateNodeData }) {
  const criteria = data.criteria || 'Brand fit';
  const ranked = Array.isArray(data.ranked) ? data.ranked : [];
  const winnerId = data.winner?.nodeId ?? null;

  return (
    <>
      {/* WAVE 3 — fan-in candidates may include a Params/Audience/Style
          upstream too (any of ECHO_SOURCES' matches) — same echo row every
          other in+out content node gets, above its own main field. */}
      <UpstreamEchoRow nodeId={nodeId} />
      <FieldLabel>Criteria</FieldLabel>
      <ComboBox
        value={criteria}
        options={COMPARE_CRITERIA_OPTIONS}
        placeholder="Select criteria..."
        onChange={(v) => updateNodeData(nodeId, { criteria: v })}
        ariaLabel="Comparison criteria"
      />
      {ranked.length ? (
        <>
          <FieldLabel>Ranked</FieldLabel>
          <div className="cw-compare-rank-list">
            {ranked.map((r, i) => {
              const isWinner = r.nodeId === winnerId;
              return (
                <div key={r.nodeId} className={`cw-compare-rank-row${isWinner ? ' is-winner' : ''}`}>
                  <span className="cw-compare-rank-num">{i + 1}</span>
                  {/* Thumb only on the winner — "the winner's thumb" (master,
                      verbatim), not one per row: a full ranked-row gallery
                      wasn't asked for and would crowd this compact card. */}
                  {isWinner ? (
                    <span className="cw-compare-rank-thumb">
                      <ArtifactThumb output={r.output} compact />
                    </span>
                  ) : null}
                  <span className="cw-compare-rank-node">{r.label}</span>
                  <span className="cw-compare-rank-score">{r.score.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// GUARDRAIL — WAVE 4, THE VERB EXPANSION. "checks multi-chips (Legal
// Playbook, Brand Guidelines, Claims register). Named outs PASS / FLAG
// (try/catch anatomy). Engine: seeded ~75% pass; content '2 checks passed ·
// 1 note: soften \'guaranteed\'.'; FLAG arm fires only on miss (single-arm
// routing like if/else)" (master contract). Toggling checks is this
// component's only mutation (updateNodeData); the pass/flag roll, which
// check gets flagged, and the content string are all written entirely by
// run/engine.js's own 'guardrail' beat — same read-only-render posture
// CompareBody/GatherStatus already take toward their own engine cases.
// ---------------------------------------------------------------------------
function GuardrailBody({ nodeId, data, updateNodeData }) {
  const checks = Array.isArray(data.checks) ? data.checks : GUARDRAIL_CHECK_OPTIONS;

  function toggleCheck(c) {
    const next = checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c];
    updateNodeData(nodeId, { checks: next });
  }

  return (
    <>
      {/* Fan-in candidate may include a Params/Audience/Style upstream too —
          same echo row every other in+out content node gets. */}
      <UpstreamEchoRow nodeId={nodeId} />
      <FieldLabel>Checks</FieldLabel>
      <ToggleChipRow options={GUARDRAIL_CHECK_OPTIONS} selected={checks} onToggle={toggleCheck} />
      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}
    </>
  );
}

function LogicNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const kind = data.kind || 'if';
  const meta = LOGIC_META[kind] || LOGIC_META.if;
  const Icon = meta.icon;
  const options = data.options || [];
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  // Switch's case-<i> handles are index-based (§Graph schema), so any change
  // to the options list changes handle identity, not just count.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, kind, options.length, updateNodeInternals]);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--logic${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={Icon} kind={meta.title} />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">{meta.title}</span>
        </div>
      </div>
      <p className="cw-caption">{meta.caption}</p>

      {kind === 'switch' && (
        <>
          <FieldLabel>Options → next step</FieldLabel>
          <OptionsEditor options={options} onChange={(next) => updateNodeData(id, { options: next })} />
          <p className="cw-caption">Connect each option handle on the right to the step it should lead to.</p>
          <HandleLabelRows nodeId={id} items={options.map((o, i) => ({ handleId: `case-${i}`, label: o.label || 'Case' }))} />
        </>
      )}

      {kind === 'if' && (
        <HandleLabelRows
          nodeId={id}
          items={[
            { handleId: 'true', label: 'True' },
            { handleId: 'false', label: 'False' },
          ]}
        />
      )}

      {kind === 'try' && (
        <HandleLabelRows
          nodeId={id}
          items={[
            { handleId: 'try', label: 'Try' },
            { handleId: 'catch', label: 'Catch' },
          ]}
        />
      )}

      {/* WAVE 1 — THE VERB EXPANSION */}
      {kind === 'gather' && <GatherStatus nodeId={id} data={data} />}
      {kind === 'split' && <SplitBody nodeId={id} data={data} updateNodeData={updateNodeData} />}
      {/* WAVE 3 — THE VERB EXPANSION */}
      {kind === 'compare' && <CompareBody nodeId={id} data={data} updateNodeData={updateNodeData} />}
      {/* WAVE 4 — THE VERB EXPANSION */}
      {kind === 'guardrail' && <GuardrailBody nodeId={id} data={data} updateNodeData={updateNodeData} />}

      {/* WAVE 4 — THE VERB EXPANSION. "Named outs PASS / FLAG (try/catch
          anatomy)" (master) — same fixed, never-added/removed branch-row
          shape as if/try above (not switch's dynamic options-driven list),
          so it renders unconditionally the identical way. */}
      {kind === 'guardrail' && (
        <HandleLabelRows
          nodeId={id}
          items={[
            { handleId: 'pass', label: 'Pass' },
            { handleId: 'flag', label: 'Flag' },
          ]}
        />
      )}

      <InHandle nodeId={id} />
      {kind === 'foreach' && <OutHandle nodeId={id} />}
      {/* Gather mirrors foreach: one plain 'out', nothing to branch on.
          Split renders NO plain out — only its two named 'a'/'b' rows
          above, same shape as if/try/switch. Compare mirrors Gather/foreach
          exactly — many-in (the SAME single 'in' handle above; nothing in
          this app caps how many edges may target it), one plain 'out'
          carrying the winner (run/engine.js's own extended
          upstreamOutputs()). */}
      {kind === 'gather' && <OutHandle nodeId={id} />}
      {kind === 'compare' && <OutHandle nodeId={id} />}
    </div>
  );
}

export default memo(LogicNode);
