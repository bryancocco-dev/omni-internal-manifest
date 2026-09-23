// Seam C — Nodes
//
// THE CHAT BOX NODE (PLAN.md "## THE CHAT BOX NODE — check-in and sheet
// merge into one") — Bryan, rest-face screenshot in hand: "the agent check
// in node should look more like the exposed and open agent chat box with
// the chat hat. i want to get rid of the node that expands open out of
// this one and merge them into one thing - its really just supposed to be
// a chat box tied to one of the agents or llms... one of the permanent
// options should be to approve to move onto the next step... and just have
// there be what looks like a disabled chat box, with the chat hat closed,
// that opens when its that nodes turn during a run." This file replaces
// the satellite-sheet era (## NODE SHEET, ## NODE SHEET V2, ## HITL
// SPRING-OPEN, ## HITL TWO FACES): no tether, no port, no dismiss ×, no
// second face-swap — ONE card that IS the chat box, always ~460px, asleep
// or awake in place. The hat/composer anatomy (## NODE SHEET V2) and the
// agent-offered chip system (## AGENT-LED CHIPS) move wholesale INTO the
// card; the hug-then-scroll transcript rules are ## HITL MICRO-CHAT's
// original in-card shape, restored. THE SPLIT's own split still holds: a
// check-in never branches, ONE out handle, no options editor — that's
// HumanNode.jsx's job (the GATE).
//
// `data.responseType: 'chat'` still rides along in this node's data (see
// data/blocks.js's makeData / data/templates/builder.js's buildData) even
// though nothing in this file reads it — components/FlowCanvas.jsx's own
// chat-pause camera glide (`chatPausedKey`) still gates on it. That glide's
// own union-box lookup already tolerates a missing `.cw-chat-sheet`
// (`if (sheetEl) {...}`, sheetEl now always null) and simply centers on the
// node alone — exactly "the glide now just centers the node" per this
// phase's own contract. No FlowCanvas.jsx edit was needed.

import { memo, useEffect, useRef, useState } from 'react';
import { useReactFlow, useUpdateNodeInternals, NodeResizer } from '@xyflow/react';
import { ChatsCircle, Sparkle, CaretDown, MagicWand } from '@phosphor-icons/react';
import {
  CardEyebrow,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS") — the "+ Add guidance for
  // the agent" affordance below is a straight reuse of TaskNode.jsx's own
  // "+ Add instructions" quiet-row pattern (QuietRow + Reveal + textarea),
  // not a new component.
  QuietRow,
  InHandle,
  OutHandle,
  // PLUS IS ATTACH (PLAN.md "## PLUS IS ATTACH") — the ONE shared attach-
  // menu component plus its chip/card pieces (shared.jsx's own header
  // comment on that section has the full contract) — the SAME instance
  // HumanNode.jsx's in-card gate and B window also mount.
  AttachMenu,
  AttachChip,
  AttachCard,
  encodeChatAttachment,
} from './shared.jsx';
import Reveal from './Reveal.jsx';
import ComboBox from './ComboBox.jsx';
import { TASK_MODEL_OPTIONS, modelGroup } from '../data/models.js';
import { useFlowState } from '../state.jsx';

// NODE SHEET V2 (PLAN.md "## NODE SHEET V2", item 3 — composer's model
// chip) — "a model chip ('Omni Creative Agent' — or the node's agent if it
// carries one — as a quiet bordered chip with chevron; it opens the
// EXISTING ComboBox with the provider-grouped model list per MODEL-AGNOSTIC
// POSTURE." TASK_MODEL_OPTIONS (data/models.js) has no row for a plain
// agent name — it's a real provider/model roster (Claude, GPT, Gemini...)
// plus the AUTO_MODEL_VALUE pseudo-row. The demo default the contract asks
// for is an AGENT identity, not a model row, so it's synthesized here as a
// second ungrouped pseudo-option (same "ungrouped, ahead of every provider
// section" placement AUTO_MODEL_VALUE already gets — modelGroup resolves
// null for any value MODELS doesn't know about, ComboBox already renders
// that with no section header). Picking a REAL model from the popover
// simply overwrites data.chatModel with that model's own label — no special
// casing needed once the swap happens.
const DEFAULT_CHAT_AGENT_LABEL = 'Omni Creative Agent';

