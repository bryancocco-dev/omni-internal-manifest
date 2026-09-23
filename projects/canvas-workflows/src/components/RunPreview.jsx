// RUN PHASE (R2 item 3) — "Output artifacts" modal.
//
// Opened from an Output node's "View <format>" row (nodes/OutputNode.jsx)
// once its generation is done. Portaled into #workflow-root — see the CSS
// file's header comment for why (escapes React Flow's pan/zoom transform +
// .cw-canvas-wrap's overflow:hidden clip, stays inside the theme scope).
//
// Content shape: R1's engine (run/engine.js) always writes `data.output` as
// `{ format, content }` where `content` is a plain accumulated string (word
// chunks appended as they stream — see engine.js's streamOutput) — never a
// pre-structured object, for any format. The per-format parsing below is
// grounded in what R3's generate.js (gen/generate.js) actually produces for
// both real and demo mode (formatDirective / demoOutput), not guessed:
//   - Presentation lines are always "N. Title — one-line description."
//   - Spreadsheet is always a markdown table — reuse R3's own
//     `parseMarkdownTable` (exported specifically for this modal, per its
//     header comment) rather than duplicating a second parser.
//   - Email only ever contains a "Subject: " line + body (no From/To) — the
//     spec still wants a From/To/Subject header block, so From/To are mock
//     fill values consistent with the rest of this "mock" prototype.
// Everything else (Text/Doc/Templated Output prose, Teams) degrades
// gracefully for any string, since demo copy varies.
//
// ANDREW ROUND — C3 "the develop tray" (PLAN.md "### C — THE DARKROOM"):
// "clicking it opens RunPreview TO THAT artifact... RunPreview renders the
// same SVG big via artifacts.jsx". Any format OUTSIDE run/artifacts.jsx's
// TEXT_FORMATS (i.e. everything but Text/Email/Teams/Doc) now renders that
// big SVG as the hero — `ArtifactHero` below, checked before the switch ever
// runs. Presentation and Spreadsheet are interpretation calls: rather than
// deleting R2's already-useful real-content views (an actual slide grid,
// an actual parsed table) to make room for the SVG, both keep their
// existing body BELOW the hero as a "Contents" section — the artifact is
// the produced visual identity, the data underneath it is still real.
// Graphic/Video/Audio/Templated Output get the hero alone (replacing the old
// dashed-placeholder box), with a caption line for the three whose demo copy
// is a short concept brief worth keeping visible (stripConceptTag, as
// before).
//
// VERSION HISTORY IN THE OVERLAY (PLAN.md "## VERSION HISTORY IN THE
// OVERLAY") — Bryan: "you should be able to see previous versions of the
// deliverable from the overlay when clicking on a deliverable in the
// deliverables panel, some clean ui that lets you move through the
// versions." OutputNode.jsx already carries the full record (data.versions[]
// + its own on-card VersionPager) — this modal just couldn't read it. Two
// new optional props, `versions`/`versionIndex` (both undefined-safe — every
// caller that doesn't pass them keeps the exact single-version behavior this
// file has always had): a real (2+ entry) `versions` array grows a control
// row under whatever the body rendered — chevrons + a dot pager + a mono
// "vN · latest/N back" readout, a deliberate SIBLING of OutputNode's own
// on-card pager (same direction/disabled semantics, different — always-
// visible, hairline-dot — chrome, so the two read as cousins, not clones).
// Switching plays a crossfade (outgoing 120ms linear out, incoming 200ms
// --cw-e-out up) that is NEVER nodes.css's cw-artifact-develop: that
// animation means "this was just produced," and browsing history is a
// different act (PLAN.md says so explicitly). Styling for all of it lives in
// darkroom.css (this phase's own file grant — see that file's own
// VERSION HISTORY section) — runpreview.css stays untouched, same
// precedent its own header comment already documents for .cw-rp-download.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretLeft,
  CaretRight,
  ChatsCircle,
  Check,
  DownloadSimple,
  EnvelopeSimple,
  FileDoc,
  Image as ImageIcon,
  Layout,
  PresentationChart,
  Table,
  TextT,
  VideoCamera,
  Waveform,
  X,
} from '@phosphor-icons/react';

