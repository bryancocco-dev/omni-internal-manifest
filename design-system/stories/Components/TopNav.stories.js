/*
 * TopNav — verbatim extractions, one export per source project. The same
 * component type across projects sits side by side so duplicates are visible.
 * Markup + CSS are lifted byte-for-byte from each project; see _extract/snippets/.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import csd from '../_extract/snippets/canvas-share-demos.js';

export default { title: 'Components/TopNav', parameters: { layout: 'fullscreen' } };

const s = storiesFor("TopNav");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentsStore = { ...s('agents-store', as.topnav), name: "Agents Store — global top-nav bar" };
registerArchived('agents-store', 'topnav', as.topnav);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.topnav), name: "Chat Hat — global top-nav bar" };
registerArchived('chat-hat', 'topnav', ch.topnav);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const AgentBuilder = { ...s('omni-agent-builder', ab.topnav), name: "Agent Builder — global top-nav bar" };
registerArchived('omni-agent-builder', 'topnav', ab.topnav);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.topnav), name: "Media — global top-nav bar" };
registerArchived('media', 'topnav', md.topnav);
export const Brief = { ...s('lease-campaign-brief-handoff', br.topnav), name: "Brief — global top-nav bar" };
export const ShareDemosHeader = { ...s('canvas-share-demos', csd.header, { name: 'Share Demos — read-only viewer header' }), name: "Share Demos — read-only viewer header" };
