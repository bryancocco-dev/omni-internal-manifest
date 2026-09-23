/*
 * PanelSwitch — verbatim extractions (the chat/brief aux-panel switcher control).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/PanelSwitch', parameters: { layout: 'fullscreen' } };

const s = storiesFor("PanelSwitch");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.panelswitch), name: "Chat Hat — panel switcher" };
registerArchived('chat-hat', 'panelswitch', ch.panelswitch);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.panelswitch), name: "Media — panel switcher" };
registerArchived('media', 'panelswitch', md.panelswitch);
export const Brief = { ...s('lease-campaign-brief-handoff', br.panelswitch), name: "Brief — panel switcher" };