import { parseMarkdownTable } from '../gen/generate.js';
import Artifact, { artifactAspect, isTextFormat } from '../run/artifacts.jsx';
// VARIANT STUDIO — see OutputNode.jsx's own import comment: a minted
// variant needs the SAME poster it showed in the grid, not a re-roll from
// the general artifact set.
import Poster, { POSTER_ASPECT } from '../run/posters.jsx';
// DELIVERABLE DOWNLOADS — PLAN.md "## DELIVERABLE DOWNLOADS": "RunPreview
// modal: a Download button in its header/chrome... downloads THE artifact
// being previewed." Styling lives in darkroom.css (.cw-rp-download) — this
// file's own runpreview.css is out of that dispatch's file grant, same
// precedent darkroom.css's own header comment already documents.
import { downloadArtifact } from '../run/download.js';
import '../styles/runpreview.css';

// Self-contained duplicate of OutputNode's FORMAT_ICONS (small, and keeps
// this component independently portable — same philosophy nodes/shared.jsx
// documents for its own mock-data duplication across seams).
const FORMAT_ICONS = {
  Presentation: PresentationChart,
  Doc: FileDoc,
  Text: TextT,
  Email: EnvelopeSimple,
  Teams: ChatsCircle,
  Graphic: ImageIcon,
  Video: VideoCamera,
  Audio: Waveform,
  Spreadsheet: Table,
  'Templated Output': Layout,
};

