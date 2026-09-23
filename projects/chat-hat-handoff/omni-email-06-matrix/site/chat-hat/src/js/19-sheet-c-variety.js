    /* ═══ SHEET VARIETY — the header's Templates / Colorway / Swap
       image menus. Each holds a SET, and the sheet deals across the
       sets rather than picking one from each: template cycles fastest,
       colorway advances once the templates have been round, so two
       templates and three colorways lay out all six pairings in order
       instead of moving in lockstep. That is the whole point of them
       being multi-select — intentional variety, not one look nine
       times.

       Changes apply IN PLACE to the banners already on the sheet
       (data-layout / data-colorway / the media element / the logo)
       rather than rebuilding it: a rebuild would mint new cards and
       silently empty Selects, which is a bad trade for toggling a
       swatch. ═══ */
    /* bodyFit: 'shrink' (default — PowerPoint-style: scale the
       headline down toward a floor before the existing line-clamp
       ellipsis ever has to cut it) | 'fixed' (today's original
       behavior, unchanged: full size, clamp+ellipsis is the only
       fallback). legalStyle: 'inline' (default — today's one
       ellipsized line) | 'scroll' (pharma ISI — a bounded, actually-
       scrollable region). Both sheet-wide, like Body/CTA/Legal
       themselves. */
    const sheetVariety = { templates: [], colorways: ['gold-on-dark'], images: [], ctas: [], bodies: [], legal: '', bodyFit: 'shrink', legalStyle: 'inline' };
    /* `bodies` holds the ads' MAIN COPY LINE. On these units that line
       is the headline — they carry no separate body paragraph — so the
       Body menu lists the headlines the sheet actually shows, and
       editing it edits them. Naming it after the slot it writes to
       would be more literal and less true: what the control does is
       own the ad's copy. */
    /* Handed over by the Chat Hat's settings row at send time, so the
       header menus open already reflecting what was picked down there
       instead of resetting it. Consumed once, by the next seed. */
    let pendingSheetVariety = null;
    /* Seeded from whatever the Chat Hat sent, the first time the sheet
       resolves — the settings row's own template pick and image picks
       become these menus' starting state rather than a fresh default. */
    function seedSheetVariety() {
      const handoff = pendingSheetVariety;
      pendingSheetVariety = null;
      const layout = state.layout || 'type-top';
      sheetVariety.templates = (handoff && handoff.templates && handoff.templates.length)
        ? handoff.templates.slice()
        : (ALL_LAYOUT_IDS.indexOf(layout) !== -1 ? [layout] : [ALL_LAYOUT_IDS[0]]);
      sheetVariety.colorways = (handoff && handoff.colorways && handoff.colorways.length)
        ? handoff.colorways.slice()
        : ['gold-on-dark'];
      /* conceptImagePool shuffles, so the set arrives in a different
         order each generate — the "random set of the images the user
         picked" behaviour, now expressed as the menu's own state so it
         stays inspectable and editable rather than hidden in a render. */
      const picked = conceptImagePool().map(im => im.src).filter(Boolean);
      sheetVariety.images = picked.length ? picked : [findFrame(GENERATE_IMAGE_ID).src];
      /* The copy the sheet is about to generate, lifted into the menus
         that own it. Those two opened empty while nine ads sat below
         them carrying exactly this text — the menus have to describe
         the sheet, or the count above them is wrong and the first edit
         wipes copy the user never chose to lose. Deduped and in the
         roster's own order, which is the order copyPairFor deals them,
         so seeding changes what the menus SAY and not a pixel of what
         the sheet renders. */
      const dedupe = (arr) => arr.filter((v, i, a) => v && a.indexOf(v) === i);
      sheetVariety.ctas = dedupe(ALL_COPY_PAIRS.map(pr => pr.cta));
      sheetVariety.bodies = dedupe(ALL_COPY_PAIRS.map(pr => pr.headline));
    }
    function varietyFor(index) {
      /* A brand template is provenance, not geometry — the banner
         engine only speaks layout ids, so resolve before dealing.
         AA.2 — the ORIGINAL id (generic layout or brand guide) is
         kept here, not deduped away by its resolved layout: a guide
         must keep its own identity even when it happens to resolve to
         the same shape as a generic pick sitting beside it, since
         that identity is what locks its colorway below. (A plain Set
         of generic ids can never collide with itself — templates is
         already a set — so this only ever changes anything when a
         guide is involved; two distinct generics deal exactly as
         before.) */
      const ids = sheetVariety.templates.length ? sheetVariety.templates : ['type-top'];
      const c = sheetVariety.colorways.length ? sheetVariety.colorways : ['gold-on-dark'];
      const im = sheetVariety.images.length ? sheetVariety.images : [findFrame(GENERATE_IMAGE_ID).src];
      const id = ids[index % ids.length];
      const guide = SET_BRAND_BY_ID[id];
      // §BR.5 — a novel image×headline×CTA combo (brFlowCombos, set by
      // Generate only when the hat's flow-in pools held anything)
      // overrides just the image pick here; layout/colorway keep
      // dealing from the Layouts/Color pills exactly as before — the
      // combo is about copy-and-imagery pairing, not the sheet's look.
      const flowImg = brFlowCombos && brFlowCombos[index] && brFlowCombos[index].image;
      return {
        layout: templateLayoutId(id),
        // A brand-approved look is locked: its own colorway always
        // wins here, regardless of what the Color pill/drawer has set
        // — the Color pill still governs every generic layout dealt
        // alongside it (guide and non-guide picks can coexist in one
        // set; only the guide's OWN units are locked).
        colorway: guide ? guide.colorway : c[Math.floor(index / ids.length) % c.length],
        guide: guide ? guide.brand : null,
        src: flowImg || im[index % im.length]
      };
    }
    /* Re-deals every card on the sheet from the current sets. */
    /* AJ.2 — applySheetVariety (the band's old full-board re-deal from
       sheetVariety's pools) retired: nothing re-deals from the band
       any more, only the selection (applyFieldValueToSelection et al,
       above buildConceptSheetDOM). varietyFor/sheetVariety themselves
       stay — the hat still MAKES a fresh board's initial diversity
       from them (buildConceptSheetDOM); only re-editing the whole
       sheet's pools after the fact is gone. */

    /* Legal and CTA are copy, not geometry, so they land on the banner's
       own text nodes rather than its data-attributes. Legal fills the
       .pt-banner-disclaimer slot the banner already has (and the
       colorway rules already colour). The slot is now designed into
       the template (the handoff's direction) — it stays in the DOM even when empty,
       as a quiet dashed placeholder, rather than disappearing outright,
       so the CTA's reserved safe-area above it (the :has(.pt-banner-
       disclaimer) rules) never jumps the moment legal text lands. */
    function applyDisclaimerContent(discl, legal) {
      discl.classList.toggle('pt-banner-disclaimer--empty', !legal);
      discl.classList.toggle('pt-banner-disclaimer--scroll', sheetVariety.legalStyle === 'scroll');
      discl.textContent = legal || '';
      // AZ.2 — re-measure --legal-h the instant the line (or its empty/
      // scroll state) changes: a legal pick, None, or the Inline/Scroll
      // toggle all land here, and none of them are guaranteed to be
      // followed by a resize or a full re-fit. measureLegalH lives next
      // to applyCardScale in 14-hat-a-files.js (same script, function
      // declarations are visible file-order-independent) — this is the
      // one other place AZ.2 names as a re-measure trigger.
      measureLegalH(discl.closest('.pt-banner'));
    }
    /* The designed-in slot never leaves the DOM: create it on a banner
       that was built without one, then hand it to applyDisclaimerContent
       for the text and the empty / scroll classes. One path for the
       sheet's overrides and for the editor's commit-on-Back, so neither
       can quietly delete the slot the other relies on. */
    function ensureDisclaimerSlot(inner, text) {
      let discl = inner.querySelector('.pt-banner-disclaimer');
      if (!discl) {
        discl = document.createElement('span');
        discl.className = 'pt-banner-disclaimer';
        inner.appendChild(discl);
      }
      applyDisclaimerContent(discl, text);
      return discl;
    }
    /* §BR.1 — one entry per pool SLOT (role + the index the slot deals
       from), not per unit: two units landing on the same slot (index %
       length collides, which is the normal case once there are more
       units than pool entries) reference the SAME line on purpose —
       that sharing is the whole point of §BR, BR.1 just starts
       recording it. Overwriting `.text` on an existing id is safe and
       intended: it keeps the id truthful to whatever its slot currently
       deals (a reseed or a board switch replaces the pool wholesale, at
       which point every id under it is meant to mean the new text, not
       the old). */
    function registerLineAsset(role, poolKey, text) {
      const id = role + ':' + poolKey;
      const existing = assets.lines[id];
      if (existing) existing.text = text;
      else assets.lines[id] = { role: role, text: text, fit: {} };
      return id;
    }
    /* Keyed by src — already a stable, unique handle (GALLERY_ITEMS and
       any attached upload alike) — so no separate id-minting pass is
       needed. framings starts empty; see the §BR.1 block comment beside
       `assets` (15-sheet-a-boards.js) for why that already means
       "untouched, render the default" everywhere framings are read. */
    function registerImageAsset(src) {
      if (!assets.images[src]) assets.images[src] = { framings: {} };
      return src;
    }
    /* §BR.3 — the copy analogue of readBannerFramings/writeBannerFramings
       (13-editor-studio-a-framing.js): one JSON blob of this unit's OWN
       escape-hatch text, keyed by FIELD KEY ('headline'/'cta'/
       'disclaimer' — the same three wireStageEditableFields already
       uses, 'disclaimer' standing in for the 'legal' asset role exactly
       as it does everywhere else in this file) rather than by ratio —
       copy has no ratio dimension (§BR.3's own contract line: "Copy has
       no ratio, unlike crops"), so there is nothing to bucket by. A key
       present here is this unit's "Just this one"; absent, the shared
       line (assets.lines[id].text) wins; absent from both, ''. */
    function readBannerCopyOverrides(banner) {
      if (!banner) return {};
      const raw = banner.getAttribute('data-copy-overrides');
      if (!raw) return {};
      try {
        const o = JSON.parse(raw);
        return (o && typeof o === 'object') ? o : {};
      } catch (e) { return {}; }
    }
    function writeBannerCopyOverrides(banner, map) {
      if (!banner) return;
      const keys = Object.keys(map || {});
      if (!keys.length) banner.removeAttribute('data-copy-overrides');
      else banner.setAttribute('data-copy-overrides', JSON.stringify(map));
    }
    function applyBannerCopyOverrides(banner, index) {
      const copy = banner.querySelector('.pt-banner-copy');
      const inner = banner.querySelector('.pt-banner-inner');
      if (!inner) return;
      // §BR.5 — this unit's own slice of the novel combo Generate
      // composed (null unless the hat's flow-in pools held anything at
      // Send — resetFlowCombosForGenerate, 13-editor-studio-a-
      // framing.js). ii/hh/cc are the POOL index, not this unit's, so
      // two units dealt the same headline/CTA/image register the same
      // shared line/image id below, exactly like the default per-pool
      // dealing already does.
      const combo = brFlowCombos && brFlowCombos[index];
      // AJ.5 amendment — legal is a copy field like Body/CTA below: a
      // generated unit is dealt a line from the pool (LEGAL_LINES,
      // AT.2 — the same pool the band's Legal pane already picks
      // from) by index, exactly as this function deals bodies/ctas
      // from theirs — never the dashed placeholder on a generated
      // unit. sheetVariety.legal (unused since AT.2 retired AJ.2's own
      // sheet-wide textarea in favor of the pane's per-selection
      // picks) stays the escape hatch a sheet-wide override would
      // write; empty, as it always is today, it just falls through to
      // the pool. §BR.1 — a sheet-wide override has no pool index (it
      // is the same one line for every unit), so it registers under
      // its own fixed slot ('sheet') rather than borrowing `index`.
      // §BR.5 — a deck's own Legal lines (flowPools.legal) outrank the
      // stock LEGAL_LINES pool the same way a sheet-wide override
      // outranks both, dealt by pool index like every other flow field.
      const legalOverride = (sheetVariety.legal || '').trim();
      let legalSlot, legal;
      if (!legalOverride && flowPools.legal.length) {
        legalSlot = 'flow-l:' + (index % flowPools.legal.length);
        legal = flowPools.legal[index % flowPools.legal.length];
      } else {
        legalSlot = legalOverride ? 'sheet' : (index % LEGAL_LINES.length);
        legal = legalOverride || LEGAL_LINES[legalSlot];
      }
      banner.setAttribute('data-legal-id', registerLineAsset('legal', legalSlot, legal));
      ensureDisclaimerSlot(inner, legal);
      applyLineFit(banner, 'disclaimer'); // §BR.4 — a freshly-dealt line still reads its shared line's own size, if any unit has ever set one
      if (copy) {
        const cta = copy.querySelector('.pt-banner-cta');
        let ctaSlot, ctaText;
        if (combo && combo.cta != null) { ctaSlot = 'flow-c:' + combo.cc; ctaText = combo.cta; }
        else if (sheetVariety.ctas.length) { ctaSlot = index % sheetVariety.ctas.length; ctaText = sheetVariety.ctas[ctaSlot]; }
        if (ctaText != null) {
          banner.setAttribute('data-cta-id', registerLineAsset('cta', ctaSlot, ctaText));
          if (cta) cta.textContent = ctaText;
          applyLineFit(banner, 'cta');
        }
      }
      /* The main copy line, dealt across the ads the same way — it
         writes the headline the unit already has rather than adding a
         second line beneath it, which would print the same words
         twice. */
      if (copy) {
        const h = copy.querySelector('.pt-banner-headline');
        let hSlot, text;
        if (combo && combo.headline != null) { hSlot = 'flow-h:' + combo.hh; text = combo.headline; }
        else if (sheetVariety.bodies.length) { hSlot = index % sheetVariety.bodies.length; text = sheetVariety.bodies[hSlot]; }
        if (text != null) {
          banner.setAttribute('data-headline-id', registerLineAsset('headline', hSlot, text));
          if (h) {
            h.textContent = text;
            applyHeadlineFit(h, banner.getAttribute('data-size'), text);
            applyLineFit(banner, 'headline');
          }
        }
      }
      // §BR.1 — the image reference: same src the media slot was
      // already built with (bannerCardHTML/mediaTagHTML), so this is
      // pure bookkeeping, never a repaint.
      const media = banner.querySelector('.pt-banner-media img, .pt-banner-media video');
      const src = media && media.getAttribute('src');
      if (src) banner.setAttribute('data-image-ref', registerImageAsset(src));
    }
    // §BR.1 QA hook (13-*'s _ptImageryDebug / 20-*'s _ptStudioDebug
    // convention: read-only, a fresh plain object per call). `units`
    // walks the live sheet so a probe can assert every rendered unit's
    // references resolve to a real entry in `images`/`lines`.
    window._ptAssetsDebug = function () {
      return {
        images: JSON.parse(JSON.stringify(assets.images)),
        lines: JSON.parse(JSON.stringify(assets.lines)),
        units: Array.prototype.map.call(document.querySelectorAll('#ptConcepts .pt-banner'), function (b) {
          const card = b.closest('.pt-banner-card');
          return {
            unitId: card ? card.getAttribute('data-unit-id') : null,
            imageRef: b.getAttribute('data-image-ref'),
            headlineId: b.getAttribute('data-headline-id'),
            ctaId: b.getAttribute('data-cta-id'),
            legalId: b.getAttribute('data-legal-id'),
            size: b.getAttribute('data-size'),
            // §BR.2 — this unit's own escape-hatch crops ("Just this
            // one"), keyed by ratio same as assets.images[src].framings
            // above; a probe reads this to tell "picked up the shared
            // crop" apart from "kept its own".
            frameOverrides: readBannerFramings(b),
            // §BR.3 — this unit's own copy escape hatch, same idea as
            // frameOverrides above but keyed by field ('headline'/
            // 'cta'/'disclaimer') rather than ratio.
            copyOverrides: readBannerCopyOverrides(b),
            // §BR.4 — this unit's own SIZE escape hatch, keyed by
            // fitKey(field, ratio); a probe reads this the same way it
            // reads frameOverrides/copyOverrides above.
            lineFitOverrides: readBannerLineFit(b)
          };
        })
      };
    };
    /* Shrink to fit, PowerPoint-style: scale --hl-size down toward a
       0.7 floor as a line runs past its size class's own budget, so
       the words that fit stay full-height and only genuinely long
       lines lose size — never toward zero, and never a substitute for
       the line-clamp ellipsis, which still catches anything past the
       floor. Fixed size skips all of this — full size, clamp+ellipsis
       is the only fallback, which is the file's own original behavior,
       untouched. */
    function applyHeadlineFit(headlineEl, sizeId, text) {
      if (!headlineEl) return;
      const limit = bodyLimitForSize(sizeId);
      if (sheetVariety.bodyFit === 'shrink' && text && text.length > limit) {
        const scale = Math.max(0.7, limit / text.length);
        headlineEl.style.setProperty('--body-shrink-scale', scale.toFixed(3));
      } else {
        headlineEl.style.removeProperty('--body-shrink-scale');
      }
      /* Coordinator fix — bodyLimitForSize is a per-SIZE-CLASS proxy,
         blind to which LAYOUT is rendering: it assumes a copy column
         close to that class's own full width, which undersells how
         narrow card's own copy card really is (a solid card at
         max-width:72% of the unit, further inset by its own padding)
         — a headline well under the class budget could still be too
         long for THAT box and silently overflow into the line-clamp's
         own ellipsis, the opposite of "shrink to fit." This is the
         real fit check: a live DOM measurement against the headline's
         own actual rendered box, not a second character estimate. If
         it's still overflowing after the budget pass above (which
         still ran first and still owns the common case — this only
         ever tightens what it already set, never fires ahead of it),
         shrink further, compounding on the existing scale, until the
         2-line box's own clientHeight can actually hold it. Fixed
         size is untouched: bodyFit!=='shrink' means no scale was set
         above, and this block is itself gated on 'shrink' too, so a
         Fixed-size headline still ellipsizes exactly as before. No
         floor here on purpose (unlike the 32/41/45-char budget's own
         0.7, which stays exactly as-is for every layout's common
         case): a genuinely narrow column needs the room to go further
         than a shared constant would allow, since "never an ellipsis"
         in shrink mode is the actual requirement, not a fixed lower
         bound on size. Reads scrollHeight/clientHeight AFTER the
         style write above, which is what forces the layout the browser
         needs to report the POST-shrink box truthfully. */
      /* The correction below needs a real layout — scrollHeight/
         clientHeight both read 0 here (confirmed live, not assumed):
         applyHeadlineFit runs synchronously inside buildConceptSheetDOM,
         before the sheet's own cards are ever actually laid out/
         revealed, so nothing is measurable yet. Deferred one frame via
         rAF (the standard "wait for the layout that follows this
         paint" point) rather than a setTimeout guess. */
      if (sheetVariety.bodyFit === 'shrink') {
        /* A single rAF/fonts.ready check races several independent,
           un-coordinated things that can still move the box after
           this function returns — the entrance animation's own
           stagger delay (per-card, up to ~740ms out), scheduleFit-
           AllBannerScales's own row-fit pass (runs later in the SAME
           build, after every card's applyBannerCopyOverrides call —
           confirmed live: an early single-frame check caught some
           headlines mid-flight and under-corrected them), and web
           font load. Rather than chase each one by name, re-check on
           a real ResizeObserver against the headline's own box —
           reacts to whatever actually moves it, from any cause —
           self-limiting because a correction only ever shrinks
           (never grows), so it can't fight its own resize events into
           a loop; disconnects once settled. */
        let settleTries = 0;
        const tryFit = () => {
          // Re-checked on every fire, not just at scheduling time — a
          // late/stale callback (this ResizeObserver, or the rAF/
          // fonts.ready path below) must not resurrect a shrink scale
          // after the user has since switched to Fixed size, and a
          // headline reused across a re-deal must not act on a mode
          // that's no longer current.
          if (sheetVariety.bodyFit !== 'shrink') { ro.disconnect(); return; }
          if (!headlineEl.isConnected || headlineEl.clientHeight <= 0) return;
          if (headlineEl.scrollHeight <= headlineEl.clientHeight + 1) return;
          const current = parseFloat(headlineEl.style.getPropertyValue('--body-shrink-scale')) || 1;
          const corrective = (headlineEl.clientHeight / headlineEl.scrollHeight) * 0.97; // 0.97: a hair of margin so sub-pixel rounding never leaves a sliver clipped
          headlineEl.style.setProperty('--body-shrink-scale', (current * corrective).toFixed(3));
        };
        const ro = new ResizeObserver(() => {
          tryFit();
          settleTries++;
          if (settleTries > 8) ro.disconnect(); // a real settle takes 2-3 callbacks in practice; 8 is a generous backstop, not a tuned budget
        });
        ro.observe(headlineEl);
        // Also catch the case where nothing ever resizes it again (no
        // race to lose) — the two rAFs plus fonts.ready still cover
        // the ordinary, uncontested path.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          tryFit();
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(tryFit);
        }));
        setTimeout(() => ro.disconnect(), 2000); // the sheet is fully settled well inside this window in every observed case
      }
    }

    /* Headline character budget per SIZE CLASS — answers the handoff's
       "font size and character count… limit?" against the SAME
       geometry the CSS "SIZE CLASS" system already uses (~L24298
       onward: each class's --hl-size clamp, --pad clamp and
       -webkit-line-clamp line count), not a second, hand-typed table.
       Each number is that class's own NARROWEST real member (a safe
       floor across the whole class, never an average that overpromises
       on the tightest size), run through the same clamp() formulas
       the CSS uses, times an 0.58 average-glyph-width-to-font-size
       ratio for Montserrat 800 uppercase — worked out once by hand
       here rather than re-deriving cqw/cqh/cqmin at runtime for a
       number that only changes if the CSS geometry above does:
         STRIP     320×50,  1 line — the class's own comment already
                   worked this one out ("no legibility floor fits a
                   24-character headline in 40px") — 20, safe floor.
         BOX       250×250, 2 lines — hl-size 23.75px, pad 15px, copy
                   220px wide → ~16 chars/line × 2 ≈ 32.
         TOWER     160×600, 3 lines — hl-size 17.6px, pad 9.6px, copy
                   140.8px wide → ~13.8 chars/line × 3 ≈ 41.
         BILLBOARD 970×250 (split's 44% column — its own tightest
                   treatment), 2 lines — hl-size 30px, copy ~397px
                   wide → ~22.8 chars/line × 2 ≈ 45.
       Flagged, not invented: no size class was skipped, but every
       number above is this file's own derivation, not a spec that came
       with the handoff — worth a second pair of eyes. */
    const BODY_LIMIT_BY_CLASS = { strip: 20, box: 32, tower: 41, billboard: 45 };
    function sizeClassFor(sizeId) {
      const parts = String(sizeId || '').split('x');
      const w = parseInt(parts[0], 10), h = parseInt(parts[1], 10);
      if (!w || !h) return 'box';
      if (h <= 120) return 'strip';
      if (w <= 300 && h >= 600) return 'tower';
      if (w >= 900 && h >= 200) return 'billboard';
      return 'box'; // BOX is also the CSS's own fallback for every unlisted small size
    }
    function bodyLimitForSize(sizeId) {
      return BODY_LIMIT_BY_CLASS[sizeClassFor(sizeId)] || BODY_LIMIT_BY_CLASS.box;
    }
    /* Fit control glyphs — hairline schematics, same 22×16/stroke-1
       family as the size/template pickers. Shrink: a dashed OUTER
       frame (the limit) around a smaller solid rect (the text,
       scaled down to fit inside it). Fixed: one solid frame at full
       size with a hard-clipped line — nothing shrinks, it just cuts. */
    const FIT_GLYPH = {
      shrink: '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' +
        '<rect x="3" y="2" width="16" height="12" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 1.5"/>' +
        '<rect x="7" y="5.5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '</svg>',
      fixed: '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' +
        '<rect x="3" y="4" width="16" height="8" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '<path d="M5.5 8h7.5" stroke="currentColor" stroke-width="1"/>' +
        '<rect x="14.5" y="7.4" width="1.2" height="1.2" fill="currentColor"/>' +
        '<rect x="16.5" y="7.4" width="1.2" height="1.2" fill="currentColor"/>' +
        '</svg>'
    };
    /* Legal style glyphs — same hairline family. Inline: a single
       rule (the line itself). Scroll box: the frame around several
       rules, since a scroll region is a block of lines, not a line. */
    const LEGAL_STYLE_GLYPH = {
      inline: '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' +
        '<path d="M3 8h16" stroke="currentColor" stroke-width="1"/>' +
        '</svg>',
      scroll: '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' +
        '<rect x="3" y="2" width="16" height="12" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '<path d="M6 6h10M6 8.5h10M6 11h6" stroke="currentColor" stroke-width="1"/>' +
        '</svg>'
    };
    /* What the model "writes" when Generate is switched on. Drawn from
       the same Corvache voice the copy pairs are written in — this
       prototype has no model behind it, and inventing a different one
       here would make the sheet read as two brands. */
    /* What the model "writes" for body copy — same Corvache voice as
       the headline/CTA pairs, for the same reason. */
    const BODY_GENERATED = [
      'THE ROAD REMEMBERS',
      'NOTHING BETWEEN YOU AND IT',
      'A CASE FOR THE LONG ROUTE',
      'BUILT TO BE DRIVEN FAR',
      'THE HOUR BEFORE DARK',
      'SOME ROADS ASK FOR MORE'
    ];
    const CTA_GENERATED = [
      'Take the drive', 'Meet the GT', 'Reserve yours', 'Book a test drive',
      'See the GT', 'Find your Corvache', 'Build yours', 'Start the drive', 'Plan the route'
    ];
    /* AT.2 — the legal pool: the lines the Corvache GT legal
       disclaimers file carries (the hat's own "Corvache GT — Legal
       Disclaimers" attachment), offered as chips in the band's Legal
       pane beside "None". A pick fills the banner's designed-in
       .pt-banner-disclaimer slot for the selection (fieldMutator
       'legal'); "None" empties it (the slot stays, as a placeholder). */
    const LEGAL_LINES = [
      'Closed-course. Professional driver. Always drive responsibly.',
      'Vehicle shown with optional equipment. Availability may vary by market.',
      'Corvache GT starting MSRP excludes tax, title, registration and dealer fees.',
      '\u00a92026 Corvache Automobili. All rights reserved.'
    ];
    /* Body and CTA are the same control twice — an editable list the
       sheet deals across its ads, plus a Generate switch — so they run
       off one set of functions keyed by which list they hold. */
    const COPY_LISTS = {
      ctas: { list: 'ptCtaList', count: 'ptCtaCount', add: 'ptCtaAddBtn', gen: 'ptCtaGenSwitch', attr: 'ctaRemove', unitSel: '.pt-banner-cta',
              empty: 'No CTAs set — each ad keeps the one it was written with.', addLabel: 'CTA' },
      bodies: { list: 'ptBodyList', count: 'ptBodyCount', add: 'ptBodyAddBtn', gen: 'ptBodyGenSwitch', attr: 'bodyRemove', unitSel: '.pt-banner-headline',
                empty: 'No headlines set — the ads run their generated lines.', addLabel: 'headline' }
    };
    // AJ.2 — copyUsageTags ("which units carry this line right now",
    // A1 · B3 · +2) retired with the rest of the per-row pool counts;
    // unitSel above stays on COPY_LISTS unused rather than risk
    // touching every entry for a dead reader's sake.
    function renderCopyList(key) {
      const cfg = COPY_LISTS[key];
      const list = document.getElementById(cfg.list);
      const items = sheetVariety[key];
      if (!list) return;
      // AT.2/AU.5 — the rows are pick rows laid column-major in the
      // tray's grid now (AL.4's two-up column flow went with the
      // popover it answered; AT.2's chips went with §AU).
      // Body copy only: V3 (PLAN.md §V) — the readout is judged against
      // the TIGHTEST ship size (bodyLimitForSize, min over brief.
      // shipSizes), not the board's own size — a line can look fine on
      // the 300x250 the board deals from and still overflow a 320x50
      // it also ships to, which the old n/limit-vs-board-size number
      // never said. Worded as a verdict instead of a fraction: fits
      // everything, or names the tightest size it breaks.
      // Fixed size is the only mode that ever needs the warning color;
      // Shrink to fit is the default precisely so a line is never
      // "wrong", just smaller.
      const isBody = key === 'bodies';
      let tightSize = null, tightLimit = null;
      if (isBody) {
        (brief.shipSizes.length ? brief.shipSizes : [brief.boardSize]).forEach((id) => {
          const lim = bodyLimitForSize(id);
          if (tightLimit === null || lim < tightLimit) { tightLimit = lim; tightSize = id; }
        });
      }
      // AL.4 — a row is the house pick-row recipe now (setPickItemHTML/
      // .pt-set-item, radio at the right), not the pool editor's own
      // anatomy: no × remove control (the pool only ever grows here
      // now, via +Add/Write 3 more), and a click applies the line to
      // the selection (pickRow, in initLegalAndCta below) instead of
      // editing it in place. Every row starts unmarked (isOn false) —
      // syncFieldRowsActive (syncBandFieldsUI) is what checks the
      // selection's own shared line, same contract as Layout/Color/
      // Imagery's rows already keep. Only a freshly-added row (i at
      // items.length, still mid-add) is ever contenteditable — that
      // one keeps its own separate .pt-cta-row/discard-× shape,
      // built by the +Add handler below, untouched by this function.
      list.innerHTML = items.length
        ? items.map((t, i) => {
            const fits = !isBody || t.length <= tightLimit;
            const over = isBody && sheetVariety.bodyFit === 'fixed' && !fits;
            const readout = (isBody && !fits) ? ('long for ' + tightSize.replace('x', '×')) : '';
            let row = setPickItemHTML('', t, readout, false, over ? 'pt-set-item--copyover' : null, false, 'data-copy-i="' + i + '"');
            // The click-to-apply / edit-when-new-row hooks used to live
            // on .pt-cta-row-text; initLegalAndCta's own pickRow/
            // startEdit/endEdit still look for [data-copy-edit], so the
            // pick row's own name span carries it instead — nothing
            // else in that wiring changes.
            row = row.replace('<span class="pt-set-item-name">',
              '<span class="pt-set-item-name" tabindex="0" role="textbox" title="Click to apply to the selection" data-copy-edit>');
            return row;
          }).join('')
        : '<p class="pt-cta-empty">' + cfg.empty + '</p>';
      // AU.5 — the rows lay column-major (grid-auto-flow: column) in
      // up to three columns, so the grid needs its ROW count: the
      // three- and two-column counts ride as custom properties the
      // tray's CSS reads per width regime (is-mid = two columns).
      list.style.setProperty('--pt-copy-rows-3', String(Math.max(1, Math.ceil(items.length / 3))));
      list.style.setProperty('--pt-copy-rows-2', String(Math.max(1, Math.ceil(items.length / 2))));
    }
    function renderCtaList() { renderCopyList('ctas'); renderCopyList('bodies'); }
    /* Fit — two-option radio row set, .pt-set-item--pick anatomy,
       directly in the Body copy popover (no nested pill: only two
       options, and they govern how the list above renders, not
       another set to pick from). */
    function renderBodyFitRows() {
      const wrap = document.getElementById('ptBodyFitRows');
      if (!wrap) return;
      const on = sheetVariety.bodyFit;
      // AT.2/AU.5 — the pair sits at the tray's right end behind a
      // hairline, its two rows stacked (glyph + name + radio); no
      // eyebrow (AU.7) — the old subs ("Scales down to fit" /
      // "Ellipsis at the limit") ride as native titles.
      wrap.innerHTML =
        setPickItemHTML(FIT_GLYPH.shrink, 'Shrink to fit', '', on === 'shrink', null, false, 'data-body-fit="shrink" title="Scales down to fit"') +
        setPickItemHTML(FIT_GLYPH.fixed, 'Fixed size', '', on === 'fixed', null, false, 'data-body-fit="fixed" title="Ellipsis at the limit"');
    }
    function initBodyFit() {
      const wrap = document.getElementById('ptBodyFitRows');
      if (!wrap) return;
      renderBodyFitRows();
      wrap.addEventListener('click', (e) => {
        const hit = e.target.closest('[data-body-fit]');
        if (!hit || hit.dataset.bodyFit === sheetVariety.bodyFit) return;
        sheetVariety.bodyFit = hit.dataset.bodyFit;
        renderBodyFitRows();
        renderCopyList('bodies'); // the over-limit warning only ever applies in Fixed size
        applyBodyFitToSelection(); // AJ.2 — a sheet-wide MODE, but its re-render only ever touches the selection
      });
    }
    /* Legal style — Inline (the one line the slot always carried) or
       Scroll box (pharma ISI: a bounded region that really scrolls).
       Same two-option radio-row idiom as Fit, directly in the Legal
       popover, for the same reason: two options that govern how the
       text above renders, not another set to pick from. */
    function renderLegalStyleRows() {
      const wrap = document.getElementById('ptLegalStyleRows');
      if (!wrap) return;
      const on = sheetVariety.legalStyle;
      // AT.2 — same treatment as the Fit pair above: glyph + name at
      // the Legal pane's right end, the subs as titles.
      wrap.innerHTML =
        setPickItemHTML(LEGAL_STYLE_GLYPH.inline, 'Inline', '', on === 'inline', null, false, 'data-legal-style="inline" title="One line in the slot"') +
        setPickItemHTML(LEGAL_STYLE_GLYPH.scroll, 'Scroll box', '', on === 'scroll', null, false, 'data-legal-style="scroll" title="Scrolls when long"');
    }
    function initLegalStyle() {
      const wrap = document.getElementById('ptLegalStyleRows');
      if (!wrap) return;
      renderLegalStyleRows();
      wrap.addEventListener('click', (e) => {
        const hit = e.target.closest('[data-legal-style]');
        if (!hit || hit.dataset.legalStyle === sheetVariety.legalStyle) return;
        sheetVariety.legalStyle = hit.dataset.legalStyle;
        renderLegalStyleRows();
        applyLegalStyleToSelection(); // AJ.2 — same sheet-wide-mode/selection-scoped-render split as Fit above
      });
    }
    function initLegalAndCta() {
      // AT.2 — Legal is a pick from the pool's lines (LEGAL_LINES, plus
      // None) in the tray now, wired with the other picks in
      // initBandFieldMenus; the AJ.2 textarea retired with the popover.
      /* Body and CTA wire identically off COPY_LISTS. Rows are a
         pickable library now (AJ.2), not an editable pool: clicking an
         EXISTING row applies its text to the selection; the in-place
         edit below survives only for typing a brand-NEW row's text
         (Add), and for that row alone. */
      Object.keys(COPY_LISTS).forEach((key) => {
        const cfg = COPY_LISTS[key];
        const list = document.getElementById(cfg.list);
        const addBtn = document.getElementById(cfg.add);
        const gen = document.getElementById(cfg.gen);
        const fieldKind = key === 'ctas' ? 'cta' : 'headline';
        const commitAll = () => { renderCopyList(key); };
        const startEdit = (textEl) => {
          if (textEl.getAttribute('contenteditable') === 'true') return;
          textEl.dataset.was = textEl.textContent;
          textEl.setAttribute('contenteditable', 'true');
          textEl.focus();
          const range = document.createRange(); range.selectNodeContents(textEl);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        };
        // Only ever reachable for the new, uncommitted row (index ===
        // length) — see the click/keydown handlers below, which apply
        // rather than edit for every row that already exists.
        const endEdit = (textEl, cancel) => {
          if (textEl.getAttribute('contenteditable') !== 'true') return;
          textEl.removeAttribute('contenteditable');
          // Coordinator fix — AL.18 restyled existing rows as
          // .pt-set-item pick tiles (data-copy-i sits on the row
          // itself, not inside a .pt-cta-row wrapper); only a brand-
          // new in-progress row (the Add button's own markup) still
          // carries that class. `[data-copy-i]` matches both shapes —
          // .pt-cta-row was throwing on every existing-row click
          // (row === null), which silently broke every Headline/CTA
          // pick from the pool (§BR.3 uncovered it — no probe had
          // clicked an existing row before).
          const row = textEl.closest('[data-copy-i]');
          const i = parseInt(row.dataset.copyI, 10);
          const v = cancel ? textEl.dataset.was : textEl.textContent.trim();
          if (i >= sheetVariety[key].length) { // a new row
            if (v && sheetVariety[key].indexOf(v) === -1) sheetVariety[key].push(v);
          } else {
            textEl.textContent = v; return; // stray reopen on an existing row — no-op, never edits pool text directly
          }
          commitAll();
        };
        // Applies an EXISTING row's text to the current selection
        // (the row-click/activate case); startEdit stays reserved for
        // the new-row-being-typed case (Add, below).
        const pickRow = (textEl) => {
          const row = textEl.closest('[data-copy-i]'); // coordinator fix — see endEdit's own comment
          const i = parseInt(row.dataset.copyI, 10);
          if (i < sheetVariety[key].length) applyFieldValueToSelection(fieldKind, sheetVariety[key][i], i); // §BR.3 — i is the pool slot, registerLineAsset's own id key
          else startEdit(textEl);
        };
        if (list) {
          list.addEventListener('click', (e) => {
            const del = e.target.closest('[' + 'data-' + cfg.attr.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ']');
            if (del) { sheetVariety[key].splice(parseInt(del.dataset[cfg.attr], 10), 1); commitAll(); return; }
            const textEl = e.target.closest('[data-copy-edit]');
            if (textEl) { pickRow(textEl); return; }
            // AL.18 — the rows are pick buttons now (setPickItemHTML with
            // data-copy-i); an existing row applies its line to the selection.
            const pick = e.target.closest('[data-copy-i]');
            if (pick) {
              const i = parseInt(pick.dataset.copyI, 10);
              if (i < sheetVariety[key].length) applyFieldValueToSelection(fieldKind, sheetVariety[key][i], i); // §BR.3 — same pool-slot id as pickRow above
            }
          });
          list.addEventListener('keydown', (e) => {
            const textEl = e.target.closest('[data-copy-edit]');
            if (!textEl) return;
            if (e.key === 'Enter' && textEl.getAttribute('contenteditable') === 'true') { e.preventDefault(); endEdit(textEl, false); }
            else if (e.key === 'Escape') { e.preventDefault(); endEdit(textEl, true); e.stopPropagation(); }
            else if ((e.key === ' ' || e.key === 'Enter') && textEl.getAttribute('contenteditable') !== 'true') { e.preventDefault(); pickRow(textEl); }
          });
          list.addEventListener('focusout', (e) => {
            const textEl = e.target.closest && e.target.closest('[data-copy-edit]');
            if (textEl) endEdit(textEl, false);
          });
        }
        if (addBtn && list) {
          addBtn.addEventListener('click', () => {
            const empty = list.querySelector('.pt-cta-empty');
            if (empty) empty.remove();
            const i = sheetVariety[key].length;
            const row = el('<div class="pt-cta-row is-new" data-copy-i="' + i + '">' +
              '<span class="pt-cta-row-text" tabindex="0" role="textbox" data-copy-edit data-placeholder="New ' + cfg.addLabel + '"></span>' +
              '<button class="pt-cta-row-del" type="button" aria-label="Discard">' + ICONS.x + '</button>' +
            '</div>');
            list.appendChild(row);
            row.querySelector('.pt-cta-row-del').addEventListener('click', (e) => { e.stopPropagation(); row.remove(); if (!sheetVariety[key].length) renderCopyList(key); });
            startEdit(row.querySelector('[data-copy-edit]'));
          });
        }
        if (gen) {
          /* V3 (PLAN.md §V) — was a dip-switch that stayed lit after
             its one-shot write with no state it actually tracked (a
             second click just toggled the light, a third relit it for
             the same no-op append). A plain button fires once and is
             done: disabled only for the 900ms "Writing…" beat it
             always had, appends the NEXT three lines the sheet doesn't
             already hold (dedup kept, straight off CTA_GENERATED/
             BODY_GENERATED as before) — "3 more" is what the label
             says, so it is what the click does, not "however many are
             left in the source array." AJ.2 — these are still just
             added to the pickable library; nothing on the board
             changes until one of them is clicked. */
          gen.addEventListener('click', () => {
            if (gen.disabled) return;
            gen.disabled = true;
            gen.classList.add('is-writing');
            setTimeout(() => {
              const source = key === 'ctas' ? CTA_GENERATED : BODY_GENERATED;
              const fresh = source.filter((t) => sheetVariety[key].indexOf(t) === -1).slice(0, 3);
              fresh.forEach((t) => sheetVariety[key].push(t));
              renderCopyList(key);
              // the lines that just landed hold a tint for a beat
              Array.prototype.forEach.call(document.getElementById(cfg.list).querySelectorAll('.pt-cta-row'), (row) => {
                if (fresh.indexOf(row.querySelector('.pt-cta-row-text').textContent) !== -1) row.classList.add('is-new');
              });
              gen.disabled = false;
              gen.classList.remove('is-writing');
            }, 900);
          });
        }
        renderCopyList(key);
      });
    }

    /* The size of the space the current settings can draw from:
       templates x colours x images x CTAs x body lines. Not the nine
       on the sheet — that is the sample; this is the population, and
       watching it move is how you tell whether a menu pick actually
       bought you variety.

       Templates resolve to layout ids and de-duplicate first (two brand
       templates can sit on one layout, and those produce the same unit).
       An empty set counts as 1: that is the brand default, one option,
       not zero. Legal is excluded on purpose — it sets the same line on
       every unit, so it multiplies nothing. */
    function possibleUnitCount() {
      const layouts = sheetVariety.templates.length
        ? sheetVariety.templates.map(templateLayoutId).filter((v, i, a) => a.indexOf(v) === i).length
        : 1;
      const colours = sheetVariety.colorways.length || 1;
      const images = sheetVariety.images.length || 1;
      const ctas = sheetVariety.ctas.length || 1;
      const bodies = sheetVariety.bodies.length || 1;
      return layouts * colours * images * ctas * bodies;
    }
    let lastUnitCount = null;
    function syncUnitCount() {
      const wrap = document.getElementById('ptUnitCount');
      const num = document.getElementById('ptUnitCountNum');
      if (!num || !wrap) return;
      const n = possibleUnitCount();
      wrap.childNodes[1].nodeValue = n === 1 ? ' possible unit' : ' possible units';
      if (n === lastUnitCount) return;
      const first = lastUnitCount === null;
      lastUnitCount = n;
      num.textContent = String(n);
      if (first) return; // no beat on the sheet's own first paint
      num.classList.remove('is-bumped');
      void num.offsetWidth; // restart rather than let the animation no-op
      num.classList.add('is-bumped');
    }

    // AV.2 — pulled out of renderBandFieldLists' own once-only guard
    // below so the hat's Imagery pill can force a rebuild straight off
    // GALLERY_ITEMS after an upload (that array is mutated in place —
    // unshift — so this always reads the current order); renderBand-
    // FieldLists keeps calling it exactly once, same as every other
    // list here.
    function renderImageSwapList() {
      const iList = document.getElementById('ptImageSwapList');
      if (!iList) return;
      // 9/15 — the Add-image tile leads the strip (the hat menu's own
      // tile recipe); the pick lands on the selection, the frame joins
      // the gallery everywhere (window._ptGalleryAddFrame, 13-*).
      const addTile = '<button class="pt-imagery-add-tile pt-band-image-add" type="button" data-band-image-add aria-label="Add image">' +
        '<span class="pt-imagery-add-icon" aria-hidden="true">' + ICONS.plus + '</span>' +
        '<span class="pt-imagery-add-label">Add image</span>' +
      '</button>';
      iList.innerHTML = addTile + GALLERY_ITEMS.map(f => {
        const inner = f.kind === 'video'
          ? '<video data-src="' + f.src + '" muted loop playsinline preload="metadata" disablepictureinpicture></video>'
          : '<img src="' + f.src + '" alt="" loading="lazy">';
        return '<button class="pt-editor-swap-thumb' + (f.kind === 'video' ? ' is-video' : '') + '" type="button"' +
          ' data-variety-image="' + f.src + '" title="' + escape(f.label) + '">' + inner + '</button>';
      }).join('');
      observeEnvVideoSrc(iList);
    }
    // AJ.2 — renamed from renderVarietyMenus: these are the band's
    // OPTION lists now (what you can pick FOR the selection), never a
    // sheet-wide pool. Rosters are still static — build each list
    // once, then only its ticks ever change (syncFieldRowsActive,
    // driven by syncBandFieldsUI above buildConceptSheetDOM) — so
    // every row starts unmarked here regardless of what's on the
    // sheet; the very next syncBandFieldsUI (every selection change)
    // marks whichever one the selection actually shares. AT.2 — the
    // lists live in the band's tray panes now, each laid sideways by
    // the tray's own CSS; the builders are the hat's own.
    function renderBandFieldLists() {
      /* AI.2/AU.1 — Layouts: the nine generic layouts as TILES (the
         layout drawn at 72×48 — bandLayoutTileSVG — over its name;
         setPickItemHTML's row stood up as a tile by the tray's CSS,
         the pick row's own radio lane retired there: the ring is the
         radio), the same data-variety-template delegate (read back by
         syncFieldRowsActive against the selection's shared data-layout,
         not a pool); the layout's sub rides as a title. Style is the
         hat's own Styles panel's own roster (AA.3's search over the
         grouped roster) — one recipe, four places it opens from (this
         tray's two panes, the hat's two pills). */
      const tList = document.getElementById('ptTemplatesList');
      if (tList && !tList.children.length) {
        // §BV (Bryan, 9/18: "there needs to be like original layout in
        // here… or reset to original but with better language") —
        // Original leads the tile row: picking it returns every unit
        // in scope to the layout IT was generated with (data-layout-
        // origin, possibly different per unit — the 2×2 glyph below
        // is deliberately mixed, not one shape repeated).
        tList.innerHTML =
          setPickItemHTML(bandOriginalTileSVG(), 'Original', "Each banner's own", false, null, false, 'data-variety-template="__original__"') +
          ALL_LAYOUT_IDS.map(id =>
            setPickItemHTML(bandLayoutTileSVG(id), LAYOUT_NAME[id], '', false, null, false,
              'data-variety-template="' + id + '" title="' + escape(SET_TEMPLATE_SUB[id] || '') + '"')
          ).join('');
      }
      /* AI.2/AT.2 — the roster, built once (same as Layouts above), so
         openBandTray clears its search on every open instead —
         nothing here rebuilds. wrapRosterGroupsForTray
         (below) blocks each brand group so the strip's wrap keeps a
         head with its own covers. */
      const sList = document.getElementById('ptStyleList');
      if (sList && !sList.children.length) {
        sList.innerHTML = brandRosterColHTML('data-variety-template', []); // AL.2 — same unified "Style Guides · N" eyebrow as the hat's own panel (hidden by the tray's CSS; the field names the pane)
        wrapRosterGroupsForTray(sList);
        wireBrandRosterCol(sList);
      }
      // §BT — the Colorway list (ptColorwayList) retired with the
      // Colorway group; colour comes from the picked style guide only.
      const iList = document.getElementById('ptImageSwapList');
      if (iList && !iList.children.length) renderImageSwapList();
      // AT.2/AU.6 — Legal: "None", then the pool's lines, as pick rows
      // (one column — the tray's CSS).
      const lList = document.getElementById('ptLegalList');
      if (lList && !lList.children.length) {
        lList.innerHTML =
          setPickItemHTML('', 'None', '', false, null, false, 'data-legal-i="-1"') +
          LEGAL_LINES.map((t, i) => setPickItemHTML('', t, '', false, null, false, 'data-legal-i="' + i + '"')).join('');
      }
      syncBandFieldsUI(); // AJ.2 — marks whichever rows match the CURRENT selection, if any
    }
    // AU.1 — the layout DRAWN for a tile: layoutWireframeInner's own
    // hairline strokes (the one drawing the pill glyph and the panel
    // row share — and, until AN.4, the resting viewfinder's cells)
    // grown from the 22×16 glyph to the tile's 72×48. The strokes
    // are non-scaling so a hairline stays a hairline at 3× (a scaled
    // stroke-width 1 reads as a 3px marker line); the box is drawn to
    // the tile's own 3:2 (preserveAspectRatio none — proportional
    // boxes, not a picture, so nothing "distorts"), inset 1.5 units
    // at the sides so the drawing sits in the tile the way the
    // glyph sits in its lane.
    function bandLayoutTileSVG(id) {
      return '<svg width="72" height="48" viewBox="1.5 0 19 16" preserveAspectRatio="none" aria-hidden="true">' +
        layoutWireframeInner(id).replace(/stroke-width="1"/g, 'stroke-width="1" vector-effect="non-scaling-stroke"') +
      '</svg>';
    }
    // §BV — Original's own glyph: a tiny 2×2 of four DIFFERENT layout
    // wireframes (never one shape repeated — "Each banner's own" is
    // the whole point), reusing layoutWireframeInner's own strokes at
    // quarter scale rather than drawing a new glyph. Same tile recipe/
    // viewBox as bandLayoutTileSVG so it sits in the row exactly like
    // its siblings.
    function bandOriginalTileSVG() {
      const ids = ['type-top', 'split', 'stacked', 'card'];
      const cells = [[1.5, 0], [11, 0], [1.5, 8], [11, 8]];
      const inner = ids.map((id, i) =>
        '<g transform="translate(' + cells[i][0] + ',' + cells[i][1] + ') scale(0.5)">' + layoutWireframeInner(id) + '</g>'
      ).join('');
      return '<svg width="72" height="48" viewBox="1.5 0 19 16" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>';
    }
    // AT.2/AU.2 — brandRosterColHTML emits its roster flat (a group
    // head, then that group's rows, then the next head…): laid as a
    // strip that could strand a head away from its own covers, so
    // each group is blocked into one flex item here — the head
    // leading, its covers in a row beneath it (.pt-band-tray-roster-
    // cards). wireBrandRosterCol's own queries ([data-roster-group],
    // .pt-set-item inside [data-roster-all]) see through the wrappers.
    function wrapRosterGroupsForTray(root) {
      const all = root.querySelector('[data-roster-all]');
      if (!all) return;
      let group = null, cards = null;
      Array.prototype.slice.call(all.children).forEach((child) => {
        if (child.hasAttribute('data-roster-group')) {
          group = document.createElement('div');
          group.className = 'pt-band-tray-roster-group';
          cards = document.createElement('div');
          cards.className = 'pt-band-tray-roster-cards';
          all.insertBefore(group, child);
          group.appendChild(child);
          group.appendChild(cards);
          return;
        }
        if (cards) cards.appendChild(child);
      });
    }

    /* Header popovers are absolutely positioned inside their header,
       which is fine for the concept sheet's (near the top of the
       canvas) and useless for the Selects one: opened from a header
       1700px down a 950px viewport, the menu rendered entirely below
       the fold, so its inner list could never be reached to scroll.
       Fixed coordinates computed from the trigger fix that, and the
       max-height cap keeps a long list inside the viewport whichever
       way it opens. Same technique openSetMenu already uses for the
       hat's own pills. */
    function positionSheetPop(btn, pop) {
      /* position:fixed is NOT enough on its own here: the canvas stack
         carries transform/filter, which per the containing-block spec
         makes an ancestor the reference frame for fixed descendants —
         so the coordinates below would be measured in the viewport and
         then resolved against something else entirely (observed: a
         left of 1238 rendering at 1884). Hoist to <body> first, the
         same fix positionMenu already applies for the graphics grid;
         closeAllPtSheetPopovers puts it back so getElementById and the
         header's own layout keep working. */
      if (pop.parentElement !== document.body) {
        pop._origParent = pop.parentElement;
        document.body.appendChild(pop);
      }
      pop.style.position = 'fixed';
      pop.style.right = 'auto';
      const r = btn.getBoundingClientRect();
      const gap = 8, margin = 12;
      const w = pop.offsetWidth;
      const below = window.innerHeight - r.bottom - gap - margin;
      const above = r.top - gap - margin;
      const openDown = below >= Math.min(above, 320) || below >= above;
      pop.style.maxHeight = Math.max(200, openDown ? below : above) + 'px';
      pop.style.overflowY = 'auto';
      const h = Math.min(pop.scrollHeight, parseFloat(pop.style.maxHeight));
      /* 9/10 — anchor to the chip's LEFT edge when the menu fits that
         way, its right edge when it only fits that way, and clamp to
         the viewport otherwise. Right-anchored only, the 580px
         Templates menu (first chip of the sheet toolbar) landed over
         the chat column, nowhere near its own chip. */
      const leftFits = r.left + w <= window.innerWidth - margin;
      const rightFits = r.right - w >= margin;
      const anchored = leftFits ? r.left : (rightFits ? r.right - w : r.left);
      pop.style.left = Math.max(margin, Math.min(anchored, window.innerWidth - w - margin)) + 'px';
      pop.style.top = (openDown ? r.bottom + gap : Math.max(margin, r.top - gap - h)) + 'px';
    }

    // AJ.2 — renamed from initVarietyMenus: the enumerable-option
    // panes (Layout/Style/Color/Imagery, AT.2 + Legal) are each a
    // SINGLE pick — a click applies straight to the selection
    // (applyFieldValueToSelection) rather than toggling pool
    // membership. One delegated listener on the tray reads the row's
    // own data attribute; the pane it sits in says whether a
    // data-variety-template row is a layout or a style guide (the two
    // panes share the attribute and the sync, AI.2). Headline/CTA keep
    // their own list-level wiring in initLegalAndCta.
    function initBandFieldMenus() {
      const tray = document.getElementById('ptBandTray');
      if (tray && !tray._picksWired) {
        tray._picksWired = true;
        tray.addEventListener('click', (e) => {
          // 9/15 — the Imagery pane's own three: search (its clicks are
          // its own), Add image (a picked file joins the gallery and
          // lands on the selection), View gallery (Your Gallery in
          // single-pick, the chosen frame landing on the selection).
          if (e.target.closest('[data-band-image-search]')) { e.stopPropagation(); return; }
          if (e.target.closest('[data-band-image-add]')) {
            e.stopPropagation();
            if (window._ptImageryOpenFilePicker && window._ptGalleryAddFrame) {
              window._ptImageryOpenFilePicker((file) => {
                const frame = window._ptGalleryAddFrame(file);
                if (frame) applyFieldValueToSelection('imagery', frame.src); // §BN.1 — applies to "all" when nothing is picked
              });
            }
            return;
          }
          if (e.target.closest('[data-band-gallery]')) {
            e.stopPropagation();
            if (window._ptOpenGalleryPicker) {
              window._ptOpenGalleryPicker((chosen) => {
                const f = chosen && chosen[0];
                if (f && f.src) applyFieldValueToSelection('imagery', f.src); // §BN.1 — applies to "all" when nothing is picked
              }, 'single');
            }
            return;
          }
          const hit = e.target.closest('[data-variety-template], [data-variety-image], [data-legal-i]');
          if (!hit) return; // §BN.1 — the tray can open with nothing picked now (it edits "all"); applyFieldValueToSelection/selectedUnitCards handle the empty-selection fallback
          if (hit.hasAttribute('data-variety-template')) {
            const pane = hit.closest('.pt-band-tray-pane');
            const kind = pane && pane.getAttribute('data-sheet-tool') === 'style' ? 'style' : 'layout';
            const templateVal = hit.getAttribute('data-variety-template');
            // §BV — Original is a layout-only sentinel (never reachable
            // from the Style pane's own roster ids): each unit in scope
            // goes back to ITS OWN generated layout rather than one
            // shared value, so it can't ride applyFieldValueToSelection's
            // one-value-for-all shape.
            if (kind === 'layout' && templateVal === '__original__') applyOriginalLayoutToSelection();
            else applyFieldValueToSelection(kind, templateVal);
          } else if (hit.hasAttribute('data-variety-image')) {
            applyFieldValueToSelection('imagery', hit.getAttribute('data-variety-image'));
          } else {
            const i = parseInt(hit.getAttribute('data-legal-i'), 10);
            // §BR.3 — i is LEGAL_LINES' own index, the same pool key
            // registerLineAsset deals legal from at generation; -1
            // (None) has no slot to reference (fieldMutator's own
            // per-unit-override fallback for that case).
            applyFieldValueToSelection('legal', i < 0 ? '' : LEGAL_LINES[i], i < 0 ? null : i);
          }
        });
        // the Imagery pane's search: a query hides the thumbs whose label
        // (the button's own title) doesn't carry it; the Add tile stays
        tray.addEventListener('input', (e) => {
          if (!e.target.matches('[data-band-image-search]')) return;
          const q = e.target.value.trim().toLowerCase();
          Array.prototype.forEach.call(tray.querySelectorAll('#ptImageSwapList [data-variety-image]'), (th) => {
            th.hidden = !!q && (th.getAttribute('title') || '').toLowerCase().indexOf(q) === -1;
          });
        });
      }
      renderBandFieldLists();
    }

    // ═══ §BP — the band's LIGHTBOX (supersedes AT's in-flow push
    //     tray: "instead of drawers, can we do these as lightboxes?").
    //     One #ptBandLightbox reusing the Package overlay's own recipe
    //     (§AF/BC — fixed viewport scrim, window-wide blur, a centred
    //     card, house blur-fade motion; .pt-band-lightbox in
    //     18-sheet-a.css, not a new pattern). #ptBandTray/
    //     #ptBandTrayInner and every .pt-band-tray-pane below are
    //     untouched — they're the card's own body now, nothing else
    //     changed about them, so renderBandFieldLists/initLegalAndCta/
    //     syncBandFieldsUI/setTrayMixed all still read the same ids.
    //     A field click opens straight to its pane (no crossfade swap
    //     — only one lightbox is ever open, so reaching another field
    //     means closing this one first, same as any modal); a pick
    //     applies and closes (applyFieldValueToSelection, 14-hat-a-
    //     files.js); Esc or a scrim click close without change; the
    //     band itself never changes height (fixed, keeps §BN's sticky
    //     band short). ═══
    let bandTrayTool = null;        // the open pane's data-sheet-tool, or null
    let bandLightboxTriggerEl = null; // BC.1 — focus returns here on close
    function bandLightboxEl() { return document.getElementById('ptBandLightbox'); }
    function bandTrayEl() { return document.getElementById('ptBandTray'); }
    function bandTrayPane(tool) { return tool ? document.querySelector('#ptBandTray .pt-band-tray-pane[data-sheet-tool="' + tool + '"]') : null; }
    function bandFieldFor(tool) { return document.querySelector('.pt-sheet-band .pt-band-field[data-sheet-tool="' + tool + '"]'); }
    // The open field reads as open (the band's own active recipe keys
    // off aria-expanded, and stays that way while its lightbox is up —
    // §BP: "the open cell keeps its active state"); every other field
    // reads closed.
    function syncBandFieldExpanded() {
      Array.prototype.forEach.call(document.querySelectorAll('.pt-sheet-band .pt-band-field'), (b) => {
        b.setAttribute('aria-expanded', String(!!bandTrayTool && b.getAttribute('data-sheet-tool') === bandTrayTool));
      });
    }
    function showBandTrayPane(tool) {
      Array.prototype.forEach.call(document.querySelectorAll('#ptBandTray .pt-band-tray-pane'), (p) => {
        p.hidden = p.getAttribute('data-sheet-tool') !== tool;
      });
    }
    // The strips' edge fades (the Selects strip's own updateStripFade,
    // AG.2): every row that can scroll sideways — Imagery always, and
    // every row once the card is in its narrow regime — re-reads its
    // own overflow here; a row that fits simply gets no fade.
    function syncBandTrayStrips() {
      const tray = bandTrayEl();
      if (!tray) return;
      Array.prototype.forEach.call(tray.querySelectorAll('.pt-band-tray-strip, .pt-band-tray-row, .pt-set-roster-recent-rows, .pt-set-roster-all'), (row) => {
        if (row.closest('[hidden]')) return;
        updateStripFade(row);
      });
    }
    // §BP — the card sizes to its own content (Imagery/Style wide,
    // Headline/CTA narrower, Legal narrowest — .pt-band-lightbox
    // [data-band-tool] width rules, 18-sheet-a.css), capped to the
    // viewport with the card's own internal scroll; the copy grid's
    // one/two/three-column regimes (AU.5) and the roster's stacked-
    // group regime (AT.2) now key off the CARD's own width instead of
    // the sheet stage's — a lightbox is sized to its field, not to
    // whatever the board happens to be doing.
    function syncBandLightboxNarrow() {
      const tray = bandTrayEl();
      const card = document.getElementById('ptBandLightboxCard');
      if (tray && card) {
        tray.classList.toggle('is-narrow', card.clientWidth < 400);
        tray.classList.toggle('is-mid', card.clientWidth >= 400 && card.clientWidth < 640);
      }
      syncBandTrayStrips();
    }
    function openBandTray(tool) {
      const lightbox = bandLightboxEl();
      const tray = bandTrayEl();
      if (!lightbox || !tray || !bandTrayPane(tool)) return;
      ptHideFloatingTip(); // AL.9 — the field's tip yields to its lightbox
      // AA.3/AI.2 — the Style roster is built once and never torn
      // down, so opening back into it forces the refresh-resets rule
      // by hand: RECENT, every time.
      if (tool === 'style') {
        const sList = document.getElementById('ptStyleList');
        if (sList && sList._rosterReset) sList._rosterReset();
      }
      bandTrayTool = tool;
      bandLightboxTriggerEl = document.activeElement;
      syncBandFieldExpanded();
      showBandTrayPane(tool);
      lightbox.dataset.bandTool = tool; // sizing hook — .pt-band-lightbox[data-band-tool="…"]
      const field = bandFieldFor(tool);
      const fieldLabelEl = field && field.querySelector('.pt-band-field-label');
      const countEl = document.getElementById('ptBandCountText');
      const titleEl = document.getElementById('ptBandLightboxTitle');
      // §BP — "a header naming the field and the scope": the same
      // "All 9 units"/"3 units" text the band's own count cell reads
      // (syncBandFieldsUI/previewBandCount write it), so the two never
      // disagree.
      if (titleEl) titleEl.textContent = (fieldLabelEl ? fieldLabelEl.textContent : '') + (countEl && countEl.textContent ? ' · ' + countEl.textContent : '');
      lightbox.setAttribute('data-visible', '1');
      lightbox.setAttribute('aria-hidden', 'false');
      tray.setAttribute('aria-hidden', 'false');
      syncBandLightboxNarrow();
      // BC.1 — focus moves to the card itself (tabindex=-1, no ring of
      // its own); Tab is trapped inside it while open (wireSheetBand's
      // own keydown listener, below).
      const card = document.getElementById('ptBandLightboxCard');
      if (card) requestAnimationFrame(() => card.focus({ preventScroll: true }));
    }
    function closeBandTray(opts) {
      const lightbox = bandLightboxEl();
      const tray = bandTrayEl();
      if (!lightbox || !bandTrayTool) return;
      const tool = bandTrayTool;
      bandTrayTool = null;
      syncBandFieldExpanded();
      lightbox.setAttribute('data-visible', '0');
      lightbox.setAttribute('aria-hidden', 'true');
      if (tray) tray.setAttribute('aria-hidden', 'true');
      showBandTrayPane(null);
      if (opts && opts.focus) {
        const b = bandFieldFor(tool);
        if (b) b.focus();
      } else if (bandLightboxTriggerEl && document.contains(bandLightboxTriggerEl)) {
        bandLightboxTriggerEl.focus();
      }
      bandLightboxTriggerEl = null;
    }
    // AD.2/§BP — the sheet's own band of FIELD buttons: each opens its
    // lightbox; the same field closes it. Escape (capture, so it runs
    // before the selection's own Escape-clears and stops there) and a
    // scrim click close it too (never a bubbled click from the card —
    // the same AH.2 test Package's own overlay click uses).
    function wireSheetBand() {
      const band = document.querySelector('.pt-sheet-band');
      const lightbox = bandLightboxEl();
      const tray = bandTrayEl();
      if (!band || band._wired) return;
      band._wired = true;
      // §BO.2 amendment to §BN.2 — the band used to pin directly beneath
      // #ptSelectsSection (itself sticky, top: 0), measuring that
      // section's own live height into --pt-band-sticky-top so it
      // landed exactly on its bottom hairline. Selects has retired: the
      // band is the first thing in the sheet's own scroll flow now, so
      // it re-anchors to the sheet's own scroll top instead — 0, not a
      // measured offset (nothing sticky precedes it to stack under).
      const sheetMain = document.querySelector('.pt-sheet-main');
      if (sheetMain) sheetMain.style.setProperty('--pt-band-sticky-top', '0px');
      band.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-band-field');
        if (!btn) return;
        const tool = btn.getAttribute('data-sheet-tool');
        if (!bandTrayPane(tool)) return;
        if (bandTrayTool === tool) closeBandTray(); else openBandTray(tool);
      });
      if (lightbox) {
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeBandTray(); });
        const closeBtn = document.getElementById('ptBandLightboxCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => closeBandTray());
      }
      document.addEventListener('keydown', (e) => {
        if (!bandTrayTool || e.defaultPrevented) return; // defaultPrevented: a hat menu just took this key (closeSetMenu's own capture handler runs first)
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeBandTray({ focus: true });
          return;
        }
        // BC.1 — Tab is trapped in the lightbox card while it's open.
        if (e.key === 'Tab') {
          const card = document.getElementById('ptBandLightboxCard');
          if (!card) return;
          const focusables = Array.prototype.filter.call(
            card.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
            (n) => n.offsetParent !== null
          );
          if (!focusables.length) return;
          const first = focusables[0], last = focusables[focusables.length - 1];
          if (focusables.indexOf(document.activeElement) === -1) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }, true);
      if (tray) {
        // The strips scroll sideways on a vertical wheel, as the Selects
        // strip does (AG.2); 'scroll' doesn't bubble — capture sees it.
        tray.addEventListener('wheel', (e) => {
          const row = e.target.closest('.pt-band-tray-strip, .pt-band-tray-row, .pt-set-roster-recent-rows, .pt-set-roster-all');
          if (!row || row.scrollWidth <= row.clientWidth + 2 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          e.preventDefault();
          row.scrollLeft += e.deltaY;
          updateStripFade(row);
        }, { passive: false });
        tray.addEventListener('scroll', (e) => { if (e.target && e.target.nodeType === 1) updateStripFade(e.target); }, true);
      }
      // §BP — the card's own width now drives the narrow/mid regimes
      // (was the sheet stage's, under the old push-panel tray); the
      // stage's own ResizeObserver stays, just for the board's fit.
      const card = document.getElementById('ptBandLightboxCard');
      if (card && window.ResizeObserver) new ResizeObserver(() => syncBandLightboxNarrow()).observe(card);
      const stage = document.querySelector('#painterSheetView .pt-sheet-main');
      if (stage && window.ResizeObserver) {
        new ResizeObserver(() => scheduleFitAllBannerScales()).observe(stage);
      }
    }

    /* Rail nav for the sheet's two sections. Deliberately its own small
       handler rather than a graft onto the shell's updateActiveNav:
       that one is a scroll-spy over brief-boards/table-boards/c4
       sections keyed by tab, and the painter sheet is none of those. */
    function initPainterRailNav() {
      const nav = document.querySelector('.rail-nav-painter');
      const canvasEl = document.getElementById('canvas');
      if (!nav || !canvasEl) return;
      const items = Array.prototype.slice.call(nav.querySelectorAll('li[data-pt-nav]'));
      const sectionFor = (key) => {
        const el2 = document.querySelector('[data-pt-section="' + key + '"]');
        return el2 && !el2.hidden ? el2 : null;
      };
      const setActive = (key) => items.forEach((li) => li.classList.toggle('active', li.dataset.ptNav === key));
      /* NOT offsetTop, which the shell's own nav can use because its
         brief-boards sit directly in #canvas — these sections' offset
         parent is #painterSheetView, which is itself positioned, so
         offsetTop is measured from the sheet rather than the scroller
         and lands the scroll short. Rect deltas are parent-agnostic. */
      const topWithinCanvas = (elm) =>
        elm.getBoundingClientRect().top - canvasEl.getBoundingClientRect().top + canvasEl.scrollTop;
      /* Click sets the highlight and the scroll fires after; the spy
         below would otherwise drag it back through Concept on the way
         down, exactly what programmaticScroll guards against in the
         shell's nav. */
      let navScrollUntil = 0;
      nav.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-pt-nav]');
        if (!li) return;
        const sec = sectionFor(li.dataset.ptNav);
        if (!sec) return;
        setActive(li.dataset.ptNav);
        navScrollUntil = Date.now() + 900;
        canvasEl.scrollTo({ top: Math.max(0, topWithinCanvas(sec) - 24), behavior: envReducedMotion() ? 'auto' : 'smooth' });
      });
      // §BO.2 — Selects retired; Concept is the sheet's only section now,
      // so there is nothing left to spy between — always active.
      setActive('concept');
    }

    function syncRemoveButtons(group) {
      const cards = group.querySelectorAll('.pt-banner-card');
      const onlyOne = cards.length <= 1;
      Array.prototype.forEach.call(group.querySelectorAll('.pt-banner-remove-btn'), (btn) => { btn.disabled = onlyOne; });
    }
    // A group's letter: its data-concept, else the letter badge older
    // markup carried, else A.
    function conceptLetterOf(el) {
      if (!el) return 'A';
      const attr = el.getAttribute && el.getAttribute('data-concept');
      if (attr) return attr;
      const badge = el.querySelector && el.querySelector('.pt-concept-letter');
      return badge ? badge.textContent.trim() : 'A';
    }
    function appendSizesToConcept(letter, sizeIds) {
      // 9/10 (Bryan: "this button doesn't appear to work after you select
      // a size") — the group used to be found by its letter badge, which
      // the row head no longer renders; the group's own data-concept is
      // the key now, the badge a fallback for any older markup.
      const groups = document.querySelectorAll('#ptConcepts .pt-concept-group');
      let target = null;
      Array.prototype.forEach.call(groups, (g) => {
        if (conceptLetterOf(g) === letter) target = g;
      });
      if (!target) return;
      const existingSizes = Array.prototype.map.call(target.querySelectorAll('.pt-banner'), (b) => b.getAttribute('data-size'));
      const sampleBanner = target.querySelector('.pt-banner');
      const layoutId = sampleBanner ? sampleBanner.getAttribute('data-layout') : 'type-top';
      // P9 — appended sizes carry the concept's own colorway/font/
      // custom-color forward too (read straight off an existing card
      // in the group), not just layout/copy/image as before.
      const colorway = sampleBanner ? (sampleBanner.getAttribute('data-colorway') || 'gold-on-dark') : 'gold-on-dark';
      const font = sampleBanner ? (sampleBanner.getAttribute('data-font') || DEFAULT_FONT_ID) : DEFAULT_FONT_ID;
      const customColor = colorway === 'custom' ? readBannerCustomColor(sampleBanner) : null;
      // AA.2 — a guide-locked row's added sizes stay locked too (read
      // straight off the sample banner, same as colorway/font above).
      const guide = sampleBanner ? (sampleBanner.getAttribute('data-guide') || null) : null;
      const img = sampleBanner ? { src: sampleBanner.querySelector('.pt-banner-media img, .pt-banner-media video').getAttribute('src') } : imageForConcept(0);
      const copyPair = sampleBanner
        ? Object.assign(
            { headline: sampleBanner.querySelector('.pt-banner-headline').textContent, cta: sampleBanner.querySelector('.pt-banner-cta').textContent },
            readBannerCopyFields(sampleBanner)
          )
        : copyPairFor(1);
      const addedRows = [];
      sizeIds.forEach((sizeId, i) => {
        if (existingSizes.indexOf(sizeId) !== -1) return;
        const row = ensureShapeRow(target, shapeClassFor(sizeId));
        const wrap = document.createElement('div');
        wrap.innerHTML = bannerCardHTML(sizeId, layoutId, copyPair, img, letter, colorway, font, customColor, guide).trim();
        const cardEl = wrap.firstChild;
        const badge = document.createElement('span');
        badge.className = 'pt-banner-card-new';
        badge.textContent = 'NEW';
        cardEl.querySelector('.pt-banner-frame').appendChild(badge);
        cardEl.classList.add('pt-unit-enter');
        cardEl.querySelector('.pt-banner-frame').style.animationDelay = (i * 70) + 'ms';
        row.appendChild(cardEl);
        if (addedRows.indexOf(row) === -1) addedRows.push(row);
      });
      syncShapeGridClasses(target);
      syncScoreChips(target);
      scheduleFitAllBannerScales();
      syncAddSizesChip(target);
      syncRemoveButtons(target);
      syncConceptGhostTile();
    }
    // "−" on a unit's label row — fades/scales it out (P6's own
    // transform/opacity, 180ms), then drops it from the DOM and tidies
    // up any row/region that's now empty so the grid's column spans
    // stay honest (syncShapeGridClasses).
    function removeSizeFromConcept(cardEl) {
      const group = cardEl.closest('.pt-concept-group');
      if (!group) return;
      if (group.querySelectorAll('.pt-banner-card').length <= 1) return; // never down to zero
      const row = cardEl.closest('.pt-shape-row');
      cardEl.classList.add('is-removing');
      setTimeout(() => {
        cardEl.remove();
        if (row && !row.querySelector('.pt-banner-card')) {
          const region = row.parentElement;
          row.remove();
          if (region && (region.classList.contains('pt-shape-left') || region.classList.contains('pt-shape-right'))) {
            if (!region.querySelector('.pt-banner-card')) region.remove();
          }
        }
        syncShapeGridClasses(group);
        syncScoreChips(group);
        syncAddSizesChip(group);
        syncRemoveButtons(group);
        scheduleFitAllBannerScales();
      }, 190);
    }
    function initShapeGridRemove() {
      const root = document.getElementById('ptConcepts');
      if (!root) return;
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-banner-remove-btn');
        if (!btn || btn.disabled) return;
        e.stopPropagation();
        const cardEl = btn.closest('.pt-banner-card');
        if (cardEl) removeSizeFromConcept(cardEl);
      });
    }

    // finishGenerate: the sheet lands, the ONE chat line posts, then
    // (after a short beat so it can settle) the hat returns to the NEW
    // MEDIA SETTINGS surface — 9/10, Bryan: the default hat after a
    // generate "is bad... it should be the banner ui again." (8/25 had
    // it drop to the default; the old "Media · Coast Road" summary card
    // stays dead.) The Media chip's own dot (CSS, off body.is-painter-
    // resolved) still marks the session from the default hat, and the
    // follow-ups live on the sheet.
    function finishGenerate(conceptCount, message) {
      document.body.classList.remove('is-painter-building');
      hideSheetSkeleton(); // fades out over the landing sheet, whose cards rise into the frames it drew
      if (auxPanel) auxPanel.classList.remove('pt-generating');
      // V2 (PLAN.md §V) — SET_LETTERS_EXT, not the old 4-entry
      // SET_LETTERS: brief.concepts can reach 9, and a Regenerate
      // (regenerateBoard) runs this exact path against whatever the
      // brief currently holds.
      buildConceptSheetDOM(SET_LETTERS_EXT.slice(0, conceptCount || brief.concepts), false, message);
      document.body.classList.add('is-painter-resolved');
      closeMediaMode(); // ACTIVE BRIEF 9/1c — mode surface yields the instant the sheet lands, ahead of exitWizardToDefault's own 500ms settle
      sheetResolved = true;
      flowRunning = false;
      wizardStep = -1;
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) canvasEl.scrollTop = 0;
      scheduleFitAllBannerScales();
      const b = boards[boardCur];
      resolveBuildLine(b
        ? '<button class="pt-msg-board-link" type="button" data-board="' + b.id + '">' + escape(b.name) + '</button> is on the canvas \u2014 ' + b.brief.concepts + (b.brief.concepts === 1 ? ' concept' : ' concepts') + ' at ' + b.brief.boardSize.replace('x', '\u00d7') + '.'
        : 'Done \u2014 the concept sheet is on the canvas.', true);
      setTimeout(settleHatAfterGenerate, 500); // 9/10 — the settings come back, not the default hat
    }

    // ── Ghost "generate more" add-tile (REDESIGN 8/25, round 2) ──
    // Lives IN the concept flow as the last child of #ptConcepts —
    // reads as the next empty concept slot rather than a trailing
    // action row. syncConceptGhostTile() (re)creates/repositions it
    // after every build/append so it always ends up last, and removes
    // it for good once 24+ concept groups exist (V2, PLAN.md §V —
    // raised from 12 alongside brief.concepts' own ceiling of nine a
    // round; see SET_LETTERS_EXT). Not shown in the read-only share
    // view (body.is-painter-shared, see <style>).
    function conceptGhostTileHTML() {
      return (
        '<button class="pt-concept-ghost" type="button" id="ptConceptGhost" aria-label="Generate more concepts">' +
          '<span class="pt-concept-ghost-badge" aria-hidden="true">' + ICONS.plus + '</span>' +
          '<span class="pt-concept-ghost-label">Generate more</span>' +
          '<span class="pt-section-count pt-concept-ghost-sub"></span>' +
        '</button>'
      );
    }
    function syncConceptGhostTile() {
      const container = document.getElementById('ptConcepts');
      if (!container) return;
      const count = container.querySelectorAll('.pt-concept-group').length;
      let tile = document.getElementById('ptConceptGhost');
      if (count >= 24) {
        if (tile) tile.remove();
        return;
      }
      if (!tile) tile = el(conceptGhostTileHTML());
      // AE.2/AE.3 fix — hidden, not just disabled, while a beat is
      // pending: the "Generating…" label duplicated the skeleton's own
      // chat line right above it, and the tile's own 48px margin-top +
      // its own height sat BETWEEN the last real row and
      // #ptSheetSkelFoot (a sibling further down #ptConceptSection),
      // pushing the foot skeleton's cells that same distance below
      // where the appended rows actually land — breaking the ≤4px
      // skeleton-vs-resolved rect match. Hiding it removes both.
      tile.hidden = conceptGhostPending;
      if (!conceptGhostPending) {
        tile.disabled = false;
        // V2 (PLAN.md §V) — the label is live, tracking brief.concepts
        // the moment it changes rather than only after the next build,
        // so the door always says what it is about to do (the same
        // count the Generate chip's own badge shows).
        const nextLetter = SET_LETTERS_EXT[count] || '';
        const perRow = liveBoardVol().variants;
        const label = 'Generate ' + perRow + ' more';
        const sub = 'Concept ' + nextLetter + ' \u00b7 ' + perRow + (perRow === 1 ? ' unit' : ' units');
        tile.querySelector('.pt-concept-ghost-label').textContent = label;
        tile.querySelector('.pt-concept-ghost-sub').textContent = sub;
        tile.setAttribute('aria-label', label + ' \u2014 ' + sub);
      }
      container.appendChild(tile); // (re)pin as the last child every time
    }
    // V2 (PLAN.md §V) — the beat itself (chat line, foot skeleton,
    // landing) moved to appendConceptsWithBeat, shared with the
    // Generate chip's "N more" row; this stays the tile's own guard +
    // door onto it.
    function onConceptGhostClick(tile) {
      if (conceptGhostPending || tile.disabled) return;
      appendConceptsWithBeat();
    }

    // ── V1 (PLAN.md §V) removed the per-concept "+ sizes" chip from
    // the board — addSizesSlotHTML and the delegated chip/row/action
    // handlers that used to live in initConceptSheetFollowUps below
    // are gone. Sizes' own "Board at" now switches the whole board's
    // size live (restampBoardSize, above) instead of one row carrying
    // its own extra sizes at a time. appendSizesToConcept and the two
    // small helpers it still calls stay defined — nothing on the board
    // reaches them any more, but Studio's own size-adding UI
    // (wireStudioSizeDrawer, a different control entirely) shares
    // their .pt-addsizes-row/.pt-chip-check styling, and keeping the
    // function intact means it costs nothing to wire back up if a
    // later workstream wants a per-row door again. ──
    function addSizesRowHTML(sizeMeta) {
      return (
        '<button class="pt-addsizes-row" type="button" data-size="' + sizeMeta.id + '" aria-pressed="false">' +
          '<span class="pt-chip-check" aria-hidden="true"></span>' + sizeMeta.label +
        '</button>'
      );
    }
    function syncAddSizesChip(groupEl) {
      const slot = groupEl && groupEl.querySelector('.pt-addsizes-slot');
      if (!slot) return;
      const chip = slot.querySelector('.pt-addsizes-chip');
      const pop = slot.querySelector('.pt-addsizes-pop');
      const list = slot.querySelector('.pt-addsizes-list');
      const actionBtn = slot.querySelector('.pt-addsizes-action');
      const existing = Array.prototype.map.call(groupEl.querySelectorAll('.pt-banner'), (b) => b.getAttribute('data-size'));
      const missing = SIZES.filter((s) => existing.indexOf(s.id) === -1);
      if (!missing.length) {
        chip.hidden = true;
        pop.classList.remove('is-open');
        pop.setAttribute('aria-hidden', 'true');
        chip.setAttribute('aria-expanded', 'false');
        return;
      }
      chip.hidden = false;
      list.innerHTML = missing.map(addSizesRowHTML).join('');
      actionBtn.disabled = true;
      actionBtn.textContent = 'Add sizes';
    }

    // One delegated listener on #ptConcepts for the "N more concepts"
    // ghost tile. It used to also field every concept's add-sizes
    // chip/popover (see the note above) — that door is gone with the
    // chip itself.
    function initConceptSheetFollowUps() {
      const root = document.getElementById('ptConcepts');
      if (!root) return;
      root.addEventListener('click', (e) => {
        const ghost = e.target.closest('.pt-concept-ghost');
        if (ghost) { onConceptGhostClick(ghost); return; }
      });
    }

    // ═══ P2 — the editor: click any banner on the sheet → a light
    //     overlay (shares #canvas's grid cell — see .pt-editor CSS)
    //     with the banner large on stage, its concept siblings as a
    //     filmstrip, inline contenteditable copy, an image-swap
    //     strip, a layout-cycle control, and the 5 brand colorway
    //     dots. Edits live only in `editorState` (+ paint live on the
    //     stage/filmstrip) until Back commits them onto every size in
    //     `editorGroupEl` — Escape/Back always commit; there's no
    //     discard path in this prototype, matching "edits propagate…
    //     when you go Back" as written. ═══
    // P6 — Studio's Text-drawer font picker (9/1). Brand group first
    // (the two Corvache style-guide faces), then More, loaded via the
    // one Google Fonts <link> in <head>. `weights` drives the "Aa"
    // specimen row (up to 3 — some faces only ship one/two).
    const FONT_LIST = [
      { id: 'montserrat', label: 'Montserrat', sub: 'Brand display', group: 'Brand', family: "'Montserrat', sans-serif", weights: [700, 800] },
      { id: 'fira-code',  label: 'Fira Code',  sub: 'Brand mono',    group: 'Brand', family: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace", weights: [400, 500, 600] },
      { id: 'inter',           label: 'Inter',            sub: '', group: 'More', family: "'Inter', sans-serif", weights: [400, 500, 600] },
      { id: 'space-grotesk',   label: 'Space Grotesk',    sub: '', group: 'More', family: "'Space Grotesk', sans-serif", weights: [400, 500, 700] },
      { id: 'dm-serif',        label: 'DM Serif Display',  sub: '', group: 'More', family: "'DM Serif Display', serif", weights: [400] },
      { id: 'playfair',        label: 'Playfair Display',  sub: '', group: 'More', family: "'Playfair Display', serif", weights: [400, 600, 800] },
      { id: 'bebas-neue',      label: 'Bebas Neue',        sub: '', group: 'More', family: "'Bebas Neue', cursive", weights: [400] },
      { id: 'archivo-black',   label: 'Archivo Black',     sub: '', group: 'More', family: "'Archivo Black', sans-serif", weights: [400] }
    ];
    const DEFAULT_FONT_ID = 'montserrat';
    function fontMeta(id) { return FONT_LIST.filter(f => f.id === id)[0] || FONT_LIST[0]; }

    // AA.2 — ember-on-black, Corvache Precision's own locked look: "sharper
    // geometry, one hot accent, no ornament" per the book — headline/copy
    // stay a neutral white, the ember #DC4C2F lives on the CTA alone (a
    // 1px hairline + text, never a fill), the mark goes white. See the
    // .pt-banner[data-colorway="ember-on-black"] rules below for the
    // real generated look this specimen/dot only ever previews.
    const COLORWAYS = [
      { id: 'gold-on-dark',  label: 'Gold on dark' },
      { id: 'white-on-dark', label: 'White on dark' },
      { id: 'dark-on-gold',  label: 'Dark on gold' },
      { id: 'gold-on-light', label: 'Gold on light' },
      { id: 'dark-on-black', label: 'Dark on black' },
      { id: 'ember-on-black', label: 'Ember on black' }
    ];
    // Each dot is a diagonal split of its own text-color / ground-
    // color so "X on Y" reads at a glance without a label. ember-on-
    // black is the one deliberate exception: the headline is white
    // (indistinguishable from white-on-dark's own dot at this size),
    // so the dot carries the CTA's own ember accent instead — the
    // one colour this colorway is actually built to be recognised by.
    const COLORWAY_DOT = {
      'gold-on-dark':  'linear-gradient(135deg, #C29049 50%, #131517 50%)',
      'white-on-dark': 'linear-gradient(135deg, #FFFFFF 50%, #131517 50%)',
      'dark-on-gold':  'linear-gradient(135deg, #131517 50%, #C29049 50%)',
      'gold-on-light': 'linear-gradient(135deg, #C29049 50%, #F3EEE4 50%)',
      'dark-on-black': 'linear-gradient(135deg, #966C2F 50%, #000000 50%)',
      'ember-on-black': 'linear-gradient(135deg, #DC4C2F 50%, #0B0C0F 50%)'
    };
    const LOGO_FOR_COLORWAY = {
      'gold-on-dark':  'brand/griffin-gold.png',
      'white-on-dark': 'brand/griffin-white.png',
      'dark-on-gold':  'brand/griffin-dark.png',
      'gold-on-light': 'brand/griffin-gold.png',
      'dark-on-black': 'brand/griffin-gold.png',
      'ember-on-black': 'brand/griffin-white.png'
    };
    const GRIFFIN_GOLD = 'brand/griffin-gold.png', GRIFFIN_WHITE = 'brand/griffin-white.png', GRIFFIN_DARK = 'brand/griffin-dark.png';
    // §BT — colorwayLineSub/colorwaySpecimenRowHTML (the named
    // specimen-row recipe the hat's Color menu and the sheet's Color
    // drawer used to share) retired with their last callers: colour
    // comes from the picked style guide only, no swatch UI left.

    // ═══ P9 — Colors: fine-tune. Every color offered is from the
    //     Corvache style guide — never a free hex input (brand lock).
    //     ═══
    const BRAND_SWATCHES = [
      { hex: '#C29049', name: 'Gold' },
      { hex: '#966C2F', name: 'Gold dark' },
      { hex: '#131517', name: 'Ink' },
      { hex: '#000000', name: 'Black' },
      { hex: '#FFFFFF', name: 'White' },
      { hex: '#F4F1EA', name: 'Cream' },
      { hex: '#8A8781', name: 'Stone' },
      { hex: '#2A2D31', name: 'Graphite' }
    ];
    // Seeds for the Fine-tune strips the first time a given named
    // colorway is switched into custom mode — reads off that
    // colorway's own real CSS values (ground/ink/CTA fill) so the
    // starting point always matches what was already on the stage.
    const COLORWAY_COLOR_DEFAULTS = {
      'gold-on-dark':  { ground: '#131517', ink: '#C29049', accent: '#C29049' },
      'white-on-dark': { ground: '#131517', ink: '#FFFFFF', accent: '#FFFFFF' },
      'dark-on-gold':  { ground: '#C29049', ink: '#131517', accent: '#131517' },
      'gold-on-light': { ground: '#F3EEE4', ink: '#C29049', accent: '#131517' },
      'dark-on-black': { ground: '#000000', ink: '#966C2F', accent: '#966C2F' },
      'ember-on-black': { ground: '#0B0C0F', ink: '#FFFFFF', accent: '#DC4C2F' }
    };
    function sameHex(a, b) { return (a || '').toLowerCase() === (b || '').toLowerCase(); }
    function hexToRgbTriplet(hex) {
      const h = (hex || '#000000').replace('#', '');
      const r = parseInt(h.substring(0, 2), 16) || 0, g = parseInt(h.substring(2, 4), 16) || 0, b = parseInt(h.substring(4, 6), 16) || 0;
      return r + ',' + g + ',' + b;
    }
    function srgbToLin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function relLuminance(hex) {
      const h = (hex || '#000000').replace('#', '');
      const r = parseInt(h.substring(0, 2), 16) || 0, g = parseInt(h.substring(2, 4), 16) || 0, b = parseInt(h.substring(4, 6), 16) || 0;
      return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
    }
    function contrastRatio(hexA, hexB) {
      const l1 = relLuminance(hexA), l2 = relLuminance(hexB);
      const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    function contrastLabel(ratio) {
      const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : '';
      return (level ? level + ' ' : '') + ratio.toFixed(1) + ':1';
    }
    // Griffin mark color follows the CHOSEN INK's own luminance — a
    // light ink (white/cream) gets the white mark, a dark ink (ink/
    // black/graphite) gets the dark mark, everything in between (gold
    // family, stone) gets the gold mark — same 3-mark family the 5
    // named colorways already draw from.
    function griffinForInk(hex) {
      const l = relLuminance(hex);
      if (l >= 0.75) return GRIFFIN_WHITE;
      if (l <= 0.25) return GRIFFIN_DARK;
      return GRIFFIN_GOLD;
    }
    // Deterministic "best for this image" pick (agent-voice line atop
    // Recommended) — a pure hash of the picked image + layout, so it
    // never flickers between renders of the same state; falls back to
    // the brand primary (gold-on-dark) when no image is picked yet.
    function recommendedColorwayPick() {
      if (!editorState || !editorState.imageSrc) return COLORWAYS[0];
      const h = ptHash(editorState.imageSrc + '|' + editorState.layoutId);
      return COLORWAYS[h % COLORWAYS.length];
    }
    function defaultCustomColor() {
      const seed = COLORWAY_COLOR_DEFAULTS[editorState.colorway] || COLORWAY_COLOR_DEFAULTS['gold-on-dark'];
      return { ground: seed.ground, ink: seed.ink, accent: seed.accent, tint: 0 };
    }
    // Applies editorState.customColor's 4 values as inline CSS custom
    // properties on one already-rendered .pt-banner node (the stage
    // clone, a filmstrip clone, or a sheet card) — the single seam
    // every custom-colorway surface reads (P9: "stage, sizes bar,
    // propagation, Add to canvas, appended sizes all carry it").
    function applyCustomColorVarsToBanner(bannerEl, cc) {
      if (!bannerEl || !cc) return;
      bannerEl.setAttribute('data-colorway', 'custom');
      bannerEl.style.setProperty('--pt-ground', cc.ground);
      bannerEl.style.setProperty('--pt-ground-rgb', hexToRgbTriplet(cc.ground));
      bannerEl.style.setProperty('--pt-ink', cc.ink);
      bannerEl.style.setProperty('--pt-accent', cc.accent);
      bannerEl.style.setProperty('--pt-tint', String((cc.tint || 0) / 100));
      const logo = bannerEl.querySelector('.pt-banner-logo');
      if (logo) logo.src = griffinForInk(cc.ink);
    }
    function customColorInlineStyleAttr(cc) {
      if (!cc) return '';
      return ' style="--pt-ground:' + cc.ground + ';--pt-ground-rgb:' + hexToRgbTriplet(cc.ground) + ';--pt-ink:' + cc.ink + ';--pt-accent:' + cc.accent + ';--pt-tint:' + ((cc.tint || 0) / 100) + ';"';
    }
    // Reads a banner's OWN inline custom vars back out (appendSizesToConcept
    // clones an existing sheet card's colorway/font — this is the same
    // read-back for a custom colorway so appended sizes carry it too).
    function readBannerCustomColor(bannerEl) {
      if (!bannerEl) return null;
      const s = bannerEl.style;
      const ground = s.getPropertyValue('--pt-ground').trim();
      if (!ground) return null;
      const ink = s.getPropertyValue('--pt-ink').trim() || '#C29049';
      const accent = s.getPropertyValue('--pt-accent').trim() || ground;
      const tint = parseFloat(s.getPropertyValue('--pt-tint')) || 0;
      return { ground: ground, ink: ink, accent: accent, tint: Math.round(tint * 100) };
    }

    let editorState = null;   // { concept, sizeId, layoutId, colorway, headline, cta, imageSrc }
    let editorGroupEl = null; // the .pt-concept-group being edited — read for sibling sizes / row desc
    let editorCardEl = null;  // the ONE card being edited — the commit target on Back
    let editorReturnTo = null; // select card whose size preview to reopen on Back

    // isBlank (Studio's editorState.concept === null — Guided/sheet
    // editorState always carries a real concept letter) drives the
    // P5 "blank banner must tolerate empties" contract: no image =
    // the .pt-img-shimmer ghost (reused verbatim) in the media slot;
    // no headline/cta = quiet in-banner placeholders in the layout's
    // real text position. Guided's own always-populated banners take
    // the exact original path, untouched.
    // AK.2(b) — `stateOverride` (default: the live editorState) lets
    // the Versions rail clone-and-scale a HISTORICAL snapshot's banner
    // without ever touching the live editing state; every existing
    // caller (filmstrip, stage) passes none and is unaffected.
    function buildStageBannerElForSize(sizeId, stateOverride) {
      const st = stateOverride || editorState;
      const el = document.createElement('div');
      el.className = 'pt-banner';
      el.setAttribute('data-size', sizeId);
      el.setAttribute('data-layout', st.layoutId);
      const isCustomColor = st.colorway === 'custom' && st.customColor;
      if (isCustomColor) el.setAttribute('data-colorway', 'custom');
      else if (st.colorway && st.colorway !== 'gold-on-dark') el.setAttribute('data-colorway', st.colorway);
      const isBlank = st.concept === null;
      // §BS — the resting canvas's own "template blanks" (a Style
      // picked, nothing generated yet): a distinct empty look from
      // Studio's isBlank ghost above — a neutral transparency
      // checkerboard for the image slot (the universal "no image"
      // signal) and solid colorway-inked bars for headline/CTA (no
      // placeholder copy) rather than a shimmer + "Add a…" text. Still
      // routed through this one builder (BR.5's own hook: an empty
      // reference set through the same banner engine) so the blank and
      // the real thing are one drawing, never two that can drift.
      const isTemplateBlank = !!st.isTemplateBlank;
      // P5 design-review fix: Studio's blank-banner ghost is a plain
      // matte — the shimmer's OUTER box only (fill/border/radius/
      // breathe), no PT_SHIMMER_INNER_HTML thirds/brackets/sparkle.
      // Scoped to the blank-banner path only; the SIZES-step ghost
      // rows (the Guided Generate beat) keep their inner markup as-is.
      // §BR.5 — the blank slot fills as its own field arrives (an
      // attached image, a deck headline/CTA) instead of waiting for
      // Send: still a template blank in every OTHER field until its
      // own content lands (checker stays a checker until an image
      // does, a bar stays a bar until a line does), so a partial deck
      // (headlines but no CTAs yet, say) previews exactly that —
      // partially filled, not all-or-nothing.
      // Coordinator review, 9/18 (br5-1880x1000-03) — a FILLED slot in a
      // neutral (no guide) blank was still painting through
      // PT_TMPL_NEUTRAL_COLOR's own quiet grey/white trio (built for an
      // abstract BAR, not a real photo or a real line): the diagonal
      // layout's own always-on scrim gradient (--pt-scrim-rgb, reads the
      // custom ground) turned a real image into a white wash, and real
      // headline/CTA/legal text painted in the same pale placeholder ink
      // never meant to be read. Rule (coordinator): a filled slot renders
      // at full fidelity; only a slot still waiting for content keeps the
      // neutral bar/checker look. Scoped to isNeutralBlank (no guide) —
      // a guide's own colorway is already a real, legible one, never
      // this placeholder trim, so a guide-picked blank needs no override
      // here (verified below, not just assumed). Per FIELD, inline,
      // rather than swapping the whole banner's colorway: an unfilled
      // sibling in the same cell (a deck with headlines but no CTAs yet,
      // say) must stay the quiet grey bar untouched, which a whole-
      // banner switch could not guarantee. Dark-on-light — "#131517",
      // this file's own gold-on-dark ground, the same hex used as the
      // scrim fallback throughout this stylesheet — reads crisply
      // against the neutral trio's light ground without having to touch
      // that ground at all.
      const crispFill = isTemplateBlank && !!st.isNeutralBlank;
      // Coordinator follow-up, 9/18 (re-shot br5-*-03) — crisp text
      // alone wasn't enough: the diagonal/full-bleed/card layouts sit
      // copy and the legal line ON TOP of the image (a translucent
      // scrim behind them, fine for a real branded colorway's own ink,
      // never enough once the ink is dark AND the photo behind it is
      // dark too). Marks the banner so the CSS below (21-sheet-b.css)
      // can give the copy box and the disclaimer their own OPAQUE
      // ground — never a scrim — so text/legal never actually overlay
      // image pixels, while the diagonal cut's visible edge (outside
      // the text column) stays a real photo.
      if (crispFill) el.classList.add('pt-tmpl-neutral');
      const CRISP_INK = '#131517', CRISP_RGB = '19,21,23';
      const mediaFilled = crispFill && !!st.imageSrc;
      const mediaWrapStyle = mediaFilled ? ' style="--pt-scrim-rgb:' + CRISP_RGB + '"' : '';
      const mediaHTML = isTemplateBlank
        ? (st.imageSrc
            ? mediaTagHTML(st.imageSrc, null, framingForSize(st.framings, sizeId, st.imageSrc))
            : '<div class="pt-banner-media-shimmer pt-tmpl-checker" aria-hidden="true"></div>')
        : (st.imageSrc
            ? mediaTagHTML(st.imageSrc, null, framingForSize(st.framings, sizeId, st.imageSrc))
            : (isBlank
                ? '<div class="pt-img-shimmer pt-banner-media-shimmer"></div>'
                : '<div class="pt-img-shimmer pt-banner-media-shimmer">' + PT_SHIMMER_INNER_HTML + '</div>'));
      const headlineText = isTemplateBlank ? (st.headline || '') : (st.headline || (isBlank ? 'Add a headline' : ''));
      const ctaText = isTemplateBlank ? (st.cta || '') : (st.cta || (isBlank ? 'Add a call to action' : ''));
      const headlinePh = isTemplateBlank ? (st.headline ? '' : ' pt-tmpl-bar') : (isBlank && !st.headline ? ' is-placeholder' : '');
      const ctaPh = isTemplateBlank ? (st.cta ? '' : ' pt-tmpl-bar') : (isBlank && !st.cta ? ' is-placeholder' : '');
      const headlineInkStyle = (crispFill && st.headline) ? ';--pt-ink:' + CRISP_INK : '';
      const ctaFillStyle = (crispFill && st.cta) ? ' style="--pt-accent:' + CRISP_INK + ';--pt-ground:#F4F4F5"' : '';
      const legalInkStyle = (crispFill && st.disclaimer) ? ' style="--pt-ink:' + CRISP_INK + '"' : '';
      // P6 — font picker: one state, every rendered size. data-font on
      // the banner itself (asserted for state-unity, same convention
      // as data-colorway/data-layout) + inline font-family on the
      // headline span, which is what actually paints it.
      const fontId = st.font || DEFAULT_FONT_ID;
      el.setAttribute('data-font', fontId);
      const fontFamily = fontMeta(fontId).family;
      // §BS (amended) — a neutral (no style picked) template blank
      // carries no logo at all: omitted from the markup outright
      // (rather than hidden by CSS) so the logo's own adjacent-sibling
      // spacing rule never leaves a gap where it used to sit.
      const logoHTML = st.noLogo ? '' : '<img class="pt-banner-logo" src="' + (isCustomColor ? griffinForInk(st.customColor.ink) : (LOGO_FOR_COLORWAY[st.colorway] || 'brand/griffin-gold.png')) + '" alt="">';
      el.innerHTML =
        '<div class="pt-banner-inner">' +
          '<div class="pt-banner-media"' + mediaWrapStyle + '>' + mediaHTML + '</div>' +
          '<div class="pt-banner-copy">' +
            logoHTML +
            '<span class="pt-banner-headline' + headlinePh + '" style="font-family:' + fontFamily + headlineInkStyle + '">' + escape(headlineText) + '</span>' +
            (st.subhead ? '<span class="pt-banner-subhead">' + escape(st.subhead) + '</span>' : '') +
            (st.body ? '<span class="pt-banner-body">' + escape(st.body) + '</span>' : '') +
            '<span class="pt-banner-cta' + ctaPh + '"' + ctaFillStyle + '>' + escape(ctaText) + '</span>' +
          '</div>' +
          /* The slot is part of the template now, so the stage shows it
             even when the unit has no legal line yet — as the same quiet
             dashed placeholder the sheet shows — and in the sheet's
             chosen style, so a pharma scroll box previews as a box. */
          '<span class="pt-banner-disclaimer' + (st.disclaimer ? '' : ' pt-banner-disclaimer--empty') +
            (sheetVariety.legalStyle === 'scroll' ? ' pt-banner-disclaimer--scroll' : '') + '"' + legalInkStyle + '>' +
            escape(st.disclaimer || '') + '</span>' +
        '</div>';
      if (isCustomColor) applyCustomColorVarsToBanner(el, st.customColor);
      applyFramingToBanner(el, framingForSize(st.framings, sizeId, st.imageSrc));
      applyOffsetsToBanner(el, offsetsForSize(st.offsets, sizeId)); // BA.2 — the stage, the film tiles and the version thumbs share this builder
      // Same Fit behavior as the sheet's own units — a placeholder
      // ("Add a headline") is never a real line to shrink.
      if (!isBlank || st.headline) {
        applyHeadlineFit(el.querySelector('.pt-banner-headline'), sizeId, headlineText);
      }
      // §BR.4 — this session's own working size answer (st.lineFit,
      // unit-override-first/shared-second via lineFitScale) paints
      // straight onto the fresh stage clone; every render of the stage
      // (initial open, a filmstrip size switch, an undo/redo swap)
      // goes through this one builder, so this is the single place
      // that needs to know about it.
      ['headline', 'cta', 'disclaimer'].forEach((fieldKey) => {
        const fieldEl = el.querySelector(fieldSelector(fieldKey));
        if (!fieldEl) return;
        const id = fieldKey === 'cta' ? st.ctaId : fieldKey === 'disclaimer' ? st.legalId : st.headlineId;
        const key = ratioKey(sizeId);
        const scale = lineFitScale(fieldKey, st.lineFit || {}, id, key);
        if (scale === 1) fieldEl.style.removeProperty('--pt-fit-scale');
        else fieldEl.style.setProperty('--pt-fit-scale', scale.toFixed(2));
      });
      return el;
    }

    // AK.1 — a REAL zoom, not just auto-fit: studioZoom null = Fit
    // (the original behavior, untouched for the Guided/per-card
    // editor, which never sets studioZoom); a number = a manual
    // multiplier the −/+/⌘=/⌘− controls step from
    // studioLastRenderedScale (whatever was on screen a moment ago,
    // fit or manual — so + always reads as "a bit bigger than this").
    let studioLastRenderedScale = 1;
    const AK_ZOOM_MIN = 0.25, AK_ZOOM_MAX = 4, AK_ZOOM_STEP = 0.1;
    function fitEditorStage(wrapEl, naturalW, naturalH) {
      const stage = document.getElementById('ptEditorStage');
      if (!stage) return;
      const availW = stage.clientWidth - 48;
      const availH = stage.clientHeight - 48;
      const fitScale = (availW > 0 && availH > 0) ? Math.min(1, availW / naturalW, availH / naturalH) : 1;
      const scale = (inStudio && studioZoom !== null) ? studioZoom : fitScale;
      studioLastRenderedScale = scale;
      wrapEl.style.width = naturalW + 'px';
      wrapEl.style.height = naturalH + 'px';
      wrapEl.style.transform = scale !== 1 ? 'scale(' + scale + ')' : '';
      stageMoveSync(); // BA.4 — the move overlay is unscaled: re-seat it on the new rects (and again when the frame's transform transition lands)
      // P6 — the stage's own zoom chip (Studio only; the chip itself
      // is display:none outside .pt-editor-studio, harmless to write
      // to on the Guided path too).
      const zoomEl = document.getElementById('ptEditorZoomChip');
      if (zoomEl) zoomEl.textContent = Math.round(scale * 100) + '%';
      const fitBtn = document.getElementById('ptEditorFitBtn');
      if (fitBtn) fitBtn.classList.toggle('is-active', studioZoom === null);
    }
    function studioRefit() {
      const wrap = document.querySelector('#ptEditorStage .pt-editor-stage-frame');
      if (!wrap || !editorState) return;
      const parts = editorState.sizeId.split('x');
      fitEditorStage(wrap, parseInt(parts[0], 10), parseInt(parts[1], 10));
    }
    function studioZoomBy(delta) {
      if (!inStudio || !editorState) return;
      studioZoom = Math.max(AK_ZOOM_MIN, Math.min(AK_ZOOM_MAX, Math.round((studioLastRenderedScale + delta) * 100) / 100));
      studioRefit();
    }
    function studioZoomToFit() { if (!inStudio) return; studioZoom = null; studioRefit(); }
    function studioZoomTo100() { if (!inStudio) return; studioZoom = 1; studioRefit(); }

    const PT_PLACEHOLDER_TEXT = { headline: 'Add a headline', cta: 'Add a call to action' };
    function wireStageEditableFields(banner) {
      // isBlank mirrors buildStageBannerElForSize's own check — Studio's
      // blank banner allows an intentionally-empty field (reverts to
      // the quiet placeholder on blur); Guided/sheet banners keep the
      // exact original "empty edit reverts to the prior real value"
      // behavior untouched.
      const isBlank = editorState.concept === null;
      const fields = [
        [banner.querySelector('.pt-banner-headline'), 'headline'],
        [banner.querySelector('.pt-banner-cta'), 'cta'],
        [banner.querySelector('.pt-banner-disclaimer'), 'disclaimer'] // AY.3 — the legal line edits in place too
      ];
      fields.forEach((pair) => {
        const el = pair[0], key = pair[1];
        if (!el) return;
        el.setAttribute('contenteditable', 'false');
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (el._ptDragged) { el._ptDragged = false; return; } // BA.3 — a press that MOVED was a drag, never the click-to-edit (the media pan's own _ptDragged idiom)
          if (el.getAttribute('contenteditable') === 'true') return;
          stageMoveClearSelection(); // BA.4 — starting to type clears the move selection
          if (isBlank && el.classList.contains('is-placeholder')) {
            el.textContent = '';
            el.classList.remove('is-placeholder');
          }
          if (key === 'disclaimer') el.classList.remove('pt-banner-disclaimer--empty'); // the dashed empty slot yields to the caret; applyDisclaimerContent restores it on blur
          el.setAttribute('contenteditable', 'true');
          el.focus();
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
          else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation(); // AY.3 — Escape reverts the field only; the document's own Escape (exit Studio) must not hear it
            if (key === 'disclaimer') applyDisclaimerContent(el, editorState.disclaimer);
            else if (isBlank && !editorState[key]) { el.textContent = PT_PLACEHOLDER_TEXT[key]; el.classList.add('is-placeholder'); }
            else el.textContent = editorState[key];
            el.blur();
          }
        });
        // Same counter as the sheet's Body copy popover, live while
        // actually typing — this is the "editor drawer shows the same
        // counter" half of Fit; the sheet list is the other half. The
        // hint line below the stage is the display: it already exists,
        // is unclipped (unlike anything riding the banner's own
        // overflow:hidden box), and isn't rebuilt by a crossfade.
        const hintEl = document.getElementById('ptEditorHint');
        if (hintEl && !hintEl.dataset.defaultText) hintEl.dataset.defaultText = hintEl.textContent;
        if (key === 'headline') {
          const updateFitCount = () => {
            const text = el.textContent.replace(/\s+/g, ' ').trim();
            const limit = bodyLimitForSize(editorState.sizeId);
            applyHeadlineFit(el, editorState.sizeId, text);
            if (hintEl && !inStudio) hintEl.textContent = text.length + ' / ' + limit + ' characters';
          };
          el.addEventListener('focus', updateFitCount);
          el.addEventListener('input', updateFitCount);
        }
        // §BR.3/§BR.4, merged — the quiet reach row under the stage
        // (#ptCopyFitRow, 20-editor-studio-b-framing2.js) always names
        // whichever headline/CTA/legal field the stage last put focus
        // on, the same "always answers for whatever is current" idiom
        // framing's updateFrameReachLine uses for the shape on the
        // stage — copy has no single always-current thing the way a
        // shape does, so focus is what picks it here.
        el.addEventListener('focus', () => {
          if (typeof updateCopyFitUI === 'function') updateCopyFitUI(key);
        });
        el.addEventListener('blur', () => {
          el.setAttribute('contenteditable', 'false');
          const val = el.textContent.replace(/\s+/g, ' ').trim();
          if (key === 'disclaimer') {
            // Legal may be cleared outright (the band's own None does the
            // same); the slot then reads as the quiet dashed placeholder.
            editorState.disclaimer = val;
            applyDisclaimerContent(el, val);
          } else if (isBlank) {
            editorState[key] = val;
            if (val) { el.textContent = val; el.classList.remove('is-placeholder'); }
            else { el.textContent = PT_PLACEHOLDER_TEXT[key]; el.classList.add('is-placeholder'); }
          } else {
            editorState[key] = val || editorState[key];
            el.textContent = editorState[key];
          }
          if (key === 'headline') {
            applyHeadlineFit(el, editorState.sizeId, editorState.headline);
            if (hintEl && hintEl.dataset.defaultText) hintEl.textContent = hintEl.dataset.defaultText;
          }
          const desc = editorGroupEl && editorGroupEl.querySelector('.pt-concept-desc');
          if (desc) desc.innerHTML = escape(LAYOUT_NAME[editorState.layoutId]) + ' · “' + escape(editorState.headline) + '”';
          renderEditorFilmstrip();
          if (isBlank) syncStudioHatRow();
          // §BR.3 — a field only counts as "edited this session" once it
          // has actually been focused/blurred at least once (mirrors
          // BR.2's editorState.framings only ever holding ratios a drag
          // actually touched) — propagateEditsToGroup reads this to
          // decide which roles are its business at Apply/Back, so a
          // field nobody clicked into never gets rewritten into the
          // shared line even though editorState always carries a value
          // for it.
          if (!editorState.copyTouched) editorState.copyTouched = {};
          editorState.copyTouched[key] = true;
          if (typeof updateCopyFitUI === 'function') updateCopyFitUI(key);
          pushStudioHistory(key === 'headline' ? 'Headline' : key === 'disclaimer' ? 'Legal' : 'CTA');
        });
      });
      // AY.3 — "click the part you want to edit": the copy spans keep
      // their own click-to-edit (they stop propagation above); a plain
      // click on the image lands the panel's IMAGE group (a drag is the
      // framing pan — wireStageFramingDrag flags it and it is swallowed
      // here), the logo and the banner's plain ground both land STYLE
      // (§BQ — Style guide and Colorway merged into one group; the
      // 'colorway' group id no longer exists). Studio only.
      banner.addEventListener('click', (e) => {
        if (!inStudio) return;
        const movedPart = e.target.closest(PT_MOVE_SELECTOR);
        if (movedPart && movedPart._ptDragged) { movedPart._ptDragged = false; return; } // BA.3 — a real drag swallows the click it would otherwise have been
        if (e.target.closest('.pt-banner-headline, .pt-banner-cta, .pt-banner-subhead, .pt-banner-body, .pt-banner-disclaimer')) return;
        if (e.target.closest('.pt-banner-logo')) { studioPanelGoTo('style'); return; }
        const media = e.target.closest('.pt-banner-media');
        if (media) {
          if (media._ptDragged) { media._ptDragged = false; return; }
          studioPanelGoTo('image');
          return;
        }
        if (banner._ptDragged) { banner._ptDragged = false; return; } // 9/16 — a pan begun on the copy side is a pan, not a style click
        studioPanelGoTo('style');
      });
    }

    // ═══ BA — Move on the stage (Bryan, 9/15: "there should be the
    //     ability to drag and move text boxes around … and CTA buttons
    //     and logos — it should be beautiful and elegant UI to do
    //     that"). The parts of the stage banner — logo, headline,
    //     subhead, body, CTA, legal — pick up and move; where they land
    //     is editorState.offsets[sizeId][part] in the banner's NATURAL
    //     px (BA.1), painted by the inline --pt-ox/--pt-oy vars the one
    //     `translate` rule in the banner recipe reads (BA.2), so the
    //     film tile, the versions thumb, the card on Apply and every
    //     clone of it carry the move by construction. Studio only.
    //
    //     The chrome (BA.4) — the ring, the "Edit" tag / live readout,
    //     the grip handle and the smart guides — is ONE overlay layer
    //     over the stage, seated from client rects and never a child
    //     of the scaled banner, so every line is a crisp 1px at 25%
    //     and at 400% alike. Two groups of ring + tag + handle: one for
    //     the SELECTED part (solid ring, the offset readout, Reset when
    //     it is off home), one for a HOVERED part that isn't it (the
    //     AY.3 dashed ring, its "Edit" tag, the handle). Nothing eases
    //     into place — chrome lines never animate; the ring's 120ms
    //     colour ease is the most this gets. Undo/redo comes free:
    //     studioSnapshot already serialises editorState. ═══
    const PT_MOVE_SELECTOR = Object.keys(PT_MOVE_PARTS).map((k) => PT_MOVE_PARTS[k]).join(', ');
    const PT_MOVE_LABEL = { logo: 'logo', headline: 'headline', subhead: 'subhead', body: 'body', cta: 'CTA', disclaimer: 'legal' };
    const PT_MOVE_RING_GAP = 4;  // the ring sits 4px outside the part, unscaled (AY.3's own outline-offset)
    const PT_MOVE_DRAG_PX = 4;   // a press that travels more than this (screen px) is a drag, not the click it was
    const PT_MOVE_SNAP_PX = 4;   // a snap target within this (screen px) takes the part
    const PT_MOVE_TAG_H = 16;    // the accent chip's own height (12px line + 2px × 2)
    const PT_MOVE_HANDLE = 14;
    // Real Phosphor "DotsSixVertical" geometry (phosphor-icons/core: six
    // discs at x 92/164, y 60/128/196 on the 256 grid), as circles
    // rather than a hand-traced path.
    const PT_MOVE_GRIP_SVG = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><circle cx="92" cy="60" r="16"/><circle cx="164" cy="60" r="16"/><circle cx="92" cy="128" r="16"/><circle cx="164" cy="128" r="16"/><circle cx="92" cy="196" r="16"/><circle cx="164" cy="196" r="16"/></svg>';
    let stageMove = null;            // the live stage's move state — rebuilt with every renderEditorStage
    let stageMoveNudgeBurst = null;  // { key, index, until } — arrow-key bursts collapse into one history step

    function stageMoveIsTyping() {
      const a = document.activeElement;
      return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.getAttribute('contenteditable') === 'true'));
    }
    function stageMovePartAt(target) {
      if (!stageMove || !target || !target.closest) return null;
      const partEl = target.closest(PT_MOVE_SELECTOR);
      if (!partEl || !stageMove.banner.contains(partEl)) return null;
      const key = Object.keys(PT_MOVE_PARTS).filter((k) => partEl.matches(PT_MOVE_PARTS[k]))[0];
      return key ? { key: key, el: partEl } : null;
    }
    function stageMovePartEl(key) {
      if (!stageMove || !key) return null;
      const partEl = stageMove.banner.querySelector(PT_MOVE_PARTS[key]);
      if (!partEl || getComputedStyle(partEl).display === 'none') return null;
      return partEl;
    }
    function stageMoveOffset(key) {
      const o = editorState && editorState.offsets && editorState.offsets[editorState.sizeId];
      const v = o && o[key];
      return { x: v ? (v.x || 0) : 0, y: v ? (v.y || 0) : 0 };
    }
    function stageMoveSetOffset(key, x, y, partEl) {
      if (!editorState) return;
      x = Math.round(x * 100) / 100; y = Math.round(y * 100) / 100;
      if (!editorState.offsets) editorState.offsets = {};
      const sizeId = editorState.sizeId;
      const m = editorState.offsets[sizeId] || (editorState.offsets[sizeId] = {});
      if (x || y) m[key] = { x: x, y: y };
      else { delete m[key]; if (!Object.keys(m).length) delete editorState.offsets[sizeId]; }
      applyPartOffset(partEl || stageMovePartEl(key), x, y);
    }
    function stageMoveHasSelection() { return !!(stageMove && stageMove.sel); }
    function stageMoveClearSelection() {
      if (!stageMove || !stageMove.sel) return;
      stageMove.sel = null;
      stageMoveRender();
    }
    // BA.1 — a LAYOUT pick clears the active size's offsets (the layout
    // defines the homes; a stale offset on a new layout is wrong); the
    // panel's "Reset positions" clears them by hand. Returns whether
    // there was anything to clear.
    function stageClearOffsetsForActiveSize() {
      if (!editorState) return false;
      const had = !!(editorState.offsets && editorState.offsets[editorState.sizeId]);
      if (editorState.offsets) delete editorState.offsets[editorState.sizeId];
      const banner = document.querySelector('#ptEditorStage .pt-editor-stage-frame-holder:not(.pt-stage-out) .pt-banner');
      if (banner) applyOffsetsToBanner(banner, null);
      if (stageMove) { stageMove.sel = null; stageMoveRender(); }
      return had;
    }
    // The banner's natural size, its RENDERED scale and its safe pad,
    // read off the element itself — never studioLastRenderedScale
    // alone (the film tiles share the builder, and the stage frame's
    // own transform transition may still be mid-flight).
    function stageMoveGeometry(banner) {
      const parts = String(editorState.sizeId).split('x');
      const natW = parseInt(parts[0], 10) || banner.offsetWidth, natH = parseInt(parts[1], 10) || banner.offsetHeight;
      const rect = banner.getBoundingClientRect();
      const scale = (rect.width / natW) || 1;
      let pad = NaN;
      const discl = banner.querySelector('.pt-banner-disclaimer');
      if (discl && getComputedStyle(discl).display !== 'none') pad = parseFloat(getComputedStyle(discl).left); // left: var(--pad), resolved
      if (!isFinite(pad)) { const copy = banner.querySelector('.pt-banner-copy'); if (copy) pad = parseFloat(getComputedStyle(copy).paddingLeft); }
      if (!isFinite(pad)) pad = 8;
      return { natW: natW, natH: natH, rect: rect, scale: scale, pad: pad };
    }
    // Snap targets, natural px: the banner's centre lines, the pad
    // box's four edges, and every OTHER visible part's edges and centres.
    function stageMoveSnapTargets(key, geo) {
      const xs = [geo.natW / 2, geo.pad, geo.natW - geo.pad];
      const ys = [geo.natH / 2, geo.pad, geo.natH - geo.pad];
      Object.keys(PT_MOVE_PARTS).forEach((k) => {
        if (k === key) return;
        const other = stageMovePartEl(k);
        if (!other) return;
        const r = other.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const l = (r.left - geo.rect.left) / geo.scale, t = (r.top - geo.rect.top) / geo.scale;
        const w = r.width / geo.scale, h = r.height / geo.scale;
        xs.push(l, l + w / 2, l + w);
        ys.push(t, t + h / 2, t + h);
      });
      return { xs: xs, ys: ys };
    }
    // The part's leading edge, centre and trailing edge each try the
    // targets; the nearest within tol wins and says where the guide runs.
    function stageMoveSnapAxis(targets, pos, size, tol) {
      let best = null;
      [0, size / 2, size].forEach((off) => {
        targets.forEach((t) => {
          const d = Math.abs(t - (pos + off));
          if (d <= tol && (!best || d < best.d)) best = { d: d, pos: t - off, line: t };
        });
      });
      return best;
    }
    // The part's HOME box in natural px — its rect, less the offset it
    // already carries — which is what the clamp and the snaps reason in.
    function stageMoveHomeBox(partEl, geo, cur) {
      const pr = partEl.getBoundingClientRect();
      return {
        left: (pr.left - geo.rect.left) / geo.scale - cur.x,
        top: (pr.top - geo.rect.top) / geo.scale - cur.y,
        w: pr.width / geo.scale, h: pr.height / geo.scale
      };
    }
    function stageMoveClamp(v, home, geo, axis) { // a part never leaves the banner
      return axis === 'x'
        ? Math.min(Math.max(v, -home.left), geo.natW - home.left - home.w)
        : Math.min(Math.max(v, -home.top), geo.natH - home.top - home.h);
    }
    // BA.3 — a press on a part (its body, or its handle in the overlay).
    // More than 4 screen px of travel makes it a drag: the delta ÷ the
    // banner's rendered scale is the offset in natural px, applied live
    // to the vars; release pushes ONE history step and the film tile
    // follows. A press that never moved stays the click it always was
    // (copy edits in place, the logo lands STYLE GUIDE) — a real drag
    // swallows that click with the media pan's own _ptDragged flag.
    // Every pointer type, through setPointerCapture.
    function stageMoveBeginPress(e, key, partEl, captureEl) {
      if (e.button !== 0 || !editorState || !stageMove || stageMove.drag) return;
      if (partEl.getAttribute('contenteditable') === 'true') return; // a caret placement, never a move
      e.preventDefault(); // no text selection and no native image drag under the press
      captureEl._ptDragged = false;
      partEl._ptDragged = false;
      const geo = stageMoveGeometry(stageMove.banner);
      const base = stageMoveOffset(key);
      const home = stageMoveHomeBox(partEl, geo, base);
      const press = {
        key: key, partEl: partEl, captureEl: captureEl, pointerId: e.pointerId,
        startX: e.clientX, startY: e.clientY, base: base, home: home, geo: geo,
        targets: stageMoveSnapTargets(key, geo), moved: false, gv: null, gh: null
      };
      try { captureEl.setPointerCapture(e.pointerId); } catch (err) {}
      const move = (ev) => {
        if (ev.pointerId !== press.pointerId) return;
        const sx = ev.clientX - press.startX, sy = ev.clientY - press.startY;
        if (!press.moved) {
          if (Math.hypot(sx, sy) <= PT_MOVE_DRAG_PX) return;
          press.moved = true;
          captureEl._ptDragged = true; partEl._ptDragged = true; // the click that follows is swallowed
          stageMove.drag = press; stageMove.sel = key; stageMove.hover = key;
          stageMove.overlay.classList.add('is-dragging');
          stageMove.stage.classList.add('is-moving');
        }
        let x = press.base.x + sx / geo.scale, y = press.base.y + sy / geo.scale;
        press.gv = null; press.gh = null;
        if (!ev.altKey) { // ⌥ held = no snap
          const tol = PT_MOVE_SNAP_PX / geo.scale;
          const bx = stageMoveSnapAxis(press.targets.xs, home.left + x, home.w, tol);
          const by = stageMoveSnapAxis(press.targets.ys, home.top + y, home.h, tol);
          if (bx) { x = bx.pos - home.left; press.gv = bx.line; }
          if (by) { y = by.pos - home.top; press.gh = by.line; }
        }
        x = stageMoveClamp(x, home, geo, 'x');
        y = stageMoveClamp(y, home, geo, 'y');
        stageMoveSetOffset(key, x, y, partEl);
        stageMoveRender();
      };
      const up = (ev) => {
        if (ev.pointerId !== press.pointerId) return;
        captureEl.removeEventListener('pointermove', move);
        captureEl.removeEventListener('pointerup', up);
        captureEl.removeEventListener('pointercancel', up);
        captureEl.removeEventListener('lostpointercapture', up); // a capture the browser lets go of ends the drag too — never a drag left "on" that swallows the next press
        try { captureEl.releasePointerCapture(press.pointerId); } catch (err) {}
        if (stageMove && stageMove.drag === press) {
          stageMove.drag = null;
          stageMove.overlay.classList.remove('is-dragging');
          stageMove.stage.classList.remove('is-moving');
        }
        if (press.moved && editorState) {
          pushStudioHistory('Move ' + PT_MOVE_LABEL[key]); // once per drag
          renderEditorFilmstrip(); // the tile follows
          syncStudioPanel(); // the LAYOUT group's Reset positions link
        }
        if (stageMove) stageMoveRender();
      };
      captureEl.addEventListener('pointermove', move);
      captureEl.addEventListener('pointerup', up);
      captureEl.addEventListener('pointercancel', up);
      captureEl.addEventListener('lostpointercapture', up);
    }
    // BA.4 — arrow keys nudge the selected part 1px (⇧ 10px); a burst
    // within 400ms is ONE history step, labelled once.
    function stageMoveNudge(dx, dy) {
      if (!stageMove || !stageMove.sel || !editorState) return false;
      const key = stageMove.sel;
      const partEl = stageMovePartEl(key);
      if (!partEl) return false;
      const geo = stageMoveGeometry(stageMove.banner);
      const cur = stageMoveOffset(key);
      const home = stageMoveHomeBox(partEl, geo, cur);
      stageMoveSetOffset(key, stageMoveClamp(cur.x + dx, home, geo, 'x'), stageMoveClamp(cur.y + dy, home, geo, 'y'), partEl);
      const now = Date.now();
      const burst = stageMoveNudgeBurst;
      if (burst && burst.key === key && now < burst.until && burst.index === studioHistoryIndex && studioHistory[burst.index]) {
        studioHistory[burst.index] = studioSnapshot(); // the burst's one step, refreshed — never a second label
        syncStudioSaveStatus();
        syncStudioBrandChips();
      } else {
        pushStudioHistory('Move ' + PT_MOVE_LABEL[key]);
      }
      stageMoveNudgeBurst = { key: key, index: studioHistoryIndex, until: now + 400 };
      renderEditorFilmstrip();
      syncStudioPanel();
      stageMoveRender();
      return true;
    }
    // The readout's Reset (and nothing else) — home, as its own step.
    function stageMoveResetPart(key) {
      const partEl = stageMovePartEl(key);
      if (!partEl) return;
      stageMoveSetOffset(key, 0, 0, partEl);
      pushStudioHistory('Reset ' + PT_MOVE_LABEL[key]);
      renderEditorFilmstrip();
      syncStudioPanel();
      stageMoveRender();
    }
    // "x +24 · y −12" — the offset from home, natural px, signed, in the
    // Edit tag's own mono voice; home reads "x 0 · y 0".
    function stageMoveReadout(key) {
      const o = stageMoveOffset(key);
      const fmt = (v) => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
      return 'x ' + fmt(o.x) + ' · y ' + fmt(o.y);
    }
    function stageMoveHideGroup(group) {
      group.ring.hidden = true; group.tag.hidden = true; group.handle.hidden = true;
      group.key = null;
    }
    // Seats one ring + tag + handle group on a part, from client rects,
    // rounded to whole screen px so the 1px lines land on the pixel
    // grid. mode: 'hover' (dashed ring, "Edit" tag on copy parts, the
    // handle) · 'drag' (solid ring, the live readout, the handle) ·
    // 'sel' (solid ring, the readout with Reset when off home, the
    // handle). The tag rides the ring's top-left corner, the handle its
    // top-right — opposite ends, both flush above the ring.
    function stageMoveSeat(group, key, mode) {
      const partEl = stageMovePartEl(key);
      if (!partEl) { stageMoveHideGroup(group); return; }
      const ovr = stageMove.overlay.getBoundingClientRect();
      const r = partEl.getBoundingClientRect();
      const x = Math.round(r.left - ovr.left) - PT_MOVE_RING_GAP, y = Math.round(r.top - ovr.top) - PT_MOVE_RING_GAP;
      const w = Math.round(r.width) + PT_MOVE_RING_GAP * 2, h = Math.round(r.height) + PT_MOVE_RING_GAP * 2;
      group.ring.hidden = false;
      group.ring.style.left = x + 'px'; group.ring.style.top = y + 'px';
      group.ring.style.width = w + 'px'; group.ring.style.height = h + 'px';
      group.ring.classList.toggle('is-solid', mode !== 'hover');
      let tagHTML = null;
      if (mode === 'hover') tagHTML = key === 'logo' ? null : 'Edit'; // the logo has no tag today — the handle alone rides its corner
      else {
        const o = stageMoveOffset(key);
        tagHTML = escape(stageMoveReadout(key)) + ((mode === 'sel' && (o.x || o.y)) ? ' · <button type="button" class="pt-stage-move-reset">Reset</button>' : '');
      }
      if (tagHTML === null) group.tag.hidden = true;
      else {
        group.tag.hidden = false;
        if (group.tag.innerHTML !== tagHTML) group.tag.innerHTML = tagHTML;
        group.tag.style.left = x + 'px'; group.tag.style.top = (y - PT_MOVE_TAG_H) + 'px';
      }
      group.handle.hidden = false;
      let handleLeft = x + w - PT_MOVE_HANDLE;
      if (tagHTML !== null) handleLeft = Math.max(handleLeft, x + group.tag.offsetWidth + 4); // a readout wider than the ring (the logo's, a long nudge) pushes the handle along — never under it
      group.handle.style.left = handleLeft + 'px'; group.handle.style.top = (y - PT_MOVE_HANDLE) + 'px';
      group.key = key;
    }
    // Smart guides (BA.4): 1px accent lines full-width / full-height
    // across the banner where a snap engaged, only while dragging.
    function stageMoveSeatGuides() {
      const d = stageMove.drag;
      const gv = stageMove.guideV, gh = stageMove.guideH;
      if (!d || (d.gv === null && d.gh === null)) { gv.hidden = true; gh.hidden = true; return; }
      const ovr = stageMove.overlay.getBoundingClientRect();
      const br = stageMove.banner.getBoundingClientRect();
      if (d.gv !== null) {
        gv.hidden = false;
        gv.style.left = Math.round(br.left - ovr.left + d.gv * (br.width / d.geo.natW)) + 'px';
        gv.style.top = Math.round(br.top - ovr.top) + 'px';
        gv.style.height = Math.round(br.height) + 'px';
      } else gv.hidden = true;
      if (d.gh !== null) {
        gh.hidden = false;
        gh.style.top = Math.round(br.top - ovr.top + d.gh * (br.height / d.geo.natH)) + 'px';
        gh.style.left = Math.round(br.left - ovr.left) + 'px';
        gh.style.width = Math.round(br.width) + 'px';
      } else gh.hidden = true;
    }
    function stageMoveRender() {
      if (!stageMove || !stageMove.overlay.isConnected) return;
      const sm = stageMove;
      const dragKey = sm.drag ? sm.drag.key : null;
      const selKey = dragKey || sm.sel;
      if (selKey) stageMoveSeat(sm.selGroup, selKey, dragKey ? 'drag' : 'sel');
      else stageMoveHideGroup(sm.selGroup);
      const hoverKey = (!dragKey && sm.hover && sm.hover !== selKey) ? sm.hover : null;
      if (hoverKey) stageMoveSeat(sm.hoverGroup, hoverKey, 'hover');
      else stageMoveHideGroup(sm.hoverGroup);
      stageMoveSeatGuides();
      sm.overlay.classList.toggle('is-selected', !!sm.sel && !dragKey);
    }
    // Every zoom / fit / resize re-seats the chrome (fitEditorStage).
    function stageMoveSync() { if (stageMove) stageMoveRender(); }
    // Hover stays while the pointer is anywhere inside a shown group's
    // ring or the chrome band above it (the tag and handle live there,
    // outside the part's own box — a pointer on its way to the handle
    // must not lose the ring halfway).
    function stageMoveInsideChrome(group, cx, cy) {
      if (group.ring.hidden) return false;
      const r = group.ring.getBoundingClientRect();
      return cx >= r.left - 2 && cx <= r.right + 2 && cy >= r.top - PT_MOVE_TAG_H - 2 && cy <= r.bottom + 2;
    }
    function stageMoveGroupEl(overlay, role) {
      const ring = el('<div class="pt-stage-move-ring pt-stage-move-ring--' + role + '" hidden></div>');
      const tag = el('<div class="pt-stage-move-tag" hidden></div>');
      const handle = el('<div class="pt-stage-move-handle" hidden>' + PT_MOVE_GRIP_SVG + '</div>');
      overlay.appendChild(ring); overlay.appendChild(tag); overlay.appendChild(handle);
      return { ring: ring, tag: tag, handle: handle, key: null };
    }
    // BA.5 — the stage wiring, called from renderEditorStage beside
    // wireStageEditableFields / wireStageFramingDrag. Studio only: any
    // other stage gets no overlay, no handle, no ring.
    function wireStageMoveParts(banner) {
      stageMove = null;
      if (!inStudio || !editorState || !banner) return;
      const stage = document.getElementById('ptEditorStage');
      if (!stage) return;
      const old = stage.querySelector('.pt-stage-move-overlay');
      if (old) old.remove(); // one overlay per render — the crossfade's outgoing holder keeps none
      const overlay = el('<div class="pt-stage-move-overlay" aria-hidden="true"></div>');
      const guideV = el('<div class="pt-stage-move-guide pt-stage-move-guide--v" hidden></div>');
      const guideH = el('<div class="pt-stage-move-guide pt-stage-move-guide--h" hidden></div>');
      overlay.appendChild(guideV); overlay.appendChild(guideH);
      const hoverGroup = stageMoveGroupEl(overlay, 'hover');
      const selGroup = stageMoveGroupEl(overlay, 'sel');
      stage.appendChild(overlay);
      stageMove = { stage: stage, banner: banner, overlay: overlay, guideV: guideV, guideH: guideH, hoverGroup: hoverGroup, selGroup: selGroup, hover: null, sel: null, drag: null };
      const logo = banner.querySelector('.pt-banner-logo');
      if (logo) logo.draggable = false; // an <img> would otherwise start a native drag under the press
      banner.addEventListener('pointerdown', (e) => {
        const p = stageMovePartAt(e.target);
        if (p) stageMoveBeginPress(e, p.key, p.el, p.el);
      });
      [hoverGroup, selGroup].forEach((g) => {
        g.handle.addEventListener('pointerdown', (e) => {
          const partEl = g.key && stageMovePartEl(g.key);
          if (partEl) stageMoveBeginPress(e, g.key, partEl, g.handle);
        });
        g.handle.addEventListener('click', (e) => { // a click on the handle selects the part; a drag's click is swallowed
          e.stopPropagation();
          if (g.handle._ptDragged) { g.handle._ptDragged = false; return; }
          if (stageMove && g.key) { stageMove.sel = g.key; stageMoveRender(); }
        });
        g.tag.addEventListener('click', (e) => {
          if (!e.target.closest('.pt-stage-move-reset')) return;
          e.stopPropagation();
          if (stageMove && g.key) stageMoveResetPart(g.key);
        });
      });
      const frame = banner.closest('.pt-editor-stage-frame');
      if (frame) frame.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') stageMoveSync(); }); // the fit-scale glides 220ms; re-seat once it lands
      if (stage._ptMoveWired) return;
      stage._ptMoveWired = true;
      // The stage's own once-only hooks (the stage element outlives every render).
      stage.addEventListener('pointermove', (e) => {
        if (!stageMove || stageMove.drag) return;
        const p = stageMovePartAt(e.target);
        let next = p ? p.key : null;
        if (!next && stageMove.hover) {
          const g = stageMove.hover === stageMove.sel ? stageMove.selGroup : stageMove.hoverGroup;
          if (g.key === stageMove.hover && stageMoveInsideChrome(g, e.clientX, e.clientY)) next = stageMove.hover;
        }
        if (next !== stageMove.hover) { stageMove.hover = next; stageMoveRender(); }
        else if (next) stageMoveRender(); // keeps the ring seated on the rect
      });
      stage.addEventListener('pointerleave', () => {
        if (stageMove && !stageMove.drag && stageMove.hover) { stageMove.hover = null; stageMoveRender(); }
      });
      stage.addEventListener('pointerdown', (e) => { // a press elsewhere on the stage clears the selection
        if (!stageMove || !stageMove.sel) return;
        if (e.target.closest('.pt-stage-move-handle, .pt-stage-move-tag')) return;
        if (stageMovePartAt(e.target)) return;
        stageMove.sel = null; stageMoveRender();
      });
      // Escape clears the selection — heard here in the capture phase,
      // before Studio's own document Escape (exit) can; skipped while a
      // text field is being typed into (the AY keyboard guard) or a
      // popover is up (its own Escape).
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !inStudio || !stageMove || !stageMove.sel || stageMoveIsTyping()) return;
        if (typeof setOpenMenu !== 'undefined' && setOpenMenu) return;
        e.preventDefault(); e.stopPropagation();
        stageMove.sel = null; stageMoveRender();
      }, true);
    }

    // P10 — pass crossfade:true from a SIZE-change caller only (the
    // sizes bar / Size drawer chip pick) — every other caller (a
    // live text/colorway/font edit, undo/redo, initial open) repaints
    // instantly, matching the spec's "stage banner size change =
    // crossfade" scope exactly.
    function renderEditorStage(crossfade) {
      const stage = document.getElementById('ptEditorStage');
      if (!stage || !editorState) return;
      // AK.1/AK.6 — the topbar lockup's mono size readout + the
      // Brand/Legal status chips, both live off the state this exact
      // render just committed to the stage.
      const metaSizeEl = document.getElementById('ptEditorMetaSize');
      if (metaSizeEl) metaSizeEl.textContent = sizeDisplayLabel(editorState.sizeId);
      syncStudioBrandChips();
      const oldHolder = stage.querySelector('.pt-editor-stage-frame-holder');
      const doCrossfade = !!(crossfade && oldHolder && !envReducedMotion());
      const holder = document.createElement('div');
      holder.className = 'pt-editor-stage-frame-holder' + (doCrossfade ? ' pt-stage-entering' : '');
      const wrap = document.createElement('div');
      wrap.className = 'pt-editor-stage-frame';
      const banner = buildStageBannerElForSize(editorState.sizeId);
      wrap.appendChild(banner);
      holder.appendChild(wrap);
      if (doCrossfade) {
        stage.appendChild(holder);
        oldHolder.classList.add('pt-stage-out');
        void holder.offsetHeight;
        requestAnimationFrame(() => holder.classList.remove('pt-stage-entering'));
        setTimeout(() => { if (oldHolder.parentNode) oldHolder.parentNode.removeChild(oldHolder); }, 240);
      } else {
        stage.innerHTML = '';
        stage.appendChild(holder);
      }
      const parts = editorState.sizeId.split('x');
      fitEditorStage(wrap, parseInt(parts[0], 10), parseInt(parts[1], 10));
      wireStageEditableFields(banner);
      wireStageFramingDrag(banner);
      wireStageMoveParts(banner); // BA — the parts pick up and move (Studio only; it gates itself)
      if (inStudio) syncStudioHatRow();
      // §BR.4 — a size switch changes the ratio the size control and its
      // reach line answer for (they're keyed by fitKey(field, ratio)),
      // even though which FIELD is current hasn't changed — re-sync
      // without touching copyReachRole.
      if (typeof updateCopyFitUI === 'function') updateCopyFitUI();
    }

    function renderEditorFilmstrip() {
      const strip = document.getElementById('ptEditorFilmstrip');
      if (!strip || !editorState) return;
      // AM.7 — unit mode's filmstrip shows this unit's VERSIONS, never
      // sizes; kept as its own function below so Studio-from-the-hat's
      // "+ Add a size" (everything from here down) stays untouched.
      if (studioUnitMode) { renderEditorFilmstripUnitMode(strip); return; }
      // Guided/sheet edits read the group's own banners; Studio (no
      // group yet — the banner hasn't landed on the canvas) reads its
      // own pre-canvas filmstrip list instead (grown by "+ Add a size").
      const sizeIds = editorGroupEl
        ? Array.prototype.map.call(editorGroupEl.querySelectorAll('.pt-banner'), b => b.getAttribute('data-size'))
        : studioFilmSizeIds.slice();
      // P10 — FLIP the ONE moving bottom-accent: read its prior
      // transform/width before the rebuild wipes it, then re-apply
      // that as the "from" state on the fresh element so the CSS
      // transition still has two frames to animate between.
      const prevAccent = document.getElementById('ptFilmAccent');
      const prevTransform = prevAccent ? prevAccent.style.transform : null;
      const prevWidth = prevAccent ? prevAccent.style.width : null;
      strip.innerHTML = '';
      sizeIds.forEach((sizeId) => {
        const sizeMeta = SIZES.filter(s => s.id === sizeId)[0];
        const parts = sizeId.split('x');
        const naturalW = parseInt(parts[0], 10), naturalH = parseInt(parts[1], 10);
        const maxW = 96, maxH = 56; // AY.4 — each frame wears its own size: fitted to the strip's 56px height, 96px max width
        const s = Math.min(maxW / naturalW, maxH / naturalH, 1);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'pt-editor-film-item' + (sizeId === editorState.sizeId ? ' is-active' : '');
        const frame = document.createElement('span');
        frame.className = 'pt-editor-film-frame';
        frame.style.width = Math.round(naturalW * s) + 'px';
        frame.style.height = Math.round(naturalH * s) + 'px';
        const clone = buildStageBannerElForSize(sizeId);
        clone.style.width = naturalW + 'px';
        clone.style.height = naturalH + 'px';
        clone.style.transform = 'scale(' + s + ')';
        clone.style.transformOrigin = 'top left';
        frame.appendChild(clone);
        const label = document.createElement('span');
        label.className = 'pt-editor-film-label';
        label.textContent = sizeMeta ? sizeMeta.label : sizeId;
        item.appendChild(frame);
        item.appendChild(label);
        item.addEventListener('click', () => {
          if (sizeId === editorState.sizeId) return;
          editorState.sizeId = sizeId;
          renderEditorStage(true);
          renderEditorFilmstrip();
          pushStudioHistory('Size');
        });
        strip.appendChild(item);
      });
      // P6 — sizes bar "+": a second, faster path to "add a size"
      // alongside the Size drawer's own dashed row. Adds the next
      // SIZES-order size not already on the bar; hidden once every
      // size is present.
      if (inStudio) {
        const missing = SIZES.filter(s => sizeIds.indexOf(s.id) === -1);
        if (missing.length) {
          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'pt-editor-film-add';
          addBtn.setAttribute('aria-label', 'Add a size');
          addBtn.title = 'Add a size';
          addBtn.innerHTML = ICONS.plus;
          addBtn.addEventListener('click', () => handleStudioAddSize(missing[0].id));
          strip.appendChild(addBtn);
        }
      }
      // P10 — ONE moving bottom-accent slides to the active card
      // (transform 220ms) instead of each card painting its own
      // pseudo-element. P10b fix: the FLIP "from" paint below is only
      // ever a stopgap so the very next frame has something to animate
      // AWAY from — the authoritative target rect is always read later
      // by scheduleFilmAccentSettle()/moveFilmAccent(), never trusted
      // here at render time. Render-time measurement was the actual
      // bug: it ran BEFORE webfonts (Fira Code sizes the label, which
      // sizes the card) had necessarily loaded, and (before AY's one
      // panel) BEFORE the drawer that opened right after openStudio()
      // had finished its own 220ms width transition — both silently
      // resize the stage column the cards live in, stranding the
      // accent under stale coordinates (Fable's P10 review: accent at
      // ~x1370-1460 while the selected card had already settled at
      // ~x1230-1310).
      if (inStudio) {
        const accent = document.createElement('span');
        accent.className = 'pt-editor-film-accent';
        accent.id = 'ptFilmAccent';
        strip.appendChild(accent);
        if (prevTransform && !envReducedMotion()) {
          accent.style.transition = 'none';
          accent.style.transform = prevTransform;
          accent.style.width = prevWidth || '0px';
          accent.classList.add('is-visible');
          void accent.offsetHeight;
          accent.style.transition = '';
        }
        scheduleFilmAccentSettle();
      }
    }

    // AM.7 — one tile per VERSION of this unit (studioUnitArtboards,
    // parent first), all at the unit's one fixed size (that lives in
    // the topbar lockup, never repeated per tile the way a size label
    // would be) — a tile's label reads the version's own id ("A2",
    // "A2.1", …) and the trailing "+" reads NEW VERSION
    // (handleStudioAddVersion) instead of "Add a size". Same FLIP-
    // accent technique as renderEditorFilmstrip above, copied rather
    // than threaded through it so Studio-from-the-hat's own filmstrip
    // is untouched by this.
    function renderEditorFilmstripUnitMode(strip) {
      if (!studioUnitArtboards || !studioUnitArtboards.length) return;
      const prevAccent = document.getElementById('ptFilmAccent');
      const prevTransform = prevAccent ? prevAccent.style.transform : null;
      const prevWidth = prevAccent ? prevAccent.style.width : null;
      strip.innerHTML = '';
      studioUnitArtboards.forEach((a) => {
        // The active artboard's own state lives in the live globals
        // (mid-edit, ahead of whatever studioUnitArtboards still holds
        // for it until the next capture) — every other tile reads its
        // own stored state straight off the list.
        const stateForTile = a.id === studioUnitActiveId ? editorState : a.state;
        // AY.4 — each frame wears its own artboard's size: fitted to
        // the strip's 56px height, 96px max width.
        const sizeId = stateForTile.sizeId;
        const parts = sizeId.split('x');
        const naturalW = parseInt(parts[0], 10), naturalH = parseInt(parts[1], 10);
        const maxW = 96, maxH = 56;
        const s = Math.min(maxW / naturalW, maxH / naturalH, 1);
        // BB.1(a) — the tile is a div[role=button] (not a <button>): a
        // VERSION tile carries its own hover "×" — a real button, the
        // Selects strip's .pt-strip-frame-remove recipe — inside it, and
        // buttons never nest. Enter/Space keep it a button to the
        // keyboard; ⌫/Delete on a focused version tile deletes it. The
        // parent's tile has no × (A1 is the unit itself).
        const isVersion = a.id !== studioUnitArtboards[0].id;
        const item = document.createElement('div');
        item.className = 'pt-editor-film-item' + (a.id === studioUnitActiveId ? ' is-active' : '');
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', a.id);
        if (a.id === studioUnitActiveId) item.setAttribute('aria-current', 'true');
        const frame = document.createElement('span');
        frame.className = 'pt-editor-film-frame';
        frame.style.width = Math.round(naturalW * s) + 'px';
        frame.style.height = Math.round(naturalH * s) + 'px';
        const clone = buildStageBannerElForSize(sizeId, stateForTile);
        clone.style.width = naturalW + 'px';
        clone.style.height = naturalH + 'px';
        clone.style.transform = 'scale(' + s + ')';
        clone.style.transformOrigin = 'top left';
        frame.appendChild(clone);
        const label = document.createElement('span');
        label.className = 'pt-editor-film-label';
        label.textContent = a.id;
        item.appendChild(frame);
        item.appendChild(label);
        if (isVersion) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'pt-select-btn pt-select-btn--remove pt-strip-frame-remove pt-editor-film-remove';
          remove.setAttribute('aria-label', 'Delete ' + a.id);
          remove.title = 'Delete ' + a.id;
          remove.innerHTML = ICONS.x;
          remove.addEventListener('click', (e) => { e.stopPropagation(); studioDeleteUnitVersion(a.id); });
          item.appendChild(remove);
        }
        item.addEventListener('click', (e) => { if (e.target.closest('.pt-editor-film-remove')) return; switchStudioUnitVersion(a.id); });
        item.addEventListener('keydown', (e) => {
          if (e.target !== item) return; // the ×'s own keys (Enter/Space on it) are its click
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchStudioUnitVersion(a.id); }
          else if ((e.key === 'Backspace' || e.key === 'Delete') && isVersion) { e.preventDefault(); studioDeleteUnitVersion(a.id, { focusStrip: true }); }
        });
        strip.appendChild(item);
      });
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'pt-editor-film-add';
      const nextId = nextStudioVersionId();
      addBtn.setAttribute('aria-label', 'New version · ' + nextId);
      addBtn.title = 'New version · ' + nextId;
      addBtn.innerHTML = ICONS.plus;
      addBtn.addEventListener('click', () => handleStudioAddVersion());
      strip.appendChild(addBtn);
      if (inStudio) {
        const accent = document.createElement('span');
        accent.className = 'pt-editor-film-accent';
        accent.id = 'ptFilmAccent';
        strip.appendChild(accent);
        if (prevTransform && !envReducedMotion()) {
          accent.style.transition = 'none';
          accent.style.transform = prevTransform;
          accent.style.width = prevWidth || '0px';
          accent.classList.add('is-visible');
          void accent.offsetHeight;
          accent.style.transition = '';
        }
        scheduleFilmAccentSettle();
      }
    }

    // P10b — moves the ONE film-accent element to the currently
    // active size card's REAL measured rect. Split out of
    // renderEditorFilmstrip() so it can be re-run any time the stage
    // column's width may have changed out from under an already-
    // painted strip (drawer open/close, window resize) instead of
    // only once at paint time. `instant` skips the CSS transition
    // (snap, no animation) — used for resize and post-settle
    // re-measures, where an animated slide would read as a spurious
    // second motion on top of whatever already moved the layout.
    function moveFilmAccent(instant) {
      const strip = document.getElementById('ptEditorFilmstrip');
      const accent = document.getElementById('ptFilmAccent');
      if (!strip || !accent) return;
      const activeItem = strip.querySelector('.pt-editor-film-item.is-active');
      if (!activeItem) { accent.classList.remove('is-visible'); return; }
      const targetTransform = 'translateX(' + activeItem.offsetLeft + 'px)';
      const targetWidth = activeItem.offsetWidth + 'px';
      if (instant || envReducedMotion()) {
        accent.style.transition = 'none';
        accent.style.transform = targetTransform;
        accent.style.width = targetWidth;
        accent.classList.add('is-visible');
        void accent.offsetHeight;
        accent.style.transition = '';
      } else {
        accent.style.transform = targetTransform;
        accent.style.width = targetWidth;
        accent.classList.add('is-visible');
      }
    }
    // P10b — a double rAF lets THIS paint actually commit before the
    // first re-measure (one rAF alone can still land inside the same
    // layout pass on some engines); the document.fonts.ready follow-up
    // catches Fira Code arriving late and silently changing the size
    // label's — and so the card's — width after that.
    function scheduleFilmAccentSettle() {
      requestAnimationFrame(() => requestAnimationFrame(() => moveFilmAccent(false)));
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => moveFilmAccent(true));
      }
    }

    // P9 — clears the 4 inline custom-color vars a prior "custom" pick
    // may have left on a banner node, so a plain named colorway never
    // shows a stale fine-tune override underneath it.
    const CUSTOM_COLOR_VARS = ['--pt-ground', '--pt-ground-rgb', '--pt-ink', '--pt-accent', '--pt-tint'];
    function clearCustomColorVars(bannerEl) {
      if (!bannerEl) return;
      CUSTOM_COLOR_VARS.forEach((v) => bannerEl.style.removeProperty(v));
    }
    function applyLiveColorwayToStage() {
      const banner = document.querySelector('#ptEditorStage .pt-banner');
      if (!banner) return;
      clearCustomColorVars(banner);
      if (editorState.colorway !== 'gold-on-dark') banner.setAttribute('data-colorway', editorState.colorway);
      else banner.removeAttribute('data-colorway');
      const logo = banner.querySelector('.pt-banner-logo');
      if (logo) logo.src = LOGO_FOR_COLORWAY[editorState.colorway] || 'brand/griffin-gold.png';
    }

    function crossfadeStageImage(src) {
      const media = document.querySelector('#ptEditorStage .pt-banner-media');
      if (!media) return;
      // Studio's blank banner carries a .pt-img-shimmer ghost in the
      // media slot instead of an img/video (no picture yet) — the
      // first real pick crossfades it out exactly like an old
      // img/video would be.
      const oldEl = media.querySelector('img, video, .pt-img-shimmer');
      const isVideo = isVideoSrc(src);
      const newEl = document.createElement(isVideo ? 'video' : 'img');
      if (isVideo) {
        newEl.muted = true;
        newEl.loop = true;
        newEl.autoplay = true;
        newEl.playsInline = true;
        newEl.setAttribute('disablepictureinpicture', '');
      } else {
        newEl.alt = '';
      }
      /* The incoming element was being built bare, which dropped the
         object-position on every swap — the crop jumped to dead centre
         until the next full stage repaint. It inherits the framing
         now, focal included. */
      const fr = editorState
        ? framingForSize(editorState.framings, editorState.sizeId, src)
        : defaultFraming(src);
      applyFramingToMediaEl(newEl, fr);
      newEl.style.position = 'absolute';
      newEl.style.inset = '0';
      newEl.style.opacity = '0';
      newEl.style.transition = 'opacity 320ms cubic-bezier(0.22,1,0.36,1)';
      newEl.src = src;
      media.appendChild(newEl);
      // setTimeout, not requestAnimationFrame — rAF gets suspended
      // while this shell's preview pane is treated as hidden (see
      // the sheet's own fit-scale fix above), which would silently
      // strand the crossfade at opacity:0 mid-verification.
      setTimeout(() => { newEl.style.opacity = '1'; }, 20);
      setTimeout(() => {
        if (oldEl && oldEl.parentNode) oldEl.parentNode.removeChild(oldEl);
        newEl.style.position = '';
        newEl.style.inset = '';
      }, 360);
      /* Off the NEW element directly, never a re-query — a bare
         `#ptEditorStage .pt-banner-media img` would risk finding oldEl
         until its own removal timeout above fires. Naturally covers
         the not-yet-loaded case too, since load/loadedmetadata just
         re-runs it once the picture's real dimensions are in. */
      const recheckHint = () => setFramingHintVisible(framingIsDraggable(media, newEl, fr));
      recheckHint();
      newEl.addEventListener('load', recheckHint, { once: true });
      newEl.addEventListener('loadedmetadata', recheckHint, { once: true });
    }

