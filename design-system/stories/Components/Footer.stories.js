/*
 * Footer — verbatim extractions (page footers).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Footer', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Footer");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentsStore = { ...s('agents-store', as.footer), name: "Agents Store — page footer" };
registerArchived('agents-store', 'footer', as.footer);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.footer), name: "Agent Builder — page footer" };
registerArchived('omni-agent-builder', 'footer', ab.footer);
export const Brief = { ...s('lease-campaign-brief-handoff', br.footer), name: "Brief — page footer" };
