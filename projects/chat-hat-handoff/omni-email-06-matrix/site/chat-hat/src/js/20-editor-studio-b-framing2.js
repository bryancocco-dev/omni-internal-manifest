    /* ═══ FRAMING (AM.2 — lives in Studio's Images drawer now) — the
       slider, the x/y readout, Reset, the hint, and the drag on the
       stage itself. ═══ */

    /* The stage can show any placement in the roster, not just the nine
       the sheet concepts at, so the label resolves against both. */
    function sizeDisplayLabel(sizeId) {
      const meta = SIZES.filter(z => z.id === sizeId)[0];
      if (meta) return meta.label;
      return String(sizeId || '').replace('x', '×');
    }
    // The crop for whatever shape the stage is showing right now.
    function currentFramingKey() { return ratioKey(editorState.sizeId); }
    function currentFraming() {
      return framingForSize(editorState.framings, editorState.sizeId, editorState.imageSrc);
    }
    function setCurrentFraming(fr) {
      editorState.framings[currentFramingKey()] = clampFraming(fr);
    }
    function currentFramingIsEdited() {
      return !!(editorState && editorState.framings[currentFramingKey()]);
    }
    // §BR.2 — distinct from "edited" above: this asks whether the
    // current shape's answer is THIS UNIT'S OWN ("Just this one"), as
    // opposed to the shared, campaign-level crop every other unit on
    // this image is also reading. editorState.frameOverrideRatios is a
    // plain object (never a Set — it rides inside studioSnapshot's
    // JSON.stringify, and a Set serializes to "{}"), keyed the same as
    // framings, seeded from whatever the unit already had of its own
    // when Studio opened (seedBannerFramings' own map keys).
    function currentFramingIsOverridden() {
      return !!(editorState && editorState.frameOverrideRatios && editorState.frameOverrideRatios[currentFramingKey()]);
    }

    /* How far, in SCREEN pixels, x/y 0→100 can actually travel right
       now. Two sources stack: the cover overflow the picture already
       has inside the frame (magnified by the scale), plus the overflow
       the scale itself creates, which the moving transform-origin
       sweeps. Their sum is just the rendered picture minus the frame,
       which is the honest answer — and it lets a drag track the cursor
       one-to-one instead of guessing a sensitivity. */
    function stagePanRange(box, el, fr) {
      const rect = box.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };
      const nw = el.naturalWidth || el.videoWidth || 0;
      const nh = el.naturalHeight || el.videoHeight || 0;
      // Not loaded yet — the scale overflow is still known, so a drag
      // works; it just can't account for the cover overflow.
      if (!nw || !nh) {
        const g = Math.max(0, fr.s - 1);
        return { x: rect.width * g, y: rect.height * g };
      }
      const cover = Math.max(rect.width / nw, rect.height / nh);
      // Below 1 the origin is pinned, so the frame's own growth term
      // drops out and the pan is whatever the cover crop still offers.
      const grow = fr.s > 1 ? fr.s - 1 : 0;
      return {
        x: Math.max(0, nw * cover - rect.width) * fr.s + rect.width * grow,
        y: Math.max(0, nh * cover - rect.height) * fr.s + rect.height * grow
      };
    }
    // I — the hint line ("Drag the image…") is only true while a drag
    // would actually move something. Same test the pointerdown handler
    // below already runs before it starts a pan; a shared function so
    // the two can't drift apart.
    function framingIsDraggable(box, el, fr) {
      if (!box || !el) return false;
      const range = stagePanRange(box, el, fr);
      return range.x >= 0.5 || range.y >= 0.5;
    }
    function setFramingHintVisible(visible) {
      const hint = document.getElementById('ptFrameHint');
      if (hint) hint.classList.toggle('is-shown', !!visible);
    }

    function wireStageFramingDrag(banner) {
      const box = banner.querySelector('.pt-banner-media');
      const el = box && box.querySelector('img, video');
      /* Computed off THIS banner's own box/el, resolved once here —
         never re-queried from #ptEditorStage, which briefly holds two
         banners mid-crossfade and could hand back the outgoing one.
         Covers every renderEditorStage call: initial open, every size
         step, every full stage rebuild. */
      if (editorState) {
        const recheckHint = () => setFramingHintVisible(framingIsDraggable(box, el, currentFraming()));
        recheckHint();
        if (el) {
          el.addEventListener('load', recheckHint, { once: true });
          el.addEventListener('loadedmetadata', recheckHint, { once: true });
        }
      }
      if (!box || !el) return;
      /* 9/16 (Bryan: "I don't seem to be able to drag and move the
         image here") — the press listens on the whole BANNER, not on
         the media box alone. Only a full-bleed layout fills the banner
         with its picture; split gives the media half the width and the
         type layouts a band at one end, so a press on the copy side —
         most of the banner, and the obvious place to grab — landed on
         the ground and did nothing at all. The picture is what moves
         either way; the range math still measures the media box. The
         copy parts keep their own press (click-to-edit, and BA's move),
         so they are skipped here first. */
      banner.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !editorState) return;
        box._ptDragged = false; // AY.3 — a click that never moved lands the panel's IMAGE group (wireStageEditableFields' router); a real pan sets this and is swallowed there
        banner._ptDragged = false; // the same swallow for a pan begun on the ground, whose click would otherwise land COLORWAY
        // The copy sits over the picture on full-bleed; those spans own
        // their own click-to-edit and BA's own move, and must keep both.
        if (e.target.closest('.pt-banner-headline, .pt-banner-cta, .pt-banner-subhead, .pt-banner-body, .pt-banner-disclaimer, .pt-banner-logo')) return;
        if (typeof PT_MOVE_SELECTOR === 'string' && e.target.closest(PT_MOVE_SELECTOR)) return;
        const from = currentFraming();
        const range = stagePanRange(box, el, from);
        if (range.x < 0.5 && range.y < 0.5) return; // nothing to pan into
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY;
        box.classList.add('is-panning');
        banner.classList.add('is-panning');
        try { banner.setPointerCapture(e.pointerId); } catch (err) {}
        const move = (ev) => {
          const dx = ev.clientX - startX, dy = ev.clientY - startY;
          if (Math.abs(dx) + Math.abs(dy) > 3) { box._ptDragged = true; banner._ptDragged = true; }
          /* Minus: object-position counts up as the WINDOW moves right,
             so dragging the picture right walks the value down. */
          setCurrentFraming({
            x: range.x > 0.5 ? from.x - (dx / range.x) * 100 : from.x,
            y: range.y > 0.5 ? from.y - (dy / range.y) * 100 : from.y,
            s: from.s
          });
          applyFramingToMediaEl(el, currentFraming());
          updateFramingReadout();
        };
        const up = () => {
          box.classList.remove('is-panning');
          banner.classList.remove('is-panning');
          banner.removeEventListener('pointermove', move);
          banner.removeEventListener('pointerup', up);
          banner.removeEventListener('pointercancel', up);
          if (editorState) applyFramingToBanner(banner, currentFraming());
          // §BR.2 — a completed pan is a discrete, undoable edit (it
          // wasn't pushed at all before BR.2: framings drags predate
          // pushStudioHistory's own funnel). One entry per gesture,
          // at pointerup, not per pointermove.
          if (box._ptDragged) pushStudioHistory('Crop');
        };
        banner.addEventListener('pointermove', move);
        banner.addEventListener('pointerup', up);
        banner.addEventListener('pointercancel', up);
      });
    }

    function updateFramingReadout() {
      if (!editorState) return;
      const fr = currentFraming();
      const sv = document.getElementById('ptFrameScaleVal');
      if (sv) sv.textContent = Math.round(fr.s * 100) + '%';
      const cx = document.getElementById('ptFrameCenterX');
      if (cx) cx.textContent = Math.round(fr.x) + '%';
      const cy = document.getElementById('ptFrameCenterY');
      if (cy) cy.textContent = Math.round(fr.y) + '%';
      const edited = document.getElementById('ptFrameEdited');
      if (edited) edited.hidden = !currentFramingIsEdited();
      const reset = document.getElementById('ptFrameReset');
      if (reset) reset.disabled = !currentFramingIsEdited();
      updateFrameReachLine();
    }
    // §BR.2 — the reach line: "Applies to N banners at 6:5 · Just this
    // one" while this shape's crop is the shared, campaign-level one;
    // "Edited here · Rejoin" once this unit has opted its own out. A
    // signature guard skips the rebuild (and its listener rewiring)
    // when nothing it depends on has actually changed — this runs on
    // every pointermove of a stage drag via updateFramingReadout, and
    // x/y/s alone never change what the line says.
    function updateFrameReachLine() {
      const el = document.getElementById('ptFrameReachText');
      if (!el || !editorState) return;
      const key = currentFramingKey();
      const overridden = currentFramingIsOverridden();
      const editingBanner = editorCardEl && editorCardEl.querySelector('.pt-banner');
      const n = overridden ? 0 : reachCountForImageRatio(editorState.imageSrc, key, editingBanner);
      const sig = key + '|' + overridden + '|' + n;
      if (el.dataset.sig === sig) return;
      el.dataset.sig = sig;
      if (!key) { el.innerHTML = ''; return; }
      if (overridden) {
        el.innerHTML = 'Edited here · <button type="button" class="pt-frame-reach-link" id="ptFrameRejoin">Rejoin</button>';
        const btn = document.getElementById('ptFrameRejoin');
        if (btn) btn.addEventListener('click', handleFrameRejoin);
      } else if (n > 1) {
        el.innerHTML = 'Applies to ' + n + ' banner' + (n === 1 ? '' : 's') + ' at ' + escape(ratioLabelForSizeId(editorState.sizeId)) + ' · <button type="button" class="pt-frame-reach-link" id="ptFrameJustThis">Just this one</button>';
        const btn = document.getElementById('ptFrameJustThis');
        if (btn) btn.addEventListener('click', handleFrameJustThisOne);
      } else {
        el.innerHTML = ''; // nothing else on the board shares this image at this shape — no reach to name
      }
    }
    // "Just this one" locks in whatever the stage shows right now as
    // this unit's own answer — it does not itself change the crop, it
    // changes who Apply/Back writes it to.
    function handleFrameJustThisOne() {
      if (!editorState) return;
      const key = currentFramingKey();
      if (!key) return;
      if (!editorState.framings[key]) editorState.framings[key] = clampFraming(currentFraming());
      if (!editorState.frameOverrideRatios) editorState.frameOverrideRatios = {};
      if (!editorState.frameRejoined) editorState.frameRejoined = {};
      editorState.frameOverrideRatios[key] = true;
      updateFramingReadout();
      pushStudioHistory('Just this one');
    }
    // Drops this unit's own answer for the current shape and falls
    // back through to the shared/default one (framingForSize's own
    // fallback, exercised the instant editorState.framings[key] is
    // gone) — the exact reverse of "Just this one".
    function handleFrameRejoin() {
      if (!editorState) return;
      const key = currentFramingKey();
      if (!key) return;
      if (editorState.frameOverrideRatios) delete editorState.frameOverrideRatios[key];
      delete editorState.framings[key];
      // §BR.2 — deleting the SESSION's own working value (above) is
      // enough to make the STAGE fall back to the shared crop right
      // now, but it leaves no signal for the COMMIT to strip this
      // ratio's now-stale entry out of the unit's PERSISTED override
      // map (propagateEditsToGroup only ever touches keys present in
      // ed.framings) — an explicit rejoined marker carries that intent
      // through to Apply/Back even though there is no new value to
      // write for this ratio.
      if (!editorState.frameRejoined) editorState.frameRejoined = {};
      editorState.frameRejoined[key] = true;
      const fr = currentFraming();
      const box = document.querySelector('#ptEditorStage .pt-banner-media');
      const el = box && box.querySelector('img, video');
      applyFramingToMediaEl(el, fr);
      const banner = document.querySelector('#ptEditorStage .pt-banner');
      if (banner) applyFramingToBanner(banner, fr);
      setFramingHintVisible(framingIsDraggable(box, el, fr));
      renderEditorFraming();
      pushStudioHistory('Rejoin');
    }

    /* ═══ §BR.3/§BR.4, merged (coordinator review, 9/18 — "two near-
       identical reach lines stacked… merge into ONE row"): one row
       under the stage (#ptCopyFitRow, 42-body-canvas-sheet.html) —
       the compact size control (slider/value/Fit) plus ONE reach line
       covering both the line's TEXT reach (§BR.3 — no ratio, copy
       applies at every size) and its SIZE reach at the current shape
       (§BR.4 — ratio-scoped): "Applies to N banners · size at 6:5 ·
       Just this one" / "Edited here · Rejoin", the override state and
       the Rejoin action covering BOTH dimensions at once. Unlike a
       shape, there is no single field that is always "current" the
       moment Studio opens, so copyReachRole tracks whichever of
       headline/CTA/legal the stage last put focus on
       (wireStageEditableFields' focus/blur, 19-sheet-c-variety.js) and
       the row stays hidden until the first one is touched. ═══ */
    let copyReachRole = null; // 'headline' | 'cta' | 'disclaimer'
    function currentCopyIsOverridden(fieldKey) {
      return !!(editorState && editorState.copyOverrideRoles && editorState.copyOverrideRoles[fieldKey]);
    }
    // The size analogue of currentCopyIsOverridden, at the CURRENT
    // shape — a field can be "Just this one" for size at 6:5 while
    // still following the shared line at a ratio it hasn't touched.
    function currentFitIsOverridden(fieldKey) {
      if (!editorState) return false;
      const key = ratioKey(editorState.sizeId);
      return !!(key && editorState.fitOverrideRoles && editorState.fitOverrideRoles[fitKey(fieldKey, key)]);
    }
    function copyIdForField(fieldKey) {
      if (!editorState) return null;
      if (fieldKey === 'cta') return editorState.ctaId;
      if (fieldKey === 'disclaimer') return editorState.legalId;
      return editorState.headlineId;
    }
    function currentLineFitScale() {
      if (!editorState || !copyReachRole) return 1;
      const key = ratioKey(editorState.sizeId);
      if (!key) return 1;
      return lineFitScale(copyReachRole, editorState.lineFit || {}, copyIdForField(copyReachRole), key);
    }
    // Paints the resolved scale onto the stage's own line element right
    // now — the live half; setLineFitScale/the slider/Fit/Rejoin all
    // funnel through this so the stage never drifts from editorState.
    function paintCurrentLineFitToStage() {
      if (!editorState || !copyReachRole) return;
      const stageBanner = document.querySelector('#ptEditorStage .pt-banner');
      const el = stageBanner && stageBanner.querySelector(fieldSelector(copyReachRole));
      if (!el) return;
      const scale = currentLineFitScale();
      if (scale === 1) el.style.removeProperty('--pt-fit-scale');
      else el.style.setProperty('--pt-fit-scale', scale.toFixed(2));
    }
    // Shows/hides the merged row and syncs the slider/value — called
    // whenever a field takes focus (wireStageEditableFields) or the
    // stage re-renders at a new size (renderEditorStage, a size switch
    // changes which ratio bucket the row answers for even though the
    // focused FIELD hasn't changed).
    function updateCopyFitUI(fieldKey) {
      if (fieldKey) copyReachRole = fieldKey;
      const row = document.getElementById('ptCopyFitRow');
      if (!row || !editorState) return;
      if (!copyReachRole) { row.hidden = true; updateCopyFitReachLine(); return; }
      row.hidden = false;
      const scale = currentLineFitScale();
      const slider = document.getElementById('ptCopyFitScale');
      if (slider) slider.value = String(Math.round(scale * 100));
      const val = document.getElementById('ptCopyFitScaleVal');
      if (val) val.textContent = Math.round(scale * 100) + '%';
      updateCopyFitReachLine();
    }
    // The ONE merged reach line: overridden (either dimension) reads
    // "Edited here · Rejoin"; otherwise "Applies to N banners · size at
    // 6:5 · Just this one" — N is the SIZE-scoped count
    // (reachCountForLineCombined, 13-editor-studio-a-framing.js: same
    // ratio, opted into both text and size) since that is the exact set
    // a single combined write actually lands on; the ratio names which
    // shape's size answer is in play, not a second count.
    function updateCopyFitReachLine() {
      const el = document.getElementById('ptCopyFitReachText');
      if (!el || !editorState || !copyReachRole) { if (el) el.innerHTML = ''; return; }
      const key = ratioKey(editorState.sizeId);
      const id = copyIdForField(copyReachRole);
      if (!key || !id) { el.innerHTML = ''; return; }
      const overridden = currentCopyIsOverridden(copyReachRole) || currentFitIsOverridden(copyReachRole);
      const editingBanner = editorCardEl && editorCardEl.querySelector('.pt-banner');
      const n = overridden ? 0 : reachCountForLineCombined(copyReachRole, id, key, editingBanner);
      const sig = copyReachRole + '|' + id + '|' + key + '|' + overridden + '|' + n;
      if (el.dataset.sig === sig) return;
      el.dataset.sig = sig;
      if (overridden) {
        el.innerHTML = 'Edited here · <button type="button" class="pt-frame-reach-link" id="ptCopyFitRejoin">Rejoin</button>';
        const btn = document.getElementById('ptCopyFitRejoin');
        if (btn) btn.addEventListener('click', handleCombinedRejoin);
      } else if (n > 1) {
        el.innerHTML = 'Applies to ' + n + ' banner' + (n === 1 ? '' : 's') + ' · size at ' + escape(ratioLabelForSizeId(editorState.sizeId)) + ' · <button type="button" class="pt-frame-reach-link" id="ptCopyFitJustThis">Just this one</button>';
        const btn = document.getElementById('ptCopyFitJustThis');
        if (btn) btn.addEventListener('click', handleCombinedJustThisOne);
      } else {
        el.innerHTML = ''; // nothing else on the board shares this line at this shape — no reach to name
      }
    }
    // The slider's own live-drag handler — every value it sets is, by
    // definition, this session's answer for fitKey(field, ratio);
    // Apply/Back (propagateEditsToGroup) decides shared-vs-override
    // from fitOverrideRoles exactly as framings/copy already do.
    function setLineFitScale(fieldKey, scale) {
      if (!editorState || !fieldKey) return;
      const key = ratioKey(editorState.sizeId);
      if (!key) return;
      const clamped = clampLineFitScale(scale);
      const fk = fitKey(fieldKey, key);
      if (!editorState.lineFit) editorState.lineFit = {};
      editorState.lineFit[fk] = clamped;
      if (!editorState.fitTouched) editorState.fitTouched = {};
      editorState.fitTouched[fk] = true;
      paintCurrentLineFitToStage();
      const val = document.getElementById('ptCopyFitScaleVal');
      if (val) val.textContent = Math.round(clamped * 100) + '%';
      updateCopyFitReachLine();
    }
    // "Just this one" locks in whatever the stage shows right now as
    // this unit's own answer for BOTH text and size at this ratio, one
    // click — same idiom as handleFrameJustThisOne, doubled: it does
    // not itself change either value, it changes who Apply/Back writes
    // them to. Marking copyTouched/fitTouched (not just the override
    // maps) is what makes propagateEditsToGroup treat these as its
    // business even if nothing was retyped/dragged afterward.
    function handleCombinedJustThisOne() {
      if (!editorState || !copyReachRole) return;
      const role = copyReachRole;
      const key = ratioKey(editorState.sizeId);
      if (!key) return;
      if (!editorState.copyOverrideRoles) editorState.copyOverrideRoles = {};
      if (!editorState.copyTouched) editorState.copyTouched = {};
      editorState.copyOverrideRoles[role] = true;
      editorState.copyTouched[role] = true;
      const fk = fitKey(role, key);
      if (!editorState.lineFit) editorState.lineFit = {};
      if (editorState.lineFit[fk] === undefined) editorState.lineFit[fk] = currentLineFitScale();
      if (!editorState.fitOverrideRoles) editorState.fitOverrideRoles = {};
      if (!editorState.fitTouched) editorState.fitTouched = {};
      editorState.fitOverrideRoles[fk] = true;
      editorState.fitTouched[fk] = true;
      updateCopyFitUI();
      pushStudioHistory('Just this one');
    }
    // Drops this unit's own answer for BOTH text and size at this ratio
    // and falls back to the shared line's own answers right now, on the
    // stage — the exact reverse of "Just this one", same shape as
    // handleFrameRejoin.
    function handleCombinedRejoin() {
      if (!editorState || !copyReachRole) return;
      const role = copyReachRole;
      const key = ratioKey(editorState.sizeId);
      if (!key) return;
      // Text side.
      if (editorState.copyOverrideRoles) delete editorState.copyOverrideRoles[role];
      // §BR.3 — see handleFrameRejoin's own comment: deleting the
      // session's own value is enough for the STAGE to fall back right
      // now, but propagateEditsToGroup only ever touches roles it can
      // see were touched — an explicit rejoined marker carries the
      // "let this go" intent through to Apply/Back even when nothing
      // was retyped.
      if (!editorState.copyRejoined) editorState.copyRejoined = {};
      editorState.copyRejoined[role] = true;
      const id = copyIdForField(role);
      const line = id && assets.lines[id];
      const text = line ? line.text : '';
      editorState[role] = text;
      const sel = role === 'headline' ? '.pt-banner-headline' : role === 'cta' ? '.pt-banner-cta' : '.pt-banner-disclaimer';
      const fieldEl = document.querySelector('#ptEditorStage ' + sel);
      if (fieldEl) {
        if (role === 'disclaimer') applyDisclaimerContent(fieldEl, text);
        else { fieldEl.textContent = text; if (role === 'headline') applyHeadlineFit(fieldEl, editorState.sizeId, text); }
      }
      // Size side.
      const fk = fitKey(role, key);
      if (editorState.fitOverrideRoles) delete editorState.fitOverrideRoles[fk];
      delete editorState.lineFit[fk];
      if (!editorState.fitRejoined) editorState.fitRejoined = {};
      editorState.fitRejoined[fk] = true;
      paintCurrentLineFitToStage();
      updateCopyFitUI();
      pushStudioHistory('Rejoin');
    }
    // The "Fit" text link: computes the largest size that clears every
    // instance this write would land on (computeFitScaleForLine, 13-
    // editor-studio-a-framing.js) and writes it as the default-scope
    // answer — Bryan's own emphasis, §BR's UX rule: "Default scope is
    // all instances" — so a unit that had already opted its SIZE out is
    // rejoined first, the same as a band pick re-pointing a reference
    // (fieldMutator's own comment) counts as a deliberate re-join. Fit
    // is a size-only action — it never touches a text override.
    function handleLineFitClick() {
      if (!editorState || !copyReachRole) return;
      const role = copyReachRole;
      const key = ratioKey(editorState.sizeId);
      if (!key) return;
      const id = copyIdForField(role);
      const stageBanner = document.querySelector('#ptEditorStage .pt-banner');
      const editingBanner = editorCardEl && editorCardEl.querySelector('.pt-banner');
      const scale = computeFitScaleForLine(role, id, key, stageBanner, editingBanner);
      const fk = fitKey(role, key);
      if (editorState.fitOverrideRoles) delete editorState.fitOverrideRoles[fk];
      if (!editorState.lineFit) editorState.lineFit = {};
      editorState.lineFit[fk] = scale;
      if (!editorState.fitTouched) editorState.fitTouched = {};
      editorState.fitTouched[fk] = true;
      paintCurrentLineFitToStage();
      updateCopyFitUI();
      pushStudioHistory('Fit');
    }
    // Wired once (initPainterEditor) — the row/slider/button are static
    // markup, never rebuilt, unlike the IMAGE group's own #ptFrameScale
    // (wireStudioImagesFraming, re-bound on every panel render).
    function wireCopyFitControl() {
      const slider = document.getElementById('ptCopyFitScale');
      if (slider) {
        slider.addEventListener('input', () => { if (copyReachRole) setLineFitScale(copyReachRole, parseInt(slider.value, 10) / 100); });
        // One history entry per completed drag (change fires on release),
        // same as the IMAGE group's own scale slider (§BR.2).
        slider.addEventListener('change', () => pushStudioHistory('Size'));
      }
      const fitBtn = document.getElementById('ptCopyFitBtn');
      if (fitBtn) fitBtn.addEventListener('click', handleLineFitClick);
    }

    function renderEditorFraming() {
      if (!editorState) return;
      if (!editorState.framings) editorState.framings = {};
      if (!editorState.frameOverrideRatios) editorState.frameOverrideRatios = {};
      if (!editorState.frameRejoined) editorState.frameRejoined = {};
      const slider = document.getElementById('ptFrameScale');
      if (slider) slider.value = String(Math.round(currentFraming().s * 100));
      updateFramingReadout();
    }

    function setEditorFramingScale(pct) {
      if (!editorState) return;
      const fr = currentFraming();
      setCurrentFraming({ x: fr.x, y: fr.y, s: pct / 100 });
      const now = currentFraming();
      const box = document.querySelector('#ptEditorStage .pt-banner-media');
      const el = box && box.querySelector('img, video');
      applyFramingToMediaEl(el, now);
      const banner = document.querySelector('#ptEditorStage .pt-banner');
      if (banner) applyFramingToBanner(banner, now);
      // Scale is the one thing that can turn draggable on or off (x/y
      // panning alone can't) — no crossfade in flight here, so a plain
      // query for the stage's own box/el is unambiguous.
      setFramingHintVisible(framingIsDraggable(box, el, now));
      updateFramingReadout();
    }


    // I — builds one strip's thumbnails and wires the click-to-swap +
    // lazy-video handling. Split out of renderEditorSwapStrip so the
    // guided rail's now-bounded Swap image (two strip elements: the
    // shoot stills and the "more from gallery" disclosure) can call it
    // twice instead of duplicating this logic a third time; Studio's
    // Images drawer keeps calling it exactly as before, one strip.
    // `syncEl` is the ancestor whose thumbs should share the active
    // highlight — defaults to the strip itself (the original
    // single-strip behavior), so an existing call that doesn't pass it
    // is unaffected. The video IntersectionObserver is stashed on the
    // element itself (not one shared module-level variable) so two
    // strips populated back to back don't disconnect each other's.
    function populateSwapThumbs(el, items, syncEl) {
      if (!el || !editorState) return;
      const scope = syncEl || el;
      el.innerHTML = items.map(f => {
        const active = f.src === editorState.imageSrc ? ' is-active' : '';
        if (f.kind === 'video') {
          return '<button class="pt-editor-swap-thumb is-video' + active + '" type="button" data-src="' + f.src + '" title="' + escape(f.label) + '">' +
            '<video data-src="' + f.src + '" muted loop playsinline preload="metadata" disablepictureinpicture></video>' +
          '</button>';
        }
        return '<button class="pt-editor-swap-thumb' + active + '" type="button" data-src="' + f.src + '" title="' + escape(f.label) + '">' +
          '<img src="' + f.src + '" alt="" loading="lazy">' +
        '</button>';
      }).join('');
      Array.prototype.forEach.call(el.querySelectorAll('.pt-editor-swap-thumb'), (btn) => {
        btn.addEventListener('click', () => {
          const src = btn.getAttribute('data-src');
          if (src === editorState.imageSrc) return;
          editorState.imageSrc = src;
          /* A crop is an argument about one photograph. Carrying it
             onto a different one lands somewhere arbitrary, so a swap
             drops every ratio's answer and starts again — §BR.2: "again"
             now means the NEW picture's own shared/default answer
             (framingForSize's normal fallback), not necessarily its
             plain focal point, if some other unit already cropped it. */
          editorState.framings = {};
          editorState.frameOverrideRatios = {}; // stale override keys would misname the new image as "edited here"
          editorState.frameRejoined = {}; // a rejoin recorded against the OLD picture must never strip the new one's override
          renderEditorFraming();
          Array.prototype.forEach.call(scope.querySelectorAll('.pt-editor-swap-thumb'), (b) => b.classList.toggle('is-active', b === btn));
          crossfadeStageImage(src);
          renderEditorFilmstrip();
          pushStudioHistory('Image');
        });
      });
      // Same lazy data-src → src promotion as the gallery grid — the
      // swap strip can hold up to 29 video thumbs at once.
      const videos = el.querySelectorAll('video[data-src]');
      if (el._swapVideoObs) { el._swapVideoObs.disconnect(); el._swapVideoObs = null; }
      if (videos.length) {
        if ('IntersectionObserver' in window) {
          el._swapVideoObs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const v = entry.target;
              if (v.dataset.src) {
                v.src = v.dataset.src;
                delete v.dataset.src;
                v.addEventListener('loadedmetadata', () => { try { v.currentTime = 0.001; } catch (_) {} }, { once: true });
              }
              el._swapVideoObs.unobserve(v);
            });
          }, { rootMargin: '150px 0px', threshold: 0.01 });
          Array.prototype.forEach.call(videos, (v) => el._swapVideoObs.observe(v));
        } else {
          Array.prototype.forEach.call(videos, (v) => { v.src = v.dataset.src; delete v.dataset.src; });
        }
      }
    }

    // AM.2/AM.3/AY — the panel's IMAGE group is the only caller (the
    // old panel's own bounded strip — shoot stills + "more from
    // gallery" — retired with the rest of it): the currently-picked
    // item first (if any), then the first 11 library items (3 rows of
    // 4); "View gallery" beneath it stays the door to all 47.
    function renderEditorSwapStrip() {
      const strip = document.getElementById('ptStudioSwapStrip');
      if (!strip || !editorState) return;
      const picked = GALLERY_ITEMS.filter(f => f.src === editorState.imageSrc);
      const rest = GALLERY_ITEMS.filter(f => f.src !== editorState.imageSrc).slice(0, 11);
      populateSwapThumbs(strip, picked.concat(rest));
    }

    // P8 — creates/updates/removes one optional copy span (subhead/
    // body/disclaimer) so a banner card that never HAD the field can
    // grow it, and one that no longer needs it drops the node — used
    // by propagateEditsToGroup below. insertBeforeEl null = append.
    function syncOptionalCopySpan(container, cls, text, insertBeforeEl) {
      let el = container.querySelector('.' + cls);
      if (text) {
        if (!el) {
          el = document.createElement('span');
          el.className = cls;
          if (insertBeforeEl) container.insertBefore(el, insertBeforeEl); else container.appendChild(el);
        }
        el.textContent = text;
      } else if (el) {
        el.remove();
      }
    }
    /* `scope` used to be the whole concept group, and that was right
       while a group meant ONE concept rendered across several sizes —
       edited copy had to match across them. Since the sheet became a
       3x3 board a group is three DIFFERENT variants, so committing to
       the group silently overwrote the edited unit's two row-mates.
       The caller now passes the single edited card. */
    function propagateEditsToGroup(scope, ed) {
      const cards = scope.classList && scope.classList.contains('pt-banner-card') ? [scope] : scope.querySelectorAll('.pt-banner-card');
      let sizeChanged = false;
      Array.prototype.forEach.call(cards, (card) => {
        const banner = card.querySelector('.pt-banner');
        if (!banner) return;
        // BD.3 — a Studio unit-mode SIZE pick rides to the card first,
        // ahead of the framing/offsets reads below (both key off the
        // banner's OWN data-size), so they already resolve against
        // the new size rather than the one it's leaving.
        if (ed.sizeId && banner.getAttribute('data-size') !== ed.sizeId) {
          applyCardSizeChange(card, banner, ed.sizeId);
          sizeChanged = true;
        }
        banner.setAttribute('data-layout', ed.layoutId);
        if (ed.colorway && ed.colorway !== 'gold-on-dark') banner.setAttribute('data-colorway', ed.colorway);
        else banner.removeAttribute('data-colorway');
        const logo = banner.querySelector('.pt-banner-logo');
        if (logo) logo.src = LOGO_FOR_COLORWAY[ed.colorway] || 'brand/griffin-gold.png';
        const mediaWrap = banner.querySelector('.pt-banner-media');
        /* Read the crop off the element BEFORE the media slot is
           rebuilt, since the rebuild is what would otherwise lose it.
           An unedited ratio keeps whatever it already had; a swapped
           picture invalidates that, so it falls back to the new
           photograph's own answer (shared, or its plain focal point). */
        const prevMedia = banner.querySelector('.pt-banner-media img, .pt-banner-media video');
        const sameSrc = prevMedia && prevMedia.getAttribute('src') === ed.imageSrc;
        // §BR.2 — the image reference travels with every commit, not
        // just generation (registerImageAsset/applyBannerCopyOverrides,
        // 19-sheet-c-variety.js) — a Studio image swap has to mint or
        // rejoin the store entry too, or the reach line and the fan-out
        // below would still be keyed off the OLD picture.
        banner.setAttribute('data-image-ref', registerImageAsset(ed.imageSrc));
        const map = ed.framings || {};
        const overrideRatios = ed.frameOverrideRatios || {};
        /* Split this session's touched ratios: an override ("Just this
           one") writes to the unit alone; everything else is the
           default "all instances" scope §BR names — it belongs to the
           IMAGE, so it lands in the shared, campaign-level store and
           every OTHER unit sharing this image at that ratio re-renders
           too (the fan-out after this card's own paint, below). */
        const unitMap = sameSrc ? readBannerFramings(banner) : {};
        // A Reset/Rejoin this session (handleFrameRejoin's own comment)
        // drops a ratio from `map` entirely — nothing left to write —
        // so it needs its own pass to strip any stale PERSISTED
        // override the map-driven loop below would otherwise never see.
        if (sameSrc) Object.keys(ed.frameRejoined || {}).forEach((key) => { delete unitMap[key]; });
        const sharedKeys = [];
        Object.keys(map).forEach((key) => {
          if (overrideRatios[key]) unitMap[key] = clampFraming(map[key]);
          else { delete unitMap[key]; sharedKeys.push(key); } // rejoins the shared crop if this unit had its own before
        });
        sharedKeys.forEach((key) => {
          if (!assets.images[ed.imageSrc]) assets.images[ed.imageSrc] = { framings: {} };
          assets.images[ed.imageSrc].framings[key] = clampFraming(map[key]);
        });
        const tgtFr = framingForSize(unitMap, banner.getAttribute('data-size'), ed.imageSrc);
        if (mediaWrap) mediaWrap.innerHTML = mediaTagHTML(ed.imageSrc, null, tgtFr);
        applyFramingToBanner(banner, tgtFr);
        writeBannerFramings(banner, unitMap);
        // This card already has its fresh paint above — every OTHER
        // unit on the board sharing this image at a ratio just written
        // in shared scope re-renders now too (sheet cards and Selects;
        // Package/Preview Sizes rebuild fresh from the store on demand
        // and need no push).
        sharedKeys.forEach((key) => refreshSharedFramingAcrossBoard(ed.imageSrc, key, banner));
        const fontId = ed.font || DEFAULT_FONT_ID;
        banner.setAttribute('data-font', fontId);
        const h = banner.querySelector('.pt-banner-headline');
        if (h) { h.textContent = ed.headline; h.style.fontFamily = fontMeta(fontId).family; applyHeadlineFit(h, banner.getAttribute('data-size'), ed.headline); }
        const c = banner.querySelector('.pt-banner-cta');
        if (c) c.textContent = ed.cta;
        const copyDiv = banner.querySelector('.pt-banner-copy');
        if (copyDiv && c) {
          syncOptionalCopySpan(copyDiv, 'pt-banner-subhead', ed.subhead, c);
          syncOptionalCopySpan(copyDiv, 'pt-banner-body', ed.body, c);
        }
        const innerDiv = banner.querySelector('.pt-banner-inner');
        if (innerDiv) ensureDisclaimerSlot(innerDiv, ed.disclaimer); // the slot stays; only its text and classes change
        // §BR.3 — headline/CTA/legal are LINES now (assets.lines), the
        // same unit-override-first/shared-store-second precedence as
        // framings (§BR.2): a field in ed.copyOverrideRoles is this
        // unit's own answer ("Just this one") and lands in data-copy-
        // overrides alone; every other TOUCHED field (ed.copyTouched —
        // a field nobody clicked into this session is not this commit's
        // business, the same "only what was actually touched" rule
        // framings' own `map` follows) belongs to the LINE — it writes
        // assets.lines straight (the id never changes here; only a band
        // pick, fieldMutator's 'headline'/'cta'/'legal' cases,
        // 14-hat-a-files.js, ever repoints a unit at a DIFFERENT line)
        // and fans out to every OTHER unit referencing that id, on the
        // sheet and in Selects. This card's own paint above already
        // used `ed[field]` either way — override or shared, that IS the
        // value either scope wants here.
        const copyTouched = ed.copyTouched || {};
        const copyOverrideRoles = ed.copyOverrideRoles || {};
        const copyRejoined = ed.copyRejoined || {};
        const copyOverrides = readBannerCopyOverrides(banner);
        Object.keys(copyRejoined).forEach((field) => { delete copyOverrides[field]; });
        const sharedCopyFields = [];
        ['headline', 'cta', 'disclaimer'].forEach((field) => {
          if (!copyTouched[field] && !copyRejoined[field]) return; // never touched this session — leave exactly as it was
          if (copyOverrideRoles[field]) {
            copyOverrides[field] = ed[field];
          } else {
            delete copyOverrides[field]; // rejoins the shared line if this unit had its own before
            if (copyTouched[field]) sharedCopyFields.push(field);
          }
        });
        writeBannerCopyOverrides(banner, copyOverrides);
        sharedCopyFields.forEach((field) => {
          const idAttr = field === 'cta' ? 'data-cta-id' : field === 'disclaimer' ? 'data-legal-id' : 'data-headline-id';
          const role = field === 'disclaimer' ? 'legal' : field;
          const id = banner.getAttribute(idAttr);
          if (!id) return;
          if (!assets.lines[id]) assets.lines[id] = { role: role, text: ed[field], fit: {} };
          else assets.lines[id].text = ed[field];
          refreshSharedLineAcrossBoard(field, id, banner);
        });
        // §BR.4 — SIZE by line × ratio: the same unit-override-first/
        // shared-second split as the copy commit just above, but keyed
        // by fitKey(field, ratio) rather than field alone — a session
        // can touch a field's size at more than one ratio (a filmstrip
        // size switch mid-edit), and each key resolves independently.
        const fitTouched = ed.fitTouched || {};
        const fitOverrideRoles = ed.fitOverrideRoles || {};
        const fitRejoined = ed.fitRejoined || {};
        const lineFitMap = readBannerLineFit(banner);
        Object.keys(fitRejoined).forEach((fk) => { delete lineFitMap[fk]; });
        const sharedFitKeys = [];
        Object.keys(fitTouched).forEach((fk) => {
          if (fitOverrideRoles[fk]) lineFitMap[fk] = clampLineFitScale(ed.lineFit[fk]);
          else { delete lineFitMap[fk]; sharedFitKeys.push(fk); } // rejoins the shared size if this unit had its own before
        });
        writeBannerLineFit(banner, lineFitMap);
        sharedFitKeys.forEach((fk) => {
          const sep = fk.indexOf('|');
          const field = fk.slice(0, sep), fkey = fk.slice(sep + 1);
          const idAttr = PT_COPY_ROLE_ATTR[field];
          const id = idAttr && banner.getAttribute(idAttr);
          if (!id) return;
          if (!assets.lines[id]) assets.lines[id] = { role: PT_COPY_ROLE_ASSET[field], text: ed[field], fit: {} };
          if (!assets.lines[id].fit) assets.lines[id].fit = {};
          assets.lines[id].fit[fkey] = clampLineFitScale(ed.lineFit[fk]);
        });
        // This card's own three lines repaint at their now-resolved
        // scale (own override or freshly-shared, either way already
        // written above); shared keys then fan out to every OTHER unit
        // sharing that line at that exact ratio.
        ['headline', 'cta', 'disclaimer'].forEach((field) => { applyLineFit(banner, field); });
        sharedFitKeys.forEach((fk) => {
          const sep = fk.indexOf('|');
          const field = fk.slice(0, sep), fkey = fk.slice(sep + 1);
          const idAttr = PT_COPY_ROLE_ATTR[field];
          const id = idAttr && banner.getAttribute(idAttr);
          if (id) refreshSharedLineFitAcrossBoard(field, id, fkey, banner);
        });
        // BA.2 — the moves ride to the card: data-offsets (the
        // data-framings convention) plus the inline vars for the card's
        // own size, written AFTER the copy spans and the legal slot
        // above are settled (they can rebuild the very elements the
        // vars sit on). Every clone of the card carries them from here.
        writeBannerOffsets(banner, ed.offsets || {});
      });
      /* Only the Studio "add to canvas" path still builds a row header
         to keep in step; a card-scoped commit walks up to find it, and
         finds nothing on the concept sheet, whose rows lost their
         headers when they stopped being one concept each. */
      const groupEl = scope.closest ? scope.closest('.pt-concept-group') : null;
      const desc = groupEl && groupEl.querySelector('.pt-concept-desc');
      if (desc) desc.innerHTML = escape(LAYOUT_NAME[ed.layoutId]) + ' · “' + escape(ed.headline) + '”';
      // BD.3 — a resized card needs the board's fit pass to re-measure
      // it at its new natural size/shape (applyCardScale, measureLegalH).
      if (sizeChanged) scheduleFitAllBannerScales();
    }
    // BD.3 — everything bannerCardHTML would have written for `sizeId`
    // had the card been built at that size from the start: both
    // data-size attributes, the WIDE_SIZE_IDS class, the Remove
    // button's label, and (for a card that lives in a concept group's
    // shape grid) its row.
    function applyCardSizeChange(card, banner, sizeId) {
      const sizeMeta = SIZES.filter(s => s.id === sizeId)[0];
      const label = sizeMeta ? sizeMeta.label : sizeId;
      card.setAttribute('data-size', sizeId);
      banner.setAttribute('data-size', sizeId);
      card.classList.toggle('pt-banner-card-wide', WIDE_SIZE_IDS.indexOf(sizeId) !== -1);
      const removeBtn = card.querySelector('.pt-banner-remove-btn');
      if (removeBtn) removeBtn.setAttribute('aria-label', 'Remove ' + label);
      const group = card.closest('.pt-concept-group');
      if (group) moveCardToShapeRow(card, group, sizeId);
    }
    // BD.3 — places `card` into `group`'s shape row for `sizeId` (box/
    // wide share the left region, tower the right — shapeGridHTML's
    // own regions and row order), creating the row (and its left/right
    // side) the group doesn't have yet; the row — and an emptied side —
    // the card leaves behind is dropped, and the grid's own pt-no-
    // towers/pt-only-towers modifiers are recomputed the same way
    // shapeGridHTML derives them (hasLeft/hasRight).
    function moveCardToShapeRow(card, group, sizeId) {
      const grid = group.querySelector('.pt-shape-grid');
      if (!grid) return;
      const oldRow = card.parentElement && card.parentElement.classList.contains('pt-shape-row') ? card.parentElement : null;
      const shape = shapeClassFor(sizeId);
      const sideCls = shape === 'tower' ? 'pt-shape-right' : 'pt-shape-left';
      let side = grid.querySelector(':scope > .' + sideCls);
      if (!side) {
        side = document.createElement('div');
        side.className = sideCls;
        if (sideCls === 'pt-shape-right') grid.appendChild(side); else grid.insertBefore(side, grid.firstChild);
      }
      let row = side.querySelector(':scope > .pt-shape-row-' + shape);
      if (!row) {
        row = document.createElement('div');
        row.className = 'pt-shape-row pt-shape-row-' + shape;
        // shapeGridHTML's own row order within the left region: box, then wide.
        if (shape === 'wide') side.appendChild(row); else side.insertBefore(row, side.firstChild);
      }
      const orderOf = shape === 'wide' ? wideOrderIndex : sizesOrderIndex;
      const target = orderOf(sizeId);
      const before = Array.prototype.slice.call(row.children)
        .filter((sib) => sib !== card && orderOf(sib.getAttribute('data-size')) > target)[0] || null;
      row.insertBefore(card, before);
      if (oldRow && oldRow !== row && !oldRow.querySelector(':scope > .pt-banner-card')) {
        const oldSide = oldRow.parentElement;
        oldRow.remove();
        if (oldSide && !oldSide.querySelector(':scope > .pt-shape-row')) oldSide.remove();
      }
      grid.classList.toggle('pt-no-towers', !grid.querySelector(':scope > .pt-shape-right .pt-banner-card'));
      grid.classList.toggle('pt-only-towers', !grid.querySelector(':scope > .pt-shape-left .pt-banner-card') && !!grid.querySelector(':scope > .pt-shape-right .pt-banner-card'));
    }

    // ═══ AY — Studio, one panel (Bryan, 9/15: "a very elevated version
    //     of the original where everything is sort of available
    //     from one panel vs nested, and let the user do a lot of the
    //     editing via clicking on the part they want to edit"). The
    //     P5 tool rail, the P6/P10 sliding drawers and the AK.2(b)
    //     Versions rail are gone; #ptEditorPanel at the right of the
    //     stage holds every control in one scroll, group by group
    //     (SIZE · STYLE · IMAGE · VERSIONS — §BQ, Bryan 9/18: LAYOUT
    //     retired entirely, TYPE retired ("in the template"), COPY
    //     retired ("direct edit in the asset" — the stage already IS
    //     the copy editor), and STYLE GUIDE + COLORWAY merged into one
    //     STYLE group, the same "pick a style, its colorway rides
    //     along as an overridable default" pattern §BM/§BN already use
    //     on the sheet's own Style pill), each a mono eyebrow over a
    //     house recipe: SIZE's finished per-size renders (the same
    //     builder the filmstrip and Versions already share), AM.6's
    //     style-guide cover card with the band's colorway specimens
    //     beneath it, AM.2's framing rows, the swap thumbs + the
    //     See-all link, and the versions list. Clicking a part of the
    //     banner on the stage lands you on its group (studioPanelGoTo,
    //     wired in wireStageEditableFields). History is the topbar's
    //     undo/redo; the Brand/Legal checks are the topbar's two chips
    //     (each opens its list as a popover). ═══
    function blankEditorState() {
      // subhead/body/disclaimer/custom/order (P8) give editorState the
      // exact same shape as a copy-editor "model" — the deck-drop row
      // lands straight onto it (landDeckOnRows), no adapter.
      return {
        concept: null, sizeId: '300x250', layoutId: 'type-top', colorway: 'gold-on-dark',
        headline: '', cta: '', subhead: '', body: '', disclaimer: '', custom: [], order: ['headline', 'cta'],
        imageSrc: null, font: DEFAULT_FONT_ID,
        framings: {}, // AY.3 — the stage drag / framing rows read this from the first beat, image or not
        offsets: {}, // BA.1 — where the parts were moved to, per size, natural px (absent = the layout's own home)
        customColor: null, // P9 fine-tune — {ground, ink, accent, tint}; named
                           // customColor (not `custom`, already the P8 extra-
                           // copy-rows array on this same object) to avoid a
                           // real collision with the copy engine above.
        // §BR.3 — a blank Studio banner has no line references yet
        // (handleStudioAddToCanvas mints them fresh, same as any other
        // fresh generate) — null here just means "no reach to name",
        // exactly like framings' own empty-map default means "never
        // touched" until an id exists to ask about.
        headlineId: null, ctaId: null, legalId: null,
        copyOverrideRoles: {}, copyTouched: {}, copyRejoined: {},
        // §BR.4 — lineFit mirrors framings' own shape (this session's
        // working answer, unit-override-first/shared-second precedence
        // via lineFitScale), just keyed by fitKey(field, ratio) instead
        // of ratio alone since a unit carries three lines at once.
        // fitOverrideRoles/fitRejoined are the size analogues of
        // copyOverrideRoles/copyRejoined; fitTouched of copyTouched — a
        // fitKey nobody actually moved the slider/clicked Fit for this
        // session is not propagateEditsToGroup's business, same "only
        // what was actually touched" rule copyTouched already follows.
        lineFit: {}, fitOverrideRoles: {}, fitRejoined: {}, fitTouched: {}
      };
    }

    // The panel's groups, top to bottom (AY.2, BD.1, §BQ) — also the
    // 1–4 keys. LAYOUT, TYPE and COPY retired (§BQ); STYLE GUIDE and
    // COLORWAY merged into one STYLE group.
    const PT_STUDIO_PANEL_GROUPS = [
      { id: 'size',     label: 'Size' },
      { id: 'style',    label: 'Style' },
      { id: 'image',    label: 'Image' },
      { id: 'versions', label: 'Versions' }
    ];
    function studioPanelEl() { return document.getElementById('ptEditorPanel'); }
    function studioPanelGroupEl(id) {
      const panel = studioPanelEl();
      return panel ? panel.querySelector('.pt-editor-panel-group[data-group="' + id + '"]') : null;
    }
    // 9/16 (Bryan, on the panel's groups: "you should be able to
    //   collapse these panels") — the eyebrow is the group's own
    //   disclosure: a full-width button, the label at its left and a
    //   caret at its right that rotates when the body folds away. The
    //   open/closed state lives here for the session (every group
    //   starts open, and a refresh resets it — the house rule) and
    //   survives the panel's own wholesale repaints, which is why the
    //   builder reads it rather than the DOM.
    const studioPanelCollapsed = {};
    function studioPanelGroupHTML(id, label, bodyHTML) {
      const off = !!studioPanelCollapsed[id];
      return (
        '<section class="pt-editor-panel-group' + (off ? ' is-collapsed' : '') + '" data-group="' + id + '">' +
          '<button class="pt-editor-drawer-eyebrow pt-editor-panel-eyebrow" type="button" data-panel-toggle="' + id + '"' +
            ' aria-expanded="' + (off ? 'false' : 'true') + '" aria-controls="ptPanelBody-' + id + '">' +
            '<span class="pt-editor-panel-eyebrow-label">' + label + '</span>' +
            '<span class="pt-editor-panel-caret" aria-hidden="true">' + SET_ICONS.caret + '</span>' +
          '</button>' +
          '<div class="pt-editor-panel-body" id="ptPanelBody-' + id + '"' + (off ? ' hidden' : '') + '>' + bodyHTML + '</div>' +
        '</section>'
      );
    }
    // Folds or unfolds one group. Never rebuilds the body — the
    // markup stays put so a collapse costs nothing and an expand
    // returns the group exactly as it was (scroll position, an open
    // combo, a half-typed field).
    function setStudioPanelCollapsed(id, off) {
      const group = studioPanelGroupEl(id);
      if (!group) return;
      studioPanelCollapsed[id] = !!off;
      group.classList.toggle('is-collapsed', !!off);
      const btn = group.querySelector('[data-panel-toggle]');
      if (btn) btn.setAttribute('aria-expanded', off ? 'false' : 'true');
      const body = group.querySelector('.pt-editor-panel-body');
      if (body) body.hidden = !!off;
    }
    const STUDIO_SEEALL_ARROW = '<span class="pt-seeall-link-arrow" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"/></svg></span>';

    // ── 0. SIZE (BD.1, Bryan 9/16: "somewhere in here should be an
    //    option to change the size"; §BQ, Bryan 9/18: "the size group
    //    should show all sizes finished and designed" — "Let's show
    //    all sizes here by default, so you are 1 click into the full
    //    set") — the panel's FIRST group, open by default. Every ship
    //    size renders as a REAL finished miniature of the actual
    //    banner (buildStageBannerElForSize — the same builder the
    //    filmstrip and the Versions rows already clone-and-scale from,
    //    so there is no separate "preview" code path to drift out of
    //    sync), never an outline glyph. Every tile shares ONE scale
    //    factor (STUDIO_SIZE_TILE_SCALE) so the tiles stay honest
    //    about each other's proportions — a 728×90 tile really does
    //    read wider than a 320×50 one, a 160×600 tile really does read
    //    taller than a 300×250 one — and simply flow (flex-wrap) at
    //    whatever width that leaves them: box shapes fall in together,
    //    wide bars take their own row, towers pair up. Nothing clips
    //    (the pic box is exactly the scaled size, no crop). The
    //    current size is marked with the accent hairline (the same
    //    outline-on-the-pic recipe as a Versions row). ──
    const STUDIO_SIZE_TILE_SCALE = 0.28;
    function studioSizeTileHTML(s, isOn) {
      const parts = s.id.split('x');
      const naturalW = parseInt(parts[0], 10) || 1;
      const naturalH = parseInt(parts[1], 10) || 1;
      const tileW = Math.round(naturalW * STUDIO_SIZE_TILE_SCALE);
      const tileH = Math.round(naturalH * STUDIO_SIZE_TILE_SCALE);
      // A finished render of THIS size, not the size on the stage right
      // now — same stateOverride contract buildStageBannerElForSize
      // already offers the Versions rail (AK.2(b)).
      const st = Object.assign({}, editorState, { sizeId: s.id });
      const clone = buildStageBannerElForSize(s.id, st);
      clone.style.width = naturalW + 'px';
      clone.style.height = naturalH + 'px';
      clone.style.transform = 'scale(' + STUDIO_SIZE_TILE_SCALE + ')';
      clone.style.transformOrigin = 'top left';
      return (
        '<button class="pt-studio-size-tile' + (isOn ? ' is-active' : '') + '" type="button" role="menuitemradio" aria-checked="' + (isOn ? 'true' : 'false') + '" data-studio-size="' + s.id + '">' +
          '<span class="pt-studio-size-pic" style="width:' + tileW + 'px;height:' + tileH + 'px" aria-hidden="true">' + clone.outerHTML + '</span>' +
          '<span class="pt-studio-size-label">' + escape(s.label) + '</span>' +
        '</button>'
      );
    }
    function studioSizeGroupBodyHTML() {
      const tiles = SIZES.map(s => studioSizeTileHTML(s, s.id === editorState.sizeId)).join('');
      return '<div class="pt-studio-size-tiles" id="ptStudioSizeTiles" role="radiogroup" aria-label="Size">' + tiles + '</div>';
    }
    // Repaints the SIZE tiles' own renders (not just the ring — the
    // tiles are finished PICTURES of the unit, so a style/colorway/
    // image/copy change has to redraw them same as the filmstrip).
    // Called from pushStudioHistory (every committed edit funnels
    // through there) and from applyStudioSnapshot (undo/redo/restore).
    function refreshStudioSizeTiles() {
      if (!inStudio || !editorState) return;
      const group = studioPanelGroupEl('size');
      if (!group) return;
      renderStudioPanelGroup('size');
    }
    // BD.2/BD.3 — a tile pick behaves differently by mode: in UNIT mode
    // it resizes the active artboard on the spot (the parent or the
    // version on the stage); in a NEW banner it joins the film strip
    // if absent (handleStudioAddSize's own beat, which pushes its own
    // "Size: added …" step when it does) and becomes the stage's size
    // — the film item's own click beat. Picking the size already on
    // the stage does nothing, either mode.
    function wireStudioSizeGroup(root) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-studio-size]'), (tile) => {
        tile.addEventListener('click', () => {
          const id = tile.getAttribute('data-studio-size');
          if (!editorState || id === editorState.sizeId) return;
          if (studioUnitMode) {
            editorState.sizeId = id;
            renderEditorStage(true);
            renderEditorFilmstrip(); // AY.4 — the film tile wears the new size from the state already
            pushStudioHistory('Size: ' + sizeDisplayLabel(id));
          } else {
            handleStudioAddSize(id);
            editorState.sizeId = id;
            renderEditorStage(true);
            renderEditorFilmstrip();
            pushStudioHistory('Size');
          }
          syncStudioPanel();
        });
      });
    }

    // ── 1. STYLE (§BQ merged Style guide + Colorway into one group;
    //    §BT retires the Colorway half — colour comes from the style
    //    guide only, no override) — AM.6's cover card (cover · name ·
    //    line, the roster's own card-row recipe): the hat's current
    //    pick when it resolves to a brand guide, the array's lead
    //    guide otherwise. Click opens the Styles roster anchored to
    //    the card, as before. ──
    function studioCurrentBrandGuide() {
      return SET_BRAND_BY_ID[mediaSetup.templates[0]] || SET_BRAND_TEMPLATES[0]; // AW.1 — the Layouts pick is a LIST; a guide is always its sole entry, so index 0 is the only place to look
    }
    function studioStyleGroupBodyHTML() {
      // Bryan, 9/15 ("this doesn't really look like a thing you click and
      // choose"): the current guide's card reads as a CHOOSER, not a
      // checked radio — unchecked, a caret at its right (the Type combo's
      // own cue beside it), the hover the sheet's chips have.
      return brandGuideRowHTML(studioCurrentBrandGuide(), 'data-studio-brand-card', false)
        .replace(/<\/button>\s*$/, SET_ICONS.caret + '</button>');
    }
    function wireStudioStyleGroup(root) {
      const card = root.querySelector('[data-studio-brand-card]');
      if (!card) return;
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        openStyleSetMenu(card);
        // A pick in that roster repaints this card (AM.6's own contract,
        // which used to ride the drawer's same-tool refresh): the
        // roster's handler is registered first, so it has already
        // written mediaSetup.templates by the time this one runs.
        const menu = setOpenMenu && setOpenMenu.btn === card ? setOpenMenu.menu : null;
        if (menu) menu.addEventListener('click', (ev) => {
          if (ev.target.closest('[data-set-template]')) renderStudioPanelGroup('style');
        });
      });
    }
    // §BT — studioColorwayGroupBodyHTML/wireStudioColorwayGroup (the
    // six colorway specimens as an override, ringed on editorState.
    // colorway) retired: STYLE shows the guide card only.

    // ── 4. IMAGE — FRAMING first (AM.2's rows, verbatim: the zoom
    //    slider with its value, the x/y centre readout, Reset, the drag
    //    hint), then SWAP: the gallery as swap thumbs four across (the
    //    current one ringed), then "View gallery →" (AS's single-pick
    //    door, "Use this image"). ──
    function studioFramingSectionHTML() {
      return (
        '<div class="pt-studio-framing">' +
          '<div class="pt-frame-row">' +
            '<input class="pt-frame-range" type="range" id="ptFrameScale" min="50" max="250" step="1" value="100" aria-label="Image scale">' +
            '<span class="pt-frame-val" id="ptFrameScaleVal">100%</span>' +
          '</div>' +
          '<div class="pt-frame-row">' +
            '<span class="pt-frame-readout" id="ptFrameCenterVal"><span class="pt-frame-axis">x</span> <span id="ptFrameCenterX">50%</span> · <span class="pt-frame-axis">y</span> <span id="ptFrameCenterY">58%</span></span>' +
            '<span class="pt-frame-edited" id="ptFrameEdited" hidden>edited</span>' +
            '<button class="pt-frame-reset" type="button" id="ptFrameReset">Reset</button>' +
          '</div>' +
          // §BR.2 — the reach line: names who a crop here would land
          // on before Apply/Back ever commits it. Empty when nothing
          // else on the board shares this image at this shape (no
          // toggle, no ⓘ — a plain text link, house style).
          '<p class="pt-frame-reach" id="ptFrameReachText"></p>' +
          '<p class="pt-frame-note" id="ptFrameHint">Drag the image on the stage to move the centrepoint.</p>' +
        '</div>'
      );
    }
    function studioImageGroupBodyHTML() {
      return (
        studioFramingSectionHTML() +
        '<div class="pt-editor-swap-strip pt-studio-swap" id="ptStudioSwapStrip" role="group" aria-label="Swap image"></div>' +
        '<button class="pt-seeall-link pt-studio-gallery-link" type="button" id="ptStudioGalleryBtn"><span>View gallery</span>' + STUDIO_SEEALL_ARROW + '</button>'
      );
    }
    // AM.2 — wires the Framing rows above: same doors the old panel
    // used (setEditorFramingScale, Reset's own clear-this-shape's-crop),
    // bound fresh on every panel render since the markup is rebuilt.
    function wireStudioImagesFraming(root) {
      const slider = root.querySelector('#ptFrameScale');
      if (slider) {
        slider.addEventListener('input', () => setEditorFramingScale(parseInt(slider.value, 10) || 100));
        // §BR.2 — one history entry per completed drag of the slider
        // (change fires once on release), same "wasn't undoable before
        // BR.2" fix as the stage pan's own pointerup.
        slider.addEventListener('change', () => pushStudioHistory('Crop'));
      }
      const reset = root.querySelector('#ptFrameReset');
      if (reset) reset.addEventListener('click', () => {
        if (!editorState) return;
        const key = currentFramingKey();
        delete editorState.framings[key];
        // §BR.2 — Reset clears THIS unit's own answer entirely, same as
        // Rejoin: it falls back through to the shared/campaign crop
        // (or the plain default if nobody has cropped this image at
        // this shape), it does not resurrect a pre-existing override.
        if (editorState.frameOverrideRatios) delete editorState.frameOverrideRatios[key];
        // Same commit-time signal Rejoin uses (see its own comment) —
        // without it a pre-existing PERSISTED override would survive
        // Reset's own Apply/Back untouched.
        if (!editorState.frameRejoined) editorState.frameRejoined = {};
        editorState.frameRejoined[key] = true;
        const banner = document.querySelector('#ptEditorStage .pt-banner');
        const box = banner && banner.querySelector('.pt-banner-media');
        const el2 = box && box.querySelector('img, video');
        const fr = currentFraming();
        if (banner) applyFramingToBanner(banner, fr);
        // Reset can hand scale back to something below whatever was
        // draggable a moment ago (no crossfade here, so the query is
        // unambiguous).
        setFramingHintVisible(framingIsDraggable(box, el2, fr));
        renderEditorFraming();
        pushStudioHistory('Reset crop');
      });
    }
    // The drag hint's show/hide is decided by wireStageFramingDrag at
    // stage-render time — which, on open, runs BEFORE this panel is
    // painted — so a fresh panel re-asks the stage once it exists.
    function syncStudioFramingHint() {
      if (!editorState) return;
      const box = document.querySelector('#ptEditorStage .pt-banner-media');
      const el2 = box && box.querySelector('img, video');
      setFramingHintVisible(framingIsDraggable(box, el2, currentFraming()));
    }
    function wireStudioImageGroup(root) {
      wireStudioImagesFraming(root);
      const btn = root.querySelector('#ptStudioGalleryBtn');
      if (btn) btn.addEventListener('click', () => {
        // AS.2 — 'single': one still for THIS banner, not a multi-pick.
        openEnvOverlay((chosen) => {
          if (!chosen || !chosen.length) return;
          editorState.imageSrc = chosen[0].src;
          editorState.framings = {}; // a crop is an argument about one photograph — see populateSwapThumbs
          editorState.frameOverrideRatios = {};
          editorState.frameRejoined = {};
          renderEditorFraming();
          crossfadeStageImage(chosen[0].src);
          renderEditorFilmstrip();
          renderEditorSwapStrip();
          pushStudioHistory('Image');
        }, 'single');
      });
      renderEditorSwapStrip();
    }

    // TYPE and COPY groups retired entirely (§BQ, Bryan 9/18: "in the
    // template" on Type, "Direct edit in the asset" on Copy) — type
    // comes from the picked style's template, never a Studio control;
    // copy is still edited directly on the stage (AY.3,
    // wireStageEditableFields, unchanged), just with no panel group
    // pointing at it any more. The font combo, its specimen line and
    // the copy-deck-drop wiring that used to live here are gone with
    // their groups; editorState.font/headline/cta/etc. are untouched
    // and still read by buildStageBannerElForSize exactly as before.

    // ── 2. VERSIONS — the saved versions (AK.3/AM.7) as a short list
    //    moved in from the rail: thumb (clone-and-scale, the filmstrip's
    //    own technique) · "v1 · from A2.1" · when, newest first, the
    //    current one marked; a click restores it. Save stays in the
    //    topbar. ──
    function studioVersionItemHTML(v, isCurrent) {
      let data;
      try { data = JSON.parse(v.snap).editorState; } catch (e) { data = editorState; }
      const parts = String(data.sizeId).split('x');
      const naturalW = parseInt(parts[0], 10) || 300, naturalH = parseInt(parts[1], 10) || 250;
      const s = Math.min(44 / naturalW, 33 / naturalH, 1); // fits any shape — box, wide strip or tower alike
      const clone = buildStageBannerElForSize(data.sizeId, data);
      clone.style.width = naturalW + 'px';
      clone.style.height = naturalH + 'px';
      clone.style.transform = 'scale(' + s + ')';
      // AM.1 — the unit editor's own auto-created v1 carries a fixed
      // desc ("as generated"); AM.7's versions say what they came from.
      const line = v.desc ? escape(v.desc) : escape(sizeDisplayLabel(data.sizeId));
      return (
        '<button class="pt-studio-version-item' + (isCurrent ? ' is-active' : '') + '" type="button" data-version="' + v.label + '"' + (isCurrent ? ' aria-current="true"' : '') + '>' +
          '<span class="pt-studio-version-pic">' + clone.outerHTML + '</span>' +
          '<span class="pt-studio-version-foot">' +
            '<span class="pt-studio-version-chip">' + v.label + '</span>' +
            '<span class="pt-studio-version-line">' + line + '</span>' +
            '<span class="pt-studio-version-when">' + escape(studioTimeLabel(v.savedAt)) + '</span>' +
          '</span>' +
        '</button>'
      );
    }
    function versionsListHTML() {
      if (!studioVersions.length) return '<p class="pt-studio-versions-empty">No saved versions yet — Save keeps one.</p>';
      return studioVersions.slice().reverse().map(v => studioVersionItemHTML(v, v.snap === studioLastSavedSnap && !studioIsDirty())).join('');
    }
    function wireVersionsListClicks(root) {
      Array.prototype.forEach.call(root.querySelectorAll('.pt-studio-version-item'), (item) => {
        item.addEventListener('click', () => {
          const label = item.getAttribute('data-version');
          const v = studioVersions.filter(x => x.label === label)[0];
          if (!v) return;
          studioHistory = studioHistory.slice(0, studioHistoryIndex + 1);
          studioHistoryLabels = studioHistoryLabels.slice(0, studioHistoryIndex + 1);
          studioHistory.push(v.snap);
          studioHistoryLabels.push('Restored ' + v.label);
          studioHistoryIndex = studioHistory.length - 1;
          applyStudioSnapshot(v.snap);
          studioLastSavedSnap = v.snap; // a just-restored save point is, by definition, not a pending edit
          refreshUndoRedoButtons();
          syncStudioSaveStatus();
        });
      });
    }
    function studioVersionsGroupBodyHTML() {
      return '<div class="pt-studio-versions-list">' + versionsListHTML() + '</div>';
    }
    function wireStudioVersionsGroup(root) { wireVersionsListClicks(root); }
    // AK.2(b)'s name, kept: applyStudioSnapshot (the earlier Studio JS
    // partial) and every save path call it after a change that can
    // move which version reads as "current" — it repaints the panel's
    // VERSIONS group now, the rail it once filled being gone.
    function renderStudioVersionsRail() { renderStudioPanelGroup('versions'); }

    // ── The panel itself. renderStudioPanel paints every group (open,
    //    a version switch); renderStudioPanelGroup repaints one;
    //    syncStudioPanel is the cheap per-edit pass that only moves
    //    the ringed/active states, so a scroll position, an open font
    //    menu or a slider mid-drag is never torn down under the hand. ──
    function studioPanelBodyHTML(id) {
      if (id === 'size') return studioSizeGroupBodyHTML();
      if (id === 'style') return studioStyleGroupBodyHTML(); // §BQ — style guide + colorway, merged
      if (id === 'image') return studioImageGroupBodyHTML();
      if (id === 'versions') return studioVersionsGroupBodyHTML();
      return '';
    }
    function wireStudioPanelGroup(id, root) {
      if (id === 'size') wireStudioSizeGroup(root);
      else if (id === 'style') wireStudioStyleGroup(root); // §BT — colorway wiring retired
      else if (id === 'image') wireStudioImageGroup(root);
      else if (id === 'versions') wireStudioVersionsGroup(root);
    }
    function renderStudioPanelGroup(id) {
      const group = studioPanelGroupEl(id);
      if (!group || !editorState) return;
      const body = group.querySelector('.pt-editor-panel-body');
      if (!body) return;
      body.innerHTML = studioPanelBodyHTML(id);
      wireStudioPanelGroup(id, body);
      if (id === 'image') { renderEditorFraming(); syncStudioFramingHint(); }
    }
    function renderStudioPanel() {
      const panel = studioPanelEl();
      if (!panel || !editorState) return;
      teardownStudioPanel(false);
      if (!editorState.framings) editorState.framings = {};
      if (!editorState.frameOverrideRatios) editorState.frameOverrideRatios = {};
      if (!editorState.frameRejoined) editorState.frameRejoined = {};
      panel.innerHTML = PT_STUDIO_PANEL_GROUPS.map(g => studioPanelGroupHTML(g.id, g.label, studioPanelBodyHTML(g.id))).join('');
      if (!panel._collapseWired) { // delegation — the panel element persists across its own repaints, its children do not
        panel._collapseWired = true;
        panel.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-panel-toggle]');
          if (!btn || !panel.contains(btn)) return;
          const id = btn.getAttribute('data-panel-toggle');
          setStudioPanelCollapsed(id, btn.getAttribute('aria-expanded') === 'true');
        });
      }
      PT_STUDIO_PANEL_GROUPS.forEach((g) => {
        const group = studioPanelGroupEl(g.id);
        const body = group && group.querySelector('.pt-editor-panel-body');
        if (body) wireStudioPanelGroup(g.id, body);
      });
      renderEditorFraming();
      syncStudioFramingHint();
      panel.scrollTop = 0;
    }
    // Drops the panel's document-level hooks; clear=true also empties
    // the markup — every Studio exit. (§BQ — the deck row's own hidden
    // file input/paste-drop handler and the font combo's outside-click
    // closer retired with the COPY and TYPE groups; nothing left to
    // unhook here beyond clearing the markup.)
    function teardownStudioPanel(clear) {
      if (clear) { const panel = studioPanelEl(); if (panel) panel.innerHTML = ''; }
    }
    function syncStudioPanel() {
      const panel = studioPanelEl();
      if (!panel || !editorState || !inStudio || !panel.firstChild) return;
      // BD.1 — the SIZE group's own ring, kept honest on every beat a
      // film click, the "+" tile, undo/redo or a version switch can
      // move editorState.sizeId out from under it.
      Array.prototype.forEach.call(panel.querySelectorAll('[data-studio-size]'), (t) => {
        const on = t.getAttribute('data-studio-size') === editorState.sizeId;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      // §BT — the colorway swatch sync (data-studio-colorway) retired
      // with the Colorway group.
      const strip = panel.querySelector('#ptStudioSwapStrip');
      if (strip) {
        let matched = false;
        Array.prototype.forEach.call(strip.querySelectorAll('.pt-editor-swap-thumb'), (b) => {
          const on = b.getAttribute('data-src') === editorState.imageSrc;
          b.classList.toggle('is-active', on);
          if (on) matched = true;
        });
        if (!matched && editorState.imageSrc) renderEditorSwapStrip(); // e.g. an undo back to a gallery pick the strip never listed
      }
      renderEditorFraming();
    }
    // AY.3 — "click the part you want to edit always lands you on its
    // controls": scrolls the panel to the group (its own scroller —
    // never the page's) and flashes the eyebrow with the house blur-
    // fade. Also the 1–4 keys' door.
    function studioPanelGoTo(id) {
      const panel = studioPanelEl();
      const group = studioPanelGroupEl(id);
      if (!panel || !group) return;
      if (studioPanelCollapsed[id]) setStudioPanelCollapsed(id, false); // a part clicked on the stage opens its group, folded or not
      const reduced = envReducedMotion();
      const top = Math.max(0, group.offsetTop - 20);
      if (reduced) panel.scrollTop = top; else panel.scrollTo({ top: top, behavior: 'smooth' });
      const eyebrow = group.querySelector('.pt-editor-panel-eyebrow');
      if (eyebrow) {
        eyebrow.classList.remove('is-flash');
        void eyebrow.offsetWidth; // restart the flash rather than let it no-op
        eyebrow.classList.add('is-flash');
        clearTimeout(eyebrow._flashTimer);
        eyebrow._flashTimer = setTimeout(() => eyebrow.classList.remove('is-flash'), reduced ? 0 : 900);
      }
    }
    // The three drawer doors the earlier Studio JS partial still names
    // (its Escape routing, applyStudioSnapshot, pushStudioHistory and
    // the Styles roster's AM.6 repaint) — every one of those calls is
    // gated on studioActiveTool, which nothing sets any more, so they
    // are never reached; kept as honest adapters onto the panel so no
    // caller ever dangles.
    function openStudioDrawer(tool) {
      // §BQ — 'copy'/'layout' groups are gone (COPY and LAYOUT retired)
      // and 'colorway' folded into 'style'; the map only names ids that
      // still exist on the panel.
      studioPanelGoTo({ size: 'size', images: 'image', colors: 'style', brand: 'style', history: 'versions', versions: 'versions' }[tool] || 'size');
    }
    function closeStudioDrawer() { /* no drawer to close — the panel is always up */ }
    function renderStudioDrawer(tool) { if (tool === 'brand') renderStudioPanelGroup('style'); else syncStudioPanel(); }

    // ── AK.6 — the Brand check list, live from editorState. Not a panel
    //    group any more (AY.2): the topbar's Brand / Legal chips carry
    //    the summary and each opens the list as a popover. ──
    function studioBrandChecks() {
      if (!editorState) return [];
      const cc = editorState.customColor || COLORWAY_COLOR_DEFAULTS[editorState.colorway] || COLORWAY_COLOR_DEFAULTS['gold-on-dark'];
      const ratio = contrastRatio(cc.ground, cc.ink);
      return [
        { label: 'Logo clear space', ok: true },
        { label: 'Minimum type size', ok: !!(editorState.headline && editorState.headline.trim()) },
        { label: 'Legal line present', ok: !!(editorState.disclaimer && editorState.disclaimer.trim()) },
        { label: 'Contrast AA', ok: ratio >= 4.5 }
      ];
    }
    function studioBrandCheckListHTML() {
      return (
        '<div class="pt-brand-check-list">' +
          studioBrandChecks().map(c =>
            '<div class="pt-brand-check-row">' +
              '<span class="' + (c.ok ? 'pt-traffic-ok' : 'pt-traffic-pending') + '" aria-hidden="true">' + (c.ok ? ICONS.check : '•') + '</span>' +
              '<span class="pt-brand-check-label">' + escape(c.label) + '</span>' +
              '<span class="pt-brand-check-state">' + (c.ok ? 'Pass' : 'Pending') + '</span>' +
            '</div>'
          ).join('') +
        '</div>'
      );
    }
    function openStudioChecksPopover(btn) {
      if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
      const menu = el('<div class="pt-set-menu pt-studio-checks-pop" role="menu" aria-hidden="true"></div>');
      menu.innerHTML = '<div class="pt-set-sec">Brand check</div>' + studioBrandCheckListHTML();
      openSetMenu(btn, menu);
    }
    // The topbar's own Brand/Legal summary chips (AK.1/AK.6) — Brand
    // covers clear space + type size + contrast, Legal covers the
    // disclaimer line, so the two chips never disagree with the list.
    // Every stage repaint (renderEditorStage) and every committed edit
    // (pushStudioHistory, in the earlier Studio JS partial) funnels
    // through here — which makes it the one reliable beat to keep the
    // panel's own ringed states honest too (syncStudioPanel).
    function syncStudioBrandChips() {
      if (!editorState) return;
      const checks = studioBrandChecks();
      if (!checks.length) return;
      const brandOk = checks[0].ok && checks[1].ok && checks[3].ok;
      const legalOk = checks[2].ok;
      const brandEl = document.getElementById('ptEditorBrandChip');
      const legalEl = document.getElementById('ptEditorLegalChip');
      if (brandEl) {
        brandEl.classList.toggle('is-ok', brandOk);
        const s = brandEl.querySelector('.pt-hdr-chip-state');
        if (s) s.textContent = brandOk ? 'Brand · OK' : 'Brand · check';
      }
      if (legalEl) {
        legalEl.classList.toggle('is-ok', legalOk);
        const s = legalEl.querySelector('.pt-hdr-chip-state');
        if (s) s.textContent = legalOk ? 'Legal · OK' : 'Legal · pending';
      }
      syncStudioPanel();
    }

    // The filmstrip's "+" in new-banner mode (and ⌘D / Adapt to all
    // sizes) — the only path that grows the strip now that the Size
    // drawer's own rows are gone (AY.2: sizes are the filmstrip's "+").
    function handleStudioAddSize(sizeId) {
      if (studioFilmSizeIds.indexOf(sizeId) !== -1) return;
      studioFilmSizeIds.push(sizeId);
      renderEditorFilmstrip();
      pushStudioHistory('Size: added ' + sizeDisplayLabel(sizeId));
    }

    // ── Editable "Untitled banner" title + the hat's compact Studio
    //    row (replaces the 4-step wizard body while Studio is open —
    //    no chat lines, no "Step N of 4"). ──
    function wireStudioTitleEditable() {
      const titleEl = document.getElementById('ptEditorStudioTitle');
      if (!titleEl || titleEl._wired) return;
      titleEl._wired = true;
      titleEl.addEventListener('click', () => {
        if (titleEl.getAttribute('contenteditable') === 'true') return;
        titleEl.setAttribute('contenteditable', 'true');
        titleEl.focus();
        const range = document.createRange();
        range.selectNodeContents(titleEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); titleEl.textContent = studioTitle; titleEl.blur(); }
      });
      titleEl.addEventListener('blur', () => {
        titleEl.setAttribute('contenteditable', 'false');
        const val = titleEl.textContent.replace(/\s+/g, ' ').trim();
        studioTitle = val || 'Untitled banner';
        titleEl.textContent = studioTitle;
        syncStudioHatRow();
        pushStudioHistory('Renamed');
      });
    }
    // ═══ AK.3 — Saving. A "version" is a named save point: a snapshot
    //     kept in studioVersions this session (Save / ⌘S), mirrored
    //     into studioSavedBanners so the banner survives leaving
    //     Studio (Your Gallery ▸ BANNERS, AK.3/AK.6). Nothing here
    //     touches disk/localStorage — refresh resets it, same as every
    //     other UI/content state in this file. ═══
    function studioIsDirty() {
      if (!studioHistory.length) return false;
      return studioLastSavedSnap === null ? studioHistory.length > 1 : studioHistory[studioHistoryIndex] !== studioLastSavedSnap;
    }
    function studioTimeLabel(d) {
      return (d || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    // Written into the topbar's own save-status readout, and keeps the
    // Save chip disabled when the current step already IS the last
    // saved one (nothing to re-save).
    function syncStudioSaveStatus() {
      const el2 = document.getElementById('ptEditorSaveStatus');
      if (el2) {
        el2.textContent = studioLastSavedSnap === null
          ? 'Unsaved'
          : (studioIsDirty() ? 'Unsaved changes' : 'Saved · ' + studioTimeLabel(studioVersions.length ? studioVersions[studioVersions.length - 1].savedAt : null));
        el2.classList.toggle('is-dirty', studioLastSavedSnap === null || studioIsDirty());
      }
      const saveBtn = document.getElementById('ptEditorSaveBtn');
      if (saveBtn) saveBtn.disabled = studioLastSavedSnap !== null && !studioIsDirty();
    }
    // One version = the current snapshot + a label ("v1", "v2", …).
    // Also mirrors into studioSavedBanners so Your Gallery's BANNERS
    // group and a Studio exit's autosave share this one save path.
    function studioSaveVersion() {
      if (!inStudio || !editorState) return null;
      const snap = studioSnapshot();
      const v = { label: 'v' + (studioVersions.length + 1), snap: snap, savedAt: new Date() };
      studioVersions.push(v);
      studioLastSavedSnap = snap;
      if (!studioBannerRecordId) studioBannerRecordId = 'banner-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      let rec = studioSavedBanners.filter(b => b.id === studioBannerRecordId)[0];
      if (!rec) {
        rec = { id: studioBannerRecordId, title: studioTitle, sizeId: editorState.sizeId, sizeLabel: sizeDisplayLabel(editorState.sizeId), versions: [] };
        studioSavedBanners.unshift(rec);
      }
      rec.title = studioTitle;
      rec.sizeId = editorState.sizeId;
      rec.sizeLabel = sizeDisplayLabel(editorState.sizeId);
      rec.versions = studioVersions.slice();
      syncStudioSaveStatus();
      renderStudioVersionsRail();
      return v;
    }
    // Save chip / ⌘S — a version plus the done-flash + status-line
    // update the chip itself carries (house .is-copied 2200ms idiom).
    function handleStudioSave() {
      if (!inStudio || !editorState) return;
      studioSaveVersion();
      const btn = document.getElementById('ptEditorSaveBtn');
      if (btn) {
        btn.classList.add('is-copied');
        clearTimeout(btn._revertTimer);
        btn._revertTimer = setTimeout(() => btn.classList.remove('is-copied'), 2200);
      }
    }
    // Back/Escape out of Studio with unsaved work: save it quietly
    // (nothing is ever silently lost) and say so — the composer's own
    // ptBot voice, with an inline link back into Your Gallery.
    function studioAutosaveOnExit() {
      if (!inStudio || !editorState) return;
      // AM.7 — fold any unapplied NEW VERSIONS into the parent's own
      // Versions rail first (a no-op when this session never grew past
      // the parent — the ordinary AM.1 edit-and-discard, unchanged);
      // studioIsDirty() below then reads the PARENT's own edits only.
      // A fold forces the save below even when the parent itself was
      // never touched: studioSaveVersion() is what actually mirrors
      // into studioSavedBanners/Your Gallery (AK.3's own durability —
      // the only piece of this that survives Studio fully closing,
      // since a board unit's Versions rail, like everything else
      // openPainterEditor seeds, starts fresh every time it reopens),
      // so a discarded version stays reachable there under the
      // parent's own name/versions, exactly as the designer's words
      // ("autosaving it as the parent's version") describe.
      const folded = studioUnitMode && studioFoldDiscardedUnitVersions();
      if (!studioIsDirty() && !folded) return;
      const v = studioSaveVersion();
      if (!v) return;
      const node = ptBot(escape(studioTitle) + ' saved · ' + v.label + ' — open it from <button type="button" class="pt-chat-link" id="ptStudioAutosaveLink">Your Gallery</button>.');
      const link = node && node.querySelector('#ptStudioAutosaveLink');
      if (link) link.addEventListener('click', () => { openEnvOverlay(function () {}); });
    }
    // AK.5 — leaving Studio to run a fresh build from the pills: an
    // unsaved banner is autosaved first (AK.3, "nothing is ever
    // silently lost"), then the exact same door §AB's fork used
    // (state.sizes/layout + pendingSheetVariety → runGenerateInHat)
    // runs with the pills' CURRENT settings as the brief.
    function studioStartNewSet() {
      studioAutosaveOnExit();
      closePainterEditor(false); // no card to commit to — same "discard the blank/in-progress banner" contract exitStudioToDefault uses; also the ONLY call that actually hides #ptEditor (data-visible/editorState), which merely dropping .pt-editor-studio does not
      const editorEl = document.getElementById('ptEditor');
      if (editorEl) editorEl.classList.remove('pt-editor-studio');
      teardownStudioPanel(true);
      inStudio = false;
      state.sizes = mediaSetup.sizes.slice();
      // AW.1 — mediaSetup.templates is the Layouts pick LIST now;
      // templatesDealFor resolves it into varietyFor's own deal array
      // (see window._ptMediaSettingsSubmit for the full reasoning).
      // state.layout (the skeleton's single-value input) reads the
      // FIRST pick, same as that other door.
      state.layout = mediaSetup.templates.length ? templateLayoutId(mediaSetup.templates[0]) : 'diagonal';
      pendingSheetVariety = { templates: templatesDealFor(mediaSetup.templates), colorways: mediaSetup.colorways.slice() };
      runGenerateInHat(hatWizardBody, SHEET_ROWS);
    }
    // AK.5 — the pills return above the Studio row exactly as the
    // media pills are elsewhere in this file (pillsRowHTML/wirePillsRow,
    // shared verbatim with the fork step): they set the brief for the
    // NEXT generation only (§AJ.0's rule — the hat never touches a
    // banner already on the board/in Studio), never THIS banner. SEND
    // edits THIS banner instead, via handleStudioSend's intent map.
    // AY.5 — UNIT mode is the helper line alone: no pills row (so "from
    // these settings" goes with them); new-banner Studio keeps both.
    function renderStudioHatRow() {
      updateHatStepChrome(-1);
      const newSetBtnHTML = '<button class="pt-set-alt" type="button" id="ptHatNewSetBtn">New set</button>';
      hatWizardBody.innerHTML =
        '<div class="pt-hat-studio-body" id="ptHatStudioBody">' +
          (studioUnitMode ? '' : pillsRowHTML()) +
          '<p class="pt-set-hint">Describe a change to <span id="ptHatStudioHelperTitle">' + escape(studioTitle) + '</span> and send — or start a new set' +
            (studioUnitMode ? ': ' : ' from these settings: ') + newSetBtnHTML +
          '</p>' +
        '</div>';
      const pillsRow = hatWizardBody.querySelector('.pt-set-row');
      if (pillsRow) wirePillsRow(pillsRow);
      const newSetBtn = document.getElementById('ptHatNewSetBtn');
      if (newSetBtn) newSetBtn.addEventListener('click', () => { closeSetMenu(); studioStartNewSet(); });
      syncStudioHatRow();
    }
    function syncStudioHatRow() {
      const h = document.getElementById('ptHatStudioHelperTitle');
      if (h) h.textContent = studioTitle;
    }

    // AK.3 — `savedBanner` (a studioSavedBanners record) reopens THAT
    // banner at its latest version instead of a blank one; Your
    // Gallery's BANNERS group is the only caller that passes it.
    let studioReturnTo = 'blank';
    function openStudio(seedState, savedBanner) {
      editorGroupEl = null;
      editorCardEl = null; // Studio has no card on the sheet to commit back to
      inStudio = true;
      // Back returns to whatever was showing: the board, the resting
      // viewfinder, or the blank canvas.
      studioReturnTo = document.body.classList.contains('is-painter-resolved') ? 'sheet'
        : (((typeof mmOpen !== 'undefined') && mmOpen) ? 'rest' : 'blank');
      studioUnitMode = false; // AM.1 — a fresh/reopened banner, never a board unit
      studioUnitArtboards = null; // AM.7 — a new-banner Studio session never has a unit's own version list
      studioUnitActiveId = null;
      syncMediaTopbar(); // Y — Studio owns the canvas top now, its own topbar (#ptEditor's) covers this one anyway, but drop it explicitly too
      const editorEl = document.getElementById('ptEditor');
      if (!editorEl) return;
      editorEl.classList.add('pt-editor-studio');
      editorEl.classList.remove('pt-editor-unit-mode');
      const reopening = !!(savedBanner && savedBanner.versions && savedBanner.versions.length);
      if (reopening) {
        const latest = savedBanner.versions[savedBanner.versions.length - 1];
        const data = JSON.parse(latest.snap);
        editorState = data.editorState;
        studioFilmSizeIds = data.filmIds;
        studioTitle = data.title;
        studioBannerRecordId = savedBanner.id;
        studioVersions = savedBanner.versions.slice();
        studioLastSavedSnap = latest.snap;
      } else {
        editorState = seedState || blankEditorState();
        studioFilmSizeIds = [editorState.sizeId];
        studioTitle = 'Untitled banner';
      }
      const titleEl = document.getElementById('ptEditorStudioTitle');
      if (titleEl) { titleEl.setAttribute('contenteditable', 'false'); titleEl.textContent = studioTitle; }
      renderEditorStage();
      renderEditorFilmstrip();
      editorEl.setAttribute('data-visible', '1');
      editorEl.setAttribute('aria-hidden', 'false');
      renderStudioHatRow();
      // Studio owns the hat body from here — drop the settings surface's
      // header treatment so it doesn't linger behind Studio's own row.
      if (auxPanel) auxPanel.classList.remove('pt-settings-step');
      setAuxTitle(AUX_TITLE_MEDIA);
      // AM.1 — this same button reads "Apply to board" while editing a
      // unit (openPainterEditor); reset it here so a fresh/reopened
      // banner always reads its own primary, whatever ran before it.
      const addBtn = document.getElementById('ptEditorAddToCanvasBtn');
      if (addBtn) addBtn.textContent = 'Add to board';
      renderStudioPanel(); // AY — the one panel, every group painted on the open beat
      studioZoom = null; // AK.1 — every open starts at Fit
      if (reopening) { resetStudioUndoStack(); syncStudioSaveStatus(); } // keep ITS versions/record id
      else resetStudioHistory(); // P6 — the undo boundary: nothing to undo past the blank starting state
      renderStudioVersionsRail();
    }

    function exitStudioToDefault() {
      studioAutosaveOnExit(); // AK.3 — nothing unsaved is ever silently lost
      closePainterEditor(false); // no group to propagate to — the blank/in-progress banner is discarded
      const editorEl = document.getElementById('ptEditor');
      if (editorEl) editorEl.classList.remove('pt-editor-studio', 'pt-editor-unit-mode');
      teardownStudioPanel(true);
      inStudio = false;
      studioUnitMode = false;
      syncMediaTopbar(); // Y — back from Studio; renderForkStep/exitWizardToDefault below settle it further, this just clears the "no bar at all" gap between them
      if (studioReturnTo === 'sheet' && document.querySelector('#ptConcepts .pt-concept-group')) {
        closeMediaMode();
        document.body.classList.add('is-painter-resolved');
        flowRunning = true;
        wizardStep = -1;
        renderForkStep();
        syncMediaTopbar();
        return;
      }
      if (studioReturnTo === 'rest') {
        flowRunning = true;
        wizardStep = -1;
        renderForkStep();
        openMediaMode({ immediate: true });
        return;
      }
      exitWizardToDefault();
    }

    // AM.1 — the unit editor's own Back/Escape/"Apply to board" exit:
    // unlike exitStudioToDefault (Studio-from-hat, which always lands
    // back on the hat's settings surface), this always returns to the
    // BOARD the unit came from — the sheet was showing the whole time,
    // right behind #ptEditor, so "returning" is just closing it.
    // commit=true (Apply to board) writes the unit's state back to its
    // card (closePainterEditor's own propagate path — layout, colorway,
    // image + framing, headline, CTA, legal, font) and refreshes the
    // board's History item picture; commit=false (Back/Escape) autosaves
    // a version of the unit if there's unsaved work (AK.3 — nothing is
    // ever silently lost) and discards, touching the board not at all.
    // AM.7 — unit mode's own artboards list: studioUnitCaptureActive
    // flushes the live globals (editorState, the undo stack, versions)
    // back into whichever artboard is currently active BEFORE anything
    // switches away from it — pushStudioHistory/studioUndo/studioRedo
    // and friends all reassign studioHistory/editorState wholesale
    // rather than mutate in place, so the artboard's own stored
    // reference would otherwise go stale. studioUnitActivate is the
    // mirror: points the live globals at a different artboard's own
    // copy of each.
    function studioUnitCaptureActive() {
      if (!studioUnitArtboards) return;
      const a = studioUnitArtboards.filter((x) => x.id === studioUnitActiveId)[0];
      if (!a) return;
      a.state = editorState;
      a.history = studioHistory;
      a.historyLabels = studioHistoryLabels;
      a.historyIndex = studioHistoryIndex;
      a.versions = studioVersions;
      a.lastSavedSnap = studioLastSavedSnap;
    }
    function studioUnitActivate(id) {
      if (!studioUnitArtboards) return;
      const a = studioUnitArtboards.filter((x) => x.id === id)[0];
      if (!a) return;
      studioUnitActiveId = id;
      editorState = a.state;
      studioFilmSizeIds = [editorState.sizeId];
      studioHistory = a.history;
      studioHistoryLabels = a.historyLabels;
      studioHistoryIndex = a.historyIndex;
      studioVersions = a.versions;
      studioLastSavedSnap = a.lastSavedSnap;
    }
    // A filmstrip tile click (an existing version, not the parent) —
    // the topbar lockup and studioTitle stay exactly as they are (the
    // unit's own id/size, per AM.7 "the lockup unchanged"); only the
    // stage, filmstrip, drawer, undo buttons and Versions rail follow
    // the newly-active artboard.
    function switchStudioUnitVersion(id) {
      if (id === studioUnitActiveId) return;
      studioUnitCaptureActive();
      studioUnitActivate(id);
      renderEditorStage(true);
      renderEditorFilmstrip();
      syncStudioPanel();
      refreshUndoRedoButtons();
      syncStudioSaveStatus();
      renderStudioVersionsRail();
    }
    // The next id this unit's "+" would mint — <parent>.<n>, n one
    // past the highest suffix any existing sibling already carries
    // (not just a count, so the scheme stays correct if a future
    // change ever lets a version be removed).
    // BB.2 — ids never come back within the session: a per-parent
    // high-water mark (raised on every mint and every delete, kept
    // across Studio open/close) so "+" after deleting A1.2 mints A1.3,
    // never a second A1.2 — the mark, then the highest live suffix,
    // whichever is greater.
    const studioVersionHighWater = {};
    function studioVersionSuffix(parentId, id) {
      if (String(id).indexOf(parentId + '.') !== 0) return 0;
      const num = parseInt(String(id).slice(parentId.length + 1), 10);
      return isNaN(num) ? 0 : num;
    }
    function studioRaiseVersionMark(parentId, id) {
      studioVersionHighWater[parentId] = Math.max(studioVersionHighWater[parentId] || 0, studioVersionSuffix(parentId, id));
    }
    function nextStudioVersionId() {
      if (!studioUnitArtboards || !studioUnitArtboards.length) return null;
      const parentId = studioUnitArtboards[0].id;
      let n = studioVersionHighWater[parentId] || 0;
      studioUnitArtboards.forEach((a) => { n = Math.max(n, studioVersionSuffix(parentId, a.id)); });
      return parentId + '.' + (n + 1);
    }
    // The filmstrip's "+" in UNIT mode (AM.7): duplicates whichever
    // artboard is CURRENTLY active (the parent, or another version —
    // "the current artboard", the designer's own words) as a new
    // sibling, selects it, gives it its own fresh undo boundary and a
    // "v1" version of its own. Edits from here on apply to it alone.
    function handleStudioAddVersion() {
      if (!studioUnitArtboards || !studioUnitArtboards.length) return;
      studioUnitCaptureActive();
      const fromId = studioUnitActiveId;
      const newId = nextStudioVersionId();
      studioRaiseVersionMark(studioUnitArtboards[0].id, newId); // BB.2 — a minted id is spent for the session
      const clonedState = JSON.parse(JSON.stringify(editorState));
      const snap = JSON.stringify({ editorState: clonedState, filmIds: [clonedState.sizeId], title: newId });
      studioUnitArtboards.push({
        id: newId,
        state: clonedState,
        history: [snap],
        historyLabels: ['Started'],
        historyIndex: 0,
        versions: [{ label: 'v1', snap: snap, savedAt: new Date(), desc: 'from ' + fromId }],
        lastSavedSnap: snap
      });
      studioUnitActivate(newId);
      renderEditorStage(true);
      renderEditorFilmstrip();
      syncStudioPanel();
      refreshUndoRedoButtons();
      syncStudioSaveStatus();
      renderStudioVersionsRail();
    }
    // Back/Escape (AK.3, via studioAutosaveOnExit): none of this
    // session's NEW versions ever reach the board (commit is false),
    // but nothing is silently lost either — each is folded into the
    // PARENT's own Versions rail as a save point of its own. Never
    // touches the parent's own lastSavedSnap (its dirty-check stays
    // about ITS OWN edits, independent of what a discarded version
    // held). Returns whether it folded anything — a no-op (false)
    // when no version was ever added, the ordinary AM.1 case.
    // BB.2 — one artboard's latest state, folded into the PARENT's own
    // versions as a save point of its own (described by `desc`), so it
    // can be brought back through the VERSIONS group like any save.
    function studioFoldVersionIntoParent(a, desc) {
      const parent = studioUnitArtboards[0];
      const snap = JSON.stringify({ editorState: a.state, filmIds: [a.state.sizeId], title: parent.id });
      parent.versions.push({ label: 'v' + (parent.versions.length + 1), snap: snap, savedAt: new Date(), desc: desc });
    }
    function studioFoldDiscardedUnitVersions() {
      if (!studioUnitArtboards || studioUnitArtboards.length < 2) return false;
      studioUnitCaptureActive();
      const parent = studioUnitArtboards[0];
      for (let i = 1; i < studioUnitArtboards.length; i++) studioFoldVersionIntoParent(studioUnitArtboards[i], studioUnitArtboards[i].id + ' (not applied)');
      studioUnitArtboards = [parent];
      studioUnitActivate(parent.id);
      return true;
    }
    // ═══ BB — Delete a version (Bryan, 9/15: "how would I delete a
    //     version like A1.1 for example"). Two doors, one act: the
    //     version tile's hover × and the ⋮ menu's "Delete A1.1" (while
    //     a version is active); ⌫/Delete on a focused tile, ⌘⌫ for the
    //     active one. Never the parent — A1 is the unit itself, and
    //     removing it is the card's own Remove on the sheet. Removes
    //     the artboard; if it was the active one the previous sibling
    //     takes the stage (the parent when it was first) with
    //     switchStudioUnitVersion's own beat. Nothing is silently
    //     lost: its latest state folds into the parent's versions as
    //     "A1.1 · deleted". One chat line, no confirm dialog. ═══
    function studioDeleteUnitVersion(id, opts) {
      if (!studioUnitArtboards || studioUnitArtboards.length < 2 || !id) return false;
      const parent = studioUnitArtboards[0];
      if (id === parent.id) return false;
      const idx = studioUnitArtboards.map((a) => a.id).indexOf(id);
      if (idx < 1) return false;
      studioUnitCaptureActive(); // the active artboard's live state lands on its record before anything is folded
      const a = studioUnitArtboards[idx];
      studioUnitArtboards.splice(idx, 1);
      studioFoldVersionIntoParent(a, a.id + ' · deleted');
      studioRaiseVersionMark(parent.id, a.id);
      if (id === studioUnitActiveId) {
        studioUnitActivate(studioUnitArtboards[idx - 1].id);
        renderEditorStage(true);
      }
      renderEditorFilmstrip();
      syncStudioPanel();
      refreshUndoRedoButtons();
      syncStudioSaveStatus();
      renderStudioVersionsRail();
      ptBot(escape(a.id) + ' deleted — its last state is in ' + escape(parent.id) + '’s versions.');
      if (opts && opts.focusStrip) { // a keyboard delete keeps the keyboard on the strip
        const strip = document.getElementById('ptEditorFilmstrip');
        const next = strip && strip.querySelector('.pt-editor-film-item.is-active');
        if (next) next.focus({ preventScroll: true });
      }
      return true;
    }
    // Apply to board (AM.7): the parent updates in place via the
    // existing per-card propagate path (closePainterEditor's own,
    // right after this runs — the live globals are pointed back at
    // the PARENT's own state first so that path writes the parent's
    // edits, never a version's); every OTHER artboard becomes a full
    // sibling unit card, inserted into the concept row right after the
    // parent, in the order they were created. A no-op when this
    // session never grew past the parent.
    function studioApplyUnitVersionsToBoard() {
      if (!studioUnitArtboards || studioUnitArtboards.length < 2) return;
      studioUnitCaptureActive();
      const parent = studioUnitArtboards[0];
      studioUnitActivate(parent.id); // closePainterEditor's propagate (right after this function returns) must write the PARENT's own state
      const parentCard = editorCardEl;
      const group = parentCard && parentCard.closest('.pt-concept-group');
      if (!group || !parentCard) return;
      const parentScoreChip = parentCard.querySelector('.pt-score-chip');
      const parentScoreTotal = parentScoreChip ? parseInt(parentScoreChip.getAttribute('data-total'), 10) : null;
      const sampleBanner = parentCard.querySelector('.pt-banner');
      const fallbackFont = sampleBanner ? (sampleBanner.getAttribute('data-font') || DEFAULT_FONT_ID) : DEFAULT_FONT_ID;
      let insertAfterEl = parentCard;
      const inserted = [];
      for (let i = 1; i < studioUnitArtboards.length; i++) {
        const a = studioUnitArtboards[i];
        const st = a.state;
        const copyPair = { headline: st.headline || COPY_PAIRS[0].headline, cta: st.cta || COPY_PAIRS[0].cta };
        if (st.subhead) copyPair.subhead = st.subhead;
        if (st.body) copyPair.body = st.body;
        if (st.disclaimer) copyPair.disclaimer = st.disclaimer;
        const customVals = (st.custom || []).filter((v) => v && v.trim());
        if (customVals.length) copyPair.custom = customVals;
        const img = { src: st.imageSrc || findFrame(GENERATE_IMAGE_ID).src };
        const wrap = document.createElement('div');
        wrap.innerHTML = bannerCardHTML(st.sizeId, st.layoutId, copyPair, img, a.id, st.colorway, st.font || fallbackFont, st.customColor, null, parentScoreTotal).trim();
        const cardEl = wrap.firstChild;
        const vBanner = cardEl.querySelector('.pt-banner');
        if (vBanner) writeBannerOffsets(vBanner, st.offsets || {}); // BA.2 — a version's moves land on its own card (bannerCardHTML itself knows nothing of offsets)
        cardEl.classList.add('pt-unit-enter');
        insertAfterEl.insertAdjacentElement('afterend', cardEl);
        insertAfterEl = cardEl;
        inserted.push({ id: a.id, unitId: cardEl.getAttribute('data-unit-id') });
      }
      syncScoreChips(group);
      syncRemoveButtons(group);
      const conceptsEl = document.getElementById('ptConcepts');
      if (conceptsEl) mountSelectButtons(conceptsEl);
      scheduleFitAllBannerScales();
      syncSelectionUI();
      if (inserted.length === 1) {
        ptBot('<button class="pt-msg-board-link" type="button" data-pt-unit-jump="' + inserted[0].unitId + '">' + escape(inserted[0].id) + '</button> is on the board.');
      } else if (inserted.length > 1) {
        ptBot(inserted.map((x) => escape(x.id)).join(', ') + ' are on the board.');
      }
    }
    function exitStudioUnitMode(commit) {
      if (commit) {
        studioApplyUnitVersionsToBoard(); // AM.7 — every new version becomes its own card, right after the parent's, before the parent's own propagate below
        closePainterEditor(true);
        renderBoardsRail(); // AL.5/AL.17's own builder reads the live DOM, which the propagate above just changed
      } else {
        studioAutosaveOnExit();
        closePainterEditor(false);
      }
      studioUnitArtboards = null; // AM.7 — this session's versions are either on the board now or folded into the parent's own Versions rail; nothing left to track
      studioUnitActiveId = null;
      const editorEl = document.getElementById('ptEditor');
      if (editorEl) editorEl.classList.remove('pt-editor-studio', 'pt-editor-unit-mode');
      teardownStudioPanel(true);
      inStudio = false;
      studioUnitMode = false;
      syncMediaTopbar();
      // The hat still holds the settings surface behind the unit editor
      // (a resolved session never drops it, AL.6/9-10) — the same beat
      // exitStudioToDefault takes above when a board is up, minus its
      // "nothing to go back to" fallback, which can't apply here: a
      // unit can only be opened FROM a board that is, by definition,
      // still on the sheet underneath.
      if (sessionExists() && auxPanel && auxPanel.classList.contains('pt-wizard-active')) {
        closeMediaMode();
        flowRunning = true;
        wizardStep = -1;
        renderForkStep();
      }
    }

    // "Add to canvas" — the banner lands on the canvas as a single-
    // concept sheet (concept A, the sizes in the filmstrip) via the
    // existing bannerCardHTML/sheet builder; is-painter-resolved
    // fires, media mode closes, the ONE allowed chat line posts. Same
    // structure/timing as finishGenerate() (P1's own Generate) so the
    // two paths end identically.
    function handleStudioAddToCanvas() {
      const sizeIds = studioFilmSizeIds.slice();
      const layoutId = editorState.layoutId;
      const colorway = editorState.colorway;
      const font = editorState.font;
      const copyPair = {
        headline: editorState.headline || COPY_PAIRS[0].headline,
        cta: editorState.cta || COPY_PAIRS[0].cta
      };
      // P8 — Add to canvas carries every field the Text drawer set:
      // one state, every landed size.
      if (editorState.subhead) copyPair.subhead = editorState.subhead;
      if (editorState.body) copyPair.body = editorState.body;
      if (editorState.disclaimer) copyPair.disclaimer = editorState.disclaimer;
      const customVals = (editorState.custom || []).filter((v) => v && v.trim());
      if (customVals.length) copyPair.custom = customVals;
      const img = { src: editorState.imageSrc || findFrame(GENERATE_IMAGE_ID).src };
      const container = document.getElementById('ptConcepts');
      if (container) {
        container.innerHTML = '';
        assets.images = {}; assets.lines = {}; // §BR.1 — this path replaces the whole canvas outright (no board-history bank, unlike buildConceptSheetDOM) so the old board's references are moot
        conceptGhostPending = false;
        const group = document.createElement('div');
        group.className = 'pt-concept-group';
        /* 9/16 (Bryan, on a Studio banner landing on the board: "it
           sort of bonked the experience") — the row wears the BOARD's
           own head, the same one buildConceptSheetDOM builds (the
           "Concept A" eyebrow with its selected/meta slots), not the
           retired letter-disc + "Layout · headline" line this path
           alone still carried: a board built here must read like any
           other board. */
        group.setAttribute('data-concept', 'A');
        group.innerHTML =
          '<div class="pt-concept-head pt-concept-row-head">' +
            /* §BO.4/.5 — the "Concept A" eyebrow and the drag-select
               hint both retire; the row head stays for its spacing. */
            '<span class="pt-concept-selected" data-concept-selected></span>' +
            '<span class="pt-concept-meta" data-concept-meta></span>' +
          '</div>' +
          shapeGridHTML(sizeIds, layoutId, copyPair, img, 'A', colorway, font, editorState.customColor);
        container.appendChild(group);
        // §BR.1 — one shared content set landing at every studio-picked
        // size (not a pool dealt across many units, applyBannerCopyOverrides'
        // own case), so it registers directly: one image/headline/cta
        // (and legal, only where a disclaimer slot actually exists —
        // this path only ever creates one when editorState.disclaimer
        // was set, unlike the generate path's always-present slot),
        // referenced by every size produced here.
        const addImgId = registerImageAsset(img.src);
        const addHeadlineId = registerLineAsset('headline', 'studio', copyPair.headline);
        const addCtaId = registerLineAsset('cta', 'studio', copyPair.cta);
        Array.prototype.forEach.call(group.querySelectorAll('.pt-banner'), (b) => {
          b.setAttribute('data-image-ref', addImgId);
          b.setAttribute('data-headline-id', addHeadlineId);
          b.setAttribute('data-cta-id', addCtaId);
          const discl = b.querySelector('.pt-banner-disclaimer');
          if (discl) b.setAttribute('data-legal-id', registerLineAsset('legal', 'studio', copyPair.disclaimer || ''));
        });
        Array.prototype.forEach.call(group.querySelectorAll('.pt-banner'), (b) => writeBannerOffsets(b, editorState.offsets || {})); // BA.2 — each landed size takes its own moves; a size never moved starts at home
        Array.prototype.forEach.call(group.querySelectorAll('.pt-banner-frame'), (frame, fi) => { frame.style.animationDelay = (fi * 70) + 'ms'; });
        syncAddSizesChip(group);
        syncRemoveButtons(group);
        syncScoreChips(container);
        syncConceptGhostTile();
        syncPackageButton(); // §BO.2 — a board now exists (Studio's own "Add to canvas"); Package/Export follow it
      }
      state.images = [img];
      state.copy = { mode: 'own', pairs: [copyPair] };
      state.layout = layoutId;
      state.sizes = sizeIds;
      document.body.classList.add('is-painter-resolved');
      sheetResolved = true;
      closePainterEditor(false);
      const editorEl = document.getElementById('ptEditor');
      if (editorEl) editorEl.classList.remove('pt-editor-studio');
      teardownStudioPanel(true);
      inStudio = false;
      syncMediaTopbar(); // Y — back from Studio; the bar returns (pt-wizard-active never left)
      closeMediaMode();
      flowRunning = false;
      wizardStep = -1;
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) canvasEl.scrollTop = 0;
      scheduleFitAllBannerScales();
      ptBot('Done — your banner is on the canvas.');
      setTimeout(settleHatAfterGenerate, 500); // 9/10 — the settings come back, not the default hat
    }

    // ═══ AK.6 — plus-ups: Adapt to all sizes, Save as template, and
    //     Duplicate size, all reachable from the ⋯ overflow AND (for
    //     the two size beats) the keyboard layer. ═══
    const AK_SHIP_SIZES = ['300x250', '728x90', '160x600', '320x50', '300x600'];
    // ⌘D / overflow — "copies the current artboard into the strip":
    // this banner's ONE content set already renders at every size in
    // the filmstrip (buildStageBannerElForSize reads the shared
    // editorState), so duplicating it onto the strip is exactly
    // handleStudioAddSize with the next size not already there — the
    // same door the filmstrip's own "+" tile already opens.
    function handleStudioDuplicateSize() {
      if (!inStudio || !editorState) return;
      const missing = SIZES.filter(s => studioFilmSizeIds.indexOf(s.id) === -1);
      if (!missing.length) { ptBot('Every size is already on this banner’s strip.'); return; }
      handleStudioAddSize(missing[0].id);
    }
    function handleStudioAdaptAllSizes() {
      if (!inStudio || !editorState) return;
      const before = studioFilmSizeIds.length;
      AK_SHIP_SIZES.forEach((id) => { if (studioFilmSizeIds.indexOf(id) === -1) studioFilmSizeIds.push(id); });
      if (studioFilmSizeIds.length === before) { ptBot('Every ship size is already on this banner’s strip.'); return; }
      renderEditorFilmstrip();
      pushStudioHistory('Adapt to all sizes');
    }
    function handleStudioCopyAsPngStub() {
      const btn = document.getElementById('ptEditorOverflowBtn');
      if (btn) { btn.classList.add('is-copied'); clearTimeout(btn._revertTimer); btn._revertTimer = setTimeout(() => btn.classList.remove('is-copied'), 2200); }
      ptBot('Copy as PNG isn’t wired into this prototype — it would export the current artboard as a flat PNG at its native size.');
    }
    // AM.1 — unit mode's own overflow addition: saves the unit's
    // CURRENT state as its own Studio banner in Your Gallery (the same
    // save path Save/⌘S already uses — studioSaveVersion mirrors every
    // save into studioSavedBanners) while leaving the board's own card
    // exactly as it was, since this never calls closePainterEditor(true).
    function handleStudioSaveAsNewBanner() {
      if (!inStudio || !editorState) return;
      const v = studioSaveVersion();
      if (!v) return;
      const node = ptBot(escape(studioTitle) + ' saved to <button type="button" class="pt-chat-link" id="ptStudioSaveAsNewLink">Your Gallery</button> as a new banner — the board is untouched.');
      const link = node && node.querySelector('#ptStudioSaveAsNewLink');
      if (link) link.addEventListener('click', () => { openEnvOverlay(function () {}); });
    }
    // §BZ — "Save as template" retires from the overflow (matching
    // §BO.7's own retirement of it off the select kebab); its popover
    // (name field + hint + Save) goes with it — the overflow's own row
    // was its only door in.
    // The ⋯ overflow itself — Duplicate size · Adapt to all sizes ·
    // Copy as PNG (AK.1's order, minus the retired template row); unit
    // mode (AM.1) gains a "Save as new banner" row, and an active
    // version (BB.1(b)) gains a trailing, hairline-separated "Delete
    // <version>" row. §BZ (Bryan, 9/21) — this used to be its own
    // pick-row recipe (Fira Code labels, radio circles implying a
    // one-of-many choice these actions never were, truncated grey
    // sub-labels) that read as net-new next to the rest of the shell.
    // It now renders through the exact same component as the sheet's
    // unit kebab menu (SELECT_MENU_ITEMS / .pt-select-menu-item in
    // 17-sheet-b-sizes.js's openSelectMenu) — plain text rows, no
    // leading icon and no trailing hint because that shared component
    // has neither — so the two kebabs are the same control, not two
    // that happen to look alike.
    function openStudioOverflowMenu(btn) {
      const menu = el('<div class="pt-set-menu pt-select-menu" role="menu" aria-hidden="true"></div>');
      // BB.1(b) — while the ACTIVE artboard is a version, "Delete A1.1"
      // is the last row, hairline-separated and in the house's quiet
      // destructive red (no icon, no dialog — the row is plain, same
      // as every other row here); absent on the parent.
      const activeVersionId = (studioUnitMode && studioUnitArtboards && studioUnitArtboards.length > 1 && studioUnitActiveId !== studioUnitArtboards[0].id) ? studioUnitActiveId : null;
      menu.innerHTML =
        '<button class="pt-select-menu-item" type="button" role="menuitem" data-studio-menu="duplicate">Duplicate size</button>' +
        '<button class="pt-select-menu-item" type="button" role="menuitem" data-studio-menu="adapt">Adapt to all sizes</button>' +
        '<button class="pt-select-menu-item" type="button" role="menuitem" data-studio-menu="png">Copy as PNG</button>' +
        (studioUnitMode ? '<button class="pt-select-menu-item" type="button" role="menuitem" data-studio-menu="savebanner">Save as new banner</button>' : '') +
        (activeVersionId ?
          '<div class="pt-select-menu-divider" role="separator"></div>' +
          '<button class="pt-select-menu-item pt-select-menu-item--danger" type="button" role="menuitem" data-studio-menu="delete">Delete ' + escape(activeVersionId) + '</button>'
        : '');
      menu.addEventListener('click', (e) => {
        const hit = e.target.closest('[data-studio-menu]');
        if (!hit) return;
        const action = hit.dataset.studioMenu;
        closeSetMenu();
        if (action === 'duplicate') handleStudioDuplicateSize();
        else if (action === 'adapt') handleStudioAdaptAllSizes();
        else if (action === 'png') handleStudioCopyAsPngStub();
        else if (action === 'savebanner') handleStudioSaveAsNewBanner();
        else if (action === 'delete') studioDeleteUnitVersion(activeVersionId);
      });
      openSetMenu(btn, menu);
    }

    /* opts.sizeId  — render the stage at a size other than the card's
                      own, for the Preview Sizes door: you clicked a
                      728x90 tile, so that is what opens.
       opts.card    — the real card to commit to when the thing clicked
                      is not one (a preview tile is a throwaway clone).
       opts.returnTo— a select card to reopen the size preview against
                      on Back, so the door you came through is the one
                      you go back out of. */
    function openPainterEditor(frameEl, opts) {
      opts = opts || {};
      const card = opts.card || (frameEl && frameEl.closest('.pt-banner-card'));
      if (!card) return;
      /* A select sits in no concept group. It used to be a hard
         requirement here, which is why editing one had to bounce to
         its source; the group is only read for the row letter and the
         (Studio-only) size filmstrip, so a select simply borrows the
         letter from the concept it points at. */
      const group = card.closest('.pt-concept-group');
      const sourceCard = card.dataset.selectId && !group
        ? document.querySelector('#ptConcepts .pt-banner-card[data-select-id="' + card.dataset.selectId + '"]')
        : null;
      const banner = card.querySelector('.pt-banner');
      if (!banner) return;
      const letter = conceptLetterOf(group || (sourceCard && sourceCard.closest('.pt-concept-group')) || card);
      // AM.1 — the filmstrip now runs "as Studio" too (studioFilmSizeIds,
      // seeded below to this unit's own size alone), the same branch a
      // select already took here (no group to read siblings off of) —
      // so this stays null even though a real .pt-concept-group exists;
      // editorCardEl alone is what Back/Apply commit to.
      editorGroupEl = null;
      editorCardEl = card;
      editorReturnTo = opts.returnTo || null;
      // 9/10 — the unit's variant rides the topbar next to Back; AM.1
      // reuses it as Studio's own unit-mode lockup text ("A1 · Board 1")
      // and as studioTitle, which the hat row's voice already reads.
      const unitVarSrc = (sourceCard || card).querySelector('.pt-unit-var');
      const unitVar = unitVarSrc ? unitVarSrc.textContent.trim() : letter;
      // P8 — order reflects whichever optional fields the live card
      // actually carries (custom fields aren't rendered on the banner,
      // so they can't be recovered here — they reset to none, same as
      // any other reopen-from-DOM read on this editor).
      const copyFields = readBannerCopyFields(banner);
      const order = ['headline'];
      if (copyFields.subhead) order.push('subhead');
      if (copyFields.body) order.push('body');
      order.push('cta');
      if (copyFields.disclaimer) order.push('disclaimer');
      editorState = {
        concept: letter,
        sizeId: opts.sizeId || banner.getAttribute('data-size'),
        layoutId: banner.getAttribute('data-layout') || 'type-top',
        colorway: banner.getAttribute('data-colorway') || 'gold-on-dark',
        headline: banner.querySelector('.pt-banner-headline').textContent.trim(),
        cta: banner.querySelector('.pt-banner-cta').textContent.trim(),
        subhead: copyFields.subhead || '',
        body: copyFields.body || '',
        disclaimer: copyFields.disclaimer || '',
        custom: [],
        order: order,
        imageSrc: banner.querySelector('.pt-banner-media img, .pt-banner-media video').getAttribute('src'),
        // Reopening a re-framed card reads its crops back, the same
        // reopen-from-DOM read colorway and font already do.
        framings: seedBannerFramings(banner),
        // §BR.2 — every ratio seedBannerFramings just handed back is,
        // by construction, this unit's OWN answer (either a real
        // data-framings override, or a pre-store triple that already
        // differed from the shared/default baseline) — so it opens
        // already scoped as "Just this one" for those shapes, exactly
        // as a re-opened override should read.
        frameOverrideRatios: {},
        // Ratios explicitly dropped THIS session (Reset/Rejoin) — see
        // handleFrameRejoin's own comment for why this can't just be
        // "absent from framings" (the commit needs to tell "never
        // touched" apart from "touched, then explicitly let go").
        frameRejoined: {},
        offsets: readBannerOffsets(banner), // BA.2 — a moved card reads its positions back (data-offsets, keyed by size)
        // The size the stage is CURRENTLY showing, which the stepper
        // moves independently of the card's real size.
        cardSizeId: banner.getAttribute('data-size'),
        font: banner.getAttribute('data-font') || DEFAULT_FONT_ID,
        // P9 — reopening a custom-colored card reads its own inline
        // vars back so the Fine-tune strips reflect what's really on
        // the stage, not a re-seeded default.
        customColor: banner.getAttribute('data-colorway') === 'custom' ? readBannerCustomColor(banner) : null,
        // §BR.3 — the line ids this unit references right now; the
        // reach line and the Apply/Back fan-out both key off these,
        // never off the text itself (a card can be reopened after some
        // OTHER unit has since changed the shared text).
        headlineId: banner.getAttribute('data-headline-id'),
        ctaId: banner.getAttribute('data-cta-id'),
        legalId: banner.getAttribute('data-legal-id'),
        copyOverrideRoles: {}, copyTouched: {}, copyRejoined: {},
        // §BR.4 — a reopened card reads its own per-field-per-ratio
        // size overrides back, same "seed the session's own working
        // map from the unit's persisted one" idiom framings/copy above
        // already use.
        lineFit: readBannerLineFit(banner), fitOverrideRoles: {}, fitRejoined: {}, fitTouched: {}
      };
      // §BR.2 — see the frameOverrideRatios comment above: every key
      // seedBannerFramings already decided was this unit's own gets
      // marked scoped-to-this-unit from the moment Studio opens.
      Object.keys(editorState.framings).forEach((k) => { editorState.frameOverrideRatios[k] = true; });
      // §BR.3 — same idea for copy: a role already carrying its own
      // per-unit override (data-copy-overrides, from an earlier "Just
      // this one") opens already scoped that way rather than reading
      // as untouched.
      Object.keys(readBannerCopyOverrides(banner)).forEach((k) => { editorState.copyOverrideRoles[k] = true; });
      // §BR.4 — every fitKey already in this unit's own data-line-fit
      // is, by construction, its own answer — opens scoped "Just this
      // one" for those, same reasoning as the two blocks above.
      Object.keys(editorState.lineFit).forEach((k) => { editorState.fitOverrideRoles[k] = true; });
      const editorEl = document.getElementById('ptEditor');
      if (!editorEl) return;
      // AM.1 — "this thing and studio should be the same thing": the
      // banner click now opens STUDIO ITSELF, seeded from this unit, in
      // UNIT mode — the same rail/drawers/zoom/filmstrip/undo/Brand as
      // Studio-from-hat (openStudio), a different topbar lockup, hat-row
      // voice and primary action. studioUnitMode carries the distinction
      // (editorCardEl alone doesn't — the Preview Sizes door's throwaway
      // clones set that too, without wanting any of the rest of this).
      inStudio = true;
      studioUnitMode = true;
      editorEl.classList.add('pt-editor-studio', 'pt-editor-unit-mode');
      const boardNow = boards[boardCur];
      const unitEl = document.getElementById('ptEditorUnitVar');
      if (unitEl) unitEl.textContent = unitVar + (boardNow ? ' · ' + boardNow.name : ''); // AR.2 — "A1 · Coast Road"
      studioTitle = unitVar; // the hat row's "Studio · A1 · …" / "Describe a change to A1 …" (AM.1); the topbar shows the id chip instead (CSS, .pt-editor-unit-mode)
      studioFilmSizeIds = [editorState.sizeId];
      renderEditorStage();
      renderEditorFilmstrip();
      editorEl.setAttribute('data-visible', '1');
      editorEl.setAttribute('aria-hidden', 'false');
      // A resolved session keeps the hat on its settings surface behind
      // the sheet (AL.6/9-10's own "banner UI, not the default hat"
      // rule) — belt and braces so the Studio hat row it's about to get
      // is actually visible (.pt-hat-wizard is display:none without it).
      if (auxPanel) auxPanel.classList.add('pt-wizard-active');
      if (hatWizard) hatWizard.setAttribute('aria-hidden', 'false');
      flowRunning = true;
      renderStudioHatRow();
      if (auxPanel) auxPanel.classList.remove('pt-settings-step');
      setAuxTitle(AUX_TITLE_MEDIA);
      const addBtn = document.getElementById('ptEditorAddToCanvasBtn');
      if (addBtn) addBtn.textContent = 'Apply to board';
      renderStudioPanel(); // AY — the one panel, every group painted on the open beat
      studioZoom = null; // AK.1 — every open starts at Fit
      resetStudioUndoStack(); // fresh undo boundary at the unit's as-opened state
      // "v1 = as generated" (AM.1) — a LOCAL version marker for this
      // editing session, not a Your Gallery entry (studioSaveVersion()
      // would mirror one in there); Save/⌘S and the ⋯ overflow's own
      // "Save as new banner" still create real saves from here exactly
      // as Studio always has.
      const seedSnap = studioSnapshot();
      studioVersions = [{ label: 'v1', snap: seedSnap, savedAt: new Date(), desc: 'as generated' }];
      studioLastSavedSnap = seedSnap;
      studioBannerRecordId = null;
      // AM.7 — this unit's own artboards list starts back at exactly
      // one (the parent, as just opened); the filmstrip's "+" grows it.
      studioUnitArtboards = [{
        id: unitVar, state: editorState, history: studioHistory, historyLabels: studioHistoryLabels,
        historyIndex: studioHistoryIndex, versions: studioVersions, lastSavedSnap: studioLastSavedSnap
      }];
      studioUnitActiveId = unitVar;
      // The EARLIER renderEditorFilmstrip() call above ran before
      // studioUnitArtboards existed (studioUnitMode was already true,
      // so it took this function's branch and found nothing to draw)
      // — now that the list is real, repaint it for real.
      renderEditorFilmstrip();
      syncStudioSaveStatus();
      renderStudioVersionsRail();
      syncMediaTopbar();
    }

    /* Editing a SELECT writes to that select. Whether it also writes
       back to the concept it points at is exactly what the lock is
       for: an unlocked select is a live mirror of its source — leaving
       the source behind would mean the next refreshUnlockedSelects()
       silently threw the edit away — while a locked one is a decision
       held apart on purpose, so it keeps the change to itself. */
    function mirrorSelectEditToSource(card, ed) {
      if (!card || !card.classList.contains('pt-select-card')) return;
      if (card.classList.contains('is-locked')) return;
      if (card.hasAttribute('data-select-standalone')) return; // no source to reach
      const src = document.querySelector('#ptConcepts .pt-banner-card[data-select-id="' + card.dataset.selectId + '"]');
      if (src) propagateEditsToGroup(src, ed);
    }

    function closePainterEditor(commit) {
      const editorEl = document.getElementById('ptEditor');
      if (!editorEl) return;
      const returnTo = editorReturnTo;
      if (commit !== false && editorState && (editorCardEl || editorGroupEl)) {
        propagateEditsToGroup(editorCardEl || editorGroupEl, editorState);
        mirrorSelectEditToSource(editorCardEl, editorState);
      }
      editorEl.setAttribute('data-visible', '0');
      editorEl.setAttribute('aria-hidden', 'true');
      editorGroupEl = null;
      editorCardEl = null;
      editorReturnTo = null;
      editorState = null;
      syncMediaTopbar(); // Y — belt and braces; exitStudioToDefault already covers the Studio path
      // Came in through the size preview — go back out through it, so
      // the edit is visible at every placement straight away.
      if (returnTo && returnTo.isConnected) setTimeout(() => openProductionPreview(returnTo), 220);
    }

    function initPainterEditor() {
      const conceptsEl = document.getElementById('ptConcepts');
      if (conceptsEl) {
        conceptsEl.addEventListener('click', (e) => {
          if (document.body.classList.contains('is-painter-shared')) return; // read-only — editor disabled
          if (e.target.closest('.pt-banner-card-head')) return; // head chrome has its own handlers
          const frame = e.target.closest('.pt-banner-frame');
          if (!frame) return;
          // AQ.4 amendment (the designer, 9/15): the pencil in the card's
          // action cluster is THE door to the editor (initUnitEditButtons)
          // — a click on the banner itself only focuses the card (which
          // reveals its chrome) and never toggles its selection.
          const card = frame.closest('.pt-banner-card');
          if (card && typeof card.focus === 'function') card.focus({ preventScroll: true });
        });
      }
      const backBtn = document.getElementById('ptEditorBack');
      if (backBtn) backBtn.addEventListener('click', () => {
        if (inStudio && studioUnitMode) { exitStudioUnitMode(false); return; } // AM.1 — back to the board, no apply
        if (inStudio) { exitStudioToDefault(); return; }
        closePainterEditor(true);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !editorState) return;
        if (inStudio) return; // Studio's own Escape routing (drawer close, then exit) handles this
        const editorEl = document.getElementById('ptEditor');
        if (editorEl && editorEl.getAttribute('data-visible') === '1') closePainterEditor(true);
      });
      // P6/AK.6/AY/BD.1/§BQ — Studio-only keyboard: 1-4 land on the
      // panel's groups (Size · Style · Image · Versions — the rail's
      // tools they used to pick are gone), ⌘Z / ⇧⌘Z undo/redo (kept),
      // ⌘S save, ⌘D duplicate
      // size, ⌘= / ⌘− / ⌘0 / ⌘1 zoom in / out / fit / 100%. All skip
      // while a text field is actively being typed into
      // (contenteditable="true" copy, or a focused <input>/<textarea>)
      // so native text editing/undo isn't stolen.
      document.addEventListener('keydown', (e) => {
        if (!inStudio) return;
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true');
        if (isTyping) return;
        // BA.4 — a selected part nudges by the arrows: 1px, ⇧ 10px (a
        // burst within 400ms collapses to one history step — stageMoveNudge).
        if (!e.metaKey && !e.ctrlKey && !e.altKey && /^Arrow(Left|Right|Up|Down)$/.test(e.key) && stageMoveHasSelection()) {
          const step = e.shiftKey ? 10 : 1;
          e.preventDefault();
          stageMoveNudge(e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0);
          return;
        }
        if (!e.metaKey && !e.ctrlKey && /^[1-4]$/.test(e.key)) {
          const group = PT_STUDIO_PANEL_GROUPS[Number(e.key) - 1];
          if (!group) return;
          e.preventDefault();
          studioPanelGoTo(group.id);
          return;
        }
        if (!(e.metaKey || e.ctrlKey)) return;
        const key = e.key.toLowerCase();
        if (key === 'z') { e.preventDefault(); if (e.shiftKey) studioRedo(); else studioUndo(); return; }
        if (e.key === 'Backspace' || e.key === 'Delete') { // BB.3 — ⌘⌫ deletes the ACTIVE version (never the parent; the typing guard above keeps it off a text field)
          if (studioUnitMode) { e.preventDefault(); studioDeleteUnitVersion(studioUnitActiveId, { focusStrip: true }); }
          return;
        }
        if (key === 's') { e.preventDefault(); handleStudioSave(); return; }
        if (key === 'd') { e.preventDefault(); handleStudioDuplicateSize(); return; }
        if (e.key === '=' || e.key === '+') { e.preventDefault(); studioZoomBy(AK_ZOOM_STEP); return; }
        if (e.key === '-' || e.key === '_') { e.preventDefault(); studioZoomBy(-AK_ZOOM_STEP); return; }
        if (e.key === '0') { e.preventDefault(); studioZoomToFit(); return; }
        if (e.key === '1') { e.preventDefault(); studioZoomTo100(); return; }
      });
      let editorResizeTimer = null;
      window.addEventListener('resize', () => {
        if (!editorState) return;
        clearTimeout(editorResizeTimer);
        editorResizeTimer = setTimeout(() => {
          const wrap = document.querySelector('#ptEditorStage .pt-editor-stage-frame');
          if (!wrap || !editorState) return;
          const parts = editorState.sizeId.split('x');
          fitEditorStage(wrap, parseInt(parts[0], 10), parseInt(parts[1], 10));
          // P10b — the stage column's width tracks the viewport too;
          // re-measure the film-accent against the active card's rect
          // at the new width. Asks for an instant snap, but while
          // body.resizing is set (the app's own "BREAKPOINT EASING"
          // system, ~480ms after the last resize event) that class's
          // `!important` transition-property list — it includes
          // `transform` — outranks this element's own inline
          // `transition:none`, so the accent actually glides into
          // place over that window instead of snapping. That's fine:
          // it still lands on the exact same correct target, just in
          // step with every other layout-affecting property easing
          // through the same resize gesture instead of jump-cutting
          // alone.
          if (inStudio) moveFilmAccent(true);
        }, 120);
      }, { passive: true });
      wireStudioTitleEditable();
      wireCopyFitControl(); // §BR.4 — the stage's own size control/Fit link, static markup wired once
      const addToCanvasBtn = document.getElementById('ptEditorAddToCanvasBtn');
      // AM.1 — one button, two primaries: "Apply to board" commits the
      // open unit back to its card; "Add to board" (Studio-from-hat,
      // unchanged) lands a brand-new banner on the canvas.
      if (addToCanvasBtn) addToCanvasBtn.addEventListener('click', () => {
        if (studioUnitMode) { exitStudioUnitMode(true); return; }
        handleStudioAddToCanvas();
      });
      // P6 — topbar Undo/Redo + the stage's own zoom cluster.
      const undoBtn = document.getElementById('ptEditorUndoBtn');
      const redoBtn = document.getElementById('ptEditorRedoBtn');
      if (undoBtn) { undoBtn.innerHTML = ICONS.undo; undoBtn.addEventListener('click', studioUndo); }
      if (redoBtn) { redoBtn.innerHTML = ICONS.redo; redoBtn.addEventListener('click', studioRedo); }
      const zoomOutBtn = document.getElementById('ptEditorZoomOutBtn');
      const zoomInBtn = document.getElementById('ptEditorZoomInBtn');
      if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => studioZoomBy(-AK_ZOOM_STEP));
      if (zoomInBtn) zoomInBtn.addEventListener('click', () => studioZoomBy(AK_ZOOM_STEP));
      const fitBtn = document.getElementById('ptEditorFitBtn');
      if (fitBtn) fitBtn.addEventListener('click', studioZoomToFit);
      const zoom100Btn = document.getElementById('ptEditor100Btn');
      if (zoom100Btn) zoom100Btn.addEventListener('click', studioZoomTo100);
      // AK.1/AK.6 — the rest of the topbar's chrome: Save, ⋯ overflow,
      // Brand/Legal (a live summary, not a dead readout — each opens
      // the check list as a popover now that the Brand drawer is gone,
      // AY.2).
      const saveBtn = document.getElementById('ptEditorSaveBtn');
      if (saveBtn) saveBtn.addEventListener('click', handleStudioSave);
      const overflowBtn = document.getElementById('ptEditorOverflowBtn');
      if (overflowBtn) overflowBtn.addEventListener('click', (e) => { e.stopPropagation(); openStudioOverflowMenu(overflowBtn); });
      const brandChip = document.getElementById('ptEditorBrandChip');
      const legalChip = document.getElementById('ptEditorLegalChip');
      if (brandChip) brandChip.addEventListener('click', (e) => { e.stopPropagation(); openStudioChecksPopover(brandChip); });
      if (legalChip) legalChip.addEventListener('click', (e) => { e.stopPropagation(); openStudioChecksPopover(legalChip); });
    }

    // ── Style-guide popover (independent of the flow) ──
    function initStyleGuidePopover() {
      const btn = document.getElementById('ptStyleguideBtn');
      const pop = document.getElementById('ptStyleguidePop');
      if (!btn || !pop) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !pop.classList.contains('is-open');
        closeAllPtSheetPopovers();
        if (willOpen) { pop.classList.add('is-open'); pop.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); }
      });
    }

    // Z.2.1 — shared by both ways a plan arrives: the ?state=plan deep
    // link below, and a live composer send once a Media-plan
    // attachment is taken (window._ptResolveMediaPlanArrival, called
    // from send() in the outer chat closure — the same cross-closure
    // seam window._ptMediaSettingsSubmit already uses). Only sets the
    // plan (if it isn't already), resyncs Selects, and posts the
    // assistant's one line; a deep link's own extra stage-setting (a
    // second board, three pre-filled selects) happens around this
    // call, not inside it — the live path has no such board to draw
    // from and doesn't need one (the model holds with zero selects).
    function resolveMediaPlanArrival() {
      if (!mediaPlan) mediaPlan = clonePlanFixture();
      syncPackageButton(); // §BO.2 — Package (not the retired Selects section) reads the plan now
      ptBot(
        '<button class="pt-msg-board-link" type="button" data-pt-nav-jump="concept">' +
          'Plan received — ' + planTotalSpaces(mediaPlan) + ' spaces across ' + mediaPlan.spaces.length + ' sizes.' +
        '</button>'
      );
    }
    window._ptResolveMediaPlanArrival = resolveMediaPlanArrival;
    // BA/BB QA hook (13-*'s _ptImageryDebug convention: read-only, a
    // fresh plain object per call, never a live reference) — the Verify
    // blocks assert editorState.offsets, the unit's artboard list and
    // the history labels, all closure-private.
    window._ptStudioDebug = function () {
      return {
        inStudio: inStudio, unitMode: studioUnitMode,
        sizeId: editorState ? editorState.sizeId : null, layoutId: editorState ? editorState.layoutId : null,
        offsets: editorState ? JSON.parse(JSON.stringify(editorState.offsets || {})) : null,
        // §BR.2 — the in-session crop state: framings is this unit's
        // pending/own answers per ratio, frameOverrideRatios names
        // which of those are scoped "Just this one" rather than the
        // shared/campaign-level crop (assets.images[src].framings,
        // _ptAssetsDebug's own read).
        framings: editorState ? JSON.parse(JSON.stringify(editorState.framings || {})) : null,
        frameOverrideRatios: editorState ? JSON.parse(JSON.stringify(editorState.frameOverrideRatios || {})) : null,
        imageSrc: editorState ? editorState.imageSrc : null,
        // §BR.3/§BR.4, merged — the copy analogue: this unit's
        // referenced line ids, which fields are scoped "Just this one"
        // this session (text and/or size), and the ONE merged reach
        // line's own current text (a probe reads the DOM directly
        // rather than re-deriving it, same "assert what's rendered"
        // spirit as the rest of this hook).
        headlineId: editorState ? editorState.headlineId : null,
        ctaId: editorState ? editorState.ctaId : null,
        legalId: editorState ? editorState.legalId : null,
        copyOverrideRoles: editorState ? JSON.parse(JSON.stringify(editorState.copyOverrideRoles || {})) : null,
        fitOverrideRoles: editorState ? JSON.parse(JSON.stringify(editorState.fitOverrideRoles || {})) : null,
        lineFit: editorState ? JSON.parse(JSON.stringify(editorState.lineFit || {})) : null,
        copyReachRole: copyReachRole,
        copyReachText: (document.getElementById('ptCopyFitReachText') || {}).textContent || '',
        unitIds: studioUnitArtboards ? studioUnitArtboards.map((a) => a.id) : null, activeId: studioUnitActiveId,
        historyLabels: studioHistoryLabels.slice(), historyIndex: studioHistoryIndex,
        versions: studioVersions.map((v) => ({ label: v.label, desc: v.desc || '' })),
        move: stageMove ? { hover: stageMove.hover, sel: stageMove.sel, dragging: !!stageMove.drag } : null
      };
    };

    // ── ?state=sheet — QA deep link: skip the flow, land the resolved
    //    sheet directly with deterministic picks + a condensed replay
    //    of the conversation that would have produced it. ?state=
    //    editor does the same, then opens Studio in unit mode (AM.1) on
    //    A1. ?state=scored lands with every score chip already
    //    settled. ?state=overnight lands scored PLUS a 5-banner
    //    "Made overnight" batch, as if Automate had already run.
    //    ?state=motion lands the resolved sheet with the P4 motion
    //    teaser already open on concept A. ?state=plan lands it with
    //    a media plan attached — Selects becomes the plan's own list
    //    of spaces (§Z.2) — every deep link named in PLAN.md's state
    //    map. ──
    function applyDeepLink() {
      let params;
      try { params = new URLSearchParams(location.search); } catch (e) { return false; }
      const wantState = params.get('state');
      // ?state=media-mode — ACTIVE BRIEF 9/1c QA link: the wizard open
      // at step 1 with the canvas-takeover mode surface up, no resolved
      // sheet (unlike every state below, which all seed one) and no
      // entrance replay — openMediaMode({immediate:true}) snaps straight
      // to the settled state instead of playing the recede/sweep/stagger.
      if (wantState === 'media-mode') {
        flowRunning = true;
        if (auxPanel) auxPanel.classList.add('pt-wizard-active');
        setAuxTitle('Media');
        openMediaMode({ immediate: true });
        expandHat();
        renderForkStep(); // P5 — media-mode now lands on the fork, not step 1
        return true;
      }
      // ?state=studio — P5 QA link: fork chosen straight into Studio,
      // editor open on a blank 300×250, Size drawer open, hat in its
      // compact Studio row. Same immediate/no-replay contract as
      // media-mode above.
      if (wantState === 'studio') {
        flowRunning = true;
        if (auxPanel) auxPanel.classList.add('pt-wizard-active');
        setAuxTitle('Media');
        openMediaMode({ immediate: true });
        expandHat();
        openStudio();
        return true;
      }
      if (['sheet', 'editor', 'scored', 'overnight', 'motion', 'plan', 'selected'].indexOf(wantState) === -1) return false;
      state.images = [findFrame('shoot-02')];
      state.copy = { mode: 'written', pairs: COPY_PAIRS.slice() };
      state.layout = 'split';
      state.sizes = ['300x250', '728x90', '160x600'];
      // Deep links seed the resolved sheet silently — no wizard
      // replay, no chat Q&A transcript. The hat stays collapsed but
      // holds the NEW MEDIA SETTINGS surface (9/10 — the same state a
      // real generate leaves behind, see settleHatAfterGenerate), so
      // opening it shows the pills, not the default hat; the
      // follow-ups live on the sheet's own objects — the ghost
      // "3 more concepts" tile (3 concepts here, so it's visible) and
      // each concept's own "+ sizes" chip (all three start with the
      // same 3 sizes above, so each correctly offers to add the same
      // 2 missing ones — never "born-disabled" the way the old
      // hardcoded Take-B beat was on this exact deep link).
      buildConceptSheetDOM(['A', 'B', 'C'], false, 'Coast Road'); // AR.1 — the deep-link fixture's own board name
      document.body.classList.add('is-painter-resolved');
      sheetResolved = true;
      scheduleFitAllBannerScales();
      ptBot('Done — the concept sheet is on the canvas.');
      flowRunning = true;
      wizardStep = -1;
      if (auxPanel) auxPanel.classList.add('pt-wizard-active');
      if (hatWizard) hatWizard.setAttribute('aria-hidden', 'false');
      if (hatWizardBody) hatWizardBody.innerHTML = '';
      renderForkStep();
      if (wantState === 'editor') {
        // AM.4 — this deep link now opens Studio in unit mode on A1
        // (concept A's first, 300×250 variant), not concept B.
        const groups = document.querySelectorAll('#ptConcepts .pt-concept-group');
        const groupA = groups[0];
        const frame = groupA && groupA.querySelector('.pt-banner[data-size="300x250"]');
        const frameEl = frame && frame.closest('.pt-banner-frame');
        if (frameEl) openPainterEditor(frameEl);
      }
      if (wantState === 'scored' || wantState === 'plan' || wantState === 'selected') {
        landScoresInstant();
      }
      if (wantState === 'plan') {
        // Z.2.1(a) — "the scored sheet + the fixture": two of Board
        // 1's own units go into Selects (A1, B2 — both 300×250), then
        // a SECOND board at 728×90 gets built (2 concepts × 2
        // variants — the comps' own History reads "Board 2 · 728×90 ·
        // 2 × 2") and one of ITS units too (A2) — the fixture's exact
        // three fills, reached through the real select/build
        // mechanics rather than hand-set DOM, so everything downstream
        // (scores, the rail, Package) is the product's own truth, not
        // a fake copied from the comps.
        const selectByVar = (v) => {
          const cards = Array.prototype.slice.call(document.querySelectorAll('#ptConcepts .pt-banner-card'));
          const found = cards.filter((c) => { const ve = c.querySelector('.pt-unit-var'); return ve && ve.textContent === v; })[0];
          const btn = found && found.querySelector('.pt-select-btn');
          if (btn) btn.click();
        };
        selectByVar('A1');
        selectByVar('B2');
        // Through the same doors a real user's Volume/Size picks use
        // (setBriefConcepts/setBriefVariants/setBoardSize), not a raw
        // write to brief.* — each of these banks the CURRENT board
        // (bankCurrentBoardOnce) BEFORE touching brief, so Board 1 is
        // banked with its own true 300×250 · 3 × 3 the instant the
        // first one runs; writing brief.boardSize/concepts/variants
        // directly here banked Board 1 with Board 2's own numbers
        // instead, since buildConceptSheetDOM's own bankCurrentBoardOnce
        // (below) would only have run AFTER brief already held them.
        setBriefConcepts(2);
        setBriefVariants(2);
        setBoardSize('728x90');
        buildConceptSheetDOM(['A', 'B'], false); // AR.1 — no message; this second board takes the next Corvache pool name
        landScoresInstant();
        selectByVar('A2');
        // The two chat lines Z.2.1 describes: the user's own line + a
        // "Media plan" attachment chip (fileMeta's own sheet badge —
        // the same recipe a live .xlsx drop gets via addFile/send),
        // then the assistant's plan-received line with its Selects
        // jump link (resolveMediaPlanArrival, shared with the live
        // composer path via window._ptResolveMediaPlanArrival).
        ptUser(
          'Here’s the media plan' +
          '<div class="msg-attachments"><div class="msg-attach-file">' +
            '<span class="ca-chip-badge ca-badge-sheet">XLSX</span>' +
            '<span class="msg-attach-file-meta"><span class="msg-attach-file-name">Media plan · ' + PLAN_FIXTURE.source + '</span></span>' +
          '</div></div>'
        );
        resolveMediaPlanArrival();
      }
      if (wantState === 'overnight') {
        landScoresInstant();
        addNightlyRow();
        const conceptsEl = document.getElementById('ptConcepts');
        if (conceptsEl) {
          conceptsEl.appendChild(el(
            '<div class="pt-overnight-heading">' +
              '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M196.89,130.94,144.4,111.6,125.06,59.11a13.92,13.92,0,0,0-26.12,0L79.6,111.6,27.11,130.94a13.92,13.92,0,0,0,0,26.12L79.6,176.4l19.34,52.49a13.92,13.92,0,0,0,26.12,0L144.4,176.4l52.49-19.34a13.92,13.92,0,0,0,0-26.12Z"/></svg>' +
              'Made overnight · Media' +
            '</div>'
          ));
          const savedSizes = state.sizes;
          state.sizes = ['300x250'];
          buildConceptSheetDOM(['D', 'E', 'F', 'G', 'H'], true);
          state.sizes = savedSizes;
          landScoresInstant();
          scheduleFitAllBannerScales();
        }
      }
      if (wantState === 'motion') {
        openMotionTeaser();
      }
      // AJ.3 — ?state=selected: the scored sheet (A/B/C, 3×3) with a
      // selection already up for the aj-verify shots — A1, A2 and all
      // of Concept B, through the real Set (not hand-set DOM) so the
      // band, the card outlines/checks and the concept labels are all
      // the product's own truth.
      if (wantState === 'selected') {
        const cardByVar = (v) => Array.prototype.slice.call(document.querySelectorAll('#ptConcepts .pt-banner-card'))
          .filter((c) => { const ve = c.querySelector('.pt-unit-var'); return ve && ve.textContent === v; })[0];
        ['A1', 'A2'].forEach((v) => { const c = cardByVar(v); if (c) sheetSelection.add(c.dataset.unitId); });
        const groupB = document.querySelector('#ptConcepts .pt-concept-group[data-concept="B"]');
        if (groupB) {
          Array.prototype.forEach.call(groupB.querySelectorAll('.pt-banner-card'), (c) => sheetSelection.add(c.dataset.unitId));
        }
        syncSelectionUI();
      }
      return true;
    }

    // ── ?share=coast-road — the read-only shared view. Builds the
    //    same deterministic sheet content as ?state=sheet directly
    //    (no chat replay — the chat column is hidden entirely for
    //    this view, see body.is-painter-shared in <style>), lands
    //    scores instantly, and turns on the shared-view chrome (the
    //    comments affordance + Download PPT row). ──
    function applyShareLink() {
      let params;
      try { params = new URLSearchParams(location.search); } catch (e) { return false; }
      if (params.get('share') !== 'coast-road') return false;
      state.images = [findFrame('shoot-02')];
      state.copy = { mode: 'written', pairs: COPY_PAIRS.slice() };
      state.layout = 'split';
      state.sizes = ['300x250', '728x90', '160x600'];
      buildConceptSheetDOM(['A', 'B', 'C'], false, 'Coast Road'); // AR.1 — matches the ?share=coast-road slug
      document.body.classList.add('is-painter-resolved');
      document.body.classList.add('is-painter-shared');
      sheetResolved = true;
      scheduleFitAllBannerScales();
      landScoresInstant();
      return true;
    }

    function addNightlyRow() {
      if (document.getElementById('ptNightlyRow')) return;
      // AB.1 — .pt-sheet-header is gone (the bar is #ptMediaTopbar
      // now); anchor to the stage's own top instead, same small pill
      // it always was, now sitting above Selects.
      const main = document.querySelector('#painterSheetView .pt-sheet-main');
      if (!main) return;
      main.insertAdjacentElement('afterbegin', el(
        '<div class="pt-nightly-row" id="ptNightlyRow"><span class="pt-nightly-dot" aria-hidden="true"></span>Nightly · Coast Road — next run 6:00 AM</div>'
      ));
    }

    // ── Share flyout: toggle + copy-to-clipboard with a fallback for
    //    contexts where the Clipboard API is blocked (matches the
    //    pattern already used by the scope-table's copyAll()). ──
    // AB.1 amendment — mounted twice now (the workspace header's own
    // cluster, and the Media bar's verbatim copy): same behaviour,
    // different ids, so a click in either wires to its own popover
    // rather than the two instances fighting over one.
    function initSharePopover(btnId, popId, copyId) {
      const btn = document.getElementById(btnId || 'ptShareBtn');
      const pop = document.getElementById(popId || 'ptSharePop');
      const copyBtn = document.getElementById(copyId || 'ptShareCopyBtn');
      if (!btn || !pop) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !pop.classList.contains('is-open');
        closeAllPtSheetPopovers();
        if (willOpen) { pop.classList.add('is-open'); pop.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); }
      });
      if (copyBtn) {
        let revertTimer = null;
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation(); // keep the flyout open so "Link copied" is actually visible
          const url = location.origin + location.pathname + '?share=coast-road';
          try {
            await navigator.clipboard.writeText(url);
          } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (__) {}
            document.body.removeChild(ta);
          }
          copyBtn.classList.add('is-copied');
          clearTimeout(revertTimer);
          revertTimer = setTimeout(() => copyBtn.classList.remove('is-copied'), 2200);
        });
      }
    }

    // ── Kebab menu (Automate / Export to console) — same toggle
    //    pattern as the canvas title dropdown (titleMenu() below). ──
    function initKebabMenu() {
      const btn = document.getElementById('ptKebabBtn');
      const menu = document.getElementById('ptKebabMenu');
      if (!btn || !menu) return;
      function close() {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !menu.classList.contains('open');
        closeAllPtSheetPopovers();
        if (willOpen) { menu.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false'); }
      });
      const automateItem = document.getElementById('ptAutomateItem');
      if (automateItem) {
        automateItem.addEventListener('click', () => {
          close();
          const modal = document.getElementById('ptAutomateModal');
          if (modal) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
        });
      }
      /* Sheet-level Figma export — the whole board, where the unit
         kebab's own entry sends one unit. No bridge behind either in
         this prototype, so it says so rather than no-opping. */
      const figmaItem = document.getElementById('ptExportFigmaItem');
      if (figmaItem) {
        figmaItem.addEventListener('click', () => {
          closeAllPtSheetPopovers();
          const menu = document.getElementById('ptKebabMenu');
          if (menu) { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); }
          const kebab = document.getElementById('ptKebabBtn');
          if (kebab) kebab.setAttribute('aria-expanded', 'false');
          const n = document.querySelectorAll('#ptConcepts .pt-banner-card').length;
          ptBot('Export to Figma isn\u2019t wired into this prototype — it would land all ' + n + ' units as frames on one Figma page, one section per concept row.');
        });
      }
      const exportItem = document.getElementById('ptExportConsoleItem');
      if (exportItem) {
        exportItem.addEventListener('click', () => {
          close();
          ptUser('<span class="pt-echo-pill">Export to console · traffic at scale</span>');
          setTimeout(() => {
            ptBot('Sent to the console — Coast Road is queued for trafficking. Media ops will pick it up from here.');
          }, 900);
        });
      }
    }

    // ── Automate confirm dialog — cron beat. Confirming posts a chat
    //    line and drops the quiet nightly-status row under the header. ──
    function initAutomateModal() {
      const modal = document.getElementById('ptAutomateModal');
      if (!modal) return;
      const cancelBtn = document.getElementById('ptAutomateCancel');
      const confirmBtn = document.getElementById('ptAutomateConfirm');
      function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
      if (cancelBtn) cancelBtn.addEventListener('click', close);
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          close();
          addNightlyRow();
          ptBot('Nightly Media is on — 5 new Coast Road banners will be ready by 6:00 AM, scored and waiting.');
        });
      }
    }

    // ── Comments popover (read-only shared view only) ──
    function initCommentsPopover() {
      const btn = document.getElementById('ptCommentsBtn');
      const pop = document.getElementById('ptCommentsPop');
      if (!btn || !pop) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !pop.classList.contains('is-open');
        closeAllPtSheetPopovers();
        if (willOpen) { pop.classList.add('is-open'); pop.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); }
      });
    }

    // ── Download PPT — in-row spinner→check beat, never a real file. ──
    function initDownloadPpt() {
      const btn = document.getElementById('ptDownloadPptBtn');
      if (!btn) return;
      const label = btn.querySelector('.pt-dl-label');
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-busy') || btn.classList.contains('is-done')) return;
        btn.classList.add('is-busy');
        if (label) label.textContent = 'Preparing…';
        setTimeout(() => {
          btn.classList.remove('is-busy');
          btn.classList.add('is-done');
          if (label) label.textContent = 'Downloaded';
          setTimeout(() => {
            btn.classList.remove('is-done');
            if (label) label.textContent = 'Download PPT';
          }, 2200);
        }, 1200);
      });
    }

    // ════════════════════════════════════════════════════════════════
    // P4 — motion teaser. "video canvas mode, eventually audio"
    // (8/24 standup) as roadmap-on-screen, not a build-out: the Video
    // mode tile, once Painter has a resolved sheet on the canvas,
    // opens a dark stage carrying a LIVE clone of concept A's 300×250
    // — whatever it currently looks like, edits included — looping
    // via three real CSS-keyframe animations (image pan / headline
    // slide-in / CTA pop). The Audio tile posts one quiet chat line.
    // Both are exposed on window so initModeTiles() (defined earlier,
    // reused rather than duplicated) can reach them without this IIFE
    // needing to know about the mode-tile row at all.
    // ════════════════════════════════════════════════════════════════
    function buildMotionBannerEl() {
      const groupA = document.querySelector('#ptConcepts .pt-concept-group');
      const src = groupA && groupA.querySelector('.pt-banner[data-size="300x250"]');
      if (!src) return null;
      const clone = src.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('pt-motion-banner');
      return clone;
    }
    // Mirrors fitEditorStage()'s measure-then-scale approach, but the
    // motion stage WANTS to enlarge past natural size (a "gorgeous,
    // one screen" showcase, not a true-to-pixel proof) — capped at
    // 1.7x so it never reads as a different ad unit.
    function fitMotionStage() {
      const stage = document.getElementById('ptMotionStage');
      const frame = document.getElementById('ptMotionStageFrame');
      if (!stage || !frame) return;
      const naturalW = 300, naturalH = 250;
      const availW = stage.clientWidth - 72;
      const availH = stage.clientHeight - 72;
      const MAX_SCALE = 1.7;
      const scale = (availW > 0 && availH > 0) ? Math.max(0.6, Math.min(MAX_SCALE, availW / naturalW, availH / naturalH)) : 1;
      frame.style.width = naturalW + 'px';
      frame.style.height = naturalH + 'px';
      frame.style.transform = 'scale(' + scale + ')';
    }
    // ── One clock, two readouts — REUSE-AUDIT port of canvas-graphics'
    //    #c4VideoPlayer "one clock, three readouts" model (S76): the
    //    scrub-fill is a CSS keyframe (declared unconditionally,
    //    play-state gates it — same real-bug-fixed pattern S76
    //    documents: gating the animation's own PRESENCE behind a class
    //    cancels it instead of freezing it), the mono timecode can't be
    //    a CSS animation (it's text) so it's the one thing genuinely
    //    driven by rAF, reading the same elapsed-time formula. Skipped
    //    entirely under reduced motion — the CSS scrub-fill is already
    //    stripped to a static empty track there (see the reduced-motion
    //    block), and a still-ticking clock next to a frozen banner
    //    would read as a contradiction, not a functional fallback. ──
    const MOTION_DURATION_MS = 6000;
    let motionPlaying = false;
    let motionStartTs = 0;
    let motionPausedElapsed = 0;
    let motionRafId = null;
    function motionElapsedNow() {
      if (!motionPlaying) return motionPausedElapsed;
      return ((performance.now() - motionStartTs) % MOTION_DURATION_MS + MOTION_DURATION_MS) % MOTION_DURATION_MS;
    }
    function formatMotionTimecode(ms) {
      return '0:' + String(Math.floor(ms / 1000)).padStart(2, '0');
    }
    function motionTick() {
      const motionEl = document.getElementById('ptMotion');
      if (!motionEl || motionEl.getAttribute('data-visible') !== '1') { motionRafId = null; return; }
      const timeEl = document.getElementById('ptMotionTimecode');
      if (timeEl) timeEl.textContent = formatMotionTimecode(motionElapsedNow()) + ' / 0:06';
      motionRafId = requestAnimationFrame(motionTick);
    }
    function setMotionPlaying(playing) {
      const motionEl = document.getElementById('ptMotion');
      const btn = document.getElementById('ptMotionPlayBtn');
      if (!motionEl) return;
      if (!playing) motionPausedElapsed = motionElapsedNow();
      else motionStartTs = performance.now() - motionPausedElapsed;
      motionPlaying = playing;
      motionEl.classList.toggle('pt-motion-paused', !playing);
      if (btn) btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    function openMotionTeaser() {
      const banner = buildMotionBannerEl();
      const frame = document.getElementById('ptMotionStageFrame');
      const motionEl = document.getElementById('ptMotion');
      if (!banner || !frame || !motionEl) return;
      frame.innerHTML = '';
      frame.appendChild(banner);
      motionEl.setAttribute('data-visible', '1');
      motionEl.setAttribute('aria-hidden', 'false');
      // Restart the scrub-fill's CSS animation from frame 0 in sync
      // with the freshly-cloned banner (a brand-new element always
      // starts its own keyframes at 0% for free; this static, reused
      // element needs the classic restart trick instead).
      const scrubFill = document.getElementById('ptMotionScrubFill');
      if (scrubFill) { scrubFill.style.animation = 'none'; void scrubFill.offsetWidth; scrubFill.style.animation = ''; }
      motionPausedElapsed = 0;
      setMotionPlaying(true);
      fitMotionStage();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && motionRafId === null) motionRafId = requestAnimationFrame(motionTick);
      syncMediaTopbar(); // Y — another canvas takeover; the Media bar yields to its own topbar
    }
    function closeMotionTeaser() {
      const motionEl = document.getElementById('ptMotion');
      if (!motionEl) return;
      motionEl.setAttribute('data-visible', '0');
      motionEl.setAttribute('aria-hidden', 'true');
      if (motionRafId !== null) { cancelAnimationFrame(motionRafId); motionRafId = null; }
      syncMediaTopbar();
    }
    function initMotionTeaser() {
      const backBtn = document.getElementById('ptMotionBack');
      if (backBtn) backBtn.addEventListener('click', closeMotionTeaser);
      const playBtn = document.getElementById('ptMotionPlayBtn');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          const motionEl = document.getElementById('ptMotion');
          const wasPaused = motionEl && motionEl.classList.contains('pt-motion-paused');
          setMotionPlaying(!!wasPaused);
        });
      }
      // The full-cover stage click target — S76's other half of the
      // dual play/pause affordance (frame click + dedicated control).
      const frameBtn = document.getElementById('ptMotionFrameBtn');
      if (frameBtn) {
        frameBtn.addEventListener('click', () => {
          const motionEl = document.getElementById('ptMotion');
          const wasPaused = motionEl && motionEl.classList.contains('pt-motion-paused');
          setMotionPlaying(!!wasPaused);
        });
      }
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const motionEl = document.getElementById('ptMotion');
        if (motionEl && motionEl.getAttribute('data-visible') === '1') closeMotionTeaser();
      });
      let motionResizeTimer = null;
      window.addEventListener('resize', () => {
        const motionEl = document.getElementById('ptMotion');
        if (!motionEl || motionEl.getAttribute('data-visible') !== '1') return;
        clearTimeout(motionResizeTimer);
        motionResizeTimer = setTimeout(fitMotionStage, 120);
      }, { passive: true });
      window._ptOpenMotionTeaser = openMotionTeaser;
      window._ptAudioRoadmapLine = function () {
        const line = 'Audio beds — coming to Media.';
        const bots = document.querySelectorAll('#chatStream .msg.bot');
        const last = bots[bots.length - 1];
        if (last && last.textContent.trim() === line) return; /* dedupe */
        ptBot(line);
      };
    }

    modeTile.addEventListener('click', startFlow);
    initStyleGuidePopover();
    initPainterEditor();
    initMotionTeaser();
    initScoreChips();
    initScoreAllButton();
    initSharePopover();
    initSharePopover('ptShareBtnMedia', 'ptSharePopMedia', 'ptShareCopyBtnMedia'); // AB.1 amendment — the Media bar's own copy
    initKebabMenu();
    initAutomateModal();
    initCommentsPopover();
    initDownloadPpt();
    initConceptSheetFollowUps();
    initShapeGridRemove();
    initSelectButtons();
    initUnitMenus();
    initUnitEditButtons(); // AQ.2 — the cluster's pencil
    // §BO.2 — initSelectsViewToggle/initSelectsViewer retired with the
    // Selects section they wired (its Strip/Cards/List toggle and the
    // "View all" viewer).
    initProductionSizes();
    initGenerateMenu();
    initBoardsRail(); renderBoardsRail(); // W.1 — Media Mode's own boards HISTORY rail (the sheet's own copy retired, §BO.3)
    initPackageButton();
    initExportFigmaButton(); // §BO.6 — the top-right control beside Package
    syncPackageButton(); // also syncs Export to Figma's [hidden]/disabled now
    initPackageOverlay(); // AF — Escape + the stage's own resize refit
    initSheetPopScrollDismiss();
    initBandFieldMenus();
    initLegalAndCta();
    initBodyFit();
    initLegalStyle();
    wireSheetBand(); // AD.2 — the band's fields + popovers
    initSelectionClicks(); // AJ.1 — the band's own selection (a unit's id, a concept's label, Select all/Clear, Escape)
    initSheetMarquee(); // §BE.3 — drag the sheet's empty space to multi-select
    initPainterRailNav();
    syncBandFieldsUI(); // AJ.2 — the band starts in its empty state (nothing selected yet)
    if (!applyShareLink()) applyDeepLink();
  })();

  // --- editorial typography: wrap data points + extract sources to a Swiss lockup ---
  (function enhanceProse() {
    const els = document.querySelectorAll('.sec-body p, .sub-block p');
    const wrapData = (s) => s
      .replace(/(\$[\d,]+(?:\.\d+)?[MKB]?)/g, '<span class="datum">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?[MKB])\b/g, '<span class="datum">$1</span>')
      .replace(/(\b\d+(?:\.\d+)?%)/g, '<span class="datum">$1</span>')
      .replace(/\b((?:19|20)\d{2})\b/g, '<span class="datum">$1</span>')
      .replace(/(\b\d{1,3}(?:,\d{3})+\b)/g, '<span class="datum">$1</span>');

    els.forEach(el => {
      if (el.dataset.enhanced) return;
      let html = el.innerHTML;

      // Extract trailing (Sources: ...) / (Source: ...) citation
      const citationRegex = /\s*\(Sources?:\s*([^)]+)\)\s*$/;
      const match = html.match(citationRegex);
      let sourcesHtml = '';
      if (match) {
        const sources = match[1].split(/;\s*/).map(s => s.trim()).filter(Boolean);
        const labelText = sources.length > 1 ? 'Sources' : 'Source';
        const items = sources.map((s, i) =>
          `<li><span class="sources-n">${String(i + 1).padStart(2, '0')}</span><span class="sources-text">${wrapData(s)}</span></li>`
        ).join('');
        sourcesHtml = `<aside class="sources-lockup"><span class="sources-label">${labelText}</span><ol class="sources-list">${items}</ol></aside>`;
        html = html.replace(citationRegex, '');
      }

      el.innerHTML = wrapData(html);
      if (sourcesHtml) el.insertAdjacentHTML('afterend', sourcesHtml);
      el.dataset.enhanced = 'true';
    });
  })();

  // --- v2 header: frosted blur fades in only when the brief-stack is about to
  //     collide horizontally with the title-wrap or share button overlay ---
  (function v2HeaderBlur() {
    const c = document.getElementById('canvas');
    const h = c && c.querySelector('.canvas-header');
    const stack = c && c.querySelector('.brief-stack');
    const titleWrap = h && h.querySelector('.title-wrap');
    const shareBtn = h && h.querySelector('.share-btn');
    if (!c || !h || !stack || !titleWrap || !shareBtn) return;
    const BUFFER = 8;
    let raf = 0;
    function tick() {
      raf = 0;
      const stackR = stack.getBoundingClientRect();
      const titleR = titleWrap.getBoundingClientRect();
      const shareR = shareBtn.getBoundingClientRect();
      const overlapsLeft = stackR.left < titleR.right + BUFFER;
      const overlapsRight = stackR.right > shareR.left - BUFFER;
      h.classList.toggle('scrolled', overlapsLeft || overlapsRight);
    }
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    }
    const ro = new ResizeObserver(schedule);
    ro.observe(c);
    ro.observe(stack);
    ro.observe(h);
    window.addEventListener('resize', schedule);
    schedule();
  })();

  // --- rail-nav: accordion expand + chapter scroll ---
  const canvasEl = document.getElementById('canvas');
  let programmaticScroll = false;
  let progScrollIdleTimer = null;
  function startProgrammaticScroll() {
    programmaticScroll = true;
    if (progScrollIdleTimer) clearTimeout(progScrollIdleTimer);
    /* Fallback unlock if no scroll fires (e.g., already at target). */
    progScrollIdleTimer = setTimeout(() => { programmaticScroll = false; }, 250);
  }
  /* Reset the idle timer on each scroll event so the lock holds until the
     smooth scroll actually stops moving — then unlock 250ms later. */
  canvasEl.addEventListener('scroll', () => {
    if (!programmaticScroll) return;
    if (progScrollIdleTimer) clearTimeout(progScrollIdleTimer);
    progScrollIdleTimer = setTimeout(() => { programmaticScroll = false; }, 250);
  }, { passive: true });
  function scrollToChapter(chapter) {
    const target = document.querySelector(`[data-chapter-anchor="${chapter}"]`)
      || document.querySelector(`.brief-board[data-section="${chapter}"]`)
      || document.querySelector(`.c4-section[data-section="${chapter}"]`);
    if (!target) return;
    const headerEl = canvasEl.querySelector('.canvas-header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 64;
    const targetTop = target.getBoundingClientRect().top
      - canvasEl.getBoundingClientRect().top
      + canvasEl.scrollTop;
    canvasEl.scrollTo({ top: Math.max(0, targetTop - headerH), behavior: 'smooth' });
  }
  /* Rail-nav click delegation moved to the TOP of this <script> block
     (right after the opening tag) so it registers before anything
     else can throw. Empty block here intentionally — see top of
     script for the actual handler. */

  // --- scroll-spy: highlight rail-nav as user scrolls through brief-boards + sub-section anchors ---
  const briefBoardsForNav = Array.from(document.querySelectorAll('.brief-board[data-nav-section]'));
  /* Includes canvas_2's cover .brief-board (with data-nav-section="overview")
     alongside the .table-board chapters, so scroll-spy can highlight the
     Overview rail entry when the user is at the top of the canvas. */
  const tableBoardsForNav = Array.from(document.querySelectorAll('.table-view > [data-nav-section]'));
  /* canvas_4 sections drive the rail-nav-canvas4 highlight. Both
     ca-media-social and ca-media-display carry data-nav-section="ca-media"
     so the parent "Media" rail item stays highlighted while the user is
     in either child section; data-chapter-anchor on each section then
     picks which sub-chapter (Social Media / Display) is active. */
  const canvas4BoardsForNav = Array.from(document.querySelectorAll('.canvas4-view .c4-section[data-nav-section]'));
  const chapterTargets = Array.from(document.querySelectorAll('[data-chapter-anchor], .brief-board[data-section]'));
  const navItems = Array.from(document.querySelectorAll('.rail-nav > li[data-target]'));
  const subItems = Array.from(document.querySelectorAll('.rail-subnav > li[data-chapter]'));
  const chapterIdOf = (el) => el.dataset.chapterAnchor || el.dataset.section;
  function updateActiveNav() {
    /* During programmatic scroll (arrow nav / pill click), the rail has already
       been set to the target chapter — don't let the in-flight scroll position
       drag the highlight back through every chapter on the way. */
    if (programmaticScroll) return;
    const scrollTop = canvasEl.scrollTop;
    const trigger = scrollTop + 64 + 24; // canvas-header + small offset
    /* Pick which set of boards drives the parent-section highlight based on
       the current tab. Canvas tab uses brief-boards (canvas_1); Table tab
       uses table-boards (canvas_2); canvas4 tab uses c4-section blocks.
       Each tab shares the same .rail-nav > li active/expanded mechanic
       — only the source boards differ. */
    const tab = mainEl.dataset.tab;
    const isTableTab = tab === 'table';
    const isCanvas4Tab = tab === 'canvas4';
    const boardsForTab = isTableTab ? tableBoardsForNav
                       : isCanvas4Tab ? canvas4BoardsForNav
                       : briefBoardsForNav;
    let activeBoard = boardsForTab[0];
    for (const board of boardsForTab) {
      if (board.offsetTop <= trigger) activeBoard = board;
      else break;
    }
    /* chapterTargets includes anchors from BOTH tabs. Filter out anchors that
       belong to the inactive tab so their offsetTop=0 (display:none parent)
       doesn't clobber the active anchor on the visible tab. */
    const activeChapterTargets = chapterTargets.filter(t => {
      const inTable = t.classList.contains('table-board') || !!t.closest('.table-view');
      const inCanvas4 = !!t.closest('.canvas4-view');
      if (isTableTab)   return inTable;
      if (isCanvas4Tab) return inCanvas4;
      return !inTable && !inCanvas4;
    });
    let activeAnchor = activeChapterTargets[0] ? chapterIdOf(activeChapterTargets[0]) : null;
    for (const t of activeChapterTargets) {
      if (t.offsetTop <= trigger) activeAnchor = chapterIdOf(t);
      else break;
    }
    if (!activeBoard) return;
    const target = activeBoard.dataset.navSection;
    navItems.forEach(item => {
      const match = item.dataset.target === target;
      item.classList.toggle('active', match);
      item.classList.toggle('expanded', match);
    });
    subItems.forEach(item => item.classList.toggle('active', item.dataset.chapter === activeAnchor));
  }
  let scrollTicking = false;
  canvasEl.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => { updateActiveNav(); scrollTicking = false; });
    }
  });
  updateActiveNav();

  /* --- canvas_2 per-row build-in: each table row releases its animation
     when IT enters the viewport, not when its parent board does. For
     long tables (the 20-row dense matrix in particular), this means
     the bottom rows don't pre-animate offscreen while the user is
     still reading the top — they fade in as the user actually scrolls
     to them. Once .row-anim-in is added the observer unobserves that
     row so subsequent scroll passes don't replay the animation.
     Falls back to firing all rows immediately if IO isn't available. */
  (function initRowBuildIn() {
    const rows = document.querySelectorAll('.table-view .table-board tbody tr');
    if (!rows.length) return;
    if (!('IntersectionObserver' in window)) {
      rows.forEach(r => r.classList.add('row-anim-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        /* Defer one frame so the preanimate state paints at least once
           — otherwise the browser may collapse the class addition into
           a single layout and skip the transition entirely. */
        requestAnimationFrame(() => entry.target.classList.add('row-anim-in'));
        io.unobserve(entry.target);
      });
    }, {
      root: canvasEl,
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.18,
    });
    rows.forEach(r => io.observe(r));
  })();

  // --- settings disabled: page is locked to header v1 + theme respects
  //     the Chat Hat profile picker. Chat Hat overrides the lease-campaign
  //     hard-pin so dark/light persists across reloads via chatHatTheme. ---
  (function lockTheme() {
    let preferred = 'light';
    try {
      const saved = localStorage.getItem('chatHatTheme');
      if (saved === 'dark' || saved === 'light') preferred = saved;
    } catch (e) {}
    document.body.dataset.theme = preferred;
    document.body.dataset.header = 'v1';
    try {
      // Intentionally NOT removing chatHatTheme — keep the Chat Hat
      // picker's preference sticky. canvasHeader removal preserved
      // from the lease-campaign for header lock parity.
      localStorage.removeItem('canvasHeader');
    } catch (e) {}
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      panel.style.display = 'none';
    }
  })();

  // --- chat dialogue auto-cycle ---
  (function chatCycle() {
    const stream = document.getElementById('chatStream');
    if (!stream) return;
    const thinkingEl = stream.querySelector('.thinking');
    const cycleMsgs = Array.from(stream.querySelectorAll('.msg:not(:first-of-type)'));
    if (!thinkingEl || cycleMsgs.length < 2) return;

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const scrollEnd = () => stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });

    function reveal(el) {
      el.classList.remove('fading');
      el.classList.add('shown');
      void el.offsetHeight;
      el.classList.add('visible');
    }
    function hideOut(el) {
      el.classList.remove('visible');
      el.classList.add('fading');
    }
    function clear(el) {
      el.classList.remove('shown', 'visible', 'fading');
    }

    function reset() {
      cycleMsgs.forEach(clear);
      clear(thinkingEl);
      stream.appendChild(thinkingEl);
      stream.scrollTop = 0;
    }

    let cancelled = false;
    async function play() {
      while (!cancelled) {
        reset();
        await sleep(1600);
        for (let i = 0; i < cycleMsgs.length; i += 2) {
          if (cancelled) return;
          const userMsg = cycleMsgs[i];
          const botMsg = cycleMsgs[i + 1];

          reveal(userMsg);
          scrollEnd();
          await sleep(1200);
          if (cancelled) return;

          userMsg.after(thinkingEl);
          reveal(thinkingEl);
          scrollEnd();
          await sleep(2200);

          hideOut(thinkingEl);
          await sleep(420);
          clear(thinkingEl);

          if (botMsg) {
            reveal(botMsg);
            scrollEnd();
            await sleep(2400);
          }
        }
        await sleep(2800);
        cycleMsgs.forEach(hideOut);
        hideOut(thinkingEl);
        await sleep(700);
      }
    }
    play();
  })();

  /* Bibliography finale — morph the central shape via blur-dissolve crossfade */
  (function morphFinaleShape() {
    const shape = document.querySelector('.bib-finale-shape');
    const tagline = document.querySelector('.bib-finale-tagline');
    if (!shape || !tagline) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layerA = shape.querySelector('[data-layer="a"]');
    const layerB = shape.querySelector('[data-layer="b"]');
    if (!layerA || !layerB) return;

    const shapes = [
      "url('bib-shape.png')",
      "url('bib-shape-2.png')",
      "url('bib-shape-3.png')",
      "url('bib-shape-4.png')",
      "url('bib-shape-5.png')",
    ];
    const TRANSITION = 'opacity 1600ms cubic-bezier(0.45, 0, 0.55, 1), filter 1600ms cubic-bezier(0.45, 0, 0.55, 1)';
    let idx = 0;
    let active = 'a';
    let started = false;

    function morph() {
      idx = (idx + 1) % shapes.length;
      const nextKey = active === 'a' ? 'b' : 'a';
      const next = nextKey === 'a' ? layerA : layerB;
      const current = active === 'a' ? layerA : layerB;

      // Prep incoming layer: set new mask, start blurry + invisible (no transition)
      next.style.transition = 'none';
      next.style.maskImage = shapes[idx];
      next.style.webkitMaskImage = shapes[idx];
      next.style.filter = 'blur(28px)';
      next.style.opacity = '0';

      // Force layout so the prep state is applied before transitioning
      void next.offsetWidth;

      // Now both layers transition simultaneously
      next.style.transition = TRANSITION;
      current.style.transition = TRANSITION;

      requestAnimationFrame(() => {
        next.style.filter = 'blur(0)';
        next.style.opacity = '1';
        current.style.filter = 'blur(28px)';
        current.style.opacity = '0';
      });

      active = nextKey;
    }

    function begin() {
      if (started) return;
      started = true;
      // Initialize transitions on both layers
      layerA.style.transition = TRANSITION;
      layerB.style.transition = TRANSITION;
      setTimeout(() => setInterval(morph, 7000), 5000);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          observer.disconnect();
          begin();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(tagline);
  })();

  /* Chapter nav — persistent prev/next pill.
     Tab-aware: when canvas_1 is active it walks .brief-stack > .brief-board;
     when canvas_2 is active it walks .table-view > .table-board. The total
     count + arrow disabled state refresh whenever data-tab flips. */
  (function chapterNav() {
    const nav = document.getElementById('chapterNav');
    const prevBtn = document.getElementById('chapterPrev');
    const nextBtn = document.getElementById('chapterNext');
    const currentEl = document.getElementById('chapterCurrent');
    const totalEl = document.getElementById('chapterTotal');
    const nameEl = document.getElementById('chapterName');
    const canvasEl = document.getElementById('canvas');
    const mainEl = document.getElementById('main');
    if (!nav || !canvasEl) return;

    function getBoards() {
      const tab = mainEl && mainEl.dataset.tab;
      if (tab === 'table') {
        /* Cover (a .brief-board mirrored from canvas_1) sits at the top
           of canvas_2 as the Overview chapter, then the .table-board
           entries follow. Skip the finale poster — same convention as
           canvas_1: the wrap card is a visual capstone, not a chapter. */
        const cover = Array.from(document.querySelectorAll('.table-view > .brief-board'));
        const tables = Array.from(document.querySelectorAll('.table-view > .table-board'))
          .filter(b => !b.classList.contains('table-finale-board'));
        return cover.concat(tables);
      }
      if (tab === 'canvas4') {
        /* canvas_4 chapters: the four Creative Assets sections live as
           flat <section data-section> children of #canvas4View (no
           brief-board card backing). The finale poster sits as the
           last section but is excluded from the chapter count, same
           convention canvas_1 uses. */
        return Array.from(document.querySelectorAll('#canvas4View > [data-section]'))
          .filter(b => b.dataset.section !== 'finale');
      }
      if (tab === 'graphics') {
        /* canvas_3 persona library — three top-level chapters
           (Demographics / Psychographics / Behaviors). The persona-hero
           swap doesn't affect these — the below-hero markup is shared
           across all five personas via JS content swap. */
        return Array.from(document.querySelectorAll('.persona-page > [data-section]'));
      }
      return Array.from(document.querySelectorAll('.brief-stack > .brief-board'))
        .filter(b => b.dataset.section !== 'finale');
    }

    let boards = getBoards();
    if (!boards.length) return;

    function refreshTotal() {
      if (totalEl) totalEl.textContent = String(boards.length).padStart(2, '0');
    }
    refreshTotal();

    const sectionLabels = {
      overview: 'Overview',
      brand: 'Brand',
      culture: 'Culture',
      audiences: 'Audiences',
      tensions: 'Tensions',
      brief: 'Brief',
      territories: 'Territories',
      bibliography: 'Bibliography',
      'assumptions': 'Assumptions',
      'data-tables': 'Data Tables',
      'timelines': 'Timelines',
      'comparisons': 'Comparisons',
      'kpis': 'KPIs',
      'dense': 'Dense Data',
      'creative-assets': 'Creative Assets',
      'ca-media':         'Media',
      'ca-media-social':  'Social Media',
      'ca-media-display': 'Display',
      'ca-images':        'Images',
      'ca-video':         'Video',
      'ca-audio':         'Audio',
      'demographics':     'Demographics',
      'psychographics':   'Psychographics',
      'behaviors':        'Behaviors',
    };
    function sectionLabel(board) {
      const slug = board.dataset.navSection || board.dataset.section || '';
      return sectionLabels[slug] || slug.replace(/[-_]/g, ' ');
    }

    let currentIdx = 0;
    let targetIdx = 0;

    function scrollToBoard(idx) {
      const target = boards[idx];
      if (!target) return;
      const headerEl = canvasEl.querySelector('.canvas-header');
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 64;
      const targetTop = target.getBoundingClientRect().top
        - canvasEl.getBoundingClientRect().top
        + canvasEl.scrollTop;
      canvasEl.scrollTo({ top: Math.max(0, targetTop - headerH), behavior: 'smooth' });
    }

    prevBtn.addEventListener('click', () => goPrev());
    nextBtn.addEventListener('click', () => goNext());

    const hotkeyUp = document.getElementById('hotkeyUp');
    const hotkeyDown = document.getElementById('hotkeyDown');
    function syncRailToBoard(board) {
      if (!board) return;
      const navSection = board.dataset.navSection;
      /* table-boards key their chapter id off data-chapter-anchor; brief-boards
         use data-section. Read both so the same code drives either tab. */
      const chapter = board.dataset.section || board.dataset.chapterAnchor;
      /* Only update the rail-nav list visible for the current tab — the other
         lists are hidden via CSS, but stamping active/expanded on them would
         still leak through when the user switches back. */
      const tab = mainEl && mainEl.dataset.tab;
      const navListSelector =
        tab === 'table'    ? '.rail-nav-table' :
        tab === 'canvas4'  ? '.rail-nav-canvas4' :
        tab === 'graphics' ? '.rail-nav-canvas3' :
                             '.rail-nav-canvas';
      document.querySelectorAll(navListSelector + ' > li[data-target]').forEach(li => {
        const match = li.dataset.target === navSection;
        li.classList.toggle('expanded', match);
        li.classList.toggle('active', match);
      });
      document.querySelectorAll(navListSelector + ' .rail-subnav > li[data-chapter]').forEach(li => {
        li.classList.toggle('active', li.dataset.chapter === chapter);
      });
    }
    function goPrev() {
      if (targetIdx <= 0) return;
      targetIdx -= 1;
      startProgrammaticScroll();
      scrollToBoard(targetIdx);
      syncRailToBoard(boards[targetIdx]);
    }
    function goNext() {
      if (targetIdx >= boards.length - 1) return;
      targetIdx += 1;
      startProgrammaticScroll();
      scrollToBoard(targetIdx);
      syncRailToBoard(boards[targetIdx]);
    }
    /* If the user manually scrolls, realign targetIdx after they stop. */
    let scrollSettleTimer = null;
    canvasEl.addEventListener('scroll', () => {
      if (scrollSettleTimer) clearTimeout(scrollSettleTimer);
      scrollSettleTimer = setTimeout(() => { targetIdx = currentIdx; }, 220);
    }, { passive: true });
    if (hotkeyUp) hotkeyUp.addEventListener('click', goPrev);
    if (hotkeyDown) hotkeyDown.addEventListener('click', goNext);
    function flashKey(el) {
      if (!el) return;
      el.classList.add('lit');
      if (el.__flashTimer) clearTimeout(el.__flashTimer);
      el.__flashTimer = setTimeout(() => {
        el.classList.remove('lit');
        el.__flashTimer = null;
      }, 260);
    }
    function openRailPanel() {
      const m = document.getElementById('main');
      const h = document.getElementById('railHandle');
      const p = document.getElementById('railPanel');
      if (!m || m.classList.contains('panel-open')) return;
      m.classList.add('panel-open');
      if (h) h.setAttribute('aria-expanded', 'true');
      if (p) p.setAttribute('aria-hidden', 'false');
    }
    function closeRailPanel() {
      const m = document.getElementById('main');
      const h = document.getElementById('railHandle');
      const p = document.getElementById('railPanel');
      if (!m || !m.classList.contains('panel-open')) return;
      m.classList.remove('panel-open');
      if (h) h.setAttribute('aria-expanded', 'false');
      if (p) p.setAttribute('aria-hidden', 'true');
    }
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
        flashKey(hotkeyUp);
        flashKey(prevBtn);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
        flashKey(hotkeyDown);
        flashKey(nextBtn);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        openRailPanel();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        closeRailPanel();
      }
    });

    function update() {
      const headerEl = canvasEl.querySelector('.canvas-header');
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 64;
      const scrollTop = canvasEl.scrollTop;
      const canvasRect = canvasEl.getBoundingClientRect();
      const trigger = scrollTop + headerH + 24;

      let newIdx = 0;
      for (let i = 0; i < boards.length; i++) {
        const top = boards[i].getBoundingClientRect().top - canvasRect.top + scrollTop;
        if (top <= trigger) newIdx = i;
      }

      if (newIdx !== currentIdx) {
        currentIdx = newIdx;
        currentEl.textContent = String(currentIdx + 1).padStart(2, '0');
        if (nameEl) nameEl.textContent = sectionLabel(boards[currentIdx]);
      }

      prevBtn.disabled = currentIdx === 0;
      nextBtn.disabled = currentIdx === boards.length - 1;
      if (hotkeyUp) hotkeyUp.disabled = currentIdx === 0;
      if (hotkeyDown) hotkeyDown.disabled = currentIdx === boards.length - 1;
    }

    update();
    canvasEl.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    /* When the user flips between Canvas (canvas_1) and Table (canvas_2),
       refresh the boards list, reset the index to the top of the new tab,
       and update the total count + arrow disabled state. */
    function onTabSwitch() {
      boards = getBoards();
      if (!boards.length) return;
      refreshTotal();
      currentIdx = 0;
      targetIdx = 0;
      if (currentEl) currentEl.textContent = '01';
      if (nameEl) nameEl.textContent = sectionLabel(boards[0]);
      update();
    }
    if (mainEl) {
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.attributeName === 'data-tab') { onTabSwitch(); break; }
        }
      });
      mo.observe(mainEl, { attributes: true, attributeFilter: ['data-tab'] });
    }

    /* Light up the matching arrow on user-driven scroll (mouse wheel / trackpad).
       Skipped during programmatic arrow-nav scroll so we don't double-flash. */
    let lastScrollY = canvasEl.scrollTop;
    let lastWheelFlash = 0;
    canvasEl.addEventListener('scroll', () => {
      const now = Date.now();
      const delta = canvasEl.scrollTop - lastScrollY;
      lastScrollY = canvasEl.scrollTop;
      if (programmaticScroll) return;
      if (Math.abs(delta) < 4) return;
      if (now - lastWheelFlash < 220) return;
      lastWheelFlash = now;
      if (delta > 0) flashKey(nextBtn);
      else flashKey(prevBtn);
    }, { passive: true });

    /* Show on scroll OR when cursor enters bottom-right hover zone; blur-fade after idle */
    let hideTimer = null;
    let inZone = false;
    let onNav = false;
    const IDLE_MS = 1500;
    const ZONE = 160;
    function reveal() {
      nav.classList.add('visible');
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }
    function scheduleHide() {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!inZone && !onNav) nav.classList.remove('visible');
      }, IDLE_MS);
    }
    canvasEl.addEventListener('scroll', () => {
      reveal();
      scheduleHide();
    }, { passive: true });
    canvasEl.addEventListener('mousemove', (e) => {
      const rect = canvasEl.getBoundingClientRect();
      const next = (
        e.clientX >= rect.right - ZONE &&
        e.clientY >= rect.bottom - ZONE
      );
      if (next !== inZone) {
        inZone = next;
        if (inZone) reveal();
        else scheduleHide();
      }
    });
    canvasEl.addEventListener('mouseleave', () => {
      if (inZone) {
        inZone = false;
        scheduleHide();
      }
    });
    nav.addEventListener('mouseenter', () => { onNav = true; reveal(); });
    nav.addEventListener('mouseleave', () => { onNav = false; scheduleHide(); });
    nav.addEventListener('focusin', () => { onNav = true; reveal(); });
    nav.addEventListener('focusout', () => { onNav = false; scheduleHide(); });
    // Initial reveal — flash the nav on page load so the user discovers
    // it exists (auto-hides after IDLE_MS, then reappears on scroll /
    // bottom-right hover zone). Delayed a beat so it lands after the
    // canvas-header settle / brief-stack cascade.
    setTimeout(() => { reveal(); scheduleHide(); }, 600);
  })();

  /* Title dropdown menu (next to Roblox Racing Sample Campaign) */
  (function titleMenu() {
    const chevron = document.getElementById('titleChevron');
    const menu = document.getElementById('titleMenu');
    if (!chevron || !menu) return;

    function close() {
      menu.classList.remove('open');
      chevron.classList.remove('open');
      chevron.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
    chevron.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      chevron.classList.toggle('open', open);
      chevron.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !chevron.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });
    menu.querySelectorAll('.title-menu-item').forEach(item => {
      item.addEventListener('click', () => close());
    });
  })();

  /* Reveal images + bibliography finale cascade as they enter the canvas viewport */
  (function revealOnScroll() {
    const imgSelector = '.brief-cover > img.cover, .brief-cover > video.cover, .aud-hero img, .aud-image-wide img, .aud-image-pair img, .terr-grid img';
    const imgs = document.querySelectorAll(imgSelector);
    imgs.forEach(img => img.classList.add('reveal-img'));

    /* Multiple finale taglines now exist — canvas_1 has the bibliography
       end-card, canvas_2 has the component-library wrap. Observe every
       instance so each fires its in-view cascade independently. */
    const taglines = document.querySelectorAll('.bib-finale-tagline');

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      imgs.forEach(img => img.classList.add('in-view'));
      taglines.forEach(t => t.classList.add('in-view'));
      return;
    }

    const canvas = document.getElementById('canvas');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: canvas || null,
      rootMargin: '0px 0px 80px 0px',
      threshold: 0.04,
    });
    imgs.forEach(img => observer.observe(img));
    taglines.forEach(t => observer.observe(t));
  })();

  /* Smooth lerp scroll on the right-side canvas */
  (function smoothCanvasScroll() {
    const el = document.getElementById('canvas');
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let target = el.scrollTop;
    let current = el.scrollTop;
    let rafId = null;
    let active = false;
    const lerp = 0.09;
    const wheelMultiplier = 0.9;

    function clamp() {
      const max = el.scrollHeight - el.clientHeight;
      if (target < 0) target = 0;
      else if (target > max) target = max;
    }

    function tick() {
      // Yield to an in-flight programmatic scroll (arrow keys / rail-nav
      // clicks). Without this the lerp keeps writing scrollTop each
      // frame and the programmatic smooth-scroll never lands.
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        active = false;
        rafId = null;
        return;
      }
      const diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        el.scrollTop = current;
        active = false;
        rafId = null;
        return;
      }
      current += diff * lerp;
      el.scrollTop = current;
      rafId = requestAnimationFrame(tick);
    }

    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      /* Pass wheel events through to inner scrollable elements (the
         hover-overlay prompt is the only one right now). Without this,
         preventDefault below swallows the wheel before the browser can
         drive the prompt's native overflow scroll. Once the prompt
         bottoms out in the wheel direction, control hands back to the
         canvas lerp scroll. */
      const inner = e.target.closest && e.target.closest('.gco-prompt');
      if (inner) {
        const max = inner.scrollHeight - inner.clientHeight;
        const top = inner.scrollTop;
        const canGoDown = top < max - 1;
        const canGoUp = top > 0;
        if ((e.deltaY > 0 && canGoDown) || (e.deltaY < 0 && canGoUp)) {
          return;
        }
      }
      e.preventDefault();
      if (!active) {
        current = el.scrollTop;
        target = current;
        active = true;
      }
      target += e.deltaY * wheelMultiplier;
      clamp();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: false });

    el.addEventListener('scroll', () => {
      if (!active) {
        target = el.scrollTop;
        current = el.scrollTop;
      }
    }, { passive: true });
  })();

  /* Sibling smooth-lerp for the LEFT chat-stream — pair to
     smoothCanvasScroll above. Matches the canonical Bryan-approved
     "brief project" feel: lerp 0.09, wheelMultiplier 0.9, single
     uniform damping, programmaticScroll yield. Together with the
     smoothWheelChatStream IIFE earlier (DAMP 0.22, same 0.9 mult),
     this gives the chat-stream the same dual-lerp smoothness the
     canvas has on the right side. */
  (function smoothChatStreamScroll() {
    const el = document.getElementById('chatStream');
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let target = el.scrollTop;
    let current = el.scrollTop;
    let rafId = null;
    let active = false;
    const lerp = 0.09;
    const wheelMultiplier = 0.9;

    function clamp() {
      const max = el.scrollHeight - el.clientHeight;
      if (target < 0) target = 0;
      else if (target > max) target = max;
    }

    function tick() {
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        active = false;
        rafId = null;
        return;
      }
      const diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        el.scrollTop = current;
        active = false;
        rafId = null;
        return;
      }
      current += diff * lerp;
      el.scrollTop = current;
      rafId = requestAnimationFrame(tick);
    }

    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      if (!active) {
        current = el.scrollTop;
        target = current;
        active = true;
      }
      target += e.deltaY * wheelMultiplier;
      clamp();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: false });

    el.addEventListener('scroll', () => {
      if (!active) {
        target = el.scrollTop;
        current = el.scrollTop;
      }
    }, { passive: true });
  })();

  /* Dual-lerp smooth scroll for the CHAT HAT body — same canonical
     config as the chat-stream + canvas (DAMP 0.22 wheel-tail + lerp
     0.09 settle, both with 0.9 multiplier). Bound to the chat-aux-body
     element which scrolls when prompt-active with many options.
     Both IIFEs early-out when the body isn't actually scrollable so
     they don't preventDefault on wheel events that should pass to
     the page. */
  (function smoothWheelChatHat() {
    const el = document.querySelector('#chatAuxPanel .chat-aux-body');
    if (!el) return;
    let target = null;
    let raf = null;
    const DAMP = 0.22;
    function animate() {
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        el.style.scrollBehavior = '';
        target = null;
        raf = null;
        return;
      }
      const current = el.scrollTop;
      const remaining = target - current;
      if (Math.abs(remaining) < 0.4) {
        el.scrollTop = target;
        el.style.scrollBehavior = '';
        target = null;
        raf = null;
        return;
      }
      el.scrollTop = current + remaining * DAMP;
      raf = requestAnimationFrame(animate);
    }
    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // Skip if the body isn't actually scrollable — let the event
      // bubble to the page so the user can still scroll the chrome.
      if (el.scrollHeight - el.clientHeight < 1) return;
      e.preventDefault();
      e.stopPropagation();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const delta = e.deltaY * unit * 0.9;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (target === null) target = el.scrollTop;
      target = Math.max(0, Math.min(maxScroll, target + delta));
      if (!raf) {
        el.style.scrollBehavior = 'auto';
        raf = requestAnimationFrame(animate);
      }
    }, { passive: false });
    el.addEventListener('scroll', () => {
      if (raf === null) target = null;
    }, { passive: true });
  })();

  (function smoothChatHatScroll() {
    const el = document.querySelector('#chatAuxPanel .chat-aux-body');
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let target = el.scrollTop;
    let current = el.scrollTop;
    let rafId = null;
    let active = false;
    const lerp = 0.09;
    const wheelMultiplier = 0.9;

    function clamp() {
      const max = el.scrollHeight - el.clientHeight;
      if (target < 0) target = 0;
      else if (target > max) target = max;
    }

    function tick() {
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        active = false;
        rafId = null;
        return;
      }
      const diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        el.scrollTop = current;
        active = false;
        rafId = null;
        return;
      }
      current += diff * lerp;
      el.scrollTop = current;
      rafId = requestAnimationFrame(tick);
    }

    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      if (el.scrollHeight - el.clientHeight < 1) return;
      e.preventDefault();
      if (!active) {
        current = el.scrollTop;
        target = current;
        active = true;
      }
      target += e.deltaY * wheelMultiplier;
      clamp();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: false });

    el.addEventListener('scroll', () => {
      if (!active) {
        target = el.scrollTop;
        current = el.scrollTop;
      }
    }, { passive: true });
  })();

