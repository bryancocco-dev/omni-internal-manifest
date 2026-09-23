/*
 * Avatar — verbatim extractions (presence / profile avatars).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Avatar', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Avatar");

export const AgentsStore = { ...s('agents-store', as.avatar), name: "Agents Store — avatar / presence stack" };
export const ChatHat = { ...s('chat-hat', ch.avatar), name: "Chat Hat — avatar / presence stack" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.avatar), name: "Agent Builder — avatar / presence stack" };
registerArchived('omni-agent-builder', 'avatar', ab.avatar);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.avatar), name: "Media — avatar / presence stack" };
registerArchived('media', 'avatar', md.avatar);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.avatar), name: "Brief — avatar / presence stack" };
registerArchived('lease-campaign-brief-handoff', 'avatar', br.avatar);
