// Seam C — Nodes
//
// Cross-seam contract: B imports `{ nodeTypes }` from here (src/App.jsx via
// src/components/FlowCanvas.jsx). Keep this file to just the map + the one
// CSS import — each node's rendering lives in its own file alongside this.

import './nodes.css';

import TriggerNode from './TriggerNode.jsx';
import TaskNode from './TaskNode.jsx';
import HumanNode from './HumanNode.jsx';
// THE SPLIT (PLAN.md "## THE SPLIT — two human nodes: the Gate and the
// Check-in") — the chat half of the old dual-identity human node, lifted
// out wholesale into its own type. See CheckinNode.jsx's own header
// comment.
import CheckinNode from './CheckinNode.jsx';
import OutputNode from './OutputNode.jsx';
import LogicNode from './LogicNode.jsx';
import WaitNode from './WaitNode.jsx';
import StopNode from './StopNode.jsx';
// VARIANT STUDIO (PLAN.md "## VARIANT STUDIO") — the GENERATE action node,
// plus the variant fan-out grid's group/child pair (one file, two types —
// see FrameNode.jsx's own header comment).
import GenerateNode from './GenerateNode.jsx';
import FrameNode, { VariantCard } from './FrameNode.jsx';
// COMFY ROUND (CP2) — item 1 "NOTE BLOCK": an annotation card with zero
// run/graph participation (no handles at all).
import NoteNode from './NoteNode.jsx';
// COMFY ROUND (CP2) — item 5 "PARAM NODE": out-port-only value source.
import ParamsNode from './ParamsNode.jsx';
// WAVE 2 — THE VERB EXPANSION. Source/Audience/Measure share ONE type —
// see SignalNode.jsx's own header comment for the full "why one type"
// reasoning (LogicNode's Gather/Split precedent, the master contract's
// "one signal family" color discipline). WAVE 3 adds Style Reference as a
// fourth kind on this SAME type (SignalNode.jsx's own header note); Compare
// joins LogicNode.jsx as a new `kind` the identical way Gather/Split did.
import SignalNode from './SignalNode.jsx';
// WAVE 3 — THE VERB EXPANSION. Remix is its own node type (not a kind on an
// existing one) — see RemixNode.jsx's own header comment for why.
import RemixNode from './RemixNode.jsx';
// WAVE 4 — THE VERB EXPANSION. Handoff/Localize/Optimize/Run workflow are
// each their own node type — see each file's own header comment for the
// "kind vs. own type" reasoning. Guardrail joins LogicNode's existing `kind`
// switch instead (LogicNode.jsx's own LOGIC_META comment), so it needs no
// entry of its own here.
import HandoffNode from './HandoffNode.jsx';
import LocalizeNode from './LocalizeNode.jsx';
import OptimizeNode from './OptimizeNode.jsx';
import RunWorkflowNode from './RunWorkflowNode.jsx';

// RESULTS SHEET (PLAN.md "## RESULTS SHEET — the frame springs from the
// output node") — the free-standing `results` node type RETIRES: the
// results surface is now a satellite sheet OutputNode.jsx renders off its
// OWN node (ResultsNode.jsx's new `ResultsSheetBody`/`useResultsSheetMeta`
// exports), never a graph node of its own anymore. This tiny no-op stays
// registered under the old type key purely as a "no path may crash on an
// old session state that still carries one" safety net (PLAN.md's own
// wording) — an undo-history entry or a saved-workflow tab snapshot minted
// before this phase could still carry a stray `{ type: 'results' }` node;
// React Flow would otherwise warn/skip on an unregistered type, this just
// makes that a silent, deliberate no-render instead. No template has ever
// authored a `results` step, and state.jsx's resetDeliveryOrder also
// defensively strips any stray one it finds — this is belt-and-braces on
// top of that, not the primary cleanup path.
function RetiredResultsNode() {
  return null;
}

export const nodeTypes = {
  trigger: TriggerNode,
  task: TaskNode,
  human: HumanNode,
  checkin: CheckinNode,
  output: OutputNode,
  logic: LogicNode,
  wait: WaitNode,
  stop: StopNode,
  generate: GenerateNode,
  variantgroup: FrameNode,
  variant: VariantCard,
  note: NoteNode,
  params: ParamsNode,
  signal: SignalNode,
  remix: RemixNode,
  handoff: HandoffNode,
  localize: LocalizeNode,
  optimize: OptimizeNode,
  runworkflow: RunWorkflowNode,
  results: RetiredResultsNode,
};
