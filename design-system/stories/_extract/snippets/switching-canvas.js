// AUTO-EXTRACTED verbatim markup from switching-canvas/canvas/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_workspaceswitch: {
    note: '.ws-gate (.ws-gate-card) — workspace-boundary confirm dialog: stacked origin→destination crossing indicator (animated rail + charge, reduced-motion aware) above title/body and full-width Continue/Cancel (shown open)',
    minHeight: 518,
    html: `<div class="ws-gate open" id="wsGate" role="dialog" aria-modal="true" aria-labelledby="wsGateTitle" aria-hidden="false" style="position:static;opacity:1;pointer-events:auto">
  <div class="ws-gate-card">
    <div class="ws-gate-head">
      <span class="ws-gate-node">
        <span class="ws-gate-dot">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 16 Q 5 8 9.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M19 16 Q 19 8 14.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 16 L 12 8 L 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="ws-gate-node-txt">
          <span class="ws-gate-node-lbl">You are in</span>
          <span class="ws-gate-node-name">Omnicom Precision Marketing</span>
        </span>
      </span>
      <div class="ws-gate-rail" aria-hidden="true"><i class="ws-gate-charge"></i></div>
      <span class="ws-gate-node ws-gate-node--to">
        <span class="ws-gate-dot"><i class="ws-gate-mark" aria-hidden="true"></i></span>
        <span class="ws-gate-node-txt">
          <span class="ws-gate-node-lbl">Opening in</span>
          <span class="ws-gate-node-name">Corvache Automotive</span>
        </span>
      </span>
    </div>

    <div class="ws-gate-body-wrap">
      <h2 class="ws-gate-title" id="wsGateTitle">You're about to switch workspaces</h2>
      <p class="ws-gate-body">Opening <strong>Progress 2026</strong> moves you into Corvache. Your own work stays where it is.</p>

      <div class="ws-gate-actions">
        <button class="ws-gate-btn ws-gate-btn--go" id="wsGateGo" type="button">Continue</button>
        <button class="ws-gate-btn ws-gate-btn--cancel" id="wsGateCancel" type="button">Cancel</button>
      </div>
    </div>
  </div>
</div>`
  },

  interstitial: {
    note: '.ws-transit — full-bleed "switching workspace" cover with OMNI mark, destination name, and a self-drawing progress rule (shown open; used on the return crossing, not the initial Continue)',
    minHeight: 268,
    html: `<div class="ws-transit open" id="wsTransit" aria-hidden="false" style="position:static;opacity:1;pointer-events:auto">
  <div class="ws-transit-inner">
    <img class="ws-transit-mark" src="omni-logo.svg" alt="OMNI" />
    <div class="ws-transit-lbl">Switching workspace</div>
    <div class="ws-transit-name">Corvache Automotive</div>
    <div class="ws-transit-track"></div>
  </div>
</div>`
  },
}
