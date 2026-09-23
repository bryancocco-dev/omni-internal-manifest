/*
 * Modal — verbatim extractions (app / version-history / confirm / delete dialogs).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cbe from '../_extract/snippets/canvas-book-ends.js';
import csd from '../_extract/snippets/canvas-share-demos.js';
import ca from '../_extract/snippets/copy-agent.js';
import cra from '../_extract/snippets/copy-request-access.js';
import om from '../_extract/snippets/omni-manifest.js';
import sc from '../_extract/snippets/switching-canvas.js';
import th from '../_extract/snippets/themes.js';

export default { title: 'Components/Modal', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Modal");

export const AgentsStore = { ...s('agents-store', as.modal), name: "Agents Store — modal dialog" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.modal), name: "Agent Builder — modal dialog" };
registerArchived('omni-agent-builder', 'modal', ab.modal);
export const AgentBuilderConfirm = { ...s('omni-agent-builder', ab.modal_confirm, { name: 'Agent Builder — confirm' }), name: "Agent Builder — confirm" };
export const AgentBuilderIconPicker = { ...s('omni-agent-builder', ab.modal_iconpicker, { name: 'Agent Builder — icon picker' }), name: "Agent Builder — icon picker" };
export const Media = { ...s('media', md.modal), name: "Media — modal dialog" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.modal), name: "Brief — modal dialog" };
registerArchived('lease-campaign-brief-handoff', 'modal', br.modal);
export const BriefDelete = { ...s('lease-campaign-brief-handoff', br.modal_delete, { name: 'Brief — delete' }), name: "Brief — delete" };
export const BookEndsCoverLab = { ...s('canvas-book-ends', cbe.modal_coverlab, { name: 'Book Ends — cover lab picker' }), name: "Book Ends — cover lab picker" };
export const ShareDemosGate = { ...s('canvas-share-demos', csd.gate, { name: 'Share Demos — access gate' }), name: "Share Demos — access gate" };
export const ShareDemosShare = { ...s('canvas-share-demos', csd.sharemodal, { name: 'Share Demos — share flyout' }), name: "Share Demos — share flyout" };
export const CopyAgentDestination = { ...s('copy-agent', ca.modal_copydest, { name: 'Copy Agent — destination picker' }), name: "Copy Agent — destination picker" };
export const AccessShare = { ...s('copy-request-access', cra.modal_share, { name: 'Access — share flyout' }), name: "Access — share flyout" };
export const AccessGateNeed = { ...s('copy-request-access', cra.modal_gate_need, { name: 'Access — you need access' }), name: "Access — you need access" };
export const AccessGateSent = { ...s('copy-request-access', cra.modal_gate_sent, { name: 'Access — request sent' }), name: "Access — request sent" };
export const AccessGateGranted = { ...s('copy-request-access', cra.modal_gate_granted, { name: 'Access — request granted' }), name: "Access — request granted" };
export const ManifestCompare = { ...s('omni-manifest', om.modal_compare, { name: 'Manifest — Light vs Full compare' }), name: "Manifest — Light vs Full compare" };
export const ManifestGateway = { ...s('omni-manifest', om.modal_gateway, { name: 'Manifest — opens the Canvas confirm' }), name: "Manifest — opens the Canvas confirm" };
export const ManifestAgentPicker = { ...s('omni-manifest', om.modal_agentpicker, { name: 'Manifest — required agents picker' }), name: "Manifest — required agents picker" };
export const SwitchingWorkspace = { ...s('switching-canvas', sc.modal_workspaceswitch, { name: 'Switching — workspace boundary confirm' }), name: "Switching — workspace boundary confirm" };
export const ThemesEditor = { ...s('themes', th.modal_themeeditor, { name: 'Themes — create your own theme' }), name: "Themes — create your own theme" };
