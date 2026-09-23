(function () {
  'use strict';

  // ── 1. Force the page into the persona-page chrome (graphics tab) ─
  //     The page-init code already handles ?canvas3=1; rather than
  //     hijack the URL, just stomp the dataset after the original init.
  const mainEl = document.getElementById('main');
  if (mainEl) {
    mainEl.dataset.tab = 'graphics';
    document.body.classList.add('canvas3-visible');
    // Sync topnav active tab
    document.querySelectorAll('.topnav .tab[data-tab]').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'graphics');
    });
    // Sync persona-view aria-hidden so it stops being hidden from
    // assistive tech (we're rendering the empty-state in it).
    const pv = document.getElementById('personaView');
    if (pv) pv.setAttribute('aria-hidden', 'false');
  }

  // ── 2. Demo flow data ─────────────────────────────────────────────
  //    A small linear script of prompts the chat-hat fires while the
  //    user "generates a persona." Each step has a title (the chat-hat
  //    header text), an optional sub-line, and 3 numbered options.
  //    Free-text fallback works at every step via the composer.
  const PERSONA_FLOW = [
    {
      key: 'persona-type',
      title: 'What kind of persona are we building?',
      sub: 'Pick one to anchor the rest of the brief. Or type your own.',
      options: [
        { id: 'buyer',       title: 'Buyer',           desc: 'Someone who is ready to purchase.' },
        { id: 'researcher',  title: 'Researcher',      desc: 'Comparing options, not ready to buy.' },
        { id: 'enthusiast',  title: 'Enthusiast',      desc: 'Loves the category, follows trends.' },
        { id: 'lapsed',      title: 'Lapsed Customer', desc: 'Bought once, hasn\'t come back.' },
        { id: 'loyalist',    title: 'Loyalist',        desc: 'Repeat buyer, advocates to friends.' },
        { id: 'gift-giver',  title: 'Gift Giver',      desc: 'Buying for someone else, not themselves.' },
        { id: 'budget',      title: 'Budget Shopper',  desc: 'Price-driven, hunting deals.' },
        { id: 'switcher',    title: 'Switcher',        desc: 'Considering a move from a competitor.' },
        { id: 'first-timer', title: 'First-Time Buyer',desc: 'New to the category entirely.' },
      ],
    },
    {
      key: 'intent',
      title: 'What is their purchase intent?',
      sub: 'How close are they to a decision?',
      options: [
        { id: 'low',  title: 'Low Intent',  desc: 'Browsing, no timeline.' },
        { id: 'mid',  title: 'Mid Intent',  desc: 'Comparing, 3–6 months out.' },
        { id: 'high', title: 'High Intent', desc: 'Ready to act this quarter.' },
      ],
    },
    {
      key: 'audience',
      title: 'Which audience are we writing for?',
      sub: 'This shapes voice, photography, and music in the magazine layout.',
      options: [
        { id: 'urban',   title: 'Urban Renter',     desc: 'Apartment-bound, multi-modal commute.' },
        { id: 'suburban', title: 'Suburban Family',  desc: 'Two-car household, kids in the mix.' },
        { id: 'pro',     title: 'Working Pro',      desc: 'Solo commuter, time-poor.' },
      ],
    },
    {
      key: 'tone',
      title: 'What tone should the persona land in?',
      sub: 'This affects the editorial copy and pull-quotes.',
      options: [
        { id: 'editorial', title: 'Editorial',     desc: 'Magazine-style, considered prose.' },
        { id: 'punchy',    title: 'Punchy',        desc: 'Short sentences, energetic.' },
        { id: 'academic',  title: 'Academic',      desc: 'Research-grade, citation-friendly.' },
      ],
    },
  ];

  // ── 3. ChatHat controller ─────────────────────────────────────────
  const ChatHat = (function () {
    const panel    = document.getElementById('chatAuxPanel');
    const title    = panel && panel.querySelector('.chat-aux-title');
    const promptEl = document.getElementById('chPrompt');
    const subEl    = document.getElementById('chPromptSub');
    const listEl   = document.getElementById('chOptList');
    const stream   = document.getElementById('chatStream');
    const composer = document.getElementById('composerInput');
    const emptySub = document.getElementById('chCanvasEmptySub');
    const auxHead  = panel && panel.querySelector('.chat-aux-head');

    let stepIdx     = -1;        // -1 = not running; 0..n-1 = current step
    let answers     = {};        // collected answers keyed by step.key
    let running     = false;
    let introRunning = false;    // intro choreography in flight (Persona chip)
    let taskListActive = false;  // task-watching mode is in play (collapsed hat)
    let _pinRaf      = null;     // active hat-grow → stream pin loop, if any

    // Drive the chat-stream's scrollTop in lockstep with the hat's
    // grow keyframe so the content above travels UP by the EXACT
    // same pixel delta the hat grew — they move in unison.
    //
    // The hat opens via `ch-fr-body-prompt` (max-height 0 → 300px,
    // cubic-bezier(0.4, 0, 0.2, 1), 60ms delay + 700ms duration).
    // Each RAF tick we read panel.getBoundingClientRect().height —
    // which reflects the keyframe's current computed value — and
    // advance scrollTop by (curH − startH). Reading layout this way
    // means the scroll naturally follows the SAME easing curve as
    // the hat, frame-for-frame. No snap-to-bottom: we anchor on the
    // user's scrollTop at t=0, so wherever they were reading stays
    // honoured — the only thing that moves is the hat's delta.
    function _pinChatStreamToHat(durationMs) {
      if (!stream || !panel) return;
      durationMs = durationMs || 900; // 60ms keyframe delay + 700ms duration + 140ms tail
      if (_pinRaf) cancelAnimationFrame(_pinRaf);
      const startTime    = performance.now();
      const startPanelH  = panel.getBoundingClientRect().height;
      const startScroll  = stream.scrollTop;
      function tick(now) {
        if (!stream || !panel) { _pinRaf = null; return; }
        const curH = panel.getBoundingClientRect().height;
        const delta = curH - startPanelH;
        if (delta > 0) {
          const maxScroll = stream.scrollHeight - stream.clientHeight;
          stream.scrollTop = Math.min(maxScroll, startScroll + delta);
        }
        if (now - startTime < durationMs) {
          _pinRaf = requestAnimationFrame(tick);
        } else {
          _pinRaf = null;
        }
      }
      _pinRaf = requestAnimationFrame(tick);
    }

    function _expand() {
      if (!panel) return;
      // Capture the pre-animation panel height and stream scrollTop
      // BEFORE flipping is-expanded — the pin's delta calculation
      // anchors to those values and tracks the keyframe from t=0.
      _pinChatStreamToHat();
      panel.classList.add('is-expanded');
      // Match existing pattern in lease-campaign — .is-fully-open is
      // flipped after the max-height transition so dropdowns can paint
      // outside the body clip rect. Mirror that here for parity.
      setTimeout(() => panel.classList.add('is-fully-open'), 400);
      const toggle = panel.querySelector('.chat-aux-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
    function _collapse() {
      if (!panel) return;
      panel.classList.remove('is-fully-open');
      panel.classList.remove('is-expanded');
      const toggle = panel.querySelector('.chat-aux-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    // Append a message bubble (user or bot) into the chat stream.
    function _msg(role, html, opts) {
      if (!stream) return;
      opts = opts || {};
      const div = document.createElement('div');
      div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
      if (opts.cls) div.classList.add(opts.cls);
      const head =
        '<div class="msg-head">' +
          '<div class="msg-avatar ' + (role === 'user' ? 'av-bc' : 'av-corv') + '">' +
            (role === 'user' ? 'BC' : '⌬') +
          '</div>' +
          '<div class="msg-meta">' +
            '<span class="msg-name">' + (role === 'user' ? 'Bryan Cocco' : 'Acme') + '</span>' +
            '<span class="msg-dot"></span>' +
            '<span class="msg-time">Today, 2:24 PM</span>' +
          '</div>' +
        '</div>';
      div.innerHTML = head + '<div class="body">' + html + '</div>';
      stream.appendChild(div);
      _autoScrollToBottom();
    }

    // Note #3 — echo the user's choice as a chat message when the
    // prompt collapses. Free-text answers also flow through here.
    function _echo(stepKey, label, isFreeText) {
      const phrase = isFreeText
        ? 'I want: <span class="ch-choice-pill">' + _escape(label) + '</span>'
        : 'You chose: <span class="ch-choice-pill">' + _escape(label) + '</span>';
      _msg('user', phrase, { cls: 'user-choice' });
    }

    function _escape(s) {
      return String(s).replace(/[&<>"']/g, m => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
      })[m]);
    }

    function _renderStep(step) {
      if (!panel || !title || !listEl) return;

      const buildOptions = () => {
        title.textContent = step.title;
        subEl.textContent = step.sub || 'Pick one, or type your own.';
        listEl.innerHTML = '';

        // Helper — build a single preset option card. The displayed
        // number is the card's POSITION in the visible list, not its
        // index in step.options (the custom "Other" card always sits
        // at position 4 and bumps everything after it by one).
        const buildPresetCard = (opt, displayNum) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ch-opt';
          btn.setAttribute('data-opt-id', opt.id);
          btn.setAttribute('data-step', step.key);
          btn.innerHTML =
            '<span class="ch-opt-num">' + displayNum + '</span>' +
            '<span class="ch-opt-body">' +
              '<span class="ch-opt-title">' + _escape(opt.title) + '</span>' +
              '<span class="ch-opt-desc">' + _escape(opt.desc) + '</span>' +
            '</span>';
          btn.addEventListener('click', () => _pick(opt, false));
          return btn;
        };

        // First 3 preset options (positions 1, 2, 3).
        step.options.slice(0, 3).forEach((opt, i) => {
          listEl.appendChild(buildPresetCard(opt, i + 1));
        });

        // 4th option — "Other" card with persistent inline input.
        // Always sits at position 4 so the expanded hat fits exactly
        // 3 presets + the custom input in its first viewport before
        // anything else has to scroll into view. Label (title+desc)
        // and input both live in the DOM permanently and cross-fade
        // via CSS based on the is-editing class. No innerHTML swap
        // = no content snap, smooth eased transition.
        const custom = document.createElement('div');
        custom.className = 'ch-opt ch-opt-custom';
        custom.setAttribute('role', 'button');
        custom.setAttribute('tabindex', '0');
        custom.setAttribute('data-opt-id', 'custom');
        custom.setAttribute('data-step', step.key);
        custom.innerHTML =
          '<span class="ch-opt-num">4</span>' +
          '<span class="ch-opt-body">' +
            '<span class="ch-opt-custom-label">' +
              '<span class="ch-opt-title">Other</span>' +
              '<span class="ch-opt-desc">Type your own answer.</span>' +
            '</span>' +
            '<input type="text" class="ch-opt-custom-input" ' +
              'placeholder="Type your own answer, then press Enter…" ' +
              'aria-label="Custom answer" autocomplete="off" tabindex="-1" />' +
          '</span>' +
          '<button class="ch-opt-custom-close" type="button" ' +
            'aria-label="Cancel custom answer" tabindex="-1">' +
            '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" ' +
              'stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<path d="M2 2l6 6M8 2l-6 6"/></svg>' +
          '</button>';

        const input = custom.querySelector('.ch-opt-custom-input');
        const closeBtn = custom.querySelector('.ch-opt-custom-close');
        const sendBtn = document.getElementById('sendBtn');

        // Restore card to its pre-edit state — used by the X button +
        // when input is cleared or another option is picked.
        const COMPOSER_DEFAULT_PLACEHOLDER = 'Type your message...';
        const COMPOSER_BLOCKED_PLACEHOLDER = 'Finish your custom answer above…';

        const deactivateCustom = () => {
          if (!custom.classList.contains('is-editing')) return;
          custom.classList.remove('is-editing');
          if (input) {
            input.value = '';
            input.blur();
            input.setAttribute('tabindex', '-1');
          }
          if (closeBtn) closeBtn.setAttribute('tabindex', '-1');
          const sb = document.getElementById('sendBtn');
          if (sb) sb.classList.remove('is-submit');
          // Unblock the composer textarea so the user can resume
          // typing there once the custom card is done. Swap the
          // placeholder back to the default — the textarea's :disabled
          // opacity transition (240ms) carries the visual fade.
          const ci = document.getElementById('composerInput');
          if (ci) {
            ci.setAttribute('placeholder', COMPOSER_DEFAULT_PLACEHOLDER);
            ci.disabled = false;
          }
        };
        custom._deactivate = deactivateCustom;

        const activateCustom = () => {
          if (custom.classList.contains('is-editing')) return;
          custom.classList.add('is-editing');
          // Morph the send button to "Submit" the instant the card is
          // activated — don't wait for the user to start typing.
          if (sendBtn) sendBtn.classList.add('is-submit');
          if (input) {
            input.setAttribute('tabindex', '0');
            // Wait for the fade-in to start before focus so the caret
            // doesn't jump in before the input becomes visible.
            setTimeout(() => input.focus({ preventScroll: true }), 80);
          }
          if (closeBtn) closeBtn.setAttribute('tabindex', '0');
          // Block the composer textarea while typing in option 4 so
          // the user can't accidentally enter text in two places.
          // Disable first → the :disabled CSS triggers opacity fade
          // 1 → 0.4 over 240ms. Swap placeholder text mid-fade so
          // the change happens while the text is already dim.
          const ci = document.getElementById('composerInput');
          if (ci) {
            ci.disabled = true;
            setTimeout(() => {
              if (ci.disabled) {
                ci.setAttribute('placeholder', COMPOSER_BLOCKED_PLACEHOLDER);
              }
            }, 160);
          }
        };

        // Wire input events (only fire when input has pointer-events,
        // i.e. when is-editing is active — but safe to wire once).
        if (input) {
          input.addEventListener('input', () => {
            // The Submit morph is now tied to the card being active
            // (set in activateCustom / cleared in deactivateCustom), so
            // it no longer follows the input text. Keep it pinned on even
            // if the field is emptied — only an explicit exit reverts it.
            if (sendBtn && !sendBtn.classList.contains('is-submit')) {
              sendBtn.classList.add('is-submit');
            }
          });
          input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              const val = input.value.trim();
              if (val) {
                if (sendBtn) sendBtn.classList.remove('is-submit');
                _pick({ id: 'custom', title: val }, true);
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              deactivateCustom();
            }
          });
          input.addEventListener('click', (e) => e.stopPropagation());
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deactivateCustom();
          });
        }

        custom.addEventListener('click', activateCustom);
        custom.addEventListener('keydown', (e) => {
          if (!custom.classList.contains('is-editing') &&
              (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            activateCustom();
          }
        });
        listEl.appendChild(custom);

        // Remaining preset options (positions 5+) — these fall below
        // the custom card and scroll into view. step.options[3..] are
        // numbered 5, 6, 7, ... in the visible list.
        step.options.slice(3).forEach((opt, i) => {
          listEl.appendChild(buildPresetCard(opt, i + 5));
        });
      };

      const finishMount = () => {
        // Note #1 — entrance pulse on prompt fire.
        panel.classList.add('ch-prompt-active', 'ch-just-fired');
        setTimeout(() => panel.classList.remove('ch-just-fired'), 600);
        // Replay the first-reveal color wipe (halo bloom + diagonal
        // sheen sweep + border-trace glow) when question 1 pops open
        // from a collapsed state — same look the initial page-load
        // reveal has. Skipped when the panel is already expanded so
        // we don't yank the body collapsed-then-back.
        const wasCollapsed = !panel.classList.contains('is-expanded');
        if (wasCollapsed) panel.classList.add('ch-first-reveal');
        _expand();
        if (wasCollapsed) {
          setTimeout(() => panel.classList.remove('ch-first-reveal'), 1250);
        }
        // Move focus to the first option for keyboard pickers.
        const first = listEl.querySelector('.ch-opt');
        if (first) first.focus({ preventScroll: true });
      };

      const isFirstActivation = !panel.classList.contains('ch-prompt-active');

      if (isFirstActivation) {
        // Premium swap: fade chips out (260ms), then mount the prompt.
        const chipsEl = panel.querySelector('.chat-aux-chips');
        if (chipsEl) chipsEl.classList.add('is-leaving');
        setTimeout(() => {
          buildOptions();
          finishMount();
          if (chipsEl) chipsEl.classList.remove('is-leaving');
        }, 260);
      } else {
        // Subsequent step changes — already in prompt mode. Keep
        // ch-prompt-active set the whole time so the panel never
        // collapses or shows chips between steps. Fade current
        // content out, rebuild, fade new in. The new option cards
        // animate in via their existing per-card stagger.
        const promptEl = document.getElementById('chPrompt');
        if (promptEl) promptEl.classList.add('is-swapping');
        title.classList.add('is-changing');
        if (subEl) subEl.classList.add('is-changing');
        setTimeout(() => {
          buildOptions();
          title.classList.remove('is-changing');
          if (subEl) subEl.classList.remove('is-changing');
          if (promptEl) promptEl.classList.remove('is-swapping');
          // If the hat is currently collapsed (e.g. the user was in
          // task-watching mode for the previous step), fire it open
          // for the new question AND replay the first-reveal wipe
          // animation so the open reads as a fresh "lit up" moment
          // — same halo bloom + diagonal sheen sweep + border-trace
          // glow the hat uses on initial page load. Skip the replay
          // if the panel was already expanded so we don't yank the
          // body collapsed-then-re-open.
          const wasCollapsed = !panel.classList.contains('is-expanded');
          if (wasCollapsed) panel.classList.add('ch-first-reveal');
          _expand();
          if (wasCollapsed) {
            setTimeout(() => panel.classList.remove('ch-first-reveal'), 1250);
          }
          // Re-focus on the first option after swap completes.
          const first = listEl.querySelector('.ch-opt');
          if (first) setTimeout(() => first.focus({ preventScroll: true }), 80);
        }, 220);
      }
    }

    // Skeleton loader on the right side — covers the OMNI empty
    // state while the persona generates, then fades out as the
    // resolved magazine view fades in.
    function _showPersonaSkeleton() {
      const skel = document.getElementById('chPersonaSkeleton');
      if (!skel) return;
      skel.classList.add('is-active');
      // Force a reflow so the fade-in animates from opacity 0.
      void skel.offsetHeight;
      skel.classList.add('is-visible');
    }
    function _resolvePersonaView() {
      const skel = document.getElementById('chPersonaSkeleton');
      // Fade the skeleton out FIRST, then flip the resolved class on
      // <body> so the persona-view's own fade-in animation runs into
      // the gap. Result: one smooth handoff, no flash of empty state.
      if (skel) {
        skel.classList.remove('is-visible');
        setTimeout(() => skel.classList.remove('is-active'), 360);
      }
      setTimeout(() => {
        document.body.classList.add('is-persona-resolved');
      }, 220);
    }
    // Hide the skeleton without re-flipping the body's resolved
    // flag — used by steps 2-4 where the persona is already
    // resolved but we briefly overlay the skeleton again to show
    // "regenerating" while the task pipeline runs.
    function _hidePersonaSkeleton() {
      const skel = document.getElementById('chPersonaSkeleton');
      if (!skel) return;
      skel.classList.remove('is-visible');
      setTimeout(() => skel.classList.remove('is-active'), 360);
    }

    // Smooth scroll-to-bottom on message append. Uses the explicit
    // per-call `behavior: 'smooth'` option on scrollTo() — NOT a
    // global `scroll-behavior: smooth` CSS rule (Chromium applies
    // that to direct `scrollTop = X` writes too, which would lag
    // the hat-grow pin loop; see SESSION.md "Chat-stream scroll
    // behavior" + reference-chromium-scroll-behavior-quirk memory).
    // The typewriter does its own direct scrollTop writes every
    // ~4 chars and stays instant (smoothing per-char would chase
    // and jitter). The hat-grow pin uses direct scrollTop writes
    // and stays instant (frame-perfect sync with the max-height
    // transition is the whole point).
    function _autoScrollToBottom() {
      if (!stream) return;
      stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
    }

    // Smoothly collapse + remove a message node (used to retire the
    // grey fira-code thought line once the AI's "real" message lands).
    // Locks the current pixel height before adding .is-fading so the
    // max-height transition has a starting value to ease from —
    // without this, the browser snaps from auto → 0 and the
    // surrounding messages jump.
    function _fadeAndRemove(node) {
      if (!node || !node.parentNode) return;
      node.style.maxHeight = node.offsetHeight + 'px';
      void node.offsetHeight;
      node.classList.add('is-fading');
      setTimeout(() => {
        if (node.parentNode) node.remove();
      }, 420);
    }

    // Per-step choreography for questions 2-4. Each entry drives the
    // full sequence: user bubble phrasing, the grey fira-code system
    // thought, the in-progress tasks shown in the chat hat, and the
    // Canvas Assistant message that fires after the tasks complete.
    // (Step 1 / persona-type is handled inline below — it has the
    // skeleton-to-resolved transition on the right side, so it
    // doesn't fit cleanly into this config.)
    const STEP_CHOREOGRAPHY = {
      intent: {
        userBubble: (label) => 'Set the intent to ' + label + '.',
        thoughtText: (label) =>
          'The user picked ' + label + ' intent. Let me update the persona\'s ' +
          'timeline and motivations to match. Re-checking moment-of-truth data ' +
          'across the brief. Updating to-dos… ...',
        tasks: [
          'Capture purchase intent and timeline',
          'Update motivations and key triggers',
          'Refresh moments-of-truth in the brief'
        ],
        durations: [1300, 1800, 1700],
        finalMessage: (label) =>
          '<p>Persona timeline updated for <strong>' + _escape(label) + '</strong> intent. ' +
          'What audience are we writing for next — pick one below, or type your own.</p>'
      },
      audience: {
        userBubble: (label) => 'Make it for the ' + label + ' audience.',
        thoughtText: (label) =>
          'The user picked the ' + label + ' audience. Let me update the ' +
          'demographic profile, channel preferences, and segment data to match. ' +
          'Updating to-dos… ...',
        tasks: [
          'Update audience segment and demographics',
          'Refresh channel preferences',
          'Realign editorial voice hints'
        ],
        durations: [1400, 1800, 1700],
        finalMessage: (label) =>
          '<p>Persona refreshed for the <strong>' + _escape(label) + '</strong> audience. ' +
          'What tone should the persona land in?</p>'
      },
      tone: {
        userBubble: (label) => 'Use the ' + label + ' tone.',
        thoughtText: (label) =>
          'The user picked the ' + label + ' tone. Let me finalize the persona\'s ' +
          'voice and editorial copy style. Locking the artifact. Wrapping up… ...',
        tasks: [
          'Set the editorial tone and voice',
          'Generate the magazine pull-quotes',
          'Lock the final persona artifact'
        ],
        durations: [1300, 1700, 1500],
        finalMessage: (label) =>
          '<p>Your persona is complete. The <strong>' + _escape(label) + '</strong> tone is ' +
          'locked in — check the magazine on the right for the final cut.</p>'
      }
    };

    // Fire a brief accent halo around the persona view to signal
    // "this just updated". Animation lives in CSS (.is-step-pulse).
    function _pulsePersonaView() {
      const pv = document.getElementById('personaView');
      if (!pv) return;
      pv.classList.remove('is-step-pulse');
      void pv.offsetHeight;
      pv.classList.add('is-step-pulse');
      setTimeout(() => pv.classList.remove('is-step-pulse'), 950);
    }

    // Per-step CSS selectors for the persona-view elements that
    // should shimmer-skeleton while a step's task pipeline runs.
    // Broader than before — each step now reaches deeper into the
    // magazine (psychographics prose, behaviors strip, motivations,
    // channels, finale meta) so the user sees the persona being
    // "rebuilt" across the whole page, not just the top fold.
    const STEP_RIGHT_LOAD_TARGETS = {
      intent: [
        '.ph-subtitle--alt',
        '.persona-pullquote .pq-body',
        '.persona-pullquote .pq-attr',
        '.pd-card-value',
        '.persona-feature .ps-eyebrow',
        '.persona-feature .pf-lede',
        '.persona-feature .pf-prose-body p',
        '.persona-strip .ps-eyebrow',
        '.persona-strip .ps-content p',
        '.persona-twoup .ptu-title',
        '.persona-twoup .ptu-list li',
        '.persona-twoup .ptu-channels li',
        '.persona-finale .bib-finale-meta p',
        '.persona-finale .bib-finale-eyebrow'
      ].join(', '),
      audience: [
        '.ph-subtitle',
        '.ph-subtitle--alt',
        '.pd-card-value',
        '.pd-card-label',
        '.persona-pullquote .pq-body',
        '.persona-feature .pf-lede',
        '.persona-feature .pf-prose-body p',
        '.persona-strip .ps-eyebrow',
        '.persona-strip .ps-content p',
        '.persona-twoup .ptu-list li',
        '.persona-twoup .ptu-channels li',
        '.persona-finale .bib-finale-meta p'
      ].join(', '),
      tone: [
        '.ph-subtitle--alt',
        '.persona-pullquote .pq-body',
        '.persona-pullquote .pq-attr',
        '.persona-feature .pf-lede',
        '.persona-feature .pf-prose-body p',
        '.persona-strip .ps-content p',
        '.persona-twoup .ptu-title',
        '.persona-twoup .ptu-list li',
        '.persona-finale .bib-finale-meta p'
      ].join(', ')
    };

    // Apply / remove the shimmer-skeleton state on a step's targets,
    // with a top-down stagger so the elements ripple into / out of
    // the skeleton state in a coordinated wave. When clearing, also
    // tag each element with .is-revealing so the text fades back in
    // with the buttery blur-clear + lift + scale-up animation
    // instead of just popping into place.
    function _setRightSideLoading(stepKey, on) {
      const pv = document.getElementById('personaView');
      const sel = STEP_RIGHT_LOAD_TARGETS[stepKey];
      if (!pv || !sel) return;
      const active = pv.querySelector('.persona-page[data-persona].is-active')
                 || pv.querySelector('.persona-page[data-persona]')
                 || pv;
      const targets = Array.from(active.querySelectorAll(sel));
      targets.forEach((el, idx) => {
        const orderedIdx = on ? idx : (targets.length - 1 - idx);
        const delay = orderedIdx * 38;
        setTimeout(() => {
          if (on) {
            el.classList.remove('is-revealing');
            el.classList.add('is-right-loading');
          } else {
            el.classList.remove('is-right-loading');
            // Reset, force reflow so the animation re-fires, then add.
            el.classList.remove('is-revealing');
            void el.offsetHeight;
            el.classList.add('is-revealing');
            // Clean the class once the animation has settled so
            // re-entering loading state later starts cleanly.
            setTimeout(() => el.classList.remove('is-revealing'), 700);
          }
        }, delay);
      });
    }

    // Shared choreography for steps 2-4. Only the per-step TARGETED
    // elements turn into shimmer blocks (matching the initial
    // skeleton's animation) — the rest of the persona stays visible
    // so the user sees "just these bits are being edited" instead of
    // the whole magazine reverting to skeleton state.
    function _runStepChoreography(stepKey, label, isFreeText) {
      const cfg = STEP_CHOREOGRAPHY[stepKey];
      if (!cfg) { _next(); return; }
      const userText = isFreeText ? label : cfg.userBubble(label);

      // Right-side feedback — turn ONLY the step's targeted persona
      // text blocks into shimmer skeletons (using the same shimmer
      // animation as the initial skeleton). Everything else stays.
      _setRightSideLoading(stepKey, true);

      // Coordinate the two parallel tracks (task pipeline + chat
      // stream typewriter) so the Canvas Assistant follow-up
      // message lands the INSTANT the grey thought line finishes
      // fading away. Previously: tasks finished, 700ms wait, then
      // rich response — but the thought's fade ran on its own
      // timeline and usually completed ~400ms before the rich
      // response appeared, leaving a visible empty slot. Both
      // tracks now flip a flag and call the same gated showRich()
      // — whichever lands second fires the message immediately.
      let _tasksDone = false, _thoughtRemoved = false, _richShown = false;
      const showRich = () => {
        if (_richShown || !_tasksDone || !_thoughtRemoved) return;
        _richShown = true;
        _msgRichResponse(cfg.finalMessage(label));
        setTimeout(() => _next(), 600);
      };

      // INSTANT: morph the chat hat into the task list.
      _renderTaskList({
        tasks: cfg.tasks,
        durations: cfg.durations,
        onAllDone: () => {
          // Clear the per-element loading state and pulse the magazine.
          _setRightSideLoading(stepKey, false);
          _pulsePersonaView();
          // Flag tasks done — showRich() will fire the rich response
          // the moment the thought's fade-out also completes.
          _tasksDone = true;
          showRich();
        }
      });

      // Parallel: chat-stream choreography.
      setTimeout(() => {
        _msgUserBubble(userText);
        setTimeout(() => {
          const thought = _msgThoughtLine();
          setTimeout(() => {
            _typeInto(thought, cfg.thoughtText(label), { charDelay: 14 }).then(() => {
              setTimeout(() => {
                _fadeAndRemove(thought);
                // _fadeAndRemove removes the node after 420ms — flip
                // the flag at that same beat so showRich() fires the
                // Canvas Assistant message with NO visible gap.
                setTimeout(() => {
                  _thoughtRemoved = true;
                  showRich();
                }, 420);
              }, 240);
            });
          }, 1400);
        }, 480);
      }, 120);
    }

    // 6-task pipeline shown in the chat hat after the user picks a
    // persona type. Mirrors the deep-research task pane Bryan shared,
    // but scoped to a persona-builder workflow.
    const PERSONA_TASKS = [
      'Clarify and confirm persona type with user',
      'Write persona-brief.json',
      'Research category context and demographic signals',
      'Synthesize motivations, objections, and jobs-to-be-done',
      'Write persona-profile.md',
      'Build final persona-card.json',
    ];

    // Per-task durations in ms — sized to match the duration of the
    // grey fira-code typewriter that runs in the chat stream (~400
    // chars × 14ms/char ≈ 5500ms typewriter, starting ~2400ms after
    // the user pick once the bubble + thought line have mounted, so
    // the typewriter completes around T=7900ms). Summing to ~7900ms
    // here keeps the 6-task walkthrough finishing at the same beat.
    const PERSONA_TASK_DURATIONS = [900, 1250, 1450, 1400, 1350, 1550];

    function _renderTaskList(opts) {
      if (!listEl || !title) return;
      const tasks = (opts && opts.tasks) || PERSONA_TASKS;
      const durations = (opts && opts.durations) || PERSONA_TASK_DURATIONS;
      const onAllDone = opts && opts.onAllDone;
      const total = tasks.length;
      // Initial state: task 0 in-progress, rest pending. Flat list
      // — no "Pending" subsection label, because the sequence of
      // state changes is what the user reads, not the grouping.
      const taskItem = (i) => {
        const cls = i === 0 ? 'is-in-progress' : 'is-pending';
        return (
          '<div class="ch-task-item ' + cls + '" data-task-idx="' + i + '">' +
            '<span class="ch-task-icon" aria-hidden="true"></span>' +
            '<span class="ch-task-text"><strong>' + (i + 1) + ' of ' + total + ':</strong> ' + _escape(tasks[i]) + '</span>' +
          '</div>'
        );
      };
      const allItems = tasks.map((_, i) => taskItem(i)).join('');
      const taskListHtml =
        '<div class="ch-task-list">' +
          '<div class="ch-task-section">' + allItems + '</div>' +
        '</div>';

      // Order matters here. The earlier version swapped the body
      // content (option cards → task list) AND collapsed the body
      // at the same moment, which caused a jump: the option-card
      // content was ~500-700px tall (clipped to 300px by max-height),
      // and the new task list is ~200px tall, so swapping shrunk
      // the body's actual height by ~100px instantly BEFORE the
      // 300→0 max-height transition kicked in. The collapse animation
      // started from the new shorter height, not 300, and looked
      // like it jumped.
      //
      // New order:
      //   1) Fade option cards out (300ms)
      //   2) Lock the body's current pixel height inline, then call
      //      _collapse() — transition runs from the explicit px to
      //      0 over 380ms with no content-shrink jump
      //   3) After the collapse settles, swap in the task list and
      //      mark it entered (no fade-in needed, body is hidden)
      //   4) Kick off the task progression
      listEl.classList.add('is-leaving');
      setTimeout(() => {
        const body = panel && panel.querySelector('.chat-aux-body');
        if (body) {
          // Pin current pixel height before the class-driven
          // max-height collapses — gives the transition a concrete
          // start value instead of "auto / content-driven".
          body.style.maxHeight = body.offsetHeight + 'px';
          void body.offsetHeight;
        }
        // Swap the title NOW (while body is still expanded showing
        // faded-out option cards) — the title-bar swap happens in
        // the header which is always visible.
        _setTaskTitle(0, tasks);
        taskListActive = true;
        _collapse();
        // Wait for the collapse transition to complete (~380ms +
        // 60ms buffer), THEN swap the body content. Now the body
        // is fully collapsed (max-height 0) so the content swap
        // is invisible — no flash, no jump.
        setTimeout(() => {
          listEl.innerHTML = taskListHtml;
          listEl.classList.remove('is-leaving');
          const tl = listEl.querySelector('.ch-task-list');
          if (tl) {
            void tl.offsetHeight;
            tl.classList.add('is-entered');
          }
          // Release the inline max-height pin so subsequent expand
          // calls can use the CSS-driven max-height again.
          if (body) body.style.maxHeight = '';
          _advanceTasks(0, tasks, durations, onAllDone);
        }, 440);
      }, 300);
    }

    // Set the chat-aux-title to the compact task-head marker for the
    // task at `idx` (within the passed `tasks` array). Uses the
    // existing .is-changing fade so the swap between tasks feels
    // coordinated with the body progression.
    function _setTaskTitle(idx, tasks) {
      if (!title) return;
      const list = tasks || PERSONA_TASKS;
      const total = list.length;
      const taskText = list[idx] || '';
      const html =
        '<span class="ch-task-head-marker">' +
          '<span class="ch-task-head-icon" aria-hidden="true"></span>' +
          '<span class="ch-task-head-text"><strong>' + (idx + 1) + ' of ' + total + ':</strong> ' + _escape(taskText) + '</span>' +
        '</span>';
      title.classList.add('is-changing');
      setTimeout(() => {
        title.innerHTML = html;
        title.classList.remove('is-changing');
      }, 180);
    }

    function _advanceTasks(idx, tasks, durations, onAllDone) {
      const items = listEl.querySelectorAll('.ch-task-item');
      if (!items.length || idx >= items.length) {
        if (typeof onAllDone === 'function') onAllDone();
        return;
      }
      const duration = (durations && durations[idx]) || 1200;
      setTimeout(() => {
        const cur = items[idx];
        if (cur) {
          cur.classList.remove('is-in-progress');
          cur.classList.add('is-done');
        }
        const next = items[idx + 1];
        if (next) {
          next.classList.remove('is-pending');
          next.classList.add('is-in-progress');
          _setTaskTitle(idx + 1, tasks);
          _advanceTasks(idx + 1, tasks, durations, onAllDone);
        } else {
          setTimeout(() => {
            taskListActive = false;
            if (typeof onAllDone === 'function') onAllDone();
          }, 500);
        }
      }, duration);
    }

    function _pick(opt, isFreeText) {
      const step = PERSONA_FLOW[stepIdx];
      if (!step) return;
      const label = opt.title;
      answers[step.key] = isFreeText ? { id: 'free', title: label } : opt;
      // Whenever ANY answer is committed, strip the SUBMIT morph
      // from the send button AND re-enable the composer textarea
      // (in case the user was mid-typing in option 4 and clicked
      // a different option). Restore the default placeholder too —
      // otherwise the "Finish your custom answer above…" text would
      // stick around after the custom card is gone.
      const sb = document.getElementById('sendBtn');
      if (sb) sb.classList.remove('is-submit');
      const ci = document.getElementById('composerInput');
      if (ci) {
        ci.setAttribute('placeholder', 'Type your message...');
        ci.disabled = false;
      }
      // Brief flash of "picked" state.
      const card = listEl && listEl.querySelector('.ch-opt[data-opt-id="' + opt.id + '"]');
      if (card) card.classList.add('is-picked');

      // ── Special handling for STEP 1 (persona-type) ────────────────
      //   1) Drop a real BC user bubble into the chat (not the
      //      "You chose X" pill).
      //   2) Skeleton loader takes over the right canvas right away
      //      so the user sees the persona "being built" while the
      //      thinking + task list play out on the left.
      //   3) Fire the orb → fira-code typewriter explaining what
      //      the assistant is about to do, scoped to persona.
      //   4) Morph the chat hat's option cards into the task list.
      //   5) Skeleton fades out and the resolved persona magazine
      //      view fades in — Bryan's "the right side resolves to
      //      this attached persona" moment.
      if (step.key === 'persona-type') {
        // Wrap the option label in a natural sentence so the user
        // bubble reads as a real chat message instead of a one-word
        // tag. Free-text answers (the custom "Other" path) pass
        // through unchanged — whatever the user typed is already a
        // full sentence.
        const userBubbleText = isFreeText
          ? label
          : 'Build me a ' + label + ' persona.';

        // INSTANT: morph the chat hat to the task-list view right
        // away and drop the skeleton on the right side. The chat
        // stream choreography (BC bubble + thinking + typewriter)
        // plays in parallel below.
        _renderTaskList({
          onAllDone: () => {
            // 1) Skeleton fades, persona magazine fades in.
            _resolvePersonaView();
            // 2) Once the magazine settles, Canvas Assistant tells
            //    the user the persona is ready and hands off to
            //    question 2. _next() advances stepIdx and renders
            //    the next step — _renderStep's finishMount calls
            //    _expand() so the hat auto-opens even if it's
            //    currently collapsed in task-watching mode.
            setTimeout(() => {
              _msgRichResponse(
                '<p>Your ' + _escape(label) + ' persona is ready on the right. ' +
                'What\'s next — pick one of the options below, or type your own.</p>'
              );
              setTimeout(() => _next(), 600);
            }, 1000);
          }
        });
        _showPersonaSkeleton();

        setTimeout(() => {
          _msgUserBubble(userBubbleText);
          setTimeout(() => {
            const thought = _msgThoughtLine();
            setTimeout(() => {
              const personaThoughtText =
                'The user wants to generate a ' + label + ' persona. Let me follow ' +
                'the persona-builder skill instructions. First, I need to clarify the ' +
                'persona scope before starting research. Let me present the understood ' +
                'persona type, assumptions, and ask for confirmation. Let me start by ' +
                'setting up the to-do list and then asking for scope confirmation. ' +
                'Updating to-dos… ...';
              _typeInto(thought, personaThoughtText, { charDelay: 14 }).then(() => {
                // Thought fades out — it's been "replaced" by the
                // visible task list already running in the chat hat.
                setTimeout(() => _fadeAndRemove(thought), 240);
              });
            }, 1800);
          }, 480);
        }, 120);
        return;
      }

      // Steps 2-4 (intent / audience / tone) all share the same
      // step-choreography template — user bubble + thinking line +
      // chat-hat task list + persona-view pulse + Canvas Assistant
      // hand-off message + advance to the next question.
      if (STEP_CHOREOGRAPHY[step.key]) {
        _runStepChoreography(step.key, label, isFreeText);
        return;
      }

      // Fallback (shouldn't hit — every PERSONA_FLOW step has a
      // choreography entry now). Keep the old echo + advance for
      // safety.
      _echo(step.key, label, isFreeText);
      setTimeout(() => {
        _next();
      }, 320);
    }

    function _next() {
      stepIdx++;
      if (stepIdx >= PERSONA_FLOW.length) {
        _finish();
        return;
      }
      _renderStep(PERSONA_FLOW[stepIdx]);
    }

    function _finish() {
      running = false;
      stepIdx = -1;
      // Wrap the panel back to its idle title + collapsed state.
      if (title) title.textContent = 'What would you like to create?';
      if (panel) panel.classList.remove('ch-prompt-active');
      _collapse();
      // Summarize what we collected.
      const summary = Object.values(answers).map(a => a.title).join(' · ');
      _msg('bot',
        'Got it. Generating a persona based on: <span class="ch-choice-pill">' +
        _escape(summary) +
        '</span><br><br>(Right-side canvas will render the persona once we wire it up — for now this prototype proves the Chat Hat flow.)'
      );
      // Update the canvas empty-state copy to reflect "ready" state.
      if (emptySub) {
        emptySub.textContent =
          'Persona profile collected: ' + summary +
          '. In the next pass we\'ll render the magazine spread here, populated from your answers.';
      }
      answers = {};
    }

    // Public start API — kicks the flow.
    function start(opts) {
      if (running) return;
      running = true;
      stepIdx = -1;
      answers = {};
      if (!(opts && opts.silent)) {
        _msg('bot', 'Let\'s build a persona. I\'ll ask a few quick questions — pick a card or type your own answer.');
      }
      _next();
    }

    // ── Persona intro choreography ───────────────────────────────────
    //   User clicks the Persona chip → fill the chat stream with the
    //   feedback Bryan asked for before opening the prompt flow:
    //     1) User bubble  ("Guide me through creating a Persona")
    //     2) Slim system-thought line  (orb spinner)
    //     3) Spinner morphs away, fira-code typewriter types the
    //        internal thought left-to-right with blinking caret
    //     4) Canvas Assistant bubble with the rich Persona response
    //        (heading + table + workflow + tips + how-to-trigger)
    //   Resolves once the rich response has been inserted, so the
    //   caller can fire the prompt cards next without overlap.
    function _msgUserBubble(text) {
      if (!stream) return null;
      const node = document.createElement('div');
      node.className = 'msg user ch-injected';
      node.innerHTML =
        '<div class="bubble">' +
          '<div class="msg-head">' +
            '<div class="msg-avatar av-nick">BC</div>' +
            '<div class="msg-meta">' +
              '<span class="msg-name">Bryan Cocco</span>' +
              '<span class="msg-dot"></span>' +
              '<span class="msg-time">' + (typeof timeNow === 'function' ? timeNow() : '') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      // Text node (not innerHTML) so we never inadvertently render markup.
      node.querySelector('.bubble').appendChild(document.createTextNode(text));
      stream.appendChild(node);
      _autoScrollToBottom();
      return node;
    }

    function _msgThoughtLine() {
      if (!stream) return null;
      const node = document.createElement('div');
      node.className = 'msg ch-thought ch-injected';
      node.innerHTML =
        '<div class="thinking">' +
          '<div class="thinking-mark" aria-hidden="true">' +
            '<div class="orb-track orb-track-1"><div class="orb-sat">' +
              '<svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg>' +
            '</div></div>' +
            '<div class="orb-track orb-track-2"><div class="orb-sat">' +
              '<svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg>' +
            '</div></div>' +
            '<div class="orb-core">' +
              '<svg viewBox="0 0 24 24"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" fill="currentColor"/></svg>' +
            '</div>' +
          '</div>' +
          '<span class="ch-thought-text"></span>' +
        '</div>';
      stream.appendChild(node);
      _autoScrollToBottom();
      return node;
    }

    function _typeInto(node, text, opts) {
      opts = opts || {};
      const charDelay = opts.charDelay || 18;
      const textEl = node && node.querySelector('.ch-thought-text');
      if (!textEl) return Promise.resolve();
      // Collapse the orb away as text starts to flow in.
      node.classList.add('is-typed');

      // Continuous RAF lerp that eases the chat-stream toward its
      // bottom while text builds in — replaces the old per-4-char
      // direct scrollTop=scrollHeight which snapped instantly and
      // looked jumpy whenever the text wrapped to a new line.
      let scrollActive = true;
      let scrollRaf = null;
      const tickScroll = () => {
        if (!stream || !scrollActive) {
          scrollRaf = null;
          return;
        }
        const max = stream.scrollHeight - stream.clientHeight;
        const diff = max - stream.scrollTop;
        if (diff > 0.4) {
          stream.scrollTop += diff * 0.5;
        }
        scrollRaf = requestAnimationFrame(tickScroll);
      };
      if (stream) scrollRaf = requestAnimationFrame(tickScroll);

      let i = 0;
      return new Promise(resolve => {
        function step() {
          if (i >= text.length) {
            node.classList.add('is-done');
            // Let the scroll lerp settle for a beat after the last
            // character before disengaging so the final glide
            // doesn't get cut off mid-ease.
            setTimeout(() => { scrollActive = false; }, 360);
            resolve();
            return;
          }
          textEl.appendChild(document.createTextNode(text[i]));
          i++;
          setTimeout(step, charDelay);
        }
        step();
      });
    }

    function _msgRichResponse(htmlBody) {
      if (!stream) return null;
      const node = document.createElement('div');
      node.className = 'msg bot ch-injected ch-richmsg';
      node.innerHTML =
        '<div class="msg-head">' +
          '<div class="msg-avatar av-canvas-assistant" aria-hidden="true">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
              '<circle cx="8" cy="5.5" r="2.6" fill="currentColor"/>' +
              '<path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="currentColor"/>' +
            '</svg>' +
          '</div>' +
          '<div class="msg-meta">' +
            '<span class="msg-name">Canvas Assistant</span>' +
            '<span class="msg-dot"></span>' +
            '<span class="msg-time">' + (typeof timeNow === 'function' ? timeNow() : '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="body">' + htmlBody + '</div>';
      stream.appendChild(node);
      _autoScrollToBottom();
      return node;
    }

    const PERSONA_RICH_HTML = (
      '<div class="ch-richresp">' +
        '<p class="ch-richresp-intro">Here\'s how the Persona Builder works and how to get started:</p>' +
        '<hr>' +
        '<h2><span class="ch-richresp-icon">👤</span>Persona Builder — How It Works</h2>' +
        '<p>Persona Builder is a guided four-step workflow that turns short answers into a complete persona artifact. It captures who you\'re talking to, why now, and how to address them — then produces <strong>four structured output files</strong> that render live in your canvas:</p>' +
        '<table>' +
          '<thead><tr><th>#</th><th>File</th><th>What it contains</th></tr></thead>' +
          '<tbody>' +
            '<tr><td>1</td><td><code>brief.md</code></td><td>Captured persona type, intent, audience, and tone</td></tr>' +
            '<tr><td>2</td><td><code>persona.json</code></td><td>Structured profile — demographics, segment, lifecycle stage</td></tr>' +
            '<tr><td>3</td><td><code>profile.md</code></td><td>Narrative biography with motivations, objections, jobs-to-be-done</td></tr>' +
            '<tr><td>4</td><td><code>moments.md</code></td><td>Key moments-of-truth and emotional triggers across channels</td></tr>' +
          '</tbody>' +
        '</table>' +
        '<hr>' +
        '<h3>The workflow will:</h3>' +
        '<ol>' +
          '<li><strong>Anchor the persona type</strong> — buyer, researcher, enthusiast, or your own framing</li>' +
          '<li><strong>Capture purchase intent</strong> — how close they are to a decision</li>' +
          '<li><strong>Define the audience</strong> — segment, lifecycle stage, primary channel</li>' +
          '<li><strong>Set the editorial tone</strong> — voice, register, formality of the persona render</li>' +
          '<li><strong>Generate</strong> — synthesize the four files with cross-references and a magazine-style preview</li>' +
        '</ol>' +
        '<hr>' +
        '<h3>Tips for Best Results</h3>' +
        '<ul>' +
          '<li><strong>Be specific</strong> — "high-value loyalty member, 35–44, urban" works better than "loyal customer"</li>' +
          '<li><strong>Name the moment</strong> — e.g., "post-purchase 30 days" or "first-time onboarding"</li>' +
          '<li><strong>Mention the channel</strong> — email, app, in-store, contact center</li>' +
          '<li><strong>Include the goal</strong> — what they\'re trying to accomplish, not just demographics</li>' +
        '</ul>' +
        '<hr>' +
        '<h3>How to Trigger It</h3>' +
        '<p>Just say something like:</p>' +
        '<blockquote>"Build me a persona for [your audience]"</blockquote>' +
        '<p class="ch-richresp-alt">Or select from the presets below.</p>' +
      '</div>'
    );

    function _runPersonaIntro() {
      return new Promise(resolve => {
        _msgUserBubble('Guide me through creating a Persona');
        setTimeout(() => {
          const thought = _msgThoughtLine();
          setTimeout(() => {
            _typeInto(
              thought,
              'The user wants to be guided through creating a Persona. Let me read the skill file for the Persona to understand the workflow. Reading file...',
              { charDelay: 16 }
            ).then(() => {
              setTimeout(() => {
                _msgRichResponse(PERSONA_RICH_HTML);
                // The thought line is "replaced" by the Canvas Assistant
                // rich response — fade it out and remove it from the
                // stream so the flow reads as one transition (system
                // thought → Canvas Assistant speaks).
                setTimeout(() => _fadeAndRemove(thought), 240);
                // Open the chat hat at the moment the rich response's
                // ch-msg-fade-in (~380ms) finishes. The pin loop in
                // _expand() keeps the chat-stream snapped to bottom
                // every frame as the hat grows, so the content shift
                // and hat expansion happen simultaneously.
                setTimeout(() => resolve(), 380);
              }, 520);
            });
          }, 2200);
        }, 480);
      });
    }

    // Keyboard: number keys 1..9 pick the corresponding option if the
    // composer isn't focused. Note #4 hint mentions this works.
    document.addEventListener('keydown', (e) => {
      if (!running) return;
      if (!panel || !panel.classList.contains('ch-prompt-active')) return;
      // Don't hijack typing in composer or any input.
      const t = e.target;
      if (t && t.matches && t.matches('input, textarea, [contenteditable="true"]')) return;
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 9) {
        const step = PERSONA_FLOW[stepIdx];
        if (!step) return;
        // Visible-order mapping: 1/2/3 → first three preset options,
        // 4 → custom "Other" card, 5+ → remaining preset options
        // (step.options[3], [4], … bumped one position down by the
        // custom card inserted at slot 4).
        if (n >= 1 && n <= 3) {
          const opt = step.options[n - 1];
          if (opt) {
            e.preventDefault();
            _pick(opt, false);
          }
        } else if (n === 4) {
          const customCard = listEl && listEl.querySelector('.ch-opt-custom');
          if (customCard && !customCard.classList.contains('is-editing')) {
            e.preventDefault();
            customCard.click();
          }
        } else if (n >= 5) {
          // n=5 → options[3], n=6 → options[4], ...
          const opt = step.options[n - 2];
          if (opt) {
            e.preventDefault();
            _pick(opt, false);
          }
        }
      }
    });

    // Note #5 — free-text path: Enter in the composer while a prompt
    // is active submits the textarea value as the step's answer.
    if (composer) {
      composer.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.shiftKey) return;
        const text = composer.value.trim();
        if (!text) return;
        // If a prompt is firing, treat the typed text as the answer.
        if (running && panel && panel.classList.contains('ch-prompt-active')) {
          e.preventDefault();
          composer.value = '';
          _pick({ id: 'free', title: text }, true);
          return;
        }
        // If we're idle and the user typed "create a persona" (or
        // similar), kick the flow.
        if (!running && /(persona|create|start|new)/i.test(text)) {
          e.preventDefault();
          _msg('user', _escape(text));
          composer.value = '';
          setTimeout(() => start(), 240);
        }
      });
    }

    // Capture-phase handler on the send button — when it's in
    // submit-morph mode (the user is typing a custom answer in
    // option 4), clicking it picks up that input's value and submits
    // it as the step's answer. Capture phase beats the existing
    // sendBtn click handler so the regular "send to chat" flow
    // doesn't fire instead.
    const _sendBtnGlobal = document.getElementById('sendBtn');
    if (_sendBtnGlobal) {
      _sendBtnGlobal.addEventListener('click', (e) => {
        if (!_sendBtnGlobal.classList.contains('is-submit')) return;
        const customCard = document.querySelector('.ch-opt-custom.is-editing');
        const customInput = customCard && customCard.querySelector('.ch-opt-custom-input');
        const val = customInput && customInput.value.trim();
        if (!val) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        _sendBtnGlobal.classList.remove('is-submit');
        _pick({ id: 'custom', title: val }, true);
      }, true);
    }

    // Repurpose the existing "Persona" chat-aux-chip to launch the flow.
    // Other chips stay as-is (no flow defined yet — placeholder messages).
    // #ptModeTile (Media) is excluded — it has its own real click wiring
    // (initPainterSkill() below) and would otherwise get this generic
    // "Start a X." echo stacked underneath its real behavior. #ptSeeAllChip
    // (8/25: now a .pt-seeall-link text link, not a .chat-aux-chip — see
    // initSkillsOverlay()) is no longer matched by this selector at all.
    document.querySelectorAll('[data-chat-aux-chips] .chat-aux-chip:not(#ptModeTile)').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const which = chip.getAttribute('data-chip');
        if (false) { /* canvas-base starter: built-in persona flow removed — wire your own */
          e.preventDefault();
          e.stopImmediatePropagation();
          if (running || introRunning) return;
          introRunning = true;
          // Collapse the hat right after the click — the chat thread
          // takes focus while the intro choreography plays. Question
          // one (start → _next → _renderStep → finishMount → _expand)
          // pops the hat back open at the end.
          _collapse();
          // Swap the collapsed title from "What would you like to
          // create?" to a progress message so the hat header reads
          // as "thinking" while the intro plays out below. Uses the
          // existing .is-changing soft-fade. _renderStep replaces
          // this with the actual step title when question 1 fires.
          if (title) {
            title.classList.add('is-changing');
            setTimeout(() => {
              title.textContent = 'Getting your persona ready…';
              title.classList.remove('is-changing');
            }, 180);
          }
          // Lock the hat — chevron click + hover state are disabled
          // until question 1 fires. CSS removes pointer-events on
          // the toggle button and suppresses .chat-aux-head:hover
          // styles while .is-locked is on the panel.
          if (panel) panel.classList.add('is-locked');
          _runPersonaIntro().then(() => {
            introRunning = false;
            if (panel) panel.classList.remove('is-locked');
            start({ silent: true });
          });
        } else {
          // Quiet placeholder — log into chat so it doesn't feel dead.
          _msg('user', 'Start a ' + _escape(which) + '.');
          setTimeout(() => {
            _msg('bot', 'The ' + _escape(which) + ' flow isn\'t built in this prototype yet — wire up your own canvas flow here.');
          }, 320);
        }
      }, true /* capture: beat the existing chip handler */);
    });

    // Header click on the aux-head while a prompt is active = "close
    // without picking". This wasn't asked for, but you need an
    // out if the user changes their mind mid-flow.
    if (auxHead) {
      // Header click only toggles expand/collapse — never aborts the
      // flow. The user can collapse mid-prompt to peek at the chat
      // thread, then expand again and resume on the same question
      // they were on. (Previous version reset stepIdx/answers and
      // posted a "no worries" bot message; that was too aggressive.)
    }

    // ── Hat-grow safety net (persona-flow only) ────────────────────
    //   _expand() is the canonical hat-open trigger inside the
    //   persona flow and starts the unified _pinChatStreamToHat()
    //   RAF loop itself. This RO is a fallback for unanticipated
    //   growths during the flow (class flips that bump max-height
    //   without going through _expand).
    //
    //   CRITICAL: only fire when `ch-prompt-active` is set. The
    //   very first auto-open on page load (ChatHatAutoExpand IIFE)
    //   adds `is-expanded` directly WITHOUT going through _expand
    //   and WITHOUT setting ch-prompt-active — that reveal should
    //   feel self-contained, the chips-only opening animation
    //   landing on its own with no chat-stream coupling. Gating
    //   on ch-prompt-active keeps the safety net scoped to the
    //   persona-flow opens where unison-scroll is the desired feel.
    if (panel && stream && window.ResizeObserver) {
      let lastH = panel.getBoundingClientRect().height;
      const ro = new ResizeObserver(() => {
        const h = panel.getBoundingClientRect().height;
        const delta = h - lastH;
        lastH = h;
        if (delta > 0.5 && !_pinRaf && panel.classList.contains('ch-prompt-active')) {
          _pinChatStreamToHat(600);
        }
      });
      ro.observe(panel);
    }

    return { start };
  })();

  // ── 3.9. Dismissable AI-disclosure notice ─────────────────────────
  //         Click the X on the .ch-intro-notice card to collapse it
  //         out. Bryan asked for it to re-appear on every page load
  //         (no persistence) — dismissal is session-only.
  (function ChatHatIntroNotice() {
    const notice = document.getElementById('chIntroNotice');
    const closeBtn = document.getElementById('chIntroNoticeClose');
    if (!notice || !closeBtn) return;

    // Clean up any stale persistence flag from a previous build so
    // existing localStorage entries don't keep the notice hidden.
    try { localStorage.removeItem('chatHatIntroDismissed'); } catch (e) {}

    closeBtn.addEventListener('click', () => {
      notice.classList.add('is-dismissing');
      // After the transition finishes, fully remove from layout.
      setTimeout(() => {
        if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
      }, 360);
    });
  })();

  // ── 4. BC profile popover ─────────────────────────────────────────
  //      Clicking the .me chip opens a card with avatar / name /
  //      email / theme toggle / logout — matches the screenshot
  //      Bryan shared. Built lazily on first open.
  //
  //      NOTE: re-entered defensively below in its own <script> tag so
  //      any error in the rest of the controller can't block it. This
  //      block is the original implementation — guard it with an early
  //      return + try/catch so a duplicate doesn't double-wire .me.
  (function ChatHatProfile() {
    if (window.__chatHatProfileWired) return;
    window.__chatHatProfileWired = true;
    const meChip = document.querySelector('.me');
    if (!meChip) return;

    // Re-apply saved theme — the lease-campaign `lockTheme()` IIFE
    // earlier in this file hard-pins body[data-theme] to "light" on
    // every load. We override here so the Themes picker actually
    // persists across reloads.
    try {
      const saved = localStorage.getItem('chatHatTheme');
      if (saved === 'dark' || saved === 'light') {
        document.body.dataset.theme = saved;
      }
    } catch (e) {}

    // Make the chip keyboard-accessible (it's a plain div in the
    // lease-campaign markup).
    meChip.setAttribute('role', 'button');
    meChip.setAttribute('tabindex', '0');
    meChip.setAttribute('aria-haspopup', 'menu');
    meChip.setAttribute('aria-expanded', 'false');

    let overlay = null;
    let menu = null;
    let isOpen = false;

    function _currentTheme() {
      return document.body.dataset.theme === 'dark' ? 'dark' : 'light';
    }
    const SUN_SVG = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.06 1.06M4.46 11.54L3.4 12.6M12.6 12.6l-1.06-1.06M4.46 4.46L3.4 3.4"/></svg>';
    const MOON_SVG = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4 4 0 0 0 7 7z"/></svg>';
    const PALETTE_SVG = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="8" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="12.5" cy="8" r="1"/><path d="M9 2a7 7 0 1 0 0 14c1.5 0 1.5-1.5.5-2-1-.5-.5-2 1-2h1.5A4 4 0 0 0 16 8 7 7 0 0 0 9 2z"/></svg>';
    const CHEV_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg>';
    const CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>';

    function _build() {
      overlay = document.createElement('div');
      overlay.className = 'ch-profile-overlay';
      overlay.addEventListener('click', close);

      menu = document.createElement('div');
      menu.className = 'ch-profile-menu';
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Profile');
      menu.addEventListener('click', (e) => e.stopPropagation());

      // ── Main view ────────────────────────────────────────────────
      const mainView = document.createElement('div');
      mainView.className = 'ch-profile-view ch-profile-view-main is-visible';
      mainView.innerHTML =
        '<div class="ch-profile-avatar" aria-hidden="true">BC</div>' +
        '<div class="ch-profile-name">Bryan Cocco</div>' +
        '<div class="ch-profile-email">bryan.cocco@omc.com</div>' +
        '<div class="ch-profile-divider" aria-hidden="true"></div>' +
        '<button class="ch-profile-row is-link" type="button" data-action="open-themes" role="menuitem">' +
          '<span class="ch-profile-row-icon">' + PALETTE_SVG + '</span>' +
          '<span class="ch-profile-row-label">Themes</span>' +
          '<span class="ch-profile-row-chev" aria-hidden="true">' + CHEV_SVG + '</span>' +
        '</button>' +
        '<div class="ch-profile-divider" aria-hidden="true"></div>' +
        '<button class="ch-profile-row is-logout" type="button" data-action="logout" role="menuitem">' +
          '<span>Log out</span>' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M9 11l3-3-3-3M12 8H4M6 14H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2"/>' +
          '</svg>' +
        '</button>';

      // ── Themes view ──────────────────────────────────────────────
      const themesView = document.createElement('div');
      themesView.className = 'ch-profile-view ch-profile-view-themes';
      themesView.innerHTML =
        '<div class="ch-profile-themes-head">' +
          '<span class="ch-profile-themes-title">Themes</span>' +
          '<button class="ch-profile-themes-close" type="button" data-action="close-themes" aria-label="Close">' + CLOSE_SVG + '</button>' +
        '</div>' +
        '<div class="ch-profile-divider" aria-hidden="true"></div>' +
        '<button class="ch-profile-theme-row" type="button" data-theme="dark" role="menuitem">' +
          MOON_SVG + '<span>Dark</span>' +
        '</button>' +
        '<div class="ch-profile-divider" aria-hidden="true"></div>' +
        '<button class="ch-profile-theme-row" type="button" data-theme="light" role="menuitem">' +
          SUN_SVG + '<span>Light</span>' +
        '</button>' +
        '<div class="ch-profile-divider" aria-hidden="true"></div>';

      menu.appendChild(mainView);
      menu.appendChild(themesView);
      overlay.appendChild(menu);
      document.body.appendChild(overlay);

      // Wire main view actions.
      mainView.querySelector('[data-action="open-themes"]').addEventListener('click', _showThemes);
      mainView.querySelector('[data-action="logout"]').addEventListener('click', _logout);

      // Wire themes view actions.
      themesView.querySelector('[data-action="close-themes"]').addEventListener('click', close);
      themesView.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => _applyTheme(btn.getAttribute('data-theme')));
      });
    }

    function _showThemes() {
      if (!menu) return;
      menu.classList.add('is-themes');
      menu.querySelector('.ch-profile-view-main').classList.remove('is-visible');
      menu.querySelector('.ch-profile-view-themes').classList.add('is-visible');
      _syncThemeActive();
      const firstBtn = menu.querySelector('.ch-profile-theme-row');
      if (firstBtn) setTimeout(() => firstBtn.focus({ preventScroll: true }), 30);
    }

    function _syncThemeActive() {
      if (!menu) return;
      const current = _currentTheme();
      menu.querySelectorAll('.ch-profile-theme-row').forEach(row => {
        row.classList.toggle('is-active', row.getAttribute('data-theme') === current);
      });
    }

    function _applyTheme(theme) {
      if (theme !== 'dark' && theme !== 'light') return;
      document.body.dataset.theme = theme;
      try { localStorage.setItem('chatHatTheme', theme); } catch (e) {}
      _syncThemeActive();
    }

    function _position() {
      if (!menu) return;
      const rect = meChip.getBoundingClientRect();
      // Anchor: top edge just below the chip, right edge aligned to
      // the chip's right edge so the menu hangs from the avatar.
      const top = Math.round(rect.bottom + 8);
      const right = Math.round(window.innerWidth - rect.right);
      menu.style.top = top + 'px';
      menu.style.right = right + 'px';
      menu.style.left = 'auto';
    }

    function _toggleTheme() {
      const next = _currentTheme() === 'light' ? 'dark' : 'light';
      document.body.dataset.theme = next;
      try { localStorage.setItem('chatHatTheme', next); } catch (e) {}
      // Re-render the row in place.
      if (!menu) return;
      const row = menu.querySelector('[data-action="theme"]');
      if (!row) return;
      row.querySelector('.ch-profile-row-icon').innerHTML = _themeIcon(next);
      row.querySelector('.ch-profile-row-label').textContent = _themeLabel(next);
    }

    function _logout() {
      // Prototype-only — no real auth. Quick toast in the chat thread
      // so the click registers as having happened.
      const stream = document.getElementById('chatStream');
      if (stream) {
        const m = document.createElement('div');
        m.className = 'msg bot';
        m.innerHTML =
          '<div class="msg-head">' +
            '<div class="msg-avatar av-corv">⌬</div>' +
            '<div class="msg-meta"><span class="msg-name">Acme</span><span class="msg-dot"></span><span class="msg-time">Now</span></div>' +
          '</div>' +
          '<div class="body">(Log-out is a no-op in this prototype — there\'s no real auth wired.)</div>';
        stream.appendChild(m);
        stream.scrollTop = stream.scrollHeight;
      }
      close();
    }

    function _resetToMain() {
      if (!menu) return;
      menu.classList.remove('is-themes');
      const main = menu.querySelector('.ch-profile-view-main');
      const themes = menu.querySelector('.ch-profile-view-themes');
      if (main) main.classList.add('is-visible');
      if (themes) themes.classList.remove('is-visible');
    }

    function open() {
      if (isOpen) return;
      if (!menu) {
        _build();
      } else {
        // Re-attach and reset to the main view on every open.
        _resetToMain();
        _syncThemeActive();
        document.body.appendChild(overlay);
      }
      _position();
      isOpen = true;
      meChip.setAttribute('aria-expanded', 'true');
      // Focus the first interactive row for keyboard users.
      const firstBtn = menu.querySelector('.ch-profile-view.is-visible button');
      if (firstBtn) setTimeout(() => firstBtn.focus({ preventScroll: true }), 30);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      meChip.setAttribute('aria-expanded', 'false');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    meChip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) close(); else open();
    });
    meChip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) close(); else open();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
    window.addEventListener('resize', () => { if (isOpen) _position(); });
    window.addEventListener('scroll', () => { if (isOpen) _position(); }, true);
  })();

  // ── 5. Auto-expand chat hat the INSTANT the OMNI letters finish
  //      landing — listen for the letter animation's `animationend`
  //      event instead of estimating timing with setTimeout. Removes
  //      any perceptible gap between OMNI settling and the chat hat
  //      opening. Fallback timer in case the event never fires
  //      (e.g. reduced-motion skips the animation entirely).
  (function ChatHatAutoExpand() {
    const panel = document.getElementById('chatAuxPanel');
    if (!panel) return;
    let fired = false;

    function openChatHat() {
      if (fired) return;
      // This reveal is for the pristine empty-canvas splash only —
      // it adds is-expanded directly with no _pinChatStreamToHat
      // coupling (see the "Hat-grow safety net" comment above). If
      // Painter has already put real content in the chat stream
      // (live flow in progress, or a `?state=` deep link that seeds
      // the whole conversation synchronously on load), firing this
      // later would grow the hat out from under those messages with
      // nothing re-pinning scroll — the stream's own viewport shrinks
      // but scrollTop doesn't follow, so the last message (and any
      // follow-up chips) end up clipped under the panel, its ambient
      // corner-glint sitting right at that clipped edge. Bail so the
      // hat only ever auto-reveals over a truly empty stream. Also
      // bail whenever the Painter hat-wizard is already driving the
      // panel itself (pt-wizard-active) — the wizard's own steps no
      // longer post .pt-msg bubbles (only the single "Done" line
      // does), so a user who starts Painter inside this 1.4s fallback
      // window would otherwise race this reveal against their own
      // in-progress step.
      if (
        document.body.classList.contains('is-painter-resolved') ||
        document.querySelector('#chatStream .pt-msg') ||
        panel.classList.contains('pt-wizard-active')
      ) {
        fired = true;
        return;
      }
      fired = true;
      panel.classList.add('ch-first-reveal');
      requestAnimationFrame(() => {
        panel.classList.add('is-expanded');
        setTimeout(() => panel.classList.add('is-fully-open'), 800);
      });
      const toggle = panel.querySelector('.chat-aux-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      setTimeout(() => panel.classList.remove('ch-first-reveal'), 1250);
    }

    // Primary trigger: the moment the OMNI logo's simple fade-in
    // completes. The per-letter slide-in keyframe (`ch-omni-letter`)
    // was removed when Bryan asked for the quiet fade — listen on
    // the SVG itself for `ch-omni-fade` instead.
    const logo = document.querySelector('.ch-empty-state .ch-empty-logo');
    if (logo) {
      logo.addEventListener('animationend', (e) => {
        if (e.animationName === 'ch-omni-fade') openChatHat();
      }, { once: true });
    }

    // Fallback safety net — if the animationend event never fires
    // (reduced-motion, animation cancelled, etc.), still open the
    // chat hat after a reasonable beat. Sized to the new 1100ms
    // blur fade-in + 300ms buffer.
    setTimeout(openChatHat, 1400);
  })();
})();
