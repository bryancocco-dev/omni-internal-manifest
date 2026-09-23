// AUTO-EXTRACTED verbatim markup from lease-campaign-brief-handoff/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  topnav: {
    note: '.topnav — global header bar (menu, OMNI logo, workspace switch, canvas tabs, presence)',
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
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><path d="M6.64962 0.0543193C5.68778 -0.0773318 4.70831 0.0312136 3.79864 0.370267C2.88897 0.70932 2.0774 1.26833 1.43637 1.9974C0.887745 2.62926 0.480685 3.3712 0.242533 4.17339C0.0043799 4.97559 -0.0593513 5.81946 0.0556197 6.64832C0.364786 8.91982 2.07279 10.8524 4.3052 11.4585C4.80286 11.5947 5.31641 11.6641 5.83237 11.665L5.9152 11.6644C6.2101 11.6606 6.49927 11.5824 6.75585 11.4369C7.01243 11.2915 7.22811 11.0836 7.38287 10.8326C7.53815 10.5829 7.62776 10.298 7.64336 10.0043C7.65897 9.7107 7.60006 9.4179 7.47212 9.15315L7.35604 8.91049C7.26675 8.73604 7.22483 8.54122 7.23445 8.34549C7.24407 8.14977 7.3049 7.96 7.41087 7.79515C7.56249 7.54886 7.80002 7.36752 8.07757 7.28617C8.35511 7.20483 8.65296 7.22926 8.91354 7.35474L9.15387 7.46965C9.3942 7.58515 9.6497 7.64407 9.91279 7.64407C10.3732 7.64171 10.8144 7.45931 11.1421 7.13588C11.4698 6.81245 11.6579 6.37366 11.6663 5.91332C11.6735 5.36965 11.6042 4.82767 11.4604 4.30332C10.8537 2.07149 8.92112 0.363486 6.64962 0.0543193ZM9.65845 6.4179L9.41812 6.30299C8.35179 5.79082 7.04395 6.18749 6.4227 7.17449C5.9922 7.86049 5.94845 8.67715 6.3037 9.41565L6.41979 9.65832C6.4633 9.74647 6.48341 9.84433 6.4782 9.9425C6.47299 10.0407 6.44263 10.1358 6.39004 10.2189C6.33878 10.3037 6.26658 10.374 6.18037 10.4229C6.09416 10.4719 5.99683 10.4978 5.8977 10.4983H5.83237C5.41953 10.4972 5.00863 10.4417 4.61029 10.3332C2.82354 9.84848 1.45854 8.30382 1.21179 6.4914C1.02454 5.11765 1.41712 3.79465 2.31604 2.76449C2.82747 2.17779 3.47748 1.72828 4.20695 1.45687C4.93641 1.18546 5.72216 1.10077 6.4927 1.21049C8.30512 1.45724 9.84979 2.82282 10.3345 4.60899C10.45 5.03482 10.5055 5.46882 10.499 5.8964C10.492 6.36715 10.0061 6.58649 9.65845 6.4179Z" fill="currentColor"/><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      canvas_1
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
    </div>
  </div>`
  },

  tabs: {
    note: '.tab strip — canvas-type tabs (Graphics / Video / Audio / Text / canvas), one .active',
    minHeight: 48,
    html: `<div style="display:flex;align-items:center">
    <div class="tab">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab">
      <span class="tab-icon video" aria-hidden="true">
        <svg width="10" height="9" viewBox="0 0 10 9" fill="none"><path d="M8 4C8 3.5205 7.66 3.1195 7.2095 3.023C7.3895 2.7225 7.5 2.375 7.5 2C7.5 0.897 6.603 0 5.5 0C4.7415 0 4.0895 0.4285 3.75 1.052C3.4105 0.4285 2.7585 0 2 0C0.897 0 0 0.897 0 2C0 2.451 0.156 2.8635 0.4085 3.198C0.282294 3.29029 0.179562 3.41096 0.1086 3.55028C0.0376385 3.6896 0.000436979 3.84365 0 4V8C0 8.5515 0.4485 9 1 9H7C7.5515 9 8 8.5515 8 8V6.681L10 7.681V4.181L8 5.181V4ZM5.5 1C6.0515 1 6.5 1.4485 6.5 2C6.5 2.5515 6.0515 3 5.5 3C4.9485 3 4.5 2.5515 4.5 2C4.5 1.4485 4.9485 1 5.5 1ZM2 1C2.5515 1 3 1.4485 3 2C3 2.5515 2.5515 3 2 3C1.4485 3 1 2.5515 1 2C1 1.4485 1.4485 1 2 1ZM1 8V4H7L7.001 8H1Z" fill="currentColor"/></svg>
      </span>
      Video
    </div>
    <div class="tab">
      <span class="tab-icon audio" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7v0M5.5 5v4M8 3.5v7M10.5 5v4M13 7v0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </span>
      Audio
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
  </div>`
  },

  siderail: {
    note: '.side-rail — vertical rail with back button, CANVAS title, and 4 rail tools (Agents / Knowledge / Tools / Instructions)',
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
    note: '.rail-panel / .rail-nav — slide-out chapter navigation with expandable has-children groups',
    minHeight: 380,
    html: `<aside class="rail-panel" id="railPanel" style="position:static;transform:none;opacity:1;visibility:visible;width:300px">
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
        <li data-target="audiences" class="has-children">
          <div class="nav-row"><span class="caret">›</span> Audiences</div>
          <div class="sub-wrap">
            <ul class="rail-subnav">
              <li data-chapter="young-builder">The Young Builder</li>
            </ul>
          </div>
        </li>
      </ul>
      <div class="rail-divider"></div>
      <ul class="rail-actions">
        <li>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Version History
        </li>
        <li>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Export
        </li>
      </ul>
    </aside>`
  },

  sectionheader: {
    note: '.canvas-header — title breadcrumb (root / crumb + chevron), presence stack, Share',
    minHeight: 64,
    pad: '0',
    html: `<div class="canvas-header" style="position:static">
      <div class="title-wrap">
        <div class="title">
          <span class="root">Build Submarines</span>
          <span class="sep">/</span>
          <div class="crumb-row">
            <span class="crumb">Roblox Racing Wrap Competition</span>
            <button class="title-chevron" id="titleChevron" aria-haspopup="menu" aria-expanded="false" aria-label="Brief options">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>
        <button class="share-btn">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
      </div>
    </div>`
  },

  sectionheader_territory: {
    note: '.terr-header — creative-territory header with eyebrow + section title',
    minHeight: 90,
    html: `<div class="terr-header">
      <div class="terr-eyebrow">Territory 01</div>
      <h2 class="sec-h2">Your Screen Builds Real Things</h2>
    </div>`
  },

  avatar: {
    note: '.presence — overlapping collaborator avatar stack with hover cards + count',
    minHeight: 60,
    html: `<div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>`
  },

  button: {
    note: '.share-btn — primary header action button',
    minHeight: 60,
    html: `<button class="share-btn">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>`
  },

  panelswitch: {
    note: '.panel-switch — segmented Menu / Chat / Canvas switcher (responsive panel toggle), one .active',
    minHeight: 48,
    pad: '0',
    html: `<div class="panel-switch" id="panelSwitch" role="tablist" aria-label="Switch between navigation, chat, and canvas" style="position:static;display:flex;opacity:1;pointer-events:auto">
        <button type="button" class="psw psw-nav" data-panel="nav" role="tab" aria-label="Open navigation panel"><span class="psw-label">Menu</span></button>
        <button type="button" class="psw" data-panel="chat" role="tab" aria-label="Show chat panel"><span class="psw-label">Chat</span></button>
        <button type="button" class="psw active" data-panel="canvas" role="tab" aria-label="Show canvas panel" aria-selected="true"><span class="psw-label">Canvas</span></button>
      </div>`
  },

  chapternav: {
    note: '.chapter-nav — floating prev/next chapter pager with current/total meta',
    minHeight: 64,
    pad: '0',
    html: `<nav class="chapter-nav" id="chapterNav" aria-label="Chapter navigation" style="position:static;opacity:1;transform:none">
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

  input: {
    note: '.composer — chat composer (resize handle, textarea, add button + menu)',
    minHeight: 160,
    html: `<div class="composer">
          <div class="composer-resize-handle" id="composerResizeHandle" role="separator" aria-label="Resize composer" aria-orientation="horizontal" title="Drag to resize"></div>
          <textarea id="composerInput" placeholder="Type your message..."></textarea>
          <div class="composer-actions">
            <div class="add-wrap">
              <button class="round-btn ghost" title="Add" id="addBtn" aria-haspopup="menu" aria-expanded="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        </div>`
  },

  menu: {
    note: '.add-menu — composer "Add" menu with icon / label / shortcut rows (shown open)',
    minHeight: 280,
    html: `<div class="add-menu" id="addMenu" role="menu" aria-hidden="false" style="position:static;opacity:1;visibility:visible;transform:none;pointer-events:auto">
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
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  </span>
                  <span class="ami-label">From canvas</span>
                  <span class="ami-shortcut">⌘N</span>
                </button>
                <button class="add-menu-item" role="menuitem">
                  <span class="ami-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </span>
                  <span class="ami-label">Code snippet</span>
                  <span class="ami-shortcut">⌘E</span>
                </button>
              </div>`
  },

  chip: {
    note: '.chat-aux-chip — quick-start chips inside the chat aux panel',
    minHeight: 120,
    html: `<div class="chat-aux-chips" data-chat-aux-chips style="display:flex;flex-wrap:wrap;gap:8px">
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
                <button class="chat-aux-chip" type="button" data-chip="Persona">
                  <span>Persona</span>
                  <span class="chat-aux-chip-caret" aria-hidden="true">›</span>
                </button>
              </div>`
  },

  chatmessage: {
    note: 'Chat bubbles — .msg.bot greeting + .msg.user bubble (user from JS addUserMsg template)',
    minHeight: 200,
    html: `<div class="chat-stream">
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
        <div class="msg user">
          <div class="bubble">
          <div class="msg-head">
            <div class="msg-avatar av-nick">NZ</div>
            <div class="msg-meta">
              <span class="msg-name">Nick Zinner — Media</span>
              <span class="msg-dot"></span>
              <span class="msg-time">Today, 2:25 PM</span>
            </div>
          </div>
          Draft the success metrics section for the Roblox wrap brief.</div>
        </div>
      </div>`
  },

  toggle: {
    note: '.dip-switch / .image-model-item — image-model selector rows each paired with a dip-switch toggle (one .is-on)',
    minHeight: 220,
    html: `<div class="image-model-menu" id="imageModelMenu" role="menu" style="position:static;opacity:1;visibility:visible;transform:none;pointer-events:auto">
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
                </div>`
  },

  segmented: {
    note: '.settings-toggle / .settings-opt — settings-panel segmented control (one .active)',
    minHeight: 60,
    html: `<div class="settings-toggle" role="group" aria-label="Theme">
      <button class="settings-opt active" data-theme="light">Light</button>
      <button class="settings-opt" data-theme="dark">Dark</button>
    </div>`
  },

  dropdown: {
    note: '.image-aspect-btn — aspect-ratio pill trigger (edit-mode generation control)',
    minHeight: 60,
    html: `<div class="image-aspect-selector-wrap" id="imageAspectSelectorWrap" style="opacity:1;pointer-events:auto;transform:none">
                <button class="image-aspect-btn" id="imageAspectBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="imageAspectMenu">
                  <span class="image-pill-icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                  </span>
                  <span class="image-aspect-label" id="imageAspectLabel">1:1</span>
                  <svg class="image-aspect-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>`
  },

  hero: {
    note: '.brief-board cover — title + cover image with OMNI+ badge (chapter 01)',
    minHeight: 420,
    html: `<article class="brief-board" data-section="cover" data-nav-section="overview">
          <div class="brief-meta">
            <div class="col">
              <p class="lbl">Client</p>
              <p>BuildSubmarines.com</p>
              <p>&nbsp;</p>
              <p class="lbl">Assignment</p>
              <p>Paint Scheme Design Contest</p>
              <p>&nbsp;</p>
              <p class="lbl">Submission Window</p>
              <p>June 19 – July 20</p>
              <p>&nbsp;</p>
              <p class="lbl">Budget</p>
              <p>Up to $50,000</p>
              <p>&nbsp;</p>
              <p class="lbl">Status</p>
              <p>For Creative Team Distribution</p>
            </div>
            <div class="date">04.28.2026</div>
          </div>
          <h1 class="brief-title">Roblox Racing Wrap Competition</h1>
          <div class="brief-cover">
            <img class="cover" src="cover-roblox-racing.png" alt="Roblox Racing Wrap Competition" />
            <div class="brief-omni-badge" title="OMNI+">
              <img src="omni-logo.png" alt="OMNI+" />
            </div>
          </div>
        </article>`
  },

  brandbadge: {
    note: '.brief-omni-badge — OMNI+ corner badge on the brief cover',
    minHeight: 80,
    html: `<div class="brief-omni-badge" title="OMNI+">
              <img src="omni-logo.png" alt="OMNI+" />
            </div>`
  },

  markdown: {
    note: '.sec-body — rendered markdown section body (h2 + prose + sub-blocks)',
    minHeight: 280,
    html: `<div class="sec-body">
            <h2 class="sec-h2">Success Metrics</h2>
            <div class="sub-block">
              <h3>Primary KPI — Total Contest Submissions</h3>
              <p>This is the number that anchors the case study and fuels the media pitch. Recommended baseline target: 5,000 submissions. Every dollar spent and every creative decision made should be evaluated against one question: does this move the submission number?</p>
            </div>
            <div class="sub-block">
              <h3>Secondary KPI — Earned Media Placements</h3>
              <p>10+ distinct placements across gaming press (IGN, Kotaku), motorsport media (Racer, NASCAR.com), and defense / workforce trade publications (National Defense Magazine, USNI News).</p>
            </div>
          </div>`
  },

  numberedlist: {
    note: '.observations — numbered observation list (.n index + h3 + p per item)',
    minHeight: 360,
    html: `<ol class="observations">
              <li>
                <span class="n">01</span>
                <div>
                  <h3>The Roblox audience is massive, young, and deeply engaged — not casual.</h3>
                  <p>Roblox reports 88.9M daily active users, with 56% under age 16, averaging 2.4 hours per day on the platform. In 2025, monthly engagement hours exceeded Steam, PlayStation, and Fortnite combined. This is the dominant creative and social environment for pre-teen and early-teen America.</p>
                </div>
              </li>
              <li>
                <span class="n">02</span>
                <div>
                  <h3>NASCAR's Roblox integration is already proving the audience is there.</h3>
                  <p>Six weeks after launching NASCAR World in Driving Empire at the 2025 Daytona 500, the integration recorded 50M visits and reached 10M unique users. A prior 2024 content drop generated 126M brand impressions and 18M minutes of gameplay. The audience for this partnership exists, is active, and is growing.</p>
                </div>
              </li>
              <li>
                <span class="n">03</span>
                <div>
                  <h3>Career identity is largely formed before age 14 — and the window is closing.</h3>
                  <p>Longitudinal research from the ASPIRES project (King's College London / ESRC) shows students who do not express STEM-related aspirations by age 10 are unlikely to develop them by age 14. The implication: players aged 10–13 in Driving Empire today are in the exact window where exposure to a credible career path has its highest possible impact.</p>
                </div>
              </li>
            </ol>`
  },

  card: {
    note: '.aud-quad — audience-quadrant card grid (4 .aud-quad-item cells, h4 + p each)',
    minHeight: 360,
    html: `<div class="aud-section aud-quad">
              <div class="aud-quad-item">
                <h4>A Maker Who Has Never Been Called One</h4>
                <p>Reese has been building things — cars, bases, liveries, structures, systems — since age seven or eight, across whatever platform was available, and not once has anyone framed this as a real skill with a real name. The act of making is the most reliable source of satisfaction in Reese's life, but because it happens inside a game, it carries no weight in the rooms where weight is assigned: school, family dinner, the guidance counselor's office. Reese doesn't describe themselves as a designer or an artist. They just know that when a livery comes together exactly right — when the color blocking works and the geometry reads clean at speed — something clicks into place that nothing else produces. Research from the Varkey Foundation (2019) found that 64% of Gen Z identify as creators; Reese is living proof of that number, but without the vocabulary or the external validation to make it feel legitimate yet.</p>
              </div>
              <div class="aud-quad-item">
                <h4>Identity Under Construction — With a Closing Window</h4>
                <p>At 14, Reese is acutely aware that the "what do you want to be" conversation is shifting from background noise to active pressure. Parents, school counselors, elective choices, and cultural scripts are all quietly demanding an answer. What Reese doesn't know — and what the ASPIRES Project (King's College London) confirms — is that career identity is largely crystallized before age 14, meaning Reese is at the edge of the window where new exposure actually reshapes long-term trajectory. Reese feels the urgency without understanding its source: a low-grade anxiety about choosing wrong, missing something important, arriving too late at a path that would have fit. The fear isn't laziness; it's the specific discomfort of knowing that something is being decided without enough information.</p>
              </div>
              <div class="aud-quad-item">
                <h4>Purpose-Hungry in a Life That Mostly Feels Purposeless</h4>
                <p>Deloitte and Gallup (2024) report that 86% of Gen Z say purpose is essential to their wellbeing — and fewer than half feel it in their daily lives. Reese lives squarely inside that gap. School is tolerable; most of it feels like running a procedure. Social media is stimulating but thin. The exception — the consistent exception — is time spent making things, which carries a specific feeling of mattering, of being the author of something real. Reese doesn't have the language to name this as "purpose," but they feel its presence during a design session and its absence during everything else, and that contrast runs as a low-grade emotional hum under the entire day. The campaign has a direct line to this — if it can connect the act of designing in Roblox to the act of making something that physically exists in the world.</p>
              </div>
              <div class="aud-quad-item">
                <h4>Quietly Afraid the Future Is Already Being Sorted Without Them</h4>
                <p>Reese has absorbed — from social media, from adult comments that weren't meant to be heard, from the general atmospheric anxiety of the moment — a diffuse but persistent dread that AI is rewriting what work looks like in ways nobody is being fully honest about. Deloitte (2024) found that 59% of Gen Z are already seeking automation-proof careers as a result. Reese hasn't articulated this in those terms, but it surfaces as a specific fear: what's the point of getting good at something if the machine does it better? This makes the idea of work that requires physical precision, human judgment, and hands-on mastery — work that cannot be automated away — quietly, unexpectedly compelling. Reese isn't looking for it consciously. But they'd recognize it if they saw it.</p>
              </div>
            </div>`
  },

  keyvalue: {
    note: '.aud-facts — definition-list of persona facts (dt / dd pairs)',
    minHeight: 220,
    html: `<dl class="aud-facts">
                <dt>Age</dt><dd>14</dd>
                <dt>Platform</dt><dd>Roblox — Driving Empire daily</dd>
                <dt>Daily time</dt><dd>2.4+ hours in-game</dd>
                <dt>Self-identity</dt><dd>Creator, not gamer</dd>
                <dt>Career</dt><dd>Undecided — window still open</dd>
                <dt>Brand link</dt><dd>Drives the car. Doesn't know why it exists.</dd>
              </dl>`
  },

  blockquote: {
    note: '.aud-quote — "unspoken desires" quote cards',
    minHeight: 200,
    html: `<div class="aud-quotes">
                <div class="aud-quote"><p>"What if the thing I'm best at doesn't translate into anything real? What if I'm spending all this time getting good at something that only exists inside a game?"</p></div>
                <div class="aud-quote"><p>"I want actual proof that I'm good. Not likes. Not a participation trophy. I want someone who looked at everything submitted to look at mine and choose it."</p></div>
                <div class="aud-quote"><p>"I want to make something that actually exists in the real world. Not on a screen. Something physical that I could point to — that is there and I made it and it's real."</p></div>
              </div>`
  },

  blockquote_ci: {
    note: '.ci-statement — Core Insight feature statement (oversized lead paragraph)',
    minHeight: 160,
    html: `<div class="sec-prose">
              <p class="ci-statement">The next generation of builders is already building — they're just doing it inside games. The question isn't how to recruit them later. It's whether you're willing to see what they're already capable of right now.</p>
            </div>`
  },

  callout: {
    note: '.rca-callout — "The Real Problem" emphasis callout (mark + content)',
    minHeight: 200,
    html: `<div class="rca-callout">
              <span class="rca-mark" aria-hidden="true"></span>
              <div class="rca-content">
                <h3>The Real Problem</h3>
                <p>The submarine manufacturing industry is losing the talent pipeline battle not at the point of hiring, but at the point of imagination — a decade earlier, when young people decide what kind of builder they think they could become. The industry's absence from the cultural spaces where that decision is made is structural, not accidental. It is the result of recruitment assumptions that no longer match how career identity forms. The strategy must work upstream — not to recruit, but to make the work visible, credible, and aspirational to young people who are already demonstrating the instincts the industry needs.</p>
              </div>
            </div>`
  },

  table: {
    note: '.app-modal-table — Agents/Knowledge/Tools picker grid (thead row + one JS-rendered .app-modal-row; row from JS template)',
    minHeight: 200,
    html: `<div class="app-modal-table" role="table" aria-label="Agents">
            <div class="app-modal-thead" role="row">
              <div class="app-modal-th app-modal-th-check" role="columnheader">
                <span class="app-modal-check"><input type="checkbox" aria-label="Select all"></span>
              </div>
              <div class="app-modal-th app-modal-th-name" role="columnheader">Agent</div>
              <div class="app-modal-th app-modal-th-desc" role="columnheader">Description</div>
              <div class="app-modal-th app-modal-th-date" role="columnheader">Date Modified</div>
            </div>
            <div class="app-modal-tbody">
              <div class="app-modal-row" data-name="General">
                <span class="app-modal-check"><input type="checkbox" aria-label="Select General" checked></span>
                <span class="app-modal-row-name">General</span>
                <span class="app-modal-row-desc">A normal user</span>
                <span class="app-modal-row-date">May 12, 2026</span>
              </div>
              <div class="app-modal-row" data-name="Copywriter">
                <span class="app-modal-check"><input type="checkbox" aria-label="Select Copywriter"></span>
                <span class="app-modal-row-name">Copywriter</span>
                <span class="app-modal-row-desc">A creative copywriter crafts engaging, persuasive content across briefs and channels.</span>
                <span class="app-modal-row-date">May 10, 2026</span>
              </div>
            </div>
          </div>`
  },

  table_bib: {
    note: '.bib-table — source-inventory bibliography table (relevance pips, tags, links)',
    minHeight: 320,
    html: `<div class="bib-table-wrap">
            <table class="bib-table" aria-label="Source inventory">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Relevance</th>
                  <th>Key Coverage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="bib-n">01</td>
                  <td class="bib-source"><a href="https://www.jdpower.com/business/press-releases/2024-north-america-rental-car-satisfaction-study" target="_blank" rel="noopener">J.D. Power 2024 North America Rental Car Satisfaction Study (PDF)</a></td>
                  <td class="bib-tag">Research</td>
                  <td class="bib-rel critical"><span class="bib-rel-pip">Critical</span></td>
                  <td class="bib-coverage">National #1 (736); Enterprise #2 (729); trust as key loyalty driver; vehicle complexity issues</td>
                </tr>
                <tr>
                  <td class="bib-n">05</td>
                  <td class="bib-source"><a href="https://www.enterprisemobility.com/content/dam/emo/global/pdfs/esg/enterprise-mobility-esg-report-fy24.pdf" target="_blank" rel="noopener">Enterprise Mobility ESG Report FY24 (PDF)</a></td>
                  <td class="bib-tag">Official</td>
                  <td class="bib-rel high"><span class="bib-rel-pip">High</span></td>
                  <td class="bib-coverage">Scale data, sustainability strategy, EV pilot programs, fleet size</td>
                </tr>
                <tr>
                  <td class="bib-n">19</td>
                  <td class="bib-source"><a href="https://www.acrarental.org/news" target="_blank" rel="noopener">ACRA — American Car Rental Association Briefs</a></td>
                  <td class="bib-tag">Industry</td>
                  <td class="bib-rel medium"><span class="bib-rel-pip">Medium</span></td>
                  <td class="bib-coverage">Regulatory pressure on transaction fees; insurance product disclosure</td>
                </tr>
              </tbody>
            </table>
          </div>`
  },

  modal: {
    note: '.app-modal (.app-modal-card-instructions) — Additional Orchestrator Instructions modal (shown open)',
    minHeight: 420,
    html: `<div class="app-modal open" id="instructionsModal" role="dialog" aria-modal="true" aria-labelledby="instructionsModalTitle" style="position:static;opacity:1;visibility:visible">
    <div class="app-modal-card app-modal-card-instructions" role="document" style="transform:none;opacity:1">
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
    </div>
  </div>`
  },

  modal_delete: {
    note: '.delete-modal — destructive-confirm modal (thumb, title, body, Cancel/Confirm; shown open)',
    minHeight: 260,
    html: `<div class="delete-modal open" id="deleteModal" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle" style="position:static;opacity:1;visibility:visible">
    <div class="delete-modal-card" role="document" style="transform:none;opacity:1">
      <div class="delete-modal-thumb" id="deleteModalThumb" aria-hidden="true"></div>
      <h2 class="delete-modal-title" id="deleteModalTitle">Are you sure you want to delete this?</h2>
      <p class="delete-modal-body">This item will be deleted immediately. You can't undo this action.</p>
      <div class="delete-modal-actions">
        <button class="delete-modal-btn delete-modal-cancel" type="button" id="deleteModalCancel">Cancel</button>
        <button class="delete-modal-btn delete-modal-confirm" type="button" id="deleteModalConfirm">Yes, delete this <span id="deleteModalKind">Item</span></button>
      </div>
    </div>
  </div>`
  },

  editbar: {
    note: '.c4-edit-topbar — image-edit toolbar (Back, revision meta, undo/redo/revert/compare/fit/download/fullscreen)',
    minHeight: 56,
    pad: '0',
    html: `<header class="c4-edit-topbar">
      <button class="c4-edit-back" type="button" aria-label="Exit edit mode">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        <span>Back</span>
      </button>
      <div class="c4-edit-meta">
        <span class="c4-edit-rev"><strong data-edit-rev-current>1</strong> <span class="c4-edit-rev-sep">/</span> <strong data-edit-rev-total>1</strong></span>
        <span class="c4-edit-meta-dot">·</span>
        <span class="c4-edit-prompt-mini" data-edit-prompt-mini></span>
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
        <button class="c4-edit-tool" type="button" data-edit-action="compare" aria-label="Compare with previous revision" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        </button>
        <button class="c4-edit-tool" type="button" data-edit-action="fit" aria-label="Fit / 100%">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 9 4 4 9 4"/><polyline points="20 9 20 4 15 4"/><polyline points="4 15 4 20 9 20"/><polyline points="20 15 20 20 15 20"/></svg>
        </button>
        <span class="c4-edit-tool-sep"></span>
        <button class="c4-edit-tool" type="button" data-edit-action="download" aria-label="Download current revision">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="c4-edit-tool" type="button" data-edit-action="fullscreen" aria-label="Fullscreen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
    </header>`
  },

  footer: {
    note: '.footer — global footer (copyright, OMNI mark, policy links)',
    minHeight: 64,
    pad: '0',
    html: `<div class="footer">
    <span class="copy">© 2026 Omnicom Group Inc.</span>
    <img class="omni-logo omni-logo--sm" src="omni-logo.png" alt="OMNI" />
    <span class="links">
      <a href="#">FAQs</a>
      <a href="#">Code of Conduct</a>
      <a href="#">Acceptable Use Policy</a>
      <a href="#">Privacy Policy</a>
      <a href="#">Data Subject Access Request</a>
    </span>
  </div>`
  },

  endcard: {
    note: '.bib-finale — brief end card (OMNI+ mark, eyebrow, decorative shape layers, 3-col meta)',
    minHeight: 360,
    html: `<article class="brief-board bib-finale-board" data-section="finale" data-nav-section="bibliography">
          <section class="bib-finale-tagline" aria-label="Brief end card">
            <div class="bib-finale-top">
              <img class="bib-finale-mark" src="omni-logo.png" alt="OMNI+" />
              <span class="bib-finale-eyebrow">Brief · Roblox Racing Wrap Competition · Delivered 04.28.2026</span>
            </div>
            <div class="bib-finale-shape" aria-hidden="true">
              <div class="bib-finale-shape-layer" data-layer="a"></div>
              <div class="bib-finale-shape-layer" data-layer="b"></div>
            </div>
            <div class="bib-finale-meta">
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>22 sources across 4 research rounds. Themes: Enterprise Mobility financials &amp; business model, customer experience ratings, operational challenges, digital transformation benchmarks, industry-wide CX trends.</p>
              </div>
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>Roblox Racing Wrap Competition. BuildSubmarines.com sponsored NASCAR car running daily inside Driving Empire. Submission window: June 19 — July 20. Up to $50,000 prize budget.</p>
              </div>
              <div class="bib-finale-col">
                <span class="bib-finale-num" aria-hidden="true"></span>
                <p>Authored inside OMNI+ Canvas v2.4. Vector knowledge collection: Lease Campaign. Distributed for creative team review across DDB, TBWA, and Omnicom PR Group.</p>
              </div>
            </div>
          </section>
        </article>`
  }
};
