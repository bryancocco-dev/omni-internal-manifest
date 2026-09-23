// AUTO-EXTRACTED verbatim markup from canvas-workflows/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
//
// CAVEAT: this project's actual React Flow builder (toolbar, block palette,
// node cards, canvas, edges) is mounted entirely at runtime by src/main.jsx
// into #workflow-root — none of that DOM exists in the static index.html
// (zero "react-flow" occurrences in the file). The only new, verbatim
// markup this project adds to the shell is the 4 new rail-tool buttons and
// the overlay host that React mounts into, captured below. The overlay's
// inner content is shown as a labeled placeholder, not invented markup.
export default {
  siderail_workflowicons: {
    note: '.rail-tools — 4 new rail-tool buttons this project adds to the base siderail (Skills, Light Canvas, Canvas view, Workflow builder — the 5th/newest icon, shown active/open)',
    minHeight: 260,
    pad: '0',
    html: `<div style="position:relative;width:80px;height:240px;background:var(--nav-bg,#fff)">
      <div class="rail-tools" role="group" aria-label="Workspace tools">
        <button class="rail-tool rail-tool-skills" type="button" aria-label="Skills" data-tip="rich">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path class="rail-tool-skill-star" d="M12 3.2 L13.7 8.3 L18.8 10 L13.7 11.7 L12 16.8 L10.3 11.7 L5.2 10 L10.3 8.3 Z"/>
            <path class="rail-tool-skill-spark rail-tool-skill-spark-a" d="M18 15.2 L18.7 17.1 L20.6 17.8 L18.7 18.5 L18 20.4 L17.3 18.5 L15.4 17.8 L17.3 17.1 Z"/>
            <path class="rail-tool-skill-spark rail-tool-skill-spark-b" d="M6.4 14.6 L6.9 16 L8.3 16.5 L6.9 17 L6.4 18.4 L5.9 17 L4.5 16.5 L5.9 16 Z"/>
          </svg>
          <span class="rail-tool-tip" id="skillsRailTip" aria-hidden="true">
            <span class="rail-tool-tip-title">Skills</span>
            <span class="rail-tool-tip-body"><strong data-tip-x>0</strong> of <strong data-tip-y>0</strong> skills are available in this Canvas</span>
          </span>
        </button>
        <button class="rail-tool rail-tool-light" type="button" aria-label="Light Canvas" data-tooltip="Light Canvas">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path class="rail-tool-bolt-path" d="M13.6 2.5 6.4 13.2h4.3l-1.3 8.3 7.2-10.7h-4.3z"/>
          </svg>
        </button>
        <button class="rail-tool rail-tool-canvasview" type="button" aria-label="Canvas view" data-tooltip="Canvas view">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2"/>
            <path d="M3.5 10h17"/>
            <path d="M12 10v9.5"/>
          </svg>
        </button>
        <button class="rail-tool rail-tool-workflow active" type="button" aria-label="Workflow builder" data-tooltip="Workflow builder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2.5" y="4.5" width="7.5" height="6" rx="1.5"/>
            <rect class="rail-tool-wf-node-b" x="14" y="13.5" width="7.5" height="6" rx="1.5"/>
            <path class="rail-tool-wf-wire" d="M10 7.5h3.5a2.5 2.5 0 0 1 2.5 2.5v3.5"/>
          </svg>
        </button>
      </div>
    </div>`
  },

  overlay_workflowtakeover: {
    note: '.workflow-overlay — full-canvas mode-switch overlay (fade-in/eased-fade-out, visibility-not-display so React Flow gets a real first measurement) that the 5th rail icon opens; #workflow-root is the React mount point — its content (toolbar, block palette, node cards, canvas, edges) is 100% runtime and not present in static markup',
    minHeight: 320,
    pad: '0',
    html: `<div class="workflow-overlay is-open" style="position:relative;inset:auto;height:320px;">
      <div id="workflow-root" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-subtle);font:13px/1.5 var(--font-mono, monospace);text-align:center;padding:24px;border:1px dashed var(--line);box-sizing:border-box;">
        React Flow builder mounts here at runtime — toolbar, block palette,<br/>node cards, canvas &amp; edges are rendered by src/main.jsx, not static HTML.
      </div>
    </div>`
  }
};
