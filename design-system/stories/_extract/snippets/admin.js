// AUTO-EXTRACTED verbatim markup from admin/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  table_users: {
    note: '.tbl — users list table, checkbox select column + sortable header icons + clickable email cell',
    minHeight: 340,
    html: `<table class="tbl">
      <thead>
        <tr>
          <th class="c-check"><input type="checkbox" class="chk" id="checkAll"></th>
          <th>Email <i class="ph ph-arrows-down-up sort"></i></th>
          <th>First Name <i class="ph ph-arrows-down-up sort"></i></th>
          <th>Last Name <i class="ph ph-arrows-down-up sort"></i></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="c-check"><input type="checkbox" class="chk row-chk" data-i="0"></td>
          <td class="email"><button class="email-open" data-i="0">admin@admin.com</button></td>
          <td>admin</td>
          <td>admin</td>
        </tr>
        <tr>
          <td class="c-check"><input type="checkbox" class="chk row-chk" data-i="1" checked></td>
          <td class="email"><button class="email-open" data-i="1">ines.duarte@omc.com</button></td>
          <td>Ines</td>
          <td>Duarte</td>
        </tr>
        <tr>
          <td class="c-check"><input type="checkbox" class="chk row-chk" data-i="2" checked></td>
          <td class="email"><button class="email-open" data-i="2">anton.panovski@omc.com</button></td>
          <td>Anton</td>
          <td>Panovski</td>
        </tr>
        <tr>
          <td class="c-check"><input type="checkbox" class="chk row-chk" data-i="3" checked></td>
          <td class="email"><button class="email-open" data-i="3">mende.bozhinovski@omc.com</button></td>
          <td>Mende</td>
          <td>Bozhinovski</td>
        </tr>
        <tr>
          <td class="c-check"><input type="checkbox" class="chk row-chk" data-i="4"></td>
          <td class="email"><button class="email-open" data-i="4">lee.gardiner@omc.com</button></td>
          <td>Lee</td>
          <td>Gardiner</td>
        </tr>
      </tbody>
    </table>`
  },

  editbar_bulk: {
    note: '.bulkbar — selection toolbar that appears above the users table once rows are checked',
    minHeight: 100,
    html: `<div class="bulkbar" id="bulkbar">
      <span class="cnt"><b id="selCount">3</b> selected</span>
      <button class="btn btn-primary" id="editRecords"><i class="ph ph-pencil-simple"></i> Edit Records</button>
      <button class="btn btn-danger"><i class="ph ph-trash"></i> Delete</button>
    </div>`
  },

  drawer: {
    note: '.drawer — right-edge bulk-edit panel (radio-line status/super-admin sections + empty workspaces/features list-tbl + footer save), opened state forced static',
    minHeight: 800,
    pad: '0',
    html: `<aside class="drawer open" id="drawer" style="position:static;transform:none;box-shadow:none;width:100%;max-width:100%">
      <div class="drawer-head">
        <h2 id="drawerTitle">Editing 3 User Records</h2>
        <i class="ph ph-x x" id="drawerClose"></i>
      </div>
      <div class="drawer-body">
        <div class="dsec">
          <h3 class="dsec-title">Status</h3>
          <label class="radio-line on"><input type="radio" name="status" class="radio" checked> Keep current status</label>
          <label class="radio-line"><input type="radio" name="status" class="radio"> Set all users to active</label>
          <label class="radio-line"><input type="radio" name="status" class="radio"> Set all users to inactive</label>
        </div>
        <div class="dsec">
          <h3 class="dsec-title">Super Admin Access</h3>
          <label class="radio-line on"><input type="radio" name="sa" class="radio" checked> Keep current mixed state (3/3 super-admin)</label>
          <label class="radio-line"><input type="radio" name="sa" class="radio"> Set all users to regular users</label>
          <label class="radio-line"><input type="radio" name="sa" class="radio"> Set all users to super-admin</label>
        </div>
        <div class="dsec">
          <h3 class="dsec-title">Workspaces</h3>
          <table class="list-tbl">
            <thead><tr><th>Workspace</th><th style="text-align:left">Role</th><th>Actions</th></tr></thead>
            <tbody><tr><td colspan="3" class="empty" style="border:none">No workspaces added</td></tr></tbody>
          </table>
          <a class="addlink">Add Workspace</a>
        </div>
        <div class="dsec">
          <h3 class="dsec-title">Features</h3>
          <table class="list-tbl">
            <thead><tr><th>Feature</th><th>Actions</th></tr></thead>
            <tbody><tr><td colspan="2" class="empty" style="border:none">No features added</td></tr></tbody>
          </table>
          <a class="addlink">Add Feature</a>
        </div>
      </div>
      <div class="drawer-foot">
        <button class="btn btn-primary" id="saveUsers" disabled>Save Users</button>
      </div>
    </aside>`
  },

  code_jsoneditor: {
    note: '.editor-wrap (leadspace variant) — gutter + per-line syntax-highlighted JSON code panel with header title/description/actions and drag-resize grip (rendered output of renderEditorInto()+highlightJSON(), sample layout truncated to 5 images)',
    minHeight: 560,
    html: `<div class="ls-head">
      <div>
        <h2>Gateway Leadspace</h2>
        <p>The image mosaic people see when they open this workspace. Valid JSON, exactly 10 image elements.</p>
      </div>
      <div class="ls-acts">
        <button class="btn btn-ghost" id="jsonClear">Clear</button>
        <button class="btn btn-primary" id="jsonSave">Save</button>
      </div>
    </div>
    <div class="ls-col ls-col-editor">
      <div class="code-label">LAYOUT JSON</div>
      <div class="editor-wrap">
        <div class="editor">
          <div class="gutter"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span></div>
          <div class="code"><span class="ln" data-line="0">{</span><span class="ln" data-line="1">  <span class="k">"componentType"</span>: <span class="s">"CanvasGridLayout"</span>,</span><span class="ln" data-line="2">  <span class="k">"data"</span>: {</span><span class="ln" data-line="3">    <span class="k">"rows"</span>: [</span><span class="ln" data-line="4">      { <span class="k">"cells"</span>: [<span class="n">1</span>, <span class="n">1</span>, <span class="n">1</span>, <span class="n">1</span>, <span class="n">1</span>], <span class="k">"hideFrom"</span>: <span class="nul">null</span>, <span class="k">"showFrom"</span>: <span class="nul">null</span> }</span><span class="ln" data-line="5">    ],</span><span class="ln" data-line="6">    <span class="k">"images"</span>: [</span><span class="ln" data-line="7">      { <span class="k">"id"</span>: <span class="s">"img-<span class="n">01</span>"</span>, <span class="k">"src"</span>: <span class="s">"aether-performance-series.jpg"</span>, <span class="k">"alt"</span>: <span class="s">"Aether — Performance Series"</span>, <span class="k">"kind"</span>: <span class="s">"Graphics"</span>, <span class="k">"date"</span>: <span class="s">"Feb <span class="n">14</span>, <span class="n">2026</span>"</span>, <span class="k">"span"</span>: <span class="n">1</span> },</span><span class="ln" data-line="8">      { <span class="k">"id"</span>: <span class="s">"img-<span class="n">02</span>"</span>, <span class="k">"src"</span>: <span class="s">"translation-poster-awe.jpg"</span>, <span class="k">"alt"</span>: <span class="s">"Translation Poster — Awe"</span>, <span class="k">"kind"</span>: <span class="s">"Graphics"</span>, <span class="k">"date"</span>: <span class="s">"Feb <span class="n">13</span>, <span class="n">2026</span>"</span>, <span class="k">"span"</span>: <span class="n">1</span> },</span><span class="ln" data-line="9">      { <span class="k">"id"</span>: <span class="s">"img-<span class="n">03</span>"</span>, <span class="k">"src"</span>: <span class="s">"rear-diffuser-macro.jpg"</span>, <span class="k">"alt"</span>: <span class="s">"Rear Diffuser Macro"</span>, <span class="k">"kind"</span>: <span class="s">"Graphics"</span>, <span class="k">"date"</span>: <span class="s">"Feb <span class="n">13</span>, <span class="n">2026</span>"</span>, <span class="k">"span"</span>: <span class="n">1</span> },</span><span class="ln" data-line="10">      { <span class="k">"id"</span>: <span class="s">"img-<span class="n">04</span>"</span>, <span class="k">"src"</span>: <span class="s">"veyronyx-gt-cover.jpg"</span>, <span class="k">"alt"</span>: <span class="s">"Veyronyx GT Cover"</span>, <span class="k">"kind"</span>: <span class="s">"Graphics"</span>, <span class="k">"date"</span>: <span class="s">"Feb <span class="n">12</span>, <span class="n">2026</span>"</span>, <span class="k">"span"</span>: <span class="n">1</span> },</span><span class="ln" data-line="11">      { <span class="k">"id"</span>: <span class="s">"img-<span class="n">05</span>"</span>, <span class="k">"src"</span>: <span class="s">"viotoj-tohe-key-art.jpg"</span>, <span class="k">"alt"</span>: <span class="s">"Viotoj Tohe Key Art"</span>, <span class="k">"kind"</span>: <span class="s">"Graphics"</span>, <span class="k">"date"</span>: <span class="s">"Feb <span class="n">12</span>, <span class="n">2026</span>"</span>, <span class="k">"span"</span>: <span class="n">1</span> }</span><span class="ln" data-line="12">    ]</span><span class="ln" data-line="13">  }</span><span class="ln" data-line="14">}</span></div>
        </div>
        <span class="resize-grip" title="Drag to resize"><svg viewBox="0 0 12 12"><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="6.5" x2="6.5" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>
      </div>
    </div>`
  },

  card_mosaic: {
    note: '.gw-frame mosaic + .manifest table — live preview linked to the JSON editor (breakpoint toggle, image tiles, image manifest list); rendered output of renderLeadspace() for the same 5-image sample as code_jsoneditor',
    minHeight: 520,
    html: `<div class="ls-col ls-col-preview" data-preview-for="jsonCode">
      <div class="gw-sticky">
        <div class="code-label">PREVIEW
          <span class="bp-toggle">
            <button data-bp="lg" class="on" title="Desktop"><i class="ph ph-monitor"></i></button>
            <button data-bp="md" title="Tablet"><i class="ph ph-device-tablet"></i></button>
            <button data-bp="sm" title="Mobile"><i class="ph ph-device-mobile"></i></button>
          </span>
        </div>
        <div class="gw-stage" data-bp="lg">
          <div class="gw-frame">
            <div class="gw-hero" id="prevGrid" style="--gw-cols:5">
              <div class="gw-card" data-img="0" style="grid-column:span 1">
                <img src="/_assets/admin/leadspace/01.png" alt="Aether — Performance Series" loading="lazy">
                <span class="gw-idx">1</span>
              </div>
              <div class="gw-card" data-img="1" style="grid-column:span 1">
                <img src="/_assets/admin/leadspace/02.png" alt="Translation Poster — Awe" loading="lazy">
                <span class="gw-idx">2</span>
              </div>
              <div class="gw-card" data-img="2" style="grid-column:span 1">
                <img src="/_assets/admin/leadspace/03.png" alt="Rear Diffuser Macro" loading="lazy">
                <span class="gw-idx">3</span>
              </div>
              <div class="gw-card" data-img="3" style="grid-column:span 1">
                <img src="/_assets/admin/leadspace/04.png" alt="Veyronyx GT Cover" loading="lazy">
                <span class="gw-idx">4</span>
              </div>
              <div class="gw-card" data-img="4" style="grid-column:span 1">
                <img src="/_assets/admin/leadspace/05.png" alt="Viotoj Tohe Key Art" loading="lazy">
                <span class="gw-idx">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="code-label sub">IMAGES <span class="label-note manifest-count">5 in this mosaic</span></div>
      <table class="manifest">
        <thead><tr><th>Image</th><th>Title</th><th>Type</th><th>Date</th><th style="text-align:center">Span</th></tr></thead>
        <tbody>
          <tr data-img="0">
            <td style="width:34px"><img class="m-th" src="/_assets/admin/leadspace/01.png" alt="" loading="lazy"></td>
            <td class="m-alt">Aether — Performance Series</td>
            <td><span class="kind-chip graphics">Graphics</span></td>
            <td class="m-date">Feb 14, 2026</td>
            <td class="m-span">1</td>
          </tr>
          <tr data-img="1">
            <td style="width:34px"><img class="m-th" src="/_assets/admin/leadspace/02.png" alt="" loading="lazy"></td>
            <td class="m-alt">Translation Poster — Awe</td>
            <td><span class="kind-chip graphics">Graphics</span></td>
            <td class="m-date">Feb 13, 2026</td>
            <td class="m-span">1</td>
          </tr>
          <tr data-img="2">
            <td style="width:34px"><img class="m-th" src="/_assets/admin/leadspace/03.png" alt="" loading="lazy"></td>
            <td class="m-alt">Rear Diffuser Macro</td>
            <td><span class="kind-chip graphics">Graphics</span></td>
            <td class="m-date">Feb 13, 2026</td>
            <td class="m-span">1</td>
          </tr>
          <tr data-img="3">
            <td style="width:34px"><img class="m-th" src="/_assets/admin/leadspace/04.png" alt="" loading="lazy"></td>
            <td class="m-alt">Veyronyx GT Cover</td>
            <td><span class="kind-chip graphics">Graphics</span></td>
            <td class="m-date">Feb 12, 2026</td>
            <td class="m-span">1</td>
          </tr>
          <tr data-img="4">
            <td style="width:34px"><img class="m-th" src="/_assets/admin/leadspace/05.png" alt="" loading="lazy"></td>
            <td class="m-alt">Viotoj Tohe Key Art</td>
            <td><span class="kind-chip graphics">Graphics</span></td>
            <td class="m-date">Feb 12, 2026</td>
            <td class="m-span">1</td>
          </tr>
        </tbody>
      </table>
    </div>`
  }
};
