// Seam C — Nodes
//
// COMBO-BOX PASS (PLAN.md "## COMBO-BOX PASS — no plain pulldowns")
// : "We should never have a regular pulldown that isn't a
// combo-box with type ahead search again." One shared component replacing
// the two native <select>s this seam had (TaskNode's agent picker, WaitNode's
// unit picker) — everything else about those fields (the data contract, the
// closed-state look) stays exactly as it was.
//
// Filter vs. display, two different strings on purpose — the trickiest bit
// here, worth spelling out: on open the FIELD shows the current value's
// label, fully selected (PLAN.md: "the value selected-all"), so a user who
// starts typing immediately overwrites it. But the POPOVER must show every
// option, unfiltered, at that exact moment (verify #1: "popover opens with
// all 4 agents") — filtering the list by the current label text itself would
// narrow it to just the one already-selected row. `dirty` is the switch: it
// stays false across an open until the user's first real keystroke (onChange
// sets it true), and the filtered list ignores `query` entirely while it's
// false. That's also what "filter resets on open" (PLAN.md) means in code —
// `dirty` (and `query`) both reset on every openCombo() call, so a stale
// search from a prior open-then-Escape never survives into the next one.
//
// openRef mirrors `open` synchronously, same reason shared.jsx's
// useRunFinale keeps runState/seq in refs alongside their state: Tab commits
// without preventDefault, so the browser's own default action moves focus
// on to the next field right after — firing a native blur on this input
// before there's any guarantee React has re-rendered with the `open:false`
// commit() just set. handleBlur reading a plain closed-over `open` there
// could still see the pre-commit `true` and re-cancel what commit() just
// applied. Reading the ref instead is always current the instant it's set,
// independent of React's own render/commit timing.
//
// Esc: closes the popover via the input's own onKeyDown (a normal React
// bubble handler, e.stopPropagation()), which alone is enough given
// #workflow-root is the React root main.jsx mounts into and the shell's
// overlay-closing Escape listener is a `document` BUBBLE listener sitting
// further out (bubble reaches #workflow-root, and this component, first) —
// but a second, belt-and-braces document CAPTURE listener is added anyway
// while open, matching the exact defensive pattern BlockPicker.jsx and
// FlowCanvas.jsx's comment-mode Escape handling already use for every other
// popover in this app, rather than leaning on that ordering alone.
//
// Ref API: exposes `.focus()` via useImperativeHandle so TaskNode's existing
// `agentSelectRef.current?.focus()` (the "+ Agent" chip) keeps working
// completely unchanged — focusing the real <input> fires this component's
// own onFocus, which is what opens the popover.

