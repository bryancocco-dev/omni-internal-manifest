/*
 * Side rail / section nav — verbatim extractions, one export per source project.
 * Two families ship across the projects (the .section-nav column in
 * agents-store / agent-builder, and the .side-rail tool column in the OMNI+
 * chat surfaces) and are kept as sibling stories so both are visible.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cw from '../_extract/snippets/canvas-workflows.js';

export default { title: 'Components/SideRail', parameters: { layout: 'fullscreen' } };

const s = storiesFor("SideRail");

export const AgentsStore = { ...s('agents-store', as.siderail), name: "Agents Store — vertical side rail" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.siderail), name: "Chat Hat — vertical side rail" };
registerArchived('chat-hat', 'siderail', ch.siderail);
export const AgentBuilder = { ...s('omni-agent-builder', ab.siderail), name: "Agent Builder — vertical side rail" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.siderail), name: "Media — vertical side rail" };
registerArchived('media', 'siderail', md.siderail);
export const Brief = { ...s('lease-campaign-brief-handoff', br.siderail), name: "Brief — vertical side rail" };
export const WorkflowsIcons = { ...s('canvas-workflows', cw.siderail_workflowicons, { name: 'Workflows — rail tool icons (5th icon)' }), name: "Workflows — rail tool icons (5th icon)" };
