/*
 * Lookbook — verbatim extraction (Canvas Graphics style-picker grid).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cg from '../_extract/snippets/canvas-graphics.js';

export default { title: 'Components/Lookbook', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Lookbook");

export const Graphics = { ...s('canvas-graphics', cg.lookbook), name: "Graphics — style lookbook picker" };
