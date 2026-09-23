// Seam C — Nodes
//
// COMFY ROUND (CP2, item 5) — "PARAM NODE (utility value node)". Comfy's
// Resolution Selector, translated: a small out-port-only value source
// holding demo-plausible campaign params (Markets multi-chip, Budget
// stepper, Window date-range). No InHandle at all — structurally it can
// only ever be a graph ROOT, same shape as TriggerNode.jsx (see that file's
// own OutHandle-only pattern), which is also why run/engine.js's `run()`
// has to seed traversal from 'params' nodes exactly like it does triggers:
// nothing can ever wire INTO a handle-less node, so nothing would ever
// reach one by ordinary edge-walking.
//
// Kind color is deliberately NEUTRAL (--cw-text-3, an existing text-tier
// token — DESIGN BAR "no new colors") rather than one of the fixed
// --cw-kind-* identities: this isn't a workflow STEP with its own behavior
// like Trigger/Human/Logic/Wait/Stop, it's a plain value carrier.
//
// Full <NodeActionsToolbar> (unlike NoteNode.jsx, which opts out entirely):
// a params node IS a real run participant — "params nodes pass through
// instantly (no beat animation, marked done)" (PLAN.md) — it just never has
// visible work to show. Skip is disabled here (shared.jsx SKIP_DISABLED_
// TYPES) since toggling it would be a no-op the engine can't even observe
// (the params fast-path in engine.js fires unconditionally, same as a
// trigger's own skip-immunity).

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { SlidersHorizontal, Minus, Plus } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  OutHandle,
  // WAVE 4 — THE VERB EXPANSION. MarketChips moved to shared.jsx as
  // ToggleChipRow — see that file's own header comment on the extraction
  // (Guardrail/Localize needed the identical fixed-roster toggle shape).
  ToggleChipRow,
} from './shared.jsx';

// Preset roster — demo-plausible campaign markets. Local to this file (like
// GenerateNode.jsx's own IMG_INPUT_FORMATS/MODEL_OPTIONS precedent) since
// nothing else in the app needs the FULL list, only whatever a given node's
// `data.markets` already holds (shared.jsx's UpstreamEchoRow just echoes the
// selected values, never the roster itself).
const MARKET_OPTIONS = ['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR'];

const BUDGET_STEP = 5000;
const BUDGET_MIN = 0;
const BUDGET_MAX = 2000000;

function formatBudget(n) {
  return `$${Number(n || 0).toLocaleString('en-US')}`;
}

function ParamsNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();

  const markets = data.markets || [];
  const budget = data.budget ?? 50000;
  const window_ = data.window || { start: '', end: '' };

  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const finale = useRunFinale(data.runState, data.seq);

  function toggleMarket(m) {
    const next = markets.includes(m) ? markets.filter((x) => x !== m) : [...markets, m];
    updateNodeData(id, { markets: next });
  }
  function stepBudget(delta) {
    const next = Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, budget + delta));
    updateNodeData(id, { budget: next });
  }
  function setWindowField(key, value) {
    updateNodeData(id, { window: { ...window_, [key]: value } });
  }

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    // COMFY ROUND (CP2, item 5) — data.number now comes from the SAME
    // renumber() pool task/human draw from (state.jsx) — a params node is a
    // first-class "step" in the flow's numbering vocabulary, which is what
    // lets the receiving card's echo chip say "PARAMS · from 04" using a
    // number the reader already recognizes from elsewhere on the canvas.
    <div
      className={`cw-node cw-node--params${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={SlidersHorizontal} number={data.number} kind="Params" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Campaign Params</span>
        </div>
      </div>

      <FieldLabel>Markets</FieldLabel>
      <ToggleChipRow options={MARKET_OPTIONS} selected={markets} onToggle={toggleMarket} />

      <FieldLabel>Budget</FieldLabel>
      <div className="cw-budget-row">
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Decrease budget"
          disabled={budget <= BUDGET_MIN}
          onClick={() => stepBudget(-BUDGET_STEP)}
        >
          <Minus weight="bold" size={11} />
        </button>
        <span className="cw-budget-value">{formatBudget(budget)}</span>
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Increase budget"
          disabled={budget >= BUDGET_MAX}
          onClick={() => stepBudget(BUDGET_STEP)}
        >
          <Plus weight="bold" size={11} />
        </button>
      </div>

      <FieldLabel>Window</FieldLabel>
      <div className="cw-window-row">
        <input
          type="text"
          className="cw-input cw-window-input nodrag nopan"
          placeholder="Sep 1"
          aria-label="Window start"
          value={window_.start}
          onChange={(e) => setWindowField('start', e.target.value)}
        />
        <span className="cw-window-dash" aria-hidden="true">
          –
        </span>
        <input
          type="text"
          className="cw-input cw-window-input nodrag nopan"
          placeholder="Nov 30"
          aria-label="Window end"
          value={window_.end}
          onChange={(e) => setWindowField('end', e.target.value)}
        />
      </div>

      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(ParamsNode);
