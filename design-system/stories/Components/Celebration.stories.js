/*
 * Celebration — verbatim extraction (Agent Builder "agent ready" starfield overlay).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ab from '../_extract/snippets/omni-agent-builder.js';

export default { title: 'Components/Celebration', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Celebration");

export const AgentBuilder = { ...s('omni-agent-builder', ab.celebration), name: "Agent Builder — celebration overlay" };
