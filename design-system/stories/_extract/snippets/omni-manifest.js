// AUTO-EXTRACTED verbatim markup from omni-manifest/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_compare: {
    note: '.omni-compare-card — Light-vs-Full comparison overlay: two bordered panels flanking a shared center label spine, equal-weight CTAs',
    minHeight: 700,
    pad: '24px',
    html: `<div class="app-modal omni-info-modal open" id="omniCompareModal" role="dialog" aria-modal="true" aria-labelledby="omniCompareTitle" style="position:static;visibility:visible;pointer-events:auto">
    <div class="app-modal-card app-modal-card-wide omni-compare-card" role="document" style="max-height:none">
      <header class="app-modal-head omni-compare-head">
        <div class="omni-compare-headtext">
          <h2 class="app-modal-title" id="omniCompareTitle">Two speeds, one canvas</h2>
          <p class="omni-compare-subline">Both are the same OMNI+ canvas underneath. Pick the one that fits the work in front of you. Switch whenever you like &mdash; your files and conversation travel with you.</p>
        </div>
        <button class="app-modal-close" type="button" aria-label="Close" id="omniCompareModalClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </header>
      <div class="omni-compare-body">
        <div class="omni-compare-spine-grid" id="omniCompareSpineGrid">
          <div class="omni-compare-panel omni-compare-panel--light">
            <div class="omni-compare-prow omni-compare-prow--head">
              <span class="omni-compare-panel-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path class="omni-bolt-fill" d="M213.84,118.63a6,6,0,0,0-3.73-4.25L150.88,92.17l15-75a6,6,0,0,0-10.27-5.27l-112,120a6,6,0,0,0,2.28,9.71l59.23,22.21-15,75a6,6,0,0,0,3.14,6.52A6.07,6.07,0,0,0,96,246a6,6,0,0,0,4.39-1.91l112-120A6,6,0,0,0,213.84,118.63ZM106,220.46l11.85-59.28a6,6,0,0,0-3.77-6.8l-55.6-20.85,91.46-98L138.12,94.82a6,6,0,0,0,3.77,6.8l55.6,20.85Z"/>
                </svg>
              </span>
              <h3 class="omni-compare-panel-title">Light Canvas</h3>
            </div>
            <div class="omni-compare-prow omni-compare-prow--lead">Built for speed. A focused conversation that keeps up with your thinking.</div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Instant. Carries nothing it doesn't need.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Fast back-and-forth with your agent.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Reads your briefs, decks and sheets.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Travels light. Making is studio work.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">One focused agent. Switch anytime.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Keeps a light running summary.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Quick answers, drafts, reading through things.</span></div>
            <div class="omni-compare-prow omni-compare-prow--cta">
              <button class="omni-compare-cta" type="button" id="omniCompareChooseLight">Choose Light Canvas</button>
            </div>
          </div>
          <div class="omni-compare-spine" aria-hidden="true">
            <div class="omni-compare-srow"></div>
            <div class="omni-compare-srow"></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Speed</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Chat</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Documents</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Graphics &amp; Styles</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Agents</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Memory</span></div>
            <div class="omni-compare-srow"><span class="omni-compare-srow-label">Best for</span></div>
            <div class="omni-compare-srow"></div>
          </div>
          <div class="omni-compare-panel omni-compare-panel--full">
            <div class="omni-compare-prow omni-compare-prow--head">
              <span class="omni-compare-panel-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                  <rect class="omni-layout-frame" x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="12"/>
                  <rect class="omni-layout-hbar" x="38" y="98" width="180" height="12" fill="currentColor"/>
                  <rect class="omni-layout-vbar" x="98" y="110" width="12" height="92" fill="currentColor"/>
                </svg>
              </span>
              <h3 class="omni-compare-panel-title">Full Canvas</h3>
            </div>
            <div class="omni-compare-prow omni-compare-prow--lead">Built for making. Everything lands on a canvas you keep working.</div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">A touch more deliberate — the studio's all on.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">The same conversation, with a canvas beside it.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Reads them — and writes new ones.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Graphics, styles, lookbooks, photo shoots.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">A team working together, with skills.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Keeps the whole record, on the canvas.</span></div>
            <div class="omni-compare-prow"><span class="omni-compare-bullet" aria-hidden="true"></span><span class="omni-compare-prow-text">Work you'll keep, show, and build on.</span></div>
            <div class="omni-compare-prow omni-compare-prow--cta">
              <button class="omni-compare-cta" type="button" id="omniCompareChooseFull">Open Full Canvas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`
  },

  modal_gateway: {
    note: '.omni-gateway-card — contextual "opens the Canvas" confirm: identity glyph in title + inline info-link to the compare overlay, primary/quiet CTA pair',
    minHeight: 260,
    pad: '24px',
    html: `<div class="app-modal omni-info-modal open" id="omniGatewayModal" role="dialog" aria-modal="true" aria-labelledby="omniGatewayModalTitle" style="position:static;visibility:visible;pointer-events:auto">
    <div class="app-modal-card omni-gateway-card" role="document">
      <header class="app-modal-head omni-gateway-head">
        <span class="omni-compare-panel-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 256 256" fill="none" aria-hidden="true">
            <rect class="omni-layout-frame" x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="12"/>
            <rect class="omni-layout-hbar" x="38" y="98" width="180" height="12" fill="currentColor"/>
            <rect class="omni-layout-vbar" x="98" y="110" width="12" height="92" fill="currentColor"/>
          </svg>
        </span>
        <h2 class="app-modal-title" id="omniGatewayModalTitle">This opens the Canvas<button class="omni-title-info" type="button" id="omniGatewayCompareLink" aria-label="Compare the two ways of working" data-ctl-tip="Compare the two ways of working"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="5.1" r="0.9" fill="currentColor"/><line x1="8" y1="7.4" x2="8" y2="11.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button></h2>
        <button class="app-modal-close" type="button" aria-label="Close" id="omniGatewayModalClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </header>
      <div class="omni-gateway-body">
        <p class="omni-gateway-text">Making things happens on the canvas — it comes on with files, styles, and tools, and your conversation comes along.</p>
        <div class="omni-gateway-actions">
          <button class="omni-compare-cta" type="button" id="omniGatewayContinueBtn">Open the Canvas</button>
          <button class="omni-gateway-quiet" type="button" id="omniGatewayNotNowBtn">Not now</button>
        </div>
      </div>
    </div>
  </div>`
  },

  modal_agentpicker: {
    note: '#agentsModal — Required Agents modal: search + scope sidebar + paginated table; Light single-select shown with real radio inputs (radio-dot CSS inlined here since it is normally gated on body[data-mode="light"])',
    minHeight: 620,
    pad: '24px',
    html: `<style>#agentsModalDemo .app-modal-th-check{visibility:hidden}
#agentsModalDemo .app-modal-check input.omni-agent-radio{border-radius:50%}
#agentsModalDemo .app-modal-check input.omni-agent-radio:checked{background:transparent;border-color:var(--accent)}
#agentsModalDemo .app-modal-check input.omni-agent-radio::after{background-image:none;background:var(--accent);border-radius:50%;inset:4px}
#agentsModalDemo .app-modal-check input.omni-agent-radio:checked::after{opacity:1;transform:scale(1)}</style>
  <div class="app-modal open" id="agentsModalDemo" role="dialog" aria-modal="true" aria-labelledby="agentsModalTitle" style="position:static;visibility:visible;pointer-events:auto">
    <div class="app-modal-card app-modal-card-wide" role="document">
      <header class="app-modal-head">
        <h2 class="app-modal-title" id="agentsModalTitle">Required Agents</h2>
        <button class="app-modal-close" type="button" aria-label="Close" id="agentsModalClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </header>
      <div class="app-modal-searchwrap">
        <span class="app-modal-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search" aria-label="Search agents">
        </span>
      </div>
      <div class="app-modal-body">
        <ul class="app-modal-sidebar" role="tablist" aria-label="Agent scope">
          <li role="tab" aria-selected="false"><span class="app-modal-sidebar-dot"></span><span class="app-modal-sidebar-label">Excluded</span></li>
          <li role="tab" aria-selected="false"><span class="app-modal-sidebar-dot"></span><span class="app-modal-sidebar-label">Included</span></li>
          <li role="tab" class="active" aria-selected="true"><span class="app-modal-sidebar-dot"></span><span class="app-modal-sidebar-label">My Agents</span></li>
        </ul>
        <div class="app-modal-content">
          <div class="app-modal-table" role="table" aria-label="Agents">
            <div class="app-modal-thead" role="row">
              <div class="app-modal-th app-modal-th-check" role="columnheader">
                <span class="app-modal-check"><input type="checkbox" aria-label="Select all"></span>
              </div>
              <div class="app-modal-th app-modal-th-name" role="columnheader">Agent</div>
              <div class="app-modal-th app-modal-th-desc" role="columnheader">Description</div>
              <div class="app-modal-th app-modal-th-date" role="columnheader">Date Modified</div>
            </div>
            <div class="app-modal-tbody" id="agentsModalRows">
              <div class="app-modal-row" data-name="Copywriter">
                <span class="app-modal-check"><input type="radio" class="omni-agent-radio" name="omniAgentRadio" aria-label="Select Copywriter" checked></span>
                <span class="app-modal-row-name">Copywriter</span>
                <span class="app-modal-row-desc">A creative copywriter crafts engaging, persuasive content across briefs and channels.</span>
                <span class="app-modal-row-date">May 10, 2026</span>
              </div>
              <div class="app-modal-row" data-name="Strategist">
                <span class="app-modal-check"><input type="radio" class="omni-agent-radio" name="omniAgentRadio" aria-label="Select Strategist"></span>
                <span class="app-modal-row-name">Strategist</span>
                <span class="app-modal-row-desc">A creative strategist develops innovative concepts and platform-spanning narratives.</span>
                <span class="app-modal-row-date">May 09, 2026</span>
              </div>
              <div class="app-modal-row" data-name="Account">
                <span class="app-modal-check"><input type="radio" class="omni-agent-radio" name="omniAgentRadio" aria-label="Select Account"></span>
                <span class="app-modal-row-name">Account</span>
                <span class="app-modal-row-desc">An account manager builds and maintains client relationships day-to-day.</span>
                <span class="app-modal-row-date">May 07, 2026</span>
              </div>
              <div class="app-modal-row" data-name="Prompt Engineer">
                <span class="app-modal-check"><input type="radio" class="omni-agent-radio" name="omniAgentRadio" aria-label="Select Prompt Engineer"></span>
                <span class="app-modal-row-name">Prompt Engineer</span>
                <span class="app-modal-row-desc">Structures prompts and chains for repeatable, brand-aligned model output.</span>
                <span class="app-modal-row-date">May 04, 2026</span>
              </div>
            </div>
          </div>
          <div class="app-modal-pagination" id="agentsModalPagination">
            <button class="app-modal-page-btn" type="button" aria-label="Previous" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="app-modal-page-meta">1/17</span>
            <button class="app-modal-page-btn" type="button" aria-label="Next">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`
  },

  optioncard_tile: {
    note: '.omni-chooser-tile (chat-aux-mode-tile variant) — third-prompt nudge card: icon chip + stopPropagation info button + title/desc, two-tile equal-weight pair',
    minHeight: 220,
    html: `<div class="omni-light-nudge" id="omniLightNudge">
        <p class="omni-nudge-line">Conversations like this often turn into canvas work — graphics, files, a surface to build on.</p>
        <div class="omni-light-nudge-tiles">
          <button class="chat-aux-mode-tile omni-chooser-tile" type="button" data-omni-choice="full">
            <span class="omni-chooser-info" role="button" tabindex="0" aria-label="Compare the two ways of working">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="8" cy="5.1" r="0.9" fill="currentColor"/>
                <line x1="8" y1="7.4" x2="8" y2="11.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="omni-chooser-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                <rect class="omni-layout-frame" x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="12"/>
                <rect class="omni-layout-hbar" x="38" y="98" width="180" height="12" fill="currentColor"/>
                <rect class="omni-layout-vbar" x="98" y="110" width="12" height="92" fill="currentColor"/>
              </svg>
            </span>
            <span class="omni-chooser-text">
              <span class="omni-chooser-title">Open the Canvas</span>
              <span class="omni-chooser-desc">Graphics, files, a canvas to build on.</span>
            </span>
          </button>
          <button class="chat-aux-mode-tile omni-chooser-tile" type="button" id="omniNudgeStay" data-omni-choice="light">
            <span class="omni-chooser-info" role="button" tabindex="0" aria-label="Compare the two ways of working">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="8" cy="5.1" r="0.9" fill="currentColor"/>
                <line x1="8" y1="7.4" x2="8" y2="11.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="omni-chooser-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path class="omni-bolt-fill" d="M213.84,118.63a6,6,0,0,0-3.73-4.25L150.88,92.17l15-75a6,6,0,0,0-10.27-5.27l-112,120a6,6,0,0,0,2.28,9.71l59.23,22.21-15,75a6,6,0,0,0,3.14,6.52A6.07,6.07,0,0,0,96,246a6,6,0,0,0,4.39-1.91l112-120A6,6,0,0,0,213.84,118.63ZM106,220.46l11.85-59.28a6,6,0,0,0-3.77-6.8l-55.6-20.85,91.46-98L138.12,94.82a6,6,0,0,0,3.77,6.8l55.6,20.85Z"/>
              </svg>
            </span>
            <span class="omni-chooser-text">
              <span class="omni-chooser-title">Keep chatting</span>
              <span class="omni-chooser-desc">Keep it quick — switch anytime.</span>
            </span>
          </button>
        </div>
      </div>`
  },

  chatmessage_systemnote: {
    note: '.omni-mode-note — quiet capability-change row appended to the chat stream on every Light/Full flip (destination glyph + sentence-case aside, no avatar/bubble chrome)',
    minHeight: 60,
    html: `<div class="msg omni-mode-note">
      <span class="omni-mode-note-text">
        <span class="omni-mode-note-icon">
          <svg viewBox="0 0 256 256" fill="none" aria-hidden="true"><rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="16"/><rect x="38" y="98" width="180" height="12" fill="currentColor"/><rect x="98" y="110" width="12" height="92" fill="currentColor"/></svg>
        </span>
        <span>Canvas is on — graphics, files, styles, and your agent team are live.</span>
      </span>
    </div>`
  },

  button_canvasswitch: {
    note: '.rail-tool-canvas — persistent two-way rail switch: present in both modes, destination glyph + tooltip swap via body[data-mode] (shown here in its default Light "open" state)',
    minHeight: 90,
    html: `<button class="rail-tool rail-tool-canvas" type="button" aria-label="Canvas" data-tip="rich">
      <span class="rail-tool-canvas-icon" aria-hidden="true">
        <svg class="omni-sliver-icon-light" width="20" height="20" viewBox="0 0 256 256" fill="none" aria-hidden="true">
          <rect class="omni-layout-frame" x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="12"/>
          <rect class="omni-layout-hbar" x="38" y="98" width="180" height="12" fill="currentColor"/>
          <rect class="omni-layout-vbar" x="98" y="110" width="12" height="92" fill="currentColor"/>
        </svg>
        <svg class="omni-sliver-icon-full" width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M213.84,118.63a6,6,0,0,0-3.73-4.25L150.88,92.17l15-75a6,6,0,0,0-10.27-5.27l-112,120a6,6,0,0,0,2.28,9.71l59.23,22.21-15,75a6,6,0,0,0,3.14,6.52A6.07,6.07,0,0,0,96,246a6,6,0,0,0,4.39-1.91l112-120A6,6,0,0,0,213.84,118.63ZM106,220.46l11.85-59.28a6,6,0,0,0-3.77-6.8l-55.6-20.85,91.46-98L138.12,94.82a6,6,0,0,0,3.77,6.8l55.6,20.85Z"/>
        </svg>
      </span>
      <span class="rail-tool-tip" id="canvasRailTip">
        <span class="rail-tool-tip-title">Canvas</span>
        <span class="rail-tool-tip-body">Open the canvas surface — graphics, files, and styles.</span>
      </span>
    </button>`
  },

  button_edgehandle: {
    note: '.omni-canvas-sliver-tab — right-edge door-handle pill (opt-in ?switch=edge variant): thin canvas-surface strip + centered pill, destination glyph swaps with mode',
    minHeight: 140,
    pad: '40px 24px',
    html: `<div class="omni-canvas-sliver-strip" style="position:relative;height:100px" aria-hidden="true"></div>
    <div class="omni-canvas-sliver-band" style="position:relative;top:-100px;height:100px">
      <button type="button" class="omni-canvas-sliver-tab" id="omniCanvasSliver" aria-label="Open Canvas" data-ctl-tip="Open Canvas" data-ctl-tip-side="left">
        <span class="omni-canvas-sliver-tab-icon" aria-hidden="true">
          <svg class="omni-sliver-icon-light" width="14" height="14" viewBox="0 0 256 256" fill="none" aria-hidden="true">
            <rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-width="16"/>
            <rect x="38" y="98" width="180" height="12" fill="currentColor"/>
            <rect x="98" y="110" width="12" height="92" fill="currentColor"/>
          </svg>
          <svg class="omni-sliver-icon-full" width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M213.84,118.63a6,6,0,0,0-3.73-4.25L150.88,92.17l15-75a6,6,0,0,0-10.27-5.27l-112,120a6,6,0,0,0,2.28,9.71l59.23,22.21-15,75a6,6,0,0,0,3.14,6.52A6.07,6.07,0,0,0,96,246a6,6,0,0,0,4.39-1.91l112-120A6,6,0,0,0,213.84,118.63ZM106,220.46l11.85-59.28a6,6,0,0,0-3.77-6.8l-55.6-20.85,91.46-98L138.12,94.82a6,6,0,0,0,3.77,6.8l55.6,20.85Z"/>
          </svg>
        </span>
      </button>
    </div>`
  }
};
