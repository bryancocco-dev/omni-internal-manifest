/* ============================================================================
   CORVACHE — brand data contract (2026-09-03, "style guide states for the dev team")

   ONE object drives every state of brand-book.html (empty / light / full),
   the sub-brand switcher, §08 Tokens, §09 Templates, and design.html (the
   undesigned code-drop). Plain script, no modules, no build step:
     <script src="brand-data.js"></script>  →  window.CORVACHE_BRAND

   Shape is deliberately Figma-variables-shaped (collections → variables
   with a TYPE of color|number|string|boolean and one value per MODE). Modes
   here are the brands: the parent CORVACHE and its two sub-brands. A
   sub-brand INHERITS every value it does not override — resolve() walks up
   the parent chain, so the data only stores the diffs. That is the whole
   "not a curio cabinet" answer: sub-brands are overrides on one system.

   Demoware. Nothing is fetched. Everything is invented for a fictional EV
   brand; no real manufacturer, person, or agency appears.
   ========================================================================== */
(function(){
  "use strict";

  /* ---------------------------------------------------------------- BRANDS
     id            stable key, also the mode column key in tokens
     parent        null for the root brand; sub-brands inherit from parent
     positioning   one line, used in the switcher + design.md
     accent        display swatch for the switcher chip only (real color
                   truth lives in tokens.color.accent per mode)             */
  var BRANDS = [
    { id: 'corvache',  name: 'CORVACHE',            short: 'Brand',     parent: null,
      positioning: 'Precision-driven performance. Restraint over expression.',
      accent: '#C29049', ground: '#141519', since: '2024' },
    { id: 'precision', name: 'CORVACHE PRECISION',  short: 'Precision', parent: 'corvache',
      positioning: 'The performance line. Sharper geometry, one hot accent, no ornament.',
      accent: '#DC4C2F', ground: '#0B0C0F', since: '2026' },
    { id: 'atelier',   name: 'CORVACHE ATELIER',    short: 'Atelier',   parent: 'corvache',
      positioning: 'The bespoke program. Ivory ground, soft geometry, gold as material.',
      accent: '#C29049', ground: '#F3EFE6', since: '2025' }
  ];

  /* ---------------------------------------------------------------- TOKENS
     Three tiers, exactly the Figma mental model:
       primitive  →  raw palette / scale values, never used directly in UI
       semantic   →  what a value MEANS (bg.canvas, text.primary, accent)
       component  →  per-component decisions (button.*, card.*)
     Each variable: { name, type, desc, value: { <brandId>: v } }.
     `value.corvache` is ALWAYS present (root). Sub-brand keys appear only
     where that brand overrides. Aliases are strings beginning with "{"
     e.g. "{color.gold.500}" — resolve() follows them.                        */
  var TOKENS = {
    primitive: {
      label: 'Primitives',
      desc: 'Raw values. Palette, scale, faces, clocks. Never referenced by UI directly.',
      vars: [
        { name: 'color.gold.500',     type: 'color',  value: { corvache: '#C29049' }, desc: 'Griffin gold — the vector fill of the mark' },
        { name: 'color.gold.300',     type: 'color',  value: { corvache: '#DDB279' } },
        { name: 'color.gold.700',     type: 'color',  value: { corvache: '#966C2F' } },
        { name: 'color.ember.500',    type: 'color',  value: { corvache: '#DC4C2F' }, desc: 'Precision orange' },
        { name: 'color.raisin.900',   type: 'color',  value: { corvache: '#141519' }, desc: 'Raisin black — the book ground' },
        { name: 'color.raisin.950',   type: 'color',  value: { corvache: '#0B0C0F' }, desc: 'Blackout' },
        { name: 'color.raisin.800',   type: 'color',  value: { corvache: '#1A1B20' } },
        { name: 'color.ivory.100',    type: 'color',  value: { corvache: '#F5F3EE' } },
        { name: 'color.ivory.200',    type: 'color',  value: { corvache: '#F3EFE6' } },
        { name: 'color.ash.400',      type: 'color',  value: { corvache: '#B9BCC4' } },
        { name: 'color.ash.600',      type: 'color',  value: { corvache: '#7D818C' } },
        { name: 'color.white',        type: 'color',  value: { corvache: '#FFFFFF' } },
        { name: 'color.black',        type: 'color',  value: { corvache: '#000000' } },

        { name: 'font.family.sans',   type: 'string', value: { corvache: 'Proxima Nova' } },
        { name: 'font.family.mono',   type: 'string', value: { corvache: 'Fira Code' } },
        { name: 'font.weight.regular',type: 'number', value: { corvache: 400 } },
        { name: 'font.weight.semibold',type:'number', value: { corvache: 600 } },
        { name: 'font.weight.black',  type: 'number', value: { corvache: 900 } },

        { name: 'size.1',   type: 'number', value: { corvache: 4 } },
        { name: 'size.2',   type: 'number', value: { corvache: 8 } },
        { name: 'size.3',   type: 'number', value: { corvache: 12 } },
        { name: 'size.4',   type: 'number', value: { corvache: 16 } },
        { name: 'size.6',   type: 'number', value: { corvache: 24 } },
        { name: 'size.8',   type: 'number', value: { corvache: 32 } },
        { name: 'size.12',  type: 'number', value: { corvache: 48 } },
        { name: 'size.16',  type: 'number', value: { corvache: 64 } },

        { name: 'radius.0',    type: 'number', value: { corvache: 0 } },
        { name: 'radius.1',    type: 'number', value: { corvache: 2 } },
        { name: 'radius.2',    type: 'number', value: { corvache: 6 } },
        { name: 'radius.3',    type: 'number', value: { corvache: 12 } },
        { name: 'radius.full', type: 'number', value: { corvache: 999 } },

        { name: 'duration.instant', type: 'number', value: { corvache: 80 },   desc: 'ms' },
        { name: 'duration.fast',    type: 'number', value: { corvache: 160 },  desc: 'ms' },
        { name: 'duration.base',    type: 'number', value: { corvache: 280 },  desc: 'ms' },
        { name: 'duration.slow',    type: 'number', value: { corvache: 520 },  desc: 'ms' },
        { name: 'duration.reveal',  type: 'number', value: { corvache: 900 },  desc: 'ms — the book\'s own blur-resolve clock' },
        { name: 'easing.standard',  type: 'string', value: { corvache: 'cubic-bezier(.16, 1, .3, 1)' }, desc: 'Settle. Every reveal on this page.' },
        { name: 'easing.enter',     type: 'string', value: { corvache: 'cubic-bezier(.22, 1, .36, 1)' } },
        { name: 'easing.exit',      type: 'string', value: { corvache: 'cubic-bezier(.4, 0, 1, 1)' } },
        { name: 'easing.linear',    type: 'string', value: { corvache: 'linear' } }
      ]
    },

    semantic: {
      label: 'Semantic',
      desc: 'What a value means. This is the column the dev team maps onto components — same as Figma\'s semantic collection.',
      vars: [
        { name: 'color.bg.canvas',      type: 'color', value: { corvache: '{color.raisin.900}', precision: '{color.raisin.950}', atelier: '{color.ivory.200}' }, desc: 'Page ground' },
        { name: 'color.bg.raised',      type: 'color', value: { corvache: '{color.raisin.800}', precision: '{color.raisin.900}', atelier: '{color.white}' } },
        { name: 'color.text.primary',   type: 'color', value: { corvache: '{color.ivory.100}', atelier: '{color.raisin.900}' } },
        { name: 'color.text.secondary', type: 'color', value: { corvache: '{color.ash.400}',   atelier: '{color.ash.600}' } },
        { name: 'color.text.muted',     type: 'color', value: { corvache: '{color.ash.600}' } },
        { name: 'color.accent',         type: 'color', value: { corvache: '{color.gold.500}',  precision: '{color.ember.500}' }, desc: 'The one accent. Used with restraint.' },
        { name: 'color.accent.hover',   type: 'color', value: { corvache: '{color.gold.300}',  precision: '#F0664A' } },
        { name: 'color.line',           type: 'color', value: { corvache: 'rgba(255,255,255,.10)', atelier: 'rgba(20,21,25,.12)' } },
        { name: 'color.line.strong',    type: 'color', value: { corvache: 'rgba(255,255,255,.16)', atelier: 'rgba(20,21,25,.22)' } },

        { name: 'type.display.family', type: 'string', value: { corvache: '{font.family.sans}' } },
        { name: 'type.display.weight', type: 'number', value: { corvache: '{font.weight.black}', atelier: '{font.weight.semibold}' } },
        { name: 'type.display.case',   type: 'string', value: { corvache: 'uppercase', atelier: 'none' }, desc: 'Display setting. Atelier drops the caps.' },
        { name: 'type.display.tracking', type: 'number', value: { corvache: -0.02, precision: -0.04, atelier: 0 }, desc: 'em' },
        { name: 'type.body.family',    type: 'string', value: { corvache: '{font.family.sans}' } },
        { name: 'type.body.size',      type: 'number', value: { corvache: 15 } },
        { name: 'type.body.lineHeight',type: 'number', value: { corvache: 1.55 } },
        { name: 'type.mono.family',    type: 'string', value: { corvache: '{font.family.mono}' } },

        { name: 'space.section',  type: 'number', value: { corvache: '{size.16}' } },
        { name: 'space.block',    type: 'number', value: { corvache: '{size.8}' } },
        { name: 'space.inline',   type: 'number', value: { corvache: '{size.3}' } },

        { name: 'radius.control', type: 'number', value: { corvache: '{radius.2}', precision: '{radius.1}', atelier: '{radius.full}' }, desc: 'Buttons, inputs, chips' },
        { name: 'radius.surface', type: 'number', value: { corvache: '{radius.3}', precision: '{radius.1}' }, desc: 'Cards, sheets' },

        { name: 'motion.duration.hover', type: 'number', value: { corvache: '{duration.fast}' } },
        { name: 'motion.duration.enter', type: 'number', value: { corvache: '{duration.base}', precision: '{duration.fast}' } },
        { name: 'motion.duration.reveal',type: 'number', value: { corvache: '{duration.reveal}' } },
        { name: 'motion.easing.default', type: 'string', value: { corvache: '{easing.standard}' } },
        { name: 'motion.easing.enter',   type: 'string', value: { corvache: '{easing.enter}' } },
        { name: 'motion.reduced.respect',type: 'boolean',value: { corvache: true }, desc: 'Honor prefers-reduced-motion' },

        { name: 'imagery.grain',        type: 'boolean', value: { corvache: true,  atelier: false }, desc: 'Film grain over photography' },
        { name: 'imagery.hardLight',    type: 'boolean', value: { corvache: true,  atelier: false } },
        { name: 'imagery.duotone',      type: 'boolean', value: { corvache: false, precision: true } }
      ]
    },

    component: {
      label: 'Component',
      desc: 'Per-component decisions, resolved from semantic. The two button styles live here.',
      vars: [
        { name: 'button.primary.bg',       type: 'color',  value: { corvache: '{color.accent}' } },
        { name: 'button.primary.text',     type: 'color',  value: { corvache: '{color.black}', atelier: '{color.ivory.100}' } },
        { name: 'button.primary.radius',   type: 'number', value: { corvache: '{radius.control}' } },
        { name: 'button.primary.case',     type: 'string', value: { corvache: 'uppercase', atelier: 'none' } },
        { name: 'button.primary.tracking', type: 'number', value: { corvache: 0.08, precision: 0.12, atelier: 0 }, desc: 'em' },
        { name: 'button.primary.height',   type: 'number', value: { corvache: 44, precision: 40, atelier: 48 } },
        { name: 'button.primary.border',   type: 'boolean',value: { corvache: false, precision: true }, desc: 'Precision keeps a 1px accent hairline' },
        { name: 'button.secondary.bg',     type: 'color',  value: { corvache: 'transparent' } },
        { name: 'button.secondary.text',   type: 'color',  value: { corvache: '{color.text.primary}' } },
        { name: 'button.secondary.border', type: 'color',  value: { corvache: '{color.line.strong}' } },
        { name: 'card.bg',                 type: 'color',  value: { corvache: '{color.bg.raised}' } },
        { name: 'card.radius',             type: 'number', value: { corvache: '{radius.surface}' } },
        { name: 'card.border',             type: 'color',  value: { corvache: '{color.line}' } },
        { name: 'chip.radius',             type: 'number', value: { corvache: '{radius.full}', precision: '{radius.1}' } },
        { name: 'input.height',            type: 'number', value: { corvache: 40 } },
        { name: 'input.radius',            type: 'number', value: { corvache: '{radius.control}' } }
      ]
    }
  };

  /* -------------------------------------------------------------- SECTIONS
     The book's own numbered sections + the two new ones. `light` says what
     the LIGHTLY-FILLED state shows for that section:
       'filled'  → real content (what a Figma design-system import gives you:
                   logo, type, color)
       'partial' → a scaffold with one or two items and an add affordance
       'empty'   → an empty section shell with an add affordance             */
  var SECTIONS = [
    { id: 'sec-overview', num: '—',  label: 'Overview',       light: 'partial' },
    { id: 'sec-logo',     num: '01', label: 'Logo',           light: 'filled'  },
    { id: 'sec-tone',     num: '02', label: 'Tone of Voice',  light: 'empty'   },
    { id: 'sec-photo',    num: '03', label: 'Photography',    light: 'empty'   },
    { id: 'style-guides', num: '—',  label: 'Style Guides',   light: 'empty', sub: true },
    { id: 'sec-type',     num: '04', label: 'Typography',     light: 'filled'  },
    { id: 'sec-color',    num: '05', label: 'Color',          light: 'filled'  },
    { id: 'sec-icon',     num: '06', label: 'Iconography',    light: 'partial' },
    { id: 'sec-graphic',  num: '07', label: 'Graphic Assets', light: 'empty'   },
    { id: 'sec-tokens',   num: '08', label: 'Tokens',         light: 'filled'  },
    { id: 'sec-templates',num: '09', label: 'Templates',      light: 'empty'   }
  ];

  /* ------------------------------------------------------------- TEMPLATES
     Flat list. the creative lead: "those don't need to be organized apart from — it's
     a list." kind is the only grouping cue and it is just a column.          */
  var TEMPLATES = [
    { id: 'tpl-banner-970',  kind: 'Banner', name: 'Launch leaderboard',     format: 'HTML5',  size: '970 × 250',   updated: '2026-08-28', by: 'Studio',  brand: 'precision', uses: 42 },
    { id: 'tpl-banner-300',  kind: 'Banner', name: 'Medium rectangle',       format: 'HTML5',  size: '300 × 250',   updated: '2026-08-28', by: 'Studio',  brand: 'corvache',  uses: 118 },
    { id: 'tpl-banner-160',  kind: 'Banner', name: 'Wide skyscraper',        format: 'HTML5',  size: '160 × 600',   updated: '2026-08-14', by: 'Studio',  brand: 'corvache',  uses: 27 },
    { id: 'tpl-email-launch',kind: 'Email',  name: 'Launch announcement',    format: 'MJML',   size: '600 wide',    updated: '2026-08-31', by: 'CRM',     brand: 'precision', uses: 9 },
    { id: 'tpl-email-news',  kind: 'Email',  name: 'Monthly dispatch',       format: 'MJML',   size: '600 wide',    updated: '2026-08-19', by: 'CRM',     brand: 'corvache',  uses: 14 },
    { id: 'tpl-email-atelier',kind:'Email',  name: 'Atelier invitation',     format: 'MJML',   size: '600 wide',    updated: '2026-07-30', by: 'CRM',     brand: 'atelier',   uses: 3 },
    { id: 'tpl-deck-master', kind: 'Deck',   name: 'Master deck',            format: 'PPTX',   size: '16 : 9',      updated: '2026-09-01', by: 'Brand',   brand: 'corvache',  uses: 211 },
    { id: 'tpl-deck-dealer', kind: 'Deck',   name: 'Dealer briefing',        format: 'PPTX',   size: '16 : 9',      updated: '2026-08-22', by: 'Retail',  brand: 'corvache',  uses: 66 },
    { id: 'tpl-social-story',kind: 'Social', name: 'Story frame',            format: 'PNG',    size: '1080 × 1920', updated: '2026-08-27', by: 'Social',  brand: 'precision', uses: 84 },
    { id: 'tpl-social-post', kind: 'Social', name: 'Feed post',              format: 'PNG',    size: '1080 × 1350', updated: '2026-08-27', by: 'Social',  brand: 'corvache',  uses: 152 }
  ];

  /* ---------------------------------------------------------------- INGEST
     Empty state. The drop zone takes anything; these are the named ways in.
     `primary` is the one the creative lead asked for: a saved Figma design-system file. */
  var INGEST = {
    headline: 'Drag Any Context Here.',
    sub: 'A design-system file, a brand PDF, a folder of references, a URL. We\'ll sort it out.',
    accept: 'fig, pdf, pptx, zip, images, links',
    ways: [
      { id: 'figma',   label: 'Figma design system', hint: '.fig with variables + styles', primary: true },
      { id: 'pdf',     label: 'Brand book PDF',      hint: 'Guidelines, decks, one-pagers' },
      { id: 'url',     label: 'Paste a URL',         hint: 'A site, a Figma link, a Drive folder' },
      { id: 'scratch', label: 'Start from scratch',  hint: 'Name it and build it section by section' }
    ],
    /* What the staged "reading your brand" beat claims to find, in order.
       Drives the progress list; each lands ~500ms apart.                    */
    /* "Start from scratch" → the agent offers a DRAFT from what the workspace
       already holds (Bryan 2026-09-07: "I like draft from workspace"). Demoware
       counts; the kinds mirror the Gateway's own file types.                */
    workspace: {
      name: 'CORVACHE', total: 14,
      kinds: [
        { kind: 'logos',  count: 3, hint: '2 SVG, 1 PNG' },
        { kind: 'decks',  count: 4, hint: 'PPTX · 2024–2026' },
        { kind: 'images', count: 5, hint: 'studio + detail photography' },
        { kind: 'docs',   count: 2, hint: 'brand PDF, tone notes' }
      ],
      /* what a workspace draft can fill, and what it can't — drives the light
         state's status line after a draft                                    */
      fills: ['sec-logo', 'sec-color', 'sec-type', 'sec-photo'],
      leaves: ['sec-tone', 'style-guides', 'sec-icon', 'sec-graphic', 'sec-tokens', 'sec-templates'],
      findings: [
        { section: 'sec-logo',  text: '1 mark, 2 lockups from the deck masters' },
        { section: 'sec-color', text: '6 colors sampled across 4 decks' },
        { section: 'sec-type',  text: '2 families in use — no weights declared' },
        { section: 'sec-photo', text: '5 images, 1 consistent grade' }
      ]
    },
    /* Outcomes by what the user brought — the light state's status line.   */
    outcomes: {
      figma:     { lands: 'full',  line: 'Built from your Figma design system · 9 of 9 sections' },
      files:     { lands: 'light', line: 'Built from a brand PDF and 6 images · 4 of 9 sections filled · Tone, Icons, Tokens and Templates still empty' },
      url:       { lands: 'light', line: 'Built from corvache.com · 2 of 9 sections filled · we found the palette and type, not the mark' },
      workspace: { lands: 'light', line: 'Draft from 14 workspace assets · 4 of 9 sections filled · review the picks before you rely on them' },
      scratch:   { lands: 'light', line: 'Started empty · 0 of 9 sections · add a section to begin' }
    },
    findings: [
      { section: 'sec-logo',  text: '1 mark, 3 lockups, clear-space rule' },
      { section: 'sec-color', text: '13 color variables across 3 modes' },
      { section: 'sec-type',  text: '2 families, 5 text styles' },
      { section: 'sec-tokens',text: '87 variables · color · number · string · boolean' },
      { section: 'sec-icon',  text: '96 icons (outline, 1.5px)' }
    ]
  };

  /* --------------------------------------------------------------- HELPERS */
  var byId = {};
  BRANDS.forEach(function(b){ byId[b.id] = b; });

  var varIndex = {};
  Object.keys(TOKENS).forEach(function(tier){
    TOKENS[tier].vars.forEach(function(v){ v.tier = tier; varIndex[v.name] = v; });
  });

  function brandChain(brandId){
    var chain = [], b = byId[brandId];
    while (b){ chain.push(b.id); b = b.parent ? byId[b.parent] : null; }
    return chain;                         // e.g. ['precision','corvache']
  }

  /* rawValue: the stored (possibly aliased) value for a var in a brand,
     walking up the parent chain. Also reports WHICH brand supplied it.       */
  function rawValue(name, brandId){
    var v = varIndex[name]; if (!v) return null;
    var chain = brandChain(brandId);
    for (var i = 0; i < chain.length; i++){
      if (Object.prototype.hasOwnProperty.call(v.value, chain[i])){
        return { value: v.value[chain[i]], from: chain[i], inherited: i > 0 };
      }
    }
    return null;
  }

  /* resolve: follow aliases to a concrete value for this brand.             */
  function resolve(name, brandId, _depth){
    var r = rawValue(name, brandId); if (!r) return undefined;
    var val = r.value;
    if (typeof val === 'string' && val.charAt(0) === '{' && (_depth || 0) < 8){
      return resolve(val.slice(1, -1), brandId, (_depth || 0) + 1);
    }
    return val;
  }

  /* overrides: every var a sub-brand sets itself (its diff vs parent).      */
  function overrides(brandId){
    var out = [];
    Object.keys(varIndex).forEach(function(name){
      var v = varIndex[name];
      if (byId[brandId].parent && Object.prototype.hasOwnProperty.call(v.value, brandId)) out.push(v);
    });
    return out;
  }

  function fmt(v){ return typeof v === 'string' ? v : String(v); }

  /* toTokensJson: DTCG-ish export (W3C design tokens shape), one file,
     modes nested under $extensions.modes so a single download carries all
     three brands.                                                            */
  function toTokensJson(){
    var out = { $schema: 'https://design-tokens.github.io/community-group/format/', brand: 'CORVACHE', modes: BRANDS.map(function(b){ return b.id; }), generated: new Date().toISOString().slice(0,10) };
    Object.keys(TOKENS).forEach(function(tier){
      out[tier] = {};
      TOKENS[tier].vars.forEach(function(v){
        var node = { $type: v.type, $value: v.value.corvache, $extensions: { modes: {} } };
        if (v.desc) node.$description = v.desc;
        BRANDS.forEach(function(b){ node.$extensions.modes[b.id] = resolve(v.name, b.id); });
        out[tier][v.name] = node;
      });
    });
    return JSON.stringify(out, null, 2);
  }

  /* toDesignMd: the "design.md" the creative lead and Bryan talked about — the whole
     system as one markdown file an agent can read. design.html renders
     exactly this string.                                                     */
  function toDesignMd(){
    var L = [];
    var root = BRANDS[0];
    L.push('# ' + root.name + ' — design.md');
    L.push('');
    L.push('> ' + root.positioning);
    L.push('> Generated ' + new Date().toISOString().slice(0,10) + ' from the CORVACHE brand book. Machine-readable companion to the book; the book is the human one.');
    L.push('');
    L.push('## Brands');
    L.push('');
    L.push('| id | name | inherits | since | positioning |');
    L.push('|---|---|---|---|---|');
    BRANDS.forEach(function(b){ L.push('| `' + b.id + '` | ' + b.name + ' | ' + (b.parent ? '`' + b.parent + '`' : '—') + ' | ' + b.since + ' | ' + b.positioning + ' |'); });
    L.push('');
    L.push('Sub-brands inherit every token they do not override. Only overrides are stored.');
    L.push('');
    L.push('## Sections');
    L.push('');
    SECTIONS.forEach(function(s){ L.push('- ' + (s.num === '—' ? '' : s.num + ' ') + s.label + ' (`#' + s.id + '`)'); });
    L.push('');
    Object.keys(TOKENS).forEach(function(tier){
      var t = TOKENS[tier];
      L.push('## Tokens · ' + t.label);
      L.push('');
      L.push(t.desc);
      L.push('');
      L.push('| name | type | ' + BRANDS.map(function(b){ return b.short.toLowerCase(); }).join(' | ') + ' | note |');
      L.push('|---|---|' + BRANDS.map(function(){ return '---'; }).join('|') + '|---|');
      t.vars.forEach(function(v){
        var cells = BRANDS.map(function(b){
          var r = rawValue(v.name, b.id);
          var raw = r ? fmt(r.value) : '';
          var res = resolve(v.name, b.id);
          var s = raw;
          if (typeof raw === 'string' && raw.charAt(0) === '{') s = raw + ' → ' + fmt(res);
          if (r && r.inherited) s = '_' + s + '_';
          return s;
        });
        L.push('| `' + v.name + '` | ' + v.type + ' | ' + cells.join(' | ') + ' | ' + (v.desc || '') + ' |');
      });
      L.push('');
      L.push('_Italic = inherited from parent._');
      L.push('');
    });
    L.push('## Templates');
    L.push('');
    L.push('| kind | name | format | size | brand | updated |');
    L.push('|---|---|---|---|---|---|');
    TEMPLATES.forEach(function(t){ L.push('| ' + t.kind + ' | ' + t.name + ' | ' + t.format + ' | ' + t.size + ' | `' + t.brand + '` | ' + t.updated + ' |'); });
    L.push('');
    L.push('## Rules of thumb');
    L.push('');
    L.push('- One accent per surface. Gold (or ember, in Precision) is used with restraint; it supports the product and never competes with it.');
    L.push('- Display type is uppercase and heavy everywhere except Atelier, which sets sentence case at semibold.');
    L.push('- Photography: one hard light, a neutral grade, nothing in frame that is not load-bearing. Grain on, except Atelier.');
    L.push('- Motion settles; it does not bounce. `easing.standard` for anything that reveals.');
    L.push('');
    return L.join('\n');
  }

  function download(filename, text, mime){
    var blob = new Blob([text], { type: mime || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  window.CORVACHE_BRAND = {
    brands: BRANDS, brandById: byId, tokens: TOKENS, varIndex: varIndex,
    sections: SECTIONS, templates: TEMPLATES, ingest: INGEST,
    brandChain: brandChain, rawValue: rawValue, resolve: resolve, overrides: overrides,
    toTokensJson: toTokensJson, toDesignMd: toDesignMd, download: download
  };
})();
