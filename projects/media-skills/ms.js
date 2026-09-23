/* ═══════════════════════════════════════════════════════════════════
   MEDIA SKILLS runtime — router, fragment loader, chat transcripts,
   blur-fade reveal, smooth-scroll lerp. Executors: do NOT edit this
   file; fragments own their interactions. See PLAN.md.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ---------- Blur-fade reveal (IO + sibling stagger) ---------- */
  var STAGGER_MS = 70, STAGGER_CAP = 5;
  var revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var parent = el.parentElement, idx = 0;
        if (parent) {
          var sibs = Array.prototype.filter.call(parent.children, function (c) {
            return c.hasAttribute && c.hasAttribute('data-reveal');
          });
          idx = Math.max(0, Math.min(sibs.indexOf(el), STAGGER_CAP));
        }
        el.style.setProperty('--reveal-delay', (idx * STAGGER_MS) + 'ms');
        el.classList.add('is-visible');
        startCountups(el);
        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  }
  function initReveal(root) {
    var els = (root || document).querySelectorAll('[data-reveal]:not(.is-visible)');
    if (!revealIO) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('is-visible'); startCountups(e); });
      return;
    }
    Array.prototype.forEach.call(els, function (e) { revealIO.observe(e); });
  }
  window.MS_initReveal = initReveal;

  /* ---------- Matte backing: wrap each module-level <section> in
     .ms-matte and move its data-reveal (+ inline delay) onto the
     wrapper, so the matte blur-fades in WITH its content instead of
     sitting empty. Runs before stagger/reveal wiring. ---------- */
  function wrapMattes(holder) {
    var sections = holder.querySelectorAll(
      ':scope > section, :scope > :not(style):not(script):not(svg) > section'
    );
    Array.prototype.forEach.call(sections, function (sec) {
      if (sec.closest('.ms-matte')) return;
      /* data-matte="split": a stack of full-width cards — every direct
         child gets its OWN matte; the section itself stays unmatted
         (it just provides the column/gap layout). */
      if (sec.dataset.matte === 'split') {
        sec.removeAttribute('data-reveal');
        sec.style.removeProperty('--reveal-delay');
        Array.prototype.slice.call(sec.children).forEach(function (child) {
          if (child.nodeType !== 1) return;
          var w = document.createElement('div');
          w.className = 'ms-matte ms-matte--split';
          if (child.hasAttribute('data-reveal')) {
            w.setAttribute('data-reveal', child.getAttribute('data-reveal'));
            child.removeAttribute('data-reveal');
            var cd = child.style.getPropertyValue('--reveal-delay');
            if (cd) { w.style.setProperty('--reveal-delay', cd); child.style.removeProperty('--reveal-delay'); }
          } else {
            w.setAttribute('data-reveal', '');
          }
          sec.insertBefore(w, child);
          w.appendChild(child);
        });
        return;
      }
      var wrap = document.createElement('div');
      wrap.className = 'ms-matte';
      if (sec.dataset.matte) wrap.classList.add('ms-matte--' + sec.dataset.matte);
      if (sec.hasAttribute('data-reveal')) {
        wrap.setAttribute('data-reveal', sec.getAttribute('data-reveal'));
        sec.removeAttribute('data-reveal');
        var d = sec.style.getPropertyValue('--reveal-delay');
        if (d) { wrap.style.setProperty('--reveal-delay', d); sec.style.removeProperty('--reveal-delay'); }
      }
      sec.parentNode.insertBefore(wrap, sec);
      wrap.appendChild(sec);
    });
  }

  /* ---------- Chart build-ins: sibling stagger for [data-build] ----------
     Groups by parent; each group cascades at 35ms steps (index capped at
     20). A fragment can hand-order a build by setting --build-d inline —
     we never overwrite an explicit value. */
  function assignBuildStagger(root) {
    var groups = new Map();
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-build]'), function (el) {
      if (el.style.getPropertyValue('--build-d')) return;
      var p = el.parentElement || root;
      if (!groups.has(p)) groups.set(p, 0);
      var i = groups.get(p);
      el.style.setProperty('--build-d', (Math.min(i, 20) * 35) + 'ms');
      groups.set(p, i + 1);
    });
  }

  /* ---------- Count-up: [data-countup] number text animates 0 → value
     when its reveal container becomes visible. Conservative parser —
     handles "2.1M", "$18,000", "67.8%", "58,4%", "3.4x"; restores the
     exact original string at the end. Opt-in only. ---------- */
  var counted = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  function startCountups(container) {
    if (reduceMotion) return;
    Array.prototype.forEach.call(container.querySelectorAll('[data-countup]'), function (el) {
      if (counted) { if (counted.has(el)) return; counted.add(el); }
      var original = el.textContent;
      var m = original.match(/-?\d[\d.,]*\d|\d/);
      if (!m) return;
      var raw = m[0], pre = original.slice(0, m.index), post = original.slice(m.index + raw.length);
      var decimalComma = /,\d{1,2}$/.test(raw) && raw.indexOf('.') === -1;
      var thousands = !decimalComma && raw.indexOf(',') !== -1;
      var norm = decimalComma ? raw.replace(',', '.') : raw.replace(/,/g, '');
      var value = parseFloat(norm);
      if (!isFinite(value)) return;
      var decs = (norm.split('.')[1] || '').length;
      var t0 = null, DUR = 900;
      function fmt(v) {
        var s = v.toFixed(decs);
        if (decimalComma) s = s.replace('.', ',');
        else if (thousands) {
          var parts = s.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          s = parts.join('.');
        }
        return s;
      }
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min((ts - t0) / DUR, 1);
        var e = 1 - Math.pow(1 - k, 3);
        if (k < 1) {
          el.textContent = pre + fmt(value * e) + post;
          requestAnimationFrame(step);
        } else {
          el.textContent = original;
        }
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- Smooth vertical scroll on #canvas (lerp 0.09 / ×0.9,
     the lease-campaign smoothCanvasScroll feel) ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function smoothCanvasScroll() {
    if (reduceMotion) { window.MS_resetScroll = function () {}; return; }
    var el = document.getElementById('canvas');
    var main = document.getElementById('main');
    if (!el) { window.MS_resetScroll = function () {}; return; }
    var LERP = 0.09, MULT = 0.9;
    var target = 0, current = 0, raf = null, animating = false;
    function ourTab() {
      var t = main && main.dataset.tab;
      return t === 'audience' || t === 'plan' || t === 'query';
    }
    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target; el.scrollTop = current;
        raf = null; animating = false; return;
      }
      current += diff * LERP;
      el.scrollTop = current;
      raf = requestAnimationFrame(tick);
    }
    function nudge(delta) {
      if (!animating) { current = el.scrollTop; target = current; }
      var max = el.scrollHeight - el.clientHeight;
      target = Math.max(0, Math.min(max, target + delta));
      animating = true;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    el.addEventListener('wheel', function (e) {
      if (!ourTab()) return;
      if (e.ctrlKey) return; /* pinch zoom */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; /* horizontal intent */
      /* Yield to inner scrollers (tables, code, h-scroll charts) */
      var n = e.target;
      while (n && n !== el && n.nodeType === 1) {
        var s = window.getComputedStyle(n);
        if (n.scrollHeight > n.clientHeight + 4 && /(auto|scroll)/.test(s.overflowY)) return;
        n = n.parentElement;
      }
      e.preventDefault();
      nudge(e.deltaY * MULT);
    }, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (!ourTab()) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var a = document.activeElement;
      if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      e.preventDefault();
      nudge((e.key === 'ArrowDown' ? 1 : -1) * 180);
    });
    window.MS_resetScroll = function () {
      if (raf) cancelAnimationFrame(raf);
      raf = null; animating = false;
      target = 0; current = 0;
      el.scrollTop = 0;
    };
    /* Jump the canvas to an element's top WITHOUT fighting this lerp.
       Two traps this avoids: (1) #canvas has scroll-behavior:smooth, so a
       bare scrollTop= write animates and can be overtaken; (2) the lerp
       keeps its own target/current and will drive scrollTop back on its
       next tick. So: cancel the rAF, write the position, and re-seed
       target/current to match. Temporarily suspends smooth so the jump is
       exact. */
    window.MS_scrollToEl = function (node, offset) {
      if (!node) return;
      if (raf) cancelAnimationFrame(raf);
      raf = null; animating = false;
      var max = Math.max(0, el.scrollHeight - el.clientHeight);
      var top = node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      /* #canvas is padded under a sticky .canvas-header; without backing the
         target off by that height the element's own eyebrow tucks under it */
      var pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
      var y = Math.max(0, Math.min(max, top - pad - (offset || 0)));
      var prev = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';
      el.scrollTop = y;
      target = current = el.scrollTop;
      el.style.scrollBehavior = prev || '';
    };
  })();

  /* ---------- Chat transcripts (1:1 from the Figma boards).
     The intro block above them stays the shell's standard one:
     AI-disclosure notice + "What can I help with?" ---------- */
  var AUD_BASE = [
    { who: 'user', name: 'Cassian Andor', time: 'Today, 2:26 PM',
      text: 'Premium lifestyle people interested in travel in the US' },
    { who: 'status', text: 'Hold on, cookin’ something for you…' },
    { who: 'bot', name: 'Canvas', time: 'Today, 2:26 PM', text: 'Here you are!' }
  ];
  var TRANSCRIPTS = {
    'aud-list': AUD_BASE,
    'aud-overview': AUD_BASE,
    'aud-compare': AUD_BASE.concat([
      { who: 'user', name: 'Cassian Andor', time: 'Today, 2:26 PM',
        text: 'Compare audiences 1 and 2' }
    ]),
    'plan': [
      { who: 'user', name: 'Cassian Andor', time: 'Today, 2:28 PM',
        text: 'I want to create a media plan for Corvache' },
      { who: 'bot', name: 'Canvas', time: 'Today, 2:28 PM',
        text: 'Please upload a brief if you have one.' },
      { who: 'user', name: 'Cassian Andor', time: 'Today, 2:28 PM', file: 'MarketBrief23.pdf' },
      { who: 'status', text: 'Extracting data from the brief…' },
      { who: 'bot', name: 'Canvas', time: 'Today, 2:28 PM',
        text: 'Here is the data I managed to pull from your document:\n\n' +
              'Budget: $18,000\nMarket(s): US, EMEA\nFrequency target: 3.4x\n' +
              'Flight window: 01 March - 24 May 2026\nOptimization KPI(s): Awareness\n' +
              'Audience: Performance Enthusiasts\n\n' +
              'Do you want to correct or add anything or should I move on to generate media plan suggestions?' },
      { who: 'user', name: 'Cassian Andor', time: 'Today, 2:28 PM',
        text: 'I want to create a media plan for Corvache' },
      { who: 'status', text: 'Generating three media plan suggestions…' },
      { who: 'bot', name: 'Canvas', time: 'Today, 2:29 PM',
        text: 'I have created your media plan based on your parameters and consumer insights. ' +
              'The structured media plan suggestions are now live in your output panel.\n\n' +
              'Let me know if you want to tweak or know more about anything.' }
    ]
  };

  var FILE_ICON =
    '<svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true">' +
    '<path d="M1.5 1.5h6.8L11.5 4.7v8.8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>' +
    '<path d="M8 1.5v3.5h3.5" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>';
  var BOT_ICON =
    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<circle cx="8" cy="5.5" r="2.6" fill="currentColor"/>' +
    '<path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="currentColor"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function buildMsg(m) {
    var el = document.createElement('div');
    if (m.who === 'status') {
      el.className = 'ms-status';
      el.innerHTML = '<span class="ms-status-dot" aria-hidden="true"></span><span>' + esc(m.text) + '</span>';
      return el;
    }
    el.className = 'ms-msg ' + (m.who === 'bot' ? 'bot' : 'user');
    var avatar = m.who === 'bot'
      ? '<span class="ms-msg-avatar">' + BOT_ICON + '</span>'
      : '<span class="ms-msg-avatar">CA</span>';
    var body = m.file
      ? '<span class="ms-filechip">' + FILE_ICON + esc(m.file) + '</span>'
      : esc(m.text).replace(/\n/g, '<br>');
    el.innerHTML =
      '<div class="ms-msg-head">' + avatar +
      '<span class="ms-msg-name">' + esc(m.name) + '</span>' +
      '<span class="ms-msg-dot" aria-hidden="true"></span>' +
      '<span class="ms-msg-time">' + esc(m.time) + '</span></div>' +
      '<div class="ms-msg-body">' + body + '</div>';
    return el;
  }

  /* ---------- Router ---------- */
  var main = document.getElementById('main');
  var audView = document.getElementById('audView');
  var planView = document.getElementById('planView');
  var queryView = document.getElementById('queryView');
  var stream = document.getElementById('chatStream');
  var TITLES = {
    audience: 'Sustainable Luxury — OMNI+ Canvas',
    plan: 'Corvache Media Plan — OMNI+ Canvas',
    query: 'First-Time EV Buyers — OMNI+ Canvas'
  };
  var AUD_VIEWS = ['list', 'overview', 'compare'];

  function renderChat(key) {
    /* Bryan 2026-08-05: demo transcripts removed — the chat side shows
       only the shell's standard intro (AI notice + "What can I help
       with?"). TRANSCRIPTS kept above for easy restore. */
    if (!stream) return;
    Array.prototype.forEach.call(stream.querySelectorAll('.ms-msg, .ms-status, .qv-log'), function (n) { n.remove(); });
  }

  function apply(skill, view, syncURL) {
    skill = (skill === 'plan' || skill === 'query') ? skill : 'audience';
    view = AUD_VIEWS.indexOf(view) !== -1 ? view : 'list';
    main.dataset.tab = skill;
    Array.prototype.forEach.call(
      document.querySelectorAll('.topnav .tab[data-tab]'),
      function (t) { t.classList.toggle('active', t.dataset.tab === skill); }
    );
    if (audView) {
      audView.setAttribute('aria-hidden', skill !== 'audience' ? 'true' : 'false');
      audView.dataset.view = view;
    }
    if (planView) planView.setAttribute('aria-hidden', skill !== 'plan' ? 'true' : 'false');
    if (queryView) queryView.setAttribute('aria-hidden', skill !== 'query' ? 'true' : 'false');
    if (skill !== 'query' && window.MS_QUERY_VIGNETTE && window.MS_QUERY_VIGNETTE.leave) window.MS_QUERY_VIGNETTE.leave();
    document.title = TITLES[skill];
    renderChat(skill === 'audience' ? 'aud-' + view : skill);
    if (skill === 'query' && window.MS_QUERY_VIGNETTE) window.MS_QUERY_VIGNETTE.enter();
    if (window.MS_closeChipMenu) window.MS_closeChipMenu();
    if (window.MS_resetScroll) window.MS_resetScroll();
    if (window.MS_rebuildNav) window.MS_rebuildNav();
    else { var c = document.getElementById('canvas'); if (c) c.scrollTop = 0; }
    if (syncURL !== false) {
      var q = skill === 'audience' ? '?skill=audience&view=' + view : '?skill=' + skill;
      try { history.replaceState(null, '', q); } catch (e) {}
    }
    /* Newly-shown panes may hold already-observed reveal targets whose
       intersection recomputes on display — nothing else needed. */
  }
  window.MS = {
    apply: apply,
    goto: function (view) { apply('audience', view); }
  };

  /* Session-tab clicks — the shell's generic activate() also fires;
     ours completes the swap (chat, URL, aria, scroll). */
  Array.prototype.forEach.call(
    document.querySelectorAll('.topnav .tab[data-tab="audience"], .topnav .tab[data-tab="plan"], .topnav .tab[data-tab="query"]'),
    function (t) {
      t.addEventListener('click', function () {
        apply(t.dataset.tab, 'list');
      });
    }
  );

  /* Delegated in-canvas navigation: any [data-goto-view="overview|compare|list"]
     inside the audience skill switches sub-view. */
  document.addEventListener('click', function (e) {
    /* definition chips + their menus own their clicks — never navigate */
    if (e.target.closest && e.target.closest('.audl-term-chip, .audoa-chip-def, .plana-chip--def, .qv-chip, .ms-chipmenu')) return;
    var g = e.target.closest && e.target.closest('[data-goto-view]');
    if (!g) return;
    if (main.dataset.tab !== 'audience') return;
    apply('audience', g.getAttribute('data-goto-view'));
  });

  /* ---------- Definition-chip dropdowns ----------
     Every boolean-builder chip (audience list, overview hero, plan
     parameters) opens the attribute panel from the board: folder-titled,
     checkbox rows, teal checks. Lists longer than 6 rows get the
     "break case": first 5 + a "View all N attributes" footer that
     swaps to a scrollable full list. ---------- */
  var CHIP_SELECTOR = '.audl-term-chip, .audoa-chip-def, .plana-chip--def, .qv-chip';
  var ATTR_MAP = {
    'Luxury Auto Intentions': ['In_Market_Luxury_Auto="Y"', 'Purchase_Window_6mo="Y"', 'Configurator_Visits>=2'],
    'Tech Savvy': ['Early_Adopter_Index>=120', 'Device_Count>=4', 'Smart_Home="Y"'],
    'Mid-High Income': ['HHI>="$100K"', 'HHI_Percentile>=70'],
    'Existing US Corvache Customers': [
      'Corvache_CRM="Y"', 'Region="US"', 'Service_Active="Y"', 'Warranty_Active="Y"',
      'Loyalty_Tier>="Silver"', 'App_User="Y"', 'Newsletter_Optin="Y"', 'Test_Drive_12mo="Y"',
      'Purchase_2019_2026="Y"', 'Financing_Active="Y"', 'Lease_End_6mo="Y"', 'Trade_In_Intent="Y"',
      'Referral_Source="Y"', 'Event_Attendee="Y"', 'Configurator_Saved="Y"', 'Support_Tickets<=2',
      'NPS_Response>=8', 'Accessory_Buyer="Y"'
    ],
    'EV Purchase Intent': ['In_Market_EV="Y"', 'Purchase_Window_12mo="Y"', 'EV_Configurator_Visits>=1'],
    'No Prior EV in Household': ['EV_In_Household="N"', 'Garage_Fuel_Type="ICE"', 'First_Time_EV_Flag="Y"'],
    'Home or Workplace Charging Access': ['Home_Charger_Feasible="Y"', 'Workplace_Charging="Y"', 'Dwelling="Single_Family"'],
    'Read 2026 EV Safety Reports': ['Content_Category="EV Safety"', 'Article_Reads>=3', 'Dwell_Time>="90s"'],
    'Safety Aware': ['Safety_Feedback="Y"', 'Children="Y"']
  };
  var CAP = 5, BREAK_AT = 6;
  var FOLDER_ICO =
    '<svg width="11" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">' +
    '<path d="M1 2.2C1 1.5 1.5 1 2.2 1h2.4l1.2 1.4h4C10.5 2.4 11 2.9 11 3.6v4.2c0 .7-.5 1.2-1.2 1.2H2.2C1.5 9 1 8.5 1 7.8V2.2z" stroke="currentColor" stroke-width="1"/></svg>';
  var CHECK_ICO =
    '<svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">' +
    '<path d="M1 4l2.6 2.6L9 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var chipMenu = null, chipAnchor = null;

  function closeChipMenu() {
    if (chipAnchor) chipAnchor.classList.remove('ms-chip-open');
    chipAnchor = null;
    if (!chipMenu) return;
    var m = chipMenu; chipMenu = null;
    m.classList.add('is-closing');
    setTimeout(function () { m.remove(); }, 160);
  }
  window.MS_closeChipMenu = closeChipMenu;

  function chipRow(attr) {
    var row = document.createElement('div');
    row.className = 'ms-chipmenu-row';
    row.innerHTML = '<span class="ms-chipmenu-attr">' + esc(attr) + '</span>' +
      '<button type="button" class="ms-chipmenu-check is-checked" aria-label="Toggle ' + esc(attr) + '">' + CHECK_ICO + '</button>';
    row.querySelector('.ms-chipmenu-check').addEventListener('click', function () {
      this.classList.toggle('is-checked');
    });
    return row;
  }

  function renderChipRows(body, attrs, all) {
    body.innerHTML = '';
    var shown = (!all && attrs.length > BREAK_AT) ? attrs.slice(0, CAP) : attrs;
    shown.forEach(function (a) { body.appendChild(chipRow(a)); });
    if (!all && attrs.length > BREAK_AT) {
      var more = document.createElement('button');
      more.type = 'button';
      more.className = 'ms-chipmenu-all';
      more.textContent = 'View all ' + attrs.length + ' attributes';
      more.addEventListener('click', function () {
        chipMenu.classList.add('is-all');
        renderChipRows(body, attrs, true);
      });
      body.appendChild(more);
    }
  }

  function openChipMenu(chip, label) {
    if (chipAnchor === chip) { closeChipMenu(); return; }
    closeChipMenu();
    var attrs = ATTR_MAP[label];
    if (!attrs) return;
    chipMenu = document.createElement('div');
    chipMenu.className = 'ms-chipmenu';
    chipMenu.setAttribute('role', 'menu');
    chipMenu.innerHTML = '<div class="ms-chipmenu-title">' + FOLDER_ICO + '<span>' + esc(label) + '</span></div>' +
      '<div class="ms-chipmenu-body"></div>';
    renderChipRows(chipMenu.querySelector('.ms-chipmenu-body'), attrs, false);
    document.body.appendChild(chipMenu);
    var r = chip.getBoundingClientRect();
    var mw = chipMenu.offsetWidth, mh = chipMenu.offsetHeight;
    var left = Math.min(r.left, window.innerWidth - mw - 12);
    var top = r.bottom + 6;
    if (top + mh > window.innerHeight - 12) top = Math.max(12, r.top - mh - 6);
    chipMenu.style.left = Math.max(12, left) + 'px';
    chipMenu.style.top = top + 'px';
    chipAnchor = chip;
    chip.classList.add('ms-chip-open');
  }

  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest(CHIP_SELECTOR);
    if (chip) {
      var label = chip.textContent.replace(/[▾▼]/g, '').trim();
      e.preventDefault();
      e.stopPropagation();
      openChipMenu(chip, label);
      return;
    }
    if (chipMenu && !e.target.closest('.ms-chipmenu')) closeChipMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeChipMenu(); });
  window.addEventListener('resize', closeChipMenu);
  var canvasScroller = document.getElementById('canvas');
  if (canvasScroller) canvasScroller.addEventListener('scroll', closeChipMenu, { passive: true });

  /* ---------- Chapter nav: populate the rail panel from the active
     view's module mattes, scroll-spy the position, and take over the
     bottom-right pager (count + prev/next). Rebuilds on fragment load
     and view switches. ---------- */
  var chapters = [], chapterIdx = 0, navUL = null, pagerCount = null;

  function chapterTitle(matte) {
    var sec = matte.querySelector('section') || matte;
    var cls = sec.className || '';
    if (/finale/.test(cls)) return 'Back Cover';
    if (/cover/.test(cls)) return 'Cover';
    if (/hero/.test(cls) && !sec.querySelector('h1, h2, h3')) return 'Hero';
    var el = sec.querySelector('h1, h2, h3, [class*="eyebrow"], [class*="title"]');
    var t = '';
    if (el) {
      var clone = el.cloneNode(true);
      Array.prototype.forEach.call(
        clone.querySelectorAll('[class*="chip"], [class*="rank"], [class*="badge"], svg'),
        function (n) { n.remove(); }
      );
      t = clone.textContent;
    }
    t = t.replace(/[✦]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t && sec.querySelector('[class*="label"]')) t = 'Key Stats';
    if (t.length > 34) t = t.slice(0, 32).replace(/\s+\S*$/, '') + '…';
    return t || 'Module';
  }
  function visibleMattes() {
    var view = main.dataset.tab === 'plan' ? planView
      : main.dataset.tab === 'query' ? queryView : audView;
    if (!view) return [];
    return Array.prototype.filter.call(view.querySelectorAll('.ms-matte'), function (m) {
      return m.offsetParent !== null;
    });
  }
  function buildNav() {
    var panel = document.getElementById('railPanel');
    var canvas = document.getElementById('canvas');
    if (!panel || !canvas) return;
    chapters = visibleMattes().map(function (m) { return { el: m, title: chapterTitle(m) }; });
    if (navUL) navUL.remove();
    navUL = document.createElement('ul');
    navUL.className = 'rail-nav rail-nav-ms';
    chapters.forEach(function (ch, i) {
      var li = document.createElement('li');
      var row = document.createElement('div');
      row.className = 'nav-row';
      row.textContent = ch.title;
      li.appendChild(row);
      li.addEventListener('click', function () { gotoChapter(i); });
      navUL.appendChild(li);
    });
    var hotkeys = panel.querySelector('.rail-hotkeys');
    panel.insertBefore(navUL, hotkeys || null);
    if (hotkeys && !pagerCount) {
      pagerCount = document.createElement('div');
      pagerCount.className = 'rail-hotkeys-count';
      hotkeys.insertBefore(pagerCount, hotkeys.firstChild);
    }
    spy();
  }
  function canvasTop(el) {
    var c = document.getElementById('canvas');
    return el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop;
  }
  function gotoChapter(i) {
    if (!chapters.length) return;
    chapterIdx = Math.max(0, Math.min(i, chapters.length - 1));
    var c = document.getElementById('canvas');
    c.scrollTo({ top: Math.max(0, canvasTop(chapters[chapterIdx].el) - 12), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function spy() {
    if (!chapters.length) { if (pagerCount) pagerCount.textContent = ''; return; }
    var c = document.getElementById('canvas');
    var pos = c.scrollTop + 140;
    var idx = 0;
    for (var i = 0; i < chapters.length; i++) if (canvasTop(chapters[i].el) <= pos) idx = i;
    chapterIdx = idx;
    if (navUL) Array.prototype.forEach.call(navUL.children, function (li, i) {
      li.classList.toggle('active', i === idx);
    });
    if (pagerCount) pagerCount.textContent = (idx + 1) + '/' + chapters.length;
    var up = document.getElementById('hotkeyUp'), down = document.getElementById('hotkeyDown');
    if (up) up.disabled = idx === 0;
    if (down) down.disabled = idx >= chapters.length - 1;
  }
  var spyRaf = null;
  (function () {
    var c = document.getElementById('canvas');
    if (c) c.addEventListener('scroll', function () {
      if (spyRaf) return;
      spyRaf = requestAnimationFrame(function () { spyRaf = null; spy(); });
    }, { passive: true });
  })();
  /* pager takeover: capture-phase so the legacy chapter wiring on the
     same buttons never fires while our tabs are active */
  ['hotkeyUp', 'hotkeyDown'].forEach(function (id, isDown) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      var t = main.dataset.tab;
      if (t !== 'audience' && t !== 'plan') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      gotoChapter(chapterIdx + (isDown ? 1 : -1));
    }, true);
  });
  var navRebuild = null;
  function scheduleNavRebuild() {
    clearTimeout(navRebuild);
    navRebuild = setTimeout(buildNav, 120);
  }
  window.MS_rebuildNav = scheduleNavRebuild;

  /* ---------- Fragment loader ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.ms-frag[data-frag]'), function (holder) {
    var name = holder.getAttribute('data-frag');
    fetch('views/' + name + '.html')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        holder.innerHTML = html;
        /* innerHTML does not execute <script> — recreate in place */
        Array.prototype.forEach.call(holder.querySelectorAll('script'), function (old) {
          var s = document.createElement('script');
          if (old.src) s.src = old.src; else s.textContent = old.textContent;
          old.replaceWith(s);
        });
        wrapMattes(holder);
        assignBuildStagger(holder);
        initReveal(holder);
        scheduleNavRebuild();
      })
      .catch(function () {
        holder.classList.add('ms-frag-missing');
        console.info('[media-skills] fragment pending: views/' + name + '.html');
      });
  });

  /* ---------- Boot ---------- */
  var p = new URLSearchParams(location.search);
  var th = p.get('theme');
  if (th === 'light' || th === 'dark') {
    document.body.dataset.theme = th;
    try { localStorage.setItem('chatHatTheme', th); } catch (e) {}
  }
  /* &motion=off — deterministic full-render for screenshots/QA:
     everything reveals instantly, builds land in final state. */
  if (p.get('motion') === 'off') document.body.classList.add('ms-motion-off');
  /* &nav=open — QA helper: open the rail panel after boot */
  if (p.get('nav') === 'open') {
    setTimeout(function () {
      var h = document.getElementById('railHandle');
      if (h) h.click();
    }, 1600);
  }
  /* &scroll=bottom — QA helper: jump the canvas to its end once
     fragments have laid out. */
  /* &chip=<label> — QA helper: open that definition-chip menu on load */
  if (p.get('chip')) {
    setTimeout(function () {
      var want = p.get('chip');
      var chips = document.querySelectorAll('.audl-term-chip, .audoa-chip-def, .plana-chip--def');
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].textContent.replace(/[▾▼]/g, '').trim() === want) { chips[i].click(); break; }
      }
    }, 1800);
  }
  if (p.get('click')) {
    /* QA: "<selector>@<ms>" waits the given delay after the element
       appears before clicking — for targets that exist at load (shell
       chrome) but should be clicked mid-choreography. */
    var clickSpec = p.get('click');
    var clickAt = clickSpec.indexOf('@');
    var clickSel = clickAt === -1 ? clickSpec : clickSpec.slice(0, clickAt);
    var clickDelay = clickAt === -1 ? 600 : (parseInt(clickSpec.slice(clickAt + 1), 10) || 600);
    var tries = 0;
    (function tryClick() {
      var el = document.querySelector(clickSel);
      if (el) { setTimeout(function () { el.click(); }, clickDelay); return; }
      if (++tries < 60) setTimeout(tryClick, 100);
    })();
  }
  if (p.get('scroll')) {
    var jump = function () {
      var c = document.getElementById('canvas');
      if (!c) return;
      var v = p.get('scroll');
      if (v === 'bottom') { c.scrollTop = c.scrollHeight; return; }
      if (v.indexOf('sel:') === 0) {
        var t = document.querySelector(v.slice(4));
        if (t) c.scrollTop = t.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 100;
        return;
      }
      if (v.indexOf('frag:') === 0) {
        var h = document.querySelector('.ms-frag[data-frag="' + v.slice(5) + '"]');
        if (h) c.scrollTop = h.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 120;
        return;
      }
      var n = parseInt(v, 10);
      if (isFinite(n)) c.scrollTop = n;
    };
    window.addEventListener('load', function () { setTimeout(jump, 600); });
    setTimeout(jump, 1500);
    setTimeout(jump, 3200);   /* after any &click= drill re-layout */
  }
  apply(p.get('skill'), p.get('view'), false);
})();
