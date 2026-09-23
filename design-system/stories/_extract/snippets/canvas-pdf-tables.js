// AUTO-EXTRACTED verbatim markup from canvas-pdf-tables/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  masthead: {
    note: '.masthead — Swiss spec-doc header: mono kicker, big h1, dek paragraph, 4-col meta-stats row (top of an OMNI+ Canvas findings/spec page)',
    minHeight: 320,
    html: `<div class="lab"><header class="masthead">
    <p class="masthead-kicker">OMNI+ Canvas · Export spec · For Sofia Brandt</p>
    <h1>Wide data tables, on paper</h1>
    <p class="masthead-dek">
      The canvas gives a wide table an escape valve that paper does not have: horizontal scroll.
      Today's PDF export keeps the screen's column grid and squeezes it onto a fixed page, so the
      columns collide. The fix is not a smaller font — it is a <strong>fit ladder</strong> that changes
      the table's shape until it fits, in a fixed order, with four things it is never allowed to do.
    </p>
    <div class="masthead-meta">
      <div class="meta-cell"><span class="meta-k">Raised by</span><span class="meta-v">Sofia Brandt — Thu 1:02 PM</span></div>
      <div class="meta-cell"><span class="meta-k">Source</span><span class="meta-v">Create 8 Exportable Canvas Data Tables</span></div>
      <div class="meta-cell"><span class="meta-k">Sample table</span><span class="meta-v">Research Source Inventory — 11 cols</span></div>
      <div class="meta-cell"><span class="meta-k">Status</span><span class="meta-v">Recommendation + working proof</span></div>
    </div>
  </header></div>`
  },

  numberedlist_flagged: {
    note: '.flags — numbered failure legend: red circular index badge + title + description, <code> spans highlight the bad value (pairs with .sheet_broken mockups)',
    minHeight: 300,
    html: `<ul class="flags">
          <li><span class="flag-n">1</span><span><span class="flag-t">Headers overprint each other</span><span class="flag-d">Two column titles are drawn at fixed x-positions with no width check, so they render on top of one another: <code>GEOGRAPHY</code> + <code>SAMPLE</code> come out as <code>GEOGRAPHYSAMPLE</code>.</span></span></li>
          <li><span class="flag-n">2</span><span><span class="flag-t">Cell values collide across columns</span><span class="flag-d">Same cause, one row down: <code>Secondary research</code> and <code>Nielsen / GWI</code> overlap into <code>SecondaryNielsen</code>. Two real values become one unreadable string.</span></span></li>
          <li><span class="flag-n">3</span><span><span class="flag-t">Values break mid-token</span><span class="flag-d">Currency is hyphenated across lines — <code>$18K</code> prints as <code>$18-</code> then <code>K</code>. A number that breaks in half is worse than a number that is cut off, because it still looks like a number.</span></span></li>
          <li><span class="flag-n">4</span><span><span class="flag-t">The prose column drives every row's height</span><span class="flag-d">NOTES gets whatever width is left over — about 14 characters — so one ordinary sentence becomes a 14-line column and stretches its whole row to match.</span></span></li>
          <li><span class="flag-n">5</span><span><span class="flag-t">Rows tear across the page break</span><span class="flag-d">Row 4's NOTES text starts at the bottom of page 1 while the rest of row 4 renders on page 2 — and page 2 then holds a single row on otherwise blank paper.</span></span></li>
        </ul>`
  },

  sheet_broken: {
    note: '.sheet.zoomed (paired pages) — miniature "printed page" mockup of a failed export: overprinted headers, mid-token hyphenation, a torn row spanning the page break, PAGE N OF N mark',
    minHeight: 720,
    pad: '24px',
    html: `<div class="sheet-rail">
          <div>
            <div class="sheet-cap is-bad"><span class="dot"></span>Today's export — page 1</div>
            <div class="sheet zoomed">
              <h3 class="xp-title" style="font-size:17pt;margin-bottom:14px;">Research Source Inventory</h3>
              <table class="bk">
                <colgroup>
                  <col style="width:3.5%"><col style="width:7.5%"><col style="width:8%"><col style="width:8%">
                  <col style="width:7.5%"><col style="width:6%"><col style="width:9%"><col style="width:5.5%">
                  <col style="width:7.5%"><col style="width:6%"><col style="width:31%">
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th><th>METHOD</th><th>VENDOR / SOURCE</th><th>AUDIENCE</th>
                    <th>GEOGRAPHY<span class="flagdot">1</span></th><th>SAMPLE</th><th>WINDOW</th><th>SPEND</th>
                    <th>OUTPUT</th><th>OWNER</th><th>NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="num">1</td><td>Survey</td><td>Kantar</td><td>Adults 18-34</td>
                    <td>US</td><td>1,200</td><td>Apr-May 2026</td><td>$18-K<span class="flagdot">3</span></td>
                    <td>Deck + data</td><td>J. Reyes</td>
                    <td class="notes">Quant survey covering fandom depth and viewing intent for the World Cup. Weighted to census benchmarks and fielded in two waves to track shift ahead of kickoff.<span class="flagdot">4</span></td>
                  </tr>
                  <tr>
                    <td class="num">2</td><td>Social listening</td><td class="ovf">Brandwatch</td><td class="ovf">Sports fans</td>
                    <td>Global</td><td>n/a</td><td>Jan-Jun 2026</td><td>$9K</td>
                    <td>Sentiment report</td><td class="ovf">T. Nguyen</td>
                    <td class="notes">Ongoing listening stream tracking brand mentions and competitor share of voice. Sentiment scoring flagged rising negativity around ticketing that the team should monitor closely.</td>
                  </tr>
                  <tr>
                    <td class="num">3</td><td>Expert interviews</td><td class="ovf">Independent consultants</td><td class="ovf">Category experts</td>
                    <td>US/UK</td><td>8</td><td>Mar 2026</td><td>$12-K</td>
                    <td class="ovf">Synthesis memo</td><td>M. Ortiz</td>
                    <td class="notes">One-on-one interviews with sponsorship and media strategists to stress-test the activation concept. Findings informed the revised channel mix and pacing plan for Q3.</td>
                  </tr>
                  <tr class="torn">
                    <td class="num">4</td><td></td><td></td><td></td>
                    <td></td><td></td><td></td><td></td>
                    <td></td><td></td>
                    <td class="notes">Desk research synthesizing existing syndicated data on streaming habits and<span class="flagdot">5</span></td>
                  </tr>
                </tbody>
              </table>
              <div class="pg-mark">PAGE 1 OF 2</div>
            </div>
          </div>

          <div>
            <div class="sheet-cap is-bad"><span class="dot"></span>Today's export — page 2</div>
            <div class="sheet zoomed">
              <table class="bk">
                <colgroup>
                  <col style="width:3.5%"><col style="width:7.5%"><col style="width:8%"><col style="width:8%">
                  <col style="width:7.5%"><col style="width:6%"><col style="width:9%"><col style="width:5.5%">
                  <col style="width:7.5%"><col style="width:6%"><col style="width:31%">
                </colgroup>
                <tbody>
                  <tr>
                    <td class="num"></td><td class="ovf">Secondary research</td><td class="ovf">Nielsen / GWI<span class="flagdot">2</span></td><td class="ovf">General population</td>
                    <td>Global</td><td>n/a</td><td>Ongoing</td><td>$6K</td>
                    <td class="ovf">Slide summary</td><td>K. Park</td>
                    <td class="notes">major event viewership trends. Used to validate assumptions before commissioning primary research.</td>
                  </tr>
                </tbody>
              </table>
              <div class="pg-mark">PAGE 2 OF 2</div>
            </div>
          </div>
        </div>`
  },

  ladder: {
    note: '.ladder — the 4-step "fit ladder" for wide tables on paper: measure → demote prose → rotate landscape → column-group continuation, each rung stating its rule set and its "fits when" threshold',
    minHeight: 860,
    html: `<div class="ladder">
          <div class="rung">
            <div class="rung-id">Step 0<br>Always on</div>
            <div>
              <h3 class="rung-t">Measure first, then draw</h3>
              <p class="rung-d">
                Everything here applies to every table regardless of width, and on its own repairs three of
                the five failures. Most narrow tables need nothing else.
              </p>
              <ul class="rung-rules">
                <li>Column widths come from measured content, not from an even split</li>
                <li>Header labels wrap to two lines rather than running into their neighbour</li>
                <li>Currency, dates and short codes are marked unbreakable</li>
                <li>The header row repeats at the top of every page</li>
                <li>A row is atomic — it never splits across a page break</li>
              </ul>
            </div>
            <div class="rung-when"><b>Fits when</b>measured width ≤ 7.3in and no prose column is squeezed under ~2in</div>
          </div>

          <div class="rung">
            <div class="rung-id">Step 1<br>Demote prose</div>
            <div>
              <h3 class="rung-t">Long text leaves the grid</h3>
              <p class="rung-d">
                Any column whose typical cell runs past roughly 48 characters is not really a column — it is
                an annotation. It drops out of the grid and prints full-width beneath its own row, where it
                has the whole page to be readable in. This single move is what kills the skyscraper rows.
              </p>
              <ul class="rung-rules">
                <li>Prose is detected by measured median cell length, not by column name</li>
                <li>The note keeps its label so nothing is ambiguous</li>
                <li>Row and note are one unit — they never separate across pages</li>
                <li>The canvas already hints at this with clamped cells and "Expand all" — print just resolves it permanently</li>
              </ul>
            </div>
            <div class="rung-when"><b>Fits when</b>remaining short columns measure ≤ 7.3in</div>
          </div>

          <div class="rung">
            <div class="rung-id">Step 2<br>Rotate</div>
            <div>
              <h3 class="rung-t">That table's pages turn landscape</h3>
              <p class="rung-d">
                Worth 2.5 more inches — about a third more width. A PDF can mix orientations page by page,
                so only the wide table rotates; the surrounding document stays portrait. The reader gets one
                sideways page in an otherwise normal file, which is a long-established convention for wide data.
              </p>
              <ul class="rung-rules">
                <li>Applied per table, not per document</li>
                <li>Prose stays demoted from Step 1 — the two compound</li>
              </ul>
            </div>
            <div class="rung-when"><b>Fits when</b>remaining short columns measure ≤ 9.8in</div>
          </div>

          <div class="rung">
            <div class="rung-id">Step 3<br>Continue</div>
            <div>
              <h3 class="rung-t">Split the columns, repeat the identity</h3>
              <p class="rung-d">
                For genuinely enormous tables, the columns break into groups. The identity columns — the
                ones that tell you which row you are looking at — repeat at the head of each group, and the
                remaining columns continue underneath marked "continued". This is how wide financial tables
                have always been printed, and it guarantees any width fits.
              </p>
              <ul class="rung-rules">
                <li>Identity columns repeat so a row is always identifiable</li>
                <li>Groups stay adjacent — a row's continuation is never on another page</li>
                <li>No column is dropped, so the export stays complete</li>
              </ul>
            </div>
            <div class="rung-when"><b>Fits</b>always — this is the floor</div>
          </div>
        </div>`
  },

  rung_controls: {
    note: '.ctrls + .seg + .readout — segmented rung picker (dark = active) paired with a live measurement readout (columns detected, measured widths in/px, per-rung fit verdict); rendered with real values from the research table',
    minHeight: 420,
    html: `<div class="ctrls">
          <span class="ctrl-lab">Rung</span>
          <div class="seg" id="rungSeg">
            <button type="button" data-rung="0" aria-pressed="false">0 · Measured</button>
            <button type="button" data-rung="1" aria-pressed="false">1 · Prose demoted</button>
            <button type="button" data-rung="2" aria-pressed="true">2 · Landscape</button>
            <button type="button" data-rung="3" aria-pressed="false">3 · Continuation</button>
          </div>
          <span style="flex:1"></span>
          <button class="btn btn--ghost" type="button" id="autoBtn">Use the ladder's own choice</button>
        </div>

        <div class="readout" id="readout"><div class="r-row"><span class="r-k">columns</span><span class="r-v">11 total — 10 short, 1 prose</span></div><div class="r-row"><span class="r-k">detected as prose</span><span class="r-v">Notes (median 169.5 chars)</span></div><hr><div class="r-row"><span class="r-k">measured short columns</span><span class="r-v">8.17in &nbsp;(784px)</span></div><div class="r-row"><span class="r-k">+ prose at 2.00in minimum</span><span class="r-v">10.17in &nbsp;(976px)</span></div><div class="r-row"><span class="r-k">portrait budget</span><span class="r-v">7.14in</span></div><div class="r-row"><span class="r-k">landscape budget</span><span class="r-v">9.64in</span></div><hr><div class="r-row"><span class="r-k">rung 0 · all in grid</span><span class="r-v no">does not fit — prose would get 0.00in, below the 2.00in floor</span></div><div class="r-row"><span class="r-k">rung 1 · prose demoted</span><span class="r-v no">still 1.03in too wide</span></div><div class="r-row"><span class="r-k">rung 2 · landscape</span><span class="r-v ok">fits landscape</span></div><hr><div class="r-row"><span class="r-k">ladder selects</span><span class="r-v r-verdict">RUNG 2 — prose demoted, landscape</span></div></div>`
  },

  sheet_fixed: {
    note: '.sheet.sheet--ls (rung 2 output) — the ladder-fixed export: prose (Notes) demoted to a full-width row under each record, landscape orientation, real measured column widths — no overlaps, no dropped columns',
    minHeight: 680,
    pad: '24px',
    html: `<div class="sheet-rail"><div><div class="sheet-cap is-good"><span class="dot"></span>Rung 2 — prose demoted, landscape</div><div class="sheet sheet--ls zoomed-lg"><p class="xp-kicker">OMNI+ CANVAS — DATA EXPORT</p><h3 class="xp-title">Research Source Inventory</h3><p class="xp-sub">Campaign planning · FIFA World Cup 2026 · Exported July 27, 2026</p><hr class="xp-rule"><table class="fx"><thead><tr><th class="ta-r">#</th><th>Method</th><th>Vendor / Source</th><th>Audience</th><th>Geography</th><th class="ta-r">Sample</th><th>Window</th><th class="ta-r">Spend</th><th>Output</th><th>Owner</th></tr></thead><tbody class="rec"><tr class="data"><td class="ta-r num">1</td><td>Survey</td><td>Kantar</td><td>Adults 18-34</td><td>US</td><td class="nb ta-r">1,200</td><td class="nb">Apr-May 2026</td><td class="nb ta-r">$18K</td><td>Deck + data</td><td class="nb">J. Reyes</td></tr><tr><td class="note" colspan="10"><span class="note-label">Notes</span>Quant survey covering fandom depth and viewing intent for the World Cup. Weighted to census benchmarks and fielded in two waves to track shift ahead of kickoff.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">2</td><td>Social listening</td><td>Brandwatch</td><td>Sports fans</td><td>Global</td><td class="nb ta-r">n/a</td><td class="nb">Jan-Jun 2026</td><td class="nb ta-r">$9K</td><td>Sentiment report</td><td class="nb">T. Nguyen</td></tr><tr><td class="note" colspan="10"><span class="note-label">Notes</span>Ongoing listening stream tracking brand mentions and competitor share of voice. Sentiment scoring flagged rising negativity around ticketing that the team should monitor closely.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">3</td><td>Expert interviews</td><td>Independent consultants</td><td>Category experts</td><td>US/UK</td><td class="nb ta-r">8</td><td class="nb">Mar 2026</td><td class="nb ta-r">$12K</td><td>Synthesis memo</td><td class="nb">M. Ortiz</td></tr><tr><td class="note" colspan="10"><span class="note-label">Notes</span>One-on-one interviews with sponsorship and media strategists to stress-test the activation concept. Findings informed the revised channel mix and pacing plan for Q3.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">4</td><td>Secondary research</td><td>Nielsen / GWI</td><td>General population</td><td>Global</td><td class="nb ta-r">n/a</td><td class="nb">Ongoing</td><td class="nb ta-r">$6K</td><td>Slide summary</td><td class="nb">K. Park</td></tr><tr><td class="note" colspan="10"><span class="note-label">Notes</span>Desk research synthesizing existing syndicated data on streaming habits and major event viewership trends. Used to validate assumptions before commissioning primary research.</td></tr></tbody></table><div class="xp-foot">Exported from OMNI+ Canvas · Research Source Inventory · landscape page</div></div></div></div>`
  },

  table_continuation: {
    note: '.gen-row (rung 3 output) — a wide 15-column table split into repeating column groups: tone-coded rung badge (b-0…b-3), first group prints, a mono .cont-tag divider ("continued (2 of 2)"), identity columns repeat, second group continues with prose demoted',
    minHeight: 840,
    pad: '24px',
    html: `<div class="gen-row"><div class="gen-head"><h3 class="gen-t">Media Plan — Flight Schedule</h3><span class="gen-badge">15 columns</span><span class="gen-badge b-3">Rung 3 · continuation</span><span class="gen-badge">measured 10.89in</span></div><p class="gen-d">The wide end of the deck — fifteen columns, prose included. Too wide even landscape, so the columns continue in groups with the identity columns repeated.</p><div class="sheet-rail"><div><div class="sheet-cap is-good"><span class="dot"></span>Rung 3 · continuation</div><div class="sheet sheet--ls zoomed-lg"><p class="xp-kicker">OMNI+ CANVAS — DATA EXPORT</p><h3 class="xp-title">Media Plan — Flight Schedule</h3><p class="xp-sub">Campaign planning · FIFA World Cup 2026 · Exported July 27, 2026</p><hr class="xp-rule"><table class="fx"><thead><tr><th class="ta-r">#</th><th>Channel</th><th>Placement</th><th>Format</th><th>Market</th><th>Audience</th><th>Flight Start</th><th>Flight End</th><th class="ta-r">Impressions</th><th class="ta-r">CPM</th><th class="ta-r">Budget</th><th class="ta-r">% Mix</th></tr></thead><tbody class="rec"><tr class="data"><td class="ta-r num">1</td><td>Connected TV</td><td>Roku / Hulu</td><td>15s + 30s</td><td>US</td><td>Adults 18-34</td><td class="nb">01 Apr 2026</td><td class="nb">14 Jun 2026</td><td class="nb ta-r">42,500,000</td><td class="nb ta-r">$28.40</td><td class="nb ta-r">$1,207,000</td><td class="nb ta-r">34.2%</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">2</td><td>Social video</td><td>TikTok / Reels</td><td>6s + 9:16</td><td>US / UK</td><td>Sports fans</td><td class="nb">15 Apr 2026</td><td class="nb">19 Jul 2026</td><td class="nb ta-r">88,200,000</td><td class="nb ta-r">$9.10</td><td class="nb ta-r">$802,600</td><td class="nb ta-r">22.7%</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">3</td><td>Online video</td><td>YouTube</td><td>Bumper + skip</td><td>Global</td><td>Adults 18-34</td><td class="nb">01 May 2026</td><td class="nb">19 Jul 2026</td><td class="nb ta-r">61,400,000</td><td class="nb ta-r">$14.75</td><td class="nb ta-r">$905,650</td><td class="nb ta-r">25.6%</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">4</td><td>Audio</td><td>Spotify / podcast</td><td>30s read</td><td>US</td><td>General population</td><td class="nb">01 May 2026</td><td class="nb">14 Jun 2026</td><td class="nb ta-r">18,900,000</td><td class="nb ta-r">$22.00</td><td class="nb ta-r">$415,800</td><td class="nb ta-r">11.8%</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">5</td><td>Out of home</td><td>Host-city DOOH</td><td>Digital 6-sheet</td><td>US / MX / CA</td><td>Sports fans</td><td class="nb">01 Jun 2026</td><td class="nb">19 Jul 2026</td><td class="nb ta-r">9,600,000</td><td class="nb ta-r">$19.30</td><td class="nb ta-r">$185,280</td><td class="nb ta-r">5.7%</td></tr></tbody></table><div class="cont-tag">Media Plan — Flight Schedule — continued (2 of 2)</div><table class="fx"><thead><tr><th class="ta-r">#</th><th>Channel</th><th>Placement</th><th>Primary KPI</th><th>Owner</th></tr></thead><tbody class="rec"><tr class="data"><td class="ta-r num">1</td><td>Connected TV</td><td>Roku / Hulu</td><td>Reach</td><td class="nb">J. Reyes</td></tr><tr><td class="note" colspan="5"><span class="note-label">Notes</span>Front-loaded against the group stage with a hard pacing cap in the fortnight before kickoff to avoid competing with rights-holder inventory at peak price.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">2</td><td>Social video</td><td>TikTok / Reels</td><td>Video views</td><td class="nb">T. Nguyen</td></tr><tr><td class="note" colspan="5"><span class="note-label">Notes</span>Always-on across the tournament window with creative refreshed every ten days to hold frequency without fatigue on the core audience.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">3</td><td>Online video</td><td>YouTube</td><td>Completed views</td><td class="nb">M. Ortiz</td></tr><tr><td class="note" colspan="5"><span class="note-label">Notes</span>Carries the hero film in full and the cutdowns against match-highlight adjacency, with exclusions applied to user-generated re-uploads.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">4</td><td>Audio</td><td>Spotify / podcast</td><td>Frequency</td><td class="nb">K. Park</td></tr><tr><td class="note" colspan="5"><span class="note-label">Notes</span>Host-read placements on the three highest-affinity football podcasts, scheduled to land the week each host market plays its opening fixture.</td></tr></tbody><tbody class="rec"><tr class="data"><td class="ta-r num">5</td><td>Out of home</td><td>Host-city DOOH</td><td>Awareness</td><td class="nb">J. Reyes</td></tr><tr><td class="note" colspan="5"><span class="note-label">Notes</span>Concentrated within a two-mile radius of the eleven US host venues and dayparted to matchday arrival and departure windows only.</td></tr></tbody></table><div class="xp-foot">Exported from OMNI+ Canvas · Media Plan — Flight Schedule · landscape page</div></div></div></div>`
  },

  exportbar: {
    note: '.ctrls — export chrome: primary + ghost action pair ("Export the fixed PDF" vs. today\'s broken version, for comparison) with a mono hint line describing what to verify in the output',
    minHeight: 300,
    html: `<div class="ctrls" style="border-bottom:0;">
          <button class="btn" type="button" id="printBtn">Export the fixed PDF</button>
          <button class="btn btn--ghost" type="button" id="printBrokenBtn">Export today's version, for comparison</button>
        </div>
        <p class="hint" style="margin-top:4px;">
          In the print dialog choose <strong>Save as PDF</strong>, and leave "Headers and footers" off.
          Background graphics can stay off — the design does not depend on them.<br><br>
          <strong>Verified in the generated PDF:</strong> no collided text · <code>$18K</code>, <code>n/a</code>
          and <code>1,200</code> intact · Deliverables portrait while Research and Media Plan are landscape,
          in one file · the column header row reprinted at the top of every continuation page · no row ever
          separated from its own notes across a page break.<br><br>
          Direct export URLs, no dialog — <code>?export=fixed</code> · <code>?export=broken</code> ·
          <code>?export=fixed&amp;stress=6</code> forces the Research table to 24 rows so the multi-page
          behaviour can be checked on real paper.
        </p>`
  },

  reply: {
    note: '.reply — drafted stakeholder-reply card: reply-bar (recipient + Copy button) over a plain-prose reply-body with strong emphasis and an ordered list; "copy to clipboard" pattern for send-as-is drafts',
    minHeight: 780,
    pad: '24px',
    html: `<div class="reply">
          <div class="reply-bar">
            <span class="reply-to">To — Sofia Brandt</span>
            <button class="btn btn--ghost" type="button" id="copyBtn">Copy</button>
          </div>
          <div class="reply-body" id="replyBody">
            <p>Hi Sofia — good catch, and it's a real gap rather than a settings problem.</p>
            <p>
              The short version: the canvas can let a wide table overflow because it has horizontal scroll,
              and the PDF has no such escape. Right now the export keeps the screen's column grid and divides
              a fixed page width between eleven columns, so columns end up narrower than their own headers.
              That's what's producing the overlaps (<strong>GEOGRAPHYSAMPLE</strong>, <strong>SecondaryNielsen</strong>),
              the broken values (<strong>$18K</strong> printing as <strong>$18-</strong> / <strong>K</strong>), and the
              very tall rows — NOTES gets the leftover width, so one sentence becomes fourteen lines.
            </p>
            <p>What I'd recommend instead of shrinking type: let the export change the table's shape, in this order, stopping as soon as it fits.</p>
            <ol>
              <li><strong>Measure before drawing.</strong> Real column widths from content, header labels wrapping to two lines, currency and dates marked unbreakable, the header row repeating on every page, and rows never split across a page break.</li>
              <li><strong>Demote long text.</strong> Any column averaging more than ~48 characters isn't really a column, it's an annotation — it prints full-width under its own row, keeping its label. This alone fixes the tall rows.</li>
              <li><strong>Rotate that table's pages to landscape</strong> if the remaining columns still don't fit. A PDF can mix orientations, so only the wide table turns.</li>
              <li><strong>Continue the columns in groups</strong> for the truly huge ones, repeating the identity columns so every row stays identifiable — the standard wide-financial-table treatment.</li>
            </ol>
            <p>
              Four things it should never do, no matter what: overlap text, break a value mid-token, go below
              8pt, or silently drop a column.
            </p>
            <p>
              I've built a page that shows your Research Source Inventory at each step, with the widths
              genuinely measured, plus a working Export button so you can pull a real fixed PDF and compare
              it against the current one. Happy to walk through it live if that's easier.
            </p>
          </div>
        </div>`
  },
}
