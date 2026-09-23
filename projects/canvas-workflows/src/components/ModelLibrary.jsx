// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 2 — Model Library
// modal"). Thin data adapter over BrowserModal.jsx's shared shell. Rail =
// provider folders, REUSING Palette.jsx's <Folder> (LIBRARY PASS's own
// collapsible mechanism) verbatim rather than a second implementation — each
// folder lists that provider's models as compact quick-jump rows; the real
// browsable content (mark + name + a provider/modality/tier meta line +
// Use — MODEL LIBRARY REDESIGN's composed card, see below) lives in the
// main grid, so a rail click scrolls-and-highlights rather than filtering
// (collapsing a folder only hides ITS OWN nav rows, never the grid — pure
// navigation, no side effect on the content pane).
//
// "Use" inserts through the SAME path a palette click-insert already uses —
// addNodeFromPalette with a synthetic {nodeType, makeData()} item, exactly
// the shape data/blocks.js's real PALETTE_SECTIONS entries already carry
// (state.jsx's addNodeFromPalette only ever reads those two fields) — text
// modality lands as a Task pre-set to this model, image/video as a Generate
// pre-set the same way, matching Task/Generate's own default makeData()
// shapes (data/blocks.js) field-for-field except the one model override.

import { useMemo, useRef, useState } from 'react'
import { Brain } from '@phosphor-icons/react'

import { MODELS, PROVIDERS, DEFAULT_VARIANTS, DEFAULT_GENERATE_SEED } from '../data/models.js'
import ProviderMark from './ProviderMark.jsx'
import { Folder } from './Palette.jsx'
import { useFlowState } from '../state.jsx'
import BrowserModal, { useBrowserKind, closeBrowser } from './BrowserModal.jsx'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

const MODALITY_LABEL = { text: 'Text', image: 'Image', video: 'Video', audio: 'Audio', multimodal: 'Multimodal' }
const TIER_LABEL = { fast: 'Fast', frontier: 'Frontier' }

function insertsAsLabel(model) {
  return model.modality === 'text' ? 'Task' : 'Generate'
}

// Mirrors data/blocks.js's own 'task'/'generate' makeData() field-for-field
// (see that file's PALETTE_SECTIONS 'actions' entries) — the only deviation
// is `model` itself, pre-set to the picked roster row instead of the
// palette's own AUTO_MODEL_VALUE/DEFAULT_MODEL defaults.
function insertItemForModel(model) {
  if (model.modality === 'text') {
    return {
      nodeType: 'task',
      makeData: () => ({ number: null, title: 'Task / Action', instructions: '', agent: null, repeat: 'once', model: model.label }),
    }
  }
  return {
    nodeType: 'generate',
    makeData: () => ({
      title: 'Generate key visuals',
      model: model.label,
      prompt: '',
      imageInputs: [],
      variants: DEFAULT_VARIANTS,
      runState: 'idle',
      output: null,
      seed: DEFAULT_GENERATE_SEED,
      seedLocked: false,
      groupId: null,
    }),
  }
}

