/*
 * Venn — verbatim extractions (audience-overlap / segment-sizing bubble diagrams).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import ms from '../_extract/snippets/media-skills.js';

export default { title: 'Components/Venn', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Venn");

export const QaVenn = { ...s('canvas-qa', cqa.venn, { name: 'QA — geo-coded audience bubble chart' }), name: "QA — geo-coded audience bubble chart" };
export const MediaSkillsVenn = { ...s('media-skills', ms.chart_venn, { name: 'Media Skills — audience-overlap Venn' }), name: "Media Skills — audience-overlap Venn" };
