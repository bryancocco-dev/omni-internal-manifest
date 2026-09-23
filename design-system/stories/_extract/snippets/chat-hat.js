// AUTO-EXTRACTED verbatim markup from chat-hat/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  topnav: {
    note: '.topnav — global header bar (workspace switch, canvas tabs, presence)',
    minHeight: 56,
    pad: '0',
    html: `<div class="topnav">
    <div class="nav-icon-cell" id="navMenuBtn" title="Menu" role="button" tabindex="0" aria-label="Open navigation panel" aria-controls="railPanel" aria-expanded="false">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div class="omni-cell">
      <img class="omni-logo omni-logo--sm" src="omni-logo.png" alt="OMNI" />
    </div>

    <div class="nav-icon-cell nav-icon-cell--bordered" title="Home">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div class="workspace" id="workspaceBtn" title="Workspace" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="workspaceMenu">
      <span>Omnicom Precision Marketing</span>
      <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div class="tab active" data-tab="canvas" role="button" tabindex="0">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      canvas_1
    </div>
    <div class="tab" data-tab="table" role="button" tabindex="0">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      canvas_2
    </div>

    <div class="add-tab" title="New tab">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1"/><path d="M9 5.5v7M5.5 9h7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-right">
      <div class="me">
        <span class="avatar" aria-label="Bryan Cocco">BC</span>
        <span>Bryan</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <button class="nav-menu-secondary" id="navMenuBtn2" type="button" aria-label="Open navigation panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>`
  },

  tabs: {
    note: '.tab strip — canvas tabs from the topnav, active state on canvas_1',
    minHeight: 48,
    html: `<div class="tab active" data-tab="canvas" role="button" tabindex="0">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      canvas_1
    </div>
    <div class="tab" data-tab="table" role="button" tabindex="0">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      canvas_2
    </div>`
  },

  siderail: {
    note: '.side-rail — vertical workspace rail with title + rail-tools (agents/knowledge/tools/instructions)',
    minHeight: 540,
    pad: '0',
    html: `<div style="display:inline-grid;grid-template-columns:var(--rail-w,80px);grid-template-rows:1fr;height:540px;vertical-align:top">
    <div class="side-rail">
      <button class="rail-back" id="backToHub" title="Back to Internal Manifest" aria-label="Back to Internal Manifest">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l6-6M5 12l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="rail-title">CANVAS</div>
      <div class="rail-tools" role="group" aria-label="Workspace tools">
        <button class="rail-tool rail-tool-agents" type="button" aria-label="Agents" data-tip="rich">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect class="rail-tool-bot-body" x="4" y="7" width="16" height="12" rx="2.5"/>
            <circle class="rail-tool-bot-eye rail-tool-bot-eye-l" cx="9" cy="13" r="1.4" fill="currentColor" stroke="none"/>
            <circle class="rail-tool-bot-eye rail-tool-bot-eye-r" cx="15" cy="13" r="1.4" fill="currentColor" stroke="none"/>
            <line class="rail-tool-bot-antenna" x1="12" y1="3.5" x2="12" y2="7"/>
            <circle class="rail-tool-bot-antenna-tip" cx="12" cy="3.5" r="1" fill="currentColor" stroke="none"/>
            <path class="rail-tool-bot-bolt rail-tool-bot-bolt-l" d="M5.5 2.5 L4 4.5 L5 4.5 L3.5 6.5" stroke-width="0.9"/>
            <path class="rail-tool-bot-bolt rail-tool-bot-bolt-r" d="M18.5 2.5 L20 4.5 L19 4.5 L20.5 6.5" stroke-width="0.9"/>
          </svg>
          <span class="rail-tool-tip" id="agentsRailTip" aria-hidden="true">
            <span class="rail-tool-tip-title">Agents</span>
            <span class="rail-tool-tip-body"><strong data-tip-x>0</strong> of <strong data-tip-y>0</strong> workspace agents are available in this Canvas</span>
          </span>
        </button>
        <button class="rail-tool rail-tool-knowledge" type="button" aria-label="Knowledge base" data-tip="rich">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <ellipse class="rail-tool-kb-incoming" cx="12" cy="5.5" rx="8" ry="2.5"/>
            <ellipse class="rail-tool-kb-top" cx="12" cy="5.5" rx="8" ry="2.5"/>
            <path class="rail-tool-kb-mid" d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/>
            <path class="rail-tool-kb-bot" d="M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/>
            <ellipse class="rail-tool-kb-outgoing" cx="12" cy="17.5" rx="8" ry="2.5"/>
          </svg>
          <span class="rail-tool-tip" id="knowledgeRailTip" aria-hidden="true">
            <span class="rail-tool-tip-title">Knowledge Bases</span>
            <span class="rail-tool-tip-body"><strong data-tip-x>0</strong> of <strong data-tip-y>0</strong> knowledge bases are available in this Canvas</span>
          </span>
        </button>
        <button class="rail-tool rail-tool-tools" type="button" aria-label="Tools" data-tip="rich">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <g class="rail-tool-tb-lid">
              <path class="rail-tool-tb-handle" d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5"/>
              <path class="rail-tool-tb-top" d="M3 11.5 L3 8 A1.5 1.5 0 0 1 4.5 6.5 L19.5 6.5 A1.5 1.5 0 0 1 21 8 L21 11.5 Z"/>
            </g>
            <path class="rail-tool-tb-body" d="M3 11.5 L21 11.5 L21 18 A1.5 1.5 0 0 1 19.5 19.5 L4.5 19.5 A1.5 1.5 0 0 1 3 18 Z"/>
            <rect class="rail-tool-tb-clasp" x="10" y="13.5" width="4" height="2.5" rx="0.5"/>
          </svg>
          <span class="rail-tool-tip" id="toolsRailTip" aria-hidden="true">
            <span class="rail-tool-tip-title">Required Tools</span>
            <span class="rail-tool-tip-body"><strong data-tip-x>0</strong> of <strong data-tip-y>0</strong> tools are available in this Canvas</span>
          </span>
        </button>
        <button class="rail-tool rail-tool-instructions" type="button" aria-label="Instructions" data-tooltip="Instructions">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="12" height="17" rx="1.5"/>
            <path d="M9 3.5h6v3H9z"/>
            <line class="rail-tool-ins-line rail-tool-ins-line-1" x1="9" y1="11" x2="15" y2="11"/>
            <line class="rail-tool-ins-line rail-tool-ins-line-2" x1="9" y1="14" x2="15" y2="14"/>
            <line class="rail-tool-ins-line rail-tool-ins-line-3" x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </button>
      </div>
    </div></div>`
  },

  navlist: {
    note: '.rail-nav (canvas variant) — collapsible nav list with caret + sub-wrap, active/expanded state shown',
    minHeight: 280,
    html: `<aside class="rail-panel" id="railPanel" aria-hidden="true" style="position:static;transform:none;visibility:visible;opacity:1;">
      <ul class="rail-nav rail-nav-canvas">
        <li data-target="overview" class="has-children expanded active">
          <div class="nav-row"><span class="caret">›</span> Overview</div>
          <div class="sub-wrap">
            <ul class="rail-subnav">
              <li data-chapter="cover">Cover</li>
              <li data-chapter="assignment-summary">Assignment Summary</li>
              <li data-chapter="success-metrics">Success Metrics</li>
              <li data-chapter="general-observations">General Observations</li>
            </ul>
          </div>
        </li>
        <li data-target="brand" class="has-children">
          <div class="nav-row"><span class="caret">›</span> Brand</div>
          <div class="sub-wrap">
            <ul class="rail-subnav">
              <li data-chapter="brand-perception">Brand Perception</li>
            </ul>
          </div>
        </li>
        <li data-target="culture" class="has-children">
          <div class="nav-row"><span class="caret">›</span> Culture</div>
          <div class="sub-wrap">
            <ul class="rail-subnav">
              <li data-chapter="cultural-connection">Cultural Connection</li>
            </ul>
          </div>
        </li>
        <li data-target="audiences" class="has-children">
          <div class="nav-row"><span class="caret">›</span> Audiences</div>
          <div class="sub-wrap">
            <ul class="rail-subnav">
              <li data-chapter="young-builder">The Young Builder</li>
            </ul>
          </div>
        </li>
      </ul>
    </aside>`
  },

  button: {
    note: '.round-btn variants (ghost / primary Send) + .share-btn',
    minHeight: 80,
    html: `<button class="round-btn ghost" title="Add" id="addBtn" aria-haspopup="menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
      <button class="round-btn primary" title="Send" id="sendBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/>
          <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/>
        </svg>
        <span class="send-btn-label">Submit</span>
      </button>
      <button class="share-btn">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>`
  },

  sectionheader: {
    note: '.table-board-head — eyebrow + title + lede board header',
    minHeight: 120,
    html: `<header class="table-board-head">
            <p class="table-board-eyebrow">02 · INTERACTIVE DATA TABLE</p>
            <h2 class="table-board-title">Scope Confirmation</h2>
            <p class="table-board-lede"><strong>Core Question:</strong> What are the key marketing trends brands and rights holders are pursuing in soccer/football in the lead-up to the 2026 FIFA World Cup?</p>
            <p class="table-board-intro">Here are a few things I'd like to confirm before starting:</p>
          </header>`
  },

  card: {
    note: '.brief-board — cover/title board with redacted meta + OMNI badge',
    minHeight: 360,
    html: `<article class="brief-board" data-chapter-anchor="tbl-cover" data-nav-section="overview">
          <div class="brief-meta">
            <div class="col">
              <p class="lbl">Client</p>
              <p><span class="redacted" aria-label="redacted">Client wants a table</span></p>
              <p>&nbsp;</p>
              <p class="lbl">Assignment</p>
              <p><span class="redacted" aria-label="redacted">Client wants a table</span></p>
              <p>&nbsp;</p>
              <p class="lbl">Status</p>
              <p><span class="redacted" aria-label="redacted">Operation Tablecloth — Tier 3 Classified</span></p>
            </div>
            <div class="date">04.28.2026</div>
          </div>
          <h1 class="brief-title">GAWDTABLE</h1>
          <div class="brief-cover">
            <div class="brief-omni-badge" title="OMNI+">
              <img src="omni-logo.png" alt="OMNI+" />
            </div>
          </div>
        </article>`
  },

  chip: {
    note: '.chat-aux-chip — quick-start chips from the generation aux panel',
    minHeight: 60,
    html: `<div class="chat-aux-chips" data-chat-aux-chips>
                <button class="chat-aux-chip" type="button" data-chip="Creative Brief">
                  <span>Creative Brief</span>
                  <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
                </button>
                <button class="chat-aux-chip" type="button" data-chip="Moodboard">
                  <span>Moodboard</span>
                  <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
                </button>
                <button class="chat-aux-chip" type="button" data-chip="Persona">
                  <span>Persona</span>
                  <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
                </button>
              </div>`
  },

  chip_scopestatus: {
    note: '.scope-status pills — confirmed / pending / open / neutral table status variants',
    minHeight: 56,
    html: `<span class="scope-status confirmed">Confirmed</span>
    <span class="scope-status pending">Pending</span>
    <span class="scope-status open">Open</span>
    <span class="scope-status neutral">Upcoming</span>`
  },

  chip_metricdelta: {
    note: '.metric-delta — up / down KPI delta pills',
    minHeight: 56,
    html: `<span class="metric-delta up">↑ 8.2%</span>
    <span class="metric-delta down">↓ 0.3pp</span>`
  },

  toggle: {
    note: '.dip-switch — on/off switch used in model & aspect menu rows (off + is-on shown)',
    minHeight: 56,
    html: `<div style="display:flex;align-items:center;gap:20px;padding:16px 4px">
      <span class="dip-switch" data-on="0" aria-hidden="true"></span>
      <span class="dip-switch is-on" data-on="1" aria-hidden="true"></span>
    </div>`
  },

  input: {
    note: '.composer — chat input shell (textarea + composer-actions); plus .scope-table-search filter field',
    minHeight: 160,
    html: `<div class="composer-wrap">
        <div class="composer">
          <div class="composer-resize-handle" id="composerResizeHandle" role="separator" aria-label="Resize composer" aria-orientation="horizontal" title="Drag to resize"></div>
          <textarea id="composerInput" placeholder="Type your message..."></textarea>
          <div class="composer-actions">
            <div class="add-wrap">
              <button class="round-btn ghost" title="Add" id="addBtn" aria-haspopup="menu" aria-expanded="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <div class="composer-right">
              <button class="round-btn primary" title="Send" id="sendBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/>
                  <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/>
                </svg>
                <span class="send-btn-label">Submit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="scope-table-search">
        <svg class="scope-table-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="search" id="scopeTableFilter" placeholder="Filter rows…" autocomplete="off" />
        <div class="scope-table-affordances">
          <button class="scope-table-clear" type="button" aria-label="Clear filter">
            <svg viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="scope-table-count" id="scopeTableCount">16 rows</span>
        </div>
      </div>`
  },

  dropdown: {
    note: '.model-selector-wrap — chat model pill + open menu (active item)',
    minHeight: 300,
    html: `<div class="model-selector-wrap" id="modelSelectorWrap">
                <button class="model-selector-btn" id="modelSelectorBtn" type="button" aria-haspopup="menu" aria-expanded="true" aria-controls="modelSelectorMenu">
                  <span class="model-selector-label" id="modelSelectorLabel">Claude Sonnet 4.6</span>
                  <svg class="model-selector-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="model-selector-menu" id="modelSelectorMenu" role="menu" aria-hidden="false" style="display:block;position:static;opacity:1;visibility:visible;transform:none;">
                  <button class="model-selector-menu-item active" role="menuitem" data-model="Claude Sonnet 4.6">
                    <span class="msm-label">Claude Sonnet 4.6</span>
                    <svg class="msm-check" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7.5L6 10.5L11 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="model-selector-menu-item" role="menuitem" data-model="Claude Haiku 4.5">
                    <span class="msm-label">Claude Haiku 4.5</span>
                    <svg class="msm-check" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7.5L6 10.5L11 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="model-selector-menu-item" role="menuitem" data-model="GPT-5.5 (with Web Search)">
                    <span class="msm-label">GPT-5.5 (with Web Search)</span>
                    <svg class="msm-check" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7.5L6 10.5L11 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="model-selector-menu-item" role="menuitem" data-model="Gemini 3.1 Pro (Preview)">
                    <span class="msm-label">Gemini 3.1 Pro (Preview)</span>
                    <svg class="msm-check" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7.5L6 10.5L11 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>`
  },

  menu: {
    note: '.add-menu — composer "+" attach menu (icon + label + shortcut rows)',
    minHeight: 280,
    html: `<div class="add-menu" id="addMenu" role="menu" aria-hidden="false" style="display:block;position:static;opacity:1;visibility:visible;transform:none;">
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </span>
                  <span class="ami-label">Attach file</span>
                  <span class="ami-shortcut">⌘U</span>
                </button>
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </span>
                  <span class="ami-label">Add image</span>
                  <span class="ami-shortcut">⌘I</span>
                </button>
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  </span>
                  <span class="ami-label">Voice note</span>
                  <span class="ami-shortcut">⌘M</span>
                </button>
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </span>
                  <span class="ami-label">Reference URL</span>
                  <span class="ami-shortcut">⌘K</span>
                </button>
              </div>`
  },

  avatar: {
    note: '.presence-stack — facepile of .pa avatars (nick + image) with hover .pa-card',
    minHeight: 80,
    html: `<div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>`
  },

  table: {
    note: '.metrics-table — KPI table with sortable headers, sparklines, metric-delta + scope-status cells',
    minHeight: 280,
    html: `<table class="metrics-table" aria-label="Campaign performance metrics">
              <thead>
                <tr>
                  <th><button class="scope-sort-btn" type="button" data-col="0" data-type="text"><span>Metric</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th class="num"><button class="scope-sort-btn" type="button" data-col="1" data-type="number"><span>Current</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th class="num"><button class="scope-sort-btn" type="button" data-col="2" data-type="number"><span>Week</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th>7-day trend</th>
                  <th class="num"><button class="scope-sort-btn" type="button" data-col="4" data-type="number"><span>Goal</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th><button class="scope-sort-btn" type="button" data-col="5" data-type="status"><span>Status</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="metric-name">Impressions</td>
                  <td class="num metric-val" data-sort="12400000">12.4M</td>
                  <td class="num" data-sort="8.2"><span class="metric-delta up">↑ 8.2%</span></td>
                  <td><svg class="sparkline" viewBox="0 0 100 24" width="120" height="24" preserveAspectRatio="none"><polyline class="sparkline-path up" points="0,18 14,16 28,17 42,12 56,14 70,9 84,10 100,4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
                  <td class="num metric-goal" data-sort="15000000">15M</td>
                  <td><span class="scope-status confirmed">On track</span></td>
                </tr>
                <tr>
                  <td class="metric-name">Engagement Rate</td>
                  <td class="num metric-val" data-sort="4.6">4.6%</td>
                  <td class="num" data-sort="-0.3"><span class="metric-delta down">↓ 0.3pp</span></td>
                  <td><svg class="sparkline" viewBox="0 0 100 24" width="120" height="24" preserveAspectRatio="none"><polyline class="sparkline-path down" points="0,8 14,9 28,11 42,10 56,13 70,14 84,16 100,17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
                  <td class="num metric-goal" data-sort="5">5.0%</td>
                  <td><span class="scope-status pending">At risk</span></td>
                </tr>
              </tbody>
            </table>`
  },

  banner: {
    note: '.ch-intro-notice — AI-disclosure note block (heading + paragraph + dismiss)',
    minHeight: 160,
    html: `<aside class="ch-intro-notice" id="chIntroNotice" role="note" aria-label="AI disclosure">
              <button class="ch-intro-notice-close" type="button" id="chIntroNoticeClose" aria-label="Dismiss notice">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
              <h3 class="ch-intro-heading">An Important Reminder About AI</h3>
              <p class="ch-intro-paragraph">This content has been generated by an AI model trained on a diverse range of data. While efforts have been made to ensure the quality and reliability of the content, there may be limitations, inaccuracies, or biases present. We recommend using this content as a starting point for further research and consultation with relevant experts, and you should not solely rely upon generated content as the basis for your work product.</p>
            </aside>`
  },

  emptystate: {
    note: '.ch-empty-state — right-canvas OMNI mark empty state (aria-hidden cleared so it renders)',
    minHeight: 200,
    html: `<div class="ch-empty-state" id="chEmptyState">
        <div class="ch-empty-logo-wrap">
          <svg class="ch-empty-logo" viewBox="0 0 396 83" xmlns="http://www.w3.org/2000/svg" aria-label="OMNI" role="img">
            <path class="ch-logo-star"   d="M357.9 78.5401C354.7 65.6801 350.84 50.1601 337.75 46.2801L320.54 41.1801L332.68 37.6201C350.8 32.3101 353.63 21.1701 357.82 3.11011L364.09 23.7701C371.83 36.0101 381.99 37.1301 395.47 41.2301C379.11 45.0601 367.12 47.9901 361.76 64.7501L357.9 78.5501V78.5401Z"/>
            <path class="ch-logo-letter" data-letter="O" d="M47 0L35.11 0.35C17.43 3.04 3.38 16.88 0.41 34.88L0 47C3.07 67 20.39 81.93 40.63 82.09C61.07 82.24 78.55 67.22 81.43 46.38C84.53 23.92 68.53 3.84 47 0ZM40.84 61.69C29.46 61.69 20.23 52.46 20.23 41.08C20.23 29.7 29.46 20.47 40.84 20.47C52.22 20.47 61.45 29.7 61.45 41.08C61.45 52.46 52.22 61.69 40.84 61.69Z"/>
            <path class="ch-logo-letter" data-letter="M" d="M156.33 80.93L155.99 33.11L135.94 69.03L134.3 70.9C133.81 71.46 131.86 69.99 131.69 69.43L111.1 32.22L110.69 80.83L90.6701 80.93L90.6401 1.49001C98.2501 0.950013 105.62 0.950013 113.88 1.37001L133.77 37.06L153.52 1.46001C161.31 0.930014 168.66 0.940013 176.92 1.48001V80.78L156.34 80.93H156.33Z"/>
            <path class="ch-logo-letter" data-letter="N" d="M260.86 80.75L235.94 80.98L210.48 35.3699L210.15 80.95L190.05 80.79L190.02 1.65995C197.26 0.929951 204.26 0.899951 211.79 1.37001L240.03 49.93L240.46 1.40995C247.38 0.999951 253.59 0.999951 260.84 1.47995L260.86 80.74V80.75Z"/>
            <path class="ch-logo-letter" data-letter="I" d="M293.95 1H273.59V80.91H293.95V1Z"/>
          </svg>
        </div>
      </div>`
  },

  panelswitch: {
    note: '.panel-switch — bottom-edge segmented panel switcher (Menu / Chat / Canvas), Canvas active',
    minHeight: 56,
    html: `<div class="panel-switch" id="panelSwitch" role="tablist" aria-label="Switch between navigation, chat, and canvas" style="display:flex;opacity:1;">
        <button type="button" class="psw psw-nav" data-panel="nav" role="tab" aria-label="Open navigation panel"><span class="psw-label">Menu</span></button>
        <button type="button" class="psw" data-panel="chat" role="tab" aria-label="Show chat panel"><span class="psw-label">Chat</span></button>
        <button type="button" class="psw active" data-panel="canvas" role="tab" aria-label="Show canvas panel" aria-selected="true"><span class="psw-label">Canvas</span></button>
      </div>`
  },

  chatmessage: {
    note: '.msg user / .msg bot bubbles — static intro msg + the two JS-template messages (from JS template, sample text substituted)',
    minHeight: 240,
    html: `<div class="msg bot ch-intro-msg">
          <div class="msg-head">
            <div class="msg-avatar av-canvas-assistant" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.6" fill="currentColor"/>
                <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="currentColor"/>
              </svg>
            </div>
            <div class="msg-meta">
              <span class="msg-name">Canvas Assistant</span>
              <span class="msg-dot"></span>
              <span class="msg-time">Today, 10:42 AM</span>
            </div>
          </div>
          <div class="body">
            <p class="ch-intro-prompt">What can I help with?</p>
          </div>
        </div>
      <div class="msg user">
        <div class="bubble">
          <div class="msg-head">
            <div class="msg-avatar av-nick">NZ</div>
            <div class="msg-meta">
              <span class="msg-name">Nick Zinner — Media</span>
              <span class="msg-dot"></span>
              <span class="msg-time">Today, 10:43 AM</span>
            </div>
          </div>
          Draft a moodboard for the World Cup campaign.
        </div>
      </div>
      <div class="msg bot">
        <div class="msg-head">
          <div class="msg-avatar av-corv">⌬</div>
          <div class="msg-meta">
            <span class="msg-name">Build Submarines</span>
            <span class="msg-dot"></span>
            <span class="msg-time">Today, 10:43 AM</span>
          </div>
        </div>
        <div class="body">Got it. I'll work on that and update the canvas.</div>
      </div>`
  },

  optioncard: {
    note: '.ch-opt preset card + .ch-opt-custom "Other" card (from JS template, sample text substituted)',
    minHeight: 200,
    html: `<div class="ch-opt-list" id="chOptList">
        <button type="button" class="ch-opt" data-opt-id="buyer" data-step="persona-type">
          <span class="ch-opt-num">1</span>
          <span class="ch-opt-body">
            <span class="ch-opt-title">Buyer</span>
            <span class="ch-opt-desc">Someone who is ready to purchase.</span>
          </span>
        </button>
        <button type="button" class="ch-opt" data-opt-id="researcher" data-step="persona-type">
          <span class="ch-opt-num">2</span>
          <span class="ch-opt-body">
            <span class="ch-opt-title">Researcher</span>
            <span class="ch-opt-desc">Comparing options, not ready to buy.</span>
          </span>
        </button>
        <button type="button" class="ch-opt" data-opt-id="enthusiast" data-step="persona-type">
          <span class="ch-opt-num">3</span>
          <span class="ch-opt-body">
            <span class="ch-opt-title">Enthusiast</span>
            <span class="ch-opt-desc">Loves the category, follows trends.</span>
          </span>
        </button>
        <div class="ch-opt ch-opt-custom" role="button" tabindex="0" data-opt-id="custom" data-step="persona-type">
          <span class="ch-opt-num">4</span>
          <span class="ch-opt-body">
            <span class="ch-opt-custom-label">
              <span class="ch-opt-title">Other</span>
              <span class="ch-opt-desc">Type your own answer.</span>
            </span>
            <input type="text" class="ch-opt-custom-input" placeholder="Type your own answer, then press Enter…" aria-label="Custom answer" autocomplete="off" tabindex="-1" />
          </span>
          <button class="ch-opt-custom-close" type="button" aria-label="Cancel custom answer" tabindex="-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          </button>
        </div>
      </div>`
  }
};
