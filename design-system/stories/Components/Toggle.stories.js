/*
 * Toggle — verbatim extractions (dip-switch / checkbox / pill switches).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Toggle', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Toggle");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.toggle), name: "Chat Hat — toggle switch" };
registerArchived('chat-hat', 'toggle', ch.toggle);
export const AgentBuilder = { ...s('omni-agent-builder', ab.toggle), name: "Agent Builder — toggle switch" };
export const AgentBuilderPill = { ...s('omni-agent-builder', ab.toggle_ds, { name: 'Agent Builder — pill switch' }), name: "Agent Builder — pill switch" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.toggle), name: "Media — toggle switch" };
registerArchived('media', 'toggle', md.toggle);
export const Brief = { ...s('lease-campaign-brief-handoff', br.toggle), name: "Brief — toggle switch" };
