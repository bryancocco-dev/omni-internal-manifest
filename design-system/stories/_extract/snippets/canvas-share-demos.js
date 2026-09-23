// AUTO-EXTRACTED verbatim markup from canvas-share-demos/demos/corvash-strategist/
// (rendered DOM — this project's markup is JS-generated, not static in index.html).
// Do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  header: {
    note: '.doc-header — sticky viewer header for a published read-only canvas: co-brand lockup, doc title, Read-only status, Download + Share actions',
    minHeight: 72,
    pad: '0',
    html: `<div class="doc-header">
    <div class="doc-header__inner">
      <span class="doc-header__brand">
        <img class="doc-header__logo is-theme-trigger" src="omni-logo.svg" alt="OMNI+" role="button" tabindex="0" title="Themes">
        <span class="doc-header__cobrand-slot"><span class="doc-cobrand is-in">
      <span class="doc-cobrand__x" aria-hidden="true">×</span>
      <span class="doc-cobrand__mark" style="--m:url('corvache.svg')"></span>
      <span class="doc-cobrand__name">Corvache</span></span></span>
        <span class="doc-header__divider"></span>
        <span class="doc-header__context">
          <span class="doc-header__title">Progress 2026</span>
          <span class="doc-header__status">Read-only</span>
        </span>
      </span>
      <span class="doc-header__actions">
        <button class="doc-header__download" type="button" title="Download full report">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"></path></svg>
          Download
        </button>
        <button class="doc-header__btn" type="button">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"></circle><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"></circle><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"></circle></svg>
        </button>
      </span>
    </div></div>`
  },

  gate: {
    note: '.doc-gate — email-only access gate for a shared read-only canvas ("this link is your key," no password)',
    minHeight: 560,
    pad: '0',
    html: `<div class="doc-gate">
    <div class="doc-gate__card">
      <img class="doc-gate__logo" src="omni-logo.svg" alt="OMNI+">
      <p class="doc-gate__lede"><strong>Bryan Cocco</strong> has shared a document with you</p>
      <div class="doc-gate__file">
        <span class="doc-gate__file-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"></rect><path d="M3.5 9h17M9 9v11.5"></path></svg></span>
        <span class="doc-gate__file-meta">
          <span class="doc-gate__file-title">Progress 2026</span>
          <span class="doc-gate__file-sub">Shared canvas · Read-only</span>
        </span>
      </div>
      <form class="doc-gate__form" novalidate="">
        <input class="doc-gate__input" type="email" autocomplete="email" placeholder="Enter your email" aria-label="Your email">
        <button class="doc-gate__btn" type="submit">Continue</button>
      </form>
      <p class="doc-gate__foot">No password needed — this link is your key.</p>
      <div class="doc-gate__progress" aria-hidden="true"></div>
    </div></div>`
  },

  commentpin: {
    note: '.doc-comment-pin + .doc-comment-popover — per-section comment affordance on a read-only canvas, open with a reply thread + composer (viewers can discuss without editing)',
    minHeight: 420,
    pad: '28px',
    html: `<div style="position:relative;min-height:380px">
    <button type="button" class="doc-comment-pin has-count is-open" aria-label="Leave a comment on this section"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg><span class="doc-comment-pin__count">3</span></button>
    <div class="doc-comment-popover is-open"><div class="doc-comment-list"><div class="doc-comment-thread">
    <div class="doc-comment">
      <div class="doc-comment__avatar">JH</div>
      <div class="doc-comment__body">
        <div class="doc-comment__meta"><strong>Jessie Harte</strong><span>Jul 12</span></div>
        <p>Is the Q4 jump partly seasonal? We always get a year-end bump — the show calendar plus December delivery timing — and I don't want to over-read a spike that comes back every winter.</p>
      </div>
    </div><div class="doc-comment-thread__replies">
    <div class="doc-comment doc-comment--reply">
      <div class="doc-comment__avatar">NF</div>
      <div class="doc-comment__body">
        <div class="doc-comment__meta"><strong>Noah Fielding</strong><span>Jul 12</span></div>
        <p>Good instinct. It's partly seasonal, but Q4 2025 is up ~28% over Q4 2024 on the same seasonal baseline, so there's real underlying growth on top of the year-end effect. I can add the year-over-year overlay if that's useful.</p>
      </div>
    </div>
    <div class="doc-comment doc-comment--reply">
      <div class="doc-comment__avatar">JH</div>
      <div class="doc-comment__body">
        <div class="doc-comment__meta"><strong>Jessie Harte</strong><span>Jul 12</span></div>
        <p>Yes please — the YoY overlay is exactly what'll keep me honest when I present it.</p>
      </div>
    </div></div></div></div><div class="composer">
    <div class="composer__input" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Add a comment…"></div>
    <div class="composer__attachments"></div>
    <div class="composer__bar">
      <div class="composer__tools">
        <button class="composer__tool" type="button" data-act="emoji" aria-label="Emoji"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"></circle><circle cx="9" cy="10" r="1" fill="currentColor"></circle><circle cx="15" cy="10" r="1" fill="currentColor"></circle><path d="M8.5 14.5a4 4 0 0 0 7 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button>
        <button class="composer__tool" type="button" data-act="mention" aria-label="Mention someone"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.6"></circle><path d="M15.4 9v4a2 2 0 0 0 4 0v-1a7.5 7.5 0 1 0-3 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button>
        <button class="composer__tool" type="button" data-act="image" aria-label="Add image"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"></rect><circle cx="9" cy="9.5" r="1.6" stroke="currentColor" stroke-width="1.4"></circle><path d="M4 16.5 9 12l4 3.5L16 13l4 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
      </div>
      <button class="composer__send" type="button" aria-label="Send"><svg viewBox="0 0 24 24" fill="none"><path d="M12 19V6M6 11l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
    </div>
    <input type="file" accept="image/*" class="composer__file" hidden=""></div></div>
  </div>`
  },

  commentspanel: {
    note: '.comments-panel — aggregated right-side comments sidebar for a read-only canvas (search, sort, foldable reply threads, deep-links to each section)',
    minHeight: 560,
    pad: '0',
    html: `<aside class="comments-panel is-open" aria-label="Comments" style="position:relative;height:560px">
    <header class="comments-panel__head">
      <div class="comments-panel__title-row">
        <span class="comments-panel__title-group">
          <span class="comments-panel__title">Comments</span>
          <span class="comments-panel__count">5</span>
        </span>
        <button class="comments-panel__collapse" type="button" aria-label="Hide comments" title="Hide comments (⇧C)"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
      </div>
      <div class="comments-panel__controls">
        <label class="comments-panel__search">
          <span class="comments-panel__search-ico"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"></circle><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></span>
          <input type="search" placeholder="Search" aria-label="Search comments">
        </label>
        <button class="comments-panel__tool comments-panel__sort" type="button" aria-label="Sort and filter"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h9M17.5 7H20"></path><circle cx="15" cy="7" r="2.3"></circle><path d="M4 17h9M17.5 17H20"></path><circle cx="15" cy="17" r="2.3"></circle><path d="M4 12h3M11 12h9"></path><circle cx="9" cy="12" r="2.3"></circle></svg></button>
      </div>
    </header>
    <div class="comments-panel__body">
    <div class="comments-panel__item comments-thread is-unread"><div class="comments-panel__msg comments-panel__msg--root">
      <span class="comments-panel__avatar" style="--avatar: #8b5cf6">DR</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Devon Reyes</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Finding #4 is the one that stings — we've been underfunding email for years and it's quietly outperforming everything. Can we make this louder?</p>
      </div></div><button type="button" class="comments-thread__toggle"><span class="comments-thread__toggle-ico"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>Hide replies</button><div class="comments-thread__replies"><div class="comments-panel__msg comments-panel__msg--reply">
      <span class="comments-panel__avatar" style="--avatar: #0e8f9a">PA</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Priya Anand</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Strong agree. Email is the least glamorous line item and the highest ROI. If we're reallocating budget for 2026, this is where I'd start.</p>
      </div></div><div class="comments-panel__msg comments-panel__msg--reply">
      <span class="comments-panel__avatar" style="--avatar: #c2506e">ML</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Mara Lindqvist</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Noted — we'll pull email forward in the recommendation and put a real number against it instead of leaving it as a footnote.</p>
      </div></div></div><div class="comments-thread__foot"><button type="button" class="comments-thread__reply-trigger"><span class="comments-thread__reply-ico"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M7 3.5 3 7l4 3.5M3.5 7H9a3.5 3.5 0 0 1 3.5 3.5V12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>Reply</button></div></div>
    <div class="comments-panel__item comments-thread is-unread"><div class="comments-panel__msg comments-panel__msg--root">
      <span class="comments-panel__avatar" style="--avatar: #c2506e">JH</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Jessie Harte</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Is the Q4 jump partly seasonal? We always get a year-end bump — the show calendar plus December delivery timing — and I don't want to over-read a spike that comes back every winter.</p>
      </div></div><button type="button" class="comments-thread__toggle"><span class="comments-thread__toggle-ico"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>Hide replies</button><div class="comments-thread__replies"><div class="comments-panel__msg comments-panel__msg--reply">
      <span class="comments-panel__avatar" style="--avatar: #6069f5">NF</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Noah Fielding</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Good instinct. It's partly seasonal, but Q4 2025 is up ~28% over Q4 2024 on the same seasonal baseline, so there's real underlying growth on top of the year-end effect. I can add the year-over-year overlay if that's useful.</p>
      </div></div><div class="comments-panel__msg comments-panel__msg--reply">
      <span class="comments-panel__avatar" style="--avatar: #c2506e">JH</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">Jessie Harte</span>
          <span class="comments-panel__time">Jul 12</span>
        </div>
        <p class="comments-panel__text">Yes please — the YoY overlay is exactly what'll keep me honest when I present it.</p>
      </div></div></div><div class="comments-thread__foot"><button type="button" class="comments-thread__reply-trigger"><span class="comments-thread__reply-ico"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M7 3.5 3 7l4 3.5M3.5 7H9a3.5 3.5 0 0 1 3.5 3.5V12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>Reply</button></div></div>
    </div></aside>`
  },

  sharemodal: {
    note: '.share-modal — "Share this file" flyout for a published canvas: invite by name/email + role, collaborator avatar summary',
    minHeight: 540,
    pad: '0',
    html: `<div class="share-overlay is-open" style="position:relative;min-height:540px">
    <div class="share-modal" role="dialog" aria-modal="true" aria-label="Share this file">
    <section class="share-view share-view--invite is-active">
      <header class="share-head">
        <h2 class="share-title">Share this file</h2>
        <button class="share-icon-btn share-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg></button>
      </header>
      <div class="share-body">
        <div class="share-invite">
          <div class="share-invite__main">
            <div class="share-field">
              <input class="share-field__input" type="text" autocomplete="off" placeholder="Name, email or username" aria-label="Invite by name, email or username">
              <button class="share-role" type="button" aria-label="Choose permission" data-menu-id="invite-role"><span class="share-role__label">Can edit</span><span class="share-role__caret"><svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button>
            </div>
            <div class="share-results" role="listbox" hidden=""></div>
          </div>
          <button class="share-btn-invite" type="button">Invite <span class="share-btn-invite__ico"><svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.3" stroke="currentColor" stroke-width="1.6"></circle><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M19 8v5M21.5 10.5h-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></span></button>
        </div>
        <div class="share-toast" hidden=""></div>
        <button class="share-summary" type="button" aria-label="View collaborators">
          <span class="share-summary__lead"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"></circle><circle cx="12" cy="10" r="2.8" stroke="currentColor" stroke-width="1.5"></circle><path d="M6.8 18.2a5.5 5.5 0 0 1 10.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></span>
          <span class="share-summary__avatars"><span class="share-avatar share-avatar--sm share-avatar--ring" style="--av:#6069f5">BC</span><span class="share-avatar share-avatar--sm share-avatar--ring" style="--av:#c2506e">ML</span><span class="share-avatar share-avatar--sm share-avatar--ring" style="--av:#8b5cf6">DR</span><span class="share-avatar share-avatar--sm share-avatar--ring" style="--av:#0e8f9a">PA</span></span>
          <span class="share-summary__count">7 people with access</span>
          <span class="share-summary__chev"><svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
        </button>
      </div>
    </section>
    <section class="share-view share-view--collab">
      <header class="share-head">
        <button class="share-icon-btn share-back" type="button" aria-label="Back"><svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
        <h2 class="share-title share-title--collab"></h2>
        <button class="share-icon-btn share-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg></button>
      </header>
      <div class="share-body">
        <p class="share-collab__label">Current collaborators</p>
        <ul class="share-collab__list"></ul>
      </div>
    </section></div></div>`
  }
};
