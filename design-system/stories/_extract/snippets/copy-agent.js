// AUTO-EXTRACTED verbatim markup from copy-agent/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_copydest: {
    note: '.cw-panel — Copy Agent to Workspace overlay: cargo manifest (attachments/tools, collapsible) + searchable destination picker (shown open)',
    minHeight: 660,
    pad: '32px',
    html: `<div class="cw-panel open" id="cwPanel" role="dialog" aria-modal="true" aria-label="Copy agent to workspace" style="position:static;opacity:1;visibility:visible;transform:none;margin:0 auto;width:520px;max-height:none;">
    <div class="cw-head">
      <div class="cw-titles">
        <div class="cw-title">Copy Agent to Workspace</div>
      </div>
      <button class="cw-close" id="cwClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="cw-view" id="cwView">
      <div class="cw-zone1">
        <div class="cw-seclab"><span>Copying</span></div>
        <div class="cw-pkg">
          <div class="cw-pkg-head">
            <span class="ftile init aic" id="cwPkgTile" aria-hidden="true" style="background:rgba(255,44,30,0.12);color:#c11f14"><span id="cwPkgInit"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg></span></span>
            <div class="cw-pkg-titles">
              <div class="cw-pkg-name" id="cwAgent">Creative QA Sweep</div>
            </div>
          </div>
        <div class="cw-group" id="cwGroupAttach">
          <div class="cw-mrow">
            <label class="cw-opt">
              <input type="checkbox" id="cwOptAttach" checked>
              <span class="cw-check"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.2L4.8 9L10 3.4"/></svg></span>
              <span class="cw-opt-label">Attachments</span>
            </label>
            <button class="cw-count-btn open" id="cwAttachDisc" type="button" aria-label="Show attachment files"><span id="cwAttachCount">3 files</span><svg viewBox="0 0 8 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.2L4 3.6L6.5 1.2"/></svg></button>
          </div>
          <div class="cw-reveal open" id="cwAttachReveal"><div><div class="cw-files" id="cwFiles">
            <div class="cw-file"><span class="cw-ext">pdf</span><span class="cw-file-name">QA Checklist — Display</span><span class="cw-file-size">520 KB</span></div>
            <div class="cw-file"><span class="cw-ext">docx</span><span class="cw-file-name">Legal Lines</span><span class="cw-file-size">74 KB</span></div>
            <div class="cw-file"><span class="cw-ext">xlsx</span><span class="cw-file-name">Spec Sheet 2026</span><span class="cw-file-size">150 KB</span></div>
          </div></div></div>
        </div>
        <div class="cw-group" id="cwGroupTools">
          <div class="cw-mrow">
            <label class="cw-opt">
              <input type="checkbox" id="cwOptTools" checked>
              <span class="cw-check"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.2L4.8 9L10 3.4"/></svg></span>
              <span class="cw-opt-label">Tools</span>
            </label>
            <button class="cw-count-btn" id="cwToolDisc" type="button" aria-label="Show tools"><span id="cwToolCount">2 tools</span><svg viewBox="0 0 8 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.2L4 3.6L6.5 1.2"/></svg></button>
          </div>
          <div class="cw-reveal" id="cwToolReveal"><div><div class="cw-tools" id="cwTools">
            <div class="cw-file"><span class="cw-ext">VD</span><span class="cw-file-name">Vision Diff</span></div>
            <div class="cw-file"><span class="cw-ext">SV</span><span class="cw-file-name">Spec Validator</span></div>
          </div></div></div>
        </div>
        <div class="cw-kb">
          <svg class="cw-kb-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          <span>Knowledge bases never leave this workspace &mdash; for your client&rsquo;s security.</span>
        </div>
        </div>
      </div>
      <div class="cw-zone2">
        <div class="cw-seclab"><span>Destination</span></div>
        <div class="cw-search">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input id="cwSearch" type="text" placeholder="Search 13 workspaces" autocomplete="off" aria-label="Search workspaces">
        </div>
        <div class="cw-list" id="cwList" role="group" aria-label="Destination workspaces">
          <button class="cw-item current" type="button" role="checkbox" aria-checked="false" data-name="omnicom precision marketing" disabled>
            <span class="cw-ws-logo" aria-hidden="true"><img src="/_assets/copy-agent/ws-omnicom.png" alt=""></span>
            <span class="cw-name">Omnicom Precision Marketing</span>
            <span class="cw-chip">Current</span>
          </button>
          <button class="cw-item" type="button" role="checkbox" aria-checked="false" data-name="bbdo worldwide">
            <span class="cw-ws-logo" aria-hidden="true"><img src="/_assets/copy-agent/ws-bbdo.png" alt=""></span>
            <span class="cw-name">BBDO Worldwide</span>
            <span class="cw-meta">112 members</span><span class="cw-radio" aria-hidden="true"></span>
          </button>
          <button class="cw-item selected" type="button" role="checkbox" aria-checked="true" data-name="ddb north america">
            <span class="cw-ws-logo mono" aria-hidden="true">DDB</span>
            <span class="cw-name">DDB North America</span>
            <span class="cw-meta">76 members</span><span class="cw-radio" aria-hidden="true"></span>
          </button>
          <button class="cw-item" type="button" role="checkbox" aria-checked="false" data-name="critical mass">
            <span class="cw-ws-logo" aria-hidden="true"><img src="/_assets/copy-agent/ws-criticalmass.png" alt=""></span>
            <span class="cw-name">Critical Mass</span>
            <span class="cw-meta copied-tag">Copied</span><span class="cw-radio" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
    <div class="cw-foot">
      <button class="cw-btn-ghost" id="cwCancel" type="button">Cancel</button>
      <button class="cw-btn-primary" id="cwPrimary" type="button">Copy to DDB North America</button>
    </div>
  </div>`
  },

  receipt: {
    note: '.cw-success / .cw-done-list — post-copy receipt (stamped avatar + badge, one row per destination with its real mark); the .cw-panel.done success state',
    minHeight: 380,
    pad: '32px',
    html: `<div class="cw-panel open done" id="cwPanel" role="dialog" aria-modal="true" aria-label="Copy agent to workspace" style="position:static;opacity:1;visibility:visible;transform:none;margin:0 auto;width:420px;max-height:none;">
    <div class="cw-head">
      <div class="cw-titles">
        <div class="cw-title">Copy Agent to Workspace</div>
      </div>
      <button class="cw-close" id="cwClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="cw-success" id="cwSuccess">
      <div class="cw-avatar aic" style="background:rgba(255,44,30,0.12);color:#c11f14"><span id="cwInitials"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg></span><span class="cw-badge" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.2L4.8 9L10 3.4"/></svg></span></div>
      <div class="cw-done-head" id="cwDoneHead">Copied Creative QA Sweep to 3 workspaces</div>
      <div class="cw-done-list" id="cwDoneList">
        <div class="cw-done-ws"><span class="cw-ws-logo" aria-hidden="true"><img src="/_assets/copy-agent/ws-bbdo.png" alt=""></span><span class="name">BBDO Worldwide</span></div>
        <div class="cw-done-ws"><span class="cw-ws-logo mono" aria-hidden="true">DDB</span><span class="name">DDB North America</span></div>
        <div class="cw-done-ws"><span class="cw-ws-logo" aria-hidden="true"><img src="/_assets/copy-agent/ws-criticalmass.png" alt=""></span><span class="name">Critical Mass</span></div>
      </div>
    </div>
    <div class="cw-foot">
      <button class="cw-btn-primary" id="cwPrimary" type="button">Done</button>
    </div>
  </div>`
  },

  headertabs: {
    note: '.header — app header below the shared topnav: content tabs (Files/Skills/Assets/Agents/Audiences/Data Sets, one .active) + expandable .hdr-search (shown open/filtering) + gallery/list .view-toggle',
    minHeight: 96,
    pad: '0',
    html: `<header class="header">
    <h1>CORVACHE</h1>
    <div class="header-right">
      <button class="new-btn">New <svg width="10" height="10" viewBox="0 0 9.33333 9.33333" fill="none"><path d="M9.33333 4H5.33333V0H4V4H0V5.33333H4V9.33333H5.33333V5.33333H9.33333V4Z" fill="white"/></svg></button>
      <nav class="header-tabs">
        <a href="#" data-tab="Files">Files</a>
        <a href="#" data-tab="Skills">Skills</a>
        <a href="#" data-tab="Assets">Assets</a>
        <a href="#" data-tab="Agents" class="active">Agents</a>
        <a href="#" data-tab="Audiences">Audiences</a>
        <a href="#" data-tab="Data Sets">Data Sets</a>
      </nav>
      <div class="hdr-search open" id="hdrSearch">
        <button class="hsr-btn" id="hdrSearchBtn" type="button" aria-label="Search files">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <input type="search" id="hdrSearchInput" placeholder="Search files&hellip;" autocomplete="off" aria-label="Search files" value="range">
        <button class="hsr-clear" id="hdrSearchClear" type="button" aria-label="Close search">
          <svg viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="view-toggle" role="group" aria-label="View">
        <button class="vt-btn" data-view="gallery" aria-label="Gallery view" title="Gallery view">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="1.5" width="5.4" height="5.4" rx="1.2"/><rect x="9.1" y="1.5" width="5.4" height="5.4" rx="1.2"/><rect x="1.5" y="9.1" width="5.4" height="5.4" rx="1.2"/><rect x="9.1" y="9.1" width="5.4" height="5.4" rx="1.2"/></svg>
        </button>
        <button class="vt-btn active" data-view="list" aria-label="List view" title="List view">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="2.6" cy="3.4" r="0.9" fill="currentColor" stroke="none"/><path d="M6 3.4h8.5"/><circle cx="2.6" cy="8" r="0.9" fill="currentColor" stroke="none"/><path d="M6 8h8.5"/><circle cx="2.6" cy="12.6" r="0.9" fill="currentColor" stroke="none"/><path d="M6 12.6h8.5"/></svg>
        </button>
      </div>
    </div>
  </header>`
  }
}
