/*
 * Input — verbatim extractions (chat composers, text fields, search, code,
 * dropzone, slider). Agent Builder ships the widest set of form controls.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Input', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Input");

export const AgentsStore = { ...s('agents-store', as.input), name: "Agents Store — input field" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.input), name: "Chat Hat — input field" };
registerArchived('chat-hat', 'input', ch.input);
export const AgentBuilder = { ...s('omni-agent-builder', ab.input), name: "Agent Builder — input field" };
export const AgentBuilderTextarea = { ...s('omni-agent-builder', ab.textarea, { name: 'Agent Builder — textarea' }), name: "Agent Builder — textarea" };
export const AgentBuilderSearch = { ...s('omni-agent-builder', ab.search, { name: 'Agent Builder — search' }), name: "Agent Builder — search" };
export const AgentBuilderCode = { ...s('omni-agent-builder', ab.code, { name: 'Agent Builder — code editor' }), name: "Agent Builder — code editor" };
export const AgentBuilderDropzone = { ...s('omni-agent-builder', ab.dropzone, { name: 'Agent Builder — dropzone' }), name: "Agent Builder — dropzone" };
export const AgentBuilderSlider = { ...s('omni-agent-builder', ab.slider, { name: 'Agent Builder — slider' }), name: "Agent Builder — slider" };
export const Media = { ...s('media', md.input), name: "Media — input field" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.input), name: "Brief — input field" };
registerArchived('lease-campaign-brief-handoff', 'input', br.input);
