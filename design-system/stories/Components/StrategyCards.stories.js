/*
 * StrategyCards — verbatim extractions (Canvas QA's scenario-plan comparison
 * cards and strategic-tension grid cards).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cqa from '../_extract/snippets/canvas-qa.js';

export default { title: 'Components/StrategyCards', parameters: { layout: 'fullscreen' } };

const s = storiesFor("StrategyCards");

export const Plan = { ...s('canvas-qa', cqa.plan, { name: 'QA — scenario plan comparison' }), name: "QA — scenario plan comparison" };
export const Tension = { ...s('canvas-qa', cqa.tension, { name: 'QA — strategic tension grid' }), name: "QA — strategic tension grid" };
