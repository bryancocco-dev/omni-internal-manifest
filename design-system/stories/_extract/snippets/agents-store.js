// AUTO-EXTRACTED verbatim markup from agents-store/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
import { versionHistoryJs } from './_version-history.js';

export default {
  topnav: {
    note: '.topnav — global header bar (menu / OMNI logo / home / workspace / disabled tabs / storefront / profile)',
    minHeight: 64,
    pad: '0',
    html: `<div class="topnav">
    <div class="nav-icon-cell" id="navMenuBtn" role="button" tabindex="0" aria-label="Open navigation panel">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div class="omni-cell">
      <img class="omni-logo" src="omni-logo.png" alt="OMNI" />
    </div>

    <div class="nav-icon-cell nav-icon-cell--bordered" id="homeBtn" role="button" tabindex="0" title="OMNI dashboard" aria-label="Go to the OMNI dashboard">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div class="workspace" id="workspaceBtn" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="workspaceMenu">
      <span>Omnicom Precision Marketing</span>
      <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div class="tab" data-tab="graphics" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab" data-tab="canvas" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      Canvas
    </div>

    <div class="add-tab" title="New tab">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1"/><path d="M9 5.5v7M5.5 9h7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-right">
      <div class="nav-icon-cell nav-icon-cell--rule-both" id="storefrontBtn" role="button" tabindex="0" title="Agents Store" aria-label="Go to the Agents Store front">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 10h12l1 11H4z"/>
          <path d="M8 10V8a3 2 0 0 1 6 0v2"/>
          <path class="agst-star" d="M19 1Q19 4 22 4Q19 4 19 7Q19 4 16 4Q19 4 19 1Z" fill="currentColor" stroke="none"/>
        </svg>
      </div>
      <button class="me" id="profileMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false">
        <span class="avatar" aria-label="Bryan Cocco">BC</span>
        <span>Bryan</span>
        <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>`
  },

  tabs: {
    note: '.tab — topnav content-type tabs (disabled preview state shown)',
    minHeight: 60,
    html: `<div class="topnav" style="border:0;background:transparent">
    <div class="tab" data-tab="graphics" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab" data-tab="video" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon video" aria-hidden="true">
        <svg width="10" height="9" viewBox="0 0 10 9" fill="none"><path d="M1 8V4H7L7.001 8H1Z" fill="currentColor"/></svg>
      </span>
      Video
    </div>
    <div class="tab" data-tab="text" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon text" aria-hidden="true">
        <svg width="9" height="10" viewBox="0 0 7 8" fill="none"><path d="M0 2H1V1H2.626L1.34 7H0V8H4V7H2.874L4.16 1H6V2H7V0H0V2Z" fill="currentColor"/></svg>
      </span>
      Text
    </div>
    <div class="tab" data-tab="canvas" data-disabled="true" aria-disabled="true" title="Preview only — Agents Store is the focus">
      <span class="tab-icon canvas" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 11.6668 11.665" fill="none"><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      Canvas
    </div>
  </div>`
  },

  siderail: {
    note: '.section-nav — store browsing rail (column 1) with back button + nav-list',
    minHeight: 320,
    pad: '0',
    html: `<aside class="section-nav" id="sectionNav">
      <button class="rail-back" id="backBtn" title="Back" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l6-6M5 12l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <ul class="nav-list" role="tablist">
        <li class="nav-item active" data-section="featured" data-no-status role="tab"><i class="bx bx-star nav-item-icon" aria-hidden="true"></i>Featured</li>
        <li class="nav-item" data-section="browse" data-no-status role="tab"><i class="bx bx-grid-alt nav-item-icon" aria-hidden="true"></i>Browse all</li>
        <li class="nav-item" data-section="new" data-no-status role="tab"><i class="bx bx-rocket nav-item-icon" aria-hidden="true"></i>New this week</li>
        <li class="nav-item" data-section="trending" data-no-status role="tab"><i class="bx bx-trending-up nav-item-icon" aria-hidden="true"></i>Trending</li>
        <li class="nav-item" data-section="categories" data-no-status role="tab"><i class="bx bx-category nav-item-icon" aria-hidden="true"></i>Categories</li>
        <li class="nav-divider" aria-hidden="true"></li>
        <li class="nav-item" data-section="library" data-no-status role="tab"><i class="bx bx-bookmark nav-item-icon" aria-hidden="true"></i>My library</li>
        <li class="nav-item" data-section="installed" data-no-status role="tab"><i class="bx bx-download nav-item-icon" aria-hidden="true"></i>Installed</li>
      </ul>
    </aside>`
  },

  navlist: {
    note: '.nav-list — the rail tab list (active + divider states)',
    minHeight: 300,
    html: `<ul class="nav-list" role="tablist">
        <li class="nav-item active" data-section="featured" data-no-status role="tab"><i class="bx bx-star nav-item-icon" aria-hidden="true"></i>Featured</li>
        <li class="nav-item" data-section="browse" data-no-status role="tab"><i class="bx bx-grid-alt nav-item-icon" aria-hidden="true"></i>Browse all</li>
        <li class="nav-item" data-section="new" data-no-status role="tab"><i class="bx bx-rocket nav-item-icon" aria-hidden="true"></i>New this week</li>
        <li class="nav-item" data-section="trending" data-no-status role="tab"><i class="bx bx-trending-up nav-item-icon" aria-hidden="true"></i>Trending</li>
        <li class="nav-item" data-section="categories" data-no-status role="tab"><i class="bx bx-category nav-item-icon" aria-hidden="true"></i>Categories</li>
        <li class="nav-divider" aria-hidden="true"></li>
        <li class="nav-item" data-section="library" data-no-status role="tab"><i class="bx bx-bookmark nav-item-icon" aria-hidden="true"></i>My library</li>
        <li class="nav-item" data-section="installed" data-no-status role="tab"><i class="bx bx-download nav-item-icon" aria-hidden="true"></i>Installed</li>
      </ul>`
  },

  button: {
    note: '.store-card-btn (install + preview/learn-more) plus the .me profile button',
    minHeight: 80,
    html: `<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div class="store-card-actions" style="margin:0">
        <button class="store-card-btn store-card-btn--install" type="button">Install</button>
        <button class="store-card-btn store-card-btn--preview" type="button">Learn more</button>
      </div>
      <button class="me" id="profileMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false">
        <span class="avatar" aria-label="Bryan Cocco">BC</span>
        <span>Bryan</span>
        <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`
  },

  sectionheader: {
    note: '.store-sect-head — numbered editorial heading (.store-sect-num / .store-sect-name / .store-sect-link)',
    minHeight: 64,
    html: `<div class="store-sect-head">
            <span class="store-sect-num">02</span>
            <h2 class="store-sect-name">Just Landed</h2>            <a class="store-sect-link" href="#">Browse all <i class="bx bx-right-arrow-alt"></i></a>
          </div>`
  },

  card: {
    note: '.store-card.store-card--tile — full tile (thumb + author + name + desc + installs + actions; Popular flag)',
    minHeight: 380,
    html: `<article class="store-card store-card--tile">
                <span class="store-card-flag">Popular</span>
                <div class="store-card-thumb" data-gfx="gfx-persona-builder.svg" style="background-image: url('gfx-persona-builder.svg');"></div>
                <span class="store-card-author">DDB Insights</span>
                <h3 class="store-card-name">Persona Builder</h3>
                <p class="store-card-desc">Generates research-backed audience personas from your briefs and first-party data, each one ready to brief a campaign in seconds.</p>                <span class="store-card-installs"><i class="bx bx-download"></i>402 installs</span>
                <div class="store-card-actions">
                  <button class="store-card-btn store-card-btn--install" type="button">Install</button>
                  <button class="store-card-btn store-card-btn--preview" type="button">Learn more</button>
                </div>
              </article>`
  },

  optioncard: {
    note: '.store-card.store-card--tile.store-card--pop — compact text-only popular variant',
    minHeight: 220,
    html: `<article class="store-card store-card--tile store-card--pop">
                <span class="store-card-author">OMNI Labs</span>
                <h3 class="store-card-name">Headline Forge</h3>
                <p class="store-card-desc">Spins dozens of on-brand headline options from a single product fact in seconds.</p>
                <span class="store-card-installs"><i class="bx bx-download"></i>8,920 installs</span>
                <div class="store-card-actions">
                  <button class="store-card-btn store-card-btn--install" type="button">Install</button>
                  <button class="store-card-btn store-card-btn--preview" type="button">Learn more</button>
                </div>
              </article>`
  },

  chip: {
    note: '.store-card-flag (Popular ribbon) + a .store-meta-chip-style filter pill group',
    minHeight: 60,
    html: `<div style="position:relative;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <span class="store-card-flag" style="position:static">Popular</span>
      <span class="store-card-installs"><i class="bx bx-download"></i>402 installs</span>
      <span class="store-card-author">DDB Insights</span>
    </div>`
  },

  input: {
    note: '.store-search — search field (label-wrapped icon + .store-search-input)',
    minHeight: 64,
    html: `<label class="store-search">
              <i class="bx bx-search" aria-hidden="true"></i>
              <input type="text" placeholder="Search agents&hellip;" autocomplete="off" class="store-search-input" />
            </label>`
  },

  segmented: {
    note: '.store-pills — filter pill bar (.store-pill, active state + +more popover)',
    minHeight: 70,
    html: `<div class="store-pills" role="tablist" aria-label="Filter by category">
              <button class="store-pill is-active" data-filter="all" type="button">All</button>
              <button class="store-pill" data-filter="library" type="button">My Library</button>
              <button class="store-pill" data-filter="marketing" type="button">Marketing</button>
              <button class="store-pill" data-filter="sales" type="button">Sales</button>
              <button class="store-pill" data-filter="brand" type="button">Brand &amp; Voice</button>
              <button class="store-pill" data-filter="research" type="button">Research</button>
              <button class="store-pill" data-filter="productivity" type="button">Productivity</button>
              <div class="store-pill-more-wrap">
                <button class="store-pill store-pill--more" type="button" aria-haspopup="menu" aria-expanded="false">
                  <span>+3 more</span>
                  <i class="bx bx-chevron-down" aria-hidden="true"></i>
                </button>
              </div>
            </div>`
  },

  dropdown: {
    note: '.store-pill-menu — category overflow popover (shown open)',
    minHeight: 160,
    html: `<div class="store-pill-more-wrap" style="position:relative">
                <button class="store-pill store-pill--more" type="button" aria-haspopup="menu" aria-expanded="true">
                  <span>+3 more</span>
                  <i class="bx bx-chevron-down" aria-hidden="true"></i>
                </button>
                <div class="store-pill-menu" role="menu" aria-hidden="false" style="position:static;display:block;opacity:1;visibility:visible;transform:none;margin-top:8px">
                  <button class="store-pill-menu-item" role="menuitem" data-filter="operations" type="button">Operations</button>
                  <button class="store-pill-menu-item" role="menuitem" data-filter="customer" type="button">Customer Success</button>
                  <button class="store-pill-menu-item" role="menuitem" data-filter="data" type="button">Data &amp; Analytics</button>
                </div>
              </div>`
  },

  menu: {
    note: '.ch-profile-menu — profile dropdown (from JS template; avatar / name / email / Generator / Themes / Log out)',
    minHeight: 320,
    // JS-template menu — not in the resting page DOM. In context, anchor the
    // green box to the profile button it opens from (reveal:false so the menu's
    // own state classes aren't applied to the trigger).
    ctx: { sel: '#profileMenuBtn', reveal: false },
    html: `<div class="ch-profile-menu" role="menu" aria-label="Profile" style="position:static">
      <div class="ch-profile-stack">
        <div class="ch-profile-view ch-profile-view-main is-visible">
          <div class="ch-profile-avatar" aria-hidden="true">BC</div>
          <div class="ch-profile-name">Bryan Cocco</div>
          <div class="ch-profile-email">bryan.cocco@omc.com</div>
          <div class="ch-profile-divider" aria-hidden="true"></div>
          <button class="ch-profile-row is-link" type="button" data-action="open-generator" role="menuitem">
            <span class="ch-profile-row-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="6" height="6" rx="0.8"/><rect x="9.5" y="2.5" width="6" height="6" rx="0.8"/><rect x="2.5" y="9.5" width="6" height="6" rx="0.8"/><rect x="9.5" y="9.5" width="6" height="6" rx="0.8"/></svg></span>
            <span class="ch-profile-row-label">Generator</span>
          </button>
          <div class="ch-profile-divider" aria-hidden="true"></div>
          <button class="ch-profile-row is-link" type="button" data-action="open-themes" role="menuitem">
            <span class="ch-profile-row-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="8" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="12.5" cy="8" r="1"/><path d="M9 2a7 7 0 1 0 0 14c1.5 0 1.5-1.5.5-2-1-.5-.5-2 1-2h1.5A4 4 0 0 0 16 8 7 7 0 0 0 9 2z"/></svg></span>
            <span class="ch-profile-row-label">Themes</span>
            <span class="ch-profile-row-chev" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg></span>
          </button>
          <div class="ch-profile-divider" aria-hidden="true"></div>
          <button class="ch-profile-row is-logout" type="button" data-action="logout" role="menuitem">
            <span>Log out</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3-3-3-3M12 8H4M6 14H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2"/></svg>
          </button>
        </div>
      </div>
    </div>`
  },

  avatar: {
    note: '.avatar — initials chip inside the profile button',
    minHeight: 56,
    html: `<span class="avatar" aria-label="Bryan Cocco">BC</span>`
  },

  hero: {
    note: '.store-bleed--hero — full-bleed featured-agent hero (video omitted; scrim + content + rotation dots)',
    minHeight: 420,
    pad: '0',
    html: `<section class="store-bleed store-bleed--hero store-bleed--video" id="heroBleed" data-agent-idx="0">
            <div class="store-bleed-scrim" aria-hidden="true"></div>
            <div class="store-hero-blur" aria-hidden="true">
              <span class="store-hero-blur-l3"></span>
              <span class="store-hero-blur-l2"></span>
              <span class="store-hero-blur-l1"></span>
            </div>
            <div class="store-bleed-content">
              <div class="store-bleed-eyebrow-row">
                <span class="store-bleed-eyebrow">FEATURED AGENT</span>
                <span class="store-bleed-eyebrow-rule" aria-hidden="true"></span>
                <span class="store-bleed-eyebrow-id" id="heroAgentId">NO. 247</span>
              </div>
              <h1 class="store-bleed-title" id="heroAgentTitle">Brand Asset <em>Generator</em></h1>
              <p class="store-bleed-sub" id="heroAgentSub">An on-brand creative engine that spins campaign-ready assets — film, stills, and product renders — from a single brief.</p>
              <div class="store-bleed-meta-bar">
                <span class="store-bleed-meta-item">
                  <span class="store-bleed-meta-label">Publisher</span>
                  <span class="store-bleed-meta-value" id="heroAgentPublisher">OMNI Labs</span>
                </span>
                <span class="store-bleed-meta-item">
                  <span class="store-bleed-meta-label">Installs</span>
                  <span class="store-bleed-meta-value" id="heroAgentInstalls">4,210</span>
                </span>
                <span class="store-bleed-meta-item">
                  <span class="store-bleed-meta-label">Rating</span>
                  <span class="store-bleed-meta-value" id="heroAgentRating"><i class="bx bxs-star"></i>4.9</span>
                </span>
                <span class="store-bleed-meta-item">
                  <span class="store-bleed-meta-label">Updated</span>
                  <span class="store-bleed-meta-value" id="heroAgentUpdated">2d ago</span>
                </span>
                <span class="store-bleed-meta-item">
                  <span class="store-bleed-meta-label">Version</span>
                  <span class="store-bleed-meta-value" id="heroAgentVersion">v2.4</span>
                </span>
              </div>
              <div class="store-bleed-actions">
                <button class="store-cta-primary" type="button"><i class="bx bx-download"></i>Install</button>
                <button class="store-cta-secondary store-cta-secondary--onvideo" type="button"><i class="bx bx-right-arrow-alt"></i>Learn More</button>
              </div>
            </div>
            <aside class="store-rot" aria-label="Featured agents">
              <ol class="store-rot-list" role="tablist">
                <li class="store-rot-dot is-active" data-rot-idx="0" role="tab" aria-selected="true" tabindex="0" aria-label="Featured agent 1">
                  <span class="store-rot-fill"></span>
                </li>
                <li class="store-rot-dot" data-rot-idx="1" role="tab" tabindex="0" aria-label="Featured agent 2">
                  <span class="store-rot-fill"></span>
                </li>
              </ol>
            </aside>
          </section>`
  },

  toast: {
    note: '.toast — launch confirmation (shown via inline visible state)',
    minHeight: 70,
    html: `<div class="toast" id="launchToast" role="status" aria-live="polite" style="position:static;opacity:1;transform:none;visibility:visible">
  <span class="toast-dot">✓</span>
  <span id="launchToastText">Agent launched</span>
</div>`
  },

  modal: {
    note: '.vh-modal — Version History dialog (head + search + body); shown open',
    minHeight: 360,
    js: versionHistoryJs,
    html: `<div class="vh-modal open" id="versionHistoryModal" role="dialog" aria-modal="true" aria-hidden="false" aria-labelledby="versionHistoryTitle" style="position:static;display:flex;opacity:1;visibility:visible">
  <div class="vh-modal-card" role="document">
    <header class="vh-modal-head">
      <h2 class="vh-modal-title" id="versionHistoryTitle">Version History</h2>
      <button class="vh-icon-btn" type="button" aria-label="Close version history" id="versionHistoryClose">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>
    </header>
    <div class="vh-modal-search">
      <label class="vh-search-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search version" id="vhSearchInput" autocomplete="off" />
      </label>
    </div>
    <div class="vh-modal-body" id="vhVersionList"></div>
  </div>
</div>`
  },

  footer: {
    note: '.footer — page footer (copyright + logo + policy links)',
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
  }
};
