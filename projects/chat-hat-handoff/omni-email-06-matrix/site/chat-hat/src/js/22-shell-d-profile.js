(function () {
  'use strict';
  // FORCED OWNERSHIP MODE — the main IIFE's ChatHatProfile sets the
  // __chatHatProfileWired flag immediately on entry but then throws
  // silently somewhere before binding the click handler (likely a
  // stale reference to _themeIcon/_themeLabel left over from an
  // earlier refactor — function bodies don't evaluate at definition
  // time, but the silent throw seems to happen in some other spot).
  // Result: flag says "wired" but no handler exists. We bypass the
  // flag entirely and claim sole ownership of the wiring here.
  const meChip = document.querySelector('.me');
  if (!meChip) { console.warn('[chat-hat] .me chip not found, profile menu disabled'); return; }
  window.__chatHatProfileWired = true;

  try {
    const saved = localStorage.getItem('chatHatTheme');
    if (saved === 'dark' || saved === 'light') document.body.dataset.theme = saved;
  } catch (e) {}

  meChip.setAttribute('role', 'button');
  meChip.setAttribute('tabindex', '0');
  meChip.setAttribute('aria-haspopup', 'menu');
  meChip.setAttribute('aria-expanded', 'false');
  meChip.style.userSelect = 'none';

  const SUN  = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.06 1.06M4.46 11.54L3.4 12.6M12.6 12.6l-1.06-1.06M4.46 4.46L3.4 3.4"/></svg>';
  const MOON = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4 4 0 0 0 7 7z"/></svg>';
  const PAL  = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="8" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="12.5" cy="8" r="1"/><path d="M9 2a7 7 0 1 0 0 14c1.5 0 1.5-1.5.5-2-1-.5-.5-2 1-2h1.5A4 4 0 0 0 16 8 7 7 0 0 0 9 2z"/></svg>';
  const CHEV = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg>';
  const X    = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>';

  let overlay = null, menu = null, isOpen = false;

  function currentTheme() {
    return document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function build() {
    overlay = document.createElement('div');
    overlay.className = 'ch-profile-overlay';
    overlay.addEventListener('click', close);

    menu = document.createElement('div');
    menu.className = 'ch-profile-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Profile');
    menu.addEventListener('click', (e) => e.stopPropagation());

    // Stack container holds both sub-views overlapped via CSS grid
    // so they can cross-fade with directional slide on switch.
    const stack = document.createElement('div');
    stack.className = 'ch-profile-stack';

    const main = document.createElement('div');
    main.className = 'ch-profile-view ch-profile-view-main is-visible';
    main.innerHTML =
      '<div class="ch-profile-avatar" aria-hidden="true">BC</div>' +
      '<div class="ch-profile-name">Bryan Cocco</div>' +
      '<div class="ch-profile-email">bryan.cocco@omc.com</div>' +
      '<div class="ch-profile-divider" aria-hidden="true"></div>' +
      '<button class="ch-profile-row is-link" type="button" data-action="open-themes" role="menuitem">' +
        '<span class="ch-profile-row-icon">' + PAL + '</span>' +
        '<span class="ch-profile-row-label">Themes</span>' +
        '<span class="ch-profile-row-chev" aria-hidden="true">' + CHEV + '</span>' +
      '</button>' +
      '<div class="ch-profile-divider" aria-hidden="true"></div>' +
      '<button class="ch-profile-row is-logout" type="button" data-action="logout" role="menuitem">' +
        '<span>Log out</span>' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3-3-3-3M12 8H4M6 14H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2"/></svg>' +
      '</button>';

    const themes = document.createElement('div');
    themes.className = 'ch-profile-view ch-profile-view-themes';
    themes.innerHTML =
      '<div class="ch-profile-themes-head">' +
        '<span class="ch-profile-themes-title">Themes</span>' +
        '<button class="ch-profile-themes-close" type="button" data-action="close-themes" aria-label="Close">' + X + '</button>' +
      '</div>' +
      '<div class="ch-profile-divider" aria-hidden="true"></div>' +
      '<button class="ch-profile-theme-row" type="button" data-theme="dark" role="menuitem">' + MOON + '<span>Dark</span></button>' +
      '<div class="ch-profile-divider" aria-hidden="true"></div>' +
      '<button class="ch-profile-theme-row" type="button" data-theme="light" role="menuitem">' + SUN + '<span>Light</span></button>' +
      '<div class="ch-profile-divider" aria-hidden="true"></div>';

    stack.appendChild(main);
    stack.appendChild(themes);
    menu.appendChild(stack);
    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    main.querySelector('[data-action="open-themes"]').addEventListener('click', showThemes);
    main.querySelector('[data-action="logout"]').addEventListener('click', logout);
    themes.querySelector('[data-action="close-themes"]').addEventListener('click', goBackToMain);
    themes.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
    });
  }
  function position() {
    if (!menu) return;
    const r = meChip.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 8) + 'px';
    menu.style.right = Math.round(window.innerWidth - r.right) + 'px';
    menu.style.left = 'auto';
  }
  function resetToMain() {
    if (!menu) return;
    menu.classList.remove('is-themes', 'dir-forward', 'dir-back');
    menu.querySelector('.ch-profile-view-main').classList.add('is-visible');
    menu.querySelector('.ch-profile-view-themes').classList.remove('is-visible');
  }
  function showThemes() {
    if (!menu) return;
    menu.classList.add('is-themes');
    menu.classList.remove('dir-back');
    menu.classList.add('dir-forward');
    menu.querySelector('.ch-profile-view-main').classList.remove('is-visible');
    menu.querySelector('.ch-profile-view-themes').classList.add('is-visible');
    syncActive();
    const first = menu.querySelector('.ch-profile-theme-row');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 360);
  }
  function goBackToMain() {
    if (!menu) return;
    menu.classList.remove('is-themes', 'dir-forward');
    menu.classList.add('dir-back');
    menu.querySelector('.ch-profile-view-themes').classList.remove('is-visible');
    menu.querySelector('.ch-profile-view-main').classList.add('is-visible');
    const themesRow = menu.querySelector('[data-action="open-themes"]');
    if (themesRow) setTimeout(() => themesRow.focus({ preventScroll: true }), 360);
  }
  function syncActive() {
    if (!menu) return;
    const c = currentTheme();
    menu.querySelectorAll('.ch-profile-theme-row').forEach(row => {
      row.classList.toggle('is-active', row.getAttribute('data-theme') === c);
    });
  }
  function applyTheme(t) {
    if (t !== 'dark' && t !== 'light') return;
    if (currentTheme() === t) return;

    const commit = () => {
      document.body.dataset.theme = t;
      try { localStorage.setItem('chatHatTheme', t); } catch (e) {}
      syncActive();
    };

    // Prefer the View Transitions API — it captures the page as a
    // snapshot, applies the change, then cross-fades into the new
    // state with hardware-accelerated paint. Atmospheric, premium.
    if (typeof document.startViewTransition === 'function' &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(commit);
      return;
    }

    // Fallback for browsers without View Transitions — temporarily
    // enable a global color/bg/border transition class so the swap
    // cross-fades smoothly via CSS instead of snapping.
    document.body.classList.add('ch-theme-transitioning');
    commit();
    setTimeout(() => document.body.classList.remove('ch-theme-transitioning'), 450);
  }
  function logout() {
    const stream = document.getElementById('chatStream');
    if (stream) {
      const m = document.createElement('div');
      m.className = 'msg bot';
      m.innerHTML =
        '<div class="msg-head"><div class="msg-avatar av-corv">⌬</div>' +
          '<div class="msg-meta"><span class="msg-name">Acme</span><span class="msg-dot"></span><span class="msg-time">Now</span></div></div>' +
        '<div class="body">(Log-out is a no-op in this prototype.)</div>';
      stream.appendChild(m);
      stream.scrollTop = stream.scrollHeight;
    }
    close();
  }
  function open() {
    if (isOpen) return;
    if (!menu) build(); else { resetToMain(); syncActive(); document.body.appendChild(overlay); }
    position();
    isOpen = true;
    meChip.setAttribute('aria-expanded', 'true');
    const first = menu.querySelector('.ch-profile-view.is-visible button');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    meChip.setAttribute('aria-expanded', 'false');
    if (!menu || !overlay || !overlay.parentNode) return;
    // Animated close — keep DOM mounted, fade/scale out, then detach.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      overlay.parentNode.removeChild(overlay);
      return;
    }
    menu.classList.add('is-closing');
    setTimeout(() => {
      menu.classList.remove('is-closing');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 240);
  }

  meChip.addEventListener('click', (e) => {
    console.log('[chat-hat] meChip click fired', { isOpen });
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isOpen) close(); else open();
      console.log('[chat-hat] after open/close, isOpen:', isOpen, 'overlay in DOM:', !!(overlay && overlay.parentNode), 'menu rect:', menu && menu.getBoundingClientRect());
    } catch (err) {
      console.error('[chat-hat] open/close threw:', err);
      alert('open() threw: ' + err.message);
    }
  });
  meChip.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) close(); else open();
    }
  });
  // Belt-and-suspender: document-level delegation in CAPTURE phase so we
  // beat any other handler that might be stopping propagation on .me.
  document.addEventListener('click', (e) => {
    const hit = e.target && e.target.closest && e.target.closest('.topnav .me');
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) close(); else open();
  }, true);
  meChip.dataset.chatHatWired = 'true';
  console.log('[chat-hat] BC profile bootstrap attached at', new Date().toISOString());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });
  window.addEventListener('resize', () => { if (isOpen) position(); });
  window.addEventListener('scroll', () => { if (isOpen) position(); }, true);
})();
