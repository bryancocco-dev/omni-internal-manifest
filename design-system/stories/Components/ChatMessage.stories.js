/*
 * ChatMessage — verbatim extractions (chat bubbles, from each project's JS templates).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import om from '../_extract/snippets/omni-manifest.js';

export default { title: 'Components/ChatMessage', parameters: { layout: 'fullscreen' } };

const s = storiesFor("ChatMessage");

export const ChatHat = { ...s('chat-hat', ch.chatmessage), name: "Chat Hat — chat message bubble" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.chatmessage), name: "Media — chat message bubble" };
registerArchived('media', 'chatmessage', md.chatmessage);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.chatmessage), name: "Brief — chat message bubble" };
registerArchived('lease-campaign-brief-handoff', 'chatmessage', br.chatmessage);
export const ManifestSystemNote = { ...s('omni-manifest', om.chatmessage_systemnote, { name: 'Manifest — mode-change system note' }), name: "Manifest — mode-change system note" };
