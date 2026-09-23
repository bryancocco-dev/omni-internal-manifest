/*
 * Segmented — verbatim extractions (filter pill bars / settings segmented controls).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Segmented', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Segmented");

export const AgentsStore = { ...s('agents-store', as.segmented), name: "Agents Store — segmented control" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.segmented), name: "Brief — segmented control" };
