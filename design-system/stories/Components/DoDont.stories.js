/*
 * DoDont — verbatim extraction (Canvas QA's mirrored do/don't comparison grid).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cqa from '../_extract/snippets/canvas-qa.js';

export default { title: 'Components/DoDont', parameters: { layout: 'fullscreen' } };

const s = storiesFor("DoDont");

export const Qa = { ...s('canvas-qa', cqa.dodont), name: "QA — do / don't comparison" };
