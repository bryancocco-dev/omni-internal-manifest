/*
 * Interstitial — verbatim extractions (full-canvas transition covers shown
 * mid-crossing: workspace switching, and the Canvas Workflows mode takeover).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import sc from '../_extract/snippets/switching-canvas.js';
import cw from '../_extract/snippets/canvas-workflows.js';

export default { title: 'Components/Interstitial', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Interstitial");

export const Switching = { ...s('switching-canvas', sc.interstitial, { name: 'Switching — workspace transit cover' }), name: "Switching — workspace transit cover" };
export const WorkflowsTakeover = { ...s('canvas-workflows', cw.overlay_workflowtakeover, { name: 'Workflows — mode-switch takeover overlay' }), name: "Workflows — mode-switch takeover overlay" };
