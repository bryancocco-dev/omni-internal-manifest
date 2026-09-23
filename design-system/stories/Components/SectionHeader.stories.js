/*
 * Section header — verbatim extractions, one export per source project.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import ptw from '../_extract/snippets/publish-to-workspace.js';

export default { title: 'Components/SectionHeader', parameters: { layout: 'fullscreen' } };

const s = storiesFor("SectionHeader");

export const AgentsStore = { ...s('agents-store', as.sectionheader), name: "Agents Store — section header" };
export const ChatHat = { ...s('chat-hat', ch.sectionheader), name: "Chat Hat — section header" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.sectionheader), name: "Agent Builder — section header" };
registerArchived('omni-agent-builder', 'sectionheader', ab.sectionheader);
export const AgentBuilderPane = { ...s('omni-agent-builder', ab.sectionheader_pane, { name: 'Agent Builder — pane head' }), name: "Agent Builder — pane head" };
export const Media = { ...s('media', md.sectionheader), name: "Media — section header" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.sectionheader), name: "Brief — section header" };
export const BriefTerritory = { ...s('lease-campaign-brief-handoff', br.sectionheader_territory, { name: 'Brief — territory header' }), name: "Brief — territory header" };
export const PublishSectionHeader = { ...s('publish-to-workspace', ptw.sectionheader_published, { name: 'Publish — "Published from Canvas" band header' }), name: "Publish — \"Published from Canvas\" band header" };
