/* Foundations / Surface Preview — embeds the EXACT Persona project (canvas_3
 * of lease-campaign) full-bleed, in both the light (omni-classic) and dark
 * (oai) themes.
 *
 * The LIVE page (lease-campaign.vercel.app/?canvas3=1) hard-locks itself to the
 * light theme (a lockTheme() IIFE forces body[data-theme="light"] and hides the
 * settings toggle) and is cross-origin, so it can't be flipped from outside. To
 * show both themes we serve a same-origin copy bundled under
 * public/_assets/lease-campaign/ whose ONLY patch is that lockTheme now honours
 * a ?theme= URL param (default light). The page's dark CSS — body[data-theme=
 * "dark"], "palette matched to Figma OAI 2026 handoff" — is the real surface,
 * not an approximation. Assets (persona portraits, covers, logos) are bundled
 * alongside; the heavy mp4s/backups were skipped (canvas_3 is image-only). */

const SRC = '/_assets/lease-campaign/index.html?canvas3=1';

function build(theme) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed; inset:0; background: var(--omni-page-bg);';

  const frame = document.createElement('iframe');
  frame.src = `${SRC}&theme=${theme}`;
  frame.title = `Persona Library — canvas_3 (${theme})`;
  frame.loading = 'lazy';
  frame.style.cssText = 'width:100%; height:100%; border:0; display:block;';
  frame.setAttribute('allow', 'fullscreen');

  wrap.appendChild(frame);
  return wrap;
}

export default {
  title: 'Foundations/Surface Preview',
  parameters: { layout: 'fullscreen' }
};

export const LightTheme = { name: 'Light — omni-classic', render: () => build('light') };
export const DarkTheme = { name: 'Dark — oai', render: () => build('dark') };
