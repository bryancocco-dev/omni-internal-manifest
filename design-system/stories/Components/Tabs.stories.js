/*
 * Tabs — verbatim extractions, one export per source project.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import ca from '../_extract/snippets/copy-agent.js';

export default { title: 'Components/Tabs', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Tabs");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentsStore = { ...s('agents-store', as.tabs), name: "Agents Store — canvas / content tabs" };
registerArchived('agents-store', 'tabs', as.tabs);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.tabs), name: "Chat Hat — canvas / content tabs" };
registerArchived('chat-hat', 'tabs', ch.tabs);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.tabs), name: "Agent Builder — canvas / content tabs" };
registerArchived('omni-agent-builder', 'tabs', ab.tabs);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.tabs), name: "Media — canvas / content tabs" };
registerArchived('media', 'tabs', md.tabs);
export const Brief = { ...s('lease-campaign-brief-handoff', br.tabs), name: "Brief — canvas / content tabs" };
export const CopyAgentHeaderTabs = { ...s('copy-agent', ca.headertabs, { name: 'Copy Agent — content tabs + search header' }), name: "Copy Agent — content tabs + search header" };