function splitLines(content) {
  return String(content ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// Text / Doc / Templated Output — demoOutput's Doc case leads with a
// markdown "# Heading"; Text/Templated Output usually don't, but treating
// whichever first line shows up as the heading reads fine either way.
function parseProse(content) {
  const lines = splitLines(content);
  if (!lines.length) return { heading: '', paragraphs: [] };
  const [first, ...rest] = lines;
  return { heading: first.replace(/^#+\s*/, ''), paragraphs: rest };
}

// Email — generate.js only ever emits a "Subject: " line (both real and
// demo mode); From/To are mock values, matching this app's "mock" framing
// everywhere else (the header eyebrow, the agent names, ...).
function parseEmail(content) {
  const lines = splitLines(content);
  let subject = '';
  const body = [];
  lines.forEach((line) => {
    const m = !subject && line.match(/^subject\s*:\s*(.+)$/i);
    if (m) subject = m[1].trim();
    else body.push(line);
  });
  return {
    from: 'Omni Workflow',
    to: 'you@company.com',
    subject: subject || body[0] || 'Generated email',
    body: body.length ? body : ['(no content yet)'],
  };
}

// Presentation — generate.js's formatDirective/demoOutput both always shape
// each line as "N. Title — description." (em dash). Falls back to using the
// whole line as the title if that shape isn't there (a real-mode call that
// didn't follow instructions to the letter shouldn't crash the modal).
function parseSlides(content) {
  return splitLines(content)
    .slice(0, 6)
    .map((line) => {
      const stripped = line.replace(/^\d+\.\s*/, '');
      const dashIdx = stripped.indexOf('—');
      if (dashIdx === -1) return { title: stripped, body: '' };
      return { title: stripped.slice(0, dashIdx).trim(), body: stripped.slice(dashIdx + 1).trim() };
    });
}

// Teams — demoOutput's Teams case wraps a lead-in in "**bold**"; this app
// doesn't render markdown elsewhere either, so just drop the asterisks
// rather than showing them literally inside the chat bubble.
function stripBold(content) {
  return String(content ?? '').replace(/\*\*(.+?)\*\*/g, '$1');
}

// Graphic/Video/Audio — demoOutput prefixes each with a "[X concept]" tag;
// strip it since the format icon+label already say what kind of artifact
// this is. Also the caption source for ArtifactHero below (unchanged use).
function stripConceptTag(content) {
  return String(content ?? '').replace(/^\[[^\]]+\]\s*/, '');
}

// VERSION HISTORY IN THE OVERLAY — h/w of an artifactAspect()-shaped
// "W / H" string; higher = taller. Only used to pick the tallest candidate
// across a node's browsable history — see ArtifactHero's own frameAspect
// comment below for why that comparison exists at all.
function aspectRatioValue(aspect) {
  const [w, h] = String(aspect)
    .split('/')
    .map((n) => parseFloat(n.trim()));
  return (h || 1) / (w || 1);
}

// ANDREW ROUND — C3. The big view for every non-text-family format: the
// SAME bespoke SVG the develop tray shows on the node card (run/
// artifacts.jsx's Artifact, keyed off the SAME format+seed so it's pixel-
// identical — no re-roll on open), just larger. Presentation/Spreadsheet
// additionally keep their real-content body (R2's slide grid / parsed
// table) below a hairline "Contents" divider — see this file's header
// comment for why that's not a straight swap. Graphic/Video/Audio/
// Templated Output get the hero alone, with a short caption for the three
// whose demo copy carries one (stripConceptTag, exactly as the old
// dashed-placeholder box already did).
function ArtifactHero({ format, content, seed, poster, imageUrl, frameAspect }) {
  const caption = format === 'Graphic' || format === 'Video' || format === 'Audio' ? stripConceptTag(content).trim() : '';
  // VERSION HISTORY IN THE OVERLAY — `frameAspect` is an override computed
  // once across every browsable version (RunPreview's own comment on the
  // prop it passes down): a Graphic-format Output can draw a DIFFERENT
  // sub-kind per seed (run/artifacts.jsx's kindFor — poster 4:5 vs. social
  // 1:1), so two versions of the SAME node can genuinely disagree on
  // aspect, and "the frame holds the tallest version's aspect while
  // switching" (PLAN.md) means that comparison has to happen across the
  // WHOLE set, not just whichever one is on screen right now. Every other
  // caller (GenerateNode, RemixNode, a single-version Output) leaves this
  // undefined and falls back to exactly the per-current-version computation
  // this line has always done.
  const aspect = frameAspect ?? (poster ? POSTER_ASPECT : artifactAspect(format, seed));
  return (
    <div className="cw-rp-artifact">
      <div className="cw-rp-artifact-frame" style={{ aspectRatio: aspect }}>
        {/* FINAL QUEUE — FQ-A "REAL ADAPTERS". Same frame either way — only
            the art inside changes — so the big view never layout-shifts
            between a real photo and its seeded-SVG fallback. */}
        {imageUrl ? <img src={imageUrl} alt="" /> : poster ? <Poster seed={seed} /> : <Artifact format={format} seed={seed} />}
      </div>
      {caption ? <p className="cw-rp-para cw-rp-artifact-caption">{caption}</p> : null}
      {format === 'Presentation' ? (
        <>
          <div className="cw-rp-artifact-divider">Contents</div>
          <PresentationBody content={content} />
        </>
      ) : null}
      {format === 'Spreadsheet' ? (
        <>
          <div className="cw-rp-artifact-divider">Contents</div>
          <SpreadsheetBody content={content} />
        </>
      ) : null}
    </div>
  );
}

// Extracted verbatim from the old switch cases (RunPreviewBody below no
// longer reaches Presentation/Spreadsheet directly — ArtifactHero calls
// these itself) — same parseSlides/parseMarkdownTable, same markup/classes.
function PresentationBody({ content }) {
  const slides = parseSlides(content);
  if (!slides.length) return <p className="cw-rp-para cw-rp-empty">No slides yet.</p>;
  return (
    <div className="cw-rp-slides">
      {slides.map((s, i) => (
        <div className="cw-rp-slide" key={i}>
          <span className="cw-rp-slide-num">{i + 1}</span>
          <div className="cw-rp-slide-title">{s.title}</div>
          {s.body ? <div className="cw-rp-slide-body">{s.body}</div> : null}
        </div>
      ))}
    </div>
  );
}
function SpreadsheetBody({ content }) {
  // R3's own helper (gen/generate.js), exported specifically for this
  // modal — see this file's header comment.
  const { headers, rows } = parseMarkdownTable(content);
  if (!headers.length) return <p className="cw-rp-para cw-rp-empty">No table yet.</p>;
  return (
    <div className="cw-rp-table-wrap">
      <table className="cw-rp-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunPreviewBody({ format, content, seed, poster, imageUrl, frameAspect }) {
  // ANDREW ROUND C3 — everything outside Text/Email/Teams/Doc is an
  // artifact-bucket format; checked before the switch below ever runs.
  if (!isTextFormat(format)) {
    return <ArtifactHero format={format} content={content} seed={seed} poster={poster} imageUrl={imageUrl} frameAspect={frameAspect} />;
  }
  switch (format) {
    case 'Email': {
      const email = parseEmail(content);
      return (
        <div className="cw-rp-email">
          <div className="cw-rp-email-head">
            <div className="cw-rp-email-row">
              <span className="cw-rp-email-label">From</span>
              <span className="cw-rp-email-value">{email.from}</span>
            </div>
            <div className="cw-rp-email-row">
              <span className="cw-rp-email-label">To</span>
              <span className="cw-rp-email-value">{email.to}</span>
            </div>
            <div className="cw-rp-email-row">
              <span className="cw-rp-email-label">Subject</span>
              <span className="cw-rp-email-value">{email.subject}</span>
            </div>
          </div>
          <div className="cw-rp-email-body">
            {email.body.map((p, i) => (
              <p className="cw-rp-para" key={i}>
                {p}
              </p>
            ))}
          </div>
        </div>
      );
    }

    case 'Teams': {
      const text = stripBold(content).trim();
      return (
        <div className="cw-rp-chat">
          <div className="cw-rp-chat-bubble">{text || 'No message yet.'}</div>
        </div>
      );
    }

    // Text / Doc, and any future/unrecognized text-family format — plain
    // prose w/ heading is the sanest generic fallback. (Templated Output and
    // the rest are caught by the `!isTextFormat` branch above and never
    // reach this switch at all.)
    default: {
      const { heading, paragraphs } = parseProse(content);
      const hasBody = heading || paragraphs.length;
      return (
        <div className="cw-rp-prose">
          {heading ? <h3 className="cw-rp-heading">{heading}</h3> : null}
          {paragraphs.map((p, i) => (
            <p className="cw-rp-para" key={i}>
              {p}
            </p>
          ))}
          {!hasBody ? <p className="cw-rp-para cw-rp-empty">No content yet.</p> : null}
        </div>
      );
    }
  }
}

// FIT + VERSION STEPPER, part B (PLAN.md "## FIT + VERSION STEPPER" —
// "### B — retire the version dots"). Bryan: "lets find a better thing then
// these dots to go back and forth, especially as the amount grows, it needs
// to be something that doesnt require a bunch of realestate in the node
// view, or in the deliverable panel overlay view." A dot-per-version is
// O(n) real estate — at v12 it was a smear. Replaces BOTH this modal's own
// old VersionControlRow dots/chevrons/readout AND OutputNode.jsx's own
// on-card VersionPager dots — ONE shared component, not two. Defined here
// (rather than alongside ArtifactStage in OutputNode.jsx) purely to dodge a
// circular import: OutputNode.jsx already imports this file for the modal
// itself, so OutputNode.jsx importing this NAMED export back is a plain
// one-directional dependency; the reverse would cycle. `size` is the only
// surface-specific knob ("sized down on-card... roomier in the overlay" —
// never a second component): 'compact' for OutputNode's own tight meta row,
// 'roomy' for this modal's own more spacious control row. Footprint is
// CONSTANT regardless of version count within a size — nodes.css's
// `.cw-vstep-readout` reserves a fixed width (verified live: v2/2 and v12/12
// render pixel-identical), unlike the old dot rows which grew a fresh mark
// per version.
//
// The mono "vN / total" readout IS the affordance (PLAN.md, verbatim):
// clicking it opens a compact menu — this app's existing cw-menu language
// (app.css's `.cw-header-menu`/`.cw-menu-item`, nodes/shared.jsx's own
// NodeCommandMenu precedent) — listing every version newest-first with the
// current one checked, capped with internal scroll past ~8 entries
// (nodes.css, same "scroll after N rows" convention ComboBox.jsx's own
// popover already established). Deliberately a plain LOCAL absolutely-
// positioned popover, not portaled: ComboBox.jsx's own on-card popover
// already sets this precedent for a popover that has to live INSIDE a React
// Flow node (so it pans/zooms WITH the card, exactly like every other
// on-card popover in this app) — this modal is ALREADY portaled to
// #workflow-root as a whole, so the identical local-popover markup renders
// at 1:1 scale here for free, no special casing needed either way.
export function VersionStepper({ versions, currentIndex, latestIndex, onSelect, size = 'compact' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuUp, setMenuUp] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click / Escape — same capture+stopPropagation reasoning
  // every other popover in this app gives (NodeCommandMenu, BlockPicker.jsx):
  // index.html owns a bubble-phase "Escape closes the whole builder"
  // listener this would otherwise also trigger (doubly true here, inside a
  // modal that ALSO closes on Escape — capture-and-stop keeps a menu-close
  // Escape from also closing the whole overlay in the same keystroke).
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKeyCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKeyCapture, true);
    };
  }, [menuOpen]);
  // A version change from OUTSIDE this menu (a chevron click, or this
  // modal's own ←/→ keyboard shortcut) should close any open menu rather
  // than leave it pointing at a now-stale list — same instinct ComboBox's
  // own blur-closes gives, just keyed off the value instead of focus.
  useEffect(() => {
    setMenuOpen(false);
  }, [currentIndex]);

  function openMenu() {
    const el = wrapRef.current;
    if (el) {
      // ComboBox.jsx's own measureFlip() verbatim — only flip up when
      // there's genuinely more room the other way, never into an even
      // tighter spot.
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setMenuUp(spaceBelow < 260 && spaceAbove > spaceBelow);
    }
    setMenuOpen(true);
  }

  const total = versions.length;
  const iconSize = size === 'roomy' ? 11 : 9;
  const checkSize = size === 'roomy' ? 13 : 11;

  return (
    <div ref={wrapRef} className={`cw-vstep cw-vstep--${size} nodrag nopan`} role="group" aria-label="Output version history">
      <button
        type="button"
        className="cw-vstep-step"
        onClick={() => onSelect(currentIndex - 1)}
        disabled={currentIndex <= 0}
        aria-label="Previous version"
      >
        <CaretLeft weight="bold" size={iconSize} />
      </button>
      <button
        type="button"
        className="cw-vstep-readout"
        onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        v{currentIndex + 1} / {total}
      </button>
      <button
        type="button"
        className="cw-vstep-step"
        onClick={() => onSelect(currentIndex + 1)}
        disabled={currentIndex >= latestIndex}
        aria-label="Next version"
      >
        <CaretRight weight="bold" size={iconSize} />
      </button>
      {menuOpen ? (
        <div className={`cw-vstep-menu${menuUp ? ' cw-vstep-menu--up' : ''}`} role="menu" aria-label="Jump to version">
          {Array.from({ length: total }, (_, i) => total - 1 - i).map((i) => (
            <button
              key={i}
              type="button"
              role="menuitemradio"
              aria-checked={i === currentIndex}
              className={`cw-menu-item cw-vstep-menu-item${i === currentIndex ? ' is-current' : ''}`}
              onClick={() => {
                onSelect(i);
                setMenuOpen(false);
              }}
            >
              <span className="cw-vstep-menu-check" aria-hidden="true">
                {i === currentIndex ? <Check weight="bold" size={checkSize} /> : null}
              </span>
              v{i + 1}
              {i === latestIndex ? ' · latest' : ''}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Same mount/closing local presence machine FlowCanvas.jsx already uses for
// the issues pill / instructions card (materialize in, plain fade out on
// close, timer duration matched to the CSS's own --cw-d-2/240ms) — kept
// self-contained here rather than lifted into state.jsx so OutputNode can
// just pass `open`/`onClose` declaratively without owning any animation
// timing itself.
export default function RunPreview({
  open,
  onClose,
  format = 'Text',
  content = '',
  seed = 0,
  poster = false,
  // DELIVERABLE DOWNLOADS — nodeId/seq feed the Download button's filename
  // (src/run/download.js). Both optional/undefined-safe: download.js already
  // falls back sanely (nodeNumberToken defaults to "01") if a future caller
  // ever mounts this modal without them.
  nodeId,
  seq,
  // FINAL QUEUE — FQ-A "REAL ADAPTERS" — undefined for every artifact that
  // never got a real photo, in which case this modal behaves exactly as it
  // always has.
  imageUrl,
  imageMime,
  // VERSION HISTORY IN THE OVERLAY — both optional/undefined-safe. `versions`
  // is the node's own data.versions[] verbatim (OutputNode.jsx's own
  // VersionPager reads the identical shape — { content, seed, format,
  // imageUrl?, imageMime? } entries); `versionIndex` is which one THIS open
  // should land on (OutputNode.jsx's own header comment covers its two entry
  // paths — its own View button vs. the shelf's cross-component bridge).
  // Any caller that never passes `versions` (GenerateNode, RemixNode, or an
  // Output card with only one take on record) gets the exact single-version
  // behavior this modal has always had — the flat format/content/seed/...
  // props above stay the sole source of truth and the control row never
  // mounts.
  versions,
  versionIndex,
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const mountedRef = useRef(open);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimerRef.current);
      mountedRef.current = true;
      setClosing(false);
      setMounted(true);
    } else if (mountedRef.current) {
      setClosing(true);
      closeTimerRef.current = setTimeout(() => {
        mountedRef.current = false;
        setMounted(false);
        setClosing(false);
      }, 240); // matches runpreview.css's cw-rp-card-out duration (--cw-d-2)
    }
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // VERSION HISTORY IN THE OVERLAY — a real, browsable history is 2+ takes
  // or not at all; a single recorded version reads the same as no history
  // at all (PLAN.md: "single-version deliverables: the whole control row is
  // absent — not a disabled stub," the exact same absence rule the on-card
  // pager already follows).
  const hasVersions = Array.isArray(versions) && versions.length > 1;
  const latestIndex = hasVersions ? versions.length - 1 : 0;
  const clampIndex = (i) => Math.min(Math.max(i, 0), Math.max(latestIndex, 0));

  // Chrome (dots/chevrons/readout, below) vs. the rendered artifact/body
  // itself deliberately track TWO different indices: `currentIndex` updates
  // the instant a click/key lands (the control row's own immediate
  // feedback — same snappiness as the on-card pager), while `displayIndex`
  // is what's actually painted, lagging behind it just long enough to run
  // the crossfade.
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(versionIndex ?? latestIndex));
  const [displayIndex, setDisplayIndex] = useState(currentIndex);
  const [swapPhase, setSwapPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const swapTimerRef = useRef(null);

  // Re-sync to the caller's requested opening index on every FRESH open — a
  // RunPreview instance never unmounts between opens (this file's own
  // mount/closing machine, just above), so without this a second open would
  // resume wherever the last browse session inside the overlay left off
  // rather than the index THIS open asked for (OutputNode.jsx: latest from
  // the shelf's cross-component bridge, whatever's on-card from its own
  // View button).
  useEffect(() => {
    if (!open) return;
    const idx = clampIndex(versionIndex ?? latestIndex);
    clearTimeout(swapTimerRef.current);
    setCurrentIndex(idx);
    setDisplayIndex(idx);
    setSwapPhase('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(swapTimerRef.current), []);

  // VERSION HISTORY IN THE OVERLAY — the crossfade. NEVER nodes.css's
  // cw-artifact-develop (the darkroom blur-in): that animation means "this
  // was just produced," and browsing history is a different act (PLAN.md
  // says so explicitly). The outgoing content fades out 120ms linear;
  // only once that's actually finished does the content underneath swap
  // (still invisible), then fades back up 200ms --cw-e-out (darkroom.css
  // owns both keyframes). Rapid clicks/keys just keep re-arming the same
  // timer at whatever the LATEST requested target is, so a fast browse
  // lands on where the user stopped instead of flashing through every
  // version in between.
  const goToVersion = useCallback(
    (idx) => {
      const clamped = clampIndex(idx);
      if (clamped === currentIndex) return;
      setCurrentIndex(clamped);
      setSwapPhase('out');
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = setTimeout(() => {
        setDisplayIndex(clamped);
        setSwapPhase('in');
        swapTimerRef.current = setTimeout(() => setSwapPhase('idle'), 200);
      }, 120);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, latestIndex],
  );

  // ESC closes while visible (matches App.jsx's own header-menu convention;
  // checked first and still wins, untouched). VERSION HISTORY IN THE
  // OVERLAY — ← / → now step versions in this SAME listener, guarded off
  // whenever a real form field elsewhere in the app currently holds focus
  // (e.g. a node's own textarea, still focused behind this modal) so arrow-
  // key text editing there is never hijacked into version browsing.
  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (!hasVersions || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const isFormField = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (isFormField) return;
      e.preventDefault();
      goToVersion(e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mounted, onClose, hasVersions, currentIndex, goToVersion]);

  // VERSION HISTORY IN THE OVERLAY — "the frame holds the tallest version's
  // aspect while switching" (PLAN.md): see ArtifactHero's own comment on
  // `frameAspect` for why two versions of the SAME node can genuinely
  // disagree on aspect. Computed across every browsable, hero-eligible
  // (non-text-family) version rather than the current one alone, so the
  // frame's own aspect-ratio never has to move mid-browse. `poster`
  // (VARIANT STUDIO) always resolves to the one fixed POSTER_ASPECT anyway —
  // nothing to compare there.
  const frameAspect = useMemo(() => {
    if (!hasVersions || poster) return undefined;
    let tallest = null;
    versions.forEach((v) => {
      if (isTextFormat(v.format)) return;
      const a = artifactAspect(v.format, v.seed);
      if (!tallest || aspectRatioValue(a) > aspectRatioValue(tallest)) tallest = a;
    });
    return tallest || undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVersions, poster, versions]);

  if (!mounted) return null;

  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null;
  if (!target) return null;

  // VERSION HISTORY IN THE OVERLAY — two different "which version" reads:
  // `selected` (instant, currentIndex) feeds the header identity, the
  // control row's own readout, and Download — everything that should
  // reflect a click/key the moment it lands; `displayed` (lagged,
  // displayIndex) feeds ONLY what RunPreviewBody actually paints, the one
  // thing the crossfade above is staging. Both fall back to the flat
  // top-level props untouched whenever there's no real history to browse.
  const selected = hasVersions ? versions[currentIndex] : null;
  const displayed = hasVersions ? versions[displayIndex] : null;
  const selectedFormat = selected?.format ?? format;
  const displayFormat = displayed?.format ?? format;
  const displayContent = displayed?.content ?? content;
  const displaySeed = displayed?.seed ?? seed;
  const displayImageUrl = displayed ? displayed.imageUrl : imageUrl;

  const Icon = FORMAT_ICONS[displayFormat] || TextT;
  // DELIVERABLE DOWNLOADS — "downloads THE artifact being previewed"
  // (PLAN.md): the SAME format/content/seed/poster this modal is already
  // rendering, plus nodeId/seq purely for the filename (src/run/download.js).
  // FQ-A — imageUrl/imageMime ride along too, so a real photo downloads its
  // real bytes (PNG passthrough) instead of a rasterized SVG.
  // VERSION HISTORY IN THE OVERLAY — downloads the SELECTED version (the
  // control row's own current target — see the `selected` comment above);
  // `version` gains the SAME 1-based "_vN" suffix OutputNode's own chip
  // already passes (src/run/download.js's buildFilename) whenever there's
  // real multi-version history to disambiguate.
  const handleDownload = () =>
    downloadArtifact({
      nodeId,
      format: selectedFormat,
      content: selected?.content ?? content,
      seed: selected?.seed ?? seed,
      poster,
      seq,
      version: hasVersions ? currentIndex + 1 : undefined,
      imageUrl: selected ? selected.imageUrl : imageUrl,
      imageMime: selected ? selected.imageMime : imageMime,
    });

  return createPortal(
    <div className={`cw-runpreview-overlay${closing ? ' is-leaving' : ''}`} onClick={onClose}>
      <div
        className="cw-runpreview-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${displayFormat} preview`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cw-rp-head">
          <span className="cw-rp-icon">
            <Icon weight="regular" size={15} />
          </span>
          <span className="cw-rp-format">{displayFormat}</span>
          <button type="button" className="cw-rp-download" onClick={handleDownload}>
            <DownloadSimple weight="regular" size={13} />
            Download
          </button>
          <button type="button" className="cw-runpreview-close" aria-label="Close preview" onClick={onClose}>
            <X weight="bold" size={13} />
          </button>
        </div>
        <div className="cw-rp-body">
          {/* VERSION HISTORY IN THE OVERLAY — the crossfade wrapper; inert
              (plain, un-classed div) for every single-version deliverable
              since goToVersion/swapPhase never leaves 'idle' when there's no
              control row below to trigger it. */}
          <div
            className={`cw-rp-version-body${
              swapPhase === 'out' ? ' cw-rp-version-body--out' : swapPhase === 'in' ? ' cw-rp-version-body--in' : ''
            }`}
          >
            <RunPreviewBody
              format={displayFormat}
              content={displayContent}
              seed={displaySeed}
              poster={poster}
              imageUrl={displayImageUrl}
              frameAspect={frameAspect}
            />
          </div>
        </div>
        {/* Pinned to the CARD, not the scrolling body. The stepper is the
            control this overlay exists to offer, so it must never be
            something you scroll to find — on a window too short for the
            artifact, the art scrolls underneath and this stays put. */}
        {hasVersions ? (
          <div className="cw-rp-versions">
            <VersionStepper versions={versions} currentIndex={currentIndex} latestIndex={latestIndex} onSelect={goToVersion} size="roomy" />
          </div>
        ) : null}
      </div>
    </div>,
    target,
  );
}
