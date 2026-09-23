# OMNI Internal Manifest

The internal manifest and every prototype listed on it, in one repository.

## Layout

| Path | What it is |
|---|---|
| `manifest/` | The manifest site itself: one static `index.html` listing every project. |
| `design-system/` | The OMNI design system: tokens, the component catalog (Storybook), and the public component export. |
| `projects/<name>/` | One folder per prototype. Each is a self-contained static site. |

## Projects

| # | Title | Folder | Live |
|---|---|---|---|
| 001 | Sharing | `projects/canvas-share-demos` | https://canvas-share-demos.vercel.app |
| 032 | Media Trafficking | `projects/chat-hat-handoff` | https://oai-one.vercel.app/site/chat-hat/index.html |
| 031 | Video | `projects/canvas-graphics` | https://canvas-graphics.vercel.app |
| 030 | Media | `projects/canva-media` | https://canva-media.vercel.app |
| 029 | Canvas Cover | `projects/canvas-book-ends` | https://canvas-book-ends.vercel.app/?front=39&back=01&view=document&sym=a19&stamp=2 |
| 028 | Email Template | `projects/email-template` | https://omni-email-template.vercel.app/all.html |
| 027 | Gateway Concourse | `projects/gateway-v2-twelve` | https://gateway-v2-twelve.vercel.app |
| 026 | Create New | `projects/tabula` | https://tabula-liard.vercel.app |
| 025 | Permissions | `projects/request-access` | https://request-access-one.vercel.app |
| 024 | Feedback Skill | `projects/feedback-skill` | https://feedback-skill.vercel.app |
| 023 | Nodes | `projects/canvas-workflows` | https://canvas-workflows.vercel.app |
| 022 | Media Skills | `projects/media-skills` | https://media-skills-gamma.vercel.app |
| 021 | Canvas Lite/Full | `projects/omni-manifest` | https://omni-manifest.vercel.app |
| 020 | Graphics | `projects/canvas-graphics` | https://canvas-graphics.vercel.app |
| 019 | Exports | `projects/canvas-exports` | https://canvas-exports.vercel.app |
| 017 | Switching Canvas | `projects/switching-canvas` | https://switching-canvas.vercel.app |
| 016 | Translations | `projects/translations` | https://translations-livid.vercel.app |
| 015 | Copy Agent | `projects/copy-agent` | https://copy-agent-five.vercel.app |
| 014 | Publish | `projects/publish-to-workspace` | https://publish-to-workspace.vercel.app |
| 013 | Figma Plugin | `projects/omni-figma-plugin` | http://localhost:8099/ui.html |
| 012 | Gateway | `projects/gateway-v2` | https://gateway-v2-chi.vercel.app/?hero=stack-persona |
| 011 | Themes | `projects/themes` | https://themes-gilt.vercel.app |
| 010 | Canvas QA | `projects/canvas-qa` | https://canvas-qa.vercel.app |
| 009 | Announcement | `projects/omni-canvas-announcement` | https://omni-canvas-announcement.vercel.app |
| 008 | Agents Store | `projects/agents-store` | https://agents-store-virid.vercel.app |
| 007 | Chat Hat | `projects/chat-hat` | https://chat-hat.vercel.app |
| 006 | Persona | `projects/persona-v2` | https://persona-v2-ebon.vercel.app |
| 005 | Agent Builder | `projects/omni-agent-builder` | https://omni-agent-builder.vercel.app |
| 004 | Media | `projects/lease-campaign` | https://lease-campaign.vercel.app/?canvas4=1 |
| 003 | Gawdtable | `projects/lease-campaign` | https://lease-campaign.vercel.app/?table=1 |
| 002 | Brief | `projects/lease-campaign` | https://lease-campaign.vercel.app |

The Permissions row is built from two folders: `projects/request-access` and `projects/copy-request-access`.

## Running a prototype locally

Almost every prototype is plain static files with no build step:

```bash
cd projects/<name>
python3 -m http.server 8000
```

Then open http://localhost:8000. Two prototypes are Vite projects (`projects/canvas-workflows`, `projects/omni-canvas-announcement`): run `npm install && npm run dev` in their folders instead.

## Deploying

This repo is what's deployed. Each prototype is its own Vercel project that builds from its folder here. Pushing on its own deploys nothing: each project's `vercel.json` sets `"git": {"deploymentEnabled": false}`, so leave it in place. Deploys are started from the maintainer's machine for exactly the projects being published. Deployed prototypes sit behind Basic Auth via each folder's `middleware.js`.

Exceptions: `chat-hat`, `omni-agent-builder`, `lease-campaign`, and `canvas-pdf-tables` are mirrored here but deploy with `vercel deploy` from the maintainer's machine (Vercel's free plan connects one repository to at most 25 projects). The free plan also caps deployments at 100 per day and builds one at a time, so a publish can queue behind another build for a few minutes.

## Publishing a change

Working copies live on the maintainer's machine. A local publish script copies a project into this repo, commits, pushes, and deploys it. Edits made directly to a project folder here are overwritten the next time that project is published, so send changes to the maintainer rather than pushing them.

Only the folders you name are copied, so publishing one project never ships another project's unfinished work. Excluded from the repo: version-control and deploy metadata, `node_modules`, build output, internal working docs (`*.md`, except docs a site serves), backups, anything a project's `.vercelignore` lists, and files over 95 MB.
