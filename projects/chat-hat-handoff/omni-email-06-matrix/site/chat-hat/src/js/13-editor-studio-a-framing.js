    /* ═══ IMAGE FRAMING — {x, y, s}: the centrepoint as a percentage
       pair and a scale multiplier. Two properties carry it, and they
       are driven by the SAME centrepoint on purpose:

         object-position: x% y%   — slides the cover crop within the
                                    frame; this is the pan.
         transform-origin: x% y%  — the point scale() holds still, so
         transform: scale(s)         zooming pulls in on whatever the
                                    centrepoint is sitting on, rather
                                    than always on the middle.

       Because the origin rides along, a scaled image still fills the
       frame at every centrepoint — origin at 0% pins the left edge and
       grows rightward, at 100% the reverse — so there is no value of
       x/y/s at or above 1 that can expose the banner ground behind it.

       BELOW 1 the picture stops covering, and that is now a position
       the user can ask for: the photograph insets and the banner's own
       ground shows around it, which is a composition rather than a
       fault. The origin STOPS riding along there and pins to the
       centre, for two reasons — a shrinking image should settle in the
       middle of its frame instead of jamming into whichever corner the
       centrepoint names, and below 1 the origin's contribution runs
       OPPOSITE to object-position's, so letting both move would make a
       drag fight itself and invert. Under 1 the centrepoint is pure
       object-position; at and above 1 it is both.

       Defaults are {focal.x, focal.y, 1}, which emits exactly the
       object-position the gallery focal always emitted and no
       transform at all — an unedited banner is byte-identical to
       before framing existed. ═══ */
    const PT_FRAME_MIN_SCALE = 0.5;
    const PT_FRAME_MAX_SCALE = 2.5;
    function ratioForSizeId(id) {
      const parts = String(id || '').split('x');
      const w = parseInt(parts[0], 10), h = parseInt(parts[1], 10);
      return (w && h) ? w / h : null;
    }
    /* A crop belongs to a SHAPE, not to a size: 300x250 and 336x280 are
       the same picture problem and 728x90 is a different one, so the
       framings map is keyed by ratio and every size sharing a ratio
       shares its answer. */
    function ratioKey(sizeId) {
      const r = ratioForSizeId(sizeId);
      return r === null ? '' : r.toFixed(4);
    }
    // §BR.2 — the reach line's "6:5" (a human shape name, not the
    // toFixed(4) storage key): reduce the size's own w×h to lowest
    // terms. Purely cosmetic — never used as a map key.
    function gcdInt(a, b) {
      a = Math.abs(a); b = Math.abs(b);
      while (b) { const t = b; b = a % b; a = t; }
      return a || 1;
    }
    function ratioLabelForSizeId(sizeId) {
      const parts = String(sizeId || '').split('x');
      const w = parseInt(parts[0], 10), h = parseInt(parts[1], 10);
      if (!w || !h) return '';
      const g = gcdInt(w, h);
      return (w / g) + ':' + (h / g);
    }
    function defaultFraming(src) {
      const f = focalForSrc(src);
      return { x: f.x, y: f.y, s: 1 };
    }
    function clampFraming(fr) {
      return {
        x: Math.max(0, Math.min(100, Math.round((fr.x || 0) * 10) / 10)),
        y: Math.max(0, Math.min(100, Math.round((fr.y || 0) * 10) / 10)),
        s: Math.max(PT_FRAME_MIN_SCALE, Math.min(PT_FRAME_MAX_SCALE, Math.round((fr.s || 1) * 100) / 100))
      };
    }
    // Above 1 the origin is the centrepoint (zoom pulls in on it, and
    // the frame stays covered); below 1 it pins to the middle — see the
    // block comment above.
    function framingOrigin(fr) {
      return fr.s > 1 ? fr.x + '% ' + fr.y + '%' : '50% 50%';
    }
    function framingStyleCSS(fr) {
      let css = 'object-position:' + fr.x + '% ' + fr.y + '%';
      if (fr.s !== 1) css += ';transform-origin:' + framingOrigin(fr) + ';transform:scale(' + fr.s + ')';
      return css;
    }
    function applyFramingToMediaEl(el, fr) {
      if (!el) return;
      el.style.objectPosition = fr.x + '% ' + fr.y + '%';
      el.style.transformOrigin = fr.s !== 1 ? framingOrigin(fr) : '';
      el.style.transform = fr.s !== 1 ? 'scale(' + fr.s + ')' : '';
    }
    /* The triple lives on the .pt-banner, not on the img — the media
       slot gets replaced wholesale on every image swap and every
       propagate, and a framing that only existed on the img would be
       thrown away by each of them. */
    function applyFramingToBanner(banner, fr) {
      if (!banner) return;
      banner.setAttribute('data-img-x', fr.x);
      banner.setAttribute('data-img-y', fr.y);
      banner.setAttribute('data-img-s', fr.s);
      applyFramingToMediaEl(banner.querySelector('.pt-banner-media img, .pt-banner-media video'), fr);
    }
    function readBannerFraming(banner) {
      const media = banner && banner.querySelector('.pt-banner-media img, .pt-banner-media video');
      const base = defaultFraming(media ? media.getAttribute('src') : '');
      if (!banner) return base;
      const x = parseFloat(banner.getAttribute('data-img-x'));
      const y = parseFloat(banner.getAttribute('data-img-y'));
      const sc = parseFloat(banner.getAttribute('data-img-s'));
      return clampFraming({
        x: isFinite(x) ? x : base.x,
        y: isFinite(y) ? y : base.y,
        s: isFinite(sc) ? sc : base.s
      });
    }
    /* ═══ FRAMINGS — one banner, one crop per ratio, held as JSON on
       the element beside the single triple that paints it. A unit is
       one size, so only its own ratio's entry is ever visible on the
       sheet; the rest are answers the user gave for the OTHER shapes
       this creative has to run at, and they surface in Preview Sizes
       and travel with every clone. A ratio absent from the map has
       never been touched, and that absence is meaningful — it is what
       lets Apply leave unedited shapes exactly as they were. ═══ */
    function readBannerFramings(banner) {
      if (!banner) return {};
      const raw = banner.getAttribute('data-framings');
      if (!raw) return {};
      try {
        const o = JSON.parse(raw);
        return (o && typeof o === 'object') ? o : {};
      } catch (e) { return {}; }
    }
    function writeBannerFramings(banner, map) {
      if (!banner) return;
      const keys = Object.keys(map || {});
      if (!keys.length) banner.removeAttribute('data-framings');
      else banner.setAttribute('data-framings', JSON.stringify(map));
      const own = map && map[ratioKey(banner.getAttribute('data-size'))];
      if (own) applyFramingToBanner(banner, clampFraming(own));
    }
    /* §BR.2 — `map` is now the UNIT's own override only (an escape
       hatch, "Just this one"). Absent there, the image's own answer
       for this ratio — the shared, campaign-level `assets.images[src]
       .framings[ratio]` §BR.1 introduced — wins; absent from BOTH, the
       picture's plain focal default. An untouched image is still
       byte-identical to before either store existed. */
    function framingForSize(map, sizeId, src) {
      const key = ratioKey(sizeId);
      const own = map && map[key];
      if (own) return clampFraming(own);
      const shared = src && assets.images[src] && assets.images[src].framings[key];
      if (shared) return clampFraming(shared);
      return defaultFraming(src);
    }
    /* Seeds the map when the editor opens. A card framed before either
       store existed carries its triple on the element alone; fold that
       in so its own ratio reads as its OWN override rather than as
       never-touched. §BR.2 — the comparison baseline is now the shared/
       default resolution (framingForSize with an empty unit map), not
       the raw focal default, so a unit that simply inherited the
       image's shared crop is never mistaken for having its own. */
    function seedBannerFramings(banner) {
      const map = readBannerFramings(banner);
      const sizeId = banner.getAttribute('data-size');
      const key = ratioKey(sizeId);
      if (key && !map[key]) {
        const media = banner.querySelector('.pt-banner-media img, .pt-banner-media video');
        const imgSrc = media ? media.getAttribute('src') : '';
        const own = readBannerFraming(banner);
        const baseline = framingForSize(map, sizeId, imgSrc);
        if (own.x !== baseline.x || own.y !== baseline.y || own.s !== baseline.s) map[key] = own;
      }
      return map;
    }
    /* ═══ §BR.2 — reach across the board. `assets.images[src].framings`
       is one entry per ratio, shared by every unit that references
       that image (data-image-ref === src) at that shape; a unit's own
       `data-framings` entry (above) is the one thing that can opt it
       out ("Just this one"). These two helpers are the board-wide half
       of that: how many units a shared crop would land on, and
       actually landing it on the ones that are still listening. Both
       walk the live sheet AND Selects (a select is a real unit with
       its own data-image-ref, per BR.1). ═══ */
    function reachCountForImageRatio(src, key, editingBanner) {
      if (!src || !key) return 0;
      let n = 0, editingCounted = false;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[data-image-ref], #ptSelects .pt-banner[data-image-ref]'), (banner) => {
        if (banner.getAttribute('data-image-ref') !== src) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        const isEditing = banner === editingBanner;
        if (!isEditing && readBannerFramings(banner)[key]) return; // its own override — out of reach
        n++;
        if (isEditing) editingCounted = true;
      });
      // The unit being edited may not have swapped its LIVE image yet
      // (Studio edits a stage clone until commit) — still count it if
      // this is the image it will carry once Apply/Back lands it.
      if (editingBanner && !editingCounted && ratioKey(editingBanner.getAttribute('data-size')) === key) n++;
      return n;
    }
    function refreshSharedFramingAcrossBoard(src, key, skipBanner) {
      const fr = src && assets.images[src] && assets.images[src].framings[key];
      if (!fr) return;
      const clamped = clampFraming(fr);
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[data-image-ref], #ptSelects .pt-banner[data-image-ref]'), (banner) => {
        if (banner === skipBanner) return;
        if (banner.getAttribute('data-image-ref') !== src) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        if (readBannerFramings(banner)[key]) return; // this unit opted out — untouched
        applyFramingToBanner(banner, clamped);
      });
      // Coordinator review, 9/18: a fan-out across the board is exactly
      // the case the band's own readouts (Imagery included) went stale
      // after — Studio commits, closes, and nothing else downstream
      // ever re-asked syncBandFieldsUI what the sheet says now. Every
      // fan-out helper calls it itself so no future caller can forget.
      syncBandFieldsUI();
    }
    /* ═══ §BR.3 — reach across the board for a LINE (the copy analogue
       of reachCountForImageRatio/refreshSharedFramingAcrossBoard just
       above). A line has no ratio dimension, so this is simpler: one
       id, shared by every unit dealt that pool slot at generation
       (registerLineAsset's own role+':'+poolIndex convention,
       19-sheet-c-variety.js) or later pointed at it by a band pick
       (fieldMutator, 14-hat-a-files.js), at ANY size. fieldKey is the
       stage's own field name ('headline'/'cta'/'disclaimer' —
       wireStageEditableFields' own three); PT_COPY_ROLE_ATTR/_ASSET
       translate it to the matching data- attribute and registerLineAsset
       role ('disclaimer' on the stage is 'legal' everywhere else). Both
       walk the live sheet AND Selects, same as the framing pair. ═══ */
    const PT_COPY_ROLE_ATTR = { headline: 'data-headline-id', cta: 'data-cta-id', disclaimer: 'data-legal-id' };
    const PT_COPY_ROLE_ASSET = { headline: 'headline', cta: 'cta', disclaimer: 'legal' };
    function reachCountForLine(fieldKey, id, editingBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      if (!attr || !id) return 0;
      let n = 0, editingCounted = false;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner.getAttribute(attr) !== id) return;
        const isEditing = banner === editingBanner;
        if (!isEditing && readBannerCopyOverrides(banner)[fieldKey]) return; // its own override — out of reach
        n++;
        if (isEditing) editingCounted = true;
      });
      // Same "count the unit being edited even if its live attribute
      // hasn't caught up yet" allowance reachCountForImageRatio makes —
      // Studio edits a stage clone until Apply/Back.
      if (editingBanner && !editingCounted && editingBanner.getAttribute(attr) === id) n++;
      return n;
    }
    function refreshSharedLineAcrossBoard(fieldKey, id, skipBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      const role = PT_COPY_ROLE_ASSET[fieldKey];
      const line = attr && id && assets.lines[id];
      if (!line) return;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner === skipBanner) return;
        if (banner.getAttribute(attr) !== id) return;
        if (readBannerCopyOverrides(banner)[fieldKey]) return; // this unit opted out — untouched
        if (role === 'headline') {
          const h = banner.querySelector('.pt-banner-headline');
          if (h) { h.textContent = line.text; applyHeadlineFit(h, banner.getAttribute('data-size'), line.text); }
        } else if (role === 'cta') {
          const c = banner.querySelector('.pt-banner-cta');
          if (c) c.textContent = line.text;
        } else if (role === 'legal') {
          const inner = banner.querySelector('.pt-banner-inner');
          if (inner) ensureDisclaimerSlot(inner, line.text);
        }
      });
      syncBandFieldsUI(); // coordinator review, 9/18 — see refreshSharedFramingAcrossBoard's own comment
    }
    /* ═══ §BR.4 — copy SIZE by line × ratio (NS 4, 7). assets.lines[id]
       .fit[ratioKey] is the shared, campaign-level size for that LINE
       at that SHAPE — a plain multiplier on the layout's own font-size,
       1 (or absent) meaning untouched — bucketed by ratio exactly like
       assets.images[src].framings (§BR.2): 300x250 and 336x280 want the
       same answer, 160x600 a different one. A unit's own escape hatch
       is data-line-fit, one JSON blob per banner — but unlike framings
       (one image per unit, so a flat ratio-keyed map is enough) a unit
       carries THREE lines at once, so the map is keyed by fitKey(field,
       ratio) rather than ratio alone: a unit can "Just this one" its
       headline at 6:5 while its CTA still follows the shared line, and
       follow the shared headline at a ratio it hasn't touched. Reuses
       PT_COPY_ROLE_ATTR/PT_COPY_ROLE_ASSET (just above) for the
       fieldKey↔attribute↔asset-role translation, same as every other
       copy helper in this block. ═══ */
    function fitKey(fieldKey, key) { return fieldKey + '|' + key; }
    function readBannerLineFit(banner) {
      if (!banner) return {};
      const raw = banner.getAttribute('data-line-fit');
      if (!raw) return {};
      try {
        const o = JSON.parse(raw);
        return (o && typeof o === 'object') ? o : {};
      } catch (e) { return {}; }
    }
    function writeBannerLineFit(banner, map) {
      if (!banner) return;
      const keys = Object.keys(map || {});
      if (!keys.length) banner.removeAttribute('data-line-fit');
      else banner.setAttribute('data-line-fit', JSON.stringify(map));
    }
    // Same bounds shape as clampFraming's own scale clamp — wide enough
    // for the Fit link to genuinely shrink a runaway headline (down
    // toward the readable floor, stacked on top of whatever Shrink to
    // fit already applied) or grow a short line, never far enough to
    // read as a typo.
    function clampLineFitScale(s) {
      return Math.max(0.5, Math.min(1.6, Math.round((s || 1) * 100) / 100));
    }
    function fieldSelector(fieldKey) {
      return fieldKey === 'cta' ? '.pt-banner-cta' : fieldKey === 'disclaimer' ? '.pt-banner-disclaimer' : '.pt-banner-headline';
    }
    /* Same precedence as framingForSize: this unit's own answer for
       fieldKey+ratio (unitMap, e.g. editorState.lineFit or a banner's
       own readBannerLineFit) wins; absent, the shared/campaign line's
       own answer for that ratio; absent from both, 1 — the layout's
       plain font-size, byte-identical to before BR.4 existed. */
    function lineFitScale(fieldKey, unitMap, id, key) {
      const fk = fitKey(fieldKey, key);
      const own = unitMap && unitMap[fk];
      if (own) return clampLineFitScale(own);
      const shared = id && assets.lines[id] && assets.lines[id].fit && assets.lines[id].fit[key];
      if (shared) return clampLineFitScale(shared);
      return 1;
    }
    // Paints one banner's own line element at its resolved fit scale —
    // the render half, called at generation (applyBannerCopyOverrides),
    // every band re-point (fieldMutator), and the board-wide fan-out
    // below. A plain inline custom property on the line element itself
    // (--pt-fit-scale, read by its font-size formula, css/21-sheet-
    // b.css) — the same "set directly on the one element it answers
    // for" idiom applyHeadlineFit's own --body-shrink-scale already
    // uses, so the two levers can never bleed into a sibling.
    function applyLineFit(banner, fieldKey) {
      if (!banner) return 1;
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      const el = banner.querySelector(fieldSelector(fieldKey));
      if (!attr || !el) return 1;
      const id = banner.getAttribute(attr);
      const key = ratioKey(banner.getAttribute('data-size'));
      const scale = lineFitScale(fieldKey, readBannerLineFit(banner), id, key);
      if (scale === 1) el.style.removeProperty('--pt-fit-scale');
      else el.style.setProperty('--pt-fit-scale', scale.toFixed(2));
      return scale;
    }
    /* ═══ §BR.4 — reach across the board for a line's SIZE: the ratio-
       scoped analogue of reachCountForLine (text has no ratio — it
       applies at every size the line shows up at) and the field-scoped
       analogue of reachCountForImageRatio (a crop has no field — one
       image per unit). Both dimensions matter for a size edit: how
       many units share this LINE at exactly THIS RATIO, excluding
       whichever have already opted out with their own fit override. ═══ */
    function reachCountForLineFit(fieldKey, id, key, editingBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      if (!attr || !id || !key) return 0;
      let n = 0, editingCounted = false;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner.getAttribute(attr) !== id) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        const isEditing = banner === editingBanner;
        if (!isEditing && readBannerLineFit(banner)[fitKey(fieldKey, key)]) return; // its own override — out of reach
        n++;
        if (isEditing) editingCounted = true;
      });
      if (editingBanner && !editingCounted && editingBanner.getAttribute(attr) === id && ratioKey(editingBanner.getAttribute('data-size')) === key) n++;
      return n;
    }
    /* Coordinator review, 9/18 — "merge into ONE row": the stage's
       reach line now answers for BOTH the line's text and its size at
       this shape in one sentence, so it needs one count rather than
       two (reachCountForLine's own, ratio-blind, and
       reachCountForLineFit's, ratio-scoped, could legitimately
       disagree — a unit at a different ratio still shares the TEXT but
       was never in reach of a size answer scoped to a shape it isn't).
       This walks the same ratio-scoped set reachCountForLineFit does
       (the size half is the narrower, more specific claim — "these N
       banners share this text AND sit at this exact shape") and excludes
       a banner opted out on EITHER dimension, since a unit that kept
       only one of the two overrides is no longer fully "in reach" of a
       single combined default-scope write. */
    function reachCountForLineCombined(fieldKey, id, key, editingBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      if (!attr || !id || !key) return 0;
      let n = 0, editingCounted = false;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner.getAttribute(attr) !== id) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        const isEditing = banner === editingBanner;
        if (!isEditing && (readBannerCopyOverrides(banner)[fieldKey] || readBannerLineFit(banner)[fitKey(fieldKey, key)])) return; // opted out on either dimension — out of reach
        n++;
        if (isEditing) editingCounted = true;
      });
      if (editingBanner && !editingCounted && editingBanner.getAttribute(attr) === id && ratioKey(editingBanner.getAttribute('data-size')) === key) n++;
      return n;
    }
    function refreshSharedLineFitAcrossBoard(fieldKey, id, key, skipBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      const line = attr && id && assets.lines[id];
      const scale = line && line.fit && line.fit[key];
      if (!scale) return;
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner === skipBanner) return;
        if (banner.getAttribute(attr) !== id) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        if (readBannerLineFit(banner)[fitKey(fieldKey, key)]) return; // opted out — untouched
        applyLineFit(banner, fieldKey);
      });
      syncBandFieldsUI(); // coordinator review, 9/18 — see refreshSharedFramingAcrossBoard's own comment
    }
    /* A line element "overflows" its box — the Fit link's own success
       test. Headline: the same -webkit-line-clamp box tryFit
       (applyHeadlineFit, 19-sheet-c-variety.js) already measures —
       scrollHeight keeps reporting the clamped-off content's real
       height even though overflow:hidden paints over it — PLUS a width
       check tryFit never needed: no `overflow-wrap` rule bounds a
       single unbroken word to the column's width (P11's own layouts
       never needed one — normal copy always wraps between words), so a
       word wider than the column on its own — "STRAIGHTAWAY" against
       split's narrow copy half at 300×250, the coordinator's own
       flagged case — pushes scrollWidth past clientWidth even while
       scrollHeight still reads as within the clamped box's own height
       (the line-clamp box doesn't grow to chase an overflowing WORD,
       only overflowing LINES). Legal (AZ.1 — "never truncates," so it
       wraps to as many lines as it needs rather than clamping) has no
       bounded box in its default Inline style; its failure mode is
       growing tall enough to ride up into the copy above it, so the
       check is positional (its own top edge above the banner's) rather
       than a height comparison — except the bounded Scroll box style,
       which is never "overflowing" by design (it scrolls). CTA is an
       inline-flex pill sized to its own text (never clipped by its own
       box); its failure mode is running past the copy column's real
       width. */
    function lineOverflows(el, fieldKey, banner) {
      if (!el || !el.isConnected) return false;
      if (fieldKey === 'headline') return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      if (fieldKey === 'disclaimer') {
        if (el.classList.contains('pt-banner-disclaimer--scroll')) return false;
        const bRect = banner.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        return eRect.top < bRect.top - 0.5;
      }
      const copy = banner.querySelector('.pt-banner-copy');
      if (!copy) return false;
      return el.scrollWidth > copy.clientWidth + 1;
    }
    /* The "Fit" text link's own computation: the largest scale (a
       linear sweep from 160% down to 50% in whole steps — overflow
       isn't guaranteed monotonic across DIFFERENT layouts sharing one
       ratio, so a true binary search could stop early on the wrong
       side; this is a one-off click against a handful of DOM nodes,
       not a hot path) at which NONE of the instances this write would
       land on — the same set refreshSharedLineFitAcrossBoard fans out
       to, plus whichever banner is actually on the stage right now
       (stageBanner supersedes its own live sheet card, which may not
       carry this session's retyped text yet — same allowance
       reachCountForLineFit's own comment makes) — wrap, ellipsize or
       overflow. Probes by writing --pt-fit-scale directly and
       measuring, then restores whatever was there before it started:
       this is a dry run, the caller commits the winning value for
       real. */
    function computeFitScaleForLine(fieldKey, id, key, stageBanner, editingCardBanner) {
      const attr = PT_COPY_ROLE_ATTR[fieldKey];
      if (!attr || !id || !key) return 1;
      const banners = [];
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner[' + attr + '], #ptSelects .pt-banner[' + attr + ']'), (banner) => {
        if (banner === editingCardBanner) return; // superseded by the stage's own live banner below
        if (banner.getAttribute(attr) !== id) return;
        if (ratioKey(banner.getAttribute('data-size')) !== key) return;
        if (readBannerLineFit(banner)[fitKey(fieldKey, key)]) return; // opted out — not this write's business
        banners.push(banner);
      });
      // The stage clone never carries data-headline-id/-cta-id/-legal-id
      // (buildStageBannerElForSize builds a throwaway preview, not a
      // referenced unit — BR.1's ids only ever land on real persisted
      // banners), so it can't be matched by attribute the way the sheet's
      // own cards just were above; the caller only ever invokes this for
      // the field/id/ratio the stage is CURRENTLY showing, so a ratio
      // match alone is enough to know it belongs in the set.
      if (stageBanner && ratioKey(stageBanner.getAttribute('data-size')) === key) banners.push(stageBanner);
      if (!banners.length) return 1;
      const els = banners.map((b) => ({ b: b, el: b.querySelector(fieldSelector(fieldKey)) })).filter((p) => p.el);
      if (!els.length) return 1;
      const prev = els.map((p) => p.el.style.getPropertyValue('--pt-fit-scale'));
      let best = 0.5;
      for (let s = 160; s >= 50; s -= 2) {
        const scale = s / 100;
        els.forEach((p) => p.el.style.setProperty('--pt-fit-scale', scale.toFixed(2)));
        let bad = false;
        for (let i = 0; i < els.length; i++) {
          void els[i].el.offsetHeight; // force layout before reading
          if (lineOverflows(els[i].el, fieldKey, els[i].b)) { bad = true; break; }
        }
        if (!bad) { best = scale; break; }
      }
      els.forEach((p, i) => { if (prev[i]) p.el.style.setProperty('--pt-fit-scale', prev[i]); else p.el.style.removeProperty('--pt-fit-scale'); });
      return clampLineFitScale(best);
    }
    /* ═══ BA.1/BA.2 — OFFSETS: where the parts of a banner were moved to
       on the Studio stage. One map per banner keyed by SIZE id (a nudge
       on 300×250 says nothing about 160×600 — per size, not per ratio
       like framings): offsets['300x250'] = { headline: {x, y}, cta:
       {x, y}, logo, subhead, body, disclaimer }, each in the banner's
       NATURAL px — every render of a size is at its natural px inside a
       scaled wrapper (the stage wrap, the film tile, the card's
       .pt-banner-scale), so natural px is exact everywhere. Absent or
       {0,0} = the layout's own home. Held as JSON on the element
       (data-offsets, the data-framings convention above) beside the
       inline vars that paint it: --pt-ox / --pt-oy on each part, read
       by the one `translate` rule in the banner recipe. ═══ */
    const PT_MOVE_PARTS = {
      logo: '.pt-banner-logo',
      headline: '.pt-banner-headline',
      subhead: '.pt-banner-subhead',
      body: '.pt-banner-body',
      cta: '.pt-banner-cta',
      disclaimer: '.pt-banner-disclaimer'
    };
    function cleanOffsetsForSize(o) {
      const out = {};
      Object.keys(PT_MOVE_PARTS).forEach((k) => {
        const v = o && o[k];
        if (!v) return;
        const x = Math.round((parseFloat(v.x) || 0) * 100) / 100;
        const y = Math.round((parseFloat(v.y) || 0) * 100) / 100;
        if (x || y) out[k] = { x: x, y: y };
      });
      return out;
    }
    function cleanOffsets(map) {
      const out = {};
      Object.keys(map || {}).forEach((sizeId) => {
        const o = cleanOffsetsForSize(map[sizeId]);
        if (Object.keys(o).length) out[sizeId] = o;
      });
      return out;
    }
    function offsetsForSize(map, sizeId) {
      return map && map[sizeId] ? map[sizeId] : null;
    }
    function offsetsAnyForSize(map, sizeId) {
      return Object.keys(cleanOffsetsForSize(offsetsForSize(map, sizeId))).length > 0;
    }
    function applyPartOffset(el, x, y) {
      if (!el) return;
      if (x || y) { el.style.setProperty('--pt-ox', x + 'px'); el.style.setProperty('--pt-oy', y + 'px'); }
      else { el.style.removeProperty('--pt-ox'); el.style.removeProperty('--pt-oy'); }
    }
    // Writes one size's vars onto a rendered banner (and clears them
    // when the size has none) — the stage, the film tiles, the version
    // thumbs and the card on Apply all come through here.
    function applyOffsetsToBanner(banner, offsetsOfSize) {
      if (!banner) return;
      const o = cleanOffsetsForSize(offsetsOfSize);
      Object.keys(PT_MOVE_PARTS).forEach((k) => {
        const el = banner.querySelector(PT_MOVE_PARTS[k]);
        if (!el) return;
        applyPartOffset(el, o[k] ? o[k].x : 0, o[k] ? o[k].y : 0);
      });
    }
    function readBannerOffsets(banner) {
      if (!banner) return {};
      const raw = banner.getAttribute('data-offsets');
      if (!raw) return {};
      try {
        const o = JSON.parse(raw);
        return (o && typeof o === 'object') ? cleanOffsets(o) : {};
      } catch (e) { return {}; }
    }
    function writeBannerOffsets(banner, map) {
      if (!banner) return;
      const clean = cleanOffsets(map);
      if (!Object.keys(clean).length) banner.removeAttribute('data-offsets');
      else banner.setAttribute('data-offsets', JSON.stringify(clean));
      applyOffsetsToBanner(banner, offsetsForSize(clean, banner.getAttribute('data-size')));
    }
    // Shared media-tag builder — every site that swaps a picked frame
    // into banner/thumb markup goes through this so image vs video
    // rendering never drifts (S68 gallery contract, extended 9/1c).
    function mediaTagHTML(src, cls, framing) {
      const classAttr = cls ? ' class="' + cls + '"' : '';
      const fr = framing || defaultFraming(src);
      const posAttr = ' style="' + framingStyleCSS(fr) + '"';
      if (isVideoSrc(src)) {
        return '<video' + classAttr + posAttr + ' src="' + src + '" muted loop autoplay playsinline disablepictureinpicture></video>';
      }
      return '<img' + classAttr + posAttr + ' src="' + src + '" alt="" loading="lazy">';
    }
    const GENERATE_IMAGE_ID = 'shoot-03'; // deterministic — refresh-safe

    const COPY_PAIRS = [
      { headline: 'THE COAST IS CALLING', cta: 'Take the drive' },
      { headline: 'ENGINEERED WITH INTENT', cta: 'Meet the GT' },
      { headline: 'GOLDEN HOUR, EVERY HOUR', cta: 'Reserve yours' }
    ];
    /* Nine pairs total (3 + 6) — one per banner on the 3x3 sheet, so a
       default generate never has to repeat a headline. */
    const MORE_COPY_PAIRS = [
      { headline: 'BUILT FOR THE BEND', cta: 'Discover Coast Road' },
      { headline: 'PRECISION, UNLEASHED', cta: 'Book a test drive' },
      { headline: 'WHERE ROADS DISAPPEAR', cta: 'See the GT' },
      { headline: 'THE LONG WAY HOME', cta: 'Plan the route' },
      { headline: 'QUIET POWER, LOUD INTENT', cta: 'Hear it run' },
      { headline: 'EVERY MILE EARNED', cta: 'Start the drive' }
    ];
    const ALL_COPY_PAIRS = COPY_PAIRS.concat(MORE_COPY_PAIRS);

    // ── P8 — copy-field-row engine data. One field-type registry +
    //    one deterministic "deck" payload shared by the Guided copy
    //    editor and the Studio Text drawer (one component, two
    //    homes — see copyFieldRowHTML/mountCopyEditor below). ──
    const COPY_FIELD_TYPES = [
      { id: 'headline',   label: 'Headline' },
      { id: 'subhead',    label: 'Subhead' },
      { id: 'body',       label: 'Body copy' },
      { id: 'cta',        label: 'CTA' },
      { id: 'disclaimer', label: 'Disclaimer' },
      { id: 'custom',     label: 'Custom label' }
    ];
    const COPY_FIELD_LABEL = {};
    COPY_FIELD_TYPES.forEach(function (t) { COPY_FIELD_LABEL[t.id] = t.label; });
    const COPY_FIELD_PLACEHOLDER = {
      headline: 'Headline', subhead: 'Subhead', body: 'Body copy — a sentence or two',
      cta: 'Call to action', disclaimer: 'Disclaimer', custom: 'Custom copy'
    };
    // "+ Add text" cycles through these (headline/cta are always the
    // two default rows, never re-offered here); once all three are
    // present it keeps appending unlimited Custom rows.
    const COPY_ADD_SEQUENCE = ['subhead', 'body', 'disclaimer'];
    // The deterministic "copy deck" a staged upload resolves to —
    // same Corvache voice as COPY_PAIRS, refresh-safe (no real
    // parsing — the row-enter motion sells the beat).
    const CORVACHE_DECK = {
      headline: 'THE COAST IS CALLING',
      subhead: 'The new Corvache GT',
      body: 'Handcrafted in small batches, tuned for the coast road ahead. Every curve earns its keep.',
      cta: 'Take the drive',
      disclaimer: 'Prototype shown. Production model may vary.'
    };

    const LAYOUTS = [
      { id: 'type-top',    name: 'Type-forward top' },
      { id: 'type-bottom', name: 'Type-forward bottom' },
      { id: 'split',       name: 'Split' },
      { id: 'full-bleed',  name: 'Full-bleed image' }
    ];
    // AA.1 — nine generics total: the original five (type-top,
    // type-bottom, split, full-bleed, diagonal) plus four new shapes
    // (stacked, split-reverse, card, type-only), in the menu's own
    // display order. diagonal (the model-decides generated layout)
    // stays last, as before.
    const ALL_LAYOUT_IDS = ['type-top', 'type-bottom', 'stacked', 'split', 'split-reverse', 'card', 'full-bleed', 'type-only', 'diagonal'];
    const LAYOUT_NAME = {
      'type-top': 'Type-forward top', 'type-bottom': 'Type-forward bottom',
      'stacked': 'Stacked',
      'split': 'Split', 'split-reverse': 'Split reversed',
      'card': 'Card over image',
      'full-bleed': 'Full-bleed image',
      'type-only': 'Type only',
      'diagonal': 'Generated layout'
    };

    // P11 — every size the harness covers (300×250, 336×280, 250×250,
    // 728×90, 970×90, 320×50, 160×600, 300×600) plus 970×250, which
    // predates this pass. Every size funnels into one of the 4 size
    // classes via .pt-banner's container queries — nothing here needs
    // a matching CSS change beyond a data-size width/height rule.
    const SIZES = [
      { id: '300x250', label: '300×250', checked: true },
      { id: '336x280', label: '336×280', checked: false },
      { id: '250x250', label: '250×250', checked: false },
      { id: '728x90',  label: '728×90',  checked: false },
      { id: '970x90',  label: '970×90',  checked: false },
      { id: '320x50',  label: '320×50',  checked: false },
      { id: '160x600', label: '160×600', checked: false },
      { id: '300x600', label: '300×600', checked: false },
      { id: '970x250', label: '970×250', checked: false }
    ];
    // P11 harness hook — read-only, exposes the live SIZES list so
    // _qa/p11-harness.mjs never drifts from this file's own array.
    // No other behavior reads this; it carries no state.
    window.__PT_SIZES__ = SIZES;

    function findFrame(id) { return GALLERY_ITEMS.filter(f => f.id === id)[0] || GALLERY_ITEMS[0]; }
    function escape(s) {
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    let flowRunning = false;
    let sheetResolved = false;
    const state = {
      images: [],
      copy: null,       // { mode: 'written'|'own', pairs: [...] }
      layout: null,      // a LAYOUTS id, or 'diagonal' if generated
      sizes: ['300x250'],
      scored: false      // P3 — has "Score all" landed the score chips?
    };

    // ── rich chat message helpers — same DOM shape + persona-chat-
    //    injected contract as addUserMsg/addBotMsg above, just with
    //    innerHTML bodies so tiles/chips can live inside. ──
    function ptBot(html) {
      const node = el(
        '<div class="msg bot persona-chat-injected pt-msg">' +
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
              '<span class="msg-time">' + timeNow() + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="body">' + html + '</div>' +
        '</div>'
      );
      stream.appendChild(node);
      stream.scrollTop = stream.scrollHeight;
      return node;
    }
    function ptUser(html) {
      const node = el(
        '<div class="msg user persona-chat-injected pt-msg">' +
          '<div class="bubble">' +
            '<div class="msg-head">' +
              '<div class="msg-avatar av-nick">BC</div>' +
              '<div class="msg-meta">' +
                '<span class="msg-name">Bryan Cocco</span>' +
                '<span class="msg-dot"></span>' +
                '<span class="msg-time">' + timeNow() + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
      node.querySelector('.bubble').insertAdjacentHTML('beforeend', html);
      stream.appendChild(node);
      stream.scrollTop = stream.scrollHeight;
      return node;
    }

    // ═══ Painter hat-wizard — DOM refs + state machine ═══
    // BRYAN RULING 8/24: the whole image/copy/layout/sizes walk-through
    // happens INSIDE the chat hat panel (#chatAuxPanel), never as
    // injected chat messages. wizardStep tracks which of the 4 steps is
    // showing (-1 = wizard inactive). Exactly ONE chat line ever posts
    // for the whole flow — the final "Done" line in finishGenerate().
    const auxPanel = document.getElementById('chatAuxPanel');
    const hatWizard = document.getElementById('ptHatWizard');
    const hatWizardBody = document.getElementById('ptHatWizardBody');
    const hatBack = document.getElementById('ptHatBack');
    const hatStepLabel = document.getElementById('ptHatStepLabel');
    const auxTitleEl = auxPanel && auxPanel.querySelector('.chat-aux-title');
    const AUX_TITLE_DEFAULT = 'What would you like to create?';
    // The Media flow's two header voices: the opening settings surface
    // (pills, no step number) and the numbered Guided steps behind it.
    const AUX_TITLE_SETTINGS = 'New media settings';
    const AUX_TITLE_MEDIA = 'Media';
    let wizardStep = -1;
    let auxOpenTimerPt = null;
    // P5 — Studio door state (see the "P5 Studio door" block near the
    // editor functions for openStudio/exitStudioToDefault/etc.).
    let inStudio = false;
    // AM.1 — "this thing and studio should be the same thing": true
    // while Studio is open FOR AN EXISTING BOARD UNIT (opened by
    // clicking a unit on the sheet), false for a fresh Studio banner
    // (from the hat) or a reopened Your-Gallery one. Orthogonal to
    // editorCardEl (the Preview Sizes door's throwaway clones set that
    // too) — this is what the topbar lockup, the hat row's voice, the
    // primary button and Back/Escape's return path all key off.
    let studioUnitMode = false;
    // AM.7 — unit mode's own artboards: an ordered list of
    // { id, state, history, historyLabels, historyIndex, versions,
    // lastSavedSnap }, the parent (the unit as opened) always first.
    // The live globals below (editorState, studioHistory*, studio-
    // Versions, studioLastSavedSnap) ARE whichever artboard is
    // currently active's own copy of those pieces — studioUnitActivate
    // swaps them in, studioUnitCaptureActive flushes them back before
    // a swap. null outside unit mode; a fresh unit-mode open always
    // starts back at exactly one (the parent, nothing to fold/insert).
    let studioUnitArtboards = null;
    let studioUnitActiveId = null;
    let studioActiveTool = null; // 'size'|'text'|'images'|'layout'|'colors'|'brand'|'history'|null
    let studioFilmSizeIds = ['300x250']; // Studio's own filmstrip, pre-canvas
    let studioTitle = 'Untitled banner';
    let studioWriteForMeIdx = 0; // deterministic cycle through ALL_COPY_PAIRS
    let studioZoom = null; // AK.1 — null = Fit (auto); else a manual multiplier, −/+/⌘=/⌘−/⌘0/⌘1
    // AK.3/AK.4 — session-only: banners saved to "Your Gallery" and
    // custom templates saved off the current banner. Neither persists
    // past a refresh (house rule — no localStorage for UI/content state).
    let studioSavedBanners = []; // [{id, title, sizeId, sizeLabel, versions:[{label,snap,savedAt}]}]
    let studioBannerRecordId = null; // which studioSavedBanners entry this session saves into, once saved once
    let studioTemplates = []; // [{id, name, layoutId, colorway, customColor, font, sizeId}]

    // AK.2 — Studio's real editorState history stack (topbar Undo/Redo,
    // ⌘Z / ⇧⌘Z) plus a labeled History drawer and a Versions rail.
    // A snapshot is the three pieces of Studio-editable state
    // (editorState, the pre-canvas filmstrip list, the title); every
    // discrete, committed action pushes one — never per-keystroke — so
    // undo/redo steps feel like real edits, not chars. studioHistoryLabels
    // is a parallel array (same length/indices) naming each step for the
    // History drawer; studioVersions are SAVE points (AK.3) — a separate,
    // coarser timeline the Versions rail reads.
    let studioHistory = [];
    let studioHistoryLabels = [];
    let studioHistoryIndex = -1;
    let studioVersions = []; // [{label:'v1', snap, savedAt}]
    let studioLastSavedSnap = null; // null = never saved this session
    function studioSnapshot() {
      return JSON.stringify({ editorState: editorState, filmIds: studioFilmSizeIds, title: studioTitle });
    }
    // Split in two for AK.3: reopening a SAVED banner (openStudio's
    // savedBanner path) wants a fresh undo boundary at its restored
    // state but must keep that banner's own version timeline and
    // record id — only a brand-new blank banner resets everything.
    function resetStudioUndoStack() {
      studioHistory = [studioSnapshot()];
      studioHistoryLabels = ['Started'];
      studioHistoryIndex = 0;
      refreshUndoRedoButtons();
    }
    function resetStudioHistory() {
      resetStudioUndoStack();
      studioVersions = [];
      studioLastSavedSnap = null;
      studioBannerRecordId = null;
      studioZoom = null; // AK.1 — every fresh banner opens at Fit
      syncStudioSaveStatus();
    }
    function pushStudioHistory(label) {
      if (!inStudio) return;
      const snap = studioSnapshot();
      if (studioHistory[studioHistoryIndex] === snap) return; // no-op edit
      studioHistory = studioHistory.slice(0, studioHistoryIndex + 1);
      studioHistoryLabels = studioHistoryLabels.slice(0, studioHistoryIndex + 1);
      studioHistory.push(snap);
      studioHistoryLabels.push(label || 'Edit');
      studioHistoryIndex = studioHistory.length - 1;
      refreshUndoRedoButtons();
      syncStudioSaveStatus();
      // AK.6 — every committed edit funnels through here regardless of
      // which drawer/direct-stage path triggered it (a direct headline/
      // CTA edit never calls renderEditorStage), so this is the one
      // place that reliably keeps the topbar's Brand/Legal chips honest.
      syncStudioBrandChips();
      // §BQ — same funnel: the SIZE group's tiles are finished PICTURES
      // of the unit (buildStageBannerElForSize), so a style/colorway/
      // image/copy edit has to redraw them, same as the filmstrip.
      refreshStudioSizeTiles();
      if (studioActiveTool === 'history') renderStudioDrawer('history');
    }
    function refreshUndoRedoButtons() {
      const undoBtn = document.getElementById('ptEditorUndoBtn');
      const redoBtn = document.getElementById('ptEditorRedoBtn');
      if (undoBtn) undoBtn.disabled = studioHistoryIndex <= 0;
      if (redoBtn) redoBtn.disabled = studioHistoryIndex >= studioHistory.length - 1;
    }
    // Repaints every surface that reads editorState — stage, sizes
    // bar, an open drawer's own inputs, the hat's compact row — after
    // an undo/redo swaps the whole state object out from under them.
    function applyStudioSnapshot(snap) {
      const data = JSON.parse(snap);
      editorState = data.editorState;
      studioFilmSizeIds = data.filmIds;
      studioTitle = data.title;
      const titleEl = document.getElementById('ptEditorStudioTitle');
      if (titleEl && titleEl.getAttribute('contenteditable') !== 'true') titleEl.textContent = studioTitle;
      renderEditorStage();
      renderEditorFilmstrip();
      if (studioActiveTool) renderStudioDrawer(studioActiveTool);
      syncStudioHatRow();
      syncStudioSaveStatus();
      renderStudioVersionsRail(); // AK.2(b) — an undo/redo can change which version (if any) matches "current"
      refreshStudioSizeTiles(); // §BQ — likewise for the SIZE group's own finished renders
      // §BR.3/§BR.4, merged — an undo/redo can change override/text/
      // fit state for whichever copy field the merged reach line under
      // the stage is currently naming; force its signature check to
      // re-decide rather than leaving it showing what was true a step
      // ago.
      if (typeof updateCopyFitUI === 'function') { const el = document.getElementById('ptCopyFitReachText'); if (el) delete el.dataset.sig; updateCopyFitUI(); }
    }
    // AK.2 — jump straight to any step (a History drawer row click),
    // not just one back/forward — same apply, a different index math.
    function studioJumpHistory(index) {
      if (index < 0 || index >= studioHistory.length || index === studioHistoryIndex) return;
      studioHistoryIndex = index;
      applyStudioSnapshot(studioHistory[studioHistoryIndex]);
      refreshUndoRedoButtons();
    }
    function studioUndo() {
      if (studioHistoryIndex <= 0) return;
      studioHistoryIndex--;
      applyStudioSnapshot(studioHistory[studioHistoryIndex]);
      refreshUndoRedoButtons();
    }
    function studioRedo() {
      if (studioHistoryIndex >= studioHistory.length - 1) return;
      studioHistoryIndex++;
      applyStudioSnapshot(studioHistory[studioHistoryIndex]);
      refreshUndoRedoButtons();
    }

    // Fade-swap the panel head title, same .is-changing technique the
    // shell already uses for the edit-mode title swap (setChatAuxTitle,
    // a couple hundred lines up) and the dead ChatHat controller below.
    let auxTitleTimer = null;
    function setAuxTitle(text) {
      if (!auxTitleEl) return;
      // One pending swap at a time: a second call inside the 220ms fade
      // (Back, then Media again) used to let the FIRST call's text land
      // late, over the top of the second's.
      clearTimeout(auxTitleTimer);
      if (auxTitleEl.textContent === text) { auxTitleEl.classList.remove('is-changing'); return; }
      auxTitleEl.classList.add('is-changing');
      auxTitleTimer = setTimeout(() => {
        auxTitleEl.textContent = text;
        auxTitleEl.classList.remove('is-changing');
      }, 220);
    }
    function expandHat() {
      if (!auxPanel) return;
      auxPanel.classList.add('is-expanded');
      const toggle = auxPanel.querySelector('.chat-aux-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      clearTimeout(auxOpenTimerPt);
      auxOpenTimerPt = setTimeout(() => auxPanel.classList.add('is-fully-open'), 400);
    }
    // Collapsing the hat mid-wizard is a valid way to back out of
    // Painter — watch for is-expanded being removed (head click,
    // Escape, whatever the trigger) and reset to the default mode
    // tiles the moment it happens, so re-opening the hat never shows a
    // half-finished step. Only fires while pt-wizard-active is set.
    // (This exact area glitched once before during P1 — see PLAN.md
    // build log.)
    if (auxPanel) {
      let wasExpandedPt = auxPanel.classList.contains('is-expanded');
      /* 9/9 — the exit used to run the instant is-expanded dropped, which
         swapped the default chips in UNDER the 380ms collapse: the hat
         shrank over the wrong content ("teleports the default open state
         for a split second"). The wizard now stays put while the panel
         closes; the reset lands when the collapse ends (or after a
         480ms fallback), and is cancelled if the hat is re-opened in the
         meantime, so nothing resets under a change of mind. */
      let pendingWizardExit = null;
      const auxBodyPt = auxPanel.querySelector('.chat-aux-body');
      const cancelPendingExit = () => {
        if (!pendingWizardExit) return;
        clearTimeout(pendingWizardExit.timer);
        if (auxBodyPt) auxBodyPt.removeEventListener('transitionend', pendingWizardExit.onEnd);
        pendingWizardExit = null;
      };
      const scheduleWizardExit = () => {
        cancelPendingExit();
        const fire = () => {
          cancelPendingExit();
          if (!auxPanel.classList.contains('is-expanded') && auxPanel.classList.contains('pt-wizard-active')) settleHatAfterCollapse(); // 9/10: with a sheet on the canvas the settings stay (see settleHatAfterCollapse)
        };
        const onEnd = (e) => { if (e.target === auxBodyPt && e.propertyName === 'max-height') fire(); };
        pendingWizardExit = { timer: setTimeout(fire, 480), onEnd };
        if (auxBodyPt) auxBodyPt.addEventListener('transitionend', onEnd);
      };
      new MutationObserver(() => {
        const isExpandedNow = auxPanel.classList.contains('is-expanded');
        if (wasExpandedPt && !isExpandedNow) {
          // 9/10 — a collapse during the animated Back (below) hands
          // over to this path: the 220ms swap is dropped so the default
          // surface never mounts under a closing body, and any in-flight
          // height ease releases max-height so the collapse can run.
          if (wizardExitTimer) { clearTimeout(wizardExitTimer); wizardExitTimer = null; }
          clearHatBodyEase();
          if (auxPanel.classList.contains('pt-wizard-active')) scheduleWizardExit();
        }
        else if (!wasExpandedPt && isExpandedNow) cancelPendingExit();
        wasExpandedPt = isExpandedNow;
      }).observe(auxPanel, { attributes: true, attributeFilter: ['class'] });
    }

    // ═══ Media mode surface (#ptMediaMode) — ACTIVE BRIEF 9/1c ═══
    // Canvas-pane takeover, condensed from canvas-graphics' #c4Studio /
    // S8 studio-entrance feel (its own CLAUDE.md documents
    // applyStudioBounds/computeGhostLayout/studioRecedeCanvasContent —
    // read that before touching this). openMediaMode() recedes
    // whatever #canvas currently shows (fresh empty state OR an
    // existing sheet, either way) via INLINE opacity/filter set
    // directly here — never a toggled class, since a class can lose a
    // property fight to a forwards-fill keyframe already governing it
    // (the S8 lesson; #canvas carries no such animation today, but
    // staying inline costs nothing and stays robust either way).
    // closeMediaMode() reverses it — canvas returns to EXACTLY the
    // prior state, non-destructive (S71.2's own rule): this code never
    // touches #canvas's child content, only its own opacity/filter.
    let mmOpen = false;
    let mmCanvasReceded = false;
    function mmReducedMotion() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    // Any OTHER canvas-column takeover already sharing this grid cell
    // at z-index 60 (#ptEditor doubles as both Studio AND the regular
    // per-card painter editor, #ptPreview, #ptMotion, #ptCreateScreen)
    // — each already owns the canvas top with its own Back pill while
    // open, so the Media bar must yield to it exactly like the
    // workspace header already does.
    function canvasOverlayOpen() {
      return ['ptEditor', 'ptPreview', 'ptMotion', 'ptCreateScreen'].some((id) => {
        const el = document.getElementById(id);
        return el && el.getAttribute('data-visible') === '1';
      });
    }
    // Y (9/10, Bryan: "when clicking into media the top part of the
    // right side of canvas should become this like it does in video
    // and graphics") — #ptMediaTopbar's own data-visible, independent
    // of #ptMediaMode's. Keyed off .pt-wizard-active itself rather than
    // mmOpen/settingsStepMounted: both those two flags go false for a
    // beat between finishGenerate's closeMediaMode() and the settled-
    // hat's own renderForkStep() 500ms later (settleHatAfterGenerate),
    // and the bar must not drop out and back in during that gap —
    // .pt-wizard-active spans it, set once by startFlow (or a deep
    // link) and cleared only by exitWizardToDefault, i.e. exactly
    // "the Media flow is active." EXCEPT while another canvas takeover
    // is up (Studio included — inStudio is kept too, belt and braces,
    // since it flips a line before #ptEditor's own data-visible does).
    // Called at every point that can change any of those: the Media
    // takeover opening or closing, a settings/guided step swap,
    // Studio's own entry/exit, exiting Media outright, and every other
    // takeover's own open/close.
    function syncMediaTopbar() {
      const el = document.getElementById('ptMediaTopbar');
      if (!el) return;
      // AH.2 — Package no longer swaps the bar's own lockup: it is
      // a modal now, with its own header carrying "Package" · the
      // hairline · the meta (packageBarLockupText, same text, now
      // read by openPackageOverlay into the modal's own title ids).
      // The bar behind the scrim just stays exactly what it already
      // was (the board, or "New media") — no special-case here.
      // AG.4 — the Selects viewer keeps the AF.1-style yield, since
      // it stayed a full-column takeover, not a modal:
      // "the Media bar reads 'Selects' over '2 selects · 300×250'".
      const viewerEl = document.getElementById('ptSelectsViewer');
      if (viewerEl && viewerEl.getAttribute('data-visible') === '1') {
        el.setAttribute('data-visible', '1');
        el.setAttribute('aria-hidden', 'false');
        const bForViewer = boards[boardCur]; // AR.2 — the viewer's own lockup carries the board's name too, same as Package's header
        setMmTitleText('Selects', bForViewer ? ' \u00b7 ' + escape(bForViewer.name) : '');
        return;
      }
      const active = !inStudio && !canvasOverlayOpen() && !!(auxPanel && auxPanel.classList.contains('pt-wizard-active'));
      el.setAttribute('data-visible', active ? '1' : '0');
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
      // Fix Y — the bar's own title: "New media" until a board lands,
      // then that board's name ("Coast Road"), tracking whichever one is
      // current through every build/append/switch — never the live
      // wizard pills (updateMmTitle's own territory below). Reading
      // boards[boardCur] straight and running last in this function
      // makes it authoritative no matter what order callers combine
      // it with syncMediaModeStage in.
      // AB.1 — the bar IS the sheet's header now (.pt-sheet-header's
      // old eyebrow + h1 are gone): the suffix carries what that
      // eyebrow used to, in Studio's mono voice — "300×250 · 3 × 3 ·
      // Coast Road" (size · concepts × variants · campaign; live row
      // count when this is the board actually on the canvas, same
      // read boardItemHTML's own rail picture uses, the banked brief
      // otherwise).
      const b = boards[boardCur];
      if (b) {
        setMmTitleText(b.name, ''); // AR.2 — the name, not the number ("Board 1"); AL.6's own no-meta rule still holds
      }
    }
    // Cross-IIFE hook (window._pt* convention) — initCreateScreen's
    // openCreateScreen/closeCreateScreen live in an earlier, separate
    // closure and need this same sync on their own open/close.
    window._ptSyncMediaTopbar = syncMediaTopbar;
    function openMediaMode(opts) {
      opts = opts || {};
      const modeEl = document.getElementById('ptMediaMode');
      const canvasEl = document.getElementById('canvas');
      if (!modeEl) return;
      const immediate = !!opts.immediate || mmReducedMotion();
      if (mmOpen) { syncMediaModeStage(); syncMediaTopbar(); return; } // idempotent — re-entering while open is a no-op
      mmOpen = true;
      if (canvasEl) {
        canvasEl.style.transition = immediate ? 'none' : 'opacity 380ms cubic-bezier(0.16,1,0.3,1), filter 380ms cubic-bezier(0.16,1,0.3,1)';
        canvasEl.style.opacity = '0';
        canvasEl.style.filter = 'blur(6px)';
        canvasEl.style.pointerEvents = 'none';
        mmCanvasReceded = true;
      }
      modeEl.setAttribute('aria-hidden', 'false');
      modeEl.setAttribute('data-visible', '1');
      if (!immediate) {
        // ONE accent sweep, one shot — cleared on a plain setTimeout,
        // same convention ch-first-reveal itself already uses.
        modeEl.classList.add('pt-mm-entering');
        setTimeout(() => modeEl.classList.remove('pt-mm-entering'), 950);
      }
      syncMediaTopbar();
    }
    function closeMediaMode() {
      const modeEl = document.getElementById('ptMediaMode');
      const canvasEl = document.getElementById('canvas');
      if (!modeEl || !mmOpen) return;
      mmOpen = false;
      const ghosts = document.getElementById('ptMediaModeGhosts');
      if (ghosts) setTimeout(() => { if (!mmOpen) ghosts.innerHTML = ''; }, 400); // after the stage has faded; a re-open inside that window keeps them
      modeEl.setAttribute('aria-hidden', 'true');
      modeEl.setAttribute('data-visible', '0');
      modeEl.classList.remove('pt-mm-entering');
      syncMediaTopbar(); // Y — the settings pills may still be mounted (finishGenerate closes the takeover well ahead of exitWizardToDefault); only exitWizardToDefault's own clear-and-hide truly ends the Media bar
      if (canvasEl && mmCanvasReceded) {
        const reduced = mmReducedMotion();
        canvasEl.style.transition = reduced ? 'none' : 'opacity 420ms cubic-bezier(0.16,1,0.3,1), filter 420ms cubic-bezier(0.16,1,0.3,1)';
        canvasEl.style.opacity = '';
        canvasEl.style.filter = '';
        canvasEl.style.pointerEvents = '';
        mmCanvasReceded = false;
        // Hygiene: clear the inline transition itself once settled so
        // nothing lingers to fight a later, unrelated change (the S23
        // "zero stray inline styles at rest" lesson).
        setTimeout(() => { if (canvasEl) canvasEl.style.transition = ''; }, reduced ? 0 : 440);
      }
    }
    const PT_SHIMMER_INNER_HTML =
      '<span class="pt-vf-third pt-vf-third-v1"></span><span class="pt-vf-third pt-vf-third-v2"></span>' +
      '<span class="pt-vf-third pt-vf-third-h1"></span><span class="pt-vf-third pt-vf-third-h2"></span>' +
      '<span class="pt-vf-corner pt-vf-corner-tl"></span><span class="pt-vf-corner pt-vf-corner-tr"></span>' +
      '<span class="pt-vf-corner pt-vf-corner-bl"></span><span class="pt-vf-corner pt-vf-corner-br"></span>' +
      '<span class="pt-vf-sparkle">' + ICONS.sparkle + '</span>';
    // AO.1 — retired: the legacy per-size ghost grid (mmGhostEl,
    // mmEmptyGhostEl, mmLetterFromKey, mmLeaveClone, mmFlipSnapshot,
    // mmChipOrigin, renderMmGhostsForSizes, mmCheckedSizeIds, and the
    // MM_GHOST_SCALE/mmDims/PT_SHIMMER_INNER_HTML_THIRDS/MM_FLIP_*/
    // MM_ENTER_*/MM_LEAVE_MS constants only they used) and the
    // steps-0-2 idle OMNI mark (renderMmGhostsDefault) both retire in
    // favour of the one resting viewfinder every Guided step now
    // shares (renderMmGhosts/renderMmTemplate) — PLAN.md §AO.1.
    // .pt-mm-ghost*/.pt-mm-grid-rows/.pt-mm-empty CSS is left in
    // place (inert, unreferenced) rather than risk a stylesheet edit
    // this pass didn't need to make.
    // ═══ M / M.1 / M.2 — resting canvas BLUEPRINT BOARD ═══════════════
    // M (9/9) drew the nine test sizes as one hairline technical
    // drawing; M.1 (later 9/9) composed them as a two-band lockup in one
    // ink. M.2 (Bryan, 9/10: "fill the right side of the page with these
    // designs so it's sort of like a tetris board of these shapes but
    // with space between — clean") packs the stage edge to edge with
    // real ad sizes instead. Behind MM_REST_STYLE='blueprint' only —
    // MM_REST_STYLE='template' (live default) renders renderMmTemplate's
    // .pt-vf-cell viewfinder instead, the one stage every Guided step
    // and the settings row now share alike (AO.1).
    //
    // HOW THE BOARD PACKS. A band is as tall as its tallest single
    // piece; every other cell in the band is a stack of same-width
    // pieces that adds up to that height — a tower beside a billboard
    // over three leaderboards beside two stacked rectangles — which is
    // what makes it read as interlocking rather than a grid. Gutters are
    // 25 units in the sizes' own space, because that is the number the
    // real sizes decompose on (250+25+250+25+50 = 600, 200+25+25+50+50 =
    // 250...). Every band is justified to the board width and every
    // stack to its band height by nudging its own gutters a few units
    // either way (never more than ±8 per gutter, ~4px on screen), so
    // the left/right/top/bottom edges of every band line up exactly.
    // The scale is part of the search: the board is solved at several
    // scales and the best composition wins (clean gutters, towers and
    // boxes and strips all present, no run of one piece, about 22
    // pieces, larger scale preferred). Seeded, so a given stage size
    // always shows the same board. Developed in _qa/bp-lab/pack.js
    // (the same functions, verbatim — iterate there, then re-paste).
    const BP_TOP_RESERVE = 12; // clearance above the first band for its tags
    // Real ad sizes only. The nine test sizes the pill lists, plus the
    // rest of the common IAB family so the board has enough shapes to
    // interlock with (120×600 skyscraper, 240×400 vertical rectangle,
    // 468×60 full banner, 970×66 super leaderboard, the mobile strips).
    const BP_POOL = [
      '120x600', '160x600', '300x600',
      '300x250', '250x250', '336x280', '200x200', '240x400',
      '970x250', '970x90', '970x66', '728x90', '320x100', '320x50', '300x100', '300x50'
    ];
    function bpDimsOf(id) {
      const p = id.split('x');
      return { id: id, w: parseInt(p[0], 10), h: parseInt(p[1], 10) };
    }
    function bpFamily(p) {
      if (p.h >= 400 && p.w <= 300) return 'tower';
      if (p.w >= 468 || p.h <= 100) return 'strip';
      return 'box';
    }
    // mulberry32 — deterministic, so the same stage always packs the same board
    function bpRng(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    // Every cell a band of height Hb can hold: a single piece exactly Hb
    // tall, or a stack of 2..6 same-width pieces whose heights plus the
    // gutters between them land on Hb within ±tol per gutter (the stack's
    // own gutters absorb the difference — a few units, invisible).
    function bpCellLibrary(g, tol) {
      const pieces = BP_POOL.map(bpDimsOf);
      const heights = pieces.map((p) => p.h).filter((h, i, a) => a.indexOf(h) === i).sort((a, b) => b - a);
      const byW = {};
      pieces.forEach((p) => { (byW[p.w] = byW[p.w] || []).push(p); });
      const lib = {};
      heights.forEach((Hb) => {
        const cells = [];
        pieces.forEach((p) => { if (p.h === Hb) cells.push({ w: p.w, h: Hb, pieces: [p], gap: g, key: p.id, dev: 0 }); });
        Object.keys(byW).forEach((w) => {
          const fam = byW[w];
          const rec = (start, acc, sumH) => {
            const n = acc.length;
            if (n >= 2) {
              const slack = Hb - (sumH + g * (n - 1));
              if (Math.abs(slack) <= tol * (n - 1)) {
                cells.push({ w: parseInt(w, 10), h: Hb, pieces: acc.slice(), gap: g + slack / (n - 1), key: acc.map((p) => p.id).join('+'), dev: Math.abs(slack / (n - 1)) });
              }
            }
            if (n >= 4) return;
            for (let i = start; i < fam.length; i++) {
              const p = fam[i];
              if (sumH + p.h + g * n > Hb + tol * n + 0.001) continue; // cannot fit even with every gutter squeezed
              acc.push(p); rec(i, acc, sumH + p.h); acc.pop();
            }
          };
          rec(0, [], 0);
        });
        if (cells.length) lib[Hb] = cells;
      });
      return lib;
    }
    // Fill one line (a band's width, the board's height) with items:
    // random picks, but the item that CLOSES the line is chosen to fit,
    // and the leftover is spread across the line's gutters (±tol each).
    function bpFillLine(total, g, options, sizeOf, r, tol, avoidRepeat) {
      const items = [];
      let used = 0;
      const minSize = Math.min.apply(null, options.map(sizeOf));
      for (let guard = 0; guard < 40; guard++) {
        const n = items.length;
        const remaining = total - used - (n ? g : 0);
        const fits = options.filter((o) => sizeOf(o) <= remaining + tol * n);
        if (!fits.length) break;
        const closers = fits.filter((o) => { const left = remaining - sizeOf(o); return left < minSize + g - tol * n && Math.abs(left) <= tol * n; });
        let pool;
        if (closers.length && (r() < 0.9 || closers.length === fits.length)) pool = closers;
        else {
          const open = fits.filter((o) => remaining - sizeOf(o) >= minSize + g - tol * n);
          pool = open.length ? open : fits;
        }
        if (avoidRepeat && n) {
          const prevKey = items[n - 1].key, prevKind = bpKindOf(items[n - 1]);
          let alt = pool.filter((o) => o.key !== prevKey);
          if (alt.length) pool = alt;
          if (r() < 0.8) { alt = pool.filter((o) => bpKindOf(o) !== prevKind); if (alt.length) pool = alt; }
        }
        const pick = bpPickWeighted(pool, r);
        items.push(pick);
        used += sizeOf(pick) + (n ? g : 0);
        if (total - used < minSize + g - tol * items.length) break;
      }
      const n = items.length;
      if (!n) return null;
      const slack = total - used;
      if (n === 1) return Math.abs(slack) <= 3 ? { items: items, gap: g, slack: slack } : null;
      if (Math.abs(slack) > tol * (n - 1)) return null;
      return { items: items, gap: g + slack / (n - 1), slack: slack };
    }
    function bpKindOf(o) {
      if (!o.pieces) return 'band';
      if (o.pieces.length >= 3) return 'ladder';
      if (o.pieces.length === 2) return 'pair';
      return bpFamily(o.pieces[0]);
    }
    function bpWeight(o) {
      if (o.pieces) return Math.pow(o.pieces.reduce((a, p) => a + p.w * p.h, 0), 0.3) / (o.pieces.length >= 3 ? 1.5 : 1);
      return 1;
    }
    function bpPickWeighted(pool, r) {
      let sum = 0;
      const ws = pool.map((o) => { const w = bpWeight(o); sum += w; return w; });
      let x = r() * sum;
      for (let i = 0; i < pool.length; i++) { x -= ws[i]; if (x <= 0) return pool[i]; }
      return pool[pool.length - 1];
    }
    function bpScoreBoard(bands, bandFill, g, sizeId) {
      let sc = 0, count = 0;
      const ids = {}, fam = { tower: 0, box: 0, strip: 0 };
      let has600 = false;
      sc += Math.abs(bandFill.gap - g) * 0.6;
      bands.forEach((b) => {
        let ladders = 0, stacks = 0, towers = 0, run = 0, lastFam = null;
        if (b.h >= 600) has600 = true;
        sc += Math.abs(b.gap - g) * 0.6;
        b.cells.forEach((c, ci) => {
          count += c.pieces.length;
          if (c.pieces.length >= 3) ladders++;
          if (c.pieces.length >= 2) stacks++;
          if (ci && c.key === b.cells[ci - 1].key) sc += 5;
          sc += c.dev * 0.5;
          const f = c.pieces.length === 1 ? bpFamily(c.pieces[0]) : 'stack';
          if (f === 'tower') towers++;
          if (f === lastFam) { run++; if (run >= 2) sc += 3; } else run = 0;
          lastFam = f;
          const seen = {};
          c.pieces.forEach((p) => { ids[p.id] = (ids[p.id] || 0) + 1; fam[bpFamily(p)]++; seen[p.id] = (seen[p.id] || 0) + 1; if (seen[p.id] >= 3) sc += 3; });
        });
        if (b.h >= 400 && !stacks) sc += 6;          // a tall band of nothing but towers is a barcode
        if (b.h >= 600 && !towers) sc += 4;          // ...and a 600 band with no tower at all misses the point
        if (b.h >= 400 && stacks > b.cells.length / 2 + 1) sc += 3;
        if (towers > 3) sc += 3 * (towers - 3);
        if (ladders > 1) sc += 8 * (ladders - 1);
        if (b.cells.length === 1) sc += 3;
        if (b.h <= 100 && b.cells.length > 3) sc += 2 * (b.cells.length - 3); // a row of six mobile strips reads as noise
      });
      bands.forEach((b, bi) => {
        if (!bi) return;
        const a = bands[bi - 1];
        const sig = (x) => x.cells.map((c) => c.key).sort().join('|');
        if (sig(a) === sig(b)) sc += 12;
        else if (a.h === b.h && a.cells.length === b.cells.length) sc += 3;
      });
      Object.keys(ids).forEach((id) => { if (ids[id] > 3) sc += (ids[id] - 3) * 2; });
      if (!has600) sc += 8;
      if (fam.tower < 2) sc += 6 * (2 - fam.tower);
      if (!fam.box) sc += 6;
      if (!fam.strip) sc += 6;
      if (sizeId && !ids[sizeId]) sc += 5;
      return { score: sc, count: count };
    }
    function bpShuffle(arr, r) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function bpPackBoard(W, H, g, tol, r, lib, sizeId) {
      const bandOpts = Object.keys(lib).map((h) => ({ key: 'band' + h, h: parseInt(h, 10) }));
      const bands = bpFillLine(H, g, bandOpts, (o) => o.h, r, tol, true);
      if (!bands) return null;
      const out = [];
      for (let i = 0; i < bands.items.length; i++) {
        const b = bands.items[i];
        const row = bpFillLine(W, g, lib[b.h], (o) => o.w, r, tol, true);
        if (!row) return null;
        out.push({
          h: b.h, gap: row.gap,
          cells: row.items.map((c) => ({ w: c.w, h: c.h, gap: c.gap, key: c.key, dev: c.dev, pieces: c.pieces.length > 1 ? bpShuffle(c.pieces, r) : c.pieces }))
        });
      }
      const sc = bpScoreBoard(out, bands, g, sizeId);
      return { bands: out, bandGap: bands.gap, score: sc.score, count: sc.count };
    }
    // The whole solve: the board is packed at several scales and the best
    // composition wins — clean gutters, a mix of towers/boxes/strips, no
    // run of the same piece, about targetCount pieces, larger scale
    // preferred. Deterministic (seeded), so a given stage size always
    // shows the same board.
    function bpSolveBoard(availW, availH, opts) {
      opts = opts || {};
      const g = opts.gutter || 30, tol = opts.tol || 8, trials = opts.trials || 900, seed = opts.seed || 7;
      const target = opts.targetCount || 22;
      const scales = opts.scales || [0.6, 0.56, 0.52, 0.49, 0.46, 0.43, 0.4, 0.37, 0.34, 0.31];
      let best = null;
      const lib = bpCellLibrary(g, tol);
      scales.forEach((s) => {
        const W = availW / s, H = availH / s;
        const r = bpRng(seed);
        for (let t = 0; t < trials; t++) {
          const b = bpPackBoard(W, H, g, tol, r, lib, opts.sizeId);
          if (!b) continue;
          b.scale = s; b.g = g; b.W = W; b.H = H;
          b.total = b.score + Math.abs(b.count - target) * 0.5 + (0.6 - s) * 5;
          if (!best || b.total < best.total) best = b;
        }
      });
      return best;
    }
    // Pixel rects per piece. The width label draws once per stack (its
    // top piece); the height label on every piece.
    function bpBoardUnits(board) {
      const s = board.scale, units = [];
      let y = 0;
      board.bands.forEach((b, bi) => {
        let x = 0;
        b.cells.forEach((c, ci) => {
          let cy = y;
          c.pieces.forEach((p, pi) => {
            units.push({ id: p.id, group: bpFamily(p), x: x * s, y: cy * s, w: p.w * s, h: p.h * s, showTop: pi === 0, band: bi, cell: ci });
            cy += p.h + c.gap;
          });
          x += c.w + b.gap;
        });
        y += b.h + board.bandGap;
      });
      return units;
    }
    function bpSafeInset(scale) { return Math.max(4, Math.round(12 * scale)); }
    function bpRect(cls, x, y, w, h, clip) {
      return { cls: cls, x: x, y: y, w: w, h: h, clip: clip || null };
    }
    // BOX — the only group that follows the selected template's own
    // zone map, at a schematic level: which side/band is image vs
    // copy, and where copy sits within its band. Mirrors
    // .pt-banner-media/.pt-banner-copy's per-layout split (~L24672
    // onward) — split's 56/44 and diagonal's clip-path/copy width are
    // its exact ratios; type-top/bottom's copy band is content-sized
    // off the same logo/headline/CTA stack the real system also
    // content-sizes, rather than a guessed fixed fraction that could
    // overflow at the smallest box (250×250). Headline rule height is
    // a flat 1px regardless of scale — M.1's own "1px outlines, no
    // grey fills": at this sheet's ~2x bigger render, a rule sized off
    // sh would read as a solid grey bar, not a hairline.
    function bpBoxShapes(w, h, inset, layoutId) {
      const sx = inset, sy = inset, sw = w - inset * 2, sh = h - inset * 2;
      const legalH = Math.max(3, Math.round(sh * 0.09));
      const legalGap = Math.max(3, Math.round(sh * 0.04));
      const logoH = Math.max(6, Math.round(sh * 0.09)), logoW = Math.round(logoH * 1.15);
      const hlH = 1, hlGap = Math.max(2, Math.round(sh * 0.03));
      const ctaH = Math.max(7, Math.round(sh * 0.09));
      const stackGap = Math.max(4, Math.round(sh * 0.045));
      const blockH = logoH + stackGap + (hlH * 2 + hlGap) + stackGap + ctaH;
      const shapes = [];
      let img, copyX, copyW, copyY, copyH, anchor;
      if (layoutId === 'type-top') {
        copyX = sx; copyW = sw; copyY = sy;
        copyH = Math.min(Math.max(blockH + stackGap, sh * 0.34), sh - 6);
        anchor = 'start';
        shapes.push(bpRect('pt-bp-rule', sx, sy + copyH, sw, 1));
        img = bpRect('pt-bp-hatch', sx, sy + copyH, sw, sh - copyH);
      } else if (layoutId === 'type-bottom') {
        const band = Math.min(Math.max(blockH + stackGap + legalH + legalGap, sh * 0.34), sh - 6);
        copyX = sx; copyW = sw; copyY = sy + sh - band; copyH = band - legalH - legalGap;
        anchor = 'start';
        shapes.push(bpRect('pt-bp-rule', sx, copyY, sw, 1));
        img = bpRect('pt-bp-hatch', sx, sy, sw, sh - band);
      } else if (layoutId === 'full-bleed') {
        copyX = sx; copyW = sw * 0.58; copyY = sy; copyH = sh - legalH - legalGap;
        anchor = 'end';
        img = bpRect('pt-bp-hatch', 0, 0, w, h); // inset:0 of the FRAME, not the safe box — the real layout's own rule
      } else if (layoutId === 'diagonal') {
        copyX = sx; copyW = sw * 0.5; copyY = sy; copyH = sh;
        anchor = 'center';
        img = bpRect('pt-bp-hatch', 0, 0, w, h, 'polygon(40% 0,100% 0,100% 100%,4% 100%)');
        shapes.push({ line: [w * 0.40, 0, w * 0.04, h] }); // same cut the clip-path draws, as a real rule
      } else { // split — also templateLayoutId()'s own default when no template is picked
        copyX = sx; copyW = sw * 0.52; copyY = sy; copyH = sh;
        anchor = 'center';
        img = bpRect('pt-bp-hatch', sx + sw * 0.56, sy, sw * 0.44, sh);
        shapes.push(bpRect('pt-bp-rule', sx + sw * 0.56 - 1, sy, 1, sh));
      }
      shapes.push(img);
      // Pulled up off the safe line by its own gap rather than sitting
      // flush on it (the comp does the same — .bp .legal's bottom:20
      // sits 8px inside .bp .safe's own inset:12) — coincident dashes
      // read as one smudged line at this size, not a second zone.
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--legal', sx, sy + sh - legalH - legalGap, sw, legalH));
      let cy = anchor === 'start' ? copyY : anchor === 'end' ? copyY + copyH - blockH : copyY + (copyH - blockH) / 2;
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--logo', copyX, cy, logoW, logoH));
      cy += logoH + stackGap;
      shapes.push(bpRect('pt-bp-rule', copyX, cy, Math.round(copyW * 0.8), hlH));
      shapes.push(bpRect('pt-bp-rule', copyX, cy + hlH + hlGap, Math.round(copyW * 0.55), hlH));
      cy += hlH * 2 + hlGap + stackGap;
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--cta', copyX, cy, Math.round(copyW * 0.5), ctaH));
      return shapes;
    }
    // STRIP — too short for a per-layout map (the real system
    // collapses these too, ~L24600). Frame + safe + one headline rule
    // + CTA + a hatch on the image end, always, per the plan's own
    // simplification for this group. Headline rule is the same flat
    // 1px as BOX/TOWER.
    function bpStripShapes(w, h, inset) {
      const sx = inset, sy = inset, sw = w - inset * 2, sh = h - inset * 2;
      const hatchW = sw * 0.28;
      const copyW = sw - hatchW - Math.max(6, Math.round(sw * 0.03));
      const hlH = 1;
      const ctaW = Math.round(copyW * 0.3), ctaH = Math.max(6, Math.round(sh * 0.5));
      return [
        bpRect('pt-bp-hatch', sx + sw - hatchW, sy, hatchW, sh),
        bpRect('pt-bp-rule', sx, sy + (sh - hlH) / 2, Math.round(copyW * 0.6), hlH),
        bpRect('pt-bp-zone pt-bp-zone--cta', sx + copyW - ctaW, sy + (sh - ctaH) / 2, ctaW, ctaH)
      ];
    }
    // TOWER — same reasoning: stack logo/headline/CTA/legal top-down,
    // hatch fills whatever the stack leaves below, always.
    function bpTowerShapes(w, h, inset) {
      const sx = inset, sy = inset, sw = w - inset * 2, sh = h - inset * 2;
      const stackH = sh * 0.5;
      const logoH = Math.max(6, Math.round(stackH * 0.16)), logoW = Math.round(logoH * 1.15);
      const hlH = 1, hlGap = Math.max(2, Math.round(stackH * 0.05));
      const ctaH = Math.max(7, Math.round(stackH * 0.16));
      const legalH = Math.max(5, Math.round(stackH * 0.14));
      const gap = Math.max(3, Math.round(stackH * 0.06));
      let cy = sy;
      const shapes = [];
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--logo', sx, cy, logoW, logoH)); cy += logoH + gap;
      shapes.push(bpRect('pt-bp-rule', sx, cy, Math.round(sw * 0.86), hlH));
      shapes.push(bpRect('pt-bp-rule', sx, cy + hlH + hlGap, Math.round(sw * 0.6), hlH));
      cy += hlH * 2 + hlGap + gap;
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--cta', sx, cy, Math.round(sw * 0.55), ctaH)); cy += ctaH + gap;
      shapes.push(bpRect('pt-bp-zone pt-bp-zone--legal', sx, cy, sw, legalH));
      shapes.push(bpRect('pt-bp-hatch', sx, sy + stackH, sw, sh - stackH));
      return shapes;
    }
    function bpShapeHTML(s) {
      if (s.line) {
        return '<svg class="pt-bp-diagline" aria-hidden="true"><line x1="' + s.line[0] + '" y1="' + s.line[1] + '" x2="' + s.line[2] + '" y2="' + s.line[3] + '"/></svg>';
      }
      let style = 'left:' + s.x + 'px;top:' + s.y + 'px;width:' + s.w + 'px;height:' + s.h + 'px;';
      if (s.clip) style += 'clip-path:' + s.clip + ';';
      return '<div class="' + s.cls + '" style="' + style + '"></div>';
    }
    // 9/10 — the blue running the hairlines (Bryan: "little areas of
    // blue animating along the hairlines of the shapes... clean and
    // subtle but visually very striking", then: "a gradient matching
    // the hairline color, into a brighter blue, back into the hairline
    // color so it's a smooth gradient as it moves around the line
    // work"). SVG cannot run a gradient along a path, so the ramp is
    // built from RINGS: sixteen rects over the frame, each dashed to a run
    // centred on the same point, each run longer than the one inside
    // it, with its opacity solved so the rings' stacked coverage lands
    // on a bell curve — near-transparent at the ends (the hairline's
    // own grey shows through) rising to the accent at the centre.
    // pathLength="1000" makes every rect's perimeter 1000 units
    // whatever its size; the dash pattern repeats every 3000, so each
    // frame is lit for one lap in three and dark for two — about a
    // third of the board carries a ramp at any moment. All rings share
    // one dash-offset animation, so the ramp travels as one; speed is
    // a constant ~80px/s (duration follows the perimeter); phase and
    // direction come from a seeded rng, so a re-render never reshuffles
    // them. Reduced motion hides the layer.
    function bpTraceHTML(w, h, r) {
      const perim = 2 * (w + h);
      const span = Math.min(320, Math.max(48, perim * 0.26)); // the whole ramp, end to end — long and slow, an aura not a highlight
      const RINGS = 16; // ~7px per step on a leaderboard's ramp — reads as one gradient, not bands
      const toU = (px) => Math.max(0.5, px / perim * 1000);
      const cycle = (perim / 60) * 3;
      const dur = cycle.toFixed(2) + 's', delay = (-(r() * cycle)).toFixed(2) + 's';
      const dir = r() < 0.5 ? 'pt-bp-trace-cw' : 'pt-bp-trace-ccw';
      const profile = (x) => Math.min(0.5, 0.52 * Math.exp(-(x * x) / 0.3)); // x: 0 at the centre, 1 at either end; peaks at half strength (ghosted, 9/10)
      let rects = '', covered = 0;
      for (let i = RINGS; i >= 1; i--) {
        const target = profile((i - 0.5) / RINGS);
        const alpha = Math.max(0, Math.min(1, (target - covered) / (1 - covered)));
        covered = target;
        const half = toU(span * i / RINGS / 2);
        rects += '<rect x="0.5" y="0.5" width="' + Math.max(0, w - 1) + '" height="' + Math.max(0, h - 1) + '" pathLength="1000" style="stroke-dasharray:' + half.toFixed(2) + ' ' + (3000 - 2 * half).toFixed(2) + ' ' + half.toFixed(2) + ' 0;opacity:' + alpha.toFixed(3) + ';animation-name:' + dir + ';animation-duration:' + dur + ';animation-delay:' + delay + '"/>';
      }
      return '<svg class="pt-bp-trace" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + rects + '</svg>';
    }
    function bpUnitHTML(u, isSelected, layoutId, scale, r, noTrace) {
      const inset = bpSafeInset(scale);
      const shapes = u.group === 'box' ? bpBoxShapes(u.w, u.h, inset, layoutId)
        : u.group === 'strip' ? bpStripShapes(u.w, u.h, inset)
        : bpTowerShapes(u.w, u.h, inset);
      return '<div class="pt-bp-unit' + (isSelected ? ' is-selected' : '') + '" data-bp-size="' + u.id + '" style="left:' + u.x + 'px;top:' + u.y + 'px;width:' + u.w + 'px;height:' + u.h + 'px;">' +
        '<div class="pt-bp-tag">' + u.id.replace('x', '\u00d7') + '</div>' +
        '<div class="pt-bp-frame"></div>' +
        '<div class="pt-bp-safe" style="inset:' + inset + 'px;"></div>' +
        shapes.map(bpShapeHTML).join('') +
        (noTrace ? '' : bpTraceHTML(u.w, u.h, r)) +
      '</div>';
    }
    // Diffs (size, template) before touching the DOM — the colour
    // pill calls this exact same path on every swatch click
    // (wireSetPill has no per-pill branch) and must not re-touch the
    // sheet at all, per the plan's own "the colour pill does not
    // touch the blueprint." aria-hidden: nine dimension numbers are
    // already spoken for by the pills themselves; nothing here is a
    // second source of truth a screen reader user would need.
    // The spotlight's motion: a slow wander — two incommensurate sines
    // per axis, so the path never quite repeats and never reads as a
    // loop. Both the disc and the copy inside it move by transform on
    // their own composited layers (will-change), so a frame costs the
    // compositor two matrix updates and nothing re-rasterises. The loop
    // ends itself when the takeover closes or the board is rebuilt, and
    // restarts from renderMmBlueprintSheet on the next open; the clock
    // keeps running across opens so the light never jumps.
    let bpWaveRAF = 0, bpWaveT0 = 0;
    function bpWaveStop() { if (bpWaveRAF) cancelAnimationFrame(bpWaveRAF); bpWaveRAF = 0; }
    function bpWaveStart(sheet, alive) {
      bpWaveStop();
      if (!sheet || mmReducedMotion()) return;
      const isAlive = alive || (() => mmOpen); // the resting board lives with the takeover; the build skeleton (showSheetSkeleton) passes its own
      const spot = sheet.querySelector('.pt-bp-spot'), wave = sheet.querySelector('.pt-bp-wave');
      if (!spot || !wave) return;
      const W = sheet.offsetWidth, H = sheet.offsetHeight;
      const d = Math.round(Math.max(W, H) * 0.74); // the disc: wide enough to hold several units at once
      spot.style.width = d + 'px'; spot.style.height = d + 'px';
      wave.style.width = W + 'px'; wave.style.height = H + 'px';
      if (!bpWaveT0) bpWaveT0 = performance.now();
      const tick = (now) => {
        bpWaveRAF = 0;
        if (!isAlive() || !sheet.isConnected) return;
        const t = (now - bpWaveT0) / 1000;
        const x = W * (0.5 + 0.44 * Math.sin(t * 0.115 + 0.6) + 0.13 * Math.sin(t * 0.31 + 1.9));
        const y = H * (0.5 + 0.42 * Math.sin(t * 0.083) + 0.13 * Math.cos(t * 0.24 + 0.7));
        spot.style.transform = 'translate3d(' + (x - d / 2).toFixed(1) + 'px,' + (y - d / 2).toFixed(1) + 'px,0)';
        wave.style.transform = 'translate3d(' + (d / 2 - x).toFixed(1) + 'px,' + (d / 2 - y).toFixed(1) + 'px,0)';
        bpWaveRAF = requestAnimationFrame(tick);
      };
      bpWaveRAF = requestAnimationFrame(tick);
    }
    // 9/10 — the per-frame ramps (bpTraceHTML) are OFF: Bryan, once the
    // spotlight landed — "disable this type of moving gradient and just
    // leave the large background one." The code stays so the traces are
    // one flag away; the spotlight (bpWaveStart) is the board's only
    // motion now.
    const BP_TRACES_ON = false;
    let bpLastKey = null;
    let bpBoardMemo = null; // { key, board } — the solve is ~100ms; the template pill must not pay it again
    function renderMmBlueprintSheet(forceInstant) {
      const grid = document.getElementById('ptMediaModeGrid');
      const stageEl = document.querySelector('.pt-mm-stage');
      if (!grid || !stageEl) return;
      const sizeId = mediaSetup.sizes[0] || SIZES[0].id;
      // M.1: Split at rest, not templateLayoutId()'s own 'diagonal'
      // default — the diagonal hatch covered most of every box and
      // read heavy across a whole sheet of them. The pill's own
      // default (an unpicked template still GENERATES diagonal) is
      // untouched; this is the sheet's own fallback only.
      const layoutId = mediaSetup.templates.length ? templateLayoutId(mediaSetup.templates[0]) : 'split'; // AW.1 — a list now; the sheet's own fallback reads the first pick
      // The board fills the stage inside its own 24px padding, minus
      // whatever else the stage shows (caption, title) and the tag
      // clearance above the first band.
      let otherH = 0;
      Array.prototype.forEach.call(stageEl.children, (c) => { if (c !== grid && c.offsetParent !== null && c.offsetHeight) otherH += c.offsetHeight + 20; });
      const availW = Math.max(240, stageEl.clientWidth - 48);
      const availH = Math.max(180, stageEl.clientHeight - 48 - otherH - BP_TOP_RESERVE);
      const boardKey = availW + 'x' + availH + '|' + sizeId;
      const key = boardKey + '|' + layoutId;
      const alreadyMounted = !!grid.querySelector('.pt-bp-sheet');
      if (alreadyMounted && key === bpLastKey && !forceInstant) { bpWaveStart(grid.querySelector('.pt-bp-sheet')); return; } // same board: only make sure the spotlight is running
      const doFade = alreadyMounted && key !== bpLastKey && !forceInstant && !mmReducedMotion();
      bpLastKey = key;
      const build = () => {
        grid.classList.remove('pt-mm-grid-rows');
        if (!bpBoardMemo || bpBoardMemo.key !== boardKey) bpBoardMemo = { key: boardKey, board: bpSolveBoard(availW, availH, { sizeId: sizeId }) };
        const board = bpBoardMemo.board;
        if (!board) { grid.innerHTML = ''; return; }
        const units = bpBoardUnits(board);
        const r = bpRng(11); // the traces' own phase/direction — a fixed seed, so a re-render never reshuffles them
        const bw = Math.round(board.W * board.scale), bh = Math.round(board.H * board.scale);
        let html = '<div class="pt-bp-sheet" aria-hidden="true" style="width:' + bw + 'px;height:' + (bh + BP_TOP_RESERVE) + 'px;">';
        let lit = false; // .is-selected lands on the first unit of the test size (it draws nothing different — the hook stays)
        let wave = '';
        units.forEach((u) => {
          u.x = Math.round(u.x); u.y = Math.round(u.y) + BP_TOP_RESERVE; u.w = Math.round(u.w); u.h = Math.round(u.h);
          const sel = !lit && u.id === sizeId;
          if (sel) lit = true;
          html += bpUnitHTML(u, sel, layoutId, board.scale, r, !BP_TRACES_ON);
          wave += bpUnitHTML(u, sel, layoutId, board.scale, r, true);
        });
        // 9/10 — the SPOTLIGHT WAVE: a second copy of every unit, drawn
        // in the accent, inside a disc-masked window that wanders over
        // the board (bpWaveStart). Wherever the disc passes, the line
        // work beneath turns from the ghosted grey to a soft blue and
        // back at its edge — the trace's own grey→blue→grey ramp, as a
        // light moving behind the canvas rather than a run along one
        // frame.
        html += '<div class="pt-bp-spot" aria-hidden="true"><div class="pt-bp-wave">' + wave + '</div></div>';
        html += '</div>';
        grid.innerHTML = html;
        bpWaveStart(grid.querySelector('.pt-bp-sheet'));
      };
      if (!doFade) { build(); return; }
      grid.classList.add('is-swapping');
      setTimeout(() => {
        build();
        grid.classList.remove('is-swapping');
      }, 220);
    }
    // Debounced relayout on real window resize — same 120ms/passive
    // convention window's own resize listener uses for
    // scheduleFitAllBannerScales above. forceInstant:true skips both
    // the memo-skip and the fade: a resize isn't a pill change, it's
    // the same sheet at a new scale.
    let _bpResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_bpResizeTimer);
      _bpResizeTimer = setTimeout(() => { if (mmOpen) { if (MM_REST_STYLE === 'blueprint') renderMmBlueprintSheet(true); else renderMmTemplate(); } }, 120); // AO.1 — live in every Guided step too, not just the settings row
    }, { passive: true });

    // ═══ 9/10 — MEDIA MODE RESTING STATE (Bryan: "we generally have the
    //     right side of canvas have a blank space that will warp to look
    //     like a template of the outputs based on the selections in the
    //     chat hat — I think we have to do that so they all feel of a
    //     piece… same style thing for the media banners"). The studio's
    //     blank viewfinder cells, one per unit the brief will produce,
    //     at the board size's aspect. The blueprint board (§M) stays
    //     one word away: MM_REST_STYLE = 'blueprint'. ═══
    const MM_REST_STYLE = 'template'; // 'template' | 'blueprint' (archived — _qa/archive/blueprint-board)
    // canvas-graphics' computeGhostLayout, with one addition: a fixed
    // column count, so the cells sit the way the sheet will lay its
    // cards (three variants to a row; wide sizes one to a line). 7% of
    // the short side kept clear all round, 18px between cells, best-fit
    // when the columns are free.
    function computeGhostLayout(count, aspect, availW, availH, fixedCols) {
      aspect = (aspect > 0 && isFinite(aspect)) ? aspect : 1;
      availW = Math.max(40, availW || 0);
      availH = Math.max(40, availH || 0);
      const pad = Math.round(Math.min(availW, availH) * 0.07);
      availW = Math.max(40, availW - pad * 2);
      availH = Math.max(40, availH - pad * 2);
      const gap = 18;
      let best = null;
      const tryCols = (cols) => {
        const rows = Math.ceil(count / cols);
        const cellAvailW = (availW - gap * (cols - 1)) / cols;
        const cellAvailH = (availH - gap * (rows - 1)) / rows;
        // floor 8, not 40: nine rows of skyscrapers must still fit the stage (a 40px floor pushed 160x600 x 9 x 5 off both ends)
        const w = Math.max(8, Math.min(cellAvailW, cellAvailH * aspect));
        if (!best || w > best.w) best = { cols: cols, rows: rows, w: w };
      };
      if (fixedCols) tryCols(Math.max(1, Math.min(count, fixedCols)));
      else for (let cols = 1; cols <= count; cols++) tryCols(cols);
      const cols = best.cols, w = best.w, h = w / aspect;
      const lastRowCount = count - cols * (best.rows - 1);
      const gridW = cols * w + (cols - 1) * gap;
      const gridH = best.rows * h + (best.rows - 1) * gap;
      const originX = (availW - gridW) / 2;
      const originY = (availH - gridH) / 2;
      const cells = [];
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const inLastRow = row === best.rows - 1;
        const rowCount = inLastRow ? lastRowCount : cols;
        const rowW = rowCount * w + (rowCount - 1) * gap;
        const rowOriginX = originX + (gridW - rowW) / 2;
        const col = i - row * cols;
        cells.push({ x: pad + rowOriginX + col * (w + gap), y: pad + originY + row * (h + gap), w: w, h: h });
      }
      return cells;
    }
    function mmBoardSizeId() {
      return (typeof brief !== 'undefined' && brief && brief.boardSize) || (mediaSetup.sizes && mediaSetup.sizes[0]) || '300x250';
    }
    function mmVolume() {
      const b = (typeof brief !== 'undefined' && brief) || {};
      return { concepts: b.concepts || SHEET_ROWS, variants: b.variants || VARIANTS_PER_ROW };
    }
    /* §BS — "a Style is picked" means the Styles pill's exclusive brand
       guide pick, not a generic Layouts pick (mediaSetup.templates
       holds either — see openTemplateSetMenu/openStyleSetMenu above).
       SET_BRAND_BY_ID only resolves guide ids, so this reads as null
       for Generated, a bare layout pick, or nothing picked at all —
       exactly when the resting canvas's blanks stay neutral (no guide
       colorway/logo) rather than the guide's own branded look. */
    function mmActiveGuide() {
      return (mediaSetup.templates.length === 1 && SET_BRAND_BY_ID[mediaSetup.templates[0]]) || null;
    }
    // §BS (coordinator amendment, 9/18) — "the blue wireframe layout
    // glyphs drawn inside the resting canvas... retire everywhere" and
    // "one resting recipe: blanks, neutral or branded." The old
    // viewfinder-cell SVG (c4-studio-ghost-finder/c4-vf-ambient/
    // c4-vf-thirds) and its per-row layout glyph (vfRowLayoutWireframeHTML,
    // VF_GENERATED_INNER — both retired with it, along with their CSS
    // in 23-media-mode-a.css) are gone; renderTemplateBlankCellContent
    // below is the ONLY thing drawn in a resting-canvas cell now, with
    // no style picked = this neutral grey, no-logo look.
    const PT_TMPL_NEUTRAL_COLOR = { ground: '#F4F4F5', ink: '#B7B7BC', accent: '#B7B7BC', tint: 0 };
    // Lays the cells out for the brief as it stands and keeps the same
    // elements across calls, so a new board size morphs every cell in
    // place (the transitions on .c4-studio-ghost) and a new volume only
    // adds or retires cells. First paint after an open staggers them in.
    function renderMmTemplate() {
      const host = document.getElementById('ptMediaModeGhosts');
      if (!host) return;
      const sizeId = mmBoardSizeId();
      const d = bpDimsOf(sizeId);
      const vol = mmVolume();
      const count = Math.max(1, vol.concepts * vol.variants); // uncapped: the canvas shows exactly the picker's grid (9 x 5 is nine rows of five, not a 24-cell sample)
      // 9/10 (Bryan: "the volume grid and the right side of the canvas
      // should look the same in their structure") — concepts down,
      // variants across, whatever the shape; the cells scale to fit
      // the stage rather than a wide size falling into one column.
      const cells = computeGhostLayout(count, d.w / d.h, host.clientWidth, host.clientHeight, vol.variants);
      const existing = Array.prototype.slice.call(host.querySelectorAll('.c4-studio-ghost'));
      const entering = existing.length === 0;
      // §BS (amended) — ONE resting recipe always: real banner blanks,
      // each cell still sharing .pt-vf-cell's own box/reveal/morph
      // transitions (unchanged below). No guide picked = neutral grey,
      // no logo; a picked Style swaps in its own colorway/logo — see
      // renderTemplateBlankCellContent.
      const guide = mmActiveGuide();
      const fresh = [];
      cells.forEach((c, i) => {
        let el = existing[i];
        if (!el) {
          el = document.createElement('div');
          el.className = 'c4-studio-ghost pt-vf-cell'; // AE.2 — pt-vf-cell carries the shared recipe now; c4-studio-ghost kept as a bare hook (nothing left keyed off it, harmless to keep)
          host.appendChild(el);
          fresh.push(el);
        }
        el.style.left = c.x.toFixed(1) + 'px';
        el.style.top = c.y.toFixed(1) + 'px';
        el.style.width = c.w.toFixed(1) + 'px';
        el.style.height = c.h.toFixed(1) + 'px';
        // Always redrawn: size/layout/colorway/guide can all change
        // while resting, and a real banner is cheap to redo across 9
        // cells. row = Math.floor(i / vol.variants) — how
        // computeGhostLayout itself laid the grid out with
        // vol.variants as its fixed column count (concepts down,
        // variants across) — feeds the neutral case's own per-row
        // Layouts-pill variety (AW.5's old rule, now drawn as a real
        // layout instead of a wireframe glyph).
        renderTemplateBlankCellContent(el, c, sizeId, guide, Math.floor(i / vol.variants), i);
      });
      existing.slice(cells.length).forEach((el) => {
        el.classList.remove('is-visible');
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      });
      if (fresh.length) {
        // the studio's own entrance: rise + fade, 60ms apart, only on the way in
        fresh.forEach((el, i) => { el.style.transitionDelay = entering ? (300 + i * 60) + 'ms' : '0ms'; });
        void host.offsetWidth;
        requestAnimationFrame(() => {
          fresh.forEach((el) => el.classList.add('is-visible'));
          setTimeout(() => fresh.forEach((el) => { el.style.transitionDelay = ''; }), 1200);
        });
      }
    }
    /* §BS — one cell of the resting canvas's template blanks: a REAL
       .pt-banner (the same builder generation itself uses,
       buildStageBannerElForSize — no second "preview" drawing to drift
       out of sync), rendered from an empty reference set (no image/
       line refs — BR.5's own hook to fill slots in later), then scaled
       down to the cell's own box exactly the way a sheet card or a
       Studio size tile is (natural px, transform: scale, top-left
       origin). el is already positioned/sized by the caller; this only
       ever touches its content.
       No guide (nothing picked, a bare Layouts pick, or Generated):
       neutral grey (PT_TMPL_NEUTRAL_COLOR), no logo, and the layout
       comes from mediaSetup.templates itself — one per row when
       several are picked (rowIdx cycles through them, same rule the
       retired wireframe glyph used), 'diagonal' when Generated (no
       single shape to preview when the model would be the one
       choosing). A guide picked: its own colorway (or the override)
       and real logo, one layout for every row (a guide is a whole
       look, always a single exclusive pick). */
    // §BR.5 — the copy-deck + attached images the hat's + attach takes
    // in BEFORE Send (the upload that §BQ removed from Studio moves
    // here). Pools, not the campaign store: a blank has no unit id to
    // hang an assets.lines/images reference off yet (§BS — "resting
    // surface only… no unit IDs"), so this stays a staging area the
    // blanks read directly and Generate drains into the real store via
    // the normal registerLineAsset/registerImageAsset door (below).
    // Empty until content arrives, and everything reads that emptiness
    // the same way flowPoolsEmpty() does — blanks stay the plain
    // checker/bar recipe and Generate deals its pools exactly as
    // today, this phase's own contract line.
    const flowPools = { headlines: [], ctas: [], legal: [], images: [] };
    // Set only for the units a Generate actually composed from
    // flowPools (resetFlowCombosForGenerate, called from
    // buildConceptSheetDOM); null the rest of the time, which is what
    // lets varietyFor/applyBannerCopyOverrides (19-sheet-c-variety.js)
    // fall through to their original per-pool dealing untouched.
    let brFlowCombos = null;
    function flowPoolsEmpty() {
      return !flowPools.headlines.length && !flowPools.ctas.length && !flowPools.legal.length && !flowPools.images.length;
    }
    // A line's role: an explicit "Headline:"/"CTA:"/"Legal:" (or
    // "Disclaimer:") prefix, else the bare line reads as a headline —
    // "just paste your lines" is the common case a deck is pasted for.
    const FLOW_ROLE_RE = /^\s*(headline|cta|legal|disclaimer)\s*[:\-]\s*(.+)$/i;
    function flowRoleAndText(raw) {
      const s = String(raw == null ? '' : raw).trim();
      if (!s) return null;
      const m = s.match(FLOW_ROLE_RE);
      if (m) {
        const role = m[1].toLowerCase() === 'disclaimer' ? 'legal' : m[1].toLowerCase();
        return { role: role, text: m[2].trim() };
      }
      return { role: 'headline', text: s };
    }
    // Real parse — txt, csv or pasted text, one line/row each. A CSV
    // whose first cell is a bare role word ("headline,Coast Road…")
    // reads that column as the role; anything else falls back to the
    // prefix/bare-line sniff above, so a plain comma-free txt deck and
    // a role-columned CSV both land right.
    const FLOW_ROLE_WORD_RE = /^(headline|cta|legal|disclaimer|body|copy)$/i;
    function parseFlowDeckText(text) {
      const out = { headlines: [], ctas: [], legal: [] };
      String(text == null ? '' : text).split(/\r\n|\r|\n/).forEach((line) => {
        if (!line || !line.trim()) return;
        const cells = line.split(',');
        let rec = null;
        if (cells.length > 1 && FLOW_ROLE_WORD_RE.test(cells[0].trim())) {
          const word = cells[0].trim().toLowerCase();
          const role = word === 'disclaimer' ? 'legal' : (word === 'body' || word === 'copy' ? 'headline' : word);
          const rest = cells.slice(1).join(',').trim();
          if (rest) rec = { role: role, text: rest };
        } else {
          rec = flowRoleAndText(line);
        }
        if (!rec || !rec.text) return;
        if (rec.role === 'cta') out.ctas.push(rec.text);
        else if (rec.role === 'legal') out.legal.push(rec.text);
        else out.headlines.push(rec.text);
      });
      return out;
    }
    // docx/pdf have no lightweight in-browser reader here — this reads
    // a fixed, labelled-as-such fixture deck (the same "canned parse"
    // trade the Guided step's own CORVACHE_DECK upload tile already
    // makes, 14-hat-a-files.js) rather than the file's real bytes.
    // txt/csv/pasted text above is a REAL parse, not this fixture.
    const FLOW_DECK_FIXTURE_BINARY = {
      headlines: ['Built for the road ahead.', 'Precision, uncompromised.', 'Every mile, engineered.', 'The Corvache way forward.'],
      ctas: ['Explore the lineup', 'Book a test drive', 'See offers'],
      legal: ['See dealer for details. Offer ends soon.']
    };
    function flowMergeDeck(deck) {
      let added = false;
      ['headlines', 'ctas', 'legal'].forEach((k) => {
        (deck[k] || []).forEach((t) => {
          if (flowPools[k].indexOf(t) === -1) { flowPools[k].push(t); added = true; }
        });
      });
      return added;
    }
    function flowMergeImage(url) {
      if (!url || flowPools.images.indexOf(url) !== -1) return false;
      flowPools.images.push(url);
      return true;
    }
    // §BY — the one place a pool entry ever leaves: un-picking a frame
    // in the Imagery overlay (syncImageryChipsFromState below) needs
    // the blanks' live re-deal to actually shrink, not just the pill
    // count — flowMergeImage/flowMergeDeck stay additive-only for
    // every other door (a deck line or a `+`-attached file has no
    // "un-pick" gesture to hang this off).
    function flowRemoveImage(url) {
      const i = url ? flowPools.images.indexOf(url) : -1;
      if (i === -1) return false;
      flowPools.images.splice(i, 1);
      return true;
    }
    // Wired onto window._ptOnAnyFileAdded (14-hat-a-files.js) as the
    // fallback when no Guided copy editor is mounted — the SAME real
    // paste/drop/picker plumbing (initChatAttachments, 12-shell-c-
    // chat.js) that already feeds a copy deck there feeds this pool
    // instead while the hat's NEW MEDIA SETTINGS row is up. Only
    // engages there (settingsStepMounted) — a file added anywhere else
    // (a resolved board's own chat, Studio's chat door) is left alone.
    window._ptFlowIntakeFile = function (file, chipId) {
      if (!file || !settingsStepMounted()) return;
      const isImage = (file.type || '').startsWith('image/');
      if (isImage) {
        // The chip already minted its own object URL (addFile); a
        // second one over the same Blob is harmless and keeps this
        // pool independent of the composer's own chip bookkeeping.
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          if (flowMergeImage(URL.createObjectURL(file))) renderMmGhosts();
        }
        return;
      }
      const ext = (file.name || '').split('.').pop().toLowerCase();
      if (/^(docx?|pdf)$/.test(ext)) {
        if (flowMergeDeck(FLOW_DECK_FIXTURE_BINARY)) renderMmGhosts();
        return;
      }
      if (typeof FileReader === 'undefined') return;
      const reader = new FileReader();
      reader.onload = () => {
        if (flowMergeDeck(parseFlowDeckText(reader.result))) renderMmGhosts();
      };
      reader.readAsText(file);
    };
    // A gallery pick (amiFromGallery) never was a File, so it never
    // reaches _ptFlowIntakeFile above — wrapped here instead, the one
    // other door attached imagery arrives through (_caAddLibraryItem,
    // 12-shell-c-chat.js, already assigned by the time this file's own
    // top-level code runs — script order, src/manifest.json).
    (function wrapGalleryPickForFlowPools() {
      const orig = window._caAddLibraryItem;
      if (typeof orig !== 'function') return;
      window._caAddLibraryItem = function (item) {
        const rec = orig(item);
        if (rec && rec.kind === 'image' && rec.url && settingsStepMounted()) {
          if (flowMergeImage(rec.url)) renderMmGhosts();
        }
        return rec;
      };
    })();
    // A multi-line message sent while the settings row is up (no
    // dedicated deck textarea here, unlike the Guided row's own "…or
    // paste it here") is read as a pasted deck — "or pasted text," the
    // attach menu's contract line — never a single-line brief, which
    // this never touches. Called from _ptMediaSettingsSubmit below,
    // ahead of the generate it triggers either way.
    function flowIntakePastedText(text) {
      if (!text || text.indexOf('\n') === -1) return;
      flowMergeDeck(parseFlowDeckText(text));
    }
    // §BR.5 — n DISTINCT (image, headline, CTA) triples out of the
    // pools, spread as evenly as their sizes allow, in place of the
    // independent per-pool modulo dealing varietyFor/
    // applyBannerCopyOverrides otherwise use. Greedy: every slot takes
    // the least-used image/headline/CTA index that keeps the triple
    // novel; once the pools' own combinations run out (fewer than n),
    // there is nothing left to avoid repeating, so it falls back to
    // plain round-robin from there. ii/hh/cc (the POOL index, not the
    // unit's) ride along so applyBannerCopyOverrides can register the
    // shared line/image id a repeated pick should share, same as the
    // default per-pool dealing already does.
    function composeNovelTriples(images, headlines, ctas, n) {
      const I = images.length ? images.slice() : [null];
      const H = headlines.length ? headlines.slice() : [null];
      const C = ctas.length ? ctas.slice() : [null];
      const maxCombos = I.length * H.length * C.length;
      const useI = I.map(() => 0), useH = H.map(() => 0), useC = C.map(() => 0);
      const seen = {};
      const byUsage = (counts) => counts.map((c, idx) => idx).sort((a, b) => counts[a] - counts[b] || a - b);
      const out = [];
      for (let k = 0; k < n; k++) {
        let pick = null;
        if (Object.keys(seen).length < maxCombos) {
          const iOrder = byUsage(useI), hOrder = byUsage(useH), cOrder = byUsage(useC);
          outer:
          for (let a = 0; a < iOrder.length; a++) {
            for (let b = 0; b < hOrder.length; b++) {
              for (let c = 0; c < cOrder.length; c++) {
                const ii = iOrder[a], hh = hOrder[b], cc = cOrder[c];
                const key = ii + ':' + hh + ':' + cc;
                if (!seen[key]) { pick = { ii: ii, hh: hh, cc: cc }; break outer; }
              }
            }
          }
        }
        if (!pick) pick = { ii: k % I.length, hh: k % H.length, cc: k % C.length };
        seen[pick.ii + ':' + pick.hh + ':' + pick.cc] = true;
        useI[pick.ii]++; useH[pick.hh]++; useC[pick.cc]++;
        out.push({ image: I[pick.ii], headline: H[pick.hh], cta: C[pick.cc], ii: pick.ii, hh: pick.hh, cc: pick.cc });
      }
      return out;
    }
    // Called once per fresh (non-append) Generate, from
    // buildConceptSheetDOM right where it clears assets.images/lines
    // for the same reason: a new board starts its own combo deal. null
    // when the pools are empty — every existing per-pool dealer keeps
    // running exactly as before.
    function resetFlowCombosForGenerate(totalUnits) {
      brFlowCombos = flowPoolsEmpty() ? null : composeNovelTriples(flowPools.images, flowPools.headlines, flowPools.ctas, totalUnits);
    }
    // QA hook (the _ptAssetsDebug/_ptStudioDebug convention: read-
    // only, a fresh plain object per call) — a probe reads this to
    // confirm the pools actually filled before Send and that Generate
    // composed the combos it claims to have.
    window._ptFlowDebug = function () {
      return {
        pools: JSON.parse(JSON.stringify(flowPools)),
        combos: brFlowCombos ? JSON.parse(JSON.stringify(brFlowCombos)) : null
      };
    };
    function renderTemplateBlankCellContent(el, cellRect, sizeId, guide, rowIdx, dealIdx) {
      const d = bpDimsOf(sizeId);
      const list = mediaSetup.templates;
      const layoutId = guide
        ? templateLayoutId(guide.id)
        : (templatesIsGenerated(list) ? 'diagonal' : templateLayoutId(list[rowIdx % list.length]));
      // §BR.5 — the flow-in pools deal into the blanks the same simple
      // way varietyFor deals the real sheet: by index, wrapping. Empty
      // pools mean every field below stays '' / null, which is exactly
      // the pre-BR.5 blank (this function's own §BS contract,
      // untouched when nothing has arrived yet).
      const i = dealIdx || 0;
      const flowHeadline = flowPools.headlines.length ? flowPools.headlines[i % flowPools.headlines.length] : '';
      const flowCta = flowPools.ctas.length ? flowPools.ctas[i % flowPools.ctas.length] : '';
      const flowLegal = flowPools.legal.length ? flowPools.legal[i % flowPools.legal.length] : '';
      const flowImage = flowPools.images.length ? flowPools.images[i % flowPools.images.length] : null;
      const st = {
        concept: null,
        isTemplateBlank: true,
        sizeId: sizeId,
        layoutId: layoutId,
        headline: flowHeadline, cta: flowCta, disclaimer: flowLegal, imageSrc: flowImage, framings: {}, offsets: {}
      };
      if (guide) {
        st.colorway = mediaSetup.colorways[0] || guide.colorway;
      } else {
        st.colorway = 'custom';
        st.customColor = PT_TMPL_NEUTRAL_COLOR;
        st.noLogo = true;
        // Coordinator review, 9/18 — tells buildStageBannerElForSize
        // (19-sheet-c-variety.js) this banner's colorway is the
        // placeholder trim, not a real one, so a slot that fills (an
        // attached image, a deck line) can render at full fidelity per
        // field instead of painting through PT_TMPL_NEUTRAL_COLOR's own
        // quiet grey — a guide's own colorway never sets this (it is
        // always a real, legible one already).
        st.isNeutralBlank = true;
      }
      const banner = buildStageBannerElForSize(sizeId, st);
      const scale = d.w > 0 ? cellRect.w / d.w : 1;
      banner.style.width = d.w + 'px';
      banner.style.height = d.h + 'px';
      banner.style.transform = 'scale(' + scale + ')';
      banner.style.transformOrigin = 'top left';
      // §BR.5 — the house blur-fade (pt-tmpl-fill-flash, 21-sheet-b.css
      // — the panel eyebrow's own flash keyframe, reused rather than a
      // bespoke one) plays on a cell whose dealt content just changed,
      // so a slot filling while resting reads as a reveal rather than
      // a silent swap. A fresh cell (no prior signature) never flashes
      // — nothing to reveal over yet.
      const sig = flowHeadline + '|' + flowCta + '|' + flowLegal + '|' + (flowImage || '');
      const prevSig = el.getAttribute('data-tmpl-fill-sig');
      el.innerHTML = '';
      el.appendChild(banner);
      if (prevSig !== null && prevSig !== sig) banner.classList.add('pt-tmpl-fill-in');
      el.setAttribute('data-tmpl-fill-sig', sig);
    }
    function renderMmGhosts() {
      // AO.1 — every Guided step and the settings row share ONE
      // stage: the resting viewfinder (.pt-vf-cell cells at the live
      // brief), never a second treatment. The legacy per-size ghost
      // grid (renderMmGhostsForSizes/mmCheckedSizeIds, wizardStep===3
      // only) and the steps-0-2 idle OMNI mark (renderMmGhostsDefault)
      // both retire — nothing else draws here. mmOpen false only
      // means the settings row sits over an already-resolved sheet
      // (no takeover to draw into).
      if (mmOpen) { if (MM_REST_STYLE === 'blueprint') renderMmBlueprintSheet(); else renderMmTemplate(); }
    }
    // AO.1 — retired: this caption ("3 concepts · Coast Road") drew
    // UNDER the legacy ghost grid's own rows, which had the height to
    // clear it. Now that every Guided step shares the resting
    // .pt-vf-cell viewfinder (which the settings row's stage already
    // used caption-free), the caption's plain-flow <p> lands mid-grid
    // and shows through the cell gutters — exactly the "nothing else
    // draws on the stage" AO.1 rules out. #ptMediaModeCaption stays in
    // the DOM (:empty, so inert/invisible) rather than an unrelated
    // markup edit this pass didn't need to make.
    function updateMmCaption() {}
    // AH.1 — one meta piece: an optional glyph (the hat's own Size/
    // Volume pill builders, never a new path) plus its mono value,
    // joined by the suffix's own 10px flex gap (CSS). A piece with no
    // glyph (Package, Selects, the Guided count) is plain mono text
    // in the same voice.
    // AL.6 — retired: the bar's title is the name alone now, no meta
    // suffix, so this glyph+text piece builder has no caller left.
    // AH.1 — the board/live-brief meta: the size pill's own
    // proportional outline glyph (setSizePreview — the 300×250
    // rectangle, the 728×90 bar, the 160×600 slot, whatever the size
    // actually is) then the size; the Volume pill's own grid glyph
    // (SET_ICONS.count) then "c × v"; the campaign name last, plain,
    // only once a board is up ("no campaign name" at rest).
    // AL.6 \u2014 retired alongside mmMetaPieceHTML above (no caller left;
    // every setMmTitleText call now passes '' for the suffix).
    // AH.1 — the rest state's own vol: mmBoardSizeId/mmVolume (the
    // live brief the pills hold), shaped like liveBoardVol()'s own
    // {boardSize,concepts,variants} so mmVolMetaHTML takes either.
    // AL.6 — retired: mmVolMetaHTML (its one caller) is gone too.
    // Studio-title voice (canvas-graphics S33): sans 15px/600 main +
    // Fira Code suffix, one small crossfade on change — same .is-
    // changing dip technique setAuxTitle() above already uses.
    // AH.1 — suffix is now HTML (one or more mmMetaPieceHTML pieces),
    // not a plain string, so the DOM write is innerHTML; the dip's
    // own equality guard compares the last HTML actually written
    // (cached on the element) rather than rendered textContent, which
    // could never equal a string that carries markup.
    function setMmTitleText(main, suffix) {
      const mainEl = document.getElementById('ptMediaModeTitleMain');
      const suffixEl = document.getElementById('ptMediaModeTitleSuffix');
      if (!mainEl || !suffixEl) return;
      if (mainEl.textContent === main && suffixEl.dataset.html === suffix) return;
      if (mmReducedMotion()) { mainEl.textContent = main; suffixEl.innerHTML = suffix; suffixEl.dataset.html = suffix; return; }
      mainEl.classList.add('is-changing');
      suffixEl.classList.add('is-changing');
      setTimeout(() => {
        mainEl.textContent = main;
        suffixEl.innerHTML = suffix;
        suffixEl.dataset.html = suffix;
        mainEl.classList.remove('is-changing');
        suffixEl.classList.remove('is-changing');
      }, 180);
    }
    function updateMmTitle() {
      // AJ.0 — with a board on the sheet, the bar speaks for the board;
      // a pill pick in the hat (the next generation) never retitles it.
      const resting = (typeof mmOpen !== 'undefined') && mmOpen;
      const bUp = boards[boardCur];
      if (bUp && !resting && document.querySelector('#ptConcepts > .pt-concept-group')) {
        setMmTitleText(bUp.name, ''); // AR.2 — the name, not the number ("Board 1")
        return;
      }
      // AO.1 — every Guided step reads the same "New media" the
      // settings row and the true rest state already do (the retired
      // ghost-grid branch used to read "Coast Road" here at
      // wizardStep 3 alone).
      setMmTitleText('New media', '');
    }
    function syncMediaModeStage() {
      updateMmTitle();
      updateMmCaption();
      renderMmGhosts();
      syncMediaTopbar(); // Fix Y — a board on the canvas outranks updateMmTitle's "New media"/pill-count guess (e.g. a pill tweak after Board 1 lands must not blank the bar back to "New media")
    }

    // 8/25 redesign: Bryan rejected the post-generation hat summary
    // block outright, so this now ALWAYS lands the hat back at its
    // plain default state (mode tiles + chips + See all) — whether
    // backing out at step 0 or collapsing mid-wizard, resolved sheet
    // or not. The "a session exists" signal lives on the Media chip's
    // own dot now (.pt-chip-dot, CSS-driven off body.is-painter-
    // resolved — no JS needed here), and the ghost "N more concepts"
    // tile lives directly on the sheet's own objects (.pt-concept-
    // ghost), not in the hat.
    //
    // 9/10 — Back out of the settings surface ANIMATES (review: "a nice
    // back animation when the user clicks the back button"); every
    // other exit — collapse, Studio, programmatic — stays instant. Two
    // beats, both the hat's own motion: (1) the settings content blurs
    // down on the step-swap recipe while the Back pill withdraws, the
    // title fades and the canvas stage recedes; (2) at 220ms the
    // surfaces swap, tiles/chips/See all mount on ch-prompt-mount in a
    // short stagger, and the hat body eases from the settings height to
    // the default height on its own 380ms max-height curve (inline
    // max-height between the two measured heights, cleared on
    // transitionend — the hat's open/close motion reused, not a new
    // one). A pending animated exit is dropped by startFlow() (Media
    // again inside the 220ms) and by a collapse (the class watcher
    // above hands over to the collapse path).
    let wizardExitTimer = null;
    let hatBodyEaseCleanup = null;
    function clearHatBodyEase() {
      if (!hatBodyEaseCleanup) return;
      const fn = hatBodyEaseCleanup;
      hatBodyEaseCleanup = null;
      fn();
    }
    function cancelWizardExitAnim() {
      if (wizardExitTimer) { clearTimeout(wizardExitTimer); wizardExitTimer = null; }
      if (auxPanel) auxPanel.classList.remove('pt-wizard-leaving', 'pt-hat-returning');
      if (hatWizardBody) hatWizardBody.classList.remove('is-swapping');
    }
    function easeHatBodyTo(fromH) {
      const body = auxPanel && auxPanel.querySelector('.chat-aux-body');
      if (!body) return;
      clearHatBodyEase();
      const toH = body.scrollHeight; // the default surface's own content height, now that it is the one displayed
      if (!toH || Math.abs(toH - fromH) < 2) return;
      body.style.transition = 'none';
      body.style.maxHeight = fromH + 'px';
      void body.offsetHeight; // commit the start height before the eased change
      body.style.transition = '';
      body.style.maxHeight = toH + 'px';
      let timer = null;
      const onEnd = (e) => { if (e.target === body && e.propertyName === 'max-height') clearHatBodyEase(); };
      hatBodyEaseCleanup = () => {
        clearTimeout(timer);
        body.removeEventListener('transitionend', onEnd);
        body.style.maxHeight = '';
        body.style.transition = '';
      };
      body.addEventListener('transitionend', onEnd);
      timer = setTimeout(clearHatBodyEase, 460);
    }
    function exitWizardToDefault(opts) {
      opts = opts || {};
      const animate = !!opts.animate && !mmReducedMotion() && !!auxPanel &&
        auxPanel.classList.contains('pt-wizard-active') && auxPanel.classList.contains('is-expanded');
      if (animate && wizardExitTimer) return; // already on its way out
      cancelWizardExitAnim();
      clearHatBodyEase();
      wizardStep = -1;
      flowRunning = false;
      if (typeof closeSetMenu === 'function') closeSetMenu(); // a hoisted pill menu would outlive the panel otherwise
      setAuxTitle(AUX_TITLE_DEFAULT);
      closeMediaMode(); // ACTIVE BRIEF 9/1c — back-at-step-1 / hat-collapse both exit the canvas takeover too
      const body = auxPanel && auxPanel.querySelector('.chat-aux-body');
      const finish = () => {
        wizardExitTimer = null;
        // Only a still-open hat gets the returning beat; a collapse that
        // slipped in meanwhile already owns the exit (see the watcher).
        const returning = animate && auxPanel.classList.contains('is-expanded');
        const fromH = returning && body ? body.getBoundingClientRect().height : 0;
        if (auxPanel) auxPanel.classList.remove('pt-wizard-active', 'pt-copy-editor-open', 'pt-settings-step', 'pt-wizard-leaving');
        if (hatWizard) hatWizard.setAttribute('aria-hidden', 'true');
        if (hatWizardBody) { hatWizardBody.innerHTML = ''; hatWizardBody.classList.remove('is-swapping'); }
        syncMediaTopbar(); // Y — the settings pills are gone now too; this IS leaving Media, workspace header returns
        // Backing all the way out returns the blank canvas (the OMNI
        // mark); the boards stay banked and History brings one back.
        if (opts.leaveSheet) document.body.classList.remove('is-painter-resolved');
        if (!returning) return;
        auxPanel.classList.add('pt-hat-returning');
        easeHatBodyTo(fromH);
        setTimeout(() => auxPanel.classList.remove('pt-hat-returning'), 640);
      };
      if (!animate) { finish(); return; }
      auxPanel.classList.add('pt-wizard-leaving');
      if (hatWizardBody) hatWizardBody.classList.add('is-swapping');
      wizardExitTimer = setTimeout(finish, 220);
    }

    // 9/10 — a finished sheet leaves the BANNER SETTINGS in the hat
    // (Bryan: "it is after the user has generated a set of banners — it
    // should be the banner ui again in the chat hat vs the default chat
    // hat"). Every path that used to drop the hat to its default once a
    // session exists lands on the settings surface instead: both
    // generate paths (finishGenerate, Studio's Add to canvas), a
    // collapse of the hat, Studio's own exit, and the resolved-sheet
    // deep links. Only an explicit Back from the settings surface
    // reaches the default hat — that is the user leaving Media, and the
    // Media chip's dot still says a session exists there.
    function sessionExists() { return document.body.classList.contains('is-painter-resolved'); }
    function settleHatAfterGenerate() {
      if (!auxPanel || !auxPanel.classList.contains('pt-wizard-active') || inStudio) return; // already backed out
      flowRunning = true;
      if (!settingsStepMounted()) renderForkStep();
    }
    function settleHatAfterCollapse() {
      if (!auxPanel || auxPanel.classList.contains('is-expanded') || !auxPanel.classList.contains('pt-wizard-active')) return;
      if (sessionExists() && !inStudio) {
        // The canvas returns to the sheet; the hat keeps its settings
        // for the next open (a Guided step mid-way resets to them).
        if (typeof closeSetMenu === 'function') closeSetMenu();
        closeMediaMode();
        flowRunning = true;
        if (!settingsStepMounted()) renderForkStep();
        return;
      }
      exitWizardToDefault();
    }

    function updateHatStepChrome(stepIndex) {
      // P5 — stepIndex -1 is the fork (and Studio's compact row):
      // no "Step N of 4" label at all (that belongs to Guided only).
      if (hatStepLabel) {
        hatStepLabel.hidden = stepIndex === -1;
        if (stepIndex !== -1) hatStepLabel.textContent = 'Step ' + (stepIndex + 1) + ' of 4';
      }
      if (hatBack) hatBack.setAttribute('aria-label', stepIndex === -1 ? 'Exit Media' : 'Back');
    }

    // ═══ P5 — step 0, the fork. Lives in the hat exactly like the 4
    //     Guided steps (same swap chrome), just ahead of them —
    //     wizardStep stays -1 while it shows (updateHatStepChrome(-1)
    //     hides the "Step N of 4" label, matching Studio's own compact
    //     row). Back here exits (handleWizardBack routes wizardStep===-1
    //     to exitWizardToDefault).
    //
    //     9/3 — the Guided/Studio tile pair was replaced by NEW MEDIA
    //     SETTINGS: three dropdown pills (size · concepts · template)
    //     that seed a ONE-SHOT generate. The user sets the pills, types
    //     a brief in the composer, and sends; send() hands off to
    //     window._ptMediaSettingsSubmit below, which skips the 4-step
    //     wizard and drops the concept sheet straight onto the canvas.
    //     Both original destinations stay one click away on the quiet
    //     line under the pills, so neither the Guided wizard nor Studio
    //     is stranded. ═══
    /* V2 (PLAN.md §V) — SET_LETTERS (a fixed 4) folded into
       SET_LETTERS_EXT below: a generate can now ask for up to
       brief.concepts' own ceiling (9) in one pass, and a round of
       "Generate more" is no longer fixed at three. */
    /* Enough letters for repeated "Generate more concepts" rounds — up
       to nine a round (brief.concepts' own ceiling) and the tile
       retires at 24 rows (V2 raised this from 12/three-a-round). A–X,
       so no round ever needs a double letter under that ceiling. */
    const SET_LETTERS_EXT = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
    // Template roster IS the Layout step's roster (ALL_LAYOUT_IDS /
    // LAYOUT_NAME) — picking one here is exactly what renderLayoutStep
    // sets in the Guided path, so both routes feed state.layout the
    // same values and rotatedLayoutFor() behaves identically.
    const SET_TEMPLATE_SUB = {
      'type-top': 'Headline above',
      'type-bottom': 'Headline below',
      'stacked': 'Type above and below',
      'split': 'Side by side',
      'split-reverse': 'Image left',
      'card': 'Copy in a card',
      'full-bleed': 'Edge to edge',
      'type-only': 'No imagery',
      'diagonal': 'Model decides'
    };
    /* Brand-approved templates — locked, signed-off looks, as opposed
       to the generic shapes the model is free to fill. Each still
       RENDERS as one of the layout ids (the banner engine only knows
       those), so `layout` is what generation actually consumes; the
       distinction is provenance, not geometry. AA.2/AA.3 — a guide is
       `{ id, name, sub, brand, layout, colorway, photo, since }`: `brand`
       is the CORVACHE_BRAND-style key (corvache/precision/atelier) the
       roster groups by and the build path stamps as data-guide;
       `colorway` is what the guide LOCKS every unit it produces to,
       regardless of the Color pill (see varietyFor). The three
       featured guides (fall-2026, precision-series, atelier-bespoke)
       lead the array — "RECENT" is simply this array's own first
       three, newest first — the other four (seeded so the roster's
       own find-more mechanism is real) follow, grouped by brand within
       that tail. The Fall 2026 art direction — gold on near-black over
       a bled shoot frame — is already this file's default colorway;
       it carries the value explicitly now so the guide-lock logic
       below never has to special-case an unset colorway. */
    const SET_BRAND_TEMPLATES = [
      {
        id: 'brand-fall-2026',
        name: 'Fall 2026 Launch',
        // AI.1 — the Styles pill/field's own short form (its plain
        // .name still carries the redundant "Launch" the pill has no
        // room for); the other six guides' names are already short
        // enough to read as-is (see styleGuideLabel's own fallback).
        short: 'Fall 2026',
        /* The section header already says these are approved — the sub
           earns its line by naming the campaign instead. */
        sub: 'Corvache GT',
        brand: 'corvache',
        layout: 'type-top',
        colorway: 'gold-on-dark',
        photo: 'shoot-assets/shoot-03.webp',
        since: '2026-09-01'
      },
      {
        id: 'brand-precision-series',
        name: 'Precision Series',
        sub: 'Corvache Precision',
        brand: 'precision',
        layout: 'split-reverse',
        colorway: 'ember-on-black',
        // Sharpest/darkest of the shoot: the black GT's own diffuser +
        // wing read crisp against the sunset, and its red taillights
        // echo the guide's own ember accent — chosen by eye against
        // the other four frames, per the plan's own "look at them".
        photo: 'shoot-assets/shoot-01.webp',
        since: '2026-08-20'
      },
      {
        id: 'brand-atelier-bespoke',
        name: 'Atelier Bespoke',
        sub: 'Corvache Atelier',
        brand: 'atelier',
        layout: 'card',
        // AL.10 correction — was gold-on-light (doubled up with Atelier
        // Invitation, orphaning dark-on-gold): dark-on-gold is the
        // inverse of the brand default, an elegant fit for Atelier's
        // own bespoke line, and leaves Atelier Invitation as gold-on-
        // light's sole guide, matching the plan's own example.
        colorway: 'dark-on-gold',
        // Warmest/golden-hour of the shoot: soft backlit rim light,
        // bright and airy — the one frame that actually reads "ivory,
        // soft geometry" rather than the moodier Precision mood.
        photo: 'shoot-assets/shoot-04.webp',
        since: '2026-07-15'
      },
      {
        id: 'brand-spring-drive',
        name: 'Spring Drive',
        sub: 'Corvache',
        brand: 'corvache',
        layout: 'type-bottom',
        colorway: 'gold-on-dark',
        photo: 'shoot-assets/shoot-02.webp',
        since: '2026-03-01'
      },
      {
        id: 'brand-cpo',
        name: 'Certified Pre-Owned',
        sub: 'Corvache',
        brand: 'corvache',
        layout: 'split',
        colorway: 'white-on-dark',
        photo: 'shoot-assets/shoot-05.webp',
        since: '2026-02-01'
      },
      {
        id: 'brand-precision-track',
        name: 'Track Day',
        sub: 'Corvache Precision',
        brand: 'precision',
        layout: 'full-bleed',
        // AL.10 correction — was ember-on-black (doubled up with
        // Precision Series, orphaning dark-on-black): a stealth mono
        // treatment fits a track-day guide, and leaves Precision
        // Series as ember-on-black's sole guide, matching the plan's
        // own example.
        colorway: 'dark-on-black',
        photo: 'shoot-assets/shoot-01.webp',
        since: '2026-01-15'
      },
      {
        id: 'brand-atelier-invitation',
        name: 'Atelier Invitation',
        sub: 'Corvache Atelier',
        brand: 'atelier',
        layout: 'type-only',
        colorway: 'gold-on-light',
        photo: 'shoot-assets/shoot-04.webp',
        since: '2025-12-01'
      }
    ];
    const SET_BRAND_BY_ID = {};
    SET_BRAND_TEMPLATES.forEach(t => { SET_BRAND_BY_ID[t.id] = t; });
    // (Bryan, 9/15: "just make this the default view of style guides,
    // no reason for two views" — the RECENT three and the "All style
    // guides" disclosure are gone; the roster opens grouped and whole.)
    // AA.3 — the expanded roster's own CORVACHE / PRECISION / ATELIER
    // groups, in that order, each holding every guide of that brand
    // (the featured three included, per the plan's own "the featured
    // three included in their groups"). Built off SET_BRAND_TEMPLATES
    // directly so a future 8th guide only ever needs adding there.
    // AL.2 — name is the group's own header text ("Corvache Precision").
    // Bryan, 9/15: the group's sub-line ("The marque · 3 guides") is
    // gone; each group head carries a little text link to the full
    // brand book instead — the CORVACHE brand book that lives on the
    // canvas-graphics prototype (its own gate), the Precision line
    // deep-linked to its 2026 style entry.
    const SET_BRAND_BOOK_URL = 'https://canvas-graphics.vercel.app/brand-book.html';
    const SET_BRAND_GROUPS = [
      { brand: 'corvache',  name: 'Corvache',           book: SET_BRAND_BOOK_URL },
      { brand: 'precision', name: 'Corvache Precision', book: SET_BRAND_BOOK_URL + '#style-2026-corvache-precision' },
      { brand: 'atelier',   name: 'Corvache Atelier',   book: SET_BRAND_BOOK_URL }
    ].map(g => Object.assign(g, { ids: SET_BRAND_TEMPLATES.filter(t => t.brand === g.brand).map(t => t.id) }));
    /* One name lookup across both sections, for a single id — the
       pill's own templatesPillLabel (AW.4) and every check row call
       this per pick, never on the mediaSetup.templates LIST itself. */
    function templateLabel(id) {
      if (!id) return 'Layouts';
      /* A style guide pick lands here as the guide's id, but this is
         the LAYOUT pill's word (Bryan, 9/15: "changing the style guide
         is changing the layout thingey headline too") — it reads the
         guide's layout by name; the guide's own name is the Styles
         pill's (styleGuideLabel). */
      if (SET_BRAND_BY_ID[id]) return LAYOUT_NAME[SET_BRAND_BY_ID[id].layout] || 'Layouts';
      const custom = studioTemplateById(id); // AK.4 — a Studio-saved template
      if (custom) return custom.name;
      return LAYOUT_NAME[id] || 'Layouts';
    }
    /* …and one id lookup for what the banner engine should actually
       draw, since a brand template is not itself a layout id. */
    function templateLayoutId(id) {
      if (!id) return 'diagonal';
      if (SET_BRAND_BY_ID[id]) return SET_BRAND_BY_ID[id].layout;
      const custom = studioTemplateById(id); // AK.4
      if (custom) return custom.layoutId;
      return id;
    }
    /* AW.1 — a list counts as "Generated" when there's nothing picked
       at all, or the sole pick is the 'diagonal' sentinel ("Generated
       layout · Model decides") — both fall back to the model's own
       free variety instead of one layout per concept row. */
    function templatesIsGenerated(list) {
      return !list || !list.length || (list.length === 1 && list[0] === 'diagonal');
    }
    /* AW.1/AW.6 — resolves the Layouts pick LIST into the flat array
       varietyFor deals a board's units from when the deal ISN'T per
       concept: Generated (templatesIsGenerated) deals the nine
       generics across every unit — the only place layout variety
       still happens WITHIN a concept, and only when nothing real is
       picked; a real pick list deals per CONCEPT ROW instead, in
       buildConceptSheetDOM (14-hat-a-files.js), which reads this same
       list directly rather than through this array. Shared by the
       hat's build handoff and the append path (buildConceptSheetDOM
       reads a board's own liveBoard.layout through this same door, so
       "Generate 3 more" deals into what the board was actually built
       with, never today's pills). */
    function templatesDealFor(list) {
      return templatesIsGenerated(list) ? ALL_LAYOUT_IDS.slice() : list.slice();
    }
    /* AI.1/AI.2 — the one brand guide, if a single id IS one, read for
       the Styles pill/field: its own short name (falling back to its
       plain name where none is set). null with nothing brand-approved
       picked — a plain generic or Studio-saved layout leaves this
       null, same as unpicked, so both surfaces fall back to their own
       resting word ("Styles" / "—"). AW.1 — callers pass
       mediaSetup.templates[0]: a guide is always the list's sole entry
       when one is picked at all, never mixed with other picks. */
    function styleGuideLabel(id) {
      const guide = SET_BRAND_BY_ID[id];
      return guide ? (guide.short || guide.name) : null;
    }
    // AK.4 — a template is the current banner's SHAPE, never its copy:
    // layout, colorway (+ any fine-tune custom color), font and size.
    function studioSaveTemplate(name) {
      const t = {
        id: 'tmpl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: name || (studioTitle + ' template'),
        layoutId: editorState.layoutId,
        colorway: editorState.colorway,
        customColor: editorState.customColor ? Object.assign({}, editorState.customColor) : null,
        font: editorState.font,
        sizeId: editorState.sizeId
      };
      studioTemplates.push(t);
      return t;
    }
    // The third column every Template picker (the fork's inline pill,
    // the sheet header's own Templates menu) can add once a banner
    // has been saved as a template from Studio; `on` reads whichever
    // set that particular menu picks against, `attrName` opts into
    // the data-variety-* delegated-click wiring the sheet header's
    // own menu uses (omit it for wireSetPill's index wiring).
    function studioTemplateById(id) {
      return studioTemplates.filter(t => t.id === id)[0] || null;
    }
    function yourTemplatesColHTML(on, attrName, checkMode, badgeOf) {
      if (!studioTemplates.length) return '';
      return (
        '<div class="pt-set-col">' +
          '<div class="pt-set-sec">Your templates</div>' +
          studioTemplates.map(t => {
            let row = setPickItemHTML(setTemplatePreview(t.layoutId), t.name, sizeDisplayLabel(t.sizeId), on(t.id), null, false, null, checkMode, badgeOf ? badgeOf(t.id) : null); // AW.2 — checkMode/badgeOf: the Layouts panel's own check rows + concept-letter badge; every other caller omits them, untouched
            if (attrName) row = row.replace('<button class="pt-set-item', '<button data-' + attrName + '="' + t.id + '" class="pt-set-item');
            return row;
          }).join('') +
        '</div>'
      );
    }
    // Defaults match the pills' resting labels: 300×250, one concept,
    // and no template picked yet (label stays the generic "Template";
    // an unpicked template generates as Split since 9/10 — the same
    // default the resting blueprint shows — after diagonal's narrow
    // copy column ellipsized every headline at 300×250).
    //
    // `sizes` is a SET, like the Guided SIZES step's chip row — the
    // sheet renders every checked size for every concept, so no single
    // one is primary. Count and template stay single-pick.
    /* One test size; colorways is a SET the sheet deals across (empty =
       "brand default", which is what the pill reads as at rest). The
       row count is fixed — the sheet is always the 3x3 board — so
       there is no count here any more.
       AN.1/AW.1 — templates is an ORDERED LIST of up to brief.concepts
       picks: a generic layout id, a brand guide id, a Studio-saved
       template id, or the 'diagonal' sentinel ("Generated layout ·
       Model decides") — never more than one of the last two, each is
       a whole look that replaces the list outright. Concept A deals
       from the first pick, B the second, and so on, repeating when
       there are fewer picks than concepts; [] (nothing picked) deals
       Generated's own nine-generic variety, same as picking 'diagonal'
       explicitly (templatesIsGenerated). Picking from either the
       Layouts or the Styles pill commits through templatesTogglePick. */
    const mediaSetup = { sizes: ['300x250'], templates: [], colorways: [] };
    const SHEET_ROWS = 3;

    const SET_ICONS = {
      size: '<svg viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" stroke="currentColor" stroke-width="1"/></svg>',
      color: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1"/><path d="M8 2v12" stroke="currentColor" stroke-width="1"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
      count: '<svg viewBox="0 0 16 16" fill="none">' +
        '<rect x="2.5" y="2.5" width="4.5" height="4.5" stroke="currentColor" stroke-width="1"/>' +
        '<rect x="9" y="2.5" width="4.5" height="4.5" stroke="currentColor" stroke-width="1"/>' +
        '<rect x="2.5" y="9" width="4.5" height="4.5" stroke="currentColor" stroke-width="1"/>' +
        '<rect x="9" y="9" width="4.5" height="4.5" stroke="currentColor" stroke-width="1"/></svg>',
      template: '<svg viewBox="0 0 16 16" fill="none">' +
        '<rect x="5.5" y="2.5" width="8" height="8" stroke="currentColor" stroke-width="1"/>' +
        '<path d="M10.5 13.5H3.9V5.5" stroke="currentColor" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
      // AI.1 — Styles' own pill glyph: SKILL_ICONS.bookOpen's exact
      // path (~L45155, the shell's own "book" glyph), reused verbatim
      // rather than drawn fresh — SKILL_ICONS itself is local to the
      // Create screen's own IIFE, out of reach from here, so the path
      // data is copied in rather than referenced live.
      bookOpen: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M232,50H160a38,38,0,0,0-32,17.55A38,38,0,0,0,96,50H24a6,6,0,0,0-6,6V200a6,6,0,0,0,6,6H96a26,26,0,0,1,26,26,6,6,0,0,0,12,0,26,26,0,0,1,26-26h72a6,6,0,0,0,6-6V56A6,6,0,0,0,232,50ZM96,194H30V62H96a26,26,0,0,1,26,26V204.31A37.86,37.86,0,0,0,96,194Zm130,0H160a37.87,37.87,0,0,0-26,10.32V88a26,26,0,0,1,26-26h66Z"/></svg>',
      // AV.1 — Imagery's own pill glyph: the band's own imagery field
      // svg (data-sheet-tool="imagery", 42-body-canvas-sheet.html),
      // copied in verbatim rather than drawn fresh, the same reuse
      // rule bookOpen above follows.
      image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      caret: '<svg class="pt-set-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
        '<path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    // Menu-item preview glyphs, all drawn into the same 22×16 lane so
    // the icon column reads as one rail (same trick .image-aspect-
    // preview / .image-count-icon use in the composer menus).
    function setSizePreview(sizeId) {
      const parts = sizeId.split('x');
      const w = parseInt(parts[0], 10), h = parseInt(parts[1], 10);
      const scale = Math.min(20 / w, 15 / h);
      const pw = Math.max(3, Math.round(w * scale)), ph = Math.max(3, Math.round(h * scale));
      return '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' +
        '<rect x="' + ((22 - pw) / 2) + '" y="' + ((16 - ph) / 2) + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
    }
    function setCountPreview(n) {
      const boxes = [
        '<rect x="8" y="3" width="6" height="10" fill="none" stroke="currentColor" stroke-width="1"/>',
        '<rect x="3.5" y="3" width="6" height="10" fill="none" stroke="currentColor" stroke-width="1"/><rect x="12.5" y="3" width="6" height="10" fill="none" stroke="currentColor" stroke-width="1"/>',
        '<rect x="1" y="3" width="5.5" height="10" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8.25" y="3" width="5.5" height="10" fill="none" stroke="currentColor" stroke-width="1"/><rect x="15.5" y="3" width="5.5" height="10" fill="none" stroke="currentColor" stroke-width="1"/>',
        '<rect x="3.5" y="1.5" width="6" height="5.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="12.5" y="1.5" width="6" height="5.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="3.5" y="9" width="6" height="5.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="12.5" y="9" width="6" height="5.5" fill="none" stroke="currentColor" stroke-width="1"/>'
      ];
      return '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' + boxes[n - 1] + '</svg>';
    }
    /* AN.1 — the layout's own hairline strokes, pulled out of
       setTemplatePreview so the pill's and panel's 22×16 preview
       glyphs draw the SAME drawing instead of keeping a second copy
       that could drift. AN.4 retired the resting viewfinder's own
       per-cell copy of this drawing ("remove these graphics from
       inside of the banners"); AW.5 brings it back scoped to the
       ROW (vfRowLayoutWireframeHTML, above renderMmTemplate) rather
       than every cell alike. */
    function layoutWireframeInner(id) {
      return {
        'type-top': '<rect x="4" y="2" width="14" height="4" fill="none" stroke="currentColor" stroke-width="1"/><rect x="4" y="7.5" width="14" height="6.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>',
        'type-bottom': '<rect x="4" y="2" width="14" height="6.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><rect x="4" y="10" width="14" height="4" fill="none" stroke="currentColor" stroke-width="1"/>',
        // AA.1 — stacked: thin rect (headline band) / tall faint rect
        // (media, centred) / thin rect (CTA band) — the 3-band read,
        // top to bottom.
        'stacked': '<rect x="4" y="2" width="14" height="2.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="4" y="5.5" width="14" height="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><rect x="4" y="12.5" width="14" height="1.5" fill="none" stroke="currentColor" stroke-width="1"/>',
        'split': '<rect x="4" y="2" width="6.5" height="12" fill="none" stroke="currentColor" stroke-width="1"/><rect x="11.5" y="2" width="6.5" height="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>',
        // AA.1 — split-reverse: split's own two boxes, mirrored — the
        // faint (media) box now on the left, solid (copy) on the right.
        'split-reverse': '<rect x="4" y="2" width="6.5" height="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><rect x="11.5" y="2" width="6.5" height="12" fill="none" stroke="currentColor" stroke-width="1"/>',
        // AA.1 — card: a faint full-bleed rect (the image) plus a
        // small solid-stroke rect bottom-left (the copy card).
        'card': '<rect x="4" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><rect x="5" y="9.5" width="7" height="4" fill="none" stroke="currentColor" stroke-width="1"/>',
        'full-bleed': '<rect x="4" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><rect x="6" y="6.5" width="8" height="3" fill="none" stroke="currentColor" stroke-width="1"/>',
        // AA.1 — type-only: the mark (small square) above two centred
        // bars (headline, CTA) — no faint image rect at all, since
        // there's no imagery.
        'type-only': '<rect x="9.5" y="2" width="3" height="3" fill="none" stroke="currentColor" stroke-width="1"/><rect x="6" y="7" width="10" height="2" fill="none" stroke="currentColor" stroke-width="1"/><rect x="7.5" y="10.5" width="7" height="2" fill="none" stroke="currentColor" stroke-width="1"/>',
        'diagonal': '<rect x="4" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><path d="M4.8 13.2 17.2 2.8" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="square"/>'
      }[id] || '';
    }
    function setTemplatePreview(id) {
      return '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">' + layoutWireframeInner(id) + '</svg>';
    }

    // `multi` swaps the a11y role only — a checkbox menu item is the
    // one that may sit checked alongside its siblings.
    function setItemHTML(preview, name, sub, isOn, multi) {
      return '<button class="pt-set-item' + (isOn ? ' is-active' : '') + '" type="button" role="' + (multi ? 'menuitemcheckbox' : 'menuitemradio') + '" aria-checked="' + (isOn ? 'true' : 'false') + '">' +
        '<span class="pt-set-item-icon" aria-hidden="true">' + preview + '</span>' +
        '<span class="pt-set-item-labels">' +
          '<span class="pt-set-item-name">' + escape(name) + '</span>' +
          (sub ? '<span class="pt-set-item-sub">' + escape(sub) + '</span>' : '') +
        '</span>' +
        '<span class="dip-switch' + (isOn ? ' is-on' : '') + '" data-on="' + (isOn ? '1' : '0') + '" aria-hidden="true"></span>' +
      '</button>';
    }
    /* Switch-free variant for the template menu — the row's own colour
       is the state, so there is no control to render. `lead` is either
       a layout glyph or a whole banner miniature. `attrs` (V1, PLAN.md
       §V) is an optional extra raw attribute string — Sizes' Board at
       rows use it for a data-board-size hook so a shared click
       delegation can read the value straight off the row, the way
       every other picker on the page keys off its own data attribute
       instead of wireSetPill's index-mapped values array. `checkMode`
       (V3, PLAN.md §V) is the one-recipe fix for Sizes' own Ships at
       rows: several may be on at once there (a floor-of-one checkbox
       set, not a radio), so it swaps the a11y role and squares the
       ring's inner mark via .pt-set-item-radio--check — everything
       else about the row is identical to a radio one, on purpose.
       `badge` (AW.2) is the Layouts panel's own trailing tag — the
       concept letter a picked row feeds ("A", "B", …) — on the
       existing .pt-set-item-usage recipe (V3's live-usage tag, never
       otherwise wired); every prior caller omits it, untouched. */
    function setPickItemHTML(lead, name, sub, isOn, cardCls, valueMono, attrs, checkMode, badge) {
      return '<button class="pt-set-item pt-set-item--pick' + (cardCls ? ' ' + cardCls : '') + (isOn ? ' is-active' : '') + '" type="button" role="' + (checkMode ? 'menuitemcheckbox' : 'menuitemradio') + '" aria-checked="' + (isOn ? 'true' : 'false') + '"' + (valueMono ? ' data-set-value-mono' : '') + (attrs ? ' ' + attrs : '') + '>' +
        '<span class="pt-set-item-icon" aria-hidden="true">' + lead + '</span>' +
        '<span class="pt-set-item-labels">' +
          '<span class="pt-set-item-name">' + escape(name) + '</span>' +
          (sub ? '<span class="pt-set-item-sub">' + escape(sub) + '</span>' : '') +
          (badge ? '<span class="pt-set-item-usage">' + escape(badge) + '</span>' : '') +
        '</span>' +
        '<span class="pt-set-item-radio' + (checkMode ? ' pt-set-item-radio--check' : '') + '" aria-hidden="true"></span>' +
      '</button>';
    }
    /* AA.2 — a guide's own colours, for the card thumb only (the real
       banner CSS is the single source of truth for what a GENERATED
       unit looks like — see .pt-banner[data-colorway=…] below; this
       is just a legible, honest miniature of it). */
    const GUIDE_THUMB_GROUND = {
      'gold-on-dark': '#131517', 'white-on-dark': '#131517', 'dark-on-black': '#000000',
      'ember-on-black': '#0B0C0F', 'gold-on-light': '#F3EEE4', 'dark-on-gold': '#C29049'
    };
    const GUIDE_THUMB_ACCENT = {
      'gold-on-dark': '#C29049', 'white-on-dark': '#FFFFFF', 'dark-on-black': '#966C2F',
      'ember-on-black': '#DC4C2F', 'gold-on-light': '#C29049', 'dark-on-gold': '#131517'
    };
    /* AL.1 — a guide's own cover colours: ground/ink/accent straight
       off its colorway. COLORWAY_COLOR_DEFAULTS (below, same file) is
       the single source real banners read their --pt-ground/--pt-ink/
       --pt-accent vars from (applyCustomColorVarsToBanner) — this is
       the same honest-miniature contract setBrandThumb always kept,
       just off the colour record instead of a fixed ground/accent
       pair. Falls back to the older GUIDE_THUMB_GROUND/ACCENT maps
       (just above) for a colorway id neither ever needs today. */
    function guideCoverColors(t) {
      const cc = COLORWAY_COLOR_DEFAULTS[t.colorway];
      if (cc) return cc;
      return { ground: GUIDE_THUMB_GROUND[t.colorway] || '#131517', ink: '#C29049', accent: GUIDE_THUMB_ACCENT[t.colorway] || '#C29049' };
    }
    /* AL.1 — the cover, not a banner: a portrait tile on the guide's
       own ground (dark/black/paper per its colorway) — a spine one
       step darker down the left edge, the griffin mark (the file's
       one real asset, LOGO_FOR_COLORWAY's own pick — never a drawn
       path) in the guide's accent with a 2px accent rule beneath it,
       the title in the guide's own display face (Montserrat 800,
       atelier's semibold override per AA.2), a mono foot eyebrow. No
       photograph, no copy bars — those are what made these read as
       banners instead of book covers. Composition audited against the
       CORVACHE brand book's own cover language (mark · rule · title ·
       eyebrow, canvas-graphics/brand-book.html's .sg-tile-cover). */
    function setBrandThumb(t) {
      const cc = guideCoverColors(t);
      const spine = 'color-mix(in srgb, ' + cc.ground + ' 82%, black)';
      const subtleInk = 'color-mix(in srgb, ' + cc.ink + ' 55%, transparent)';
      const markSrc = LOGO_FOR_COLORWAY[t.colorway] || 'brand/griffin-gold.png';
      const titleCls = t.brand === 'atelier' ? ' pt-guide-cover-title--atelier' : '';
      return '<span class="pt-guide-cover" style="background:' + cc.ground + '">' +
        '<span class="pt-guide-cover-spine" style="background:' + spine + '" aria-hidden="true"></span>' +
        '<img class="pt-guide-cover-mark" src="' + markSrc + '" alt="">' +
        '<span class="pt-guide-cover-rule" style="background:' + cc.accent + '" aria-hidden="true"></span>' +
        '<span class="pt-guide-cover-title' + titleCls + '" style="color:' + cc.ink + '">' + escape(t.name) + '</span>' +
        '<span class="pt-guide-cover-eyebrow" style="color:' + subtleInk + '">2026</span>' +
      '</span>';
    }

    // One menu open at a time, hoisted to <body> (the hat panel is
    // overflow:hidden) and positioned above the pill, flipping below
    // only when there isn't room. Same approach as positionMenu() in
    // the graphics grid, kept local so the two can't drift into each
    // other's state.
    let setOpenMenu = null;
    function closeSetMenu() {
      if (!setOpenMenu) return;
      const menu = setOpenMenu.menu, btn = setOpenMenu.btn;
      setOpenMenu = null;
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      // Every set menu is rebuilt fresh per open (the band's own
      // persisted popovers, the one exception, retired with §AT's
      // tray), so a closed one is simply torn down after its exit.
      setTimeout(() => { if (menu.parentElement) menu.remove(); }, 260);
    }
    function openSetMenu(btn, menu, preferBelow) {
      closeSetMenu();
      ptHideFloatingTip(); // AL.9 — a popover opening on this same anchor supersedes its tip
      document.body.appendChild(menu);
      // Measure off-screen before committing coordinates.
      menu.style.visibility = 'hidden';
      menu.classList.add('open');
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      menu.classList.remove('open');
      menu.style.visibility = '';
      const r = btn.getBoundingClientRect();
      const gap = 8;
      const left = Math.min(Math.max(12, r.left), Math.max(12, window.innerWidth - mw - 12));
      let top, origin;
      if (preferBelow) {                       // the Package combo-box opens below its field (the band's fields did too, before §AT's tray)
        top = r.bottom + gap;
        origin = 'top center';
        if (top + mh > window.innerHeight - 12) { // no room below — flip up
          top = r.top - gap - mh;
          origin = 'bottom center';
        }
      } else {
        top = r.top - gap - mh;              // default: above the pill
        origin = 'bottom center';
        if (top < 12) {                          // no room up there — drop below
          top = Math.min(r.bottom + gap, Math.max(12, window.innerHeight - mh - 12));
          origin = 'top center';
        }
      }
      menu.style.left = left + 'px';
      menu.style.top = Math.max(12, top) + 'px';
      menu.style.transformOrigin = origin;
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      setOpenMenu = { menu: menu, btn: btn };
      // Guard against a since-superseded menu: two opened faster than
      // one frame apart must not both land on 'open' (the stale one is
      // torn down by closeSetMenu's own setTimeout regardless).
      requestAnimationFrame(() => { if (setOpenMenu && setOpenMenu.menu === menu) menu.classList.add('open'); });
    }
    // Outside-click and Escape both dismiss. Escape runs in CAPTURE and
    // stops there when a menu is open, so it closes the dropdown
    // instead of falling through to the media surface's own
    // "Escape = Back" handler and exiting the whole step.
    document.addEventListener('click', (e) => {
      if (!setOpenMenu) return;
      if (setOpenMenu.menu.contains(e.target) || setOpenMenu.btn.contains(e.target)) return;
      closeSetMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !setOpenMenu) return;
      e.stopPropagation();
      e.preventDefault();
      const btn = setOpenMenu.btn;
      closeSetMenu();
      btn.focus();
    }, true);

    // AL.9 (Bryan: "let's make sure the tips don't get cut off" — the
    // Color pill's tip clipped at the hat's edge) — every .pt-set-tip/
    // .pt-package-tip hoists to <body> on hover/focus, openSetMenu's
    // own hoisting idiom above generalised into one delegated listener
    // pair so content built after load (the strip, unit cards, band
    // fields) is covered without wiring each instance by hand. The
    // tip's own recipe (padding/radius/colour/caret) is untouched —
    // only its POSITION becomes fixed viewport coordinates once
    // .pt-tip-hoisted lands (CSS next to .pt-set-tip/.pt-package-tip
    // above); the anchor list below is exactly AL.9's four locations
    // (the hat's pills, the band's fields, the head-row checkbox, the
    // Package/view-toggle family) — anything else keeps its native
    // title attribute or its own recipe (.pt-select-label) untouched.
    const PT_TIP_HOST_SEL = '.pt-set-pill, .pt-band-field, .pt-unit-check, .pt-unit-tool, .pt-package-btn--tip, .pt-view-btn--tip'; // AQ.2 — + the card's action cluster; §BL.1 retired BI.2's .pt-concept-hint entry — the line is plain text, not a hoisted tooltip
    let floatingTip = null;       // the tip span currently living on <body>
    let floatingTipHome = null;   // {parent, next} — where it returns to
    let floatingTipAnchor = null;
    function ptFindTip(el) {
      const host = el && el.closest ? el.closest(PT_TIP_HOST_SEL) : null;
      if (!host) return null;
      const tip = host.querySelector(':scope > .pt-set-tip, :scope > .pt-package-tip');
      return tip ? { host: host, tip: tip } : null;
    }
    function ptPositionFloatingTip(host, tip) {
      const r = host.getBoundingClientRect();
      const margin = 12, gap = 8;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const anchorCx = r.left + r.width / 2;
      let left = anchorCx - tw / 2;
      left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - tw - margin));
      let dir = 'below', top = r.bottom + gap;
      if (top + th > window.innerHeight - margin) { dir = 'above'; top = r.top - gap - th; }
      top = Math.max(margin, top);
      tip.style.setProperty('--tip-x', left + 'px');
      tip.style.setProperty('--tip-y', top + 'px');
      const caretX = Math.min(Math.max(10, anchorCx - left), Math.max(10, tw - 10));
      tip.style.setProperty('--tip-caret-x', caretX + 'px');
      tip.setAttribute('data-tip-dir', dir);
    }
    function ptHideFloatingTip() {
      if (!floatingTip) return;
      const tip = floatingTip, home = floatingTipHome;
      floatingTip = null; floatingTipHome = null; floatingTipAnchor = null;
      tip.classList.remove('is-open');
      setTimeout(() => {
        if (tip.classList.contains('is-open')) return; // reopened elsewhere before this fired
        tip.classList.remove('pt-tip-hoisted');
        tip.removeAttribute('data-tip-dir');
        tip.style.removeProperty('--tip-x'); tip.style.removeProperty('--tip-y'); tip.style.removeProperty('--tip-caret-x');
        if (home && home.parent) home.parent.insertBefore(tip, home.next);
      }, 160);
    }
    function ptShowFloatingTip(host, tip) {
      if (host.getAttribute('aria-expanded') === 'true') return; // its own popover is open — the tip stays off (AL.9, matches the pill's existing rule)
      if (floatingTip === tip) { ptPositionFloatingTip(host, tip); return; }
      if (floatingTip) ptHideFloatingTip();
      floatingTipHome = { parent: tip.parentNode, next: tip.nextSibling };
      floatingTipAnchor = host;
      document.body.appendChild(tip);
      tip.classList.add('pt-tip-hoisted');
      floatingTip = tip;
      ptPositionFloatingTip(host, tip);
      requestAnimationFrame(() => { if (floatingTip === tip) tip.classList.add('is-open'); });
    }
    document.addEventListener('mouseover', (e) => {
      const found = ptFindTip(e.target);
      if (found) ptShowFloatingTip(found.host, found.tip);
    });
    document.addEventListener('mouseout', (e) => {
      if (!floatingTipAnchor) return;
      const to = e.relatedTarget;
      if (to && (floatingTipAnchor.contains(to) || to === floatingTip)) return;
      ptHideFloatingTip();
    });
    document.addEventListener('focusin', (e) => {
      const found = ptFindTip(e.target);
      if (found) ptShowFloatingTip(found.host, found.tip);
    });
    document.addEventListener('focusout', (e) => {
      if (!floatingTipAnchor) return;
      if (e.relatedTarget && floatingTipAnchor.contains(e.relatedTarget)) return;
      ptHideFloatingTip();
    });
    window.addEventListener('scroll', () => { if (floatingTip && floatingTipAnchor) ptPositionFloatingTip(floatingTipAnchor, floatingTip); }, true);
    window.addEventListener('resize', () => { if (floatingTip && floatingTipAnchor) ptPositionFloatingTip(floatingTipAnchor, floatingTip); });

    // Flips one row's checked chrome in place — used by the multi-select
    // menu, which stays open across picks so the row can't just be
    // rebuilt from scratch on every toggle.
    function setItemChecked(item, isOn) {
      item.classList.toggle('is-active', isOn);
      item.setAttribute('aria-checked', isOn ? 'true' : 'false');
      const dip = item.querySelector('.dip-switch');
      if (!dip) return;
      dip.classList.toggle('is-on', isOn);
      dip.setAttribute('data-on', isOn ? '1' : '0');
      // Same toggle feedback the composer's dip switches use.
      dip.classList.remove('just-toggled', 'just-toggled-off');
      void dip.offsetWidth; // restart the animation rather than let it no-op
      dip.classList.add(isOn ? 'just-toggled' : 'just-toggled-off');
      setTimeout(() => dip.classList.remove('just-toggled', 'just-toggled-off'), 600);
    }

    // Wires one pill: click toggles a freshly-built menu (built per
    // open so it always reflects current mediaSetup — no stale DOM to
    // reconcile when the step re-renders under it), each item commits
    // its value and re-syncs the canvas stage behind the hat.
    //
    // multi:true keeps the menu OPEN after a pick and repaints the row
    // in place, so a run of sizes can be checked in one visit; single
    // pills still commit-and-close.
    function wireSetPill(btn, buildHTML, values, apply, multi, menuCls) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
        const menu = el('<div class="pt-set-menu' + (menuCls ? ' ' + menuCls : '') + '" role="menu" aria-hidden="true"></div>');
        menu.innerHTML = buildHTML();
        /* .pt-set-item covers the row-shaped menus; [data-set-pick]
           lets a menu whose items are not rows (the colour swatches)
           opt into the same index-mapped wiring. */
        Array.prototype.forEach.call(menu.querySelectorAll('.pt-set-item, [data-set-pick]'), (item, i) => {
          item.addEventListener('click', () => {
            const isOn = apply(values[i]);
            if (multi) setItemChecked(item, isOn);
            else closeSetMenu();
            renderSettingsPillLabels(btn.closest('.pt-set-row'));
            syncMediaModeStage(); // stage behind the hat tracks the live pills
          });
        });
        openSetMenu(btn, menu);
      });
    }

    /* AA.3 — one row-builder shared by the hat's own Layouts popover
       and the sheet's Layouts drawer (#ptTemplatesList, §AB) for the
       Brand Approved column: a search field and the full roster
       grouped by brand (Bryan, 9/15: one view, not a RECENT three
       behind an "All style guides" disclosure) — the Sizes roster's
       own pattern (sizesRosterHTML/wireSizesSearch), not a second one. `dataAttr`
       is the caller's own pick-attribute name (data-set-template for
       the hat, data-variety-template for the drawer) so each keeps
       its own existing click-delegation convention; `data-roster-q`
       on every row is what search matches (name · sub · brand,
       lower-cased). Every guide renders once, in its brand's group. */
    function brandGuideRowHTML(t, dataAttr, isOn) {
      const q = (t.name + ' ' + t.sub + ' ' + t.brand).toLowerCase();
      return setPickItemHTML(
        setBrandThumb(t), t.name, t.sub, isOn, 'pt-set-item--card', false,
        dataAttr + '="' + t.id + '" data-roster-q="' + escape(q) + '"'
      );
    }
    // AL.2 \u2014 the panel's own eyebrow (+ a one-line subtle sub) and
    // every group header, RECENT included, in the sans label voice \u2014
    // never mono caps \u2014 so the roster explains itself: which book,
    // which line, how many. eyebrowLabel stays accepted (unused) so
    // callers built before this pass don't need their own call site
    // touched; both surfaces now read one unified "Style Guides \u00b7 N".
    function brandRosterColHTML(dataAttr, activeIds, eyebrowLabel) {
      const on = (id) => activeIds.indexOf(id) !== -1;
      // The head: the line's name at left, a "Brand book" text link at
      // right — the hat's own See-all link voice (label + the arrow
      // right after it, .pt-seeall-link-arrow reused), opening the
      // book in its own tab.
      const allHTML = SET_BRAND_GROUPS.map((g) =>
        '<div class="pt-set-roster-group-head" data-roster-group>' +
          '<span class="pt-set-roster-group-name">' + escape(g.name) + '</span>' +
          '<a class="pt-set-roster-book-link" href="' + escape(g.book) + '" target="_blank" rel="noopener" aria-label="Open the ' + escape(g.name) + ' brand book">' +
            '<span>Brand book</span>' +
            '<span class="pt-seeall-link-arrow" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"/></svg></span>' +
          '</a>' +
        '</div>' +
        g.ids.map((id) => brandGuideRowHTML(SET_BRAND_BY_ID[id], dataAttr, on(id))).join('')
      ).join('');
      const n = SET_BRAND_TEMPLATES.length;
      return (
        '<div class="pt-set-sec">Style Guides</div>' + // Bryan, 9/15: no "· 7", no sub-line beneath
        '<div class="pt-set-roster-search"><input class="pt-cta-input" type="search" placeholder="Search style guides\u2026" aria-label="Search style guides" autocomplete="off" data-roster-search></div>' +
        '<div class="pt-set-sec" data-roster-matches hidden></div>' +
        '<div class="pt-set-roster-all" data-roster-all>' + allHTML + '</div>' +
        '<div class="pt-set-roster-empty" data-roster-empty hidden>No style guides match</div>'
      );
    }
    /* Search — the one thing wireSetPill's generic per-item
       delegation can't drive (it only ever maps a click to a value);
       the roster wires itself, same as Sizes' own wireSizesSearch
       alongside its own menu. Reused verbatim by both callers.
       Attaches root._rosterReset so a caller whose roster DOM
       persists across opens (the drawer, built once — see
       renderBandFieldLists) can clear the search on every re-open
       (the hat's own popover is rebuilt fresh every open, so it never
       needs this — nothing persists there by construction). */
    function wireBrandRosterCol(root) {
      const search = root.querySelector('[data-roster-search]');
      const all = root.querySelector('[data-roster-all]');
      const empty = root.querySelector('[data-roster-empty]');
      const matches = root.querySelector('[data-roster-matches]');
      if (!search || !all) return;
      const groups = Array.prototype.slice.call(all.querySelectorAll('[data-roster-group]'));
      const allRows = Array.prototype.slice.call(all.querySelectorAll('.pt-set-item'));
      function apply() {
        const q = search.value.trim().toLowerCase();
        if (!q) {
          matches.hidden = true;
          empty.hidden = true;
          all.hidden = false;
          groups.forEach((g) => { g.hidden = false; });
          allRows.forEach((r) => { r.hidden = false; });
          return;
        }
        // Searching flattens the groups into one "N matches" set.
        groups.forEach((g) => { g.hidden = true; });
        let shown = 0;
        allRows.forEach((r) => {
          const hit = (r.getAttribute('data-roster-q') || '').indexOf(q) !== -1;
          r.hidden = !hit;
          if (hit) shown++;
        });
        all.hidden = shown === 0;
        empty.hidden = shown !== 0;
        matches.hidden = shown === 0;
        matches.textContent = shown + (shown === 1 ? ' match' : ' matches');
      }
      function reset() {
        search.value = '';
        apply();
      }
      search.addEventListener('input', apply);
      search.addEventListener('keydown', (e) => { if (e.key === 'Escape' && search.value) { search.value = ''; apply(); e.stopPropagation(); } });
      search.addEventListener('click', (e) => e.stopPropagation());
      root._rosterReset = reset;
    }
    /* AW.1/AW.2 — one door every Layouts pick commits through, hat and
       Studio's Brand-drawer alike (openTemplateSetMenu's Generic/
       Your-Templates check rows below, openStyleSetMenu's guide
       roster): Generated and a guide are each a whole look — picking
       either REPLACES the list outright, one entry; any other id
       (generic or a Studio-saved template — AW.1's "counts as a
       generic") appends up to the concept cap, then replaces the LAST
       slot once it's full, so nobody gets stuck unable to add a
       layout; a row already in the list unpicks (spliced out — the
       rest re-flow, since a letter is just a row's own position in
       this list, nothing stored separately). Returns whether id ended
       up picked, so a caller can gate a pick-only side effect (a
       Studio template's own colorway deal). */
    function templatesTogglePick(id) {
      const list = mediaSetup.templates;
      const at = list.indexOf(id);
      if (at !== -1) { list.splice(at, 1); return false; }
      const isGuide = !!SET_BRAND_BY_ID[id];
      if (id === 'diagonal' || isGuide) { list.length = 0; list.push(id); return true; }
      if (list.length === 1 && (list[0] === 'diagonal' || SET_BRAND_BY_ID[list[0]])) list.length = 0; // AW.1 — picking a real layout clears an exclusive Generated/guide pick first
      const cap = Math.max(1, brief.concepts || 1);
      if (list.length >= cap) list[cap - 1] = id; else list.push(id);
      return true;
    }
    /* AW.2 — every Generic/Your-Templates row is a CHECK now (the
       pick-row recipe's own checked chrome, setItemChecked — no new
       control): a click can add, replace-at-cap or remove a pick, so
       a click re-syncs every row in the menu AND each one's own
       letter badge, since one pick can shift every other row's
       position in the list. A guide entry resolves to the layout it
       carries first, so the matching GENERIC row still reads checked
       too (AN.1's "a style guide pick is a layout pick"), position for
       position — the same resolved list also answers "which letter
       does this row feed" (pick order = deal order = badge order).
       Shared by openStyleSetMenu below (its own guide rows stay
       radios — see brandGuideRowHTML — so only the checked state,
       never a badge, applies there). */
    function syncTemplatePickRows(menu, list) {
      const curLayouts = list.map((id) => SET_BRAND_BY_ID[id] ? SET_BRAND_BY_ID[id].layout : id);
      Array.prototype.forEach.call(menu.querySelectorAll('[data-set-template]'), (row) => {
        const id = row.getAttribute('data-set-template');
        const at = curLayouts.indexOf(id);
        setItemChecked(row, at !== -1);
        let badge = row.querySelector('.pt-set-item-usage');
        if (at !== -1) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'pt-set-item-usage';
            const labels = row.querySelector('.pt-set-item-labels');
            if (labels) labels.appendChild(badge);
          }
          badge.textContent = SET_LETTERS_EXT[at];
        } else if (badge) {
          badge.remove();
        }
      });
      // AW.2 — the panel's own eyebrow ("Layouts · 2 of 3", picked of
      // allowed); guarded so this shared sync never clobbers the
      // Styles panel's own "Style Guides · N" header (openStyleSetMenu
      // shares this same function, but its roster's count is static).
      const eyebrow = menu.querySelector('.pt-set-sec');
      if (eyebrow && /^Layouts /.test(eyebrow.textContent)) {
        eyebrow.textContent = 'Layouts · ' + list.length + ' of ' + Math.max(1, brief.concepts);
      }
    }
    /* AI.1 — Layouts, its own one-column panel: GENERIC exactly as it
       always rendered, plus YOUR TEMPLATES (AK.4) after it when Studio
       has saved any — the Brand Approved roster (AA.3) split out to
       openStyleSetMenu below, so this door goes back to a flat list.
       AW.1/AW.2 — an ORDERED LIST of picks now, up to brief.concepts:
       rows are checks (several may be on), picking commits through
       templatesTogglePick, from here or from Styles. */
    function openTemplateSetMenu(btn) {
      if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
      const menu = el('<div class="pt-set-menu pt-set-menu--flow" role="menu" aria-hidden="true"></div>');
      // A style guide pick is a layout pick too (AN.1): the generic row
      // for the guide's layout reads checked, the same row the Layout
      // pill names. Nothing picked stays nothing checked.
      const curLayouts = mediaSetup.templates.map((id) => SET_BRAND_BY_ID[id] ? SET_BRAND_BY_ID[id].layout : id);
      const badgeFor = (id) => { const at = curLayouts.indexOf(id); return at === -1 ? null : SET_LETTERS_EXT[at]; };
      menu.innerHTML =
        '<div class="pt-set-col">' +
          '<div class="pt-set-sec">Layouts · ' + mediaSetup.templates.length + ' of ' + Math.max(1, brief.concepts) + '</div>' +
          ALL_LAYOUT_IDS.map((id) => setPickItemHTML(
            setTemplatePreview(id), LAYOUT_NAME[id], SET_TEMPLATE_SUB[id], curLayouts.indexOf(id) !== -1,
            null, false, 'data-set-template="' + id + '"', true, badgeFor(id)
          )).join('') +
        '</div>' +
        yourTemplatesColHTML((id) => curLayouts.indexOf(id) !== -1, 'set-template', true, badgeFor); // AK.4 — after Generic, inside this same one-column panel
      menu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-set-template]');
        if (!item) return;
        const id = item.getAttribute('data-set-template');
        const picked = templatesTogglePick(id); // AW.1/AW.2 — check rows: on picks (append/replace-at-cap/exclusive), off unpicks
        // AK.4 — a Studio-saved template deals its colorway too (one
        // colorway per the 9/10 rule, now the Styles panel's own
        // colorway group, §BM) — only on the pick itself, never on an
        // unpick. §BM — picking a generic layout can also replace an
        // exclusive guide pick (AW.1 above); when that leaves Generated
        // with nothing picked at all, drop the guide's colorway
        // override with it, same as the retired Color pill resting
        // empty.
        const custom = studioTemplateById(id);
        if (picked && custom && custom.colorway) mediaSetup.colorways = [custom.colorway];
        else if (!mediaSetup.templates.length) mediaSetup.colorways = [];
        syncTemplatePickRows(menu, mediaSetup.templates);
        renderSettingsPillLabels(btn.closest('.pt-set-row'));
        syncMediaModeStage();
      });
      openSetMenu(btn, menu);
    }
    /* AI.1 — Styles, its own one-column panel: the Brand Approved
       roster (AA.3's search, the whole grouped roster since 9/15) that
       used to be Layouts' second column, now reached from its own
       pill. Still the Sizes roster's own data-attribute delegate on
       the SAME mediaSetup.templates field Layouts writes to. AW.1 — a
       guide is still a single, exclusive pick (never a check-row set
       — these rows stay radios): picking one REPLACES the list
       outright with [guide], from here or from Layouts, and a generic
       pick there replaces a guide here the same way. Guides never
       resolve through studioTemplateById (that id namespace is
       Studio-saved templates only, Layouts' own door).
       §BT — Colour comes from the style guide only; the Colorway
       group (styleColorwaySpecimenCompactHTML/styleColorwayGroupHTML,
       the compact override grid, and its click wiring) retires.
       Picking a guide sets mediaSetup.colorways to that guide's own
       colorway — no override — so the brief still records a colorway
       exactly as before, and varietyFor (19-sheet-c-variety.js) reads
       that field first, falling back to the guide's own colorway only
       when nothing has been picked. When this door is open FROM
       Studio (wireStudioStyleGroup), a pick also recolours the
       currently-open unit live — the retired swatch override was the
       only other way that unit's colour could change, so the guide
       pick is now the sole "Studio unit recolours" door §BT's
       acceptance calls for. */
    function openStyleSetMenu(btn) {
      if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
      // §BT — the roster alone no longer runs as tall as it did with
      // the colorway group beneath it, but --capped stays: the roster
      // itself can still run taller than the viewport at 1306×824.
      const menu = el('<div class="pt-set-menu pt-set-menu--flow pt-set-menu--capped" role="menu" aria-hidden="true"></div>');
      menu.innerHTML = '<div class="pt-set-col">' + brandRosterColHTML('data-set-template', mediaSetup.templates) + '</div>';
      wireBrandRosterCol(menu);
      menu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-set-template]');
        if (!item) return;
        const id = item.getAttribute('data-set-template');
        const picked = templatesTogglePick(id); // AW.1 — a guide is a whole look: picking replaces the list with [guide]; re-clicking the current guide unpicks it
        const guide = SET_BRAND_BY_ID[id];
        // §BT — color comes from the guide only: a fresh guide pick
        // sets its own colorway; unpicking back to Generated drops it,
        // same as the retired Color pill resting empty.
        if (picked && guide) mediaSetup.colorways = [guide.colorway];
        else if (!mediaSetup.templates.length) mediaSetup.colorways = [];
        // §BT — reached from Studio's own STYLE card: recolour the
        // live unit on the stage the same way the retired colorway
        // swatch used to (editorState, not just the hat's mediaSetup).
        if (inStudio && editorState) {
          const cw = (picked && guide) ? guide.colorway : 'gold-on-dark';
          editorState.colorway = cw;
          editorState.customColor = null;
          applyLiveColorwayToStage();
          renderEditorFilmstrip();
          syncStudioPanel();
          pushStudioHistory('Style → ' + (guide ? (guide.short || guide.name) : 'Generated'));
        }
        syncTemplatePickRows(menu, mediaSetup.templates); // one pick: this clears every other row
        renderSettingsPillLabels(btn.closest('.pt-set-row'));
        syncMediaModeStage();
        // AM.6 — this same door now also opens from Studio's Brand
        // drawer card (btn is the card there, not a hat pill); when it
        // does, re-paint that tool so the card itself picks up the
        // freshly-picked guide, the same same-tool-refresh idiom every
        // other Studio drawer pick already uses.
        if (inStudio && studioActiveTool === 'brand') renderStudioDrawer('brand');
      });
      openSetMenu(btn, menu);
    }

    /* ═══ AV.2 — Imagery's own popover. A MULTI-pick over the whole
       gallery (GALLERY_ITEMS — images and videos alike) into
       state.images, the pool conceptImagePool deals from at build
       time (14-hat-a-files.js); order = pick order, so picking
       APPENDS and un-picking SPLICES rather than resorting. Leads
       with an "Add image" tile (upload -> a fresh gallery frame,
       PREPENDED to GALLERY_ITEMS so every other surface reading that
       one array — the band's Imagery pane, Studio's gallery, the
       strip — sees it too) and reuses the band's own
       .pt-editor-swap-thumb recipe for every tile, sized up to 64px
       by .pt-imagery-set-grid (22-hat-c-wizard.css) rather than a
       second thumb component. AJ.0 — every pick below only ever calls
       syncMediaModeStage (resting viewfinder + bar chrome), the exact
       call Color's own wireSetPill pick already makes; #ptConcepts
       itself is never referenced, so a board already on the sheet is
       never touched. ═══ */
    function imageryIsPicked(id) {
      return state.images.some((img) => img.id === id);
    }
    // Toggle semantics only — the caller repaints and re-syncs after.
    function imageryTogglePick(frame) {
      const i = state.images.findIndex((img) => img.id === frame.id);
      if (i === -1) { state.images.push(frame); return; }
      state.images.splice(i, 1);
    }
    // §BY — "we already have designs for when images/video are
    // attached to chat — pick those up": state.images (this popover's
    // pick set) is reconciled into the composer's real attach chips
    // through the SAME door BR.5's `+`-attach gallery pick already
    // uses (_caAddLibraryItem, 12-shell-c-chat.js — de-duped by src
    // there, so a frame already chipped via `+` is reused, never
    // doubled). imageryChipSrcs is what THIS door believes it has
    // nested, so un-picking here only ever retracts a chip this door
    // put up — a `+`-attached chip for the same src that the overlay
    // never touched is left alone. Every popover mutation below
    // (thumb toggle, Add tile, drop, View gallery) funnels through
    // afterMeta(), so folding the sync in there covers all of them.
    let imageryChipSrcs = [];
    function syncImageryChipsFromState() {
      if (typeof window._caAddLibraryItem !== 'function') return;
      const want = {};
      state.images.forEach((f) => {
        if (!f || !f.src) return;
        want[f.src] = true;
        flowMergeImage(f.src); // BR.5's own pool — one pool, both doors (renderMmGhosts below covers the repaint)
        window._caAddLibraryItem({ src: f.src, label: f.label, kind: f.kind === 'video' ? 'video' : 'image' });
      });
      imageryChipSrcs.forEach((src) => {
        if (want[src]) return;
        // state.images has ALREADY lost this src by the time sync runs
        // (imageryTogglePick/the 'View gallery' replace both mutate it
        // before calling afterMeta) — flowRemoveImage here directly,
        // never relying on the reverse _ptOnAttachmentRemoved hook
        // _caRemoveAttachmentBySrc triggers: that hook no-ops (correctly)
        // on a src it can no longer find in state.images, so a pool
        // entry would otherwise survive a THUMB-driven un-pick (only a
        // chip's own × would have shrunk it, breaking "deselecting in
        // the overlay" parity with "× on a chip").
        flowRemoveImage(src);
        if (typeof window._caRemoveAttachmentBySrc === 'function') window._caRemoveAttachmentBySrc(src);
      });
      imageryChipSrcs = Object.keys(want);
      renderMmGhosts(); // the blanks re-deal against the shrunk pool
    }
    // The reverse half: × on a chip deselects it here too. Scoped to
    // the settings row the same way _ptFlowIntakeFile already is — a
    // chip removed anywhere else (a resolved board's own chat) never
    // reaches this door.
    window._ptOnAttachmentRemoved = function (att) {
      if (!att || !att.url || !settingsStepMounted()) return;
      const i = state.images.findIndex((f) => f.src === att.url);
      if (i === -1) return;
      state.images.splice(i, 1);
      imageryChipSrcs = imageryChipSrcs.filter((s) => s !== att.url);
      flowRemoveImage(att.url);
      renderMmGhosts(); // the blanks re-deal with one fewer image
      renderSettingsPillLabels(hatWizardBody && hatWizardBody.querySelector('.pt-set-row'));
      // Uncheck the live thumb if the popover happens to be open.
      if (setOpenMenu && setOpenMenu.menu) {
        const frame = GALLERY_ITEMS.filter((f) => f.src === att.url)[0];
        const thumb = frame && setOpenMenu.menu.querySelector('[data-image-id="' + frame.id + '"]');
        if (thumb) thumb.classList.remove('is-active');
      }
    };
    function imageryThumbHTML(f) {
      const isOn = imageryIsPicked(f.id);
      const inner = f.kind === 'video'
        ? '<video data-src="' + f.src + '" muted loop playsinline preload="metadata" disablepictureinpicture></video>'
        : '<img src="' + f.src + '" alt="" loading="lazy">';
      // The corner check is the accent-ring recipe's own companion
      // (.pt-imagery-thumb-check, modelled on the env picker's
      // .pt-env-frame-check) — is-active (already .pt-editor-swap-
      // thumb's own ring toggle) lights both at once.
      return '<button class="pt-editor-swap-thumb' + (f.kind === 'video' ? ' is-video' : '') + (isOn ? ' is-active' : '') + '" type="button"' +
        ' data-image-id="' + f.id + '" title="' + escape(f.label) + '">' + inner +
        '<span class="pt-imagery-thumb-check" aria-hidden="true">' + ICONS.check + '</span>' +
      '</button>';
    }
    function imageryAddTileHTML() {
      return '<button class="pt-imagery-add-tile" type="button" data-image-add aria-label="Add image">' +
        '<span class="pt-imagery-add-icon" aria-hidden="true">' + ICONS.plus + '</span>' +
        '<span class="pt-imagery-add-label">Add image</span>' +
      '</button>';
    }
    // Same hidden-input anatomy as handleUpload above (accept, hidden,
    // body-appended, change -> cleanup -> callback, click()) — grep
    // URL.createObjectURL — just handing back the FILE instead of
    // assigning state.images directly, since here a gallery frame has
    // to exist before anything can be picked into it.
    function imageryOpenFilePicker(onFile) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (input.parentNode) input.parentNode.removeChild(input);
        if (file) onFile(file);
      });
      input.click();
    }
    let imageryUploadN = 0;
    // 9/15 — split in two: galleryAddFrameFromFile puts a picked file in
    // the gallery everywhere (the band's Imagery pane uses it through
    // window._ptGalleryAddFrame and lands the frame on the selection);
    // imageryAddFrameFromFile is the hat's door, which also picks it
    // into the brief.
    function galleryAddFrameFromFile(file) {
      imageryUploadN += 1;
      const frame = {
        id: 'upload-' + imageryUploadN,
        src: URL.createObjectURL(file),
        label: (file.name || 'Uploaded image').replace(/\.[a-z0-9]+$/i, ''),
        kind: 'image',
        focal: { x: 50, y: 50 }
      };
      GALLERY_ITEMS.unshift(frame); // the band's Imagery pane / Studio's gallery / the strip all read this same live array
      // AV.2 — rebuild the band's own swap list ONLY if it was already
      // built once (renderBandFieldLists' own once-only guard,
      // 19-sheet-c-variety.js) — a pick before the band tray has ever
      // opened leaves it alone; the tray's own first build already
      // reads GALLERY_ITEMS fresh, upload included.
      const iList = document.getElementById('ptImageSwapList');
      if (iList && iList.children.length) renderImageSwapList();
      return frame;
    }
    function imageryAddFrameFromFile(file) {
      const frame = galleryAddFrameFromFile(file);
      state.images.push(frame); // pick order — a fresh upload counts as its own pick, appended like any other
      return frame;
    }
    function openImagerySetMenu(btn) {
      if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
      const menu = el('<div class="pt-set-menu pt-set-menu--fit" role="menu" aria-hidden="true"></div>');
      const row = btn.closest('.pt-set-row');
      // Bryan, 9/15 ("this should have search and view gallery button"):
      // the Styles roster's own search field above the grid (a query
      // filters the thumbs by their label, the eyebrow reads "N
      // matches"), and the hat's own See-all link as the footer,
      // opening Your Gallery (openEnvOverlay, the hat's pick-1-to-3
      // door) whose picks become the brief's images. The query lives
      // here so a repaint (an added file) keeps it.
      let query = '';
      const GALLERY_ARROW = '<span class="pt-seeall-link-arrow" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"/></svg></span>';
      function applySearch() {
        const q = query.trim().toLowerCase();
        const eyebrow = menu.querySelector('[data-imagery-eyebrow]');
        const empty = menu.querySelector('[data-imagery-empty]');
        let shown = 0;
        Array.prototype.forEach.call(menu.querySelectorAll('[data-image-id]'), (thumb) => {
          const f = GALLERY_ITEMS.filter((g) => g.id === thumb.getAttribute('data-image-id'))[0];
          const hit = !q || (f && (f.label || '').toLowerCase().indexOf(q) !== -1);
          thumb.hidden = !hit;
          if (hit) shown++;
        });
        if (eyebrow) eyebrow.textContent = q ? (shown + (shown === 1 ? ' match' : ' matches')) : ('Imagery \u00b7 ' + GALLERY_ITEMS.length);
        if (empty) empty.hidden = !q || shown !== 0;
      }
      function paint() {
        menu.innerHTML = '<div class="pt-set-sec" data-imagery-eyebrow>Imagery · ' + GALLERY_ITEMS.length + '</div>' +
          '<div class="pt-set-roster-search pt-imagery-set-search"><input class="pt-cta-input" type="search" placeholder="Search images\u2026" aria-label="Search images" autocomplete="off" data-imagery-search></div>' +
          '<div class="pt-imagery-set-grid">' +
            imageryAddTileHTML() +
            GALLERY_ITEMS.map(imageryThumbHTML).join('') +
          '</div>' +
          '<div class="pt-set-roster-empty" data-imagery-empty hidden>No images match</div>' +
          '<button class="pt-seeall-link pt-imagery-gallery-link" type="button" data-imagery-gallery><span>View gallery</span>' + GALLERY_ARROW + '</button>';
        const search = menu.querySelector('[data-imagery-search]');
        if (search) search.value = query;
        observeEnvVideoSrc(menu);
        applySearch();
      }
      menu.addEventListener('input', (e) => {
        if (!e.target.matches('[data-imagery-search]')) return;
        query = e.target.value;
        applySearch();
      });
      menu.addEventListener('keydown', (e) => {
        if (!e.target.matches('[data-imagery-search]')) return;
        if (e.key === 'Escape' && e.target.value) { e.target.value = ''; query = ''; applySearch(); e.stopPropagation(); }
      });
      // A fresh frame (the Add tile) shifts the whole grid, so THAT
      // path repaints; a plain pick never does — full-blown, since
      // .pt-set-menu never scrolls (pt-set-menu--fit — nothing to
      // preserve there), but because a click on a thumb is still
      // bubbling when this handler runs: innerHTML-ing the grid mid-
      // bubble detaches the very node the click targeted, and the
      // document-level outside-click listener (above, `setOpenMenu.
      // menu.contains(e.target)`) then sees a detached target, reads
      // that as "outside", and closes the menu out from under the
      // pick. wireSetPill's own multi-pick mode sidesteps the same
      // trap the same way (setItemChecked flips the row in place,
      // never rebuilds it) — a plain toggle here does the same: flip
      // the clicked button's own class, nothing else in the DOM moves.
      function afterMeta() {
        renderSettingsPillLabels(row);
        syncMediaModeStage();
        syncImageryChipsFromState(); // §BY — every pick/un-pick in this popover funnels through here
      }
      paint();
      menu.addEventListener('click', (e) => {
        if (e.target.closest('[data-imagery-search]')) { e.stopPropagation(); return; }
        if (e.target.closest('[data-imagery-gallery]')) {
          // Your Gallery, the hat's own multi door: its picks REPLACE
          // the brief's images (as the Files pane's own door does).
          e.stopPropagation();
          closeSetMenu();
          openEnvOverlay((chosen) => {
            state.images = chosen.slice();
            afterMeta();
          }, 'multi');
          return;
        }
        if (e.target.closest('[data-image-add]')) {
          // Runs off the hidden input's own 'change' event — a separate,
          // later dispatch (the native file dialog is async), never
          // inside this click's own bubble — so a full repaint is safe.
          imageryOpenFilePicker((file) => { imageryAddFrameFromFile(file); paint(); afterMeta(); });
          return;
        }
        const thumb = e.target.closest('[data-image-id]');
        if (!thumb) return;
        const frame = GALLERY_ITEMS.filter((f) => f.id === thumb.getAttribute('data-image-id'))[0];
        if (!frame) return;
        imageryTogglePick(frame);
        thumb.classList.toggle('is-active', imageryIsPicked(frame.id));
        afterMeta();
      });
      // Dropping an image file on the Add tile does what clicking it
      // + picking the file does — delegated on the menu itself
      // (dragover/drop both bubble) so a repaint never stray-orphans
      // a per-element listener. stopPropagation on the drop is load-
      // bearing: window's own drop-to-attach listener (12-shell-c-
      // chat.js) is unscoped and would otherwise ALSO fire on this
      // same drop and add the file as a composer chip too — the
      // composer's attach chips stay theirs, never doubled by this
      // door.
      menu.addEventListener('dragover', (e) => {
        if (!e.target.closest('[data-image-add]')) return;
        e.preventDefault();
      });
      menu.addEventListener('drop', (e) => {
        if (!e.target.closest('[data-image-add]')) return;
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file || !/^image\//.test(file.type)) return;
        imageryAddFrameFromFile(file);
        paint();
        afterMeta();
      });
      openSetMenu(btn, menu);
    }

    // One checked size shows its own label (the pill's resting state);
    // several collapse to a count, since no one of them is primary and
    // spelling them out would blow the pill's width open.
    function sizePillLabel() {
      const rec = SIZES.filter(s => s.id === mediaSetup.sizes[0])[0];
      // V1 — Board at now reaches the full IAB roster, not just these
      // 9, so the fallback formats whatever comes back the same way
      // (× not x) instead of only ever labelling those original 9.
      return rec ? rec.label : String(mediaSetup.sizes[0] || 'Size').replace('x', '×');
    }
    /* A set of one shows its own name (the pill's resting voice); more
       than one collapses to a count; none falls back to the pill's
       generic label, which is the "brand default" state. */
    function setPillLabel(set, nameOf, generic, plural) {
      if (!set.length) return generic;
      if (set.length === 1) return nameOf(set[0]);
      return set.length + ' ' + plural;
    }
    /* AW.4 — "Layouts" (none), the one pick's own name (one — a guide
       reads its layout's name via templateLabel, same as always), both
       names joined for two, a count from three on (the pill has no
       room to spell out three or more). */
    function templatesPillLabel() {
      const list = mediaSetup.templates;
      if (!list.length) return 'Layouts';
      if (list.length === 1) return templateLabel(list[0]);
      if (list.length === 2) return list.map(templateLabel).join(' · ');
      return list.length + ' layouts';
    }
    function renderSettingsPillLabels(row) {
      if (!row) return;
      const labels = {
        size: sizePillLabel(),
        template: templatesPillLabel(), // AW.4
        style: styleGuideLabel(mediaSetup.templates[0]) || 'Styles', // AI.1 — the first pick; only ever a guide when the list is that one guide alone (AW.1)
        image: setPillLabel(state.images, (img) => img.label, 'Imagery', 'images') // AV.1
      };
      Object.keys(labels).forEach((key) => {
        const el2 = row.querySelector('[data-pt-set="' + key + '"] .pt-set-label');
        if (el2) el2.textContent = labels[key];
      });
    }

    // AK.5 — extracted so Studio's own hat row (renderStudioHatBody)
    // can mount the SAME pills row the fork step does: "exactly as
    // the media pills are at this point in the file" (AK.5's own
    // words) means literally this markup + this wiring, not a copy.
    function pillsRowHTML() {
      return (
        '<div class="pt-set-row" data-pt-step="settings">' +
          /* 9/10 (Bryan: "tool tips for what these are when hovering") —
             each pill carries one line, the Package button's own tip
             recipe (.pt-set-tip = .pt-package-tip's values). */
          '<button class="pt-set-pill" type="button" data-pt-set="size" aria-haspopup="menu" aria-expanded="false" aria-label="Sizes">' +
            '<span class="pt-set-pill-icon" aria-hidden="true">' + SET_ICONS.size + '</span>' +
            '<span class="pt-set-label">300×250</span>' + SET_ICONS.caret +
            '<span class="pt-set-tip" role="tooltip">Banner size</span>' +
          '</button>' +
          '<button class="pt-set-pill" type="button" data-pt-set="template" aria-haspopup="menu" aria-expanded="false" aria-label="Layouts">' +
            '<span class="pt-set-pill-icon" aria-hidden="true">' + SET_ICONS.template + '</span>' +
            '<span class="pt-set-label">Layouts</span>' + SET_ICONS.caret +
            '<span class="pt-set-tip" role="tooltip">Layout</span>' +
          '</button>' +
          /* AI.1 — Styles, its own pill now: the roster of brand-
             approved guides that used to be the Layouts menu's second
             column. SET_ICONS.bookOpen (the shell's own "book" glyph,
             already drawn — AA's plan keeps calling these guides "the
             book") stands in for a drawn icon — copied in from
             SKILL_ICONS, the hairline SET_ICONS family's own object
             having no book/guide entry to reuse as-is. */
          '<button class="pt-set-pill" type="button" data-pt-set="style" aria-haspopup="menu" aria-expanded="false" aria-label="Styles">' +
            '<span class="pt-set-pill-icon" aria-hidden="true">' + SET_ICONS.bookOpen + '</span>' +
            '<span class="pt-set-label">Styles</span>' + SET_ICONS.caret +
            '<span class="pt-set-tip" role="tooltip">Style guide</span>' +
          '</button>' +
          /* BM.2 — Imagery, after Styles: pick and add images for the
             brief. Its label reads the generic word with nothing
             picked (the build falls back to the default frame, as
             today), the one picked image's own name with one, "N
             images" past that — setPillLabel's own three-state
             recipe. §BM retired the Color pill (folded into Styles
             below) and the Volume pill (fixed at 3 × 3) that used to
             sit around this one. */
          '<button class="pt-set-pill" type="button" data-pt-set="image" aria-haspopup="menu" aria-expanded="false" aria-label="Imagery">' +
            '<span class="pt-set-pill-icon" aria-hidden="true">' + SET_ICONS.image + '</span>' +
            '<span class="pt-set-label">Imagery</span>' + SET_ICONS.caret +
            '<span class="pt-set-tip" role="tooltip">Imagery</span>' +
          '</button>' +
        '</div>'
      );
    }
    function wirePillsRow(row) {
      /* V1 (PLAN.md §V) — Size opens the same two-section content the
         toolbar's Sizes chip does (Board at radio + Ships at checks,
         both over the full IAB roster) and writes brief.boardSize /
         brief.shipSizes directly — openSizeSetMenu, by the Sizes
         cluster below, alongside brief itself. The pill's own label
         (sizePillLabel) still shows just the board size, as before. */
      row.querySelector('[data-pt-set="size"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openSizeSetMenu(e.currentTarget);
      });
      /* AI.1 — Layouts is its own one-column panel now: the nine
         generic shapes exactly as the GENERIC column always was, plus
         YOUR TEMPLATES (AK.4) after it when Studio has saved any —
         the style-guide roster split out to the Styles pill below.
         Still a SET pick (multi-select, same semantics as Sizes/Color)
         and still its own custom door — AA.3's search/expand state on
         the roster is gone from THIS panel, but openTemplateSetMenu
         stays the Sizes roster's own pattern (openSizeSetMenu), not
         wireSetPill, so Generic and Your Templates share one door. */
      row.querySelector('[data-pt-set="template"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openTemplateSetMenu(e.currentTarget);
      });
      /* AI.1 — Styles: the roster that used to be Layouts' second
         column, now its own panel/door (openStyleSetMenu) — same
         mediaSetup.templates field Layouts writes to (AW.1: a guide
         pick DOES replace a generic/Your-Templates pick and vice
         versa, via the shared templatesTogglePick door), same "picking
         a guide deals its layout+colorway" contract, just reached from
         its own pill so the two read as the two different questions
         Bryan asked for: WHAT SHAPE and WHOSE LOOK. */
      row.querySelector('[data-pt-set="style"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openStyleSetMenu(e.currentTarget);
      });
      /* AV.1/AV.2 — Imagery: a MULTI-pick over the whole gallery plus
         an upload door, neither of which fits wireSetPill's one flat
         list of value rows (the Add tile isn't a value pick) — its
         own door, same as Size/Layouts/Styles above. */
      row.querySelector('[data-pt-set="image"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openImagerySetMenu(e.currentTarget);
      });
      renderSettingsPillLabels(row);
    }
    function renderForkStepBody(container) {
      closeSetMenu(); // never leave a hoisted menu behind a step swap
      // §BM — the "Describe the campaign below and send — or step
      // through it: Guided · Studio" hint and its two fork buttons
      // retired (colleague feedback via Bryan, 9/18: "remove the
      // studio and guided flow"). Only the pills row mounts here now.
      // openStudio() itself (the banner editor) is untouched — it is
      // still reached from a unit on the sheet, just not from this hint.
      container.innerHTML = pillsRowHTML();
      wirePillsRow(container.querySelector('.pt-set-row'));
    }

    // True only while the settings row is actually mounted in the hat —
    // the check every settings-aware branch below keys off, rather than
    // wizardStep === -1, which is also the resting value once the
    // wizard has exited entirely.
    function settingsStepMounted() {
      return !!(hatWizardBody && hatWizardBody.querySelector('.pt-set-row'));
    }

    // Composer hand-off. send() (outer IIFE, ~L41396) calls this after
    // it has posted the user's brief to the chat; a true return means
    // "consumed — don't post the generic ack", and the generate runs
    // off the pills instead of the 4-step wizard.
    // ═══ AK.5 — the hat, inside Studio. SEND edits THIS banner via a
    //     small intent map (deterministic demoware, same contract as
    //     the rest of this file — never a real NLP parser); "new set"
    //     (or a message that clearly asks for one) autosaves and runs
    //     the normal build from the pills instead, with the message
    //     as the brief. ═══
    const STUDIO_NEW_SET_RE = /\b(new set|new batch|generate \d+ concepts?)\b/i;
    // image/photo/… → the matching gallery frame by tag — a keyword
    // search over GALLERY_ITEMS' own ids/labels (no invented taxonomy:
    // every hit is a real asset, "photo"/"image"/"picture" alone falls
    // back to the file's own deterministic GENERATE_IMAGE_ID).
    function studioFindImageByTag(q) {
      const hit = GALLERY_ITEMS.filter(f => q.indexOf(f.id.replace(/[-_]/g, ' ')) !== -1 || q.indexOf(f.label.toLowerCase()) !== -1)[0];
      if (hit) return hit;
      if (/\b(photo|image|picture)\b/.test(q)) return findFrame(GENERATE_IMAGE_ID);
      return null;
    }
    function studioFindColorway(q) {
      const hit = COLORWAYS.filter(cw => q.indexOf(cw.label.toLowerCase()) !== -1)[0];
      if (hit) return hit;
      if (/\bdark\b/.test(q)) return COLORWAYS.filter(c => c.id === 'white-on-dark')[0];
      if (/\blight\b/.test(q)) return COLORWAYS.filter(c => c.id === 'gold-on-light')[0];
      if (/\bgold\b/.test(q)) return COLORWAYS.filter(c => c.id === 'gold-on-dark')[0];
      if (/\bblack\b/.test(q)) return COLORWAYS.filter(c => c.id === 'dark-on-black')[0];
      return null;
    }
    function studioFindLayout(q) {
      return ALL_LAYOUT_IDS.filter(id => q.indexOf(LAYOUT_NAME[id].toLowerCase()) !== -1 || q.indexOf(id.replace(/-/g, ' ')) !== -1)[0] || null;
    }
    function handleStudioSend(text, atts) {
      if (!inStudio || !editorState) return false;
      const v = (text || '').trim();
      if (!v) return false; // an attachment-only send isn't part of AK.5's map — falls through to the generic ack
      if (STUDIO_NEW_SET_RE.test(v)) { studioStartNewSet(); return true; }
      const q = v.toLowerCase();
      let did = null;
      if (/\b(headline|title)\b/.test(q)) {
        const quoted = v.match(/["“]([^"”]+)["”]/);
        editorState.headline = quoted ? quoted[1] : ALL_COPY_PAIRS[studioWriteForMeIdx++ % ALL_COPY_PAIRS.length].headline;
        did = 'headline';
      } else if (/\b(cta|button)\b/.test(q)) {
        const quoted = v.match(/["“]([^"”]+)["”]/);
        editorState.cta = quoted ? quoted[1] : ALL_COPY_PAIRS[studioWriteForMeIdx++ % ALL_COPY_PAIRS.length].cta;
        did = 'CTA';
      } else {
        const img = studioFindImageByTag(q);
        const layoutId = studioFindLayout(q);
        const cw = studioFindColorway(q);
        if (img) { editorState.imageSrc = img.src; crossfadeStageImage(img.src); did = 'image'; }
        else if (layoutId) { editorState.layoutId = layoutId; did = 'layout'; }
        else if (cw) { editorState.colorway = cw.id; editorState.customColor = null; did = 'colors'; }
        else if (/\b(bigger|smaller)\b/.test(q)) {
          const ids = FONT_LIST.map(f => f.id);
          const idx = ids.indexOf(editorState.font);
          const dir = /\bbigger\b/.test(q) ? 1 : -1;
          const nextIdx = Math.max(0, Math.min(FONT_LIST.length - 1, (idx === -1 ? 0 : idx) + dir));
          editorState.font = ids[nextIdx];
          did = 'font';
        }
      }
      if (!did) {
        ptBot('Tell me what to change — the headline, the CTA, the image, the layout or the colors.');
        return true;
      }
      if (did !== 'image') renderEditorStage();
      renderEditorFilmstrip();
      if (studioActiveTool) renderStudioDrawer(studioActiveTool);
      syncStudioHatRow();
      pushStudioHistory('Chat: ' + v.slice(0, 40));
      ptBot('Done — ' + did + ' updated.');
      return true;
    }
    window._ptMediaSettingsSubmit = function (atts, text) {
      if (inStudio) return handleStudioSend(text, atts); // AK.5 — the dead end this door used to be
      if (!settingsStepMounted()) return false;
      closeSetMenu();
      // §BR.5 — "or pasted text": a multi-line brief sent from here is
      // read as a pasted deck first (never a single-line one, which
      // this never touches), landing in flowPools ahead of the reset
      // buildConceptSheetDOM runs a moment from now.
      flowIntakePastedText(text);
      /* Imagery the user attached to this very brief — gallery frames
         from the + menu or the Imagery overlay (§BY, same chip either
         way), or uploads — becomes the sheet's image pool. Image AND
         video chips qualify; a copy deck has no frame to put in a
         banner. Nothing attached leaves state.images alone, so a
         Guided-step pick from earlier still stands. */
      const picked = (atts || [])
        .filter(a => a && (a.kind === 'image' || a.kind === 'video') && a.url)
        .map(a => ({ id: a.id, src: a.url, label: a.name, kind: a.kind }));
      if (picked.length) state.images = picked;
      state.sizes = mediaSetup.sizes.slice();
      /* A brand template resolves to the layout it is built on — the
         banner engine only speaks layout ids. state.layout (the
         skeleton/placeholder renderer's own input, see
         skelConceptRowsHTML) needs a ONE real shape id, never a guide
         id or the 'diagonal' Generated sentinel, so it reads the
         FIRST pick's resolved id (AW.1 — a list now; this single-
         value field can only ever represent one row's worth, same as
         the skeleton it feeds — AL.11 owns making that row-accurate,
         out of scope here). */
      state.layout = mediaSetup.templates.length ? templateLayoutId(mediaSetup.templates[0]) : 'split'; // 9/10 — no layout picked generates Split, the blueprint's own resting default (diagonal ellipsized every headline at 300×250)
      /* What the hat picked IS the sheet's opening variety, so the
         header menus land pre-set rather than resetting the user's
         choices the moment the sheet appears.
         AA.2 bugfix — pendingSheetVariety carries the RAW picks
         (through templatesDealFor), never resolved shape ids:
         varietyFor's own guide lock (SET_BRAND_BY_ID[id]) only ever
         matches a RAW guide id like "brand-precision-series" —
         resolving to "split-reverse" first destroyed that identity
         before varietyFor ever saw it, so a guide picked from the
         hat's Layouts pill always rendered gold-on-dark (the Color
         pill's own default) instead of the guide's own locked
         colorway. AW.1/AW.6 — templatesDealFor turns the pick LIST
         into the flat array varietyFor deals from when the deal isn't
         per concept: Generated (nothing picked, or the sole
         'diagonal' pick) becomes the nine generics; a real pick list
         becomes itself (buildConceptSheetDOM reads that same list
         again, by concept, to actually assign each row's layout —
         this array only ever drives colorway/guide-lock cycling and
         the band's own multi-value Layout field). */
      pendingSheetVariety = { templates: templatesDealFor(mediaSetup.templates), colorways: mediaSetup.colorways.slice() };
      // V2 (PLAN.md §V) — the volume the settings row's own Volume pill
      // (or the sheet's Generate menu, once a sheet exists) set, not
      // the SHEET_ROWS constant — this is the door that makes the
      // first generate obey it.
      runGenerateInHat(hatWizardBody, brief.concepts, text); // AR.1 — the message names the board
      return true;
    };
    function renderForkStep() {
      const isFirstShow = !hatWizardBody.firstChild;
      wizardStep = -1;
      updateHatStepChrome(-1);
      const build = () => {
        hatWizardBody.innerHTML = '';
        // Safety net for the P8 copy editor's taller cap: any step
        // swap tears down its DOM without necessarily running
        // renderCopyStep's own unmountEditor (e.g. Back from step 2
        // to the fork), so clear the class here too.
        if (auxPanel) auxPanel.classList.remove('pt-copy-editor-open');
        // Settings surface, not a numbered step — its own header text
        // and the restored accent dot (see .pt-settings-step in CSS).
        if (auxPanel) auxPanel.classList.add('pt-settings-step');
        setAuxTitle(AUX_TITLE_SETTINGS);
        renderForkStepBody(hatWizardBody);
        syncMediaModeStage();
        syncMediaTopbar(); // Y — settings pills just mounted; the Media bar is the canvas top from here, sheet or no sheet
      };
      if (isFirstShow) { build(); return; }
      hatWizardBody.classList.add('is-swapping');
      setTimeout(() => {
        build();
        hatWizardBody.classList.remove('is-swapping');
      }, 220);
    }

    // In-place step swap — mirrors .ch-prompt.is-swapping exactly
    // (opacity+blur down, rebuild, back up, 220ms to match its CSS
    // transition) so moving between steps reads as "the shell's own
    // motion language," not a bespoke one.
    function renderHatStep(stepIndex) {
      const isFirstShow = !hatWizardBody.firstChild;
      wizardStep = stepIndex;
      updateHatStepChrome(stepIndex);
      const build = () => {
        hatWizardBody.innerHTML = '';
        // Safety net for the P8 copy editor's taller cap — see the
        // matching comment in renderForkStep's own build().
        if (auxPanel) auxPanel.classList.remove('pt-copy-editor-open');
        // Leaving the settings surface for a numbered Guided step —
        // header reverts to "Media" and drops the accent dot again.
        if (auxPanel) auxPanel.classList.remove('pt-settings-step');
        setAuxTitle(AUX_TITLE_MEDIA);
        closeSetMenu();
        STEP_RENDERERS[stepIndex](hatWizardBody);
        syncMediaModeStage(); // ACTIVE BRIEF 9/1c — ghost grid/caption/title track the live step, after its own DOM (incl. sizes chips) actually exists
        syncMediaTopbar(); // Y — a Guided step keeps the takeover (and so the bar) up; harmless if it was already
      };
      if (isFirstShow) { build(); return; }
      hatWizardBody.classList.add('is-swapping');
      setTimeout(() => {
        build();
        hatWizardBody.classList.remove('is-swapping');
      }, 220);
    }

    // Shared "go back one step, or exit at step 1" — the hat's own
    // Back pill, the mode surface's OWN Back pill (#ptMediaModeBack),
    // and Escape while the mode surface is up all funnel through this
    // one door, per the ACTIVE BRIEF's "Escape while mode is up = Back".
    function handleWizardBack() {
      // AG.4 — same rule as Package below, checked first: "Back (the
      // bar's), Escape … return to the board exactly as it was, the
      // strip's frames unchanged."
      const viewerEl = document.getElementById('ptSelectsViewer');
      if (viewerEl && viewerEl.getAttribute('data-visible') === '1') { closeSelectsViewer(); return; }
      // AF.1 — "Back (the bar's) … close it and return to the board
      // exactly as it was": Package's overlay, not the wizard, owns
      // this Back while it's open — checked first since it shares the
      // bar with whatever step/board would otherwise be underneath.
      const pkgEl = document.getElementById('ptPackage');
      if (pkgEl && pkgEl.getAttribute('data-visible') === '1') { closePackageOverlay(); return; }
      if (inStudio && studioUnitMode) { exitStudioUnitMode(false); return; } // AM.1 — back to the board, no apply
      if (inStudio) { exitStudioToDefault(); return; }
      if (wizardStep === -1) { exitWizardToDefault({ animate: true, leaveSheet: true }); return; } // at the fork — exit (animated, 9/10)
      if (wizardStep === 0) { renderForkStep(); return; } // Guided step 1 — back to the fork
      renderHatStep(wizardStep - 1);
    }
    // REWORK 9/1: #ptHatBack now lives inside .chat-aux-head, which
    // has its own click-to-toggle-expand listener (chatAuxHead, a
    // couple hundred lines up) — stop the click from bubbling there
    // so Back never also flips the hat's expanded state.
    if (hatBack) hatBack.addEventListener('click', (e) => { e.stopPropagation(); handleWizardBack(); });
    const mmBackBtn = document.getElementById('ptMediaModeBack');
    if (mmBackBtn) mmBackBtn.addEventListener('click', handleWizardBack);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      // Studio: first Escape closes an open drawer, second exits.
      if (inStudio && studioActiveTool) { closeStudioDrawer(); return; }
      // AM.1 — a unit opened from an already-resolved board: #ptMediaMode
      // is closed by then (finishGenerate's own closeMediaMode), so it
      // can't gate this exit the way Studio-from-hat's does below, which
      // only ever opens while that surface is still up.
      if (inStudio && studioUnitMode) { exitStudioUnitMode(false); return; }
      const modeEl = document.getElementById('ptMediaMode');
      if (modeEl && modeEl.getAttribute('data-visible') === '1') handleWizardBack();
    });

    // Clicking Media always opens the wizard. Once a sheet has already
    // resolved (the tiles/chips are reachable again — see the CSS
    // fix above), this is a deliberate "run it again" — the existing
    // sheet stays exactly as it is on the canvas, untouched, until
    // Generate lands a fresh one (buildConceptSheetDOM clears its
    // container first now, so re-generating replaces cleanly instead
    // of duplicating concept groups underneath the old ones).
    function startFlow() {
      if (flowRunning) { expandHat(); return; }
      cancelWizardExitAnim(); // 9/10 — Media again inside an animated Back: the exit is dropped, the wizard rebuilds in place
      clearHatBodyEase();
      flowRunning = true;
      if (auxPanel) auxPanel.classList.add('pt-wizard-active');
      // Clear any stale content left over from the last completed run
      // so renderHatStep(0) treats this as a true first-show (instant
      // build) instead of animating a fade through the old step.
      if (hatWizardBody) hatWizardBody.innerHTML = '';
      setAuxTitle(AUX_TITLE_SETTINGS);
      openMediaMode(); // ACTIVE BRIEF 9/1c — the canvas takeover begins
      expandHat();
      renderForkStep(); // the NEW MEDIA SETTINGS row, ahead of Guided's own 4 steps
    }

    function answerImageStep(tilesEl, btn) {
      tilesEl.classList.add('is-answered');
      if (btn) btn.classList.add('is-picked');
    }

    // ═══ STEP 1 — IMAGE ═══
    function renderImageStep(container) {
      container.innerHTML =
        '<p class="pt-msg-lede">First, the image.</p>' +
        '<div class="pt-tiles" data-pt-step="image">' +
          '<button class="pt-tile" type="button" data-pt-action="upload">' +
            '<span class="pt-tile-icon">' + ICONS.upload + '</span>' +
            '<span class="pt-tile-title">Upload</span>' +
            '<span class="pt-tile-desc">From your device</span>' +
          '</button>' +
          '<button class="pt-tile" type="button" data-pt-action="environment">' +
            '<span class="pt-tile-icon">' + ICONS.grid + '</span>' +
            '<span class="pt-tile-title">Your Gallery</span>' +
            '<span class="pt-tile-desc">Images &amp; videos — pick 1–3</span>' +
          '</button>' +
        '</div>';
      const tilesEl = container.querySelector('.pt-tiles');
      tilesEl.querySelector('[data-pt-action="upload"]').addEventListener('click', () => handleUpload(tilesEl, container));
      tilesEl.querySelector('[data-pt-action="environment"]').addEventListener('click', () => {
        openEnvOverlay((chosen) => {
          state.images = chosen;
          answerImageStep(tilesEl, tilesEl.querySelector('[data-pt-action="environment"]'));
          setTimeout(() => renderHatStep(1), 480);
        });
      });
    }

    function handleUpload(tilesEl, container) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (input.parentNode) input.parentNode.removeChild(input);
        if (!file) return;
        let att = null;
        if (typeof window._caAddFile === 'function') att = window._caAddFile(file);
        const url = att ? att.url : URL.createObjectURL(file);
        const name = att ? att.name : (file.name || 'Uploaded image');
        state.images = [{ id: 'upload', src: url, label: name }];
        answerImageStep(tilesEl, tilesEl.querySelector('[data-pt-action="upload"]'));
        if (typeof window._caTakeAttachments === 'function') window._caTakeAttachments();
        setTimeout(() => renderHatStep(1), 480);
      });
      input.click();
    }

    // ── Environment overlay — REUSE-AUDIT port of canvas-graphics'
    //    #c4RefGallery (S68): lazy-built, reused, body-appended, but
    //    now a PANE-BOUNDS overlay (applyEnvPaneBounds, the same
    //    measured-off-#canvas technique this shell's OWN placeVeil()
    //    already uses for #caDropVeil) instead of a viewport-fixed
    //    dimmed modal. See the CSS comment above .pt-env-overlay for
    //    the full anatomy breakdown. ──
    let envOverlayEl = null;
    let envPicked = [];
    let envResolve = null;
    // AS.2 — 'multi' (default: the hat's imagery step, pick 1-3) or
    // 'single' (Studio's Images drawer door: one still for the
    // current banner). Set fresh on every openEnvOverlay() call; the
    // grid/updateCount/click closures below all read this live (one
    // lazily-built overlay, a mode per open — never rebuilt).
    let envMode = 'multi';
    // Set inside buildEnvOverlay — lets the module-level capture-phase
    // Escape handler (onEnvOverlayKeydown) reach the search field's
    // own exit path. See its own comment for why this can't just be
    // an input-level listener (same race source S80.13/16 documents).
    let envSearchInputEl = null;
    let envExitSearchFn = null;
    function envReducedMotion() {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function envEscapeHTML(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    /* Same technique as this shell's own placeVeil() (#caDropVeil) /
       canvas-graphics' applyC4RefPaneBounds — measured off #canvas's
       live rect on every open + resize, never hardcoded. */
    function applyEnvPaneBounds() {
      const canvas = document.getElementById('canvas');
      if (!canvas || !envOverlayEl) return;
      const rect = canvas.getBoundingClientRect();
      envOverlayEl.style.top = rect.top + 'px';
      envOverlayEl.style.left = rect.left + 'px';
      envOverlayEl.style.width = rect.width + 'px';
      envOverlayEl.style.height = rect.height + 'px';
    }
    window.addEventListener('resize', () => {
      if (envOverlayEl && envOverlayEl.classList.contains('is-open')) applyEnvPaneBounds();
    });
    function onEnvOverlayKeydown(e) {
      if (e.key !== 'Escape') return;
      /* S80.13/16 — Escape while focus is INSIDE the search field
         must collapse only the field, never the whole overlay. This
         listener is bound at CAPTURE phase (below) specifically so it
         preempts the shell's own bubble-phase global Escape listener
         — but that same capture-phase binding means it ALSO fires
         before any listener on the search input itself (document is
         an ancestor visited during capture, strictly before the
         input's own "at target" listeners regardless of their own
         phase) — so the check has to live here, first, not on the
         input. */
      if (envSearchInputEl && document.activeElement === envSearchInputEl) {
        e.preventDefault();
        e.stopPropagation();
        if (envExitSearchFn) envExitSearchFn();
        return;
      }
      /* Capture phase + stopPropagation — the shell's own global
         Escape/closeAllMenus listener (bubble phase) would otherwise
         also fire; capturing first and stopping it means Escape here
         closes ONLY the picker. Literal S68 technique. */
      e.preventDefault();
      e.stopPropagation();
      closeEnvOverlay();
    }
    // IO-gated video-src promotion + hover-to-play for the gallery
    // grid — never autoplay all 29 clips at once. Same data-src
    // promotion technique as this file's own legacy .graphics-card
    // video cards (cardObs), scoped to #ptEnvGrid. Hover wiring runs
    // once at grid-build time; the IO pass itself is re-run on every
    // open (see openEnvOverlay) — at build time the overlay hasn't
    // had applyEnvPaneBounds() run yet, so its un-clipped intrinsic
    // box would make every tile read as "intersecting" and defeat
    // the whole point of lazy-loading.
    let envVideoObs = null;
    function wireEnvVideoHover(grid) {
      Array.prototype.forEach.call(grid.querySelectorAll('.pt-env-frame.is-video'), (tile) => {
        const v = tile.querySelector('video');
        if (!v) return;
        tile.addEventListener('mouseenter', () => {
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        });
        tile.addEventListener('mouseleave', () => {
          v.pause();
          try { v.currentTime = 0; } catch (_) {}
        });
      });
    }
    function observeEnvVideoSrc(grid) {
      if (envVideoObs) envVideoObs.disconnect();
      const videos = grid.querySelectorAll('video[data-src]');
      if (!videos.length) return;
      if ('IntersectionObserver' in window) {
        envVideoObs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const v = entry.target;
            if (v.dataset.src) {
              v.src = v.dataset.src;
              delete v.dataset.src;
              v.addEventListener('loadedmetadata', () => { try { v.currentTime = 0.001; } catch (_) {} }, { once: true });
            }
            envVideoObs.unobserve(v);
          });
        }, { root: grid.closest('.pt-env-body'), rootMargin: '200px 0px', threshold: 0.01 });
        Array.prototype.forEach.call(videos, (v) => envVideoObs.observe(v));
      } else {
        Array.prototype.forEach.call(videos, (v) => { v.src = v.dataset.src; delete v.dataset.src; });
      }
    }
    // P7 (9/1) — header/toolbar/view-toggle markup + the mosaic/grid/
    // list tile anatomy, ported from canvas-graphics' #c4RefGallery
    // (S80.9-16): Back pill FIRST, Quiet-Swiss title + Fira Code
    // count, then the toolbar cluster (collapsible search, the exact
    // .c4-search-* recipe renamed pt-env-search-*, + a 3-way view
    // toggle) pinned to the row's far right. Source globals
    // (_c4ResolveAssetSrc/_c4PhotoAspect/frame-slot routing) are NOT
    // portable — only class names/markup shape/timings were ported;
    // this shell's own multi-select (1-3 cap, footer confirm) and
    // video-tile recipe (lazy data-src, hover-play) stay exactly as
    // they were — the source component is images-only/single-pick
    // with no analog for either.
    function buildEnvOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'pt-env-overlay';
      overlay.id = 'ptEnvOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="pt-env-head">' +
          '<button class="pt-editor-back" type="button" id="ptEnvBackBtn" aria-label="Back">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M5 12l6-6M5 12l6 6"/></svg>' +
            'Back' +
          '</button>' +
          '<div class="pt-env-title-wrap">' +
            '<h2 class="pt-env-title" id="ptEnvHeadTitle">Your Gallery</h2>' +
            '<span class="pt-env-count-tag" id="ptEnvHeadCount">' + GALLERY_ITEMS.length + ' items</span>' +
          '</div>' +
          '<div class="pt-env-toolbar-right">' +
            '<div class="pt-env-search-wrap collapsed" id="ptEnvSearchWrap">' +
              '<button class="pt-env-search-icon-btn" type="button" id="ptEnvSearchBtn" aria-label="Open search" aria-expanded="false">' + ICONS.magnifyingGlass + '</button>' +
              '<input class="pt-env-search" type="search" id="ptEnvSearchInput" placeholder="Search gallery…" aria-label="Search gallery">' +
              '<button class="pt-env-search-close" type="button" id="ptEnvSearchClose" aria-label="Close search" tabindex="-1">' + ICONS.x + '</button>' +
            '</div>' +
            '<span class="pt-env-filter-divider" aria-hidden="true"></span>' +
            '<button class="pt-env-view-btn active" type="button" id="ptEnvViewMosaicBtn" data-env-view="mosaic" aria-label="Mosaic view">' +
              '<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="2" y="2" width="5" height="5" rx="0.6" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="2" width="5" height="3" rx="0.6" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="7" width="5" height="7" rx="0.6" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="9" width="5" height="5" rx="0.6" stroke="currentColor" stroke-width="1.2"/></svg>' +
            '</button>' +
            '<button class="pt-env-view-btn" type="button" id="ptEnvViewGridBtn" data-env-view="grid" aria-label="Grid view">' +
              '<svg viewBox="0 0 16 16" fill="none" width="14" height="14">' +
                '<rect x="2" y="2" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="2" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="11" y="2" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>' +
                '<rect x="2" y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="11" y="6.5" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>' +
                '<rect x="2" y="11" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="11" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/><rect x="11" y="11" width="3" height="3" rx="0.4" stroke="currentColor" stroke-width="1.2"/>' +
              '</svg>' +
            '</button>' +
            '<button class="pt-env-view-btn" type="button" id="ptEnvViewListBtn" data-env-view="list" aria-label="List view">' +
              '<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><line x1="3" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="3" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<p class="pt-env-sub" id="ptEnvSub">Images &amp; videos — pick 1 to 3.</p>' +
        '<div class="pt-env-body">' +
          // AK.3 — BANNERS: session-saved Studio banners, above the
          // image/video grid proper (a different kind of thing, so it
          // reads as its own shelf, not a fourth media type inside the
          // picker's own view-toggle system). Populated fresh on every
          // open (populateEnvBanners) since the list can grow between
          // opens; empty renders nothing, not an empty-state notice —
          // the picker's job is picking a frame, first and foremost.
          '<div class="pt-env-banners" id="ptEnvBanners" hidden></div>' +
          '<div class="pt-env-grid" id="ptEnvGrid" data-view="mosaic"></div>' +
        '</div>' +
        '<div class="pt-env-foot">' +
          '<span class="pt-env-count" id="ptEnvCount">0 selected</span>' +
          '<div class="pt-env-foot-actions">' +
            '<button class="share-btn pt-env-confirm" id="ptEnvConfirmBtn" type="button" disabled><span>Use these frames</span></button>' +
            '<button class="pt-env-clear" id="ptEnvClearBtn" type="button">Clear</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      const grid = overlay.querySelector('#ptEnvGrid');
      // Video tiles graft this file's OWN video-card recipe (legacy
      // .graphics-card.is-video branch): lazy data-src, first-frame
      // nudge on loadedmetadata, quiet play badge, hover-to-play.
      // Each tile also carries a .pt-env-frame-thumb wrapper around
      // its media (display:contents outside list view, so mosaic/grid
      // sizing is untouched) and a .pt-env-frame-name/-kind pair
      // (display:none outside list) — the S80.16 "one tile serves all
      // three views" trick, ported structurally.
      grid.innerHTML = GALLERY_ITEMS.map(f => {
        const isVideo = f.kind === 'video';
        const caption = envEscapeHTML(f.label.toLowerCase());
        const initialAR = isVideo ? '16 / 9' : '4 / 3';
        const mediaHTML = isVideo
          ? '<video data-src="' + f.src + '" width="240" height="180" muted loop playsinline preload="metadata" disablepictureinpicture></video>'
          : '<img src="' + f.src + '" alt="" loading="lazy">';
        return '<button class="pt-env-frame' + (isVideo ? ' is-video' : '') + '" type="button" data-env-id="' + f.id + '" data-caption="' + caption + '" style="aspect-ratio:' + initialAR + '">' +
          '<span class="pt-env-frame-thumb">' + mediaHTML + '</span>' +
          (isVideo ? '<span class="graphics-play-badge"><span class="play-disc"><svg class="play-tri" viewBox="0 0 24 24"><path fill="#fff" d="M8 5v14l11-7z"/></svg></span></span>' : '') +
          '<span class="pt-env-frame-label">' + envEscapeHTML(f.label) + '</span>' +
          '<span class="pt-env-frame-name">' + envEscapeHTML(f.label) + '</span>' +
          '<span class="pt-env-frame-kind">' + (isVideo ? 'video' : 'image') + '</span>' +
          '<span class="pt-env-frame-check">' + ICONS.check + '</span>' +
        '</button>';
      }).join('');
      // Capped per-tile stagger reveal + blur-fade image/video load-in
      // — S68's own .c4-ref-gallery-tile choreography (min(i*40,400)ms)
      // — PLUS (P7, 9/1) each tile's inline aspect-ratio guess (4/3 for
      // images, 16/9 for video, set above) is corrected to the media's
      // REAL dimensions the moment they're known, so mosaic's masonry
      // genuinely reflects "mixed aspects" rather than a uniform grid.
      // Grid/list view CSS override this inline value with !important,
      // so the correction is harmless noise there and simply "sticks"
      // again the moment the view switches back to mosaic.
      const reduce = envReducedMotion();
      Array.prototype.forEach.call(grid.querySelectorAll('.pt-env-frame'), (tile, i) => {
        const media = tile.querySelector('img, video');
        if (media) {
          if (media.tagName === 'VIDEO') {
            media.addEventListener('loadeddata', () => media.classList.add('is-loaded'), { once: true });
            media.addEventListener('loadedmetadata', () => {
              if (media.videoWidth && media.videoHeight) tile.style.aspectRatio = media.videoWidth + ' / ' + media.videoHeight;
              const kindEl = tile.querySelector('.pt-env-frame-kind');
              if (kindEl && media.duration && isFinite(media.duration)) {
                const total = Math.round(media.duration);
                const mm = Math.floor(total / 60), ss = String(total % 60).padStart(2, '0');
                kindEl.textContent = 'video · ' + mm + ':' + ss;
              }
            }, { once: true });
          } else if (media.complete) {
            media.classList.add('is-loaded');
            if (media.naturalWidth && media.naturalHeight) tile.style.aspectRatio = media.naturalWidth + ' / ' + media.naturalHeight;
          } else {
            media.addEventListener('load', () => {
              media.classList.add('is-loaded');
              if (media.naturalWidth && media.naturalHeight) tile.style.aspectRatio = media.naturalWidth + ' / ' + media.naturalHeight;
            }, { once: true });
          }
        }
        const delay = reduce ? 0 : Math.min(i * 40, 400);
        setTimeout(() => tile.classList.add('is-in'), delay);
      });
      wireEnvVideoHover(grid);
      const countEl = overlay.querySelector('#ptEnvCount');
      const confirmBtn = overlay.querySelector('#ptEnvConfirmBtn');
      function updateCount() {
        countEl.textContent = envPicked.length + ' selected';
        confirmBtn.disabled = envPicked.length === 0;
        Array.prototype.forEach.call(grid.querySelectorAll('.pt-env-frame'), (btn) => {
          const id = btn.getAttribute('data-env-id');
          const picked = envPicked.indexOf(id) !== -1;
          btn.classList.toggle('is-picked', picked);
          // AS.2 — single-pick mode locks out every video tile
          // (a banner takes a still) regardless of what's picked;
          // multi-pick keeps its own 3-cap disable, never a video ban.
          const videoLockedOut = envMode === 'single' && btn.classList.contains('is-video');
          const atCap = envMode !== 'single' && !picked && envPicked.length >= 3;
          btn.classList.toggle('is-disabled', videoLockedOut || atCap);
        });
      }
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-env-frame');
        if (!btn) return;
        const id = btn.getAttribute('data-env-id');
        if (envMode === 'single') {
          // Radio semantics — one at a time, replaces whatever was picked.
          envPicked = [id];
        } else {
          const i = envPicked.indexOf(id);
          if (i !== -1) envPicked.splice(i, 1);
          else { if (envPicked.length >= 3) return; envPicked.push(id); }
        }
        updateCount();
      });
      overlay.querySelector('#ptEnvBackBtn').addEventListener('click', closeEnvOverlay);
      overlay.querySelector('#ptEnvClearBtn').addEventListener('click', () => {
        envPicked = [];
        updateCount();
      });
      confirmBtn.addEventListener('click', () => {
        if (!envPicked.length) return;
        const chosen = envPicked.map(findFrame);
        closeEnvOverlay();
        if (envResolve) { const cb = envResolve; envResolve = null; cb(chosen); }
      });

      // ── View toggle — mosaic/grid/list, a plain data-view swap on
      //    the grid element (no re-render — every view reuses the
      //    SAME tiles, S80.16's own "one tile serves all views"
      //    approach). ──
      const viewBtns = Array.prototype.slice.call(overlay.querySelectorAll('.pt-env-view-btn[data-env-view]'));
      viewBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = btn.getAttribute('data-env-view');
          if (v === grid.dataset.view) return;
          viewBtns.forEach((b) => b.classList.toggle('active', b === btn));
          grid.dataset.view = v;
        });
      });

      // ── Search — the ported .c4-search-* collapsible-field recipe:
      //    an icon-only pill that expands into a live filter on
      //    data-caption, empty state cloned from this file's own
      //    .graphics-empty (same structural class + copy convention
      //    its Images-grid search already uses). ──
      const searchWrap = overlay.querySelector('#ptEnvSearchWrap');
      const searchBtn = overlay.querySelector('#ptEnvSearchBtn');
      const searchInput = overlay.querySelector('#ptEnvSearchInput');
      const searchClose = overlay.querySelector('#ptEnvSearchClose');
      const headCountEl = overlay.querySelector('#ptEnvHeadCount');
      let envEmptyEl = null;
      function applyEnvSearch(query) {
        const q = query.trim().toLowerCase();
        let matched = 0;
        Array.prototype.forEach.call(grid.querySelectorAll('.pt-env-frame'), (tile) => {
          const hay = tile.getAttribute('data-caption') || '';
          const hit = !q || hay.indexOf(q) !== -1;
          tile.classList.toggle('search-hidden', !hit);
          if (hit) matched++;
        });
        if (q && matched === 0) {
          if (!envEmptyEl) {
            envEmptyEl = document.createElement('div');
            envEmptyEl.className = 'graphics-empty';
            grid.appendChild(envEmptyEl);
          }
          envEmptyEl.innerHTML = 'No matches for <strong>"' + envEscapeHTML(q) + '"</strong>';
        } else if (envEmptyEl) {
          envEmptyEl.remove();
          envEmptyEl = null;
        }
        if (headCountEl) headCountEl.textContent = q ? (matched + ' of ' + GALLERY_ITEMS.length) : (GALLERY_ITEMS.length + ' items');
      }
      function expandEnvSearch() {
        if (!searchWrap.classList.contains('collapsed')) return;
        searchWrap.classList.remove('collapsed');
        searchBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => searchInput.focus());
      }
      function collapseEnvSearch() {
        searchWrap.classList.add('collapsed');
        searchBtn.setAttribute('aria-expanded', 'false');
      }
      function exitEnvSearch() {
        searchInput.value = '';
        applyEnvSearch('');
        searchInput.blur();
        collapseEnvSearch();
      }
      envSearchInputEl = searchInput;
      envExitSearchFn = exitEnvSearch;
      searchWrap.addEventListener('click', (e) => {
        if (searchWrap.classList.contains('collapsed')) { e.stopPropagation(); expandEnvSearch(); }
      });
      searchBtn.addEventListener('click', expandEnvSearch);
      searchInput.addEventListener('input', (e) => applyEnvSearch(e.target.value));
      searchInput.addEventListener('keydown', (e) => {
        // Handled by onEnvOverlayKeydown (capture phase, fires first)
        // — see its own comment for why. This just stops the field's
        // native behavior from doing anything extra on Escape.
        if (e.key === 'Escape') e.stopPropagation();
      });
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement === searchClose) return;
          if (!searchInput.value.trim()) collapseEnvSearch();
        }, 0);
      });
      searchClose.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      searchClose.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exitEnvSearch(); });

      envOverlayEl = overlay;
      updateCount();
    }
    // AK.3 — the BANNERS shelf's own tiles: the Versions rail's exact
    // clone-and-scale + chip + mono-line recipe, one per saved banner,
    // newest first. Opening one loads it into Studio at its latest
    // version and bypasses envResolve entirely — a banner is not a
    // frame to hand back to whatever picker opened the gallery.
    function envBannerTileHTML(rec) {
      const latest = rec.versions[rec.versions.length - 1];
      let data = null;
      try { data = JSON.parse(latest.snap).editorState; } catch (e) {}
      let pic = '';
      if (data) {
        const parts = String(data.sizeId).split('x');
        const naturalW = parseInt(parts[0], 10) || 300, naturalH = parseInt(parts[1], 10) || 250;
        const s = Math.min(132 / naturalW, 99 / naturalH, 1);
        const clone = buildStageBannerElForSize(data.sizeId, data);
        clone.style.width = naturalW + 'px';
        clone.style.height = naturalH + 'px';
        clone.style.transform = 'scale(' + s + ')';
        pic = clone.outerHTML;
      }
      return (
        '<button class="pt-env-banner-tile" type="button" data-banner-id="' + rec.id + '">' +
          '<span class="pt-env-banner-pic">' + pic + '</span>' +
          '<span class="pt-env-banner-name">' + escape(rec.title) + '</span>' +
          '<span class="pt-env-banner-meta">' + escape(rec.sizeLabel) + ' · ' + rec.versions.length + (rec.versions.length === 1 ? ' version' : ' versions') + '</span>' +
        '</button>'
      );
    }
    function populateEnvBanners() {
      const wrap = document.getElementById('ptEnvBanners');
      if (!wrap) return;
      if (!studioSavedBanners.length) { wrap.hidden = true; wrap.innerHTML = ''; return; }
      wrap.hidden = false;
      wrap.innerHTML =
        '<span class="pt-editor-drawer-eyebrow pt-env-banners-eyebrow">Banners</span>' +
        '<div class="pt-env-banners-strip">' + studioSavedBanners.map(envBannerTileHTML).join('') + '</div>';
      Array.prototype.forEach.call(wrap.querySelectorAll('.pt-env-banner-tile'), (tile) => {
        tile.addEventListener('click', () => {
          const rec = studioSavedBanners.filter(b => b.id === tile.getAttribute('data-banner-id'))[0];
          if (!rec) return;
          studioAutosaveOnExit(); // save whatever Studio banner (if any) was open before switching — a no-op outside Studio
          closeEnvOverlay();
          envResolve = null;
          openStudio(null, rec);
        });
      });
    }
    function openEnvOverlay(onConfirm, mode) {
      if (!envOverlayEl) buildEnvOverlay();
      envPicked = [];
      Array.prototype.forEach.call(envOverlayEl.querySelectorAll('.pt-env-frame'), (b) => b.classList.remove('is-picked', 'is-disabled'));
      // AS.2 — a mode on open: 'single' is Studio's Images drawer
      // door (one still for the current banner), anything else
      // (undefined, 'multi') is the hat's own unchanged pick-1-to-3.
      // Re-applied fresh on every open since the overlay itself is
      // lazily built once and reused by both doors.
      envMode = mode === 'single' ? 'single' : 'multi';
      envOverlayEl.dataset.pickMode = envMode;
      const subEl = envOverlayEl.querySelector('#ptEnvSub');
      if (subEl) subEl.textContent = envMode === 'single' ? 'Pick an image for this banner' : 'Images & videos — pick 1 to 3.';
      const confirmLabelEl = envOverlayEl.querySelector('#ptEnvConfirmBtn span');
      if (confirmLabelEl) confirmLabelEl.textContent = envMode === 'single' ? 'Use this image' : 'Use these frames';
      Array.prototype.forEach.call(envOverlayEl.querySelectorAll('.pt-env-frame.is-video'), (tile) => {
        if (envMode === 'single') {
          tile.classList.add('is-disabled');
          tile.title = 'A banner takes a still';
        } else {
          tile.removeAttribute('title');
        }
      });
      envOverlayEl.querySelector('#ptEnvCount').textContent = '0 selected';
      envOverlayEl.querySelector('#ptEnvConfirmBtn').disabled = true;
      // Each fresh open starts with search collapsed/cleared (a picker
      // session's own "un-searched" resting state) — reset directly
      // and synchronously (not via exitEnvSearch, which would also be
      // a spurious animated collapse the overlay isn't even visible
      // for yet). View choice is left alone — it's a plain DOM
      // dataset value on the cached grid, so it naturally carries over
      // between opens within the session, same as S80.16's own
      // module-level view variable, and a real reload always lands
      // back on the bare-HTML "mosaic" default regardless.
      if (envSearchInputEl) envSearchInputEl.value = '';
      Array.prototype.forEach.call(envOverlayEl.querySelectorAll('.pt-env-frame'), (tile) => tile.classList.remove('search-hidden'));
      const searchWrapEl = envOverlayEl.querySelector('#ptEnvSearchWrap');
      if (searchWrapEl) searchWrapEl.classList.add('collapsed');
      const emptyEl = envOverlayEl.querySelector('.graphics-empty');
      if (emptyEl) emptyEl.remove();
      const headCountEl = envOverlayEl.querySelector('#ptEnvHeadCount');
      if (headCountEl) headCountEl.textContent = GALLERY_ITEMS.length + ' items';
      populateEnvBanners(); // AK.3 — freshly built every open: the list can grow between opens
      envResolve = onConfirm;
      applyEnvPaneBounds();
      observeEnvVideoSrc(envOverlayEl.querySelector('#ptEnvGrid'));
      envOverlayEl.classList.remove('is-leaving');
      envOverlayEl.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => envOverlayEl.classList.add('is-open'));
      document.addEventListener('keydown', onEnvOverlayKeydown, true);
    }
    /* Cross-closure seam (same window._pt* convention as the rest of
       this file) so the composer's + menu can open this exact picker
       rather than standing up a second one. */
    window._ptOpenGalleryPicker = openEnvOverlay;
    window._ptGalleryAddFrame = galleryAddFrameFromFile; // 9/15 — the band's Imagery pane's Add image
    window._ptImageryOpenFilePicker = imageryOpenFilePicker;
    // AV.2 QA hook — state.images/GALLERY_ITEMS are closure-private
    // (nothing in the DOM reflects state.images' own pick order), so
    // the Verify block's own asserts (state.images length/order,
    // GALLERY_ITEMS[0].id) need a read seam; same window._pt*
    // convention as the rest of this file, read-only (a fresh plain
    // object per call, never a live reference).
    window._ptImageryDebug = function () {
      return { images: state.images.map((f) => f.id), galleryFirst: GALLERY_ITEMS[0] && GALLERY_ITEMS[0].id, galleryLen: GALLERY_ITEMS.length };
    };

