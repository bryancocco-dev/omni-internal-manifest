/*
 * Charts — verbatim extractions (Chart.js-driven analytics visuals: doughnut
 * ring, vertical bar chart, auto-rotating chart carousel card).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import ms from '../_extract/snippets/media-skills.js';
import gw from '../_extract/snippets/gateway-v2.js';

export default { title: 'Components/Charts', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Charts");

export const QaRadial = { ...s('canvas-qa', cqa.radial, { name: 'QA — multi-ring radial chart' }), name: "QA — multi-ring radial chart" };
export const MediaSkillsBar = { ...s('media-skills', ms.chart_bar, { name: 'Media Skills — demographic bar chart' }), name: "Media Skills — demographic bar chart" };
export const GatewayCarousel = { ...s('gateway-v2', gw.chart_carousel, { name: 'Gateway — auto-rotating chart carousel' }), name: "Gateway — auto-rotating chart carousel" };
