import { renderDoc } from '../../shared/components/renderer.js';

const content = await fetch('../../shared/content/corvash-strategist.json').then((r) => r.json());
renderDoc(document.getElementById('doc-root'), content, 'corvash-strategist');
