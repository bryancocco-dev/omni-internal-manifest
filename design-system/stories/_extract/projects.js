/*
 * Registers every source project's verbatim CSS + real head <link>s so the
 * catalog can render their components inside isolated iframes. Importing this
 * module (for its side effects) makes extracted({ source }) work for any slug
 * listed below. CSS/head files are produced by scripts/extract-project-css.mjs.
 */
import { register } from './lib.js';

import agentsStoreCss from './agents-store.css?raw';
import agentsStoreHead from './agents-store.head.html?raw';
register('agents-store', { label: 'Agents Store', css: agentsStoreCss, head: agentsStoreHead });

import chatHatCss from './chat-hat.css?raw';
import chatHatHead from './chat-hat.head.html?raw';
register('chat-hat', { label: 'Chat Hat', css: chatHatCss, head: chatHatHead });

import agentBuilderCss from './omni-agent-builder.css?raw';
import agentBuilderHead from './omni-agent-builder.head.html?raw';
register('omni-agent-builder', { label: 'Agent Builder', css: agentBuilderCss, head: agentBuilderHead });

import mediaCss from './media.css?raw';
import mediaHead from './media.head.html?raw';
register('media', { label: 'Media', css: mediaCss, head: mediaHead });

import gawdtableCss from './gawdtable.css?raw';
import gawdtableHead from './gawdtable.head.html?raw';
register('gawdtable', { label: 'Gawdtable', css: gawdtableCss, head: gawdtableHead });

import briefCss from './lease-campaign-brief-handoff.css?raw';
import briefHead from './lease-campaign-brief-handoff.head.html?raw';
register('lease-campaign-brief-handoff', { label: 'Brief', css: briefCss, head: briefHead });

import personaCss from './persona-subnav.css?raw';
import personaHead from './persona-subnav.head.html?raw';
register('persona-subnav', { label: 'Persona', css: personaCss, head: personaHead });

import adminCss from './admin.css?raw';
import adminHead from './admin.head.html?raw';
register('admin', { label: 'Admin', css: adminCss, head: adminHead });

import canvasBookEndsCss from './canvas-book-ends.css?raw';
import canvasBookEndsHead from './canvas-book-ends.head.html?raw';
register('canvas-book-ends', { label: 'Book Ends', css: canvasBookEndsCss, head: canvasBookEndsHead });

import canvasCollabCss from './canvas-collab.css?raw';
import canvasCollabHead from './canvas-collab.head.html?raw';
register('canvas-collab', { label: 'Collab', css: canvasCollabCss, head: canvasCollabHead });

import canvasExportsCss from './canvas-exports.css?raw';
import canvasExportsHead from './canvas-exports.head.html?raw';
register('canvas-exports', { label: 'Exports', css: canvasExportsCss, head: canvasExportsHead });

import canvasGraphicsCss from './canvas-graphics.css?raw';
import canvasGraphicsHead from './canvas-graphics.head.html?raw';
register('canvas-graphics', { label: 'Graphics', css: canvasGraphicsCss, head: canvasGraphicsHead });

import canvasPdfTablesCss from './canvas-pdf-tables.css?raw';
import canvasPdfTablesHead from './canvas-pdf-tables.head.html?raw';
register('canvas-pdf-tables', { label: 'PDF Tables', css: canvasPdfTablesCss, head: canvasPdfTablesHead });

import canvasQaCss from './canvas-qa.css?raw';
import canvasQaHead from './canvas-qa.head.html?raw';
register('canvas-qa', { label: 'QA', css: canvasQaCss, head: canvasQaHead });

import canvasShareDemosCss from './canvas-share-demos.css?raw';
import canvasShareDemosHead from './canvas-share-demos.head.html?raw';
register('canvas-share-demos', { label: 'Share Demos', css: canvasShareDemosCss, head: canvasShareDemosHead });

import canvasWorkflowsCss from './canvas-workflows.css?raw';
import canvasWorkflowsHead from './canvas-workflows.head.html?raw';
register('canvas-workflows', { label: 'Workflows', css: canvasWorkflowsCss, head: canvasWorkflowsHead });

import copyAgentCss from './copy-agent.css?raw';
import copyAgentHead from './copy-agent.head.html?raw';
register('copy-agent', { label: 'Copy Agent', css: copyAgentCss, head: copyAgentHead });

import copyRequestAccessCss from './copy-request-access.css?raw';
import copyRequestAccessHead from './copy-request-access.head.html?raw';
register('copy-request-access', { label: 'Access', css: copyRequestAccessCss, head: copyRequestAccessHead });

import gatewayV2Css from './gateway-v2.css?raw';
import gatewayV2Head from './gateway-v2.head.html?raw';
register('gateway-v2', { label: 'Gateway', css: gatewayV2Css, head: gatewayV2Head });

import mediaSkillsCss from './media-skills.css?raw';
import mediaSkillsHead from './media-skills.head.html?raw';
register('media-skills', { label: 'Media Skills', css: mediaSkillsCss, head: mediaSkillsHead });

import omniManifestCss from './omni-manifest.css?raw';
import omniManifestHead from './omni-manifest.head.html?raw';
register('omni-manifest', { label: 'Manifest', css: omniManifestCss, head: omniManifestHead });

import publishToWorkspaceCss from './publish-to-workspace.css?raw';
import publishToWorkspaceHead from './publish-to-workspace.head.html?raw';
register('publish-to-workspace', { label: 'Publish', css: publishToWorkspaceCss, head: publishToWorkspaceHead });

import switchingCanvasCss from './switching-canvas.css?raw';
import switchingCanvasHead from './switching-canvas.head.html?raw';
register('switching-canvas', { label: 'Switching', css: switchingCanvasCss, head: switchingCanvasHead });

import themesCss from './themes.css?raw';
import themesHead from './themes.head.html?raw';
register('themes', { label: 'Themes', css: themesCss, head: themesHead });

import translationsCss from './translations.css?raw';
import translationsHead from './translations.head.html?raw';
register('translations', { label: 'Translations', css: translationsCss, head: translationsHead });

// ── snippet registry ─────────────────────────────────────────────────────────
// Register every snippet module's entries into lib.js's object->key reverse
// map, so story() can identify exactly which snippet each story renders (the
// curation/archive system matches at snippet-key granularity). Negative glob
// skips helper modules like _version-history.js.
import { registerSnippets } from './lib.js';
const SNIPPET_MODULES = import.meta.glob(['./snippets/*.js', '!./snippets/_*'], { eager: true });
for (const [path, mod] of Object.entries(SNIPPET_MODULES)) {
  const slug = path.replace('./snippets/', '').replace(/\.js$/, '');
  if (mod && mod.default) registerSnippets(slug, mod.default);
}