// HITL SPRING-OPEN (PLAN.md "## HITL SPRING-OPEN", item 1) — "one-shot
// entrance on the chat region" the instant this node ENTERS paused. A plain
// ref mirrors the PREVIOUS render's `active` value so this only fires on
// the false->true edge, never on every re-render while still paused (a new
// chat turn, a resize, a chip click all leave `active` unchanged). A fresh
// pause (a new run reaching this node again) always replays it — the ref
// just tracks the last-seen value, nothing persists across it. No
// reduced-motion branch needed here either: nodes.css's own media block
// neutralizes the keyframe directly (opacity-only, no transform), so this
// hook doesn't need to know which mode it's in — it only ever toggles a
// class name.
function useSpringOpen(active) {
  const [springing, setSpringing] = useState(false);
  const wasActiveRef = useRef(active);
  useEffect(() => {
    const was = wasActiveRef.current;
    wasActiveRef.current = active;
    if (active && !was) {
      setSpringing(true);
      const t = setTimeout(() => setSpringing(false), 640);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [active]);
  return springing;
}

function CheckinNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  // RUN PHASE (R2 item 2) — continueHuman(nodeId, value) is R1's context
  // addition (state.jsx), reused here for the Approve chip. HITL
  // MICRO-CHAT — chatWithHuman is the parallel engine seam's own addition.
  // Both optional-chained on call, same defensive footing HumanNode.jsx's
  // own history always held.
  const { continueHuman, chatWithHuman } = useFlowState();

  const number = data.number;
  // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS") — `data.ask` retires from
  // this card entirely: "two voices ask the same question — the builder's
  // ask label AND the agent's opener. The agent's is the honest one."
  // Deliberately never read here (stale safety — a loaded/old checkin may
  // still carry the field, run/engine.js ignores it too).
  // AGENT-LED CHIPS (PLAN.md "## AGENT-LED CHIPS") — `data.options` is
  // stale safety only now (a template step never authors it on a checkin
  // any more; builder.js's own `case 'checkin':` still defaults the field
  // to `[]` for old/loaded data). Deliberately never read here — the chip
  // row is 100% the engine's own `chatOptions`.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const paused = data.runState === 'paused';
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  // chatLog/chatOptions are the engine seam's node-data shape, defaulted so
  // this file never throws if it lands ahead of that seam.
  const chatLog = data.chatLog || [];
  const chatOptions = data.chatOptions || [];
  const lastUserTurn = [...chatLog].reverse().find((m) => m.role === 'user');

  // NODE SHEET V2 item 3 — the composer's model chip. `data.agent`/
  // `data.chatModel` are both optional (no current template sets either on
  // a check-in node); the synthetic first row lets the chip show a real
  // agent identity as its DEFAULT rather than falling back to an empty
  // field — see the import comment above for why a bare string can't just
  // be `value`d straight into ComboBox without a matching options row.
  const chatAgentLabel = data.agent || DEFAULT_CHAT_AGENT_LABEL;
  const chatModelOptions = [{ value: chatAgentLabel, label: chatAgentLabel }, ...TASK_MODEL_OPTIONS];
  const chatModelValue = data.chatModel || chatAgentLabel;

  // Handle count/id changes — React Flow needs to know so it can re-measure
  // and keep edges glued to the right spot (see useUpdateNodeInternals
  // docs). A check-in's handle shape never changes (one in, one out,
  // always — no options-driven branch handles here), so this only ever
  // needs to fire on id change.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  // HITL MICRO-CHAT — the composer's own draft, the agent-reply-pending
  // flag (drives the typing indicator), and the hat's own open/closed
  // toggle. THE CHAT BOX NODE — `hatOpen` now also gates the DORMANT look
  // (the hat only ever visually opens while `paused`; see the render below)
  // and is reset to true on every FRESH pause (below) so a chip row a user
  // collapsed on a PRIOR pause never silently hides the permanent Approve
  // chip on the next one.
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [hatOpen, setHatOpen] = useState(true);
  // PLUS IS ATTACH — the composer's own staged pick, one at a time. Local,
  // never persisted — a SENT attachment lives on in `data.chatLog[i].
  // attachment` instead (run/engine.js), same "draft vs. record" split
  // `draft`/`chatLog` already draw.
  const [attachment, setAttachment] = useState(null);
  // HAT-TOGGLE HEIGHT LOCK (Bryan: "opening and closing this chat hat icon
  // should not resize the node, it should just open and close the chat hat
  // itself") — the instant the user first COLLAPSES the hat during a
  // pause, the box's current rendered height is captured and pinned as an
  // inline height for the REST of that pause: the hat's own Reveal still
  // opens/closes inside, and the transcript (flex: 1) absorbs the freed/
  // reclaimed space, so the card's outer footprint never breathes with the
  // toggle. Cleared when the pause ends (dormant returns to content-driven
  // sizing) — never persisted, refresh-resets doctrine holds.
  const chatBoxRef = useRef(null);
  const [boxLockHeight, setBoxLockHeight] = useState(null);
  useEffect(() => {
    if (!paused) setBoxLockHeight(null);
  }, [paused]);
  function toggleHat() {
    if (paused && boxLockHeight == null && chatBoxRef.current) {
      setBoxLockHeight(Math.round(chatBoxRef.current.getBoundingClientRect().height));
    }
    setHatOpen((v) => !v);
  }
  const transcriptRef = useRef(null);
  const textareaRef = useRef(null);
  // HITL SPRING-OPEN item 1 — one-shot card-emphasis flag, true for a beat
  // right as this node's chat newly opens (see useSpringOpen's own comment).
  const springOpen = useSpringOpen(paused);
  useEffect(() => {
    if (paused) {
      setDraft('');
      setHatOpen(true);
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } else {
      // PLUS IS ATTACH — a staged-but-never-sent pick must not survive
      // into the dormant view.
      setAttachment(null);
    }
  }, [paused]);

  // Auto-scroll to the newest turn — fires on every fresh user OR agent
  // message, and once more when the typing indicator mounts so it never
  // lands scrolled out of view the instant it appears.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length, pending]);

  // chatWithHuman is async in the real (non-demo) adapter path (PLAN.md:
  // "gets ONE agent reply through generateContent") — Promise-wrapped so the
  // typing indicator covers whatever that call actually takes, and safe to
  // call before the seam lands: optional chaining resolves to `undefined`,
  // `await`-ing that still resolves on the next microtask, so `pending`
  // still clears rather than sticking on forever.
  async function sendChat(text) {
    const value = (text || '').trim();
    // PLUS IS ATTACH — a staged attachment allows a text-free send (same
    // "attachments allow a text-free send" rule canvas-attach's own
    // composer already holds), and rides whichever turn actually fires
    // next — a typed message, OR an agent-offered chip click while a pick
    // is still staged.
    if ((!value && !attachment) || pending || !paused) return;
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const outgoing = encodeChatAttachment(value, attachment);
    setAttachment(null);
    setPending(true);
    try {
      await chatWithHuman?.(id, outgoing);
    } finally {
      setPending(false);
    }
  }

  function autoGrowComposer(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }

  // THE CHAT BOX NODE item 5 — "NodeResizer returns to the CARD." No more
  // sheet/card coordinate-space translation (that math existed ONLY because
  // the resize controls used to live on a separate absolutely-positioned
  // satellite while @xyflow/react's resizer always resizes the NODE itself)
  // — the box being resized and the node being resized are now the same
  // element, so the library's own params are already the right numbers.
  // Same bounds HITL MICRO-CHAT originally specified: 380–640 wide,
  // 420–760 tall.
  function persistResize(_event, params) {
    updateNodeData(id, { width: Math.round(params.width), height: Math.round(params.height) });
  }

  const cardStyle = {
    '--cw-seq': data.seq,
    width: data.width ? `${data.width}px` : undefined,
    height: data.height ? `${data.height}px` : undefined,
  };

  // THE CHAT BOX NODE item 3 — the hat only ever reads "open" while this
  // node is actually live (paused); a stale `hatOpen=true` sitting under a
  // dormant box would otherwise paint an open-looking hat with nothing
  // live behind it.
  const hatLive = paused && hatOpen;

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--checkin${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}${springOpen ? ' cw-spring-open' : ''}`}
      style={cardStyle}
      data-run-state={runState}
    >
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={380}
        minHeight={420}
        maxWidth={640}
        maxHeight={760}
        handleClassName="cw-chat-resize-handle"
        lineClassName="cw-chat-resize-line"
        onResize={persistResize}
        onResizeEnd={persistResize}
      />
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={ChatsCircle} number={number} kind="Agent Check-in · Chats" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        {/* No title row — the eyebrow already names this node, and the
            repeated "Agent Check-in" directly beneath it read as a stutter
            (Bryan: "make it so this does not say agent check in twice").
            Unlike task/output cards there is no user-authored title to
            show here; the head closes on the eyebrow + stamp alone. */}
      </div>

      {/* THE AGENT ASKS item 1 — "Rest = head + the dormant chat box,
          nothing else": the "Ask the user for" FieldLabel+input (THE CHAT
          BOX NODE's own item 2) retires outright — the agent's own opener
          (seeded live at pause, run/engine.js) is the one honest question
          now, not a second builder-authored label above it. */}

      {/* THE CHAT BOX NODE item 1 — "ONE OBJECT... no satellite, no tether,
          no port, no dismiss." Always mounted, always in the card's own
          flow — DORMANT (item 2) when not paused, wakes IN PLACE (item 3)
          when it is. */}
      <div
        ref={chatBoxRef}
        className={`cw-chat-box${paused ? '' : ' is-dormant'}${boxLockHeight ? ' is-locked' : ''}`}
        style={boxLockHeight ? { height: `${boxLockHeight}px` } : undefined}
      >
        {/* Transcript grows above the hat once the node is live — hug-
            then-scroll (HITL MICRO-CHAT) — AND STAYS after resolve (Bryan:
            "after the human hits approve and continue it should hold the
            users choice on this screen until the user runs it again"): the
            record of the decision reads on the dormant card, held until
            the next run's own pause-seed replaces it. History persists in
            data.chatLog regardless of this Reveal's open/closed state. */}
        <Reveal open={paused || chatLog.length > 0}>
          <div className="cw-chat-transcript" ref={transcriptRef}>
            {chatLog.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} className={`cw-chat-msg cw-chat-msg--${isUser ? 'user' : 'agent'}`}>
                  {!isUser && (
                    <span className="cw-chat-avatar" aria-hidden="true">
                      <Sparkle weight="fill" size={9} />
                    </span>
                  )}
                  <div className="cw-chat-msg-col">
                    {!isUser && <span className="cw-chat-msg-name">Agent</span>}
                    {/* PLUS IS ATTACH — an attachment-only turn carries no
                        caption; the bubble paragraph is skipped rather than
                        rendering empty (same rule as HumanNode.jsx's own
                        chat box). */}
                    {m.text ? <p className="cw-chat-bubble">{m.text}</p> : null}
                    {isUser && m.attachment && <AttachCard attachment={m.attachment} />}
                  </div>
                </div>
              );
            })}
            {pending && (
              <div className="cw-chat-msg cw-chat-msg--agent">
                <span className="cw-chat-avatar" aria-hidden="true">
                  <Sparkle weight="fill" size={9} />
                </span>
                <div className="cw-chat-msg-col">
                  <span className="cw-chat-msg-name">Agent</span>
                  <div className="cw-chat-typing" role="status" aria-label="Agent is typing">
                    <span className="cw-chat-typing-dot" />
                    <span className="cw-chat-typing-dot" />
                    <span className="cw-chat-typing-dot" />
                  </div>
                </div>
              </div>
            )}
            {!chatLog.length && !pending && (
              <p className="cw-caption cw-chat-empty">Waiting on the agent's opener…</p>
            )}
          </div>
        </Reveal>

        {/* Chat-hat strip — the shell's .chat-aux anatomy re-cut in cw
            tokens. Sits flush on the composer below. DORMANT: closed state,
            "● Choose an option or reply yourself" + chevron down, inert
            (the whole box is a preview, not a control, until it's this
            node's turn). LIVE: opens (one-shot on fresh pause, toggleable
            after), chip row underneath led by the permanent Approve chip. */}
        <div className={`cw-chat-hat${hatLive ? ' is-open' : ''}`}>
          <button
            type="button"
            className="cw-chat-hat-head nodrag nopan"
            onClick={toggleHat}
            disabled={!paused}
            aria-expanded={hatLive}
          >
            <span className="cw-chat-hat-title">
              <span className="cw-chat-hat-dot" aria-hidden="true" />
              <span className="cw-chat-hat-title-text">Choose an option or chat</span>
            </span>
            <CaretDown weight="bold" size={10} className="cw-chat-hat-caret" />
          </button>
          {/* WINDOW TETHER addendum 2 (PLAN.md) — the permanent Approve
              chip that used to lead this row ("THE CHAT BOX NODE" item 4)
              has moved OUT of the hat entirely, into the full-width
              `.cw-chat-approve-button` below the whole box (see that
              button, further down) — Bryan: "make it so [Approve]
              appears below the chat box entirely." The hat body is now
              ONLY the agent-offered tier (AGENT-LED CHIPS) — no
              authored/primary chip mixed in above it. */}
          <Reveal open={hatLive}>
            <div className="cw-chat-hat-body">
              {chatOptions.map((opt, i) => (
                <button
                  key={`chip-${i}`}
                  type="button"
                  className="cw-chat-hat-chip nodrag nopan"
                  disabled={pending}
                  onClick={() => sendChat(opt)}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* NODE SHEET V2 item 3 — the composer mirrors the shell's two-row
            construction: field on top, then plus/wand left + model chip +
            send right. DORMANT: the whole row is inert at reduced opacity
            (`.cw-chat-box.is-dormant`, nodes.css) — placeholder still
            reads, the agent chip still shows which agent this chat is
            tied to, nothing is clickable. LIVE: fully enabled. */}
        <div className="cw-chat-composer">
          {/* PLUS IS ATTACH item 2 — the staged chip lives as the
              composer's own first child, above the field (canvas-attach's
              own placement). Reveal wraps it so a removal/successful send
              animates out instead of vanishing (DESIGN BAR item 4). Only
              ever staged while paused (the menu below is dormant-disabled
              otherwise), so it needs no extra `.is-dormant` treatment of
              its own. */}
          <Reveal open={!!attachment}>
            {attachment ? <AttachChip attachment={attachment} onRemove={() => setAttachment(null)} /> : null}
          </Reveal>
          <textarea
            ref={textareaRef}
            className="cw-chat-composer-input nodrag nopan"
            placeholder="Reply to the agent…"
            rows={1}
            disabled={!paused}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoGrowComposer(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChat(draft);
              }
            }}
          />
          <div className="cw-chat-composer-actions">
            <div className="cw-chat-composer-tools">
              {/* PLUS IS ATTACH item 1/5 — the ONE shared menu component
                  (shared.jsx), mounted identically here and in
                  HumanNode.jsx's own in-card gate + B window. */}
              <AttachMenu nodeId={id} disabled={!paused} attachment={attachment} onAttach={setAttachment} />
              {/* "the wand stays inert" (PLAN.md) — unchanged from before
                  this phase. */}
              <button
                type="button"
                className="cw-chat-composer-tool nodrag nopan"
                aria-label="Creative tools"
                disabled={!paused}
              >
                <MagicWand weight="regular" size={13} />
              </button>
            </div>
            <div className="cw-chat-composer-right">
              {/* MODEL-AGNOSTIC POSTURE — the EXISTING ComboBox,
                  provider-grouped via modelGroup, never a native select.
                  ComboBox has no native disabled prop (out of this seam's
                  file grant) — `.is-dormant` (nodes.css) blocks pointer
                  events on it instead, same visual family as every other
                  inert control in this row. */}
              <ComboBox
                value={chatModelValue}
                options={chatModelOptions}
                /* Flat list (Bryan: "just list the models in here no reason to call
                   out anthroptic company name or whatever") — provider marks on the
                   rows carry recognition; the section headers retire. */
                placeholder="Select a model..."
                onChange={(v) => updateNodeData(id, { chatModel: v || null })}
                ariaLabel="Chat model"
                className={`cw-chat-model-combo${paused ? '' : ' is-dormant'}`}
              />
              <button
                type="button"
                className="cw-chat-send nodrag nopan"
                disabled={(!draft.trim() && !attachment) || pending || !paused}
                onClick={() => sendChat(draft)}
                aria-label="Send"
              >
                {/* Drawn SVG four-point sparkle (the shell's own
                    send-button glyph, ported verbatim), never the
                    paper-plane icon. */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z" />
                  <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WINDOW TETHER addendum 2 — the relocated Approve action: full-
          width, accent-filled, BELOW the entire chat box (outside its
          border), above the guidance row. Same shared `.cw-chat-approve-
          button` class HumanNode.jsx's floating window uses (nodes.css) —
          one button, two hosts. Paused-only: this lives OUTSIDE
          `.cw-chat-box`'s own always-mounted/dormant-styled object, so it
          gets a real mount/unmount (Reveal) rather than that box's
          disabled-at-rest treatment — nothing to click, nothing to see,
          while the card is dormant. Resolution is untouched from the
          chip it replaces: the last thing the user actually SENT into the
          transcript, or 'approved' if they never typed anything. */}
      <Reveal open={paused}>
        <button
          type="button"
          className="cw-chat-approve-button nodrag nopan"
          onClick={() => continueHuman?.(id, lastUserTurn?.text || 'approved')}
        >
          Approve &amp; continue
        </button>
      </Reveal>

      {/* Guidance affordance REMOVED (Bryan: "remove this from option A")
          — the card is purely the chat box now. data.guidance stays honored
          by run/engine.js's derivation priority if present in data (stale
          safety), there's just no UI to author it here anymore. */}

      <InHandle nodeId={id} />
      {/* ONE out handle, always — a check-in never branches. */}
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(CheckinNode);
