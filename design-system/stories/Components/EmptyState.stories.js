/*
 * EmptyState — verbatim extractions (empty list / no-data placeholders).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';

export default { title: 'Components/EmptyState', parameters: { layout: 'fullscreen' } };

const s = storiesFor("EmptyState");

export const ChatHat = { ...s('chat-hat', ch.emptystate), name: "Chat Hat — empty state" };
export const AgentBuilder = { ...s('omni-agent-builder', ab.emptystate), name: "Agent Builder — empty state" };
