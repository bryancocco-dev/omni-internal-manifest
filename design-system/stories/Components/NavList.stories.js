/*
 * NavList — verbatim extractions of the in-rail navigation lists.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/NavList', parameters: { layout: 'fullscreen' } };

const s = storiesFor("NavList");

export const AgentsStore = { ...s('agents-store', as.navlist), name: "Agents Store — rail navigation list" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.navlist), name: "Chat Hat — rail navigation list" };
registerArchived('chat-hat', 'navlist', ch.navlist);
export const AgentBuilder = { ...s('omni-agent-builder', ab.navlist), name: "Agent Builder — rail navigation list" };
export const AgentBuilderFiles = { ...s('omni-agent-builder', ab.navlist_files, { name: 'Agent Builder — creative files' }), name: "Agent Builder — creative files" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.navlist), name: "Media — rail navigation list" };
registerArchived('media', 'navlist', md.navlist);
export const Brief = { ...s('lease-campaign-brief-handoff', br.navlist), name: "Brief — rail navigation list" };
