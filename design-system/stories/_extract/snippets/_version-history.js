// Verbatim Version-History population logic, lifted from agents-store/index.html
// (renderVersionHistory / buildVersionRow / VERSION_HISTORY / VH_AVATARS) and
// from the byte-identical copy in omni-agent-builder/index.html. The static
// catalog frame never runs the project's own JS, so the .vh-modal-body renders
// empty; this Tier-3 `js` snippet reproduces the exact runtime row list so the
// extracted modal matches the live dialog 1-to-1 (avatar, title, calendar meta,
// Restore button, kebab menu). Shared by both modal snippets.
export const versionHistoryJs = `(function(){
  var VH_CAL_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var VH_KEBAB_SVG='<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
  var VH_EYE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var VH_CLOCK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
  var VH_AVATARS={
    'Noah Fielding':{initials:'AC',color:'#1f2937'},
    'Bryan Cocco':{initials:'BC',color:'#dc2626'},
    'Jasper Nelson':{initials:'JN',color:'#2563eb'},
    'Margaret Reilly':{initials:'MR',color:'#16a34a',photo:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&auto=format&q=70'},
    'Sasha Patel':{initials:'SP',color:'#9333ea',photo:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&auto=format&q=70'},
    'Diego Carrasco':{initials:'DC',color:'#ea580c',photo:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&auto=format&q=70'}
  };
  var VERSION_HISTORY=[
    {title:'',author:'Noah Fielding',date:'Jun 4, 2026, 12:45 PM'},
    {title:'',author:'Bryan Cocco',date:'Jun 4, 2026, 11:30 AM'},
    {title:'v35 — Refined output schema',author:'Noah Fielding',date:'Jun 3, 2026, 4:17 PM'},
    {title:'v34 — Updated brand voice tags',author:'Margaret Reilly',date:'Jun 3, 2026, 9:15 AM'},
    {title:'v33 — Lowered temperature defaults',author:'Bryan Cocco',date:'Jun 1, 2026, 5:42 PM'},
    {title:'v32 — Added market context KB',author:'Sasha Patel',date:'Jun 1, 2026, 3:08 PM'},
    {title:'',author:'Noah Fielding',date:'May 31, 2026, 4:20 PM'},
    {title:'v31 — Persona slot for sales rep',author:'Diego Carrasco',date:'May 30, 2026, 2:55 PM'},
    {title:'v30 — Removed legacy ToV guard',author:'Noah Fielding',date:'May 29, 2026, 11:20 AM'},
    {title:'v29 — Tightened guardrails for PII',author:'Bryan Cocco',date:'May 28, 2026, 4:48 PM'},
    {title:'v28 — Added retrieval fallback path',author:'Margaret Reilly',date:'May 27, 2026, 1:34 PM'},
    {title:'v27 — Switched to Anthropic 4.6',author:'Sasha Patel',date:'May 26, 2026, 11:02 AM'},
    {title:'v26 — Pinned model to Sonnet',author:'Noah Fielding',date:'May 25, 2026, 4:18 PM'},
    {title:'v25 — Added compete intel scraper',author:'Jasper Nelson',date:'May 24, 2026, 9:30 AM'},
    {title:'v24 — Fixed citation format',author:'Bryan Cocco',date:'May 23, 2026, 3:22 PM'},
    {title:'',author:'Noah Fielding',date:'May 22, 2026, 10:00 AM'},
    {title:'v23 — Tuned recall over precision',author:'Margaret Reilly',date:'May 21, 2026, 4:55 PM'},
    {title:'v22 — Reduced max_tokens',author:'Diego Carrasco',date:'May 20, 2026, 2:11 PM'},
    {title:'v21 — Added Driftline retail rules',author:'Noah Fielding',date:'May 19, 2026, 11:48 AM'},
    {title:'v20 — Renamed agent',author:'Bryan Cocco',date:'May 18, 2026, 6:02 PM'},
    {title:'v19 — Auto-formatter for tables',author:'Sasha Patel',date:'May 17, 2026, 1:39 PM'},
    {title:'v18 — Pulled in legal redline KB',author:'Noah Fielding',date:'May 15, 2026, 4:30 PM'},
    {title:'v17 — Cleaned instruction prelude',author:'Margaret Reilly',date:'May 14, 2026, 10:21 AM'},
    {title:'v16 — Added competitor disclaimer',author:'Jasper Nelson',date:'May 13, 2026, 3:55 PM'},
    {title:'v15 — Switched embedding model',author:'Bryan Cocco',date:'May 12, 2026, 12:01 PM'},
    {title:'v14 — Removed stale CSV sources',author:'Noah Fielding',date:'May 10, 2026, 2:48 PM'},
    {title:'v13 — Added Q1 brand book v3',author:'Diego Carrasco',date:'May 9, 2026, 11:33 AM'},
    {title:'v12 — Fixed JSON-mode crash',author:'Sasha Patel',date:'May 7, 2026, 5:09 PM'},
    {title:'v11 — Restored production prompt',author:'Margaret Reilly',date:'May 6, 2026, 9:48 AM'},
    {title:'v10 — Added few-shot examples',author:'Bryan Cocco',date:'May 4, 2026, 4:15 PM'},
    {title:'v9 — Cleared experimental tools',author:'Noah Fielding',date:'May 2, 2026, 2:22 PM'},
    {title:'v8 — Removed dead Slack tool',author:'Jasper Nelson',date:'Apr 30, 2026, 11:11 AM'},
    {title:'v7 — Updated workspace prompt',author:'Bryan Cocco',date:'Apr 28, 2026, 3:45 PM'},
    {title:'v6 — Added web search to RAG',author:'Margaret Reilly',date:'Apr 25, 2026, 9:30 AM'},
    {title:'v5 — Forced citations',author:'Noah Fielding',date:'Apr 22, 2026, 4:50 PM'},
    {title:'v4 — Added with AWS S3 source',author:'Diego Carrasco',date:'Apr 19, 2026, 10:42 AM'},
    {title:'v3 — Modified Automation',author:'Sasha Patel',date:'Apr 15, 2026, 11:00 AM'},
    {title:'v2 — Addition of Nodes',author:'Bryan Cocco',date:'Apr 10, 2026, 2:30 PM'},
    {title:'v1 — Initial version',author:'Noah Fielding',date:'Mar 3, 2026, 10:32 AM'}
  ];
  function buildVersionRow(v,index){
    var meta=VH_AVATARS[v.author]||{initials:v.author.slice(0,2).toUpperCase(),color:'#6b6d7a'};
    var title=v.title||'Auto Saved Version';
    var row=document.createElement('div');
    row.className='vh-row';
    row.dataset.title=title.toLowerCase();
    row.dataset.author=v.author.toLowerCase();
    var avatar=document.createElement('span');
    avatar.className='vh-row-avatar';
    avatar.style.background=meta.color;
    avatar.setAttribute('aria-hidden','true');
    if(meta.photo){
      var img=document.createElement('img');
      img.src=meta.photo;img.alt='';img.loading='lazy';
      img.addEventListener('error',function(){img.remove();avatar.textContent=meta.initials;});
      avatar.appendChild(img);
    }else{avatar.textContent=meta.initials;}
    var info=document.createElement('div');
    info.className='vh-row-info';
    var t=document.createElement('div');t.className='vh-row-title';t.textContent=title;
    var m=document.createElement('div');m.className='vh-row-meta';
    m.innerHTML=VH_CAL_SVG+'<span>'+v.date+' · '+v.author+'</span>';
    info.append(t,m);
    var actions=document.createElement('div');
    actions.className='vh-row-actions';
    var restore=document.createElement('button');
    restore.type='button';restore.className='vh-row-restore';restore.textContent='Restore';
    var kebab=document.createElement('button');
    kebab.type='button';kebab.className='vh-row-kebab';
    kebab.setAttribute('aria-label','More actions');
    kebab.setAttribute('aria-haspopup','menu');
    kebab.setAttribute('aria-expanded','false');
    kebab.dataset.menuTrigger=String(index);
    kebab.innerHTML=VH_KEBAB_SVG;
    var menu=document.createElement('div');
    menu.className='vh-row-menu';menu.setAttribute('role','menu');menu.dataset.menuId=String(index);
    menu.innerHTML='<button class="vh-row-menu-item" role="menuitem" type="button">'+VH_EYE_SVG+'<span>Preview</span></button>'+'<button class="vh-row-menu-item" role="menuitem" type="button">'+VH_CLOCK_SVG+'<span>Save as Version</span></button>';
    actions.append(restore,kebab,menu);
    row.append(avatar,info,actions);
    return row;
  }
  var list=document.getElementById('vhVersionList');
  if(list&&!list.children.length){VERSION_HISTORY.forEach(function(v,i){list.appendChild(buildVersionRow(v,i));});}
})();`;
