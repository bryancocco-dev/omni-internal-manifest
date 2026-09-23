// AUTO-EXTRACTED verbatim markup from omni-agent-builder/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
import { versionHistoryJs } from './_version-history.js';

export default {
  topnav: {
    note: '.topnav — workspace switcher + modality/agent tab strip + profile chip',
    minHeight: 64,
    pad: '0',
    html: `<div class="topnav">
    <div class="nav-icon-cell" id="navMenuBtn" role="button" tabindex="0" aria-label="Open navigation panel">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div class="omni-cell">
      <img class="omni-logo" src="omni-logo.png" alt="OMNI" />
    </div>

    <div class="nav-icon-cell nav-icon-cell--bordered" title="Home">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div class="workspace" id="workspaceBtn" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="workspaceMenu">
      <span>Omnicom Precision Marketing</span>
      <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="workspace-menu" id="workspaceMenu" role="menu" aria-hidden="true">
        <button class="workspace-menu-item active" role="menuitem" aria-current="true">
          <span class="wsm-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 16 Q 5 8 9.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 16 Q 19 8 14.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 16 L 12 8 L 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wsm-name">Omnicom Precision Marketing</span>
        </button>
        <button class="workspace-menu-item" role="menuitem">
          <span class="wsm-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 16 Q 5 8 9.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 16 Q 19 8 14.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 16 L 12 8 L 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wsm-name">Critical Mass</span>
        </button>
      </div>
    </div>

    <div class="tab" data-tab="graphics" data-disabled="true" aria-disabled="true" title="Preview only — Agent Builder is the focus">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab active" data-tab="agent" role="button" tabindex="0" id="agentTab">
      <span class="tab-icon agent" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="3.2"/>
          <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"/>
        </svg>
      </span>
      <span id="agentTabLabel">Agent Builder</span>
    </div>
    <div class="tab" data-tab="agent_zero" role="button" tabindex="0">
      <span class="tab-icon agent" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="3.2"/>
          <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"/>
        </svg>
      </span>
      agent_zero
    </div>

    <div class="add-tab" title="New tab">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1"/><path d="M9 5.5v7M5.5 9h7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-right">
      <button class="me" id="profileMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false">
        <span class="avatar" aria-label="Bryan Cocco">BC</span>
        <span>Bryan</span>
        <svg class="caret" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>`
  },

  tabs: {
    note: '.tab strip — disabled modality tab + active agent tab + add-tab',
    minHeight: 56,
    html: `<div style="display:flex;align-items:stretch;">
    <div class="tab" data-tab="graphics" data-disabled="true" aria-disabled="true" title="Preview only — Agent Builder is the focus">
      <span class="tab-icon graphics" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 11l3-3 2.5 2.5L10 7l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      Graphics
    </div>
    <div class="tab active" data-tab="agent" role="button" tabindex="0" id="agentTab">
      <span class="tab-icon agent" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="3.2"/>
          <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"/>
        </svg>
      </span>
      <span id="agentTabLabel">Agent Builder</span>
    </div>
    <div class="tab" data-tab="agent_zero" role="button" tabindex="0">
      <span class="tab-icon agent" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="3.2"/>
          <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6"/>
        </svg>
      </span>
      agent_zero
    </div>
    <div class="add-tab" title="New tab">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1"/><path d="M9 5.5v7M5.5 9h7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    </div>
  </div>`
  },

  siderail: {
    note: '.section-nav — builder tablist + Version History item + Agent Fidelity meter',
    minHeight: 460,
    html: `<aside class="section-nav" id="sectionNav">
      <button class="rail-back" id="backBtn" title="Back" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l6-6M5 12l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <ul class="nav-list" role="tablist">
        <li class="nav-item active" data-section="description" role="tab">Description</li>
        <li class="nav-item" data-section="instructions" role="tab">Instructions</li>
        <li class="nav-item" data-section="expected-output" role="tab">Expected Output</li>
        <li class="nav-item" data-section="goals" role="tab">Goals</li>
        <li class="nav-item" data-section="tools" role="tab">Tools</li>
        <li class="nav-item" data-section="attachments" role="tab">Attachments</li>
        <li class="nav-item" data-section="data-sources" role="tab">Data Sources</li>
        <li class="nav-item" data-section="expert-settings" role="tab">Expert Settings</li>
        <li class="nav-divider" aria-hidden="true"></li>
        <li class="nav-item" data-modal-target="version-history" data-no-status role="button"><i class="bx bx-history nav-item-icon" aria-hidden="true"></i>Version History</li>
      </ul>
      <div class="fidelity" aria-live="polite">
        <div class="fidelity-top">
          <span class="fidelity-label">Agent Fidelity</span>
          <span class="fidelity-num"><span id="fidelityPct">0</span>%</span>
        </div>
        <div class="fidelity-bar"><div class="fidelity-fill" id="fidelityFill"></div></div>
        <span class="fidelity-status" id="fidelityStatus">Draft</span>
      </div>
    </aside>`
  },

  navlist: {
    note: '.nav-list — builder section tablist (rail interior)',
    minHeight: 320,
    html: `<ul class="nav-list" role="tablist">
        <li class="nav-item active" data-section="description" role="tab">Description</li>
        <li class="nav-item" data-section="instructions" role="tab">Instructions</li>
        <li class="nav-item" data-section="expected-output" role="tab">Expected Output</li>
        <li class="nav-item" data-section="goals" role="tab">Goals</li>
        <li class="nav-item" data-section="tools" role="tab">Tools</li>
        <li class="nav-item" data-section="attachments" role="tab">Attachments</li>
        <li class="nav-item" data-section="data-sources" role="tab">Data Sources</li>
        <li class="nav-item" data-section="expert-settings" role="tab">Expert Settings</li>
        <li class="nav-divider" aria-hidden="true"></li>
        <li class="nav-item" data-modal-target="version-history" data-no-status role="button"><i class="bx bx-history nav-item-icon" aria-hidden="true"></i>Version History</li>
      </ul>`
  },

  navlist_files: {
    note: '.creative-file-row — uploaded reference-asset card (from JS template)',
    minHeight: 140,
    html: `<div class="creative-files-list" id="creativeFilesList">
      <div class="creative-file-row" data-i="0">
        <div class="creative-file-head">
          <span class="creative-file-thumb">PDF</span>
          <button class="creative-file-name" type="button" title="Replace file">Driftline_Motors_Brand_Book_v4.2.pdf</button>
          <button class="creative-file-x" type="button" aria-label="Remove">×</button>
        </div>
        <div class="creative-file-instructions-wrap">
          <div class="creative-file-instructions-head">
            <span class="creative-file-instructions-label">Instructions</span>
            <div class="creative-file-instructions-actions">
              <button class="creative-file-action creative-file-action--cancel" type="button">Cancel</button>
              <button class="creative-file-action creative-file-action--save" type="button">Save</button>
              <button class="creative-file-action creative-file-action--edit" type="button">Edit</button>
            </div>
          </div>
          <textarea class="creative-file-instructions" rows="1" placeholder="Optional — how should the agent use this file?" readonly>Treat this as the canonical Driftline brand book — the ground truth for voice, palette, and visual identity. Defer to the "Voice & Tone" chapter (pp. 18-34) for every long-form draft, and the "Visual Identity" pages (pp. 41-58) when reviewing campaign concepts. Do not introduce any tone descriptor that is not literally listed in this document. The hex codes on p. 47 are the only permitted brand colors; flag any usage outside that palette. If another reference disagrees with this book, this book wins.</textarea>
          <button class="creative-file-instructions-toggle" type="button">Show more</button>
        </div>
      </div>
    </div>`
  },

  sectionheader: {
    note: '.canvas-header — eyebrow + agent-name crumb + presence + Share',
    minHeight: 72,
    html: `<div class="canvas-header" id="canvasHeader">
      <div class="ch-title-wrap">
        <div class="ch-title">
          <span class="ch-eyebrow">AGENT BUILDER</span>
          <div class="ch-crumb-row">
            <span class="ch-crumb">Agent Name Here</span>
          </div>
        </div>
      </div>
      <div class="ch-actions">
        <div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>
        <button class="share-btn" id="shareBtn">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
      </div>
    </div>`
  },

  sectionheader_pane: {
    note: '.pane-head — per-section title + sub copy with auto-fill wand',
    minHeight: 120,
    html: `<div class="pane-shell pane active" style="position:relative">
          <button class="pane-wand" type="button" aria-label="Auto-fill description" data-fill-section="description"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg></button>
          <div class="pane-head">
            <h2 class="pane-title">Description</h2>
            <p class="pane-sub">Give your agent an identity — name, icon, description, and tags that help others find and recognize it.</p>
          </div>
        </div>`
  },

  card: {
    note: '.form-card — Description name + icon row',
    minHeight: 160,
    html: `<div class="form-card">
            <div class="name-row">
              <div class="name-col">
                <div class="field-meta">
                  <h3>Name</h3>
                  <span class="field-hint" id="nameHint">3 more characters required</span>
                </div>
                <input class="text-input" id="agentName" type="text" placeholder="Custom brand agent" />
              </div>
              <div class="icon-col">
                <h3>Icon</h3>
                <button class="icon-picker-btn" id="iconPickerBtn" type="button" aria-label="Choose icon">
                  <i class="bx bx-plus" id="iconPickerPreview"></i>
                </button>
              </div>
            </div>
          </div>`
  },

  input: {
    note: '.text-input — single-line name field with field-meta',
    minHeight: 96,
    html: `<div class="field-meta">
                  <h3>Name</h3>
                  <span class="field-hint" id="nameHint">3 more characters required</span>
                </div>
                <input class="text-input" id="agentName" type="text" placeholder="Custom brand agent" />`
  },

  textarea: {
    note: '.text-area — Role / Mission multiline field inside a form-card',
    minHeight: 140,
    html: `<div class="form-card">
            <div class="field-meta">
              <h3>Role / Mission</h3>
              <span class="field-hint" id="descHint">20 more characters required</span>
            </div>
            <textarea class="text-area" id="agentDescription" placeholder="Define what the agent is."></textarea>
          </div>`
  },

  search: {
    note: '.search-input — icon + input search used for tags / data sources',
    minHeight: 72,
    html: `<div class="search-input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                <input type="text" id="dsSearchInput" placeholder="Search data sources" autocomplete="off" />
              </div>`
  },

  code: {
    note: '.code-editor — gutter + textarea instructions editor',
    minHeight: 280,
    html: `<div class="code-editor">
            <div class="code-gutter" aria-hidden="true"></div>
            <textarea class="code-input" data-syncto="instructions" rows="24">1. Core Behaviors

Do's:
- Always cite sources when referencing data or research.
- Always ask a clarifying question when input is ambiguous.
- Default to concise, professional language unless the user asks otherwise.

Don'ts:
- Never fabricate facts, statistics, or quotes.
- Never share customer data, internal pricing, or unreleased work.
- Never act outside the scope of your defined role.

2. Tone & Voice
Default to a confident, plainspoken register. Avoid hedging language ("might," "perhaps") unless flagging genuine uncertainty. Prefer one short sentence over two long ones. Use [brand voice descriptors] when the request is customer-facing.

3. Audience
Default audience: [primary stakeholder — e.g. senior marketing leadership]. Calibrate based on signals — if the user identifies as a junior creative or a vendor, soften the directness and expand acronyms on first use.

4. Escalation
If a request touches legal, compliance, customer-safety, or unannounced product, decline and recommend the user route it to the appropriate team. Surface the reason — never refuse silently.

5. Error Handling
If you cannot answer accurately, say "I don't have enough information to answer that" and ask for the missing context.</textarea>
          </div>`
  },

  dropzone: {
    note: '.dropzone — reference-file upload label',
    minHeight: 160,
    html: `<label class="dropzone" id="creativeDropzone">
              <input type="file" multiple accept="image/*,video/*,.pdf,.psd,.ai,.sketch,.fig" id="creativeFileInput" hidden />
              <svg class="dropzone-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
              <span class="dropzone-text"><strong>Drop reference files here</strong> or click to upload</span>
              <span class="dropzone-hint">PNG, JPG, MP4, PDF, PSD, AI, Sketch, Figma</span>
            </label>`
  },

  slider: {
    note: '.slider-row — range slider with axis labels + bound value (Expert Settings)',
    minHeight: 200,
    html: `<div class="setting-card">
            <h3>Output Creativity</h3>
            <p>Temperature controls randomness; top-k controls the pool of candidate tokens. For creative ideation (brainstorming, varied phrasing) set Temperature higher. For agents working with structured data (classification, RAG with clear schemas) keep Temperature lower so answers stay consistent.</p>
            <div class="slider-row">
              <span class="slider-label">Temperature <span class="info" data-tip="Controls randomness. Higher = more creative, varied phrasing (good for ideation). Lower = more deterministic, repeatable answers (good for structured data and classification)."><svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 6v4M7 4v.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></span>
              <span class="slider-track-wrap">
                <span class="slider-axis-labels"><span>More Deterministic</span><span>More Creative and Random</span></span>
                <input class="slider" type="range" min="0" max="100" value="0" data-setting="temperature" />
                <span class="slider-hint" data-hint-for="temperature"></span>
              </span>
              <span class="slider-value" data-bind="temperature">0</span>
            </div>
          </div>`
  },

  toggle: {
    note: '.check — standard tool checkbox row (custom .check-box)',
    minHeight: 72,
    html: `<div class="tool-row">
              <label class="check">
                <input type="checkbox" data-tool="web" />
                <span class="check-box" aria-hidden="true"></span>
                Web Browsing
              </label>
            </div>`
  },

  toggle_ds: {
    note: '.ds-toggle — data-source enable switch (from JS template; data-on state)',
    minHeight: 64,
    html: `<button class="ds-toggle" type="button" data-on="true" aria-label="Toggle Survey Response Bank" aria-pressed="true"></button>`
  },

  chip: {
    note: '.tag.tag-active — removable tag chip (from JS template)',
    minHeight: 56,
    html: `<div class="tag-list">
      <span class="tag tag-active">Driftline Motors<button type="button" aria-label="Remove">×</button></span>
      <span class="tag tag-active">Google Vehicle Listings<button type="button" aria-label="Remove">×</button></span>
      <span class="tag tag-active">Brand Voice<button type="button" aria-label="Remove">×</button></span>
      <span class="tag tag-active">Marketing<button type="button" aria-label="Remove">×</button></span>
      <span class="tag tag-active">Customer Support<button type="button" aria-label="Remove">×</button></span>
    </div>`
  },

  table: {
    note: '.ds-list — data-source table header + rows (from JS template)',
    minHeight: 200,
    html: `<div class="ds-list" id="dsList">
      <div class="ds-header">
        <span></span>
        <span>Data source</span>
        <span>Description</span>
        <span>Created</span>
        <span>Updated</span>
        <span>Instructions</span>
      </div>
      <div class="ds-row-wrap" data-id="survey-bank" data-enabled="false">
        <div class="ds-row" data-id="survey-bank">
          <button class="ds-toggle" type="button" data-on="false" aria-label="Toggle Survey Response Bank" aria-pressed="false"></button>
          <span class="ds-name">Survey Response Bank</span>
          <span class="ds-desc">Aggregated survey responses, all live studies</span>
          <span class="ds-date">May 09 2025</span>
          <span class="ds-date">Apr 17 2026</span>
          <button class="ds-edit" type="button" data-ds-id="survey-bank" aria-label="Edit instructions">
            <span class="ds-edit-text">Add</span>
            <svg class="ds-edit-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
          </button>
        </div>
        <div class="ds-instructions">
          <textarea class="ds-instructions-input" data-ds-id="survey-bank" placeholder="Instructions (optional) — how should the agent use Survey Response Bank? (e.g. which fields to prioritize, what to ignore, freshness window)"></textarea>
          <div class="ds-instructions-actions">
            <button class="ds-action ds-action--save" type="button">Save</button>
          </div>
        </div>
      </div>
    </div>`
  },

  emptystate: {
    note: '.ds-empty — no-match line for data-source search (from JS template)',
    minHeight: 64,
    // JS-template line injected into a wizard step that isn't shown at rest and
    // has no small resting anchor — In context falls back gracefully to the full
    // source page (no green box) rather than boxing the entire 3000px list.
    html: `<div class="ds-empty">No data sources match that search.</div>`
  },

  avatar: {
    note: '.presence — overlapping collaborator avatars with hover cards',
    minHeight: 72,
    html: `<div class="presence" title="3 collaborators in this canvas">
          <div class="presence-stack">
            <span class="pa pa-bc" tabindex="0" aria-label="Bryan Cocco, Owner">BC<span class="pa-card" role="tooltip"><span class="pa-card-circle pa-bc">BC</span><span class="pa-card-name">Bryan Cocco</span><span class="pa-card-role">Owner</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=47')" tabindex="0" aria-label="Lena Ortiz, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=47')"></span><span class="pa-card-name">Lena Ortiz</span><span class="pa-card-role">Editor</span></span></span>
            <span class="pa pa-img" style="background-image: url('https://i.pravatar.cc/80?img=33')" tabindex="0" aria-label="Jamal Reed, Editor"><span class="pa-card" role="tooltip"><span class="pa-card-circle pa-card-circle--img" style="background-image: url('https://i.pravatar.cc/80?img=33')"></span><span class="pa-card-name">Jamal Reed</span><span class="pa-card-role">Editor</span></span></span>
          </div>
          <span class="presence-count">3</span>
        </div>`
  },

  statusring: {
    note: '.fidelity — Agent Fidelity meter (label + bar + status), rail footer',
    minHeight: 96,
    html: `<div class="fidelity" aria-live="polite">
        <div class="fidelity-top">
          <span class="fidelity-label">Agent Fidelity</span>
          <span class="fidelity-num"><span id="fidelityPct">62</span>%</span>
        </div>
        <div class="fidelity-bar"><div class="fidelity-fill" id="fidelityFill" style="width:62%"></div></div>
        <span class="fidelity-status" id="fidelityStatus">Draft</span>
      </div>`
  },

  button: {
    note: '.canvas-actions — Cancel (ghost) + Save (.launch-btn, disabled) sticky bar',
    minHeight: 80,
    html: `<div class="canvas-actions" id="canvasActions">
        <span class="canvas-actions-spacer" aria-hidden="true"></span>
        <button class="cancel-btn" id="cancelBtn" type="button">Cancel</button>
        <button class="launch-btn" id="launchBtn" type="button" disabled title="Add a name (3+ chars) and description (20+ chars) to save">Save</button>
      </div>`
  },

  menu: {
    note: '.workspace-menu — org switcher popover (active + idle item)',
    minHeight: 160,
    html: `<div class="workspace-menu" id="workspaceMenu" role="menu" style="position:static;display:block;opacity:1;visibility:visible;transform:none">
        <button class="workspace-menu-item active" role="menuitem" aria-current="true">
          <span class="wsm-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 16 Q 5 8 9.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 16 Q 19 8 14.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 16 L 12 8 L 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wsm-name">Omnicom Precision Marketing</span>
        </button>
        <button class="workspace-menu-item" role="menuitem">
          <span class="wsm-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 16 Q 5 8 9.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 16 Q 19 8 14.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 16 L 12 8 L 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wsm-name">Critical Mass</span>
        </button>
      </div>`
  },

  toast: {
    note: '.toast — launch confirmation toast (shown state)',
    minHeight: 140,
    html: `<div class="toast show" id="launchToast" role="status" aria-live="polite">
  <span class="toast-dot">✓</span>
  <span id="launchToastText">Agent launched</span>
</div>`
  },

  modal: {
    note: '.vh-modal — Version History dialog (search + scrollable row list)',
    minHeight: 420,
    js: versionHistoryJs,
    html: `<div class="vh-modal open" id="versionHistoryModal" role="dialog" aria-modal="true" aria-labelledby="versionHistoryTitle" style="position:static;display:flex;opacity:1;visibility:visible">
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

  modal_confirm: {
    note: '.confirm-modal — Leave Agent Builder confirmation (icon + ghost/leave actions)',
    minHeight: 280,
    html: `<div class="confirm-modal show" id="leaveModal" role="dialog" aria-modal="true" aria-label="Leave Agent Builder confirmation" style="position:static;display:block;opacity:1;visibility:visible">
  <div class="confirm-backdrop" id="leaveBackdrop"></div>
  <div class="confirm-card">
    <div class="confirm-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <h2 class="confirm-title">Leave Agent Builder?</h2>
    <p class="confirm-desc">Stay to keep working on this agent. Leave exits Agent Builder and takes you back to the previous screen.</p>
    <div class="confirm-actions">
      <button class="confirm-btn confirm-btn--ghost" type="button" id="leaveStayBtn">Stay</button>
      <button class="confirm-btn confirm-btn--leave" type="button" id="leaveConfirmBtn">Leave</button>
    </div>
  </div>
</div>`
  },

  modal_iconpicker: {
    note: '.icon-picker-modal — BoxIcons search grid (grid populated with sample .icon-picker-item buttons)',
    minHeight: 320,
    html: `<div class="icon-picker-modal show" id="iconPickerModal" role="dialog" aria-modal="true" aria-label="Choose an icon" style="position:static;display:block;opacity:1;visibility:visible">
  <div class="icon-picker-backdrop" id="iconPickerBackdrop"></div>
  <div class="icon-picker-card">
    <div class="icon-picker-head">
      <i class="bx bx-search"></i>
      <input class="icon-picker-search" id="iconPickerSearch" type="text" placeholder="Search icons…" autocomplete="off" />
      <button class="icon-picker-close" id="iconPickerClose" type="button" aria-label="Close">×</button>
    </div>
    <div class="icon-picker-grid" id="iconPickerGrid">
      <button class="icon-picker-item selected" type="button" data-icon="bx-bot" aria-label="bx-bot"><i class="bx bx-bot"></i></button>
      <button class="icon-picker-item" type="button" data-icon="bx-brain" aria-label="bx-brain"><i class="bx bx-brain"></i></button>
      <button class="icon-picker-item" type="button" data-icon="bx-chip" aria-label="bx-chip"><i class="bx bx-chip"></i></button>
      <button class="icon-picker-item" type="button" data-icon="bx-rocket" aria-label="bx-rocket"><i class="bx bx-rocket"></i></button>
      <button class="icon-picker-item" type="button" data-icon="bx-star" aria-label="bx-star"><i class="bx bx-star"></i></button>
      <button class="icon-picker-item" type="button" data-icon="bx-palette" aria-label="bx-palette"><i class="bx bx-palette"></i></button>
    </div>
  </div>
</div>`
  },

  progress: {
    note: '.vh-row — version-history timeline row (avatar + title + date + Restore + kebab menu) (from JS template)',
    minHeight: 100,
    html: `<div class="vh-modal-body" style="display:block">
      <div class="vh-row" data-title="v35 — refined output schema" data-author="noah fielding">
        <span class="vh-row-avatar" style="background:#6b6d7a" aria-hidden="true">AC</span>
        <div class="vh-row-info">
          <div class="vh-row-title">v35 — Refined output schema</div>
          <div class="vh-row-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Jun 3, 2026, 4:17 PM · Noah Fielding</span></div>
        </div>
        <div class="vh-row-actions">
          <button type="button" class="vh-row-restore">Restore</button>
          <button type="button" class="vh-row-kebab" aria-label="More actions" aria-haspopup="menu" aria-expanded="false" data-menu-trigger="0"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button>
          <div class="vh-row-menu" role="menu" data-menu-id="0"><button class="vh-row-menu-item" role="menuitem" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span>Preview</span></button><button class="vh-row-menu-item" role="menuitem" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg><span>Save as Version</span></button></div>
        </div>
      </div>
    </div>`
  },

  celebration: {
    note: '.agent-ready-modal — "agent ready" overlay with starfield + fidelity + CTAs',
    minHeight: 560,
    html: `<div class="agent-ready-modal show" id="agentReadyModal" role="dialog" aria-modal="true" aria-label="Agent ready" style="position:static;display:flex;opacity:1;visibility:visible;min-height:520px">
  <div class="agent-ready-backdrop" id="agentReadyBackdrop"></div>
  <div class="agent-ready-card">
    <div class="agent-ready-flare" aria-hidden="true"></div>
    <div class="agent-ready-starfield" id="agentReadyStarfield" aria-hidden="true"></div>
    <h2 class="agent-ready-title">Your Agent is Ready to Go.</h2>
    <div class="agent-ready-tile-stage" aria-hidden="true">
      <span class="agent-ready-spark" style="--dx:118px;--dy:18px;--size:4px;--d:30ms;--dur:1550ms"></span>
      <span class="agent-ready-spark" style="--dx:98px;--dy:50px;--size:2px;--d:0ms;--dur:1400ms"></span>
      <span class="agent-ready-spark" style="--dx:82px;--dy:82px;--size:5px;--d:80ms;--dur:1600ms"></span>
      <span class="agent-ready-spark" style="--dx:54px;--dy:96px;--size:3px;--d:40ms;--dur:1450ms"></span>
      <span class="agent-ready-spark" style="--dx:26px;--dy:122px;--size:2px;--d:90ms;--dur:1500ms"></span>
      <span class="agent-ready-spark agent-ready-spark--soft" style="--dx:6px;--dy:130px;--size:3px;--d:50ms;--dur:1480ms"></span>
      <span class="agent-ready-spark" style="--dx:-22px;--dy:118px;--size:5px;--d:20ms;--dur:1550ms"></span>
      <span class="agent-ready-spark" style="--dx:-48px;--dy:96px;--size:3px;--d:110ms;--dur:1400ms"></span>
      <span class="agent-ready-spark agent-ready-spark--soft" style="--dx:-72px;--dy:76px;--size:4px;--d:60ms;--dur:1500ms"></span>
      <span class="agent-ready-spark" style="--dx:-96px;--dy:54px;--size:2px;--d:70ms;--dur:1380ms"></span>
      <span class="agent-ready-spark" style="--dx:-118px;--dy:22px;--size:4px;--d:140ms;--dur:1520ms"></span>
      <span class="agent-ready-spark agent-ready-twinkle" style="--dx:62px;--dy:42px;--size:3px;--d:1800ms"></span>
      <span class="agent-ready-spark agent-ready-twinkle" style="--dx:-58px;--dy:36px;--size:4px;--d:2050ms"></span>
      <span class="agent-ready-tile-aura"></span>
      <div class="agent-ready-tile">
        <i class="bx bx-pen" id="agentReadyIcon"></i>
      </div>
    </div>
    <div class="agent-ready-meta">
      <div class="agent-ready-name" id="agentReadyName">Driftline Motors Brand Steward</div>
      <div class="agent-ready-desc" id="agentReadyDesc">Maintains Driftline Motors's brand voice across every customer-facing surface — ad copy, landing pages, CRM emails, dealership scripts. Trained on the latest brand guidelines (v4.2), tone-of-voice manual, and the approved Q4 campaign messaging. Use it for copy reviews, content audits, and first-draft generation.</div>
    </div>
    <div class="agent-ready-fidelity">
      <div class="agent-ready-fidelity-top">
        <span class="agent-ready-fidelity-label">Agent Fidelity</span>
        <span class="agent-ready-fidelity-num"><span id="agentReadyPct">62</span>%</span>
      </div>
      <div class="agent-ready-fidelity-bar"><div class="agent-ready-fidelity-fill" id="agentReadyFill" style="width:62%"></div></div>
    </div>
    <div class="agent-ready-ctas">
      <button class="agent-ready-cta agent-ready-cta--primary" type="button" id="agentReadyLaunch">Launch Agent Now</button>
      <button class="agent-ready-cta agent-ready-cta--secondary" type="button" id="agentReadyRefine">Continue refining</button>
    </div>
  </div>
</div>`,
    js: `(function(){
      var modal=document.getElementById('agentReadyModal');
      var field=document.getElementById('agentReadyStarfield');
      if(field){var frag=document.createDocumentFragment();
        for(var i=0;i<50;i++){var s=document.createElement('span');s.className='arm-star';
          var ang=Math.random()*360,dist=240+Math.random()*220,dur=2200+Math.random()*1600,d=Math.random()*3800,size=1+Math.random()*2.5;
          s.style.setProperty('--ang',ang.toFixed(1)+'deg');s.style.setProperty('--dist',dist.toFixed(0)+'px');
          s.style.setProperty('--dur',dur.toFixed(0)+'ms');s.style.setProperty('--d',d.toFixed(0)+'ms');
          s.style.setProperty('--size',size.toFixed(1)+'px');frag.appendChild(s);}
        field.appendChild(frag);}
      if(modal){requestAnimationFrame(function(){modal.classList.add('open');});}
    })();`
  },

  footer: {
    note: '.footer — copyright + OMNI mark + policy links',
    minHeight: 56,
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
