/*
 * Toast — verbatim extractions (transient notifications).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ab from '../_extract/snippets/omni-agent-builder.js';

export default { title: 'Components/Toast', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Toast");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentsStore = { ...s('agents-store', as.toast), name: "Agents Store — toast notification" };
registerArchived('agents-store', 'toast', as.toast);
export const AgentBuilder = { ...s('omni-agent-builder', ab.toast), name: "Agent Builder — toast notification" };
