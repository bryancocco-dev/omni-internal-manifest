// AUTO-EXTRACTED verbatim markup from media/index.html (identical to gawdtable) — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  topnav: {
    note: '.topnav — global header bar (tabs + version-switch v1/v2/v3 + avatar)',
    minHeight: 56,
    pad: '0',
    bodyClass: 'canvas2-visible',
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

    <div class="tab">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
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
      <div class="version-switch" id="versionSwitch" role="group" aria-label="Page version">
        <button class="vs-btn active" type="button" data-version="v1" aria-pressed="true">v1</button>
        <button class="vs-btn" type="button" data-version="v2" aria-pressed="false">v2</button>
        <button class="vs-btn" type="button" data-version="v3" aria-pressed="false">v3</button>
      </div>
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
    note: '.tab group — canvas/table/graphics tab strip from .topnav',
    minHeight: 48,
    pad: '0',
    bodyClass: 'canvas2-visible',
    html: `<div class="topnav">
    <div class="tab">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab">
      <span class="tab-icon text" aria-hidden="true">
        <svg width="9" height="10" viewBox="0 0 7 8" fill="none"><path d="M0 2H1V1H2.626L1.34 7H0V8H4V7H2.874L4.16 1H6V2H7V0H0V2Z" fill="currentColor"/></svg>
      </span>
      Text
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
  </div>`
  },

  siderail: {
    note: '.side-rail — vertical title rail with rail-tools (agents/knowledge/tools/instructions)',
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
        </button>
        <button class="rail-tool rail-tool-knowledge" type="button" aria-label="Knowledge base" data-tip="rich">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <ellipse class="rail-tool-kb-incoming" cx="12" cy="5.5" rx="8" ry="2.5"/>
            <ellipse class="rail-tool-kb-top" cx="12" cy="5.5" rx="8" ry="2.5"/>
            <path class="rail-tool-kb-mid" d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/>
            <path class="rail-tool-kb-bot" d="M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/>
            <ellipse class="rail-tool-kb-outgoing" cx="12" cy="17.5" rx="8" ry="2.5"/>
          </svg>
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
    note: '.rail-nav — slide-out nav panel list with expanded section + subnav',
    minHeight: 320,
    html: `<ul class="rail-nav rail-nav-canvas" style="display:block">
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
      </ul>`
  },

  chatmessage: {
    note: '.msg.bot — chat stream bot greeting bubble (head + avatar + meta + body)',
    minHeight: 96,
    html: `<div class="chat-stream" id="chatStream">
        <div class="msg bot">
          <div class="msg-head">
            <div class="msg-avatar av-corv">⌬</div>
            <div class="msg-meta">
              <span class="msg-name">Build Submarines</span>
              <span class="msg-dot"></span>
              <span class="msg-time">Today, 2:24 PM</span>
            </div>
          </div>
          <div class="body">What can I help with?</div>
        </div>
      </div>`
  },

  chip: {
    note: '.chat-aux-chip — quick-start composer chips (each with caret)',
    minHeight: 80,
    html: `<div class="chat-aux-chips" data-chat-aux-chips>
        <button class="chat-aux-chip" type="button" data-chip="Creative Brief">
          <span>Creative Brief</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
        <button class="chat-aux-chip" type="button" data-chip="Moodboard">
          <span>Moodboard</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
        <button class="chat-aux-chip" type="button" data-chip="Storyboard">
          <span>Storyboard</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
        <button class="chat-aux-chip" type="button" data-chip="Deep Research">
          <span>Deep Research</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
        <button class="chat-aux-chip" type="button" data-chip="Persona">
          <span>Persona</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
        <button class="chat-aux-chip" type="button" data-chip="Mockups">
          <span>Mockups</span>
          <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
        </button>
      </div>`
  },

  chip_scopestatus: {
    note: '.scope-status — table status pill (confirmed / pending / open states)',
    minHeight: 64,
    html: `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="scope-status confirmed">Confirmed</span>
      <span class="scope-status pending">Pending</span>
      <span class="scope-status open">Open</span>
    </div>`
  },

  chip_metricdelta: {
    note: '.metric-delta — KPI week-over-week delta chip (up / down states)',
    minHeight: 64,
    html: `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="metric-delta up">↑ 8.2%</span>
      <span class="metric-delta down">↓ 0.3pp</span>
    </div>`
  },

  toggle: {
    note: '.dip-switch — single-select dip toggle paired with menu items (on/off)',
    minHeight: 64,
    html: `<div style="display:flex;gap:18px;align-items:center">
      <span class="dip-switch is-on" data-on="1" aria-hidden="true"></span>
      <span class="dip-switch" data-on="0" aria-hidden="true"></span>
    </div>`
  },

  input: {
    note: '.composer — message composer with resize handle, textarea, add + send actions',
    minHeight: 140,
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
              <div class="model-selector-wrap" id="modelSelectorWrap">
                <button class="model-selector-btn" id="modelSelectorBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="modelSelectorMenu">
                  <span class="model-selector-label" id="modelSelectorLabel">Claude Sonnet 4.6</span>
                  <svg class="model-selector-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <button class="round-btn primary" title="Send" id="sendBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/>
                  <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>`
  },

  dropdown: {
    note: '.image-model-menu — image-model selector (menu items each pair text + dip-switch)',
    minHeight: 300,
    html: `<div class="image-model-menu open" id="imageModelMenu" role="menu" style="position:static;display:block">
                  <button class="image-model-item" role="menuitemcheckbox" data-image-model="Imagen 4" aria-checked="false">
                    <span class="image-model-item-text">
                      <span class="image-model-item-title">Imagen 4</span>
                      <span class="image-model-item-desc">Google's latest Imagen model.</span>
                    </span>
                    <span class="dip-switch" data-on="0" aria-hidden="true"></span>
                  </button>
                  <button class="image-model-item is-active" role="menuitemcheckbox" data-image-model="Nano Banana 2" aria-checked="true">
                    <span class="image-model-item-text">
                      <span class="image-model-item-title">Nano Banana 2</span>
                      <span class="image-model-item-desc">Google's latest Gemini model. Designed for speed and efficiency.</span>
                    </span>
                    <span class="dip-switch is-on" data-on="1" aria-hidden="true"></span>
                  </button>
                  <button class="image-model-item" role="menuitemcheckbox" data-image-model="Nano Banana Pro" aria-checked="false">
                    <span class="image-model-item-text">
                      <span class="image-model-item-title">Nano Banana Pro</span>
                      <span class="image-model-item-desc">The highest quality model available for editing images.</span>
                    </span>
                    <span class="dip-switch" data-on="0" aria-hidden="true"></span>
                  </button>
                  <button class="image-model-item" role="menuitemcheckbox" data-image-model="Imagen 4 Fast" aria-checked="false">
                    <span class="image-model-item-text">
                      <span class="image-model-item-title">Imagen 4 Fast</span>
                      <span class="image-model-item-desc">Google's Imagen 4 Fast model for quick generation.</span>
                    </span>
                    <span class="dip-switch" data-on="0" aria-hidden="true"></span>
                  </button>
                </div>`
  },

  menu: {
    note: '.add-menu — composer Add menu (icon + label + shortcut rows)',
    minHeight: 240,
    html: `<div class="add-menu" id="addMenu" role="menu" style="position:static;display:block">
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
    note: '.presence — collaborator avatar stack with hover cards + count',
    minHeight: 64,
    html: `<div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>`
  },

  sectionheader: {
    note: '.c4-sec-head — Swiss section header (eyebrow + title + lede)',
    minHeight: 120,
    html: `<header class="c4-sec-head">
                <span class="c4-sec-eyebrow">Creative Assets · 01</span>
                <h2 class="c4-sec-title">Social Media</h2>
                <p class="c4-sec-lede">58 unit specs spanning every current ad execution and basic post type on Meta (18), Instagram (11), LinkedIn (17), and Reddit (12). Sponsored or organic. Filter by platform or unit type to scope the set; the Type dropdown narrows to the formats the active platform actually supports.</p>
              </header>`
  },

  button: {
    note: '.c4-filter-pill + .c4-view-btn — filter pill group and view-mode icon button group',
    minHeight: 80,
    html: `<div style="display:flex;flex-direction:column;gap:16px">
      <div class="c4-filter-group">
        <span class="c4-filter-label">Platform</span>
        <button class="c4-filter-pill active" type="button" data-c4platform="all">All</button>
        <button class="c4-filter-pill" type="button" data-c4platform="meta">Meta</button>
        <button class="c4-filter-pill" type="button" data-c4platform="instagram">Instagram</button>
        <button class="c4-filter-pill" type="button" data-c4platform="linkedin">LinkedIn</button>
        <button class="c4-filter-pill" type="button" data-c4platform="reddit">Reddit</button>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="c4-view-btn active" type="button" data-c4view="mosaic" aria-label="Mosaic view">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <rect x="2" y="2" width="5" height="5" rx="0.6" stroke="currentColor" stroke-width="1.2"/>
            <rect x="9" y="2" width="5" height="3" rx="0.6" stroke="currentColor" stroke-width="1.2"/>
            <rect x="9" y="7" width="5" height="7" rx="0.6" stroke="currentColor" stroke-width="1.2"/>
            <rect x="2" y="9" width="5" height="5" rx="0.6" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
        <button class="c4-view-btn" type="button" data-c4view="grid" aria-label="Grid view">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <rect x="2"   y="2"   width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="6.5" y="2"   width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="11"  y="2"   width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="2"   y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="6.5" y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="11"  y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="2"   y="11"  width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="6.5" y="11"  width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
            <rect x="11"  y="11"  width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
        <button class="c4-view-btn" type="button" data-c4view="list" aria-label="List view">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <line x1="3" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="3" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>`
  },

  card: {
    note: '.brief-board — table-view cover board (meta cols + title + cover + brand badge)',
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

  keyvalue: {
    note: '.pd-card grid — persona Demographics key/value card set',
    minHeight: 200,
    html: `<div class="pd-grid">
              <div class="pd-card"><p class="pd-card-label">Age</p><p class="pd-card-value">18 &ndash; 34</p></div>
              <div class="pd-card"><p class="pd-card-label">Generation</p><p class="pd-card-value">Gen Z · Millennial</p></div>
              <div class="pd-card"><p class="pd-card-label">Gender Split</p><p class="pd-card-value">55 M / 45 F</p></div>
              <div class="pd-card"><p class="pd-card-label">Income</p><p class="pd-card-value">$30k &ndash; $60k</p></div>
              <div class="pd-card"><p class="pd-card-label">Education</p><p class="pd-card-value">HS &ndash; Bachelor&rsquo;s</p></div>
              <div class="pd-card"><p class="pd-card-label">Location</p><p class="pd-card-value">Urban / Suburban, US&#8209;wide</p></div>
              <div class="pd-card"><p class="pd-card-label">Household</p><p class="pd-card-value">1 &ndash; 2, often single</p></div>
              <div class="pd-card"><p class="pd-card-label">Market</p><p class="pd-card-value">United States</p></div>
            </div>`
  },

  brandbadge: {
    note: '.brief-omni-badge — OMNI+ corner badge on cover boards',
    minHeight: 96,
    html: `<div class="brief-omni-badge" title="OMNI+">
              <img src="omni-logo.png" alt="OMNI+" />
            </div>`
  },

  table: {
    note: '.metrics-table — KPI table with sortable headers, sparklines, metric-delta + scope-status',
    minHeight: 360,
    html: `<div class="metrics-wrap">
            <table class="metrics-table" aria-label="Campaign performance metrics">
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
                <tr>
                  <td class="metric-name">Conversions</td>
                  <td class="num metric-val" data-sort="1432">1,432</td>
                  <td class="num" data-sort="22.8"><span class="metric-delta up">↑ 22.8%</span></td>
                  <td><svg class="sparkline" viewBox="0 0 100 24" width="120" height="24" preserveAspectRatio="none"><polyline class="sparkline-path up" points="0,21 14,19 28,17 42,15 56,12 70,9 84,6 100,4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
                  <td class="num metric-goal" data-sort="2000">2,000</td>
                  <td><span class="scope-status confirmed">On track</span></td>
                </tr>
              </tbody>
            </table>
          </div>`
  },

  table_scope: {
    note: '.scope-table — interactive scope table with select checkboxes + status pills',
    minHeight: 320,
    html: `<div class="scope-table-wrap">
            <table class="scope-table" aria-label="Scope confirmation dimensions">
              <thead>
                <tr>
                  <th class="scope-select-th">
                    <button class="scope-checkbox scope-checkbox--header" type="button" aria-label="Select all rows" id="scopeSelectAll">
                      <svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </th>
                  <th>
                    <button class="scope-sort-btn" type="button" data-col="0" data-type="text">
                      <span>Dimension</span>
                      <span class="scope-sort-icons" aria-hidden="true">
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg>
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg>
                      </span>
                    </button>
                  </th>
                  <th>
                    <button class="scope-sort-btn" type="button" data-col="1" data-type="text">
                      <span>My Default Assumption</span>
                      <span class="scope-sort-icons" aria-hidden="true">
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg>
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg>
                      </span>
                    </button>
                  </th>
                  <th>
                    <button class="scope-sort-btn" type="button" data-col="2" data-type="status">
                      <span>Status</span>
                      <span class="scope-sort-icons" aria-hidden="true">
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg>
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg>
                      </span>
                    </button>
                  </th>
                  <th>
                    <button class="scope-sort-btn" type="button" data-col="3" data-type="text">
                      <span>Owner</span>
                      <span class="scope-sort-icons" aria-hidden="true">
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg>
                        <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg>
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="scope-select"><button class="scope-checkbox" type="button" aria-label="Select row"><svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td><td>Event focus</td><td>FIFA World Cup 2026 (USA, Canada, Mexico) — with context from Euro 2024 &amp; Club WC 2025</td><td><span class="scope-status confirmed">Confirmed</span></td><td>PM</td></tr>
                <tr><td class="scope-select"><button class="scope-checkbox" type="button" aria-label="Select row"><svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td><td>Geography</td><td>Global, with emphasis on key markets (US, UK, Europe, LatAm)</td><td><span class="scope-status pending">Pending</span></td><td>Strategy</td></tr>
                <tr><td class="scope-select"><button class="scope-checkbox" type="button" aria-label="Select row"><svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td><td>Success metrics</td><td>Coverage of top 20 sponsors; 5 emerging trends with quant evidence; 3 strategic implications per trend</td><td><span class="scope-status open">Open</span></td><td>Strategy</td></tr>
              </tbody>
            </table>
          </div>`
  },

  table_bib: {
    note: '.roadmap-table — timeline table with owner avatars + progress bars + status',
    minHeight: 280,
    html: `<div class="roadmap-wrap">
            <table class="roadmap-table" aria-label="Project roadmap">
              <thead>
                <tr>
                  <th><button class="scope-sort-btn" type="button" data-col="0" data-type="text"><span>Phase</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th><button class="scope-sort-btn" type="button" data-col="1" data-type="text"><span>Window</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th><button class="scope-sort-btn" type="button" data-col="2" data-type="text"><span>Owner</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th class="roadmap-progress-th"><button class="scope-sort-btn" type="button" data-col="3" data-type="number"><span>Progress</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                  <th><button class="scope-sort-btn" type="button" data-col="4" data-type="status"><span>Status</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg></span></button></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="roadmap-phase">Discovery</td>
                  <td class="roadmap-dates">Oct 14 → Nov 1</td>
                  <td><span class="roadmap-owner"><span class="roadmap-avatar avatar-bc">BC</span><span class="roadmap-owner-name">Bryan Cocco</span></span></td>
                  <td data-sort="100"><div class="roadmap-progress"><div class="roadmap-progress-bar"><span style="--pct: 100%"></span></div><span class="roadmap-progress-pct">100%</span></div></td>
                  <td><span class="scope-status confirmed">Complete</span></td>
                </tr>
                <tr>
                  <td class="roadmap-phase">Synthesis</td>
                  <td class="roadmap-dates">Nov 4 → Nov 22</td>
                  <td><span class="roadmap-owner"><span class="roadmap-avatar avatar-lo">LO</span><span class="roadmap-owner-name">Lena Ortiz</span></span></td>
                  <td data-sort="78"><div class="roadmap-progress"><div class="roadmap-progress-bar"><span style="--pct: 78%"></span></div><span class="roadmap-progress-pct">78%</span></div></td>
                  <td><span class="scope-status pending">In progress</span></td>
                </tr>
              </tbody>
            </table>
          </div>`
  },

  hero: {
    note: '.bib-finale — Swiss poster end-card (mark + eyebrow + shape layers + 3-col meta)',
    minHeight: 360,
    html: `<section class="bib-finale-tagline" aria-label="Component library end card">
            <div class="bib-finale-top">
              <img class="bib-finale-mark" src="omni-logo.png" alt="OMNI+" />
              <span class="bib-finale-eyebrow">Component Library · Table Patterns · Built 05.07.2026</span>
            </div>
            <div class="bib-finale-shape" aria-hidden="true">
              <div class="bib-finale-shape-layer" data-layer="a"></div>
              <div class="bib-finale-shape-layer" data-layer="b"></div>
            </div>
            <div class="bib-finale-meta">
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>Five table patterns spanning assumptions, scope, timelines, audience comparisons, and KPI tracking. Every component is sortable, filterable, and animation-aware on first scroll.</p>
              </div>
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>Designed for the discovery → kickoff → measurement arc of a brief. Default Assumptions, Scope Confirmation, Project Roadmap, Audience Profiles, Campaign Performance.</p>
              </div>
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>Authored inside OMNI+ Canvas v2.4. Vector knowledge collection: Lease Campaign. Distributed for design-system review across DDB, TBWA, and Omnicom PR Group.</p>
              </div>
            </div>
          </section>`
  },

  card_persona: {
    note: '.persona-hero — magazine-spread persona cover (portrait + tags + title + subtitle)',
    minHeight: 480,
    html: `<section class="persona-hero is-active" data-persona-hero="casual">
            <figure class="ph-portrait">
              <img src="persona/portrait-mei-v2.png" alt="Side profile of a young woman with a long dark braid, wearing a sheer white shirt, photographed in motion against a vivid orange-red backdrop." loading="lazy">
              <figcaption class="ph-portrait-caption">Mei, 27 — Brooklyn, NY</figcaption>
            </figure>
            <div class="ph-grid" aria-hidden="true"></div>
            <div class="ph-tags ph-tags--top">
              <span>OMNI — Persona Library</span>
              <span>@omni.research</span>
              <span>© 2026</span>
            </div>
            <div class="ph-tags ph-tags--mid">
              <span>Low Intent</span>
              <span>PR&#8209;001</span>
              <span class="ph-coord"><span class="ph-coord-val" data-target="40.6782" data-decimals="4">40.6782</span>° N · <span class="ph-coord-val" data-target="73.9442" data-decimals="4">73.9442</span>° W</span>
            </div>
            <h1 class="ph-title">The <em>Casual</em><br>Car Enthusiast</h1>
            <p class="ph-subtitle">Mei, 27 — Brooklyn, NY</p>
            <p class="ph-subtitle ph-subtitle--alt">A broad, low&#8209;intent admirer of the automotive world who follows trends, designs, and new launches — but isn't actively shopping.</p>
          </section>`
  },

  blockquote: {
    note: '.persona-pullquote — large pull-quote with mark + blockquote + attribution',
    minHeight: 160,
    html: `<section class="persona-pullquote">
            <span class="pq-mark" aria-hidden="true">&ldquo;</span>
            <blockquote class="pq-body">I'm not in the market — I just like watching the shape of the future arrive, one launch reel at a time.</blockquote>
            <div class="pq-attr">
              <span>Reported sentiment</span>
              <span class="pq-attr-sep" aria-hidden="true">·</span>
              <span>n = 1,240 surveyed</span>
            </div>
          </section>`
  },

  numberedlist: {
    note: '.pf-interests — Roman-numeral observed-behaviors list (num + title + desc)',
    minHeight: 240,
    html: `<div class="pf-behaviors">
                <header class="pf-behaviors-head">
                  <h3 class="pf-behaviors-title">Observed Behaviors</h3>
                </header>
                <ol class="pf-interests">
                  <li>
                    <span class="pfi-num">I</span>
                    <div class="pfi-text">
                      <h4 class="pfi-title">Browses auto shows &amp; concept designs</h4>
                      <p class="pfi-desc">The way others browse runways — for the gesture, not the spec sheet.</p>
                    </div>
                  </li>
                  <li>
                    <span class="pfi-num">II</span>
                    <div class="pfi-text">
                      <h4 class="pfi-title">Follows creator&#8209;category influencers</h4>
                      <p class="pfi-desc">On YouTube and Instagram — Vehicle Virgins, Doug DeMuro, Supercar Blondie.</p>
                    </div>
                  </li>
                  <li>
                    <span class="pfi-num">III</span>
                    <div class="pfi-text">
                      <h4 class="pfi-title">Reads automotive design + tech features</h4>
                      <p class="pfi-desc">With a soft spot for eco&#8209;forward concept cars and virtual car meets.</p>
                    </div>
                  </li>
                </ol>
              </div>`
  },

  progress: {
    note: '.roadmap-progress — labelled progress bar with --pct fill var',
    minHeight: 64,
    html: `<div class="roadmap-progress"><div class="roadmap-progress-bar"><span style="--pct: 78%"></span></div><span class="roadmap-progress-pct">78%</span></div>`
  },

  chapternav: {
    note: '.chapter-nav — floating prev/next chapter pager with current/total meta',
    minHeight: 96,
    html: `<nav class="chapter-nav" id="chapterNav" aria-label="Chapter navigation" style="position:static">
    <button class="chapter-nav-btn" id="chapterPrev" type="button" aria-label="Previous chapter" disabled>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="chapter-nav-meta">
      <span class="chapter-nav-current" id="chapterCurrent">01</span>
      <span class="chapter-nav-total" id="chapterTotal">13</span>
    </div>
    <button class="chapter-nav-btn" id="chapterNext" type="button" aria-label="Next chapter">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </nav>`
  },

  panelswitch: {
    note: '.panel-switch — Menu/Chat/Canvas panel switcher tabs (mobile/tablet)',
    minHeight: 64,
    html: `<div class="panel-switch" id="panelSwitch" role="tablist" aria-label="Switch between navigation, chat, and canvas" style="position:static;display:flex;opacity:1;pointer-events:auto">
        <button type="button" class="psw psw-nav" data-panel="nav" role="tab" aria-label="Open navigation panel"><span class="psw-label">Menu</span></button>
        <button type="button" class="psw" data-panel="chat" role="tab" aria-label="Show chat panel"><span class="psw-label">Chat</span></button>
        <button type="button" class="psw active" data-panel="canvas" role="tab" aria-label="Show canvas panel" aria-selected="true"><span class="psw-label">Canvas</span></button>
      </div>`
  },

  modal: {
    note: '.app-modal — instructions dialog (head + maximize/close + textarea body + resize handles)',
    minHeight: 360,
    html: `<div class="app-modal open" id="instructionsModal" role="dialog" aria-modal="true" aria-labelledby="instructionsModalTitle" style="position:static;display:flex">
    <div class="app-modal-card app-modal-card-instructions" role="document">
      <header class="app-modal-head" data-drag-handle>
        <h2 class="app-modal-title" id="instructionsModalTitle">Additional Orchestrator Instructions</h2>
        <div class="app-modal-head-actions">
          <button class="app-modal-maximize" type="button" aria-label="Maximize" id="instructionsModalMaximize">
            <svg class="app-modal-maxicon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            <svg class="app-modal-restoreicon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 3 9 9 3 9"/><polyline points="15 21 15 15 21 15"/><line x1="9" y1="9" x2="3" y2="3"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
          </button>
          <button class="app-modal-close" type="button" aria-label="Close" id="instructionsModalClose">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
          </button>
        </div>
      </header>
      <div class="app-modal-instr-body">
        <div class="app-modal-instr-frame">
          <div class="app-modal-instr-gutter" id="instructionsModalGutter" aria-hidden="true"></div>
          <textarea class="app-modal-instr-input" id="instructionsModalInput" placeholder="Describe any account specific ways the orchestrator agent should manage the other agents, data sets and workflow." aria-label="Orchestrator instructions"></textarea>
        </div>
      </div>
      <span class="app-modal-resize app-modal-resize-n" data-resize="n" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-s" data-resize="s" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-e" data-resize="e" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-w" data-resize="w" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-ne" data-resize="ne" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-nw" data-resize="nw" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-se" data-resize="se" aria-hidden="true"></span>
      <span class="app-modal-resize app-modal-resize-sw" data-resize="sw" aria-hidden="true"></span>
    </div>
  </div>`
  },

  lightbox: {
    note: '.c4-edit-mode — image edit-mode takeover (topbar tools + stage + revision rail)',
    minHeight: 420,
    html: `<div class="c4-edit-mode" id="c4EditMode" data-visible="1" style="position:static">
    <header class="c4-edit-topbar">
      <button class="c4-edit-back" type="button" aria-label="Exit edit mode">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        <span>Back</span>
      </button>
      <div class="c4-edit-meta">
        <span class="c4-edit-rev"><strong data-edit-rev-current>1</strong> <span class="c4-edit-rev-sep">/</span> <strong data-edit-rev-total>1</strong></span>
        <span class="c4-edit-meta-dot">·</span>
        <span class="c4-edit-prompt-mini" data-edit-prompt-mini>Cyberpunk samurai sitting on a glowing neon ring throne, red and white armor.</span>
      </div>
      <div class="c4-edit-toolbar" role="toolbar" aria-label="Edit controls">
        <button class="c4-edit-tool" type="button" data-edit-action="undo" aria-label="Undo" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3"/></svg>
        </button>
        <button class="c4-edit-tool" type="button" data-edit-action="redo" aria-label="Redo" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3"/></svg>
        </button>
        <button class="c4-edit-tool" type="button" data-edit-action="revert" aria-label="Revert to original">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <span class="c4-edit-tool-sep"></span>
        <button class="c4-edit-tool" type="button" data-edit-action="download" aria-label="Download current revision">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="c4-edit-tool" type="button" data-edit-action="fullscreen" aria-label="Fullscreen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
    </header>
    <div class="c4-edit-stage">
      <div class="c4-edit-frame" data-mode="single">
        <img class="c4-edit-img c4-edit-img-current" alt="" draggable="false">
        <img class="c4-edit-img c4-edit-img-prev" alt="" draggable="false">
        <div class="c4-edit-skeleton" data-edit-skeleton aria-hidden="true"></div>
        <div class="c4-edit-pins" data-edit-pins></div>
        <div class="c4-edit-cursor-dot" data-edit-cursor aria-hidden="true"></div>
      </div>
      <p class="c4-edit-hint">Click the image to pin a region · Describe the edit in chat to generate the next revision</p>
    </div>
    <aside class="c4-edit-rail" aria-label="Revision history">
      <button class="c4-edit-rail-resize" type="button" aria-label="Resize history panel" data-edit-rail-resize></button>
      <header class="c4-edit-rail-head">
        <span class="c4-edit-rail-eyebrow">History</span>
        <span class="c4-edit-rail-count"><strong data-edit-rail-count>1</strong> revision<span data-edit-rail-plural></span></span>
      </header>
      <ul class="c4-edit-rail-list" data-edit-rail-list></ul>
    </aside>
  </div>`
  },

  card_graphics: {
    note: '.graphics-card with .graphics-card-overlay (from JS makeOverlay() template) — masonry image card',
    minHeight: 320,
    html: `<figure class="graphics-card in-view" style="width:280px">
        <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=750&q=75&auto=format&fit=crop&fm=webp&cs=tinysrgb" class="loaded" alt="">
        <div class="graphics-card-overlay">
          <div class="gco-glass">
            <p class="gco-prompt">Cyberpunk samurai sitting on a glowing neon ring throne, red and white armor.</p>
            <span class="gco-filetype">Graphics</span>
            <div class="gco-meta-row">
              <div class="gco-author">
                <span class="gco-creator">
                  <span class="gco-avatar" style="background:#3FCBC4;color:#064e3b;">BC</span>
                  <span class="gco-name">Bryan Cocco</span>
                </span>
                <span class="gco-model-chip">o3</span>
                <span class="gco-time">May 12, 2026</span>
              </div>
              <div class="gco-actions">
                <button class="gco-action" type="button" aria-label="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg></button>
                <button class="gco-action" type="button" aria-label="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/><path d="M8 14l4 4 4-4M12 18V9"/></svg></button>
                <button class="gco-action gco-action-delete" type="button" aria-label="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                <button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false"><svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg><svg class="gco-more-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="7" x2="17" y2="17"/><line x1="7" y1="17" x2="17" y2="7"/></svg></button>
                <div class="gco-menu" role="menu" aria-hidden="true">
                  <button class="gco-menu-item" role="menuitem">Edit</button>
                  <button class="gco-menu-item" role="menuitem">Copy Prompt</button>
                  <button class="gco-menu-item" role="menuitem">Download</button>
                  <button class="gco-menu-item gco-menu-item-delete" role="menuitem">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </figure>`
  }
};
