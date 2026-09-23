/*
 * Receipt — verbatim extraction (Copy Agent's post-copy destination receipt).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ca from '../_extract/snippets/copy-agent.js';

export default { title: 'Components/Receipt', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Receipt");

export const CopyAgent = { ...s('copy-agent', ca.receipt), name: "Copy Agent — post-copy receipt" };
