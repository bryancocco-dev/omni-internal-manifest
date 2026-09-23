  /* Chat-window glow — fires when the user picks a different model.
     Lazily mounts a single overlay node (.chat-energy-ring carries
     the accent-color inset glow keyframe), then re-triggers the
     keyframe by toggling .model-switching off-then-on across a
     forced reflow. */
  function triggerChatEnergyBurst() {
    const chat = document.querySelector('.chat');
    if (!chat) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!chat.querySelector('.chat-energy-ring')) {
      const ring = document.createElement('div');
      ring.className = 'chat-energy-ring';
      chat.prepend(ring);
    }
    chat.classList.remove('model-switching');
    void chat.offsetWidth;
    chat.classList.add('model-switching');
    clearTimeout(triggerChatEnergyBurst._t);
    triggerChatEnergyBurst._t = setTimeout(() => {
      chat.classList.remove('model-switching');
    }, 1500);
  }

  // --- Workspace dropdown ---
  const workspaceBtn = document.getElementById('workspaceBtn');
  const workspaceMenu = document.getElementById('workspaceMenu');
  if (workspaceBtn && workspaceMenu) {
    const closeWorkspaceMenu = () => {
      workspaceMenu.classList.remove('open');
      workspaceBtn.setAttribute('aria-expanded', 'false');
      workspaceMenu.setAttribute('aria-hidden', 'true');
    };
    workspaceBtn.addEventListener('click', (e) => {
      // Item clicks bubble through; close menu instead of toggling
      if (e.target.closest('.workspace-menu-item')) {
        const items = workspaceMenu.querySelectorAll('.workspace-menu-item');
        items.forEach(i => i.classList.remove('active'));
        e.target.closest('.workspace-menu-item').classList.add('active');
        closeWorkspaceMenu();
        return;
      }
      e.stopPropagation();
      const isOpen = workspaceMenu.classList.toggle('open');
      workspaceBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      workspaceMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
    workspaceBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        workspaceBtn.click();
      } else if (e.key === 'Escape' && workspaceMenu.classList.contains('open')) {
        closeWorkspaceMenu();
      }
    });
    document.addEventListener('click', (e) => {
      if (!workspaceMenu.classList.contains('open')) return;
      if (workspaceBtn.contains(e.target)) return;
      closeWorkspaceMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && workspaceMenu.classList.contains('open')) {
        closeWorkspaceMenu();
      }
    });
  }

  // --- Panel switcher (tablet/mobile): chat / canvas / nav (mobile only) ---
  const panelSwitch = document.getElementById('panelSwitch');
  function syncPills() {
    if (!panelSwitch) return;
    const isPanelOpen = mainEl.classList.contains('panel-open');
    const isShowingChat = mainEl.classList.contains('show-chat');
    const activePanel = isPanelOpen ? 'nav' : (isShowingChat ? 'chat' : 'canvas');
    panelSwitch.querySelectorAll('.psw').forEach(b => {
      const isActive = b.dataset.panel === activePanel;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
  if (panelSwitch) {
    panelSwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('.psw');
      if (!btn) return;
      const panel = btn.dataset.panel;
      if (panel === 'nav') {
        // Open the rail-panel drawer; leave chat/canvas state intact
        mainEl.classList.add('panel-open');
      } else {
        // Close drawer if open, then slide chat or canvas into view
        mainEl.classList.remove('panel-open');
        mainEl.classList.toggle('show-chat', panel === 'chat');
      }
      syncPills();
      const navMenuBtn = document.getElementById('navMenuBtn');
      if (navMenuBtn) {
        navMenuBtn.setAttribute('aria-expanded', mainEl.classList.contains('panel-open') ? 'true' : 'false');
      }
    });
  }

  // Clear any inline grid-template-columns the desktop splitter may have set
  // when shrinking below the tablet breakpoint, so the media query takes over.
  const tabletMQ = window.matchMedia('(max-width: 1100px)');
  const handleTabletChange = (mq) => {
    if (mq.matches) {
      mainEl.style.gridTemplateColumns = '';
    }
  };
  tabletMQ.addEventListener('change', handleTabletChange);
  handleTabletChange(tabletMQ);

  // Smooth breakpoint transitions: during an active window resize, add
  // body.resizing so the responsive CSS rule animates size/spacing changes.
  // Class clears ~480ms after the last resize event so hover-driven transitions
  // remain unaffected the rest of the time.
  let resizeTimer;
  window.addEventListener('resize', () => {
    document.body.classList.add('resizing');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('resizing');
    }, 480);
  });

  // --- splitter: chat width is fixed by the user, canvas takes remaining ---
  const main = document.getElementById('main');
  const splitter = document.getElementById('splitter');
  const railW = 80;

  function setChatWidth(px) {
    const min = 560, max = Math.max(min, window.innerWidth - railW - 240 - 6);
    const w = Math.min(max, Math.max(min, px));
    main.style.gridTemplateColumns = `${railW}px ${w}px 6px 1fr`;
  }

  let dragging = false;
  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    setChatWidth(e.clientX - railW);
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // --- Resizable canvas right-side: drag either left or right edge.
  // Resizers exist inside both .brief-stack (canvas_1) and .table-view (canvas_2);
  // each container keeps its own --stack-w so the widths are independent —
  // resizing one doesn't change the other, and toggling between tabs preserves
  // the width each was set to. ---
  const stackEl = document.querySelector('.brief-stack');
  const tableViewEl = document.getElementById('tableView');
  const personaViewEl = document.getElementById('personaView');
  const stackResizers = document.querySelectorAll('.stack-resizer');
  const minStackW = 960;
  let stackDragging = null;   // 'left' | 'right' | null
  let stackStartX = 0, stackStartW = minStackW;
  let dragSourceEl = null;    // the container whose edge was grabbed
  function setStackWidth(px, target) {
    if (target) target.style.setProperty('--stack-w', `${px}px`);
  }
  stackResizers.forEach(r => {
    r.addEventListener('mousedown', (e) => {
      stackDragging = r.dataset.side === 'left' ? 'left' : 'right';
      stackStartX = e.clientX;
      dragSourceEl = r.closest('.brief-stack, .table-view, .persona-view') || stackEl;
      stackStartW = dragSourceEl.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
  });
  function maxStackWidth() {
    const canvasEl = document.getElementById('canvas');
    const canvasBox = canvasEl.getBoundingClientRect();
    const buffer = 32;
    return Math.max(minStackW, canvasBox.width - buffer * 2);
  }

  /* Default the right-side stack to min width on desktop load — both
     canvas_1 (.brief-stack) and canvas_2 (.table-view) start at the
     tightest allowed width. The user can still drag wider via the edge
     resizers. Only applies above the panel-switch breakpoint (1100px)
     since narrower viewports collapse the canvas anyway. */
  if (window.innerWidth > 1100) {
    if (stackEl) stackEl.style.setProperty('--stack-w', `${minStackW}px`);
    if (tableViewEl) tableViewEl.style.setProperty('--stack-w', `${minStackW}px`);
    if (personaViewEl) personaViewEl.style.setProperty('--stack-w', `${minStackW}px`);
    // Also pin the persona skeleton loader to the same width — its
    // CSS reads var(--stack-w) the same way persona-view does, but
    // since the skeleton is a sibling of persona-view (not a child),
    // it doesn't inherit the inline value. Setting it directly keeps
    // the skeleton outer = persona-view outer at desktop widths.
    const chSkelEl = document.getElementById('chPersonaSkeleton');
    if (chSkelEl) chSkelEl.style.setProperty('--stack-w', `${minStackW}px`);
  }

  window.addEventListener('mousemove', (e) => {
    if (!stackDragging) return;
    const dx = e.clientX - stackStartX;
    // stack is centered, so widening is symmetric — multiply by 2 so the dragged edge tracks the cursor
    const sign = stackDragging === 'right' ? 1 : -1;
    const max = maxStackWidth();
    const newW = Math.max(minStackW, Math.min(max, stackStartW + sign * dx * 2));
    setStackWidth(newW, dragSourceEl);
  });
  window.addEventListener('mouseup', () => {
    if (!stackDragging) return;
    stackDragging = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // --- canvas_3 persona selector: click a persona tab to swap the
  // active persona-hero spread and mark the tab active.
  const personaSelectorBtns = document.querySelectorAll('.persona-selector .psl-tab');
  const personaHeroes = document.querySelectorAll('.persona-page .persona-hero');
  const personaSelectorPageEl = document.querySelector('.persona-page');
  // Persona-tab click routes through a single handler that honors the
  // current view mode (single = activate one, compare = toggle a chip).
  const personaSelectorElx = document.getElementById('personaSelector');
  let personaViewMode = 'single';                 // derived from set size — 'single' | 'compare'
  let personaCompareSet = new Set(['casual']);    // checked personas. Always >= 1
  const COMPARE_MIN = 1;
  const COMPARE_MAX = 5;

  function activatePersona(key) {
    personaSelectorBtns.forEach(b => b.classList.toggle('active', b.dataset.persona === key));
    if (personaSelectorPageEl && key) personaSelectorPageEl.dataset.persona = key;
    personaHeroes.forEach(h => h.classList.toggle('is-active', h.dataset.personaHero === key));
    applyPersonaContent(key, true);
    const activeHero = document.querySelector('.persona-hero.is-active');
    if (activeHero) animatePersonaCoords(activeHero);
    armPersonaReveal();
  }

  // Scroll-reveal — sections inside the persona-page get a base
  // .persona-revealable class, then IntersectionObserver flips them to
  // .is-revealed when they cross the viewport threshold. Re-armed on
  // persona switch, mode swap, and initial paint.
  const personaRevealSelectors = [
    '.persona-page > .persona-demos',
    '.persona-page > .persona-pullquote',
    '.persona-page > .persona-section',
    '.persona-page > .persona-imagepair',
    '.persona-page > .persona-twoup',
    '.persona-page > .persona-footer',
    '.persona-page .persona-compare-cols .persona-column .persona-demos',
    '.persona-page .persona-compare-cols .persona-column .persona-pullquote',
    '.persona-page .persona-compare-cols .persona-column .persona-section',
    '.persona-page .persona-compare-cols .persona-column .persona-twoup',
    '.persona-page .persona-compare-cols .persona-column .persona-footer',
  ];
  const personaRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        personaRevealObserver.unobserve(entry.target);
      }
    });
  }, {
    root: document.getElementById('canvas'),
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05,
  });
  function armPersonaReveal() {
    if (!personaSelectorPageEl) return;
    // Collect the sections we want to animate — both the single-view
    // direct children and the per-persona cloned sections inside any
    // active compare columns.
    const targetSelector =
      '.persona-demos, .persona-pullquote, .persona-section, .persona-imagepair, .persona-twoup, .persona-footer';
    const targets = [...personaSelectorPageEl.querySelectorAll(targetSelector)];
    targets.forEach(el => {
      personaRevealObserver.unobserve(el);
      el.classList.add('persona-revealable');
      el.classList.remove('is-revealed');
    });
    // Force a reflow so the reset is committed, then observe immediately.
    void personaSelectorPageEl.offsetHeight;
    targets.forEach(el => personaRevealObserver.observe(el));
  }

  // Coordinate odometer — the lat/long figures in the bottom tag row
  // count up to their target on each persona reveal. Uses ease-out
  // cubic so they slow into the final digit. Respects reduced motion.
  function animatePersonaCoords(heroEl, duration = 1300) {
    if (!heroEl) return;
    const vals = heroEl.querySelectorAll('.ph-coord-val');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    vals.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimals || '4', 10);
      if (Number.isNaN(target)) return;
      if (reduce) {
        el.textContent = target.toFixed(decimals);
        return;
      }
      const startTs = performance.now();
      function tick(now) {
        const t = Math.min((now - startTs) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function syncCompareChips() {
    personaSelectorBtns.forEach(b => {
      const selected = personaCompareSet.has(b.dataset.persona);
      b.classList.toggle('selected', selected);
      // Cap reached + not selected → disable adding more
      const atMax = personaCompareSet.size >= COMPARE_MAX;
      b.classList.toggle('disabled', atMax && !selected);
      b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    syncCompareLayout();
  }

  // Compare-mode page layout — when in compare mode, we hide all the
  // original single-view sections and render a separate columns grid
  // (.persona-compare-cols) with full clones of every section per
  // selected persona. Each column independently shows hero + demos +
  // pullquote + psychographics + behaviors + twoup + footer.
  function syncCompareLayout() {
    if (!personaSelectorPageEl) return;
    const finale = document.querySelector('.persona-finale');
    const isCompare = personaCompareSet.size >= 2;
    if (isCompare) {
      personaSelectorPageEl.classList.add('is-comparing');
      personaSelectorPageEl.dataset.compareCount = String(personaCompareSet.size);
      renderCompareColumns([...personaCompareSet]);
      if (finale) finale.classList.add('is-compare-hidden');
    } else {
      personaSelectorPageEl.classList.remove('is-comparing');
      personaSelectorPageEl.removeAttribute('data-compare-count');
      clearCompareColumns();
      if (finale) finale.classList.remove('is-compare-hidden');
    }
    armPersonaReveal();
  }

  function clearCompareColumns() {
    const container = personaSelectorPageEl?.querySelector('.persona-compare-cols');
    if (container) container.remove();
  }

  function buildPersonaColumn(key) {
    const col = document.createElement('div');
    col.className = 'persona-column';
    col.dataset.persona = key;

    const heroSrc = document.querySelector(`.persona-page > .persona-hero[data-persona-hero="${key}"]`);
    if (heroSrc) {
      const heroClone = heroSrc.cloneNode(true);
      heroClone.classList.add('is-active');
      col.appendChild(heroClone);
    }

    const sectionSelectors = [
      '.persona-page > .persona-demos',
      '.persona-page > .persona-pullquote',
      '.persona-page > .persona-section.persona-feature',
      '.persona-page > .persona-section.persona-strip',
      '.persona-page > .persona-twoup',
      '.persona-page > .persona-footer',
    ];
    sectionSelectors.forEach(sel => {
      const tpl = document.querySelector(sel);
      if (tpl) col.appendChild(tpl.cloneNode(true));
    });

    applyPersonaContentToScope(col, key);
    return col;
  }

  function renderCompareColumns(ids) {
    if (!personaSelectorPageEl) return;
    let container = personaSelectorPageEl.querySelector('.persona-compare-cols');
    if (!container) {
      container = document.createElement('div');
      container.className = 'persona-compare-cols';
      personaSelectorPageEl.appendChild(container);
    }

    // Incremental diff — keep existing columns, add new, animate out removed.
    // This makes 1→2 and 2→3 use the same per-column entry transition
    // while existing columns smoothly resize via flex-basis.
    const currentKeys = [...container.querySelectorAll('.persona-column:not(.is-leaving)')]
      .map(c => c.dataset.persona);
    const toAdd = ids.filter(id => !currentKeys.includes(id));
    const toRemove = currentKeys.filter(k => !ids.includes(k));

    // Tear down columns that left the set — fade + shrink, then remove.
    toRemove.forEach(key => {
      const col = container.querySelector(`.persona-column[data-persona="${key}"]:not(.is-leaving)`);
      if (!col) return;
      col.classList.remove('is-mounted');
      col.classList.add('is-leaving');
      setTimeout(() => col.remove(), 540);
    });

    // Update count attr — drives the flex-basis target via CSS.
    container.dataset.count = String(ids.length);

    // Add new columns at their position in the ids order.
    toAdd.forEach(key => {
      const col = buildPersonaColumn(key);
      const idx = ids.indexOf(key);
      let insertBefore = null;
      for (let i = idx + 1; i < ids.length; i++) {
        const nextCol = container.querySelector(`.persona-column[data-persona="${ids[i]}"]:not(.is-leaving)`);
        if (nextCol) { insertBefore = nextCol; break; }
      }
      if (insertBefore) container.insertBefore(col, insertBefore);
      else container.appendChild(col);
      requestAnimationFrame(() => col.classList.add('is-mounted'));
    });
  }

  // Scoped content application — same logic as applyPersonaContent but
  // queries within a given scope so it operates on cloned column DOM.
  function applyPersonaContentToScope(scope, key) {
    const data = personaContent[key];
    if (!data || !scope) return;

    const demoKeys = ['age', 'generation', 'genderSplit', 'income', 'education', 'location', 'household', 'market'];
    scope.querySelectorAll('.persona-demos .pd-card').forEach((card, i) => {
      const valEl = card.querySelector('.pd-card-value');
      if (valEl && demoKeys[i]) valEl.textContent = data.demos[demoKeys[i]];
    });

    const pq = scope.querySelector('.persona-pullquote .pq-body');
    if (pq) pq.textContent = data.pullquote.body;
    const attrSpans = scope.querySelectorAll('.persona-pullquote .pq-attr > span');
    if (attrSpans[2]) attrSpans[2].textContent = data.pullquote.n;

    const lede = scope.querySelector('.persona-feature .pf-prose-body .pf-lede');
    if (lede) lede.textContent = data.psycho.lede;
    const proseParas = scope.querySelectorAll('.persona-feature .pf-prose-body p');
    if (proseParas[1]) proseParas[1].textContent = data.psycho.body;
    const metaVals = scope.querySelectorAll('.persona-feature .pf-meta .pf-meta-value');
    if (metaVals[0]) metaVals[0].textContent = data.psycho.affinity;
    if (metaVals[1]) metaVals[1].textContent = data.psycho.signal;

    scope.querySelectorAll('.persona-feature .pf-interests li').forEach((li, i) => {
      const b = data.behaviors[i]; if (!b) return;
      const t = li.querySelector('.pfi-title'); if (t) t.textContent = b.title;
      const d = li.querySelector('.pfi-desc'); if (d) d.textContent = b.desc;
    });

    const sTitle = scope.querySelector('.persona-strip .ps-title');
    if (sTitle) sTitle.textContent = data.strip.title;
    const sLede = scope.querySelector('.persona-strip .ps-lede');
    if (sLede) sLede.textContent = data.strip.lede;

    scope.querySelectorAll('.persona-twoup .ptu-list li').forEach((li, i) => {
      const m = data.motivations[i]; if (!m) return;
      const t = li.querySelector('.ptu-item-title'); if (t) t.textContent = m.title;
      const d = li.querySelector('.ptu-item-desc'); if (d) d.textContent = m.desc;
    });
    scope.querySelectorAll('.persona-twoup .ptu-channels li').forEach((li, i) => {
      const c = data.channels[i]; if (!c) return;
      const n = li.querySelector('.pch-name'); if (n) n.textContent = c.name;
      const d = li.querySelector('.pch-detail'); if (d) d.innerHTML = c.detail;
    });

    const tagEls = scope.querySelectorAll('.persona-footer .pft-tag');
    tagEls.forEach((t, i) => { t.textContent = data.tags[i] || ''; t.style.display = data.tags[i] ? '' : 'none'; });
  }

  /* Effective minimum depends on context. v1 (and v2-single) allow 1 —
     v2-compare forces ≥ 2 since the whole point of that mode is showing
     more than one persona on screen. */
  function getEffectiveCompareMin() {
    if (document.body.dataset.version === 'v2') {
      const compareBtn = document.querySelector(
        '.psl-mode .psl-mode-btn[data-mode="compare"]'
      );
      if (compareBtn?.classList.contains('active')) return 2;
    }
    return COMPARE_MIN;
  }

  /* Unified tab-click handler — every tab is a checkbox now. Toggling
     the membership of personaCompareSet derives the view mode: size 1
     keeps single-layout, size 2+ flips to compare-columns. Min driven
     by getEffectiveCompareMin (1 for v1 / v2-single, 2 for v2-compare);
     max COMPARE_MAX. */
  function handlePersonaToggle(key) {
    const wasIn = personaCompareSet.has(key);
    const prevSize = personaCompareSet.size;
    const effectiveMin = getEffectiveCompareMin();
    if (wasIn) {
      if (personaCompareSet.size <= effectiveMin) return; // can't drop below min
      personaCompareSet.delete(key);
    } else {
      if (personaCompareSet.size >= COMPARE_MAX) return; // hard cap at 5
      personaCompareSet.add(key);
    }
    const newSize = personaCompareSet.size;
    const wasCompare = prevSize >= 2;
    const nowCompare = newSize >= 2;
    if (wasCompare !== nowCompare) {
      runPersonaModeSwap(nowCompare ? 'compare' : 'single');
    } else if (nowCompare) {
      /* still compare, just add/remove one column */
      syncCompareChips();
    } else {
      /* still single, just swap the active persona */
      const onlyKey = [...personaCompareSet][0];
      activatePersona(onlyKey);
      syncCompareChips();
    }
  }

  // v2-single-mode click routing — replaces the active persona instead of
  // toggling the compare set. v1 always uses handlePersonaToggle.
  function isV2SingleMode() {
    if (document.body.dataset.version !== 'v2') return false;
    const compareBtn = document.querySelector('.psl-mode .psl-mode-btn[data-mode="compare"]');
    return !compareBtn?.classList.contains('active');
  }

  function handlePersonaSingleSelect(key) {
    if (personaCompareSet.size === 1 && personaCompareSet.has(key)) return;
    const wasCompare = personaCompareSet.size >= 2;
    personaCompareSet = new Set([key]);
    if (wasCompare) {
      runPersonaModeSwap('single');
    } else {
      activatePersona(key);
      syncCompareChips();
    }
  }

  personaSelectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.persona;
      if (!key) return;
      if (isV2SingleMode()) {
        handlePersonaSingleSelect(key);
      } else {
        handlePersonaToggle(key);
      }
      if (personaScrolled) {
        if (personaCollapseTimer) clearTimeout(personaCollapseTimer);
        personaCollapseTimer = setTimeout(() => {
          personaHovered = false;
          applyCollapseState();
          personaCollapseTimer = null;
        }, 1500);
      }
    });
  });

  // ── v2: .psl-mode toggle (Single ↔ Compare) ────────────────────────────
  // Only meaningful when body[data-version="v2"]. In v1 the .psl-mode is
  // CSS-hidden and the persona-selector is permanently in mode-compare.

  // Seed the compare set up to 2 if it's currently 0 or 1. Used both when
  // the user clicks the Compare toggle from Single, and when switching to
  // v2 with the Compare toggle already active and the set holding only
  // one persona.
  function seedCompareIfNeeded() {
    if (personaCompareSet.size >= 2) return;
    const activeKey = personaSelectorPageEl?.dataset.persona ||
      [...personaCompareSet][0] || 'casual';
    const ordered = [...personaSelectorBtns].map(b => b.dataset.persona);
    const nextKey = ordered.find(k => k !== activeKey) || activeKey;
    personaCompareSet = new Set([activeKey, nextKey]);
    runPersonaModeSwap('compare');
  }

  const pslModeBtns = document.querySelectorAll('.psl-mode .psl-mode-btn');
  function activatePslMode(target) {
    pslModeBtns.forEach(b => {
      const on = b.dataset.mode === target;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (document.body.dataset.version !== 'v2') return;
    // mode-compare drives the tab visual style (pill chips vs underline)
    // — must follow the toggle, not stay frozen at its HTML default.
    const sel = document.getElementById('personaSelector');
    if (sel) sel.classList.toggle('mode-compare', target === 'compare');
    if (target === 'single') {
      const keepKey = personaSelectorPageEl?.dataset.persona ||
        [...personaCompareSet][0] || 'casual';
      handlePersonaSingleSelect(keepKey);
    } else {
      seedCompareIfNeeded();
    }
  }
  pslModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!mode) return;
      activatePslMode(mode);
    });
  });

  // ── v1 / v2 page-variant switch ────────────────────────────────────────
  // Toggles body[data-version]. v1 keeps mode-compare permanently;
  // v2 hands compare control to the .psl-mode toggle and honors its state.
  const versionSwitchBtns = document.querySelectorAll('.version-switch .vs-btn');
  function applyVersion(version) {
    document.body.dataset.version = version;
    versionSwitchBtns.forEach(b => {
      const on = b.dataset.version === version;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const sel = document.getElementById('personaSelector');
    if (!sel) return;
    if (version === 'v1' || version === 'v3') {
      // v1 and v3 both force-pin mode-compare and have no toggle.
      // v3 is just v1 minus the inline checkboxes (CSS-driven).
      sel.classList.add('mode-compare');
    } else {
      // v2: defer to the .psl-mode toggle's active button
      const compareActive = document.querySelector(
        '.psl-mode .psl-mode-btn[data-mode="compare"]'
      )?.classList.contains('active');
      sel.classList.toggle('mode-compare', !!compareActive);
      if (compareActive) {
        // Land in v2 compare with only one persona (e.g. coming from
        // v1's single layout) → seed to 2 so the compare columns render.
        seedCompareIfNeeded();
      } else {
        // Land in v2 single with multiple personas (e.g. coming from
        // v1's compare layout) → collapse to the currently-active one
        // so the Single toggle's state matches the rendered layout.
        const keepKey = personaSelectorPageEl?.dataset.persona ||
          [...personaCompareSet][0] || 'casual';
        handlePersonaSingleSelect(keepKey);
      }
    }
  }
  versionSwitchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.version;
      if (!v) return;
      applyVersion(v);
    });
  });

  /* Blur+dim the page through the single ↔ compare layout swap so the
     discrete display: block ↔ flex change doesn't pop. Called whenever
     the checkbox-driven set size crosses 1↔2+. */
  function runPersonaModeSwap(nextMode) {
    if (nextMode === personaViewMode) {
      syncCompareChips();
      return;
    }
    personaViewMode = nextMode;
    const personaView = document.querySelector('.persona-view');
    const startSwap = () => {
      personaSelectorPageEl?.classList.add('is-mode-swapping');
    };
    const applyModeLayout = () => {
      if (nextMode === 'compare') {
        if (personaView) personaView.classList.add('is-comparing-view');
        syncCompareChips();
      } else {
        if (personaView) personaView.classList.remove('is-comparing-view');
        const onlyKey = [...personaCompareSet][0] || 'casual';
        if (onlyKey !== personaSelectorPageEl?.dataset.persona) activatePersona(onlyKey);
        syncCompareChips();
      }
    };
    const finishSwap = () => {
      personaSelectorPageEl?.classList.remove('is-mode-swapping');
    };
    startSwap();
    setTimeout(applyModeLayout, 280);
    setTimeout(finishSwap, 340);
  }

  // ─── Persona chat mode ────────────────────────────────────────────────
  // Triggered by the Chat button in the persona-selector. In single mode
  // it starts a session with the active persona; in compare mode it
  // brings all selected personas into the chat. Right side transitions
  // to a stage of circular portraits; left side simulates the bots
  // joining + responding to a scripted user opener.
  let personaChatActive = false;
  let personaChatTimers = [];
  let personaChatStartTs = 0;

  function getChatParticipants() {
    if (personaCompareSet.size > 0) return [...personaCompareSet];
    const key = personaSelectorPageEl?.dataset.persona || 'casual';
    return [key];
  }

  function getPersonaDisplayInfo(key) {
    const heroEl = document.querySelector(`.persona-page > .persona-hero[data-persona-hero="${key}"]`);
    const portraitSrc = heroEl?.querySelector('.ph-portrait img')?.src || '';
    const captionText = heroEl?.querySelector('.ph-portrait-caption')?.textContent?.trim() || key;
    const firstName = captionText.split(',')[0].trim();
    const titleEm = heroEl?.querySelector('.ph-title em')?.textContent?.trim() || '';
    return { portraitSrc, captionText, firstName, titleEm };
  }

  function enterPersonaChat() {
    if (personaChatActive) return;
    const participants = getChatParticipants();
    if (participants.length === 0) return;
    personaChatActive = true;
    personaChatStartTs = Date.now();
    const personaView = document.querySelector('.persona-view');
    if (!personaView) return;
    buildPersonaChatStage(participants, personaView);
    requestAnimationFrame(() => {
      personaView.classList.add('is-chat-mode');
      requestAnimationFrame(() => {
        personaView.querySelector('.persona-chat-stage')?.classList.add('is-mounted');
      });
    });
    startPersonaChatSimulation(participants);
  }

  // Remove a single persona from the active chat session. Animates
  // the card out, fires an OMNI "left the chat" system message, and
  // exits the chat entirely if no one is left.
  function hangUpOnPersona(personaKey) {
    if (!personaChatActive) return;
    const stage = document.querySelector('.persona-chat-stage');
    const card = stage?.querySelector(`.persona-chat-circle[data-persona="${personaKey}"]`);
    if (!card || card.classList.contains('is-leaving')) return;

    card.classList.add('is-leaving');
    card.classList.remove('is-typing');

    // System message in the chat-stream
    const info = getPersonaDisplayInfo(personaKey);
    injectChatOmni({ status: 'DISCONNECT', body: `${info.firstName} left the chat`, state: 'leaving' });

    // Cancel any pending typing/reply for this persona (cosmetic)
    const typingIndicator = document.getElementById('chatStream')
      ?.querySelector(`.msg.is-typing-indicator[data-persona="${personaKey}"]`);
    if (typingIndicator) {
      typingIndicator.classList.add('is-leaving');
      setTimeout(() => typingIndicator.remove(), 360);
    }

    setTimeout(() => {
      card.remove();
      const remaining = stage?.querySelectorAll('.persona-chat-circle:not(.is-leaving)').length || 0;
      // Update the header count
      const headerLabel = stage?.querySelector('.persona-chat-header-label');
      if (headerLabel) {
        headerLabel.textContent = `Live Session · ${remaining} ${remaining === 1 ? 'Persona' : 'Personas'}`;
      }
      if (remaining === 0) exitPersonaChat();
    }, 500);
  }

  function exitPersonaChat() {
    if (!personaChatActive) return;
    personaChatActive = false;
    personaChatTimers.forEach(clearTimeout);
    personaChatTimers = [];
    const personaView = document.querySelector('.persona-view');
    if (!personaView) return;
    const stage = personaView.querySelector('.persona-chat-stage');
    /* Capture the personas that were still in the chat at end-time so the
       right side lands on a view of EXACTLY those personas (compare layout
       if 2+, single if 1). Cards leaving via hang-up are excluded. */
    const remainingKeys = stage
      ? [...stage.querySelectorAll('.persona-chat-circle:not(.is-leaving)')].map(c => c.dataset.persona).filter(Boolean)
      : [];
    /* Snap the End Chat button out immediately — leaving it to fade with the
       stage looks like a ghost over the persona hero as it re-mounts. */
    const endBtn = stage?.querySelector('.persona-chat-end-btn');
    if (endBtn) {
      endBtn.style.transition = 'opacity 90ms linear';
      endBtn.style.opacity = '0';
      endBtn.style.pointerEvents = 'none';
    }
    stage?.classList.remove('is-mounted');
    personaView.classList.remove('is-chat-mode');
    // Remove stage + clear injected chat after the fade settles
    setTimeout(() => {
      stage?.remove();
      const chatStream = document.getElementById('chatStream');
      chatStream?.classList.remove('is-persona-chat-active');
      chatStream?.querySelectorAll('.persona-chat-injected').forEach(n => n.remove());
      /* Re-seed personaCompareSet from who was actually still in the chat
         and flip mode accordingly. */
      if (remainingKeys.length > 0) {
        personaCompareSet = new Set(remainingKeys);
        const nextMode = remainingKeys.length >= 2 ? 'compare' : 'single';
        if (nextMode !== personaViewMode) {
          runPersonaModeSwap(nextMode);
        } else if (nextMode === 'compare') {
          syncCompareChips();
        } else {
          activatePersona(remainingKeys[0]);
          syncCompareChips();
        }
      }
    }, 480);
  }

  function buildPersonaChatStage(participants, personaView) {
    personaView.querySelector('.persona-chat-stage')?.remove();

    const stage = document.createElement('div');
    stage.className = 'persona-chat-stage';

    const endBtn = document.createElement('button');
    endBtn.className = 'persona-chat-end-btn';
    endBtn.type = 'button';
    endBtn.innerHTML = `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke-linecap="round"/></svg><span>End Chat</span>`;
    endBtn.addEventListener('click', exitPersonaChat);
    stage.appendChild(endBtn);

    const header = document.createElement('div');
    header.className = 'persona-chat-header';
    const headerLabel = document.createElement('span');
    headerLabel.className = 'persona-chat-header-label';
    headerLabel.textContent = `Live Session · ${participants.length} ${participants.length === 1 ? 'Persona' : 'Personas'}`;
    const headerTitle = document.createElement('span');
    headerTitle.className = 'persona-chat-header-title';
    headerTitle.textContent = 'In conversation';
    header.appendChild(headerLabel);
    header.appendChild(headerTitle);
    stage.appendChild(header);

    const circles = document.createElement('div');
    circles.className = 'persona-chat-circles';
    circles.dataset.count = String(participants.length);

    participants.forEach(key => {
      const data = personaContent[key];
      const info = getPersonaDisplayInfo(key);
      const circle = document.createElement('div');
      circle.className = 'persona-chat-circle is-entering';
      circle.dataset.persona = key;
      circle.addEventListener('animationend', (e) => {
        if (e.animationName === 'pcc-rise') circle.classList.remove('is-entering');
      });
      setTimeout(() => circle.classList.remove('is-entering'), 1500);
      const tags = (data?.tags || []).slice(0, 2).join(' · ');
      const intentLabel = (() => {
        const tab = document.querySelector(`.psl-tab[data-persona="${key}"] .psl-sub`);
        return tab?.textContent?.trim() || '';
      })();
      circle.innerHTML = `
        <div class="pcc-portrait">
          <img src="${info.portraitSrc}" alt="${info.captionText}">
        </div>
        <div class="pcc-body">
          <div class="pcc-name">${info.captionText}</div>
          <div class="pcc-meta">The ${info.titleEm}</div>
        </div>
        <button class="pcc-hangup" type="button" aria-label="Hang up on ${info.firstName}">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
        </button>
      `;
      // Wire hang-up
      circle.querySelector('.pcc-hangup')?.addEventListener('click', (e) => {
        e.stopPropagation();
        hangUpOnPersona(key);
      });
      circles.appendChild(circle);
    });

    stage.appendChild(circles);
    personaView.appendChild(stage);
  }

  function startPersonaChatSimulation(participants) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;

    // Mark the stream so the original "Acme" greeting hides
    chatStream.classList.add('is-persona-chat-active');

    const names = participants.map(k => getPersonaDisplayInfo(k).firstName);
    const joinedRoster = `${names.join(' · ')} · ${names.length} online`;

    // Sequence: OMNI agent connects → personas join → user opener →
    // each persona types + replies → next question → and so on. Pacing
    // is slowed so each beat lands instead of stacking on top of each
    // other — feels like a real conversation, not a transcript dump.
    const steps = [];
    steps.push({ delay: 900, type: 'omni', payload: { status: 'CONNECTING', body: `linking ${participants.length} ${participants.length === 1 ? 'persona' : 'personas'}`, state: 'connecting' } });
    steps.push({ delay: 1800, type: 'omni', payload: { status: 'JOINED', body: joinedRoster, state: 'joined' } });

    const userQuestions = [
      `Hey everyone — quick brain trust. Would you actually consider the new Hyundai Ioniq 6?`,
      `Fair. What would actually move you to a "yes"?`,
      `Where do you usually first hear about a new car launch?`,
    ];

    userQuestions.forEach((question, round) => {
      steps.push({ delay: 2400, type: 'user', text: question });
      participants.forEach((key, i) => {
        const data = personaContent[key];
        const script = data?.chatScript || [];
        const reply = script[round] || script[script.length - 1] || `I’d need more info.`;
        // Spacing between each persona's response window
        steps.push({
          delay: 1100 + i * 900,
          type: 'persona-typing',
          persona: key,
        });
        steps.push({
          delay: 2200 + Math.random() * 900,  // typing duration (~2.2-3.1s)
          type: 'persona-reply',
          persona: key,
          text: reply,
        });
      });
    });

    let cumulative = 0;
    steps.forEach(step => {
      cumulative += step.delay;
      const t = setTimeout(() => {
        if (!personaChatActive) return;
        if (step.type === 'user') injectChatUser(step.text);
        else if (step.type === 'omni') injectChatOmni(step.payload || step.text);
        else if (step.type === 'persona-typing') startPersonaTyping(step.persona);
        else if (step.type === 'persona-reply') finishPersonaTyping(step.persona, step.text);
      }, cumulative);
      personaChatTimers.push(t);
    });
  }

  function formatChatElapsed() {
    if (!personaChatStartTs) return 't+00.0s';
    const sec = (Date.now() - personaChatStartTs) / 1000;
    const fixed = sec.toFixed(1);
    return sec < 10 ? `t+0${fixed}s` : `t+${fixed}s`;
  }
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function injectChatOmni(payload) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;
    const data = typeof payload === 'string'
      ? { status: 'OMNI', body: payload, state: 'joined' }
      : payload;
    const node = document.createElement('div');
    node.className = 'msg omni-system persona-chat-injected';
    if (data.state) node.dataset.state = data.state;
    node.innerHTML = `
      <div class="omni-bubble">
        <span class="omni-dot" aria-hidden="true"></span>
        <span class="omni-status">${escHtml(data.status)}</span>
        <span class="omni-sep" aria-hidden="true"></span>
        <span class="omni-body">${escHtml(data.body)}</span>
        <span class="omni-time">${formatChatElapsed()}</span>
      </div>
    `;
    chatStream.appendChild(node);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function startPersonaTyping(personaKey) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;
    // Light up the circle on the right side
    document.querySelector(`.persona-chat-circle[data-persona="${personaKey}"]`)?.classList.add('is-typing');
    // Insert typing indicator — italic "<name> is typing" + 3 animated dots
    const info = getPersonaDisplayInfo(personaKey);
    const node = document.createElement('div');
    node.className = 'msg bot persona-bot persona-chat-injected is-typing-indicator';
    node.dataset.persona = personaKey;
    node.dataset.role = 'typing';
    node.innerHTML = `
      <div class="msg-head">
        <div class="msg-avatar"><img src="${info.portraitSrc}" alt=""></div>
        <div class="msg-meta">
          <span class="msg-name">${info.firstName} · ${info.titleEm || 'Persona'}</span>
        </div>
      </div>
      <div class="body">
        <div class="thinking">
          <div class="thinking-mark" aria-hidden="true">
            <div class="orb-track orb-track-1">
              <div class="orb-sat">
                <svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg>
              </div>
            </div>
            <div class="orb-track orb-track-2">
              <div class="orb-sat">
                <svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg>
              </div>
            </div>
            <div class="orb-core">
              <svg viewBox="0 0 24 24"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" fill="currentColor"/></svg>
            </div>
          </div>
          <span class="thinking-text">${info.firstName} is composing</span>
        </div>
      </div>`;
    chatStream.appendChild(node);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function finishPersonaTyping(personaKey, text) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;
    // Remove the glow on the circle
    document.querySelector(`.persona-chat-circle[data-persona="${personaKey}"]`)?.classList.remove('is-typing');
    // Find the typing indicator for this persona and convert it into the real message
    const typingNode = chatStream.querySelector(`.msg.is-typing-indicator[data-persona="${personaKey}"]`);
    if (typingNode) {
      typingNode.classList.remove('is-typing-indicator');
      typingNode.removeAttribute('data-role');
      // Replace the head meta with a full meta block including timestamp
      const meta = typingNode.querySelector('.msg-meta');
      if (meta) {
        const info = getPersonaDisplayInfo(personaKey);
        meta.innerHTML = `
          <span class="msg-name">${info.firstName} · ${info.titleEm || 'Persona'}</span>
          <span class="msg-dot"></span>
          <span class="msg-time">${typeof timeNow === 'function' ? timeNow() : ''}</span>
        `;
      }
      const body = typingNode.querySelector('.body');
      if (body) body.textContent = text;
    } else {
      injectChatPersona(personaKey, text);
    }
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function injectChatUser(text) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;
    const node = document.createElement('div');
    node.className = 'msg user persona-chat-injected';
    node.innerHTML = `
      <div class="bubble">
        <div class="msg-head">
          <div class="msg-avatar av-nick">BC</div>
          <div class="msg-meta">
            <span class="msg-name">Bryan Cocco</span>
            <span class="msg-dot"></span>
            <span class="msg-time">${typeof timeNow === 'function' ? timeNow() : ''}</span>
          </div>
        </div>
      </div>`;
    node.querySelector('.bubble').appendChild(document.createTextNode(text));
    chatStream.appendChild(node);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function injectChatPersona(personaKey, text) {
    const chatStream = document.getElementById('chatStream');
    if (!chatStream) return;
    const info = getPersonaDisplayInfo(personaKey);
    const node = document.createElement('div');
    node.className = 'msg bot persona-bot persona-chat-injected';
    node.dataset.persona = personaKey;
    node.innerHTML = `
      <div class="msg-head">
        <div class="msg-avatar"><img src="${info.portraitSrc}" alt=""></div>
        <div class="msg-meta">
          <span class="msg-name">${info.firstName} · ${info.titleEm || 'Persona'}</span>
          <span class="msg-dot"></span>
          <span class="msg-time">${typeof timeNow === 'function' ? timeNow() : ''}</span>
        </div>
      </div>
      <div class="body"></div>`;
    node.querySelector('.body').textContent = text;
    chatStream.appendChild(node);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  // Wire the Chat button in the persona-selector
  document.querySelector('.persona-selector .psl-launch')?.addEventListener('click', enterPersonaChat);

  // Scroll-collapse — when the canvas scrolls past the threshold, fold
  // the sublabels and tighten padding. Hover/focus on the bar restores
  // expanded with a 400ms re-collapse delay on leave.
  const COLLAPSE_AT = 80;
  const RE_EXPAND_DELAY = 400;
  let personaScrolled = false;
  let personaHovered = false;
  let personaFocused = false;
  let personaCollapseTimer = null;

  function applyCollapseState() {
    if (!personaSelectorElx) return;
    const should = personaScrolled && !personaHovered && !personaFocused;
    personaSelectorElx.classList.toggle('is-collapsed', should);
  }

  const canvasScrollEl = document.getElementById('canvas');
  if (canvasScrollEl) {
    canvasScrollEl.addEventListener('scroll', () => {
      const past = canvasScrollEl.scrollTop > COLLAPSE_AT;
      if (past !== personaScrolled) {
        personaScrolled = past;
        applyCollapseState();
      }
    }, { passive: true });
  }
  personaSelectorElx?.addEventListener('mouseenter', () => {
    if (personaCollapseTimer) { clearTimeout(personaCollapseTimer); personaCollapseTimer = null; }
    if (!personaHovered) { personaHovered = true; applyCollapseState(); }
  });
  personaSelectorElx?.addEventListener('mouseleave', () => {
    if (personaCollapseTimer) clearTimeout(personaCollapseTimer);
    personaCollapseTimer = setTimeout(() => {
      personaHovered = false;
      applyCollapseState();
      personaCollapseTimer = null;
    }, RE_EXPAND_DELAY);
  });
  personaSelectorElx?.addEventListener('focusin', () => {
    if (!personaFocused) { personaFocused = true; applyCollapseState(); }
  });
  personaSelectorElx?.addEventListener('focusout', (e) => {
    if (!personaSelectorElx.contains(e.relatedTarget)) {
      personaFocused = false;
      applyCollapseState();
    }
  });

  // Idle auto-hide — fade the bar away after ~1.6s of no movement.
  // Any mouse motion, scroll, or key brings it back instantly. Hover
  // or focus on the bar itself keeps it visible.
  const IDLE_AT = 1600;
  let idleTimer = null;
  function bringNavBack() {
    if (!personaSelectorElx) return;
    if (personaSelectorElx.classList.contains('is-hidden')) {
      personaSelectorElx.classList.remove('is-hidden');
    }
  }
  function scheduleIdleHide() {
    if (idleTimer) clearTimeout(idleTimer);
    if (!personaSelectorElx) return;
    if (personaHovered || personaFocused) return;
    // Only auto-hide once the user has scrolled past the collapse
    // threshold — at the top of the page the nav stays put.
    if (!personaScrolled) return;
    idleTimer = setTimeout(() => {
      if (personaHovered || personaFocused) return;
      if (!personaScrolled) return;
      personaSelectorElx.classList.add('is-hidden');
    }, IDLE_AT);
  }
  function onAnyActivity() {
    bringNavBack();
    scheduleIdleHide();
  }
  document.addEventListener('mousemove', onAnyActivity, { passive: true });
  document.addEventListener('keydown', onAnyActivity);
  document.addEventListener('wheel', onAnyActivity, { passive: true });
  canvasScrollEl?.addEventListener('scroll', onAnyActivity, { passive: true });
  // Kick off the initial timer so the bar fades if the user lands and
  // doesn't interact at all.
  scheduleIdleHide();

  // Persona content map — every section below the hero swaps when a
  // persona tab is clicked. Keep entries in sync with persona-hero markup.
  const personaContent = {
    casual: {
      vol: '01',
      demos: { age: '18 – 34', generation: 'Gen Z · Millennial', genderSplit: '55 M / 45 F', income: '$30k – $60k', education: 'HS – Bachelor’s', location: 'Urban / Suburban, US‑wide', household: '1 – 2, often single', market: 'United States' },
      pullquote: { body: 'I’m not in the market — I just like watching the shape of the future arrive, one launch reel at a time.', n: 'n = 1,240 surveyed' },
      psycho: {
        lede: 'Casuals are the spectators of automotive culture. They aren’t waiting on a delivery slot or arguing torque figures in forum threads — they are, instead, watching the category the way other people watch fashion weeks: for the silhouettes, the colorways, the quiet announcements that hint where mobility is heading next.',
        body: 'The category sits adjacent to lifestyle and tech for this audience. A Hyundai concept shares a feed with an interiors reel, a sneaker drop, a coffee shop review. Cars are a font of taste signals, not a transaction. This is the audience that will spend forty minutes on a YouTube walkaround for a car they will never sit in — and call it research.',
        affinity: 'Design‑forward · novelty‑led · platform‑native',
        signal: 'Declared interests, scroll dwell time on auto‑lifestyle content, follow‑graph overlap with named creators.',
      },
      behaviors: [
        { title: 'Browses auto shows & concept designs', desc: 'The way others browse runways — for the gesture, not the spec sheet.' },
        { title: 'Follows creator‑category influencers', desc: 'On YouTube and Instagram — Vehicle Virgins, Doug DeMuro, Supercar Blondie.' },
        { title: 'Reads automotive design + tech features', desc: 'With a soft spot for eco‑forward concept cars and virtual car meets.' },
        { title: 'Lurks #carsoftiktok', desc: 'Discovery‑first, not commenter — drifting into TikTok rabbit holes a few times a week.' },
      ],
      strip: { title: 'Behaviors & Media Habits', lede: 'Short, snackable, and ambient — automotive content arrives in the feed, not at the dealership.' },
      motivations: [
        { title: 'Style, novelty, social trends', desc: 'Design language and reveal moments matter more than horsepower.' },
        { title: 'Low purchase intent', desc: 'Exploring future possibilities; no planned near‑term buy. The category is aspirational, not transactional.' },
        { title: 'Following the EV story', desc: 'Likely to track new EV concepts and mobility tech — the gateway from spectator to early consideration.' },
      ],
      channels: [
        { name: 'YouTube', detail: 'Vehicle Virgins · <em>Doug DeMuro</em> · Supercar Blondie' },
        { name: 'Instagram · TikTok', detail: '<em>#carsoftiktok</em> · auto‑lifestyle creators · concept reveals' },
        { name: 'Online Blogs', detail: '<em>Jalopnik</em> · CarBuzz · The Drive' },
        { name: 'Local Facebook', detail: 'Regional auto‑meet groups, observed not engaged' },
      ],
      tags: ['Casual', 'Trend-Watcher', 'Gen Z', 'Discovery'],
      finaleEyebrow: 'Persona · The Casual Car Enthusiast · Vol. 01 / 05 · May 2026',
      chatScript: [
        'Honestly? Probably not — but I’d watch the launch trailer twice and screenshot the colorway.',
        'I follow Hyundai’s design account, so I’d see it in my feed. Cute silhouette.',
        'Maybe in five years when my friends are upgrading. Right now I’m happy with the train.',
      ],
    },
    enthusiast: {
      vol: '02',
      demos: { age: '28 – 45', generation: 'Millennial · Gen X', genderSplit: '72 M / 28 F', income: '$85k – $160k', education: 'Bachelor’s+', location: 'Suburban, Sun‑belt skew', household: '2 – 4, partnered with kids', market: 'United States' },
      pullquote: { body: 'The new M5 is a closed‑deck S68 — that’s the headline. The rest is marketing.', n: 'n = 620 surveyed' },
      psycho: {
        lede: 'Enthusiasts treat the spec sheet as scripture. They know the trim codes, the chassis numbers, the suspension geometry — and they watch press conferences like other people watch playoffs, for the announcement and the technical reveal beneath the reveal.',
        body: 'Track days, autocross weekends, and detailed YouTube technical breakdowns are weekend currency. The car isn’t transportation — it’s a discipline, a calendar, a community. They build, modify, and obsessively maintain — not because they have to, but because the process itself is the product.',
        affinity: 'Performance‑led · spec‑driven · community‑deep',
        signal: 'Track‑day registrations, forum participation, parts‑store basket data, YouTube technical‑review watch time.',
      },
      behaviors: [
        { title: 'Attends track days & cars‑and‑coffee', desc: 'Owns the calendar — local SCCA, regional autocross, monthly C&C meetups.' },
        { title: 'Maintains an active build thread', desc: 'Documents every mod with part numbers and dyno sheets across owner forums.' },
        { title: 'Studies technical reviews', desc: 'Savagegeese, Carwow, Engineering Explained — re‑watched, paused, annotated.' },
        { title: 'Compares 0‑60s like wine vintages', desc: 'Holds the year‑on‑year delta in working memory across three trim packages.' },
      ],
      strip: { title: 'Behaviors & Media Habits', lede: 'Deep, long‑form, and obsessively detailed — every review is read, every spec is bookmarked.' },
      motivations: [
        { title: 'Performance & driving dynamics', desc: 'Chassis tuning, suspension geometry, throttle response — the spec is the seduction.' },
        { title: 'High purchase intent', desc: 'Already running build configurators, deposit‑ready when allocation opens.' },
        { title: 'Ownership as identity', desc: 'The car signals taste, knowledge, and tribe — not just transportation.' },
      ],
      channels: [
        { name: 'Owner Forums', detail: '<em>BimmerForums</em> · S2KI · Rennlist · model‑specific build threads' },
        { name: 'YouTube', detail: '<em>Savagegeese</em> · Carwow · Engineering Explained' },
        { name: 'Print + Digital', detail: 'Car and Driver · Road & Track · <em>Motor Trend</em>' },
        { name: 'Track Communities', detail: 'SCCA · NASA · regional autocross clubs' },
      ],
      tags: ['Enthusiast', 'Performance', 'Spec-Deep', 'Community'],
      finaleEyebrow: 'Persona · The Performance Devotee · Vol. 02 / 05 · May 2026',
      chatScript: [
        'What’s the chassis? E-GMP? And what’s the rear-motor torque figure? Need numbers before I commit.',
        'I’ve seen the press shots. If the Carwow review pulls a 3.2s 0-60, then yes, otherwise no.',
        'Honestly I’d cross-shop it against the M3 Touring. Different category but same money.',
      ],
    },
    pragmatist: {
      vol: '03',
      demos: { age: '35 – 55', generation: 'Gen X · Millennial', genderSplit: '51 M / 49 F', income: '$65k – $110k', education: 'Bachelor’s', location: 'Suburban, Midwest skew', household: '3 – 5, family‑anchored', market: 'United States' },
      pullquote: { body: 'I’ll cross‑shop three brands, run the totals twice, and read every recent review before I’ll set foot in a showroom.', n: 'n = 1,080 surveyed' },
      psycho: {
        lede: 'Pragmatists are systematic. They open a spreadsheet, they ask their group chat, they read the long‑tail reviews on Edmunds and CarGurus. Their decision is the output of a process — and the process is built to remove regret, not to maximize delight.',
        body: 'Value is the dominant frame. Resale curves, total cost of ownership, warranty length, recent reliability data, dealership reputation in their zip code — all enter the calculation. They aren’t anti‑emotional; they put emotion downstream of math. When the spreadsheet lands on a winner, the test drive feels like a confirmation, not a discovery.',
        affinity: 'Value‑led · risk‑averse · research‑deep',
        signal: 'Edmunds + KBB session length, CarGurus saved searches, third‑party warranty quote requests, reviews‑cluster reading patterns.',
      },
      behaviors: [
        { title: 'Builds a cross‑brand comparison sheet', desc: 'Side‑by‑side spec, price, and total‑cost columns before any showroom visit.' },
        { title: 'Reads 50+ reviews per shortlist car', desc: 'Long‑tail reviews on Edmunds, CarGurus, and YouTube ownership updates.' },
        { title: 'Cross‑checks reliability data', desc: 'Consumer Reports + RepairPal cross‑referenced against year‑specific recalls.' },
        { title: 'Asks the group chat before signing', desc: 'Final decision is socially validated — a trusted peer veto outweighs a sales pitch.' },
      ],
      strip: { title: 'Behaviors & Media Habits', lede: 'Long, methodical, and source‑checked — purchase decisions live in spreadsheets, not showrooms.' },
      motivations: [
        { title: 'Total cost of ownership', desc: 'Five‑year math — purchase, fuel, insurance, depreciation — drives the shortlist.' },
        { title: 'Confident purchase intent', desc: 'Mid‑funnel and patient. Decision lands when the spreadsheet stops moving.' },
        { title: 'Reliability over reveal', desc: 'A boring car that runs for ten years beats an exciting one that needs a recall.' },
      ],
      channels: [
        { name: 'Aggregators', detail: '<em>Edmunds</em> · KBB · CarGurus · TrueCar' },
        { name: 'Reviews', detail: 'Consumer Reports · <em>J.D. Power</em> · Wirecutter Auto' },
        { name: 'Owner Forums', detail: 'Toyota Nation · Honda‑Tech · model‑specific reliability threads' },
        { name: 'Group Chats', detail: 'Family + trusted peer recommendations · neighborhood Slacks' },
      ],
      tags: ['Pragmatist', 'Value', 'Family', 'Methodical'],
      finaleEyebrow: 'Persona · The Practical Buyer · Vol. 03 / 05 · May 2026',
      chatScript: [
        'Need to see TCO over 5 years — purchase, insurance, depreciation, charging. The spreadsheet decides.',
        'I’d read every long-term ownership review on Edmunds and CR before stepping in the showroom.',
        'Reliability over reveal. A boring car that runs ten years beats an exciting one with a recall.',
      ],
    },
    eco: {
      vol: '04',
      demos: { age: '25 – 42', generation: 'Millennial · Gen Z', genderSplit: '48 M / 52 F', income: '$70k – $135k', education: 'Bachelor’s+', location: 'Urban, coastal + dense‑metro', household: '1 – 3, partnered or single', market: 'United States' },
      pullquote: { body: 'If the lifecycle math doesn’t pencil out, the badge doesn’t matter — every purchase is a vote for the next decade.', n: 'n = 890 surveyed' },
      psycho: {
        lede: 'Eco‑firsts read carbon footprint and battery sourcing the way enthusiasts read torque curves. The category is a long‑cycle decision — climate, energy, and infrastructure — and the choice of vehicle is downstream of a worldview, not a status game.',
        body: 'Range, charging‑network density, and grid‑source mix are all considered before model preference. They follow battery chemistry developments, BloombergNEF reports, and the slow expansion of fast‑charging corridors. PlugShare‑style apps live on the home screen. A test drive is often the last step — by then, the brand has already passed three filters.',
        affinity: 'Climate‑led · infrastructure‑aware · long‑cycle thinker',
        signal: 'PlugShare session data, climate‑newsletter open rates, EV‑incentive page traffic, lifecycle‑calculator engagement.',
      },
      behaviors: [
        { title: 'Tracks battery chemistry updates', desc: 'LFP vs. NMC, density gains, sourcing transparency — followed like product cycles.' },
        { title: 'Maps daily routes to charging', desc: 'PlugShare + ABetterRoutePlanner are routine planning tools, not novelties.' },
        { title: 'Subscribes to climate newsletters', desc: 'Heatmap, Canary Media, Electrek — daily reading on energy + transport.' },
        { title: 'Cross‑references ESG reports', desc: 'Manufacturer sustainability disclosures factor into shortlist alongside spec.' },
      ],
      strip: { title: 'Behaviors & Media Habits', lede: 'Long‑form and lifecycle‑aware — research stretches months, not weeks, climate‑first.' },
      motivations: [
        { title: 'Lifecycle climate impact', desc: 'Whole‑stack carbon math — manufacture, energy mix, end‑of‑life — outweighs sticker.' },
        { title: 'Active EV purchase intent', desc: 'Already on a brand‑specific waitlist or comparing concrete delivery windows.' },
        { title: 'Long‑cycle ownership', desc: 'Plans to own for 8 – 12 years; battery warranty and software updates matter.' },
      ],
      channels: [
        { name: 'EV‑Native Media', detail: '<em>Electrek</em> · InsideEVs · The Autopian EV desk' },
        { name: 'Climate Outlets', detail: '<em>Heatmap</em> · BloombergNEF · Canary Media' },
        { name: 'Owner Communities', detail: 'Tesla Motors Club · Rivian Forums · Lucid Owners' },
        { name: 'Tools', detail: '<em>PlugShare</em> · A Better Routeplanner · DC‑fast charging maps' },
      ],
      tags: ['Eco-First', 'EV', 'Long-Cycle', 'Climate'],
      finaleEyebrow: 'Persona · The Quiet Convert · Vol. 04 / 05 · May 2026',
      chatScript: [
        'Battery chemistry? Sourcing? What’s the lifecycle carbon math vs. the Ioniq 5? That’s where I start.',
        'Range and the actual fast-charging network coverage matter more than the trim levels.',
        'I’d cross-reference the ESG disclosures and BloombergNEF reports before the test drive.',
      ],
    },
    status: {
      vol: '05',
      demos: { age: '40 – 65', generation: 'Gen X · Boomer', genderSplit: '78 M / 22 F', income: '$250k+', education: 'Bachelor’s+ · Graduate', location: 'Coastal metros, gated‑community', household: '2 – 4, partnered, adult kids', market: 'United States' },
      pullquote: { body: 'Anyone can pick the car. The point is that the salesman walks you to your seat at the dinner after.', n: 'n = 410 surveyed' },
      psycho: {
        lede: 'Status drivers buy badges, but more than that, they buy proximity — to the marquee event, the founder’s‑circle invite, the private‑collection viewing. The car is an artifact and an entry pass, not a transportation decision.',
        body: 'Bespoke programs, private waitlists, and concierge ownership matter more than spec lists. Allocation politics is sport. Their relationship with the brand is a multi‑decade contract — the dealer principal knows the family, the regional rep handles every release, and a new model is announced privately before it leaks publicly. Drive impressions are confirmations of identity, not discoveries about a machine.',
        affinity: 'Marquee‑driven · concierge‑led · allocation‑political',
        signal: 'Bespoke configurator session length, private‑event RSVPs, marque‑club membership cross‑referenced with garage spend.',
      },
      behaviors: [
        { title: 'Maintains dealer‑principal relationships', desc: 'Direct line to 3+ regional principals; allocation requests handled by name.' },
        { title: 'Configures bespoke build slots', desc: 'Custom paint, leather, and trim spec’d months ahead of public order books.' },
        { title: 'Attends marque‑only events', desc: 'Pebble Beach, Concours d’Elegance, Goodwood — calendar locked a year out.' },
        { title: 'Tracks allocation politics', desc: 'Knows which RM Sotheby’s lot, which factory tour, which release window matters.' },
      ],
      strip: { title: 'Behaviors & Media Habits', lede: 'Closed‑circle and concierge‑led — meaningful coverage lives in private channels, not feeds.' },
      motivations: [
        { title: 'Brand prestige & marque heritage', desc: 'Multi‑decade brand loyalty; story and lineage matter more than spec.' },
        { title: 'Bespoke allocation access', desc: 'Configurator slots, founder‑series releases, factory tours — all in scope.' },
        { title: 'Ownership as social currency', desc: 'Garage is a portfolio; each acquisition is a positioning move.' },
      ],
      channels: [
        { name: 'Concierge', detail: 'Dealer‑principal direct lines · <em>regional brand reps</em>' },
        { name: 'Print + Members', detail: '<em>Robb Report</em> · Octane · marque‑club magazines' },
        { name: 'Events', detail: '<em>Pebble Beach</em> · Goodwood · Concours d’Elegance' },
        { name: 'Auctions', detail: 'RM Sotheby’s · Gooding & Co. · <em>Bonhams</em>' },
      ],
      tags: ['Status', 'Marquee', 'Luxury', 'Concierge'],
      finaleEyebrow: 'Persona · The Marquee Driver · Vol. 05 / 05 · May 2026',
      chatScript: [
        'Hyundai isn’t my marque. My regional rep handles allocations on the brands that matter.',
        'Could be interesting if there’s a bespoke program. Otherwise it’s just transportation.',
        'I’ll see what comes up at Pebble Beach. The garage stays curated.',
      ],
    },
  };

  function applyPersonaContent(key, animated = false) {
    const data = personaContent[key];
    if (!data) return;
    const set = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
    const setHTML = (sel, html) => { const el = document.querySelector(sel); if (el) el.innerHTML = html; };

    // Demographics — pair each label to its value cell, with optional
    // mid-animation text swap so the new values flip in cleanly.
    const demoKeys = ['age', 'generation', 'genderSplit', 'income', 'education', 'location', 'household', 'market'];
    const demosEl = document.querySelector('.persona-demos');
    const swapDemoValues = () => {
      document.querySelectorAll('.persona-demos .pd-card').forEach((card, i) => {
        const valEl = card.querySelector('.pd-card-value');
        if (valEl && demoKeys[i]) valEl.textContent = data.demos[demoKeys[i]];
      });
    };
    if (animated && demosEl) {
      demosEl.classList.remove('is-flipping');
      void demosEl.offsetWidth; // restart animation
      demosEl.classList.add('is-flipping');
      setTimeout(swapDemoValues, 220); // mid-flip (dark moment)
      setTimeout(() => demosEl.classList.remove('is-flipping'), 700); // after stagger settles
    } else {
      swapDemoValues();
    }

    // Pull quote
    set('.persona-pullquote .pq-body', data.pullquote.body);
    const attrSpans = document.querySelectorAll('.persona-pullquote .pq-attr > span');
    if (attrSpans[2]) attrSpans[2].textContent = data.pullquote.n;

    // Psychographics prose + meta
    set('.persona-feature .pf-prose-body .pf-lede', data.psycho.lede);
    const proseParas = document.querySelectorAll('.persona-feature .pf-prose-body p');
    if (proseParas[1]) proseParas[1].textContent = data.psycho.body;
    const metaVals = document.querySelectorAll('.persona-feature .pf-meta .pf-meta-value');
    if (metaVals[0]) metaVals[0].textContent = data.psycho.affinity;
    if (metaVals[1]) metaVals[1].textContent = data.psycho.signal;

    // Observed Behaviors
    document.querySelectorAll('.persona-feature .pf-interests li').forEach((li, i) => {
      const b = data.behaviors[i]; if (!b) return;
      const t = li.querySelector('.pfi-title'); if (t) t.textContent = b.title;
      const d = li.querySelector('.pfi-desc'); if (d) d.textContent = b.desc;
    });

    // Behaviors strip
    set('.persona-strip .ps-title', data.strip.title);
    set('.persona-strip .ps-lede', data.strip.lede);

    // Motivations + Channels
    document.querySelectorAll('.persona-twoup .ptu-list li').forEach((li, i) => {
      const m = data.motivations[i]; if (!m) return;
      const t = li.querySelector('.ptu-item-title'); if (t) t.textContent = m.title;
      const d = li.querySelector('.ptu-item-desc'); if (d) d.textContent = m.desc;
    });
    document.querySelectorAll('.persona-twoup .ptu-channels li').forEach((li, i) => {
      const c = data.channels[i]; if (!c) return;
      const n = li.querySelector('.pch-name'); if (n) n.textContent = c.name;
      const d = li.querySelector('.pch-detail'); if (d) d.innerHTML = c.detail;
    });

    // Tags
    const tagEls = document.querySelectorAll('.persona-footer .pft-tag');
    tagEls.forEach((t, i) => { t.textContent = data.tags[i] || ''; t.style.display = data.tags[i] ? '' : 'none'; });

    // Finale eyebrow (scope to canvas_3 persona-finale only)
    const finaleEy = document.querySelector('.persona-finale .bib-finale-eyebrow');
    if (finaleEy) finaleEy.textContent = data.finaleEyebrow;
  }

  // Initial paint — sync content to whichever persona is active in HTML.
  const initialPersonaKey = personaSelectorPageEl?.dataset.persona || 'casual';
  applyPersonaContent(initialPersonaKey);
  // Sync the checkbox state from the seeded personaCompareSet (casual).
  syncCompareChips();
  // Kick off the coord counter + scroll-reveal on initial paint.
  armPersonaReveal();
  requestAnimationFrame(() => {
    const initialHero = document.querySelector('.persona-hero.is-active');
    if (initialHero) animatePersonaCoords(initialHero);
  });

  // Hero and demographics are pinned to fixed heights so persona swaps
  // don't shift the top of the page — see the CSS calc + min-height.

  // --- canvas_3 persona layout switcher: click "1" / "2" / "3" to toggle
  // .layout-1 / .layout-2 / .layout-3 on .persona-page. Stub variations
  // are CSS-only for now; future layout work hangs off these classes. ---
  const personaLayoutBtns = document.querySelectorAll('.persona-layout-switch .pls-btn');
  const personaPageEl = document.querySelector('.persona-page');
  personaLayoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const layout = btn.dataset.layout;
      if (!personaPageEl || !layout) return;
      personaPageEl.classList.remove('layout-1', 'layout-2', 'layout-3');
      personaPageEl.classList.add(`layout-${layout}`);
      personaLayoutBtns.forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  });

  // --- composer: send a message into the stream ---
  const stream = document.getElementById('chatStream');
  const input = document.getElementById('composerInput');
  const sendBtn = document.getElementById('sendBtn');

  function timeNow() {
    const d = new Date();
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `Today, ${h}:${m} ${ap}`;
  }

  // REWORK 9/1: the intro/reminder message no longer carries an
  // avatar/name/timestamp row (Bryan's ask — the AI-disclaimer body
  // moves up to fill that space), so #chIntroMsgTime was removed
  // from its markup along with the rest of .msg-head. This IIFE is
  // left in place — harmless no-op, guarded by `if (el)` — in case
  // a future revert brings the meta row back.
  (function fillIntroTime() {
    const el = document.getElementById('chIntroMsgTime');
    if (el) el.textContent = timeNow();
  })();

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function addUserMsg(text, attachments) {
    /* persona-chat-injected rides the shell's own override of the
       legacy ".msg:not(:first-of-type) { display:none }" dialogue-cycle
       rule — without it a live sent message renders invisible. */
    const node = el(`
      <div class="msg user persona-chat-injected">
        <div class="bubble">
          <div class="msg-head">
            <div class="msg-avatar av-nick">BC</div>
            <div class="msg-meta">
              <span class="msg-name">Bryan Cocco</span>
              <span class="msg-dot"></span>
              <span class="msg-time">${timeNow()}</span>
            </div>
          </div>
        </div>
      </div>`);
    const bubble = node.querySelector('.bubble');
    if (text) bubble.appendChild(document.createTextNode(text));
    if (attachments && attachments.length && typeof window._caBuildMsgAttachments === 'function') {
      bubble.appendChild(window._caBuildMsgAttachments(attachments));
    }
    stream.appendChild(node);
    stream.scrollTop = stream.scrollHeight;
  }

  function addBotMsg(text) {
    const node = el(`
      <div class="msg bot persona-chat-injected">
        <div class="msg-head">
          <div class="msg-avatar av-corv">⌬</div>
          <div class="msg-meta">
            <span class="msg-name">Acme</span>
            <span class="msg-dot"></span>
            <span class="msg-time">${timeNow()}</span>
          </div>
        </div>
        <div class="body"></div>
      </div>`);
    node.querySelector('.body').textContent = text;
    stream.appendChild(node);
    stream.scrollTop = stream.scrollHeight;
  }

  // "Canvas Assistant" bot line — same avatar/name as the Painter/
  // Media flow's ptBot() (not addBotMsg()'s stale "Acme"), but kept
  // top-level and independent of initPainterSkill() so generic hat
  // furniture (the "See all" catalog stubs, initHatCatalog() below)
  // doesn't need to know Media exists, mirroring the seam already
  // used between initModeTiles() and Painter's motion/audio hooks.
  function addCanvasAssistantMsg(text) {
    const node = el(`
      <div class="msg bot persona-chat-injected">
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
            <span class="msg-time">${timeNow()}</span>
          </div>
        </div>
        <div class="body"></div>
      </div>`);
    node.querySelector('.body').textContent = text;
    stream.appendChild(node);
    stream.scrollTop = stream.scrollHeight;
  }

  // --- Skills overlay (8/25 redesign) — replaces the old in-place
  //     "See all" catalog (a dashed chip that grew 12 more chips
  //     inside the hat) with a searchable/filterable OVERLAY of
  //     skills, opened from the hat's new .pt-seeall-link text link.
  //     Card CONTENT — every title, description, and category — is
  //     ported verbatim from Tabula's own "Create" screen
  //     (/TINKER/tabula/index.html, the clean monochrome v3 main
  //     file): Apps (Canvas, Workflow), the 4 Core Skills (Text,
  //     Graphics, Video, Audio), and the full skills catalog grid —
  //     not invented, same REUSE-FIRST rule as the rest of this file.
  //     The overlay chrome reuses this project's own pane-bounds
  //     overlay convention (.pt-env-overlay/.pt-skills-overlay share
  //     one CSS contract — see the comment above that block; head
  //     markup below literally reuses .pt-env-head/.pt-env-title-wrap/
  //     .pt-env-title/.pt-env-count-tag/.pt-editor-back/.pt-env-body).
  //     Plain top-level IIFE, no Painter/Media coupling — same seam
  //     as the old initHatCatalog() this replaces. ---
  (function initSkillsOverlay() {
    const trigger = document.getElementById('ptSeeAllChip');
    if (!trigger) return;

    // Real Phosphor "light" weight SVG path data, fetched live from
    // raw.githubusercontent.com/phosphor-icons/core (same house rule
    // as every other icon in this file — never hand-drawn paths).
    const SKILL_ICONS = {
      appWindow: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,158a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2ZM78,84A10,10,0,1,1,68,74,10,10,0,0,1,78,84Zm40,0a10,10,0,1,1-10-10A10,10,0,0,1,118,84Z"/></svg>',
      treeStructure: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M160,110h48a14,14,0,0,0,14-14V48a14,14,0,0,0-14-14H160a14,14,0,0,0-14,14V66H128a22,22,0,0,0-22,22v34H70V112A14,14,0,0,0,56,98H24a14,14,0,0,0-14,14v32a14,14,0,0,0,14,14H56a14,14,0,0,0,14-14V134h36v34a22,22,0,0,0,22,22h18v18a14,14,0,0,0,14,14h48a14,14,0,0,0,14-14V160a14,14,0,0,0-14-14H160a14,14,0,0,0-14,14v18H128a10,10,0,0,1-10-10V88a10,10,0,0,1,10-10h18V96A14,14,0,0,0,160,110ZM58,144a2,2,0,0,1-2,2H24a2,2,0,0,1-2-2V112a2,2,0,0,1,2-2H56a2,2,0,0,1,2,2Zm100,16a2,2,0,0,1,2-2h48a2,2,0,0,1,2,2v48a2,2,0,0,1-2,2H160a2,2,0,0,1-2-2Zm0-112a2,2,0,0,1,2-2h48a2,2,0,0,1,2,2V96a2,2,0,0,1-2,2H160a2,2,0,0,1-2-2Z"/></svg>',
      textT: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M206,56V88a6,6,0,0,1-12,0V62H134V194h26a6,6,0,0,1,0,12H96a6,6,0,0,1,0-12h26V62H62V88a6,6,0,0,1-12,0V56a6,6,0,0,1,6-6H200A6,6,0,0,1,206,56Z"/></svg>',
      image: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V163.57L188.53,134.1a14,14,0,0,0-19.8,0l-21.42,21.42L101.9,110.1a14,14,0,0,0-19.8,0L38,154.2V56A2,2,0,0,1,40,54ZM38,200V171.17l52.58-52.58a2,2,0,0,1,2.84,0L176.83,202H40A2,2,0,0,1,38,200Zm178,2H193.8l-38-38,21.41-21.42a2,2,0,0,1,2.83,0l38,38V200A2,2,0,0,1,216,202ZM146,100a10,10,0,1,1,10,10A10,10,0,0,1,146,100Z"/></svg>',
      videoCamera: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M250.83,74.71a6,6,0,0,0-6.16.3L206,100.79V72a14,14,0,0,0-14-14H32A14,14,0,0,0,18,72V184a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V155.21L244.67,181a6,6,0,0,0,9.33-5V80A6,6,0,0,0,250.83,74.71ZM194,184a2,2,0,0,1-2,2H32a2,2,0,0,1-2-2V72a2,2,0,0,1,2-2H192a2,2,0,0,1,2,2Zm48-19.21-36-24V115.21l36-24Z"/></svg>',
      speakerHigh: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M154.64,26.61a6,6,0,0,0-6.32.65L77.94,82H32A14,14,0,0,0,18,96v64a14,14,0,0,0,14,14H77.94l70.38,54.74A6,6,0,0,0,158,224V32A6,6,0,0,0,154.64,26.61ZM30,160V96a2,2,0,0,1,2-2H74v68H32A2,2,0,0,1,30,160Zm116,51.73L86,165.07V90.93l60-46.66Zm50.53-108.85a38,38,0,0,1,0,50.24,6,6,0,1,1-9-7.94,26,26,0,0,0,0-34.37,6,6,0,0,1,9-7.93ZM246,128a77.86,77.86,0,0,1-19.86,52,6,6,0,1,1-8.94-8,66,66,0,0,0,0-88,6,6,0,1,1,8.94-8A77.86,77.86,0,0,1,246,128Z"/></svg>',
      binoculars: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M233,147.24,191.43,52.6a6,6,0,0,0-1.25-1.83,30,30,0,0,0-42.42,0A6,6,0,0,0,146,55V82H110V55a6,6,0,0,0-1.76-4.25,30,30,0,0,0-42.42,0,6,6,0,0,0-1.25,1.83L23,147.24A46,46,0,1,0,110,168V94h36v74a46,46,0,1,0,87-20.76ZM64,202a34,34,0,1,1,34-34A34,34,0,0,1,64,202Zm0-80a45.77,45.77,0,0,0-18.55,3.92L75.06,58.54A18,18,0,0,1,98,57.71V137A45.89,45.89,0,0,0,64,122Zm94-64.28a18,18,0,0,1,22.94.83l29.61,67.37A45.9,45.9,0,0,0,158,137ZM192,202a34,34,0,1,1,34-34A34,34,0,0,1,192,202Z"/></svg>',
      file: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Z"/></svg>',
      stack: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.18,173a6,6,0,0,1-2.16,8.2l-96,56a6,6,0,0,1-6,0l-96-56a6,6,0,0,1,6-10.36l93,54.23,93-54.23A6,6,0,0,1,229.18,173ZM221,122.82l-93,54.23L35,122.82a6,6,0,0,0-6,10.36l96,56a6,6,0,0,0,6,0l96-56a6,6,0,0,0-6-10.36ZM26,80a6,6,0,0,1,3-5.18l96-56a6,6,0,0,1,6,0l96,56a6,6,0,0,1,0,10.36l-96,56a6,6,0,0,1-6,0l-96-56A6,6,0,0,1,26,80Zm17.91,0L128,129.05,212.09,80,128,31Z"/></svg>',
      columns: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M104,34H64A14,14,0,0,0,50,48V208a14,14,0,0,0,14,14h40a14,14,0,0,0,14-14V48A14,14,0,0,0,104,34Zm2,174a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2h40a2,2,0,0,1,2,2ZM192,34H152a14,14,0,0,0-14,14V208a14,14,0,0,0,14,14h40a14,14,0,0,0,14-14V48A14,14,0,0,0,192,34Zm2,174a2,2,0,0,1-2,2H152a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2h40a2,2,0,0,1,2,2Z"/></svg>',
      user: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.19,213c-15.81-27.32-40.63-46.49-69.47-54.62a70,70,0,1,0-63.44,0C67.44,166.5,42.62,185.67,26.81,213a6,6,0,1,0,10.38,6C56.4,185.81,90.34,166,128,166s71.6,19.81,90.81,53a6,6,0,1,0,10.38-6ZM70,96a58,58,0,1,1,58,58A58.07,58.07,0,0,1,70,96Z"/></svg>',
      browsers: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H72A14,14,0,0,0,58,56V74H40A14,14,0,0,0,26,88V200a14,14,0,0,0,14,14H184a14,14,0,0,0,14-14V182h18a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,86H184a2,2,0,0,1,2,2v18H38V88A2,2,0,0,1,40,86ZM186,200a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V118H186Zm32-32a2,2,0,0,1-2,2H198V88a14,14,0,0,0-14-14H70V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z"/></svg>',
      listChecks: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M222,128a6,6,0,0,1-6,6H128a6,6,0,0,1,0-12h88A6,6,0,0,1,222,128ZM128,70h88a6,6,0,0,0,0-12H128a6,6,0,0,0,0,12Zm88,116H128a6,6,0,0,0,0,12h88a6,6,0,0,0,0-12ZM83.76,43.76,56,71.51,44.24,59.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,135.51,44.24,123.76a6,6,0,1,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,199.51,44.24,187.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Z"/></svg>',
      shareNetwork: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M176,162a37.91,37.91,0,0,0-28.3,12.67L98.8,143.24a37.89,37.89,0,0,0,0-30.48l48.9-31.43a38,38,0,1,0-6.5-10.09L92.3,102.67a38,38,0,1,0,0,50.66l48.9,31.43A38,38,0,1,0,176,162Zm0-132a26,26,0,1,1-26,26A26,26,0,0,1,176,30ZM64,154a26,26,0,1,1,26-26A26,26,0,0,1,64,154Zm112,72a26,26,0,1,1,26-26A26,26,0,0,1,176,226Z"/></svg>',
      newspaper: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M182,112a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h80A6,6,0,0,1,182,112Zm-6,26H96a6,6,0,0,0,0,12h80a6,6,0,0,0,0-12Zm54-74V184a22,22,0,0,1-22,22H32a22,22,0,0,1-22-21.91V88a6,6,0,0,1,12,0v96a10,10,0,0,0,20,0V64A14,14,0,0,1,56,50H216A14,14,0,0,1,230,64Zm-12,0a2,2,0,0,0-2-2H56a2,2,0,0,0-2,2V184a21.84,21.84,0,0,1-2.41,10H208a10,10,0,0,0,10-10Z"/></svg>',
      pencilSimple: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M225.9,74.78,181.21,30.09a14,14,0,0,0-19.8,0L38.1,153.41a13.94,13.94,0,0,0-4.1,9.9V208a14,14,0,0,0,14,14H92.69a13.94,13.94,0,0,0,9.9-4.1L225.9,94.58a14,14,0,0,0,0-19.8ZM94.1,209.41a2,2,0,0,1-1.41.59H48a2,2,0,0,1-2-2V163.31a2,2,0,0,1,.59-1.41L136,72.48,183.51,120ZM217.41,86.1,192,111.51,144.49,64,169.9,38.58a2,2,0,0,1,2.83,0l44.68,44.69a2,2,0,0,1,0,2.83Z"/></svg>',
      envelope: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M224,50H32a6,6,0,0,0-6,6V192a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A6,6,0,0,0,224,50Zm-96,85.86L47.42,62H208.58ZM101.67,128,38,186.36V69.64Zm8.88,8.14L124,148.42a6,6,0,0,0,8.1,0l13.4-12.28L208.58,194H47.43ZM154.33,128,218,69.64V186.36Z"/></svg>',
      layout: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V98H38V56A2,2,0,0,1,40,54ZM38,200V110H98v92H40A2,2,0,0,1,38,200Zm178,2H110V110H218v90A2,2,0,0,1,216,202Z"/></svg>',
      tag: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M241.91,137.42,142.59,38.1a13.94,13.94,0,0,0-9.9-4.1H40a6,6,0,0,0-6,6v92.69a13.94,13.94,0,0,0,4.1,9.9l99.32,99.32a14,14,0,0,0,19.8,0l84.69-84.69A14,14,0,0,0,241.91,137.42Zm-8.49,11.31-84.69,84.69a2,2,0,0,1-2.83,0L46.59,134.1a2,2,0,0,1-.59-1.41V46h86.69a2,2,0,0,1,1.41.59l99.32,99.31A2,2,0,0,1,233.42,148.73ZM94,84A10,10,0,1,1,84,74,10,10,0,0,1,94,84Z"/></svg>',
      bookOpen: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M232,50H160a38,38,0,0,0-32,17.55A38,38,0,0,0,96,50H24a6,6,0,0,0-6,6V200a6,6,0,0,0,6,6H96a26,26,0,0,1,26,26,6,6,0,0,0,12,0,26,26,0,0,1,26-26h72a6,6,0,0,0,6-6V56A6,6,0,0,0,232,50ZM96,194H30V62H96a26,26,0,0,1,26,26V204.31A37.86,37.86,0,0,0,96,194Zm130,0H160a37.87,37.87,0,0,0-26,10.32V88a26,26,0,0,1,26-26h66Z"/></svg>',
      fileText: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Zm-34-82a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,136Zm0,32a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,168Z"/></svg>',
      paperPlaneTilt: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M225.88,30.12a13.83,13.83,0,0,0-13.7-3.58l-.11,0L20.14,84.77A14,14,0,0,0,18,110.85l85.56,41.64L145.12,238a13.87,13.87,0,0,0,12.61,8c.4,0,.81,0,1.21-.05a13.9,13.9,0,0,0,12.29-10.09l58.2-191.93,0-.11A13.83,13.83,0,0,0,225.88,30.12Zm-8,10.4L159.73,232.43l0,.11a2,2,0,0,1-3.76.26l-40.68-83.58,49-49a6,6,0,1,0-8.49-8.49l-49,49L23.15,100a2,2,0,0,1,.31-3.74l.11,0L215.48,38.08a1.94,1.94,0,0,1,1.92.52A2,2,0,0,1,217.92,40.52Z"/></svg>',
      filmSlate: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,106H86.68L209.53,73.57a6,6,0,0,0,4.26-7.38l-8.16-30a13.94,13.94,0,0,0-17-9.72L36.32,66.67a13.77,13.77,0,0,0-8.48,6.47,13.57,13.57,0,0,0-1.36,10.42L34,111.34c0,.22,0,.44,0,.66v88a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V112A6,6,0,0,0,216,106ZM125.75,55.48l33,19.07-42.43,11.2-33-19.07Zm66-17.41a1.92,1.92,0,0,1,2.34,1.26l6.57,24.18L175.26,70.2l-33-19.07ZM38.23,79.14a1.85,1.85,0,0,1,1.15-.87L66.86,71l33,19.08L44.66,104.68l-6.6-24.27A1.63,1.63,0,0,1,38.23,79.14ZM210,200a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V118H210Z"/></svg>',
      microphoneStage: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M168,18A69.94,69.94,0,0,0,98.74,98l-70,95.46a13.92,13.92,0,0,0,1.39,18.17l14.3,14.3a13.93,13.93,0,0,0,18.17,1.39l95.46-70A70,70,0,1,0,168,18Zm58,70a57.65,57.65,0,0,1-13,36.52L131.49,43A57.95,57.95,0,0,1,226,88ZM55.5,217.59a2,2,0,0,1-2.6-.2L38.61,203.1a2,2,0,0,1-.2-2.6l64.22-87.56a70.32,70.32,0,0,0,40.44,40.43ZM110,88a57.73,57.73,0,0,1,13-36.52L204.53,133A58,58,0,0,1,110,88Zm-1.75,59.75a6,6,0,0,1,0,8.49l-8,8a6,6,0,1,1-8.49-8.49l8-8A6,6,0,0,1,108.26,147.74Z"/></svg>',
      triangle: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M235.07,189.09,147.61,37.22a22.75,22.75,0,0,0-39.22,0L20.93,189.09a21.53,21.53,0,0,0,0,21.72A22.35,22.35,0,0,0,40.55,222h174.9a22.35,22.35,0,0,0,19.6-11.19A21.53,21.53,0,0,0,235.07,189.09ZM224.66,204.8a10.46,10.46,0,0,1-9.21,5.2H40.55a10.46,10.46,0,0,1-9.21-5.2,9.49,9.49,0,0,1,0-9.72L118.79,43.21a10.75,10.75,0,0,1,18.42,0l87.46,151.87A9.49,9.49,0,0,1,224.66,204.8Z"/></svg>',
      book: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M208,26H72A30,30,0,0,0,42,56V224a6,6,0,0,0,6,6H192a6,6,0,0,0,0-12H54v-2a18,18,0,0,1,18-18H208a6,6,0,0,0,6-6V32A6,6,0,0,0,208,26Zm-6,160H72a29.87,29.87,0,0,0-18,6V56A18,18,0,0,1,72,38H202Z"/></svg>',
      paintBucket: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M237,164.67a6,6,0,0,0-10,0c-.7,1-17,25.72-17,43.33a22,22,0,0,0,44,0C254,190.39,237.69,165.71,237,164.67ZM232,218a10,10,0,0,1-10-10c0-8.17,5.37-19.92,10-28.34,4.63,8.41,10,20.15,10,28.34A10,10,0,0,1,232,218Zm1.9-80.82a6,6,0,0,0,2.34-9.94L120.76,11.76a6,6,0,0,0-8.49,0l-42,42-26-26a6,6,0,0,0-8.49,8.48l26,26L16.44,107.59a22,22,0,0,0,0,31.11l84.86,84.86a22,22,0,0,0,31.11,0l78.83-78.83Zm-30.14-1.94-79.83,79.83a10,10,0,0,1-14.14,0L24.93,130.21a10,10,0,0,1,0-14.14L70.25,70.75l31.62,31.61a26,26,0,0,0,3.75,32,26,26,0,0,0,36.76,0h0a26,26,0,0,0-32-40.51L78.74,62.26l37.78-37.77L220.89,128.86l-14.79,4.93A6.07,6.07,0,0,0,203.76,135.24ZM114.1,106.11l0,0a14,14,0,1,1,0,19.82,13.91,13.91,0,0,1,0-19.82Z"/></svg>',
      gridFour: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M200,42H56A14,14,0,0,0,42,56V200a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V56A14,14,0,0,0,200,42Zm2,14v66H134V54h66A2,2,0,0,1,202,56ZM56,54h66v68H54V56A2,2,0,0,1,56,54ZM54,200V134h68v68H56A2,2,0,0,1,54,200Zm146,2H134V134h68v66A2,2,0,0,1,200,202Z"/></svg>',
      camera: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M208,58H179.21L165,36.67A6,6,0,0,0,160,34H96a6,6,0,0,0-5,2.67L76.78,58H48A22,22,0,0,0,26,80V192a22,22,0,0,0,22,22H208a22,22,0,0,0,22-22V80A22,22,0,0,0,208,58Zm10,134a10,10,0,0,1-10,10H48a10,10,0,0,1-10-10V80A10,10,0,0,1,48,70H80a6,6,0,0,0,5-2.67L99.21,46h57.57L171,67.33A6,6,0,0,0,176,70h32a10,10,0,0,1,10,10ZM128,90a42,42,0,1,0,42,42A42,42,0,0,0,128,90Zm0,72a30,30,0,1,1,30-30A30,30,0,0,1,128,162Z"/></svg>',
      cube: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M222.72,67.9l-88-48.17a13.9,13.9,0,0,0-13.44,0l-88,48.18A14,14,0,0,0,26,80.18v95.64a14,14,0,0,0,7.28,12.27l88,48.18a13.92,13.92,0,0,0,13.44,0l88-48.18A14,14,0,0,0,230,175.82V80.18A14,14,0,0,0,222.72,67.9ZM127,30.25a2,2,0,0,1,1.92,0L212.51,76,128,122.24,43.49,76ZM39,177.57a2,2,0,0,1-1-1.75V86.66l84,46V223Zm177.92,0L134,223V132.64l84-46v89.16A2,2,0,0,1,217,177.57Z"/></svg>',
      filmStrip: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM38,86h84v84H38Zm96-12V54h36V74Zm-12,0H86V54h36Zm0,108v20H86V182Zm12,0h36v20H134Zm0-12V86h84v84ZM218,56V74H182V54h34A2,2,0,0,1,218,56ZM40,54H74V74H38V56A2,2,0,0,1,40,54ZM38,200V182H74v20H40A2,2,0,0,1,38,200Zm178,2H182V182h36v18A2,2,0,0,1,216,202Z"/></svg>',
      scissors: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M159.38,112a6,6,0,0,1,1.57-8.34l67.66-46.31a6,6,0,0,1,6.78,9.91l-67.67,46.3a6,6,0,0,1-8.34-1.56ZM237,197.09a6,6,0,0,1-8.34,1.56L136,135.27,91,166.06A34,34,0,1,1,84,156a1.8,1.8,0,0,0,.19.2L125.37,128,84.23,99.84,84,100a34,34,0,1,1,7-10.1l144.38,98.8A6,6,0,0,1,237,197.09ZM75.56,91.55a22,22,0,1,0-31.12,0,21.88,21.88,0,0,0,31.12,0ZM82,180a22,22,0,1,0-6.44,15.56h0A21.88,21.88,0,0,0,82,180Z"/></svg>',
      calendar: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M208,34H182V24a6,6,0,0,0-12,0V34H86V24a6,6,0,0,0-12,0V34H48A14,14,0,0,0,34,48V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V48A14,14,0,0,0,208,34ZM48,46H74V56a6,6,0,0,0,12,0V46h84V56a6,6,0,0,0,12,0V46h26a2,2,0,0,1,2,2V82H46V48A2,2,0,0,1,48,46ZM208,210H48a2,2,0,0,1-2-2V94H210V208A2,2,0,0,1,208,210Zm-98-90v64a6,6,0,0,1-12,0V129.71l-7.32,3.66a6,6,0,1,1-5.36-10.74l16-8A6,6,0,0,1,110,120Zm59.57,29.25L148,178h20a6,6,0,0,1,0,12H136a6,6,0,0,1-4.8-9.6L160,142a10,10,0,1,0-16.65-11A6,6,0,1,1,133,125a22,22,0,1,1,36.62,24.26Z"/></svg>',
      currencyDollar: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M152,122H134V54h10a34,34,0,0,1,34,34,6,6,0,0,0,12,0,46.06,46.06,0,0,0-46-46H134V24a6,6,0,0,0-12,0V42H112a46,46,0,0,0,0,92h10v68H104a34,34,0,0,1-34-34,6,6,0,0,0-12,0,46.06,46.06,0,0,0,46,46h18v18a6,6,0,0,0,12,0V214h18a46,46,0,0,0,0-92Zm-40,0a34,34,0,0,1,0-68h10v68Zm40,80H134V134h18a34,34,0,0,1,0,68Z"/></svg>',
      clock: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Zm62-90a6,6,0,0,1-6,6H128a6,6,0,0,1-6-6V72a6,6,0,0,1,12,0v50h50A6,6,0,0,1,190,128Z"/></svg>',
      chartPieSlice: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M102,109.5v-72a6,6,0,0,0-8-5.66A102,102,0,0,0,27.7,146.59a6,6,0,0,0,8.9,4.11l62.4-36A6,6,0,0,0,102,109.5ZM90,106l-51.66,29.8Q38,131.91,38,128A90.1,90.1,0,0,1,90,46.42Zm38-80a6,6,0,0,0-6,6v93L42.2,171.46a6,6,0,0,0-2.15,8.22A102,102,0,1,0,128,26Zm0,192a90.48,90.48,0,0,1-74.38-39.31L131,133.61a6,6,0,0,0,3-5.19V38.2A90,90,0,0,1,128,218Z"/></svg>',
      trendUp: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M238,56v64a6,6,0,0,1-12,0V70.48l-85.76,85.76a6,6,0,0,1-8.48,0L96,120.49,28.24,188.24a6,6,0,0,1-8.48-8.48l72-72a6,6,0,0,1,8.48,0L136,143.51,217.52,62H168a6,6,0,0,1,0-12h64A6,6,0,0,1,238,56Z"/></svg>',
      listBullets: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M82,64a6,6,0,0,1,6-6H216a6,6,0,0,1,0,12H88A6,6,0,0,1,82,64Zm134,58H88a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12Zm0,64H88a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12ZM44,54A10,10,0,1,0,54,64,10,10,0,0,0,44,54Zm0,128a10,10,0,1,0,10,10A10,10,0,0,0,44,182Zm0-64a10,10,0,1,0,10,10A10,10,0,0,0,44,118Z"/></svg>',
      gitBranch: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M230,64a30,30,0,1,0-36,29.4V112a10,10,0,0,1-10,10H96a21.84,21.84,0,0,0-10,2.42v-31a30,30,0,1,0-12,0v69.2a30,30,0,1,0,12,0V144a10,10,0,0,1,10-10h88a22,22,0,0,0,22-22V93.4A30.05,30.05,0,0,0,230,64ZM62,64A18,18,0,1,1,80,82,18,18,0,0,1,62,64ZM98,192a18,18,0,1,1-18-18A18,18,0,0,1,98,192ZM200,82a18,18,0,1,1,18-18A18,18,0,0,1,200,82Z"/></svg>',
      chartBar: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M224,202H214V40a6,6,0,0,0-6-6H152a6,6,0,0,0-6,6V82H96a6,6,0,0,0-6,6v42H48a6,6,0,0,0-6,6v66H32a6,6,0,0,0,0,12H224a6,6,0,0,0,0-12ZM158,46h44V202H158ZM102,94h44V202H102ZM54,142H90v60H54Z"/></svg>',
      chartLine: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M230,208a6,6,0,0,1-6,6H32a6,6,0,0,1-6-6V48a6,6,0,0,1,12,0v98.78l54.05-47.3a6,6,0,0,1,7.55-.28l60.11,45.08,60.34-52.8a6,6,0,0,1,7.9,9l-64,56a6,6,0,0,1-7.55.28L96.29,111.72,38,162.72V202H224A6,6,0,0,1,230,208Z"/></svg>',
      presentation: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H134V24a6,6,0,0,0-12,0V42H40A14,14,0,0,0,26,56V176a14,14,0,0,0,14,14H83.52L59.31,220.25a6,6,0,0,0,9.38,7.5L98.88,190h58.24l30.19,37.75a6,6,0,0,0,9.38-7.5L172.48,190H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,134a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z"/></svg>',
      magnifyingGlass: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z"/></svg>'
    };

    // Ported verbatim from Tabula: Apps (Canvas, Workflow), the 4 Core
    // Skills (Text, Graphics, Video, Audio), and the full skills
    // catalog grid — titles/descriptions/categories are Tabula's own
    // authored copy, unedited (the same "Deep Research"/"Social Post"
    // titles it uses for kinds "research"/"instagram", etc). `live`
    // marks the 4 cards that map to a real skill in THIS canvas:
    // Graphics/Video/Audio route to their own mode tile exactly as a
    // direct click would, and "Banner Ads" — Tabula's own copy for
    // real-brand display ads at every IAB size — is the honest match
    // for what Media/Painter actually produces, so it routes to Media
    // rather than inventing a card literally titled "Media" that
    // isn't in Tabula's data. Every other card posts the same "coming
    // to this canvas" stub the old catalog chips used.
    const TABULA_SKILLS = [
      { kind: 'canvas', title: 'Canvas', desc: 'Turn intelligence into action in a collaborative space where strategy, assets, and performance live side by side.', cats: ['Strategy', 'Operations'], chips: ['Intelligence', 'Execution'], icon: 'appWindow' },
      { kind: 'workflow', title: 'Workflow', desc: 'Build node-based workflows that chain skills together — design the flow once, then run it end to end.', cats: ['Operations', 'Production'], chips: ['Node Editor', 'Automation'], icon: 'treeStructure' },
      { kind: 'text', title: 'Text', desc: 'Make your message hit the mark. Generate copy that\'s tuned specifically to your audience.', cats: ['Copy', 'Creative'], chips: ['Text Generation'], icon: 'textT' },
      { kind: 'graphics', title: 'Graphics', desc: 'Skip the photoshoot and get client-right assets from the top image-generating models, all in one place.', cats: ['Design', 'Creative'], chips: ['Image Generation', 'Creative'], icon: 'image', live: 'Graphics' },
      { kind: 'video', title: 'Video', desc: 'So long, storyboards. Use an image to create high fidelity, cinematic quality video in near real-time.', cats: ['Production', 'Creative'], chips: ['Image to Video', 'Creative'], icon: 'videoCamera', live: 'Video' },
      { kind: 'audio', title: 'Audio', desc: 'Turn text into life like human voices for voiceover, narration and more.', cats: ['Production', 'Creative'], chips: ['Text to Audio'], icon: 'speakerHigh', live: 'Audio' },
      { kind: 'research', title: 'Deep Research', desc: 'Deep Research powered by multi-agent collaboration.', cats: ['Research'], chips: ['Research', 'All'], icon: 'binoculars' },
      { kind: 'brief', title: 'Creative Brief', desc: 'Start with a brief that keeps everyone aligned — objectives, audience, and deliverables in one place.', cats: ['Strategy'], chips: ['Strategy', 'Alignment'], icon: 'file' },
      { kind: 'moodboard', title: 'Moodboard', desc: 'Collect references, textures, and tone into a board that sets the creative direction for everything that follows.', cats: ['Creative'], chips: ['Curation', 'Creative'], icon: 'stack' },
      { kind: 'storyboard', title: 'Storyboard', desc: 'Sketch the narrative shot by shot before production starts, mapping camera angles, pacing, and transitions.', cats: ['Creative', 'Production'], chips: ['Narrative', 'Pre-production'], icon: 'columns' },
      { kind: 'persona', title: 'Persona', desc: 'Build rich audience personas grounded in real signals — demographics, behaviors, and motivations teams can act on.', cats: ['Research', 'Strategy'], chips: ['Audience', 'Insights'], icon: 'user' },
      { kind: 'mockups', title: 'Mockups', desc: 'Drop concepts into device frames and real-world scenes so stakeholders can see the work in context before it ships.', cats: ['Design', 'Creative'], chips: ['Presentation', 'Creative'], icon: 'browsers' },
      { kind: 'plan', title: 'Project Plan', desc: 'Map the work — phases, owners, and timelines at a glance — so every team knows what\'s due and who\'s driving it.', cats: ['Operations', 'Strategy'], chips: ['Planning', 'Operations'], icon: 'listChecks' },
      { kind: 'instagram', title: 'Social Post', desc: 'Turn ideas into feed-ready posts, sized and styled for every platform, from a single creative concept.', cats: ['Social', 'Creative'], chips: ['Social', 'Creative'], icon: 'shareNetwork' },
      { kind: 'press-release', title: 'Press Release', desc: 'Draft newsworthy releases that land the story your brand wants told, formatted and quoted the way editors expect.', cats: ['Copy', 'Strategy'], chips: ['Copy', 'Strategy'], icon: 'newspaper' },
      { kind: 'blog-post', title: 'Blog Post', desc: 'Turn ideas into SEO-friendly posts that sound like your brand, every time, complete with headings and meta copy.', cats: ['Copy'], chips: ['Copy'], icon: 'pencilSimple' },
      { kind: 'email-campaign', title: 'Email Campaign', desc: 'Build multi-touch email sequences from a single creative brief, with subject lines and sends timed for the funnel.', cats: ['Copy', 'Production'], chips: ['Copy', 'Production'], icon: 'envelope' },
      { kind: 'landing-page', title: 'Landing Page', desc: 'Ship conversion-ready landing pages without waiting on a dev sprint, from hero copy to the final call to action.', cats: ['Design', 'Copy'], chips: ['Design', 'Copy'], icon: 'layout' },
      { kind: 'banner-ads', title: 'Banner Ads', desc: 'Generate on-brand display ads across every standard IAB size, ready to trim for search or social placement.', cats: ['Design', 'Production'], chips: ['Design', 'Production'], icon: 'tag', live: 'Media' },
      { kind: 'case-study', title: 'Case Study', desc: 'Package a client win into a story that sells the next one, with the metrics and quotes that back it up.', cats: ['Copy', 'Strategy'], chips: ['Copy', 'Strategy'], icon: 'bookOpen' },
      { kind: 'white-paper', title: 'White Paper', desc: 'Turn research and data into a long-form paper that builds authority, complete with citations and a summary.', cats: ['Copy', 'Research'], chips: ['Copy', 'Research'], icon: 'fileText' },
      { kind: 'newsletter', title: 'Newsletter', desc: 'Assemble a recurring newsletter from your latest wins and updates, formatted and ready to send on schedule.', cats: ['Copy', 'Production'], chips: ['Copy', 'Production'], icon: 'paperPlaneTilt' },
      { kind: 'video-script', title: 'Video Script', desc: 'Write tight, shot-ready scripts for spots, explainers, and social cuts, timed to the second for every runtime.', cats: ['Copy', 'Production'], chips: ['Copy', 'Production'], icon: 'filmSlate' },
      { kind: 'podcast', title: 'Podcast', desc: 'Outline, script, and show-note an episode from a single topic prompt, ready for the host to record.', cats: ['Production', 'Social'], chips: ['Production', 'Social'], icon: 'microphoneStage' },
      { kind: 'logo-concepts', title: 'Logo Concepts', desc: 'Explore a spread of logo directions before committing to one system, each rendered in color and monochrome.', cats: ['Design', 'Creative'], chips: ['Design', 'Creative'], icon: 'triangle' },
      { kind: 'brand-guidelines', title: 'Brand Guidelines', desc: 'Codify color, type, and voice into a guide the whole team can follow, from lockups to tone-of-voice examples.', cats: ['Design', 'Strategy'], chips: ['Design', 'Strategy'], icon: 'book' },
      { kind: 'color-palette', title: 'Color Palette', desc: 'Generate accessible, on-brand palettes from a single reference image, with contrast checked against WCAG standards.', cats: ['Design', 'Creative'], chips: ['Design', 'Creative'], icon: 'paintBucket' },
      { kind: 'icon-set', title: 'Icon Set', desc: 'Produce a consistent icon family that matches your existing style, sized and exported for every screen.', cats: ['Design', 'Creative'], chips: ['Design', 'Creative'], icon: 'gridFour' },
      { kind: 'photography-brief', title: 'Photography Brief', desc: 'Spec a shoot — mood, framing, and must-haves — before the crew arrives, so nothing gets improvised on set.', cats: ['Creative', 'Strategy'], chips: ['Creative', 'Strategy'], icon: 'camera' },
      { kind: '3d-render', title: '3D Render', desc: 'Turn a product spec into photoreal 3D renders for every angle, lit and staged for the campaign\'s hero shots.', cats: ['Design', 'Production'], chips: ['Design', 'Production'], icon: 'cube' },
      { kind: 'motion-graphics', title: 'Motion Graphics', desc: 'Animate a static deck or logo into a short, loopable motion piece, ready for a title card or social loop.', cats: ['Creative', 'Production'], chips: ['Creative', 'Production'], icon: 'filmStrip' },
      { kind: 'cutdowns', title: 'Cutdowns', desc: 'Resize and retime a hero spot into every placement length you need, from a 30-second cut to a 6-second bumper.', cats: ['Production', 'Social'], chips: ['Production', 'Social'], icon: 'scissors' },
      { kind: 'subtitles', title: 'Subtitles', desc: 'Generate and sync accurate captions across every language you ship, timed frame-by-frame to the source audio.', cats: ['Production', 'Operations'], chips: ['Production', 'Operations'], icon: 'textT' },
      { kind: 'media-plan', title: 'Media Plan', desc: 'Sequence channels and flight dates into a plan stakeholders can approve, with budget split across each phase.', cats: ['Strategy', 'Operations'], chips: ['Strategy', 'Operations'], icon: 'calendar' },
      { kind: 'budget', title: 'Budget', desc: 'Model campaign spend across channels and phases in one working sheet, flagging overages before they happen.', cats: ['Operations', 'Strategy'], chips: ['Operations', 'Strategy'], icon: 'currencyDollar' },
      { kind: 'timeline', title: 'Timeline', desc: 'Lay out phases, owners, and dependencies for the whole engagement, from kickoff through final delivery.', cats: ['Operations', 'Strategy'], chips: ['Operations', 'Strategy'], icon: 'clock' },
      { kind: 'competitive-analysis', title: 'Competitive Analysis', desc: 'Benchmark a brand against its category set across messaging and spend, surfacing gaps worth exploiting.', cats: ['Research', 'Strategy'], chips: ['Research', 'Strategy'], icon: 'chartPieSlice' },
      { kind: 'trend-report', title: 'Trend Report', desc: 'Surface what\'s shifting in a category before it shows up in a brief, backed by sourced data and examples.', cats: ['Research', 'Strategy'], chips: ['Research', 'Strategy'], icon: 'trendUp' },
      { kind: 'survey', title: 'Survey', desc: 'Draft and field a survey instrument built for a clean, usable dataset, with logic branching and skip patterns.', cats: ['Research', 'Operations'], chips: ['Research', 'Operations'], icon: 'listBullets' },
      { kind: 'seo-audit', title: 'SEO Audit', desc: 'Crawl a site and flag the fixes that move organic ranking fastest, prioritized by effort and expected impact.', cats: ['Research', 'Operations'], chips: ['Research', 'Operations'], icon: 'magnifyingGlass' },
      { kind: 'ab-test', title: 'A/B Test', desc: 'Design a test plan with a real hypothesis and a clean read on results, sized for statistical significance.', cats: ['Research', 'Operations'], chips: ['Research', 'Operations'], icon: 'gitBranch' },
      { kind: 'analytics-dashboard', title: 'Analytics Dashboard', desc: 'Roll campaign metrics into a live dashboard built for a weekly readout, refreshed automatically as data lands.', cats: ['Research', 'Operations'], chips: ['Research', 'Operations'], icon: 'chartBar' },
      { kind: 'kpi-report', title: 'KPI Report', desc: 'Turn raw performance data into a report stakeholders skim in a minute, with the trends called out up front.', cats: ['Research', 'Operations'], chips: ['Research', 'Operations'], icon: 'chartLine' },
      { kind: 'pitch-deck', title: 'Pitch Deck', desc: 'Structure a pitch narrative and lay it into deck-ready slides, from the opening hook to the closing ask.', cats: ['Strategy', 'Design'], chips: ['Strategy', 'Design'], icon: 'presentation' }
    ];

    // Tabula's own fixed category vocabulary (its toolbar's real
    // filter pills — Creative/Copy/Design/Strategy/Production/Social/
    // Research/Operations — minus "Bookmarked", a state filter with no
    // analog here since this overlay has no bookmarking feature).
    const CATEGORIES = ['Creative', 'Copy', 'Design', 'Strategy', 'Production', 'Social', 'Research', 'Operations'];

    let skillsOverlayEl = null;
    let skillsActiveCat = 'all';

    function skillsReducedMotion() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    // Same measured-off-#canvas technique as #ptEnvOverlay's own
    // applyEnvPaneBounds() (in turn ported from this shell's own
    // placeVeil()/#caDropVeil) — never hardcoded.
    function applySkillsPaneBounds() {
      const canvas = document.getElementById('canvas');
      if (!canvas || !skillsOverlayEl) return;
      const rect = canvas.getBoundingClientRect();
      skillsOverlayEl.style.top = rect.top + 'px';
      skillsOverlayEl.style.left = rect.left + 'px';
      skillsOverlayEl.style.width = rect.width + 'px';
      skillsOverlayEl.style.height = rect.height + 'px';
    }
    window.addEventListener('resize', () => {
      if (skillsOverlayEl && skillsOverlayEl.classList.contains('is-open')) applySkillsPaneBounds();
    });
    // Capture phase + stopPropagation — the S68/env-overlay technique:
    // beats the shell's own bubble-phase global Escape/closeAllMenus
    // listener so Escape here closes ONLY this overlay.
    function onSkillsOverlayKeydown(e) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      closeSkillsOverlay();
    }
    // Outside-close — the shell's own established popover convention
    // (closeAllPtSheetPopovers()'s single always-on bubble-phase
    // document click listener), extended to this full-pane overlay:
    // a click landing outside the overlay AND outside its own trigger
    // closes it. Attached once at setup, no-ops when not open.
    function onSkillsOutsideClick(e) {
      if (!skillsOverlayEl || !skillsOverlayEl.classList.contains('is-open')) return;
      if (skillsOverlayEl.contains(e.target)) return;
      if (e.target === trigger || trigger.contains(e.target)) return;
      closeSkillsOverlay();
    }
    document.addEventListener('click', onSkillsOutsideClick);

    function triggerLiveSkill(name) {
      if (name === 'Media') {
        const t = document.getElementById('ptModeTile');
        if (t) t.click();
        return;
      }
      const t = document.querySelector('.chat-aux-mode-tile[data-mode="' + name + '"]');
      if (t) t.click();
    }
    // Same deduped "<Name> — coming to this canvas." stub the old
    // catalog chips used (initHatCatalog(), pre-8/25).
    function postComingSoon(name) {
      const line = name + ' — coming to this canvas.';
      const bots = document.querySelectorAll('#chatStream .msg.bot');
      const last = bots[bots.length - 1];
      if (last && last.textContent.trim() === line) return;
      addCanvasAssistantMsg(line);
    }

    function buildSkillsOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'pt-skills-overlay';
      overlay.id = 'ptSkillsOverlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="pt-env-head">' +
          '<div class="pt-env-title-wrap">' +
            '<h2 class="pt-env-title" id="ptSkillsHeadTitle">All skills</h2>' +
            '<span class="pt-env-count-tag">' + TABULA_SKILLS.length + ' skills</span>' +
          '</div>' +
          '<button class="pt-editor-back" type="button" id="ptSkillsBackBtn" aria-label="Back">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M5 12l6-6M5 12l6 6"/></svg>' +
            'Back' +
          '</button>' +
        '</div>' +
        '<div class="pt-skills-toolbar">' +
          '<label class="pt-skills-search">' +
            '<span class="pt-skills-search-icon" aria-hidden="true">' + SKILL_ICONS.magnifyingGlass + '</span>' +
            '<input type="text" class="pt-skills-search-input" id="ptSkillsSearchInput" placeholder="Search skills…" autocomplete="off" aria-label="Search skills">' +
          '</label>' +
          '<div class="pt-skills-filters" id="ptSkillsFilters">' +
            '<button type="button" class="pt-skills-filter is-active" data-cat="all">All</button>' +
            CATEGORIES.map(c => '<button type="button" class="pt-skills-filter" data-cat="' + c + '">' + c + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="pt-env-body"><div class="pt-skills-grid" id="ptSkillsGrid"></div><p class="pt-skills-empty" id="ptSkillsEmpty">Nothing matches.</p></div>';
      document.body.appendChild(overlay);

      const grid = overlay.querySelector('#ptSkillsGrid');
      grid.innerHTML = TABULA_SKILLS.map(s =>
        '<button type="button" class="pt-skill-card" data-kind="' + s.kind + '">' +
          '<div class="pt-skill-head">' +
            '<span class="pt-skill-icon" aria-hidden="true">' + SKILL_ICONS[s.icon] + '</span>' +
            '<div class="pt-skill-head-text">' +
              '<div class="pt-skill-tags">' + s.chips.map(c => '<span class="pt-skill-tag">' + c + '</span>').join('') + '</div>' +
              '<div class="pt-skill-title">' + s.title + (s.live === 'Media' ? '<span class="pt-chip-dot" id="ptSkillMediaDot" aria-hidden="true"></span>' : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<p class="pt-skill-desc">' + s.desc + '</p>' +
        '</button>'
      ).join('');

      // Capped per-card stagger reveal — same S68-derived technique
      // #ptEnvGrid's own tiles use (min(i*40,400)ms), tightened to
      // 22ms/card since there are more than twice as many cards here.
      const reduce = skillsReducedMotion();
      Array.prototype.forEach.call(grid.querySelectorAll('.pt-skill-card'), (card, i) => {
        const delay = reduce ? 0 : Math.min(i * 22, 400);
        setTimeout(() => card.classList.add('is-in'), delay);
      });

      const searchInput = overlay.querySelector('#ptSkillsSearchInput');
      const filtersEl = overlay.querySelector('#ptSkillsFilters');
      const emptyEl = overlay.querySelector('#ptSkillsEmpty');

      // Search matches by name only (per spec); category pills filter
      // on each card's own data — both live, both compose together.
      function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();
        let visible = 0;
        Array.prototype.forEach.call(grid.querySelectorAll('.pt-skill-card'), (card, i) => {
          const rec = TABULA_SKILLS[i];
          const matchesCat = skillsActiveCat === 'all' || rec.cats.indexOf(skillsActiveCat) !== -1;
          const matchesSearch = !q || rec.title.toLowerCase().indexOf(q) !== -1;
          const show = matchesCat && matchesSearch;
          card.classList.toggle('is-filtered-out', !show);
          if (show) visible++;
        });
        emptyEl.classList.toggle('is-shown', visible === 0);
      }
      searchInput.addEventListener('input', applyFilters);
      filtersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-skills-filter');
        if (!btn) return;
        skillsActiveCat = btn.getAttribute('data-cat');
        Array.prototype.forEach.call(filtersEl.querySelectorAll('.pt-skills-filter'), (b) => b.classList.toggle('is-active', b === btn));
        applyFilters();
      });

      // Never a dead end: a card matching a live skill in this canvas
      // closes the overlay and triggers it exactly as clicking that
      // skill directly would (same click-through the mode tiles/Media
      // chip already wire up); any other card posts the deduped stub.
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.pt-skill-card');
        if (!card) return;
        const kind = card.getAttribute('data-kind');
        const rec = TABULA_SKILLS.filter((s) => s.kind === kind)[0];
        if (!rec) return;
        closeSkillsOverlay();
        if (rec.live) triggerLiveSkill(rec.live);
        else postComingSoon(rec.title);
      });

      overlay.querySelector('#ptSkillsBackBtn').addEventListener('click', closeSkillsOverlay);

      skillsOverlayEl = overlay;
    }

    // Exposed so the topnav "+" button's Create screen
    // (initCreateScreen(), below) can build its own Apps/Core-Skills/
    // Skills sections from this EXACT data — never a second, drifting
    // copy of the same 44 cards. Plain window properties (not a
    // custom event/module system), matching this file's own existing
    // seam philosophy (window._caTakeAttachments, window._ptOpenMotionTeaser, etc).
    window._ptTabulaSkills = TABULA_SKILLS;
    window._ptSkillIcons = SKILL_ICONS;
    window._ptTriggerLiveSkill = triggerLiveSkill;
    window._ptPostSkillComingSoon = postComingSoon;

    function openSkillsOverlay() {
      if (!skillsOverlayEl) buildSkillsOverlay();
      // No persistence — every open resets to "All" with an empty
      // search, matching every other overlay/hat state in this file.
      skillsActiveCat = 'all';
      const searchInput = skillsOverlayEl.querySelector('#ptSkillsSearchInput');
      if (searchInput) searchInput.value = '';
      Array.prototype.forEach.call(skillsOverlayEl.querySelectorAll('.pt-skills-filter'), (b) => b.classList.toggle('is-active', b.getAttribute('data-cat') === 'all'));
      Array.prototype.forEach.call(skillsOverlayEl.querySelectorAll('.pt-skill-card'), (c) => c.classList.remove('is-filtered-out'));
      const emptyEl = skillsOverlayEl.querySelector('#ptSkillsEmpty');
      if (emptyEl) emptyEl.classList.remove('is-shown');
      applySkillsPaneBounds();
      skillsOverlayEl.classList.remove('is-leaving');
      skillsOverlayEl.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => skillsOverlayEl.classList.add('is-open'));
      document.addEventListener('keydown', onSkillsOverlayKeydown, true);
    }
    function closeSkillsOverlay() {
      if (!skillsOverlayEl) return;
      skillsOverlayEl.classList.add('is-leaving');
      skillsOverlayEl.classList.remove('is-open');
      skillsOverlayEl.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onSkillsOverlayKeydown, true);
      const dur = skillsReducedMotion() ? 0 : 260;
      setTimeout(() => { if (skillsOverlayEl) skillsOverlayEl.classList.remove('is-leaving'); }, dur);
    }

    // Bryan, 9/1: "See all skills" launches the Create page and auto-scrolls
    // to its Skills section — the real catalog, not this prototype's own
    // overlay. `.rule-skills-2` is the full Skills catalog rule (the plain
    // `.rule-skills` is Tabula's "Core Skills" — its own JS disambiguates
    // them the same way). openSkillsOverlay + all its machinery is KEPT as
    // the fallback for the case where the Create screen isn't available,
    // so this can never become a dead click.
    trigger.addEventListener('click', () => {
      if (typeof window._ptOpenCreateScreen === 'function') {
        // Lands on CORE SKILLS (Text/Graphics/Video/Audio) with the
        // toolbar pinned above it — the exact scroll position in Bryan's
        // 9/1 reference shot. `.rule-skills:not(.rule-skills-2)` is
        // Tabula's own way of naming that section (see its JS ~L4648);
        // `.rule-skills-2` is the separate Skills catalog further down.
        window._ptOpenCreateScreen({ scrollTo: '.section-rule.rule-skills:not(.rule-skills-2)' });
      } else {
        openSkillsOverlay();
      }
    });
  })();

  // --- Create screen (#ptCreateScreen) — the topnav "+" button's
  //     app-level surface, ported from Tabula's own Create page: hero
  //     "Create" title, search + category filter toolbar, three
  //     section-grouped grids (Apps / Core Skills / Skills). Shares
  //     #canvas's own grid cell exactly like #ptEditor/#ptMotion
  //     (openPainterEditor/openMotionTeaser above are its direct
  //     pattern reference — same data-visible contract, same
  //     bubble-phase Escape-if-visible listener, same Back button
  //     wiring) rather than the smaller #ptEnvOverlay/#ptSkillsOverlay
  //     measured-rect contract, since this reads as a full canvas-pane
  //     screen, not a picker inside a flow. Never opens a browser tab
  //     or touches the header's canvas tab strip — the + button just
  //     reveals this in place. Card content is NOT duplicated: this
  //     reads window._ptTabulaSkills/_ptSkillIcons (exposed by
  //     initSkillsOverlay() above) — one data source, two
  //     presentations. Plain top-level IIFE, independent of Painter/
  //     Media, same seam as initSkillsOverlay() itself. ---
  (function initCreateScreen() {
    const trigger = document.getElementById('ptCreateBtn');
    const screenEl = document.getElementById('ptCreateScreen');
    if (!trigger || !screenEl) return;

    const SKILLS = window._ptTabulaSkills || [];
    const ICONS = window._ptSkillIcons || {};
    // Section grouping — Tabula's own three section-rules verbatim:
    // Apps (Canvas, Workflow), Core Skills (Text, Graphics, Video,
    // Audio), Skills (the full remaining catalog).
    const APPS_KINDS = ['canvas', 'workflow'];
    const CORE_KINDS = ['text', 'graphics', 'video', 'audio'];

    const gridApps = document.getElementById('ptCreateGridApps');
    const gridCore = document.getElementById('ptCreateGridCore');
    const gridSkills = document.getElementById('ptCreateGridSkills');
    const sectionApps = document.getElementById('ptCreateSectionApps');
    const sectionCore = document.getElementById('ptCreateSectionCore');
    const sectionSkills = document.getElementById('ptCreateSectionSkills');
    const emptyEl = document.getElementById('ptCreateEmpty');
    const searchInput = document.getElementById('ptCreateSearchInput');
    const filtersEl = document.getElementById('ptCreateFilters');
    const backBtn = document.getElementById('ptCreateBack');
    const bodyEl = document.getElementById('ptCreateBody');

    let built = false;
    let activeCat = 'all';

    function reducedMotion() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    // Identical card anatomy to #ptSkillsOverlay's own .pt-skill-card
    // markup (white icon tile + accent glyph, Fira Code chip tags,
    // title, description, one click target) — same component, just
    // built into three grids instead of one.
    function cardHTML(s) {
      return '<button type="button" class="pt-skill-card" data-kind="' + s.kind + '">' +
          '<div class="pt-skill-head">' +
            '<span class="pt-skill-icon" aria-hidden="true">' + (ICONS[s.icon] || '') + '</span>' +
            '<div class="pt-skill-head-text">' +
              '<div class="pt-skill-tags">' + s.chips.map(c => '<span class="pt-skill-tag">' + c + '</span>').join('') + '</div>' +
              '<div class="pt-skill-title">' + s.title + (s.live === 'Media' ? '<span class="pt-chip-dot" aria-hidden="true"></span>' : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<p class="pt-skill-desc">' + s.desc + '</p>' +
        '</button>';
    }

    function buildGrids() {
      if (built) return;
      const apps = [], core = [], rest = [];
      SKILLS.forEach((s) => {
        if (APPS_KINDS.indexOf(s.kind) !== -1) apps.push(s);
        else if (CORE_KINDS.indexOf(s.kind) !== -1) core.push(s);
        else rest.push(s);
      });
      if (gridApps) gridApps.innerHTML = apps.map(cardHTML).join('');
      if (gridCore) gridCore.innerHTML = core.map(cardHTML).join('');
      if (gridSkills) gridSkills.innerHTML = rest.map(cardHTML).join('');
      built = true;
    }

    // Capped per-card stagger reveal — same S68-derived technique the
    // skills overlay's own grid uses (min(i*22,400)ms), run once per
    // open (not once ever) so re-opening always replays the reveal.
    function revealCards() {
      const reduce = reducedMotion();
      const cards = screenEl.querySelectorAll('.pt-skill-card');
      Array.prototype.forEach.call(cards, (card, i) => {
        card.classList.remove('is-in');
        const delay = reduce ? 0 : Math.min(i * 18, 420);
        setTimeout(() => card.classList.add('is-in'), delay);
      });
    }

    // Search matches by title only (same spec as the skills overlay);
    // category pills filter on each card's own data; both compose
    // live across all three sections at once. A section with zero
    // visible cards folds away entirely rather than showing an empty
    // "Apps"/"Core Skills"/"Skills" label over nothing.
    function applyFilters() {
      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      let totalVisible = 0;
      [[sectionApps, gridApps], [sectionCore, gridCore], [sectionSkills, gridSkills]].forEach((pair) => {
        const section = pair[0], grid = pair[1];
        if (!section || !grid) return;
        let visible = 0;
        Array.prototype.forEach.call(grid.querySelectorAll('.pt-skill-card'), (card) => {
          const kind = card.getAttribute('data-kind');
          const rec = SKILLS.filter((s) => s.kind === kind)[0];
          if (!rec) return;
          const matchesCat = activeCat === 'all' || rec.cats.indexOf(activeCat) !== -1;
          const matchesSearch = !q || rec.title.toLowerCase().indexOf(q) !== -1;
          const show = matchesCat && matchesSearch;
          card.classList.toggle('is-filtered-out', !show);
          if (show) visible++;
        });
        section.classList.toggle('is-empty', visible === 0);
        totalVisible += visible;
      });
      if (emptyEl) emptyEl.classList.toggle('is-shown', totalVisible === 0);
    }

    // No persistence — every open resets to "All" with an empty
    // search, matching every other overlay/hat state in this file.
    function resetFilters() {
      activeCat = 'all';
      if (searchInput) searchInput.value = '';
      if (filtersEl) {
        Array.prototype.forEach.call(filtersEl.querySelectorAll('.pt-skills-filter'), (b) => b.classList.toggle('is-active', b.getAttribute('data-cat') === 'all'));
      }
      Array.prototype.forEach.call(screenEl.querySelectorAll('.pt-skill-card'), (c) => c.classList.remove('is-filtered-out'));
      [sectionApps, sectionCore, sectionSkills].forEach((s) => { if (s) s.classList.remove('is-empty'); });
      if (emptyEl) emptyEl.classList.remove('is-shown');
    }

    // --- The exact Tabula file, embedded (Bryan, 8/31). The rebuilt
    //     grids above are retired (their markup is [hidden]) but left
    //     intact rather than deleted: buildGrids/resetFilters/revealCards
    //     and the shared _ptTabulaSkills data still feed the chat hat's
    //     own "See all skills" overlay, so removing them here would be a
    //     wider refactor than this change earns. Frame src is deferred to
    //     first open (data-src → src) so a 266KB document isn't parsed on
    //     every page load for a screen most sessions never open.
    const frameEl = document.getElementById('ptCreateFrame');
    let frameArmed = false;
    function armFrame() {
      if (!frameEl || frameArmed) return;
      frameArmed = true;
      frameEl.addEventListener('load', () => {
        // Same-origin: hide ONLY the nested file's own topnav so our
        // topnav stays the single nav and Tabula fills everything
        // below it. Wrapped — a cross-origin move would throw here,
        // and a failed cosmetic tweak must never break the screen.
        try {
          const d = frameEl.contentDocument;
          if (!d) return;
          const st = d.createElement('style');
          // Hiding the nested topnav also has to reclaim the 48px every
          // rule inside that file reserves FOR it — otherwise those
          // offsets hang off nothing and leave a gap (Bryan, 9/1: "the
          // sub nav has a big gap between it and the main nav").
          // Both offenders, found by grepping `top: 48px` in the file:
          //   .skills-toolbar  — sticky sub-nav, `top: 48px`
          //   .viewport-stage  — fixed app stage, `top: 48px`
          // Our own 48px topnav sits directly above the frame, so 0 here
          // parks each one flush under the real nav, same as intended.
          st.textContent =
            '.topnav{display:none !important;}' +
            // Bryan, 9/1: equal air above/below the search row. The file
            // ships `padding: 9px … 18px` on the band — measured 9px above
            // the row vs 18px below — which reads balanced in Tabula only
            // because its own sticky nav sat on top of that 9px. With the
            // nav gone the band pins flush at 0 and the asymmetry shows,
            // so match the top to the bottom. Injected here, never edited
            // into tabula/index.html — that copy stays byte-identical.
            '.skills-toolbar{top:0 !important;padding-top:18px !important;}' +
            '.viewport-stage{top:0 !important;}';
          d.head.appendChild(st);
        } catch (err) { /* cosmetic only — leave the file as-is */ }
      });
      frameEl.src = frameEl.getAttribute('data-src') || 'tabula/index.html';
    }
    // Scroll the embedded file to one of its own sections. Same-origin,
    // so this reaches into the frame's document; if the frame hasn't
    // loaded yet (first open) it waits for load, since scrollIntoView on
    // a not-yet-parsed document is a silent no-op.
    function scrollFrameTo(sel) {
      if (!frameEl) return;
      const go = () => {
        try {
          const d = frameEl.contentDocument;
          const target = d && d.querySelector(sel);
          if (!target) return;
          // scrollIntoView alone parks the section rule at y=0 — directly
          // UNDER the file's own sticky toolbar, which then hides the
          // "CORE SKILLS" label. Offset by the toolbar's real measured
          // height (plus a little air) so the label clears it, matching
          // Bryan's 9/1 reference shot.
          const bar = d.querySelector('.skills-toolbar');
          // +24, not +12: the band is measured BEFORE it pins, and it
          // gains its own top padding once stuck — at +12 the label
          // landed 4px behind the bar's bottom edge (measured).
          const offset = (bar ? bar.getBoundingClientRect().height : 0) + 24;
          const scroller = d.scrollingElement || d.documentElement;
          const y = target.getBoundingClientRect().top + scroller.scrollTop - offset;
          scroller.scrollTop = Math.max(0, y);
        } catch (err) { /* cosmetic — never break the screen over a scroll */ }
      };
      let ready = false;
      try {
        const d = frameEl.contentDocument;
        ready = !!(d && d.readyState === 'complete' && d.querySelector(sel));
      } catch (err) { ready = false; }
      // 60ms after load lets the file's own entrance settle before we jump.
      if (ready) go(); else frameEl.addEventListener('load', () => setTimeout(go, 60), { once: true });
    }
    function openCreateScreen(opts) {
      armFrame();
      screenEl.setAttribute('data-visible', '1');
      screenEl.setAttribute('aria-hidden', 'false');
      // Flags the selected-surface swap in the topnav (see the
      // body.pt-create-open rules) — the canvas tab de-selects, the +
      // takes the selected backing.
      document.body.classList.add('pt-create-open');
      if (bodyEl) bodyEl.scrollTop = 0;
      if (opts && opts.scrollTo) scrollFrameTo(opts.scrollTo);
      // Y — another canvas-column takeover (initPainterSkill's own
      // window._pt* cross-IIFE hook; this screen isn't in that closure).
      if (typeof window._ptSyncMediaTopbar === 'function') window._ptSyncMediaTopbar();
    }
    // Cross-IIFE hook — the chat hat's "See all skills" row (wired in
    // initSkillsOverlay above) opens this screen instead of its own
    // overlay, per Bryan 9/1. Same window._pt* seam every other
    // cross-closure call in this file uses.
    window._ptOpenCreateScreen = openCreateScreen;
    function closeCreateScreen() {
      screenEl.setAttribute('data-visible', '0');
      screenEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('pt-create-open');
      if (typeof window._ptSyncMediaTopbar === 'function') window._ptSyncMediaTopbar();
    }

    // The + toggles: with the topbar gone it's also the way back out.
    function toggleCreateScreen() {
      if (screenEl.getAttribute('data-visible') === '1') closeCreateScreen();
      else openCreateScreen();
    }
    trigger.addEventListener('click', toggleCreateScreen);
    // Home takes the user back (Bryan, 8/31 — "no need for new ui").
    // The topnav's existing Home cell (.nav-icon-cell--bordered, stock
    // shell markup, previously inert) is the way out of this screen;
    // nothing new was added for it. Delegated + gated on data-visible so
    // Home stays a no-op everywhere else, exactly as it was before.
    document.addEventListener('click', (e) => {
      if (screenEl.getAttribute('data-visible') !== '1') return;
      // Home, or the header's Canvas tab (Bryan, 9/1: "you should be able
      // to click the canvas button in the main nav to take you back to the
      // full canvas experience that you just came from"). Both are stock
      // shell elements — no new UI. The tab reads as de-selected while
      // this screen is up (body.pt-create-open), so clicking it re-selects
      // the canvas, which is exactly what closing this screen does.
      if (e.target.closest('.nav-icon-cell--bordered') || e.target.closest('.topnav .tab')) {
        closeCreateScreen();
      }
    });
    // The add-tab div has no native click semantics — give it the
    // same Enter/Space activation every other role="button" control
    // in this shell gets from being a real <button>.
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCreateScreen(); }
    });
    if (backBtn) backBtn.addEventListener('click', closeCreateScreen);
    // Bubble-phase, gated on data-visible — the same pattern
    // initPainterEditor()/initMotionTeaser() use below, not the
    // capture-phase stopPropagation trick the smaller overlays need
    // (this screen has no sibling popovers layered on top of it to
    // protect against).
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (screenEl.getAttribute('data-visible') === '1') closeCreateScreen();
    });

    if (filtersEl) {
      filtersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-skills-filter');
        if (!btn) return;
        activeCat = btn.getAttribute('data-cat');
        Array.prototype.forEach.call(filtersEl.querySelectorAll('.pt-skills-filter'), (b) => b.classList.toggle('is-active', b === btn));
        applyFilters();
      });
    }
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    // Never a dead end: a card matching a live skill in this canvas
    // (Graphics/Video/Audio/Media, via the shared TABULA_SKILLS
    // `live` flag) closes the screen and triggers it exactly as
    // clicking that skill directly would; any other card posts the
    // same deduped "<Name> — coming to this canvas." stub the "See
    // all skills" overlay already uses.
    screenEl.addEventListener('click', (e) => {
      const card = e.target.closest('.pt-skill-card');
      if (!card) return;
      const kind = card.getAttribute('data-kind');
      const rec = SKILLS.filter((s) => s.kind === kind)[0];
      if (!rec) return;
      closeCreateScreen();
      if (rec.live && typeof window._ptTriggerLiveSkill === 'function') window._ptTriggerLiveSkill(rec.live);
      else if (typeof window._ptPostSkillComingSoon === 'function') window._ptPostSkillComingSoon(rec.title);
    });

    // QA deep link — ?state=create-screen opens straight to this
    // screen, same "seed state, no replay" contract as every other
    // ?state= value in this file.
    try {
      if (new URLSearchParams(location.search).get('state') === 'create-screen') openCreateScreen();
    } catch (e) {}
  })();

  function send() {
    const v0 = input.value.trim();
    /* Attachments allow a text-free send — a pasted screenshot alone
       is a complete message. */
    const atts = (typeof window._caTakeAttachments === 'function') ? window._caTakeAttachments() : [];
    if (!v0 && !atts.length) return;
    // Z.2.1(b) — a dropped/pasted .csv/.xlsx/.pdf becomes a "Media
    // plan" chip (addFile below flags it isMediaPlan) and resolves to
    // the fixture on send, with the same two chat lines ?state=plan
    // seeds — demoware, no parsing, so whatever was actually typed is
    // set aside in favor of that canonical line.
    const planAtt = atts.filter((a) => a.isMediaPlan)[0];
    const v = planAtt ? 'Here’s the media plan' : v0;
    addUserMsg(v, atts);
    input.value = '';
    /* Collapse the composer back to its baseline once the prompt
       is gone — otherwise it stays at the expanded height. */
    if (typeof window._c4AutoSizeComposer === 'function') {
      window._c4AutoSizeComposer();
    }
    if (planAtt) {
      // Same cross-closure seam as window._ptMediaSettingsSubmit just
      // below — the plan lives in the Painter closure, this one only
      // took the attachment and posted the user's own bubble.
      if (typeof window._ptResolveMediaPlanArrival === 'function') window._ptResolveMediaPlanArrival();
      return;
    }
    /* NEW MEDIA SETTINGS (the Media step's opening row) — a brief sent
       while those pills are up IS the generate trigger: the settings
       own the size/count/template, this message is the brief, and the
       concept sheet lands straight on the canvas. Returns true only
       when that row is actually mounted, so every other send falls
       through to the generic ack below unchanged. Same window._pt*
       cross-closure seam the rest of this file uses. */
    if (typeof window._ptMediaSettingsSubmit === 'function' && window._ptMediaSettingsSubmit(atts, v)) return;
    const n = atts.length;
    const ack = n
      ? `Got it — ${n === 1 ? 'your file is' : n + ' files are'} in. I'll work ${n === 1 ? 'it' : 'them'} into the canvas.`
      : "Got it. I'll work on that and update the canvas.";
    setTimeout(() => addBotMsg(ack), 600);
  }
  /* Auto-size composer to fit the textarea's content. Textarea is
     flex:1 inside the composer normally, so scrollHeight would
     reflect the stretched flex size — not the content's natural
     height. Workaround: temporarily disable flex on the textarea
     to measure, then restore. The composer's height is then set
     to fit (content + actions row + 28px composer padding), and
     the textarea (back on flex:1) fills the new composer height.
     Clamped at the 130px CSS floor and 70vh ceiling. */
  function autoSizeComposer() {
    const composer = document.querySelector('.composer');
    if (!composer || !input) return;
    /* Snapshot + neutralize flex so scrollHeight reads real content. */
    const prevFlex = input.style.flex;
    const prevHeight = input.style.height;
    input.style.flex = '0 0 auto';
    input.style.height = 'auto';
    const contentH = input.scrollHeight;
    /* Restore textarea to flex:1 fill behavior. */
    input.style.flex = prevFlex;
    input.style.height = prevHeight;
    /* Set composer height to fit content + chrome. The attachment
       chip row (when populated) sits above the textarea and carries
       an 8px margin-bottom — both counted here so chips never eat
       into the textarea's own space. */
    const actions = composer.querySelector('.composer-actions');
    const actionsH = actions ? actions.offsetHeight : 0;
    const chipsRow = composer.querySelector('.ca-attach-row');
    const chipsH = (chipsRow && chipsRow.offsetHeight) ? chipsRow.offsetHeight + 8 : 0;
    const total = contentH + actionsH + chipsH + 28;
    const MAX = Math.round(window.innerHeight * 0.7);
    composer.style.height = Math.max(130, Math.min(MAX, total)) + 'px';
  }
  input.addEventListener('input', autoSizeComposer);
  window.addEventListener('resize', autoSizeComposer);
  window._c4AutoSizeComposer = autoSizeComposer;

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // --- add-menu toggle ---
  const addBtn = document.getElementById('addBtn');
  const addMenu = document.getElementById('addMenu');
  function setAddMenu(open) {
    if (open && typeof window._closeOtherChatMenus === 'function') {
      window._closeOtherChatMenus('addMenu');
    }
    addBtn.classList.toggle('open', open);
    addMenu.classList.toggle('open', open);
    addBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    addMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setAddMenu(!addBtn.classList.contains('open'));
  });
  addMenu.addEventListener('click', (e) => {
    if (e.target.closest('.add-menu-item')) setAddMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!addBtn.contains(e.target) && !addMenu.contains(e.target)) setAddMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addBtn.classList.contains('open')) setAddMenu(false);
  });

  // --- chat attachments: paste / drag-drop / picker (per an earlier ask) ----
  //     Paste (⌘V) or drop ANY file anywhere in the window and it lands
  //     as a chip in the composer; send renders it in the bubble.
  (function initChatAttachments() {
    const row = document.getElementById('caAttachRow');
    const composerEl = document.querySelector('.composer');
    const chatEl = document.querySelector('.chat');
    if (!row || !composerEl || !chatEl) return;

    const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* File-type → badge class + short label (extension, max 4 chars). */
    function fileMeta(name, mime) {
      const ext = (name.indexOf('.') !== -1 ? name.split('.').pop() : '').toLowerCase();
      const label = (ext || 'file').slice(0, 4).toUpperCase();
      const m = mime || '';
      if (m.startsWith('video/') || m.startsWith('audio/') || /^(mp4|mov|webm|mp3|wav|aiff|m4a)$/.test(ext)) return { cls: 'ca-badge-av', label };
      if (ext === 'pdf') return { cls: 'ca-badge-pdf', label };
      if (/^(doc|docx|txt|md|rtf|pages)$/.test(ext)) return { cls: 'ca-badge-doc', label };
      if (/^(xls|xlsx|csv|numbers|tsv)$/.test(ext)) return { cls: 'ca-badge-sheet', label };
      if (/^(ppt|pptx|key)$/.test(ext)) return { cls: 'ca-badge-deck', label };
      return { cls: 'ca-badge-file', label };
    }
    function fmtSize(bytes) {
      if (!(bytes >= 0)) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /* One array is the source of truth; full rebuild on every change
       (the entrance animation replays for the whole row — accepted
       trade, no per-chip bookkeeping). */
    let atts = [];
    let seq = 0;
    function render() {
      row.innerHTML = atts.map((a) => {
        // §BY — a picked video keeps the exact poster+play-glyph
        // treatment the Imagery popover's own thumb already uses
        // (.pt-editor-swap-thumb.is-video::after, 22-hat-c-wizard.css)
        // just wrapped so the ::after has a non-replaced box to sit
        // on (a <video>/<img> can't carry generated content itself).
        const lead = a.kind === 'image'
          ? '<img class="ca-chip-thumb" src="' + a.url + '" alt="">'
          : a.kind === 'video'
            ? '<span class="ca-chip-thumb-wrap is-video"><video class="ca-chip-thumb" src="' + a.url + '" muted loop playsinline preload="metadata" disablepictureinpicture></video></span>'
            : '<span class="ca-chip-badge ' + a.badgeCls + '">' + a.badgeLabel + '</span>';
        return '<span class="ca-chip" data-ca-id="' + a.id + '">' + lead +
          '<span class="ca-chip-name">' + escapeHTML(a.name) + '</span>' +
          (a.sizeLabel ? '<span class="ca-chip-size">' + a.sizeLabel + '</span>' : '') +
          '<button type="button" class="ca-chip-remove" data-ca-remove="' + a.id + '" aria-label="Remove attachment">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button></span>';
      }).join('');
      row.setAttribute('aria-hidden', atts.length ? 'false' : 'true');
      if (typeof window._c4AutoSizeComposer === 'function') window._c4AutoSizeComposer();
    }
    function addFile(file, opts) {
      opts = opts || {};
      const isImage = (file.type || '').startsWith('image/');
      const id = 'ca' + (++seq);
      const meta = fileMeta(file.name || '', file.type || '');
      // Z.2.1(b) — a dropped/pasted .csv/.xlsx/.pdf is always the demo
      // media plan (no parsing): renamed here so the chip reads
      // "Media plan · Coast Road Q4 display.xlsx" both before send
      // (this composer's own row) and after (the sent bubble, via
      // _caBuildMsgAttachments below) — one rename covers paste, drop
      // and the file picker, since all three funnel through addFile.
      const ext = (file.name || '').split('.').pop().toLowerCase();
      const isMediaPlan = !isImage && /^(csv|xlsx|pdf)$/.test(ext);
      const a = {
        id: id,
        kind: isImage ? 'image' : 'file',
        url: isImage ? URL.createObjectURL(file) : '',
        name: isMediaPlan ? 'Media plan · Coast Road Q4 display.xlsx' : (file.name || (isImage ? 'Pasted image' : 'File')),
        sizeLabel: fmtSize(file.size),
        badgeCls: meta.cls,
        badgeLabel: meta.label,
        revoke: isImage,
        isMediaPlan: isMediaPlan
      };
      /* A pasted screenshot arrives named "image.png" — call it what
         it is instead. */
      if (opts.pasted && isImage && (!file.name || /^image\.\w+$/i.test(file.name))) a.name = 'Pasted image';
      atts.push(a);
      render();
      if (opts.flyFrom && !reducedMotion()) flyToRow(opts.flyFrom.x, opts.flyFrom.y, a);
      // P8 — while a copy editor is mounted (Guided "I have copy" or
      // the Studio Text drawer), ANY file that lands here via this
      // SAME real paste/drop/picker plumbing also feeds the deck-read
      // beat (window._ptOnAnyFileAdded is a no-op when no editor is open).
      // Passes this chip's own id along so the deck-read side can
      // consume/remove THIS composer chip once the deck lands (P8
      // nit, 9/1) — a copy deck isn't a chat attachment, it should
      // show exactly once, on the upload row, not lingering here too.
      if (typeof window._ptOnAnyFileAdded === 'function') { try { window._ptOnAnyFileAdded(file, a.id); } catch (e) {} }
      return a;
    }
    function removeAtt(id) {
      const i = atts.findIndex((a) => a.id === id);
      if (i === -1) return;
      const removed = atts[i];
      if (removed.revoke && removed.url) { try { URL.revokeObjectURL(removed.url); } catch (e) {} }
      atts.splice(i, 1);
      render();
      // §BY — the two-way half of "nest as attachments": a chip that
      // stands in for a picked library frame (Imagery overlay or the
      // `+` attach gallery door, same recipe either way) needs its
      // origin picker to hear about an × removal too, or the two go
      // out of sync. A no-op everywhere nothing is listening.
      if (typeof window._ptOnAttachmentRemoved === 'function') { try { window._ptOnAttachmentRemoved(removed); } catch (e) {} }
    }
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ca-remove]');
      if (btn) removeAtt(btn.getAttribute('data-ca-remove'));
    });
    // P8 nit (9/1) — lets the deck-read plumbing consume a composer
    // chip it didn't originate as a real chat attachment (see
    // wireDeckUploadRow's handleFile).
    window._caRemoveAttachment = removeAtt;
    // §BY — de-dupe lookup + removal by src (a library frame's own
    // `src`/`url`, the one stable key both the Imagery overlay and a
    // `+`-attach gallery pick share for the SAME asset).
    function findAttachmentBySrc(src) {
      if (!src) return null;
      return atts.filter((a) => (a.kind === 'image' || a.kind === 'video') && a.url === src)[0] || null;
    }
    window._caFindAttachmentBySrc = findAttachmentBySrc;
    window._caRemoveAttachmentBySrc = function (src) {
      const a = findAttachmentBySrc(src);
      if (a) removeAtt(a.id);
    };

    /* Painter's Upload tile (chat-hat controller, below) routes to this
       SAME picker/state — exposing addFile lets it drop a real file
       into the real attach row instead of building a parallel one. */
    window._caAddFile = addFile;

    /* Picked-from-the-library attachments — a gallery frame or an
       ad-copy file — are the ones that never were a File. The asset
       already exists server-side (or, for a copy doc, is a record
       standing in for one), so there is nothing to read and no object
       URL to own: revoke:false, because revoking a plain asset path
       would break every other <img> pointing at it.

       A still chips as a thumbnail off its own src; a video keeps its
       own poster+play-glyph treatment (render(), above) rather than
       falling back to a badge — §BY nests real gallery video picks,
       not just stills — and a document has no src at all, so it takes
       the badge fileMeta() would have given the same file on upload.
       Identical atts[] shape either way, so render(), _caTakeAttachments
       and _caBuildMsgAttachments need no special case for any of it.

       §BY — de-duped by src: the same asset picked through both doors
       (Imagery overlay, `+` attach gallery) reuses the one chip rather
       than nesting twice. */
    window._caAddLibraryItem = function (item) {
      if (!item) return null;
      const src = item.src || '';
      const label = item.label || item.name || item.id || 'Item';
      const isVideo = item.kind === 'video' || /\.mp4(\?|$)/i.test(src);
      const isImage = !!src && !isVideo;
      if ((isImage || isVideo) && src) {
        const existing = findAttachmentBySrc(src);
        if (existing) return existing;
      }
      /* A workspace object (a Text doc, a Canvas) has no extension to
         read, so the picker hands its own badge over instead. */
      const meta = item.badge || fileMeta(src || label, isVideo ? 'video/mp4' : (isImage ? 'image/*' : ''));
      const a = {
        id: 'ca' + (++seq),
        kind: isVideo ? 'video' : (isImage ? 'image' : 'file'),
        url: (isImage || isVideo) ? src : '',
        name: label,
        sizeLabel: '',
        badgeCls: meta.cls,
        badgeLabel: meta.label,
        revoke: false
      };
      atts.push(a);
      render();
      return a;
    };

    /* send() takes the current set and clears the row. Object URLs are
       NOT revoked here — the message bubble keeps referencing them. */
    window._caTakeAttachments = function () {
      const out = atts;
      atts = [];
      render();
      return out;
    };
    /* Renders a taken set inside a message bubble (addUserMsg calls this). */
    window._caBuildMsgAttachments = function (list) {
      const wrap = document.createElement('div');
      wrap.className = 'msg-attachments';
      list.forEach((a) => {
        if (a.kind === 'image') {
          const img = document.createElement('img');
          img.className = 'msg-attach-img';
          img.src = a.url;
          img.alt = a.name;
          wrap.appendChild(img);
        } else if (a.kind === 'video') {
          // §BY — the sent-message twin of the composer chip's own
          // poster+play-glyph video treatment, just sized to the
          // bubble's own .msg-attach-img footprint.
          const holder = document.createElement('span');
          holder.className = 'msg-attach-video is-video';
          const vid = document.createElement('video');
          vid.className = 'msg-attach-img';
          vid.src = a.url;
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.preload = 'metadata';
          vid.setAttribute('disablepictureinpicture', '');
          holder.appendChild(vid);
          wrap.appendChild(holder);
        } else {
          const card = document.createElement('div');
          card.className = 'msg-attach-file';
          card.innerHTML = '<span class="ca-chip-badge ' + a.badgeCls + '">' + a.badgeLabel + '</span>' +
            '<span class="msg-attach-file-meta">' +
              '<span class="msg-attach-file-name">' + escapeHTML(a.name) + '</span>' +
              (a.sizeLabel ? '<span class="msg-attach-file-size">' + a.sizeLabel + '</span>' : '') +
            '</span>';
          wrap.appendChild(card);
        }
      });
      return wrap;
    };

    /* --- paste (⌘V), anywhere in the window. Only intercepts when the
       clipboard actually carries files — plain text paste flows into
       the textarea untouched. --- */
    document.addEventListener('paste', (e) => {
      const cd = e.clipboardData;
      if (!cd) return;
      const files = [];
      if (cd.files && cd.files.length) {
        for (let i = 0; i < cd.files.length; i++) files.push(cd.files[i]);
      } else if (cd.items) {
        for (let i = 0; i < cd.items.length; i++) {
          if (cd.items[i].kind === 'file') { const f = cd.items[i].getAsFile(); if (f) files.push(f); }
        }
      }
      if (!files.length) return;
      e.preventDefault();
      files.forEach((f) => addFile(f, { pasted: true }));
      composerEl.classList.remove('ca-flash');
      void composerEl.offsetWidth; /* restart the pulse */
      composerEl.classList.add('ca-flash');
      input.focus();
    });
    composerEl.addEventListener('animationend', (e) => {
      if (e.animationName === 'ca-composer-flash') composerEl.classList.remove('ca-flash');
    });

    /* --- drag & drop. Window-level dragenter/dragleave with a depth
       counter (both bubble from every child the cursor crosses, not
       just window edges — the counter is what makes "did the drag truly
       leave the page" reliable). The veil covers the chat column; the
       drop is accepted anywhere. --- */
    const veil = document.createElement('div');
    veil.id = 'caDropVeil';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<div class="ca-drop-body">' +
      '<span class="ca-drop-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>' +
      '<span class="ca-drop-label">Drop to add to the chat</span>' +
      '<span class="ca-drop-sub">Images, docs — anything</span>' +
      '</div>';
    document.body.appendChild(veil);

    function placeVeil() {
      const r = chatEl.getBoundingClientRect();
      veil.style.top = r.top + 'px';
      veil.style.left = r.left + 'px';
      veil.style.width = r.width + 'px';
      veil.style.height = r.height + 'px';
    }
    window.addEventListener('resize', () => { if (veil.classList.contains('is-active')) placeVeil(); });

    let dragDepth = 0;
    let veilTimer = null;
    const isFileDrag = (e) => !!(e.dataTransfer && e.dataTransfer.types &&
      Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1);
    function showVeil() {
      clearTimeout(veilTimer);
      placeVeil();
      veil.classList.remove('is-leaving');
      veil.classList.add('is-active');
      veil.setAttribute('aria-hidden', 'false');
    }
    function hideVeil() {
      veil.classList.add('is-leaving');
      veil.classList.remove('is-active');
      veil.setAttribute('aria-hidden', 'true');
      clearTimeout(veilTimer);
      veilTimer = setTimeout(() => veil.classList.remove('is-leaving'), reducedMotion() ? 0 : 260);
    }
    window.addEventListener('dragenter', (e) => {
      if (!isFileDrag(e)) return;
      dragDepth++;
      if (dragDepth === 1) showVeil();
    });
    window.addEventListener('dragover', (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault(); /* required for 'drop' to fire at all */
    });
    window.addEventListener('dragleave', (e) => {
      if (!isFileDrag(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hideVeil();
    });
    window.addEventListener('drop', (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepth = 0;
      hideVeil();
      const files = (e.dataTransfer && e.dataTransfer.files) ? Array.from(e.dataTransfer.files) : [];
      files.forEach((f) => addFile(f, { flyFrom: { x: e.clientX, y: e.clientY } }));
    });

    /* A dropped file flies from the drop point onto its chip — the real
       chip is already in the DOM (render() ran first), so the landing
       rect is never measured against an :empty collapsed row. */
    function flyToRow(fromX, fromY, a) {
      const chipEl = row.querySelector('[data-ca-id="' + a.id + '"]');
      const startSize = 56, endSize = 26;
      let clone;
      if (a.kind === 'image') {
        clone = document.createElement('img');
        clone.src = a.url;
        clone.alt = '';
      } else {
        clone = document.createElement('div');
        clone.textContent = a.badgeLabel;
        clone.classList.add(a.badgeCls);
      }
      clone.classList.add('ca-fly-clone');
      clone.style.width = startSize + 'px';
      clone.style.height = startSize + 'px';
      clone.style.left = (fromX - startSize / 2) + 'px';
      clone.style.top = (fromY - startSize / 2) + 'px';
      clone.style.transform = 'translate(0,0) scale(1)';
      clone.style.opacity = '1';
      document.body.appendChild(clone);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const target = (chipEl || row).getBoundingClientRect();
          const tx = target.left + endSize / 2;
          const ty = target.top + (target.height ? target.height / 2 : endSize / 2);
          clone.style.transform = 'translate(' + (tx - fromX) + 'px,' + (ty - fromY) + 'px) scale(' + (endSize / startSize) + ')';
          clone.style.opacity = '0';
        });
      });
      setTimeout(() => clone.remove(), 560);
    }

    /* --- the + menu's three items are real pickers ---
       Each is the same <input type=file multiple> with a different
       accept filter, and every pick funnels into addFile() above — so
       the chips, badges, fly-to-row animation and the copy-deck read
       beat (_ptOnAnyFileAdded) all come along for free.

       "Copy deck" lists the document/deck types fileMeta() already has
       badges for (ca-badge-deck for ppt/key, -doc, -pdf, -sheet);
       "media imagery" is stills AND video, matching what the Media
       flow's own gallery holds; "other context" stays unfiltered — it
       is the catch-all the other two are carved out of. The accept
       filter is a hint, not a gate: a picker set to "all files" on the
       OS side still lands here and is badged by extension. */
    const PICKERS = [
      { id: 'amiUploadCopy', accept: '.ppt,.pptx,.key,.doc,.docx,.pdf,.txt,.md,.rtf,.pages,.xls,.xlsx,.csv' },
      { id: 'amiUploadImagery', accept: 'image/*,video/*' },
      { id: 'amiOtherContext', accept: '' }
    ];
    PICKERS.forEach((p) => {
      const item = document.getElementById(p.id);
      if (!item) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      if (p.accept) input.accept = p.accept;
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach((f) => addFile(f));
        input.value = ''; /* re-selecting the same file still fires change */
      });
      item.addEventListener('click', () => input.click());
    });

    /* The two "choose" items open real pickers instead of a file
       input, and chip whatever comes back through the shared
       _caAddLibraryItem path. Each open is independent, so a second
       visit appends rather than replacing. */
    const CHOOSERS = [
      /* The Guided image step's own gallery overlay, exposed by the
         painter IIFE. It caps a session at 3 picks. */
      { id: 'amiFromGallery', open: () => window._ptOpenGalleryPicker },
      /* The Text/Canvas files pane — the gallery picker's sibling,
         same canvas-pane surface, rows instead of a mosaic. */
      { id: 'amiChooseCopy', open: () => window._ptOpenFilesPicker }
    ];
    CHOOSERS.forEach((c) => {
      const item = document.getElementById(c.id);
      if (!item) return;
      item.addEventListener('click', () => {
        const opener = c.open();
        if (typeof opener !== 'function') return;
        opener((chosen) => {
          (chosen || []).forEach((rec) => {
            if (typeof window._caAddLibraryItem === 'function') window._caAddLibraryItem(rec);
          });
        });
      });
    });
  })();

  // --- mode tiles (Graphics/Video/Audio) — honest stubs, never a
  //     dead end: a click posts one deduped assistant line pointing
  //     at what this prototype IS about. (Media used to live in this
  //     row as "Painter" — 8/24 it moved out to a chip, see
  //     .chat-aux-chips / #ptModeTile / initPainterSkill below — so
  //     this row is back to the starter's stock 3 tiles.) ---
  (function initModeTiles() {
    const tiles = document.querySelectorAll('[data-chat-aux-modes] .chat-aux-mode-tile');
    if (!tiles.length) return;
    tiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        const mode = tile.getAttribute('data-mode') || 'That mode';
        // P4 — "in Painter context" (a resolved sheet already on the
        // canvas), Video/Audio hand off to the motion teaser / audio
        // roadmap line instead of the generic "not wired" message.
        // The two functions are defined+exposed by initPainterSkill()
        // below (which runs after this IIFE at parse time, but both
        // are only ever CALLED from a later click, by which point
        // every top-level IIFE has already run).
        if (document.body.classList.contains('is-painter-resolved')) {
          if (mode === 'Video' && typeof window._ptOpenMotionTeaser === 'function') { window._ptOpenMotionTeaser(); return; }
          if (mode === 'Audio' && typeof window._ptAudioRoadmapLine === 'function') { window._ptAudioRoadmapLine(); return; }
        }
        const line = mode + " mode isn't wired into this prototype — it's all about chat attachments. Paste or drop a file to try it.";
        const bots = document.querySelectorAll('#chatStream .msg.bot');
        const last = bots[bots.length - 1];
        if (last && last.textContent.includes(line)) return; /* dedupe */
        addBotMsg(line);
      });
    });
  })();

  // ════════════════════════════════════════════════════════════════
  // PAINTER — P1. "Not a prompt workflow — a skill, styled like the
  // chat hat" (an earlier working session). Click the Painter
  // mode tile → a 4-step guided walk (image → copy → layout → sizes)
  // rendered as ordinary chat messages with tile/chip answer surfaces
  // → the resolved concept sheet lands on the canvas (3 concepts ×
  // the checked sizes, real HTML/CSS banners, not images).
  // Uses the same el()/timeNow()/stream helpers addUserMsg/addBotMsg
  // rely on (top of this <script>) — persona-chat-injected on every
  // injected node so the shell's dialogue-cycle rule doesn't hide it.
  // ════════════════════════════════════════════════════════════════
  (function initPainterSkill() {
    const modeTile = document.getElementById('ptModeTile');
    if (!modeTile) return;

    const ICONS = {
      upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 14V2.5"/><path d="M7.5 7L12 2.5L16.5 7"/><path d="M4 14v6.5h16V14"/></svg>',
      grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="miter"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
      sparkle: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M196.89,130.94,144.4,111.6,125.06,59.11a13.92,13.92,0,0,0-26.12,0L79.6,111.6,27.11,130.94a13.92,13.92,0,0,0,0,26.12L79.6,176.4l19.34,52.49a13.92,13.92,0,0,0,26.12,0L144.4,176.4l52.49-19.34a13.92,13.92,0,0,0,0-26.12Zm-4.15,14.86-55.08,20.3a6,6,0,0,0-3.56,3.56l-20.3,55.08a1.92,1.92,0,0,1-3.6,0L89.9,169.66a6,6,0,0,0-3.56-3.56L31.26,145.8a1.92,1.92,0,0,1,0-3.6l55.08-20.3a6,6,0,0,0,3.56-3.56l20.3-55.08a1.92,1.92,0,0,1,3.6,0l20.3,55.08a6,6,0,0,0,3.56,3.56l55.08,20.3a1.92,1.92,0,0,1,0,3.6ZM146,40a6,6,0,0,1,6-6h18V16a6,6,0,0,1,12,0V34h18a6,6,0,0,1,0,12H182V64a6,6,0,0,1-12,0V46H152A6,6,0,0,1,146,40ZM246,88a6,6,0,0,1-6,6H230v10a6,6,0,0,1-12,0V94H208a6,6,0,0,1,0-12h10V72a6,6,0,0,1,12,0V82h10A6,6,0,0,1,246,88Z"/></svg>',
      feather: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M238,80A62,62,0,0,0,132.18,36.14L62.1,105.41a13.94,13.94,0,0,0-4.1,9.9v74.21L27.76,219.76a6,6,0,1,0,8.48,8.48L66.48,198h74.21a13.94,13.94,0,0,0,9.9-4.1l0,0,68.83-69.63h0l.39-.4A61.6,61.6,0,0,0,238,80ZM140.64,44.64a50,50,0,0,1,72,69.36H150.48l37.76-37.76a6,6,0,0,0-8.48-8.48l-48,48h0L118,129.52V67ZM70,115.31a2,2,0,0,1,.56-1.39l35.44-35v62.63l-36,36Zm72.09,70.11a2,2,0,0,1-1.4.58H78.48l37.76-37.75h0L138.48,126h62.35Z"/></svg>',
      chatText: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,50H40A14,14,0,0,0,26,64V224a13.88,13.88,0,0,0,8.09,12.69A14.11,14.11,0,0,0,40,238a13.87,13.87,0,0,0,9-3.31l.06-.05L82.23,206H216a14,14,0,0,0,14-14V64A14,14,0,0,0,216,50Zm2,142a2,2,0,0,1-2,2H80a6,6,0,0,0-3.92,1.46L41.26,225.53A2,2,0,0,1,38,224V64a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Zm-52-80a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,112Zm0,32a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,144Z"/></svg>',
      check: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"/></svg>',
      // AL.16 — a STROKE checkmark (round caps/joins, weight 2) for the
      // .pt-unit-check recipe's own mark (AQ.5 — the row's own check
      // is this same 20px recipe now, not a bespoke 16×16 box): the
      // filled `check` glyph above has no width/height of its own, so
      // it was rendering at the SVG default box (300×150) inside the
      // mark span and showing only a clipped corner. Same path as the
      // SELECT_CHECK the shortlist "+" once swapped to (retired by AQ for
      // the house Phosphor check), just a lighter stroke for this
      // smaller glyph. (AQ's lockup ✓ tail retired 9/16.)
      checkSm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"/></svg>',
      edit: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M225.9,74.78,181.21,30.09a14,14,0,0,0-19.8,0L38.1,153.41a13.94,13.94,0,0,0-4.1,9.9V208a14,14,0,0,0,14,14H92.69a13.94,13.94,0,0,0,9.9-4.1L225.9,94.58a14,14,0,0,0,0-19.8ZM94.1,209.41a2,2,0,0,1-1.41.59H48a2,2,0,0,1-2-2V163.31a2,2,0,0,1,.59-1.41L136,72.48,183.51,120ZM217.41,86.1,192,111.51,144.49,64,169.9,38.58a2,2,0,0,1,2.83,0l44.68,44.69a2,2,0,0,1,0,2.83Z"/></svg>',
      // Real Phosphor "Plus" (light weight, 6-unit precision — matches
      // this object's other light glyphs) — the ghost add-tile's
      // badge and the per-concept "+ sizes" chip icon.
      plus: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"/></svg>',
      // P12 — the spec-sheet grid's per-unit remove control (real
      // Phosphor light "Minus", the plus glyph's own horizontal bar).
      minus: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"/></svg>',
      // P5 fork tiles + Studio rail glyphs — real Phosphor LIGHT path
      // data (phosphor-icons/core, assets/light/*-light.svg), never
      // hand-drawn.
      listChecks: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M222,128a6,6,0,0,1-6,6H128a6,6,0,0,1,0-12h88A6,6,0,0,1,222,128ZM128,70h88a6,6,0,0,0,0-12H128a6,6,0,0,0,0,12Zm88,116H128a6,6,0,0,0,0,12h88a6,6,0,0,0,0-12ZM83.76,43.76,56,71.51,44.24,59.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,135.51,44.24,123.76a6,6,0,1,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,199.51,44.24,187.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Z"/></svg>',
      paintBrush: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M224,26c-20.8,0-44.11,11.41-69.3,33.9C136.62,76.06,121,94.9,110.3,109A58,58,0,0,0,34,164c0,32.07-20.43,46.39-21.35,47A6,6,0,0,0,16,222H92a58,58,0,0,0,55-76.3c14.08-10.67,32.92-26.32,49.08-44.4C218.59,76.11,230,52.8,230,32A6,6,0,0,0,224,26ZM92,210H30.65C37.92,200.85,46,185.78,46,164a46,46,0,1,1,46,46Zm29.49-95.91c3.6-4.67,7.88-10,12.71-15.69a78.17,78.17,0,0,1,23.4,23.4c-5.67,4.83-11,9.11-15.69,12.71A58.38,58.38,0,0,0,121.49,114.09Zm45.2-.3a90.24,90.24,0,0,0-24.48-24.48C163.05,66.46,191,42,217.56,38.44,214,65,189.54,93,166.69,113.79Z"/></svg>',
      ruler: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M233.91,74.79,181.22,22.1a14,14,0,0,0-19.8,0L22.09,161.41a14,14,0,0,0,0,19.8L74.78,233.9a14,14,0,0,0,19.8,0L233.91,94.59A14,14,0,0,0,233.91,74.79ZM225.42,86.1,86.1,225.41h0a2,2,0,0,1-2.83,0L30.58,172.73a2,2,0,0,1,0-2.83L64,136.48l27.76,27.76a6,6,0,1,0,8.48-8.48L72.48,128,96,104.48l27.76,27.76a6,6,0,0,0,8.48-8.48L104.48,96,128,72.49l27.76,27.75a6,6,0,0,0,8.48-8.48L136.49,64,169.9,30.59a2,2,0,0,1,2.83,0l52.69,52.68A2,2,0,0,1,225.42,86.1Z"/></svg>',
      textAa: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M85.43,53.45a6,6,0,0,0-10.86,0l-64,136a6,6,0,1,0,10.86,5.11L38.63,158h82.74l17.2,36.55a6,6,0,1,0,10.86-5.11ZM44.28,146,80,70.09,115.72,146ZM200,98c-12.21,0-21.71,3.28-28.23,9.74a6,6,0,0,0,8.46,8.52c4.18-4.15,10.84-6.26,19.77-6.26,14.34,0,26,9.87,26,22v7.24A40.36,40.36,0,0,0,200,130c-20.95,0-38,15.25-38,34s17.05,34,38,34a40.36,40.36,0,0,0,26-9.24V192a6,6,0,0,0,12,0V132C238,113.25,221,98,200,98Zm0,88c-14.34,0-26-9.87-26-22s11.66-22,26-22,26,9.87,26,22S214.34,186,200,186Z"/></svg>',
      layoutRail: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V98H38V56A2,2,0,0,1,40,54ZM38,200V110H98v92H40A2,2,0,0,1,38,200Zm178,2H110V110H218v90A2,2,0,0,1,216,202Z"/></svg>',
      palette: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M199.37,55.31A101.32,101.32,0,0,0,128,26h-1A102,102,0,0,0,26,128c0,42.09,26.07,77.44,68,92.26A30.21,30.21,0,0,0,104.11,222,30.06,30.06,0,0,0,134,192a18,18,0,0,1,18-18h46.21a29.82,29.82,0,0,0,29.25-23.31A102.71,102.71,0,0,0,230,127.11,101.25,101.25,0,0,0,199.37,55.31ZM215.76,148a17.89,17.89,0,0,1-17.55,14H152a30,30,0,0,0-30,30,18,18,0,0,1-24,17C61,195.86,38,164.85,38,128a90,90,0,0,1,89.07-90H128a90.34,90.34,0,0,1,90,89.22A90.46,90.46,0,0,1,215.76,148ZM138,76a10,10,0,1,1-10-10A10,10,0,0,1,138,76ZM94,100A10,10,0,1,1,84,90,10,10,0,0,1,94,100Zm0,56a10,10,0,1,1-10-10A10,10,0,0,1,94,156Zm88-56a10,10,0,1,1-10-10A10,10,0,0,1,182,100Z"/></svg>',
      // P6 — topbar Undo/Redo, drawer close, font-combo search/caret,
      // Images-drawer video-thumb play disc. Real Phosphor LIGHT path
      // data (phosphor-icons/core assets/light/*-light.svg).
      undo: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M230,144a62.07,62.07,0,0,1-62,62H80a6,6,0,0,1,0-12h88a50,50,0,0,0,0-100H46.49l37.75,37.76a6,6,0,1,1-8.48,8.48l-48-48a6,6,0,0,1,0-8.48l48-48a6,6,0,0,1,8.48,8.48L46.49,82H168A62.07,62.07,0,0,1,230,144Z"/></svg>',
      redo: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M171.76,131.76,209.51,94H88a50,50,0,0,0,0,100h88a6,6,0,0,1,0,12H88A62,62,0,0,1,88,82H209.51L171.76,44.24a6,6,0,0,1,8.48-8.48l48,48a6,6,0,0,1,0,8.48l-48,48a6,6,0,0,1-8.48-8.48Z"/></svg>',
      x: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"/></svg>',
      magnifyingGlass: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z"/></svg>',
      caretDown: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>',
      image: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V163.57L188.53,134.1a14,14,0,0,0-19.8,0l-21.42,21.42L101.9,110.1a14,14,0,0,0-19.8,0L38,154.2V56A2,2,0,0,1,40,54ZM38,200V171.17l52.58-52.58a2,2,0,0,1,2.84,0L176.83,202H40A2,2,0,0,1,38,200Zm178,2H193.8l-38-38,21.41-21.42a2,2,0,0,1,2.83,0l38,38V200A2,2,0,0,1,216,202ZM146,100a10,10,0,1,1,10,10A10,10,0,0,1,146,100Z"/></svg>',
      // P8 — copy-deck upload row-tile. Real Phosphor LIGHT path data
      // (phosphor-icons/core, assets/light/file-arrow-up-light.svg).
      fileArrowUp: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Zm-43.76-78.24a6,6,0,1,1-8.48,8.48L134,134.49V184a6,6,0,0,1-12,0V134.49l-13.76,13.75a6,6,0,0,1-8.48-8.48l24-24a6,6,0,0,1,8.48,0Z"/></svg>',
      // AK.2/AK.6 — Studio rail's History tool. Same Phosphor-light
      // "Clock" already drawn once for the Skills catalog (SKILL_ICONS,
      // ~L42040) — reused verbatim rather than redrawn, per house rule.
      clock: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Zm62-90a6,6,0,0,1-6,6H128a6,6,0,0,1-6-6V72a6,6,0,0,1,12,0v50h50A6,6,0,0,1,190,128Z"/></svg>'
    };

    // The "18 frames" — images baked into the Corvache environment
    // (the approved shoot + the brand library). Labels are structural
    // (filename-derived), not invented photo descriptions.
    // P11 — per-asset focal points (object-position source, applied
    // by mediaTagHTML below). Default is 50/58 (car frames read best
    // slightly below center) — shoot-01..05 and studio-* are hand-set
    // per Bryan's ask, verified by eye against a contact sheet of the
    // real files. detail-*/hero-bg are tight abstract crops already
    // well-served by the default and are left unset.
    const ENV_FRAMES = [
      { id: 'shoot-01', src: 'shoot-assets/shoot-01.webp', label: 'Shoot 01', focal: { x: 35, y: 58 } },
      { id: 'shoot-02', src: 'shoot-assets/shoot-02.webp', label: 'Shoot 02', focal: { x: 35, y: 56 } },
      { id: 'shoot-03', src: 'shoot-assets/shoot-03.webp', label: 'Shoot 03', focal: { x: 55, y: 55 } },
      { id: 'shoot-04', src: 'shoot-assets/shoot-04.webp', label: 'Shoot 04', focal: { x: 45, y: 55 } },
      { id: 'shoot-05', src: 'shoot-assets/shoot-05.webp', label: 'Shoot 05', focal: { x: 50, y: 42 } },
      { id: 'studio-1', src: 'brand/studio-1.jpg', label: 'Studio 01', focal: { x: 40, y: 60 } },
      { id: 'studio-2', src: 'brand/studio-2.jpg', label: 'Studio 02', focal: { x: 32, y: 64 } },
      { id: 'studio-3', src: 'brand/studio-3.jpg', label: 'Studio 03', focal: { x: 50, y: 52 } },
      { id: 'studio-4', src: 'brand/studio-4.jpg', label: 'Studio 04', focal: { x: 50, y: 55 } },
      { id: 'studio-5', src: 'brand/studio-5.jpg', label: 'Studio 05', focal: { x: 55, y: 55 } },
      { id: 'studio-6', src: 'brand/studio-6.jpg', label: 'Studio 06', focal: { x: 40, y: 60 } },
      { id: 'detail-1', src: 'brand/detail-1.jpg', label: 'Detail 01' },
      { id: 'detail-2', src: 'brand/detail-2.jpg', label: 'Detail 02' },
      { id: 'detail-3', src: 'brand/detail-3.jpg', label: 'Detail 03' },
      { id: 'detail-4', src: 'brand/detail-4.jpg', label: 'Detail 04' },
      { id: 'detail-5', src: 'brand/detail-5.jpg', label: 'Detail 05' },
      { id: 'detail-6', src: 'brand/detail-6.jpg', label: 'Detail 06' },
      { id: 'hero-bg',  src: 'brand/hero-bg.jpg',  label: 'Hero BG' }
    ];
    ENV_FRAMES.forEach(f => { f.kind = 'image'; if (!f.focal) f.focal = { x: 50, y: 58 }; });

    // The 29 motion clips in videos/ (a symlink) — same "baked into the
    // Corvache environment" contract as the image frames above, just
    // the motion side of the same library. Labels are filename-derived
    // (Title Case, dashes → spaces), never invented.
    const VIDEO_FILES = [
      'amalfi-coast.mp4', 'art-museum.mp4', 'big-eyed-fluff-ball.mp4', 'big-sur.mp4',
      'birds-over-river.mp4', 'cat-on-bed.mp4', 'chameleon.mp4', 'closeup-of-womans-eye.mp4',
      'cloud-man.mp4', 'dancing-kangaroo.mp4', 'dogs-downtown.mp4', 'flower-blooming.mp4',
      'gold-rush.mp4', 'happy-cat.mp4', 'lagos.mp4', 'mitten-astronaut.mp4',
      'monster-with-melting-candle.mp4', 'octopus-and-crab.mp4', 'origami-undersea.mp4',
      'paper-airplanes.mp4', 'petri-dish-pandas.mp4', 'photoreal-train.mp4', 'santorini.mp4',
      'ships-in-coffee.mp4', 'stack-of-tvs.mp4', 'tiny-construction.mp4',
      'victoria-crowned-pigeon.mp4', 'wooly-mammoth.mp4', 'zen-garden-gnome.mp4'
    ];
    function labelFromFilename(fn) {
      return fn.replace(/\.[a-z0-9]+$/i, '').split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    const VIDEO_FRAMES = VIDEO_FILES.map(fn => {
      const id = fn.replace(/\.[a-z0-9]+$/i, '');
      return { id: id, src: 'videos/' + fn, label: labelFromFilename(fn), kind: 'video', focal: { x: 50, y: 58 } };
    });
    // "Your Gallery" — images first (shoot, then brand), then videos.
    const GALLERY_ITEMS = ENV_FRAMES.concat(VIDEO_FRAMES);
    function isVideoSrc(src) { return /\.mp4(\?|$)/i.test(String(src)); }
    // I — "the campaign's own shoot stills" the editor rail's Swap
    // image section leads with: the approved shoot (shoot-01..05),
    // not the wider brand library (studio-*/detail-*/hero-bg) it sits
    // beside in ENV_FRAMES. id-prefix rather than an array slice, so
    // it stays correct if the roster above is ever reordered.
    function isShootStill(f) { return /^shoot-/.test(f.id); }
    // P11 — every media slot crops via object-fit:cover (CSS) at a
    // per-asset focal point (object-position, set here). Looks the
    // src up against GALLERY_ITEMS; unknown sources (should not occur
    // in practice — every pickable frame lives in the gallery) fall
    // back to the same 50/58 default the gallery items themselves use.
    function focalForSrc(src) {
      const item = GALLERY_ITEMS.filter(f => f.src === src)[0];
      return (item && item.focal) || { x: 50, y: 58 };
    }
