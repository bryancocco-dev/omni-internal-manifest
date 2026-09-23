// AUTO-EXTRACTED verbatim markup from copy-request-access/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_share: {
    note: '.qa-share-modal — Share flyout (people typeahead, invite-role bar, People-with-access list, General access, footer actions)',
    minHeight: 620,
    html: `<div class="qa-share-scrim open" style="position:static;opacity:1;pointer-events:auto;background:transparent;padding:24px;display:flex;justify-content:center;">
  <div class="qa-share-modal" role="dialog" aria-modal="true">
    <h3>Share "Outcomes Forecast"</h3>
    <div class="qa-share-people-wrap">
      <div class="qa-share-field" data-share-field>
        <input class="qa-share-people" type="text" placeholder="Add people, groups, or agents" autocomplete="off">
      </div>
      <div class="qa-share-suggest" role="listbox" aria-hidden="true"></div>
    </div>
    <div class="qa-share-invite-bar" data-invite-bar hidden>
      <span>Invite as</span>
      <div class="qa-share-role-wrap">
        <button class="qa-share-role-btn" type="button" data-role-btn aria-haspopup="menu"><span data-role-label>Viewer</span><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></button>
        <div class="qa-share-role-menu" role="menu" aria-hidden="true">
          <button role="menuitem" class="scope-table-menu-item" data-role="Viewer"><span>Viewer</span></button>
          <button role="menuitem" class="scope-table-menu-item" data-role="Commenter"><span>Commenter</span></button>
          <button role="menuitem" class="scope-table-menu-item" data-role="Editor"><span>Editor</span></button>
        </div>
      </div>
      <span data-invite-count style="margin-left:auto;"></span>
    </div>
    <div class="qa-share-label">People with access</div>
    <div class="qa-share-list">
      <div class="qa-share-row qa-share-row-owner">
        <span class="qa-share-avatar">BC</span>
        <span><span class="qa-share-row-name">Bryan Cocco (you)</span><span class="qa-share-row-mail">bryanc.cocco@omc.com</span></span>
        <span class="qa-share-row-role">Owner</span>
      </div>
      <div data-share-invited>
        <div class="qa-share-row">
          <span class="qa-share-avatar" style="background:#92400e;">SB</span>
          <span><span class="qa-share-row-name">Sofia Brandt</span><span class="qa-share-row-mail">sofiab.brandt@omc.com</span></span>
          <span class="qa-share-row-role">Editor</span>
          <button class="qa-share-row-remove" type="button" aria-label="Remove Sofia Brandt" data-remove="0">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div class="qa-share-row">
          <span class="qa-share-avatar" style="background:#a21caf;">KS</span>
          <span><span class="qa-share-row-name">Kenji Sato</span><span class="qa-share-row-mail">kenjis.sato@omc.com</span></span>
          <span class="qa-share-row-role">Editor</span>
          <button class="qa-share-row-remove" type="button" aria-label="Remove Kenji Sato" data-remove="1">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div class="qa-share-row">
          <span class="qa-share-avatar" style="background:#1858ee;">AK</span>
          <span><span class="qa-share-row-name">Alex Khang</span><span class="qa-share-row-mail">alexk.khang@omc.com</span></span>
          <span class="qa-share-row-role">Commenter</span>
          <button class="qa-share-row-remove" type="button" aria-label="Remove Alex Khang" data-remove="2">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div class="qa-share-row">
          <span class="qa-share-avatar" style="background:#7c3aed;">LF</span>
          <span><span class="qa-share-row-name">Luca Ferrante</span><span class="qa-share-row-mail">lucaf.ferrante@omc.com</span></span>
          <span class="qa-share-row-role">Viewer</span>
          <button class="qa-share-row-remove" type="button" aria-label="Remove Luca Ferrante" data-remove="3">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="qa-share-label">General access</div>
    <div class="qa-share-access-wrap">
      <div class="qa-share-access" role="button" tabindex="0" aria-haspopup="menu">
        <span class="qa-share-access-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg></span>
        <span><span class="qa-share-access-name"><span data-access-name>Restricted</span><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></span>
        <span class="qa-share-access-sub" data-access-sub>Only people with access can open with the link</span></span>
      </div>
    </div>
    <div class="qa-share-footer">
      <button class="qa-share-btn qa-share-btn-secondary" data-share-copy><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6.8 9.2a2.8 2.8 0 0 0 4 0l1.9-1.9a2.83 2.83 0 1 0-4-4l-.95.95"/><path d="M9.2 6.8a2.8 2.8 0 0 0-4 0L3.3 8.7a2.83 2.83 0 1 0 4 4l.95-.95"/></svg><span>Copy link</span></button>
      <button class="qa-share-btn qa-share-btn-primary" data-share-done>Done</button>
    </div>
  </div>
</div>`
  },

  modal_gate_need: {
    note: '.qa-gate-card (need) — full-viewport "You Need Access" gate, recipient side of a ?shared= link (optional message + signed-in-as row)',
    minHeight: 560,
    html: `<div class="qa-gate" style="position:static;background:transparent;padding:24px;">
  <div class="qa-gate-card">
    <img class="qa-gate-logo" src="/_assets/copy-request-access/omni-logo.png" alt="OMNI">
    <div class="qa-gate-art error">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="10.5" width="14" height="9.5" rx="2"/>
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>
        <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none"/>
      </svg>
    </div>
    <h1>You Need Access</h1>
    <div class="qa-gate-file">
      <span class="qa-gate-file-icon">
        <svg width="13" height="13" viewBox="0 0 11.6668 11.665" fill="none"><path d="M6.64962 0.0543193C5.68778 -0.0773318 4.70831 0.0312136 3.79864 0.370267C2.88897 0.70932 2.0774 1.26833 1.43637 1.9974C0.887745 2.62926 0.480685 3.3712 0.242533 4.17339C0.0043799 4.97559 -0.0593513 5.81946 0.0556197 6.64832C0.364786 8.91982 2.07279 10.8524 4.3052 11.4585C4.80286 11.5947 5.31641 11.6641 5.83237 11.665L5.9152 11.6644C6.2101 11.6606 6.49927 11.5824 6.75585 11.4369C7.01243 11.2915 7.22811 11.0836 7.38287 10.8326C7.53815 10.5829 7.62776 10.298 7.64336 10.0043C7.65897 9.7107 7.60006 9.4179 7.47212 9.15315L7.35604 8.91049C7.26675 8.73604 7.22483 8.54122 7.23445 8.34549C7.24407 8.14977 7.3049 7.96 7.41087 7.79515C7.56249 7.54886 7.80002 7.36752 8.07757 7.28617C8.35511 7.20483 8.65296 7.22926 8.91354 7.35474L9.15387 7.46965C9.3942 7.58515 9.6497 7.64407 9.91279 7.64407C10.3732 7.64171 10.8144 7.45931 11.1421 7.13588C11.4698 6.81245 11.6579 6.37366 11.6663 5.91332C11.6735 5.36965 11.6042 4.82767 11.4604 4.30332C10.8537 2.07149 8.92112 0.363486 6.64962 0.0543193ZM9.65845 6.4179L9.41812 6.30299C8.35179 5.79082 7.04395 6.18749 6.4227 7.17449C5.9922 7.86049 5.94845 8.67715 6.3037 9.41565L6.41979 9.65832C6.4633 9.74647 6.48341 9.84433 6.4782 9.9425C6.47299 10.0407 6.44263 10.1358 6.39004 10.2189C6.33878 10.3037 6.26658 10.374 6.18037 10.4229C6.09416 10.4719 5.99683 10.4978 5.8977 10.4983H5.83237C5.41953 10.4972 5.00863 10.4417 4.61029 10.3332C2.82354 9.84848 1.45854 8.30382 1.21179 6.4914C1.02454 5.11765 1.41712 3.79465 2.31604 2.76449C2.82747 2.17779 3.47748 1.72828 4.20695 1.45687C4.93641 1.18546 5.72216 1.10077 6.4927 1.21049C8.30512 1.45724 9.84979 2.82282 10.3345 4.60899C10.45 5.03482 10.5055 5.46882 10.499 5.8964C10.492 6.36715 10.0061 6.58649 9.65845 6.4179Z" fill="currentColor"/><circle cx="3.20794" cy="7.28996" r="0.875" fill="currentColor"/><circle cx="3.20794" cy="4.95662" r="0.875" fill="currentColor"/><circle cx="4.95794" cy="3.20662" r="0.875" fill="currentColor"/><circle cx="7.29127" cy="3.20662" r="0.875" fill="currentColor"/></svg>
      </span>
      <span class="qa-gate-file-meta">
        <span class="qa-gate-file-title">Outcomes Forecast</span>
        <span class="qa-gate-file-canvas">Meridian Transatlantic Launch</span>
      </span>
    </div>
    <p>This file is restricted. Request access from the owner, or switch to an account that can open it.</p>
    <textarea class="qa-gate-msg" placeholder="Message (optional)"></textarea>
    <button class="qa-gate-btn" data-gate-request>Request access</button>
    <div class="qa-gate-account">
      <span class="qa-gate-avatar" style="background:#be123c;">TR</span>
      <span>Signed in as <b>tomasr.reyes@omc.com</b></span>
      <a data-gate-switch>Switch account</a>
    </div>
  </div>
</div>`
  },

  modal_gate_sent: {
    note: '.qa-gate-card (sent) — "Request sent" waiting state with pulsing status dot, between request and auto-approve',
    minHeight: 340,
    html: `<div class="qa-gate" style="position:static;background:transparent;padding:24px;">
  <div class="qa-gate-card">
    <img class="qa-gate-logo" src="/_assets/copy-request-access/omni-logo.png" alt="OMNI">
    <div class="qa-gate-art">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z"/></svg>
    </div>
    <h1>Request sent</h1>
    <p>The owner of "<b>Outcomes Forecast</b>" has been notified. You'll be able to open it as soon as they approve.</p>
    <div class="qa-gate-wait"><span class="qa-gate-dot"></span>Waiting for approval…</div>
  </div>
</div>`
  },

  modal_gate_granted: {
    note: '.qa-gate-card (granted) — auto-approve confirmation the gate advances to after the simulated wait; owner-approved row + Open canvas CTA',
    minHeight: 440,
    html: `<div class="qa-gate" style="position:static;background:transparent;padding:24px;">
  <div class="qa-gate-card">
    <img class="qa-gate-logo" src="/_assets/copy-request-access/omni-logo.png" alt="OMNI">
    <div class="qa-gate-art granted">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>
    </div>
    <h1>Access granted</h1>
    <div class="qa-gate-owner-row">
      <span class="qa-gate-owner-avatar">BC</span>
      <span><b>Bryan Cocco</b> approved your request</span>
    </div>
    <p>"<b>Outcomes Forecast</b>" is now shared with you as a viewer.</p>
    <button class="qa-gate-btn" data-gate-open>Open canvas</button>
  </div>
</div>`
  },

  banner_approved: {
    note: '.qa-announce — top announcement bar the owner sees on reload after approving; affirmative green, auto-dismiss + deep link',
    minHeight: 76,
    pad: '0',
    html: `<div class="qa-announce show" role="status" style="position:static;transform:none;">
  <span class="qa-announce-check">
    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5L13 5"/></svg>
  </span>
  <span><b>Bryan Cocco</b> approved your access to "<b>Outcomes Forecast</b>" on <b>Meridian Transatlantic Launch</b></span>
  <a data-announce-open>Open file</a>
  <button class="qa-announce-close" type="button" aria-label="Dismiss">
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
  </button>
</div>`
  }
};
