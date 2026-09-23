/*
 * Stats — verbatim extractions (metric / KPI / stat-tile treatments).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import ms from '../_extract/snippets/media-skills.js';

export default { title: 'Components/Stats', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Stats");

export const QaKpi = { ...s('canvas-qa', cqa.kpi, { name: 'QA — unified KPI / stat card' }), name: "QA — unified KPI / stat card" };
export const MediaSkillsStatTile = { ...s('media-skills', ms.stattile, { name: 'Media Skills — stat tile row' }), name: "Media Skills — stat tile row" };