import { forwardRef, Fragment, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { CaretDown, Check, ArrowUpRight } from '@phosphor-icons/react';
// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 2 — Model Library
// modal") — "Same provider marks replace plain section-label grouping in
// every model ComboBox (Task/Generate) — icon + label per row/section." and
// "a quiet 'Browse all models ↗' link inside every Task/Generate model
// ComboBox's popover footer." Both are OPTIONAL additions (see `groupOf`'s
// own header note above for the precedent this follows): `groupOf` already
// tells this component which provider a row belongs to for every model
// picker; every other ComboBox caller (agent, unit, criteria, owner,
// template...) never supplies one, so `group` stays null there and neither
// the mark nor the footer ever renders — zero behavior change for anything
// that isn't a model picker.
import ProviderMark from '../components/ProviderMark.jsx';

// Kept in sync with .cw-combobox-popover's own max-height (nodes.css) — the
// flip-up decision needs the popover's footprint before it has ever painted
// a frame, same reasoning BlockPicker.jsx's POPOVER_W/POPOVER_MAX_H comment
// gives for its own JS constants.
const POPOVER_MAX_H = 224;
const FLIP_MARGIN = 12;

function normalize(s) {
  return s.trim().toLowerCase();
}

// MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC") —
// "Combo-boxes group by provider (section labels in the popover, same
// cw-section-label voice) wherever models are picked." This component had no
// grouping at all before this phase (a single flat `options` list, as
// TaskNode's AGENT_OPTIONS and WaitNode's UNIT_OPTIONS still are) — extended
// minimally rather than rebuilt: `groupOf` is an OPTIONAL `(value) => string
// | null` prop. When omitted it defaults to "everything ungrouped," so
// every existing caller is byte-identical in behavior. When supplied
// (data/models.js's `modelGroup`), the popover render walks `filtered` in
// order and inserts a `.cw-section-label` header the instant the group
// changes to a truthy value — `filtered` is a plain array `.filter()` of the
// SOURCE `options`, which never reorders, so contiguous groups in the
// caller's own array stay contiguous here with no re-sort needed. Filtering/
// keyboard nav (`highlighted` is an INDEX into `filtered`) are completely
// unaware groups exist — headers are a pure rendering overlay on the exact
// same flat list/index this component already had.
const ComboBox = forwardRef(function ComboBox(
  { value, options, placeholder = 'Select...', onChange, ariaLabel, className = '', groupOf = () => null, onBrowseAll },
  ref,
) {
  const listId = useId();
  const selected = options.find((o) => o.value === value) || null;

  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [query, setQuery] = useState('');
  const [dirty, setDirty] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef(null);

  // Keyboard scroll-follow — with the roster at 28 the popover scrolls
  // (nodes.css max-height), and an arrowed-past-the-fold highlight is
  // useless if it moves out of view. block:'nearest' keeps mouse users
  // unaffected (no jump when hover sets the highlight of a visible row).
  useEffect(() => {
    listRef.current?.querySelector('.is-highlighted')?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const openRef = useRef(false);

  const filtered = dirty ? options.filter((o) => normalize(o.label).includes(normalize(query))) : options;

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  function measureFlip() {
    const el = wrapRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Only flip when there's genuinely more room the other way — never flip
    // into an even tighter spot.
    return spaceBelow < POPOVER_MAX_H + FLIP_MARGIN && spaceAbove > spaceBelow;
  }

  function openCombo() {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    setDirty(false);
    setQuery(selected?.label ?? '');
    const idx = selected ? options.findIndex((o) => o.value === selected.value) : 0;
    setHighlighted(Math.max(0, idx));
    setOpenUp(measureFlip());
    // Select-all happens post-render, once the value above is actually the
    // DOM input's value — a same-tick .select() would still be selecting
    // whatever the PREVIOUS value was.
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function closeCombo() {
    openRef.current = false;
    setOpen(false);
  }

  function cancelCombo() {
    setQuery(selected?.label ?? '');
    setDirty(false);
    closeCombo();
  }

  function commit(option) {
    if (!option) {
      cancelCombo();
      return;
    }
    onChange(option.value);
    setQuery(option.label);
    setDirty(false);
    closeCombo();
  }

  function handleChange(e) {
    const v = e.target.value;
    if (!openRef.current) openCombo();
    setQuery(v);
    setDirty(true);
    setHighlighted(0);
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!openRef.current) {
          openCombo();
          return;
        }
        setHighlighted((h) => (filtered.length ? (h + 1) % filtered.length : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!openRef.current) {
          openCombo();
          return;
        }
        setHighlighted((h) => (filtered.length ? (h - 1 + filtered.length) % filtered.length : 0));
        break;
      case 'Enter':
        if (openRef.current) {
          e.preventDefault();
          commit(filtered[highlighted]);
        }
        break;
      case 'Escape':
        if (openRef.current) {
          e.preventDefault();
          e.stopPropagation();
          cancelCombo();
        }
        break;
      case 'Tab':
        // No preventDefault — Tab still moves focus on to the next field;
        // it just commits the highlight first, same as a native <select>
        // committing whatever's showing when you tab away.
        if (openRef.current) commit(filtered[highlighted]);
        break;
      default:
        break;
    }
  }

  function handleBlur() {
    if (openRef.current) cancelCombo();
  }

  // Belt-and-braces Escape guard (header comment) — mirrors BlockPicker.jsx /
  // FlowCanvas.jsx's own comment-mode listener verbatim: document-level,
  // capture phase, stopPropagation, so it runs ahead of the shell's own
  // document BUBBLE listener that closes the whole workflow overlay. Only
  // registered while this instance is open, so an idle ComboBox (there can
  // be many on the canvas at once) never carries a document listener.
  useEffect(() => {
    if (!open) return undefined;
    function onEscapeCapture(event) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      cancelCombo();
    }
    document.addEventListener('keydown', onEscapeCapture, true);
    return () => document.removeEventListener('keydown', onEscapeCapture, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={`cw-select-wrap cw-combobox ${className}`.trim()} ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        className="cw-select cw-combobox-input nodrag nopan"
        placeholder={placeholder}
        value={open ? query : selected?.label ?? ''}
        onChange={handleChange}
        onFocus={openCombo}
        onClick={openCombo}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="off"
        spellCheck={false}
      />
      <CaretDown weight="bold" size={12} className="cw-select-caret" />
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          ref={listRef}
          className={`cw-combobox-popover nodrag nopan nowheel${openUp ? ' cw-combobox-popover--up' : ''}`}
        >
          {filtered.length === 0 ? (
            <div className="cw-combobox-empty">No matches</div>
          ) : (
            (() => {
              // Closure-local, not state — a render-time scan, same spirit
              // as the IIFE this replaces being a plain .map(); re-runs
              // every render, which is exactly what a derived-from-props
              // value like this should do.
              let lastGroup = null
              return filtered.map((opt, i) => {
                const group = groupOf(opt.value)
                const showGroup = !!group && group !== lastGroup
                lastGroup = group
                return (
                  <Fragment key={opt.value}>
                    {showGroup && (
                      // aria-hidden — purely visual grouping; the flat
                      // role="option" list underneath is unchanged from
                      // before this phase, so screen-reader behavior for
                      // every ComboBox (grouped or not) stays exactly as
                      // it was pre-MODEL FABRIC. PLATFORM CHROME — the
                      // provider mark rides alongside the text label inside
                      // the SAME header (nodes.css scopes a flex override to
                      // `.cw-combobox-popover .cw-section-label` only, so
                      // every OTHER `.cw-section-label` in the app is
                      // untouched); `group` here is always a real provider
                      // name for a model picker (data/models.js's
                      // `modelGroup`), never a group from a non-model
                      // ComboBox (those never call groupOf at all).
                      <div className="cw-section-label" aria-hidden="true">
                        <ProviderMark provider={group} size={12} />
                        {group}
                      </div>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={opt.value === value}
                      className={`cw-combobox-option${i === highlighted ? ' is-highlighted' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => commit(opt)}
                    >
                      {/* PLATFORM CHROME item 3 — "icon + label per row" — a
                          per-row mark alongside the per-section one above,
                          so identity stays legible mid-scroll past a header. */}
                      {group ? <ProviderMark provider={group} size={13} className="cw-combobox-option-mark" /> : null}
                      <span className="cw-combobox-option-label">{opt.label}</span>
                      {opt.value === value && <Check weight="bold" size={12} className="cw-combobox-option-check" />}
                    </button>
                  </Fragment>
                )
              })
            })()
          )}
          {/* PLATFORM CHROME — "a quiet 'Browse all models ↗' link inside
              every Task/Generate model ComboBox's popover footer." Only the
              two model pickers pass onBrowseAll; every other ComboBox in the
              app renders nothing extra here. */}
          {onBrowseAll ? (
            <button
              type="button"
              className="cw-combobox-footer-link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                closeCombo();
                onBrowseAll();
              }}
            >
              Browse all models
              <ArrowUpRight size={11} weight="bold" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default ComboBox;
