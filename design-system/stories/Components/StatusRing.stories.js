/*
 * StatusRing — verbatim extraction (Agent Builder fidelity ring / status circles).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ab from '../_extract/snippets/omni-agent-builder.js';

export default { title: 'Components/StatusRing', parameters: { layout: 'fullscreen' } };

const s = storiesFor("StatusRing");

export const AgentBuilder = { ...s('omni-agent-builder', ab.statusring), name: "Agent Builder — fidelity meter" };