export default function ModelLibrary() {
  const open = useBrowserKind() === 'models'
  const { addNodeFromPalette } = useFlowState()
  const [search, setSearch] = useState('')
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const [highlightId, setHighlightId] = useState(null)
  const cardRefs = useRef(new Map())
  const highlightTimerRef = useRef(null)

  const toggleFolder = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () => MODELS.filter((m) => !q || m.label.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)),
    [q],
  )

  // PROVIDERS order (data/models.js) is the section order every model
  // ComboBox already trusts (that file's own header comment) — the rail
  // walks the same order so the two surfaces agree.
  const byProvider = useMemo(() => {
    const map = new Map()
    for (const m of filtered) {
      if (!map.has(m.provider)) map.set(m.provider, [])
      map.get(m.provider).push(m)
    }
    return map
  }, [filtered])

  function handleUse(model) {
    addNodeFromPalette(insertItemForModel(model))
    closeBrowser()
  }

  function jumpTo(modelId) {
    cardRefs.current.get(modelId)?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    clearTimeout(highlightTimerRef.current)
    setHighlightId(modelId)
    highlightTimerRef.current = setTimeout(() => setHighlightId(null), 900)
  }

  const rail = (
    <>
      {PROVIDERS.map((provider, i) => {
        const rows = byProvider.get(provider) || []
        if (!rows.length) return null
        const folderId = `model-provider-${provider}`
        return (
          <Folder
            key={provider}
            id={folderId}
            label={`${provider} · ${rows.length}`}
            collapsed={collapsedIds.has(folderId)}
            onToggle={toggleFolder}
            index={i}
          >
            {rows.map((m) => (
              <button key={m.id} type="button" className="cw-bmodal-rail-row" onClick={() => jumpTo(m.id)}>
                <ProviderMark provider={m.provider} size={13} />
                <span>{m.label}</span>
              </button>
            ))}
          </Folder>
        )
      })}
    </>
  )

  return (
    <BrowserModal
      open={open}
      onClose={closeBrowser}
      icon={Brain}
      title="Model library"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search models or providers..."
      rail={rail}
      ariaLabel="Model library"
    >
      {filtered.length ? (
        // `cw-bmodal-grid--models` widens this grid's own columns beyond the
        // shared 148px floor Templates/Workflows still use — the meta line
        // below (provider · modality · tier) needs the extra room to sit on
        // ONE line without truncating; scoped so it never touches those
        // other two modals' own card grids (see browsermodal.css's own
        // comment on the rule).
        <div className="cw-bmodal-grid cw-bmodal-grid--models">
          {filtered.map((m) => (
            <div
              key={m.id}
              ref={(el) => {
                if (el) cardRefs.current.set(m.id, el)
                else cardRefs.current.delete(m.id)
              }}
              className={`cw-mcard${highlightId === m.id ? ' is-highlighted' : ''}`}
            >
              {/* MODEL LIBRARY REDESIGN item 2 — "compose, don't chip-wall":
                  mark + name, one line. Mark carries its real brand color
                  here (mono={false}) — cards are the one place PLAN.md
                  allows it; every other ProviderMark caller in the app
                  (rail rows below, ComboBox popovers) stays the default
                  currentColor mono. */}
              <div className="cw-mcard-head">
                <span className="cw-mcard-mark">
                  <ProviderMark provider={m.provider} size={18} mono={false} />
                </span>
                <span className="cw-mcard-name" title={m.label}>
                  {m.label}
                </span>
              </div>
              {/* ONE quiet mono meta line replacing the old three-chip wall
                  — provider · modality · tier. FRONTIER gets a small accent
                  dot + tinted word instead of a filled pill. Plain inline
                  text (not a flex row of spans) so the container's own
                  overflow:hidden/text-overflow:ellipsis is a real CSS text
                  ellipsis if a future longer label ever needs it — flex
                  children don't ellipsis reliably as a group, they just
                  clip mid-character, which is the ragged failure mode this
                  redesign exists to remove. */}
              <p className="cw-mcard-meta" title={`${m.provider} · ${MODALITY_LABEL[m.modality] || m.modality} · ${TIER_LABEL[m.tier] || m.tier}`}>
                {m.provider}
                <span className="cw-mcard-meta-sep" aria-hidden="true">·</span>
                {MODALITY_LABEL[m.modality] || m.modality}
                <span className="cw-mcard-meta-sep" aria-hidden="true">·</span>
                {m.tier === 'frontier' ? (
                  <span className="cw-mcard-meta-frontier">● {TIER_LABEL.frontier}</span>
                ) : (
                  TIER_LABEL[m.tier] || m.tier
                )}
              </p>
              {/* Footer: quiet Use action + its hover-only "inserts as"
                  supplement share one row so neither ever overlaps the
                  other (the old absolute-positioned hint used to land
                  directly on top of the Use button on hover). */}
              <div className="cw-mcard-foot">
                <span className="cw-mcard-hint">
                  inserts as <b>{insertsAsLabel(m)}</b>
                </span>
                <button type="button" className="cw-mcard-use" onClick={() => handleUse(m)}>
                  Use
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="cw-bmodal-empty">No models match{search ? ` "${search}"` : ''}.</p>
      )}
    </BrowserModal>
  )
}
