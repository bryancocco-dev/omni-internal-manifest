// AUTO-EXTRACTED verbatim markup from canvas-qa/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, bodyClass, html }.
// bodyClass:'brief-stack' is required — the qa-* components consume --qa-* custom
// properties defined only on .brief-stack, so the snippet body must carry that class.
export default {
  callout_spine: {
    note: '.qa-callout--spine — hairline-card "Strategic Spine" emphasis callout: pinned eyebrow chip, lede divider, then qa-def/qa-prov provenance rows',
    minHeight: 560,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <div class="qa-callout qa-callout--spine">
              <span class="qa-chip qa-callout-eyebrow">Directional — Category Benchmarks &amp; Modeled Ranges</span>
              <p class="qa-callout-title">The Lead Projected Outcome (Strategic Spine)</p>
              <p class="qa-spine-lede">A recommended consolidated investment of $75.0M USD equivalent projects 1.2B – 1.5B impressions, 5.4M – 6.2M reach at 2.2x – 2.8x frequency, and 820k – 940k approved accounts. This meets the consolidated target of 900k approved accounts, driven by 610k – 680k US accounts and 210k – 260k France accounts.</p>
              <p class="qa-def"><span class="qa-def-k">Recommended Spend:</span> <span class="qa-def-v">$75.0M USD Consolidated ($50.0M US / $25.0M FR / EUR 23.0M)</span> <span class="qa-prov">Sourced · P4</span></p>
              <p class="qa-def"><span class="qa-def-k">Projected Media Impressions:</span> <span class="qa-def-v">1.2B – 1.5B Impressions</span> <span class="qa-prov">Directional</span></p>
              <p class="qa-def"><span class="qa-def-k">Projected Active Traveler Reach:</span> <span class="qa-def-v">5.4M – 6.2M Reached (74% – 84% Pool Penetration)</span> <span class="qa-prov">Modeled</span></p>
              <p class="qa-def"><span class="qa-def-k">Projected Approved Accounts:</span> <span class="qa-def-v">820k – 940k Accounts (Consolidated)</span> <span class="qa-prov">Modeled</span></p>
              <p class="qa-def"><span class="qa-def-k">Projected Blended Acquisition CPA:</span> <span class="qa-def-v">$80 – $91 CPA</span> <span class="qa-prov">Directional</span></p>
              <p class="qa-def"><span class="qa-def-k">Projected Early Activations:</span> <span class="qa-def-v">690k – 810k Accounts (Blended Activation &gt;84%)</span> <span class="qa-prov">Modeled</span></p>
              <p class="qa-def"><span class="qa-def-k">The Assumption To Validate First:</span> <span class="qa-def-v">Credit Approval Rate (55% – 65% underwriting range)</span> <span class="qa-prov">Directional</span></p>
            </div>
          </div></article>`
  },

  kpi: {
    note: '.qa-kpi-grid — unified metric card (qa-kpi/qa-stat/qa-frame-card share one treatment): hairline border, big tabular number, 2-line label, chip pinned bottom',
    minHeight: 300,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <h2 class="qa-h2">Key Performance Metrics Snapshot</h2>
            <div class="qa-kpi-grid">
              <div class="qa-kpi qa-kpi--accounts">
                <div class="qa-kpi-num">610–680K</div>
                <div class="qa-kpi-label">Expected US Accounts</div>
                <span class="qa-chip">Modeled</span>
              </div>
              <div class="qa-kpi qa-kpi--accounts">
                <div class="qa-kpi-num">210–260K</div>
                <div class="qa-kpi-label">Expected FR Accounts</div>
                <span class="qa-chip">Modeled</span>
              </div>
              <div class="qa-kpi qa-kpi--benchmark">
                <div class="qa-kpi-num">$78–$88</div>
                <div class="qa-kpi-label">Expected Blended CPA</div>
                <span class="qa-chip qa-chip--active">Benchmark</span>
              </div>
              <div class="qa-kpi qa-kpi--caution">
                <div class="qa-kpi-num">$85–$90M</div>
                <div class="qa-kpi-label">Diminishing Returns</div>
                <span class="qa-chip">Modeled</span>
              </div>
            </div>
          </div></article>`
  },

  venn: {
    note: '.qa-venn — flat technical-drawing bubble chart, hairline-ringed circles sized ∝ √(users), geo-coded stroke (grey=US / blue=FR), diamond layout',
    minHeight: 820,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <header class="qa-head">
              <p class="qa-eyebrow">Audience Insight</p>
              <h2 class="qa-h2">The Market: Who Buys Transatlantic Travel</h2>
            </header>
            <div class="qa-legend">
              <span class="us">United States Targets</span>
              <span class="fr">French Targets</span>
            </div>
            <div class="qa-venn">
              <div class="qa-bubble is-us qa-b-carter">
                <span class="bub-name">US Luxury Commuters<em>Carter</em></span>
                <span class="bub-num">1.25M</span>
                <span class="bub-unit">users</span>
                <span class="bub-meta">HHI $280k+ · +12.4% YoY</span>
              </div>
              <div class="qa-bubble is-us qa-b-sophia">
                <span class="bub-name">US Points-Maximizers<em>Sophia</em></span>
                <span class="bub-num">850k</span>
                <span class="bub-unit">users</span>
                <span class="bub-meta">HHI $165k+ · +14.8% YoY</span>
              </div>
              <div class="qa-bubble is-fr qa-b-chloe">
                <span class="bub-name">FR Eco Boutique Stayers<em>Chloe</em></span>
                <span class="bub-num">480k</span>
                <span class="bub-unit">users</span>
              </div>
              <div class="qa-bubble is-fr qa-b-louis">
                <span class="bub-name">FR Urban Professionals<em>Louis</em></span>
                <span class="bub-num">620k</span>
                <span class="bub-unit">users</span>
              </div>
            </div>
          </div></article>`
  },

  plan: {
    note: '.qa-plans — stacked scenario comparison cards (recommended/conservative/aggressive), each a qa-plan-title + qa-def rows',
    minHeight: 780,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <header class="qa-head">
              <p class="qa-eyebrow">Media Strategy</p>
              <h2 class="qa-h2">Detailed Scenario Trade-Off Analysis</h2>
            </header>
            <div class="qa-plans">
              <div class="qa-plan qa-plan--rec">
                <p class="qa-plan-title">Recommended Plan ($75.0M USD Consolidated)</p>
                <p class="qa-def"><span class="qa-def-k">US Allocation:</span> <span class="qa-def-v">$50.0M USD</span></p>
                <p class="qa-def"><span class="qa-def-k">France Allocation:</span> <span class="qa-def-v">EUR 23.0M (approx. $25.0M USD)</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Delivers:</span> <span class="qa-def-v">Transatlantic airport OOH, national CTV, comprehensive social-first, and core dining promos.</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Risks:</span> <span class="qa-def-v">Potential customer acquisition cost decay as French traveler market approaches saturation.</span></p>
                <p class="qa-def"><span class="qa-def-k">Best When:</span> <span class="qa-def-v">Audience conversion curves match category norms and early mobile-wallet setup is high.</span></p>
              </div>
              <div class="qa-plan qa-plan--cons">
                <p class="qa-plan-title">Conservative Plan ($55.0M USD Consolidated)</p>
                <p class="qa-def"><span class="qa-def-k">US Allocation:</span> <span class="qa-def-v">$38.0M USD</span></p>
                <p class="qa-def"><span class="qa-def-k">France Allocation:</span> <span class="qa-def-v">EUR 15.6M (approx. $17.0M USD)</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Delivers:</span> <span class="qa-def-v">Core paid search coverage, localized digital video, and key social-first content.</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Risks:</span> <span class="qa-def-v">Severe under-scale awareness in France, causing acquisition targets to fall short.</span></p>
                <p class="qa-def"><span class="qa-def-k">Best When:</span> <span class="qa-def-v">Global macroeconomic factors squeeze traveler demand or initial conversion indices are extremely high.</span></p>
              </div>
              <div class="qa-plan qa-plan--agg">
                <p class="qa-plan-title">Aggressive Plan ($100.0M USD Consolidated)</p>
                <p class="qa-def"><span class="qa-def-k">US Allocation:</span> <span class="qa-def-v">$65.0M USD</span></p>
                <p class="qa-def"><span class="qa-def-k">France Allocation:</span> <span class="qa-def-v">EUR 32.0M (approx. $35.0M USD)</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Delivers:</span> <span class="qa-def-v">High-impact creator partnerships, national CTV saturation, expanded OOH takeovers, and massive dining promotions.</span></p>
                <p class="qa-def"><span class="qa-def-k">What It Risks:</span> <span class="qa-def-v">Elevated blended acquisition cost and overexposure risk if conversion efficiency lags the added spend.</span></p>
                <p class="qa-def"><span class="qa-def-k">Best When:</span> <span class="qa-def-v">Land-grab share capture is the priority and the category window is open ahead of competitors.</span></p>
              </div>
            </div>
          </div></article>`
  },

  tension: {
    note: '.qa-tension-grid — strategic tension cards (auto-fit grid), qa-tension-title + severity qa-chip + qa-def rows; 2 of 4 shown',
    minHeight: 520,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <header class="qa-head">
              <p class="qa-eyebrow">Brief Analytics</p>
              <h2 class="qa-h2">Strategic Tensions &amp; Challenges</h2>
            </header>
            <div class="qa-tension-grid">
              <div class="qa-tension">
                <p class="qa-tension-title">Rewards vs. Regulation</p>
                <span class="qa-chip qa-chip--sev-hi">High severity</span>
                <p class="qa-def"><span class="qa-def-k">The Tension:</span> <span class="qa-def-v">US point-hackers expect high-value sign-up points in both regions, but French interchange fee caps (capped at 0.3%) make points-hacking credit models financially unsustainable in France.</span></p>
                <p class="qa-def"><span class="qa-def-k">Why It Bites:</span> <span class="qa-def-v">The points value proposition either squeezes Meridian's margins in Europe or makes the offer thin and unappealing in the US, where customers are accustomed to 60k–80k point sign-up bonuses.</span></p>
                <p class="qa-def"><span class="qa-def-k">The Creative Challenge:</span> <span class="qa-def-v">Build an experiential and lifestyle reward story (e.g., "access") that feels just as valuable as high-cost points, bypassing the transactional rewards trap in Europe while maintaining high premium prestige in the US.</span></p>
              </div>
              <div class="qa-tension">
                <p class="qa-tension-title">Global Status vs. Local Compliance</p>
                <span class="qa-chip qa-chip--sev-md">Medium severity</span>
                <p class="qa-def"><span class="qa-def-k">The Tension:</span> <span class="qa-def-v">French financial regulations (AMF/ACPR) mandate prominent consumer debt warnings on all card advertising (e.g., "Un crédit vous engage…"), which directly clashes with the luxury, friction-free aesthetic required to attract premium transatlantic travelers.</span></p>
                <p class="qa-def"><span class="qa-def-k">Why It Bites:</span> <span class="qa-def-v">If regulatory disclosures are treated as legal boilerplate, they can ruin the premium editorial feel of high-end lifestyle ads; if they are hidden, Meridian faces massive fines and reputation damage.</span></p>
                <p class="qa-def"><span class="qa-def-k">The Creative Challenge:</span> <span class="qa-def-v">Treat mandatory disclosure as a deliberate design system element, weaving compliance copy into the layout so it reads as confident transparency rather than fine-print apology.</span></p>
              </div>
            </div>
          </div></article>`
  },

  audiencecard: {
    note: '.qa-aud — audience list card: stats row + qa-aud-facts dl + capability qa-chips + qa-aud-cta action-row buttons',
    minHeight: 620,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <header class="qa-aud-header">
              <h2 class="qa-h2">Audiences</h2>
              <p class="qa-aud-count">12 audiences found</p>
            </header>
            <div class="qa-aud">
              <div class="qa-aud-head">
                <div>
                  <p class="qa-aud-name">All Travelers</p>
                  <p class="qa-aud-meta">SEED · ID 144642 · Universal Demo Client · Public</p>
                </div>
                <span class="qa-aud-status">Active</span>
              </div>
              <div class="qa-aud-stats">
                <div class="qa-aud-stat"><span class="qa-aud-stat-v">186,654,504</span><span class="qa-aud-stat-k">Users</span></div>
                <div class="qa-aud-stat"><span class="qa-aud-stat-v">120,469,417</span><span class="qa-aud-stat-k">Households</span></div>
              </div>
              <dl class="qa-aud-facts">
                <div><dt>Created by</dt><dd>alexa.purdy.omc.com</dd></div>
                <div><dt>Created</dt><dd>Jun 11, 2026</dd></div>
                <div><dt>Market</dt><dd>US · Client 56078</dd></div>
              </dl>
              <div class="qa-aud-caps">
                <span class="qa-aud-caps-label">Capabilities</span>
                <span class="qa-chip qa-chip--cap">Persona Reportable</span>
                <span class="qa-chip qa-chip--cap">Reportable</span>
                <span class="qa-chip qa-chip--cap">Geo Reportable</span>
              </div>
              <div class="qa-aud-cta">
                <p class="qa-aud-cta-label">Explore this audience</p>
                <div class="qa-aud-cta-grid">
                  <button class="qa-aud-action" type="button">
                    <span class="qa-aud-action-ico"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14H5v-2h6v2zm8-4H5v-2h14v2zm0-4H5V7h14v2z"/></svg></span>
                    <span class="qa-aud-action-body">
                      <span class="qa-aud-action-name">Audience Details</span>
                      <span class="qa-aud-action-sub">Full segment breakdown &amp; reach</span>
                    </span>
                    <span class="qa-aud-action-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></span>
                  </button>
                  <button class="qa-aud-action" type="button">
                    <span class="qa-aud-action-ico"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2.051V11h8.949c-.47-4.717-4.232-8.479-8.949-8.949zm4.969 17.953c2.189-1.637 3.694-4.14 3.98-7.004h-8.183l4.203 7.004z"/><path d="M11 12V2.051C5.954 2.555 2 6.824 2 12c0 5.514 4.486 10 10 10a9.93 9.93 0 0 0 4.255-.964s-5.253-8.915-5.254-9.031A.02.02 0 0 0 11 12z"/></svg></span>
                    <span class="qa-aud-action-body">
                      <span class="qa-aud-action-name">Demographic Insights</span>
                      <span class="qa-aud-action-sub">Age, geography &amp; affinity profile</span>
                    </span>
                    <span class="qa-aud-action-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></span>
                  </button>
                </div>
              </div>
            </div>
          </div></article>`
  },

  moodboard: {
    note: '.qa-mood — hero + 2-tile creative moodboard grid, gradient caption overlay (qa-mood-k label + copy) on each figure',
    minHeight: 1150,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <section class="qa-adblock">
              <p class="qa-adlabel" data-no="03">Moodboard</p>
              <div class="qa-mood">
                <figure class="qa-mood-hero">
                  <img src="assets/art-a.jpg" alt="Architectural lounge">
                  <figcaption class="qa-mood-cap">
                    <span class="qa-mood-k">Environment</span>
                    <p>Quiet, architectural lounges designed for the disconnected pause.</p>
                  </figcaption>
                </figure>
                <div class="qa-mood-row">
                  <figure class="qa-mood-tile">
                    <img src="assets/art-b.jpg" alt="Navy and wood tones">
                    <figcaption class="qa-mood-cap">
                      <span class="qa-mood-k">Colour</span>
                      <p>Deep navy and rustic wood under warm afternoon light.</p>
                    </figcaption>
                  </figure>
                  <figure class="qa-mood-tile">
                    <img src="assets/art-c.jpg" alt="Golden light on travel-tunnel geometry">
                    <figcaption class="qa-mood-cap">
                      <span class="qa-mood-k">Detail</span>
                      <p>Golden light on raw travel-tunnel geometry.</p>
                    </figcaption>
                  </figure>
                </div>
              </div>
              <p class="qa-treat"><b>Treatment</b>35mm · natural light only · 2.39:1 anamorphic · fine film grain · no synthetic colour</p>
            </section>
          </div></article>`
  },

  dodont: {
    note: '.qa-dodont — mirrored do/don\'t cards (qa-dd--do / qa-dd--dont), heading + bulleted guardrail list',
    minHeight: 420,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <p class="qa-adlabel" data-no="04">Do + Don't</p>
            <div class="qa-dodont">
              <div class="qa-dd qa-dd--do">
                <h4>Chase This</h4>
                <ul>
                  <li>Single human subjects captured in quiet, private transit rituals.</li>
                  <li>Natural morning and evening daylight highlighting physical, matte textures.</li>
                  <li>Raw concrete, travertine stone, wood panels, and fine-grain leather.</li>
                  <li>Cool, desaturated, or warm-ochre daylight tones reflecting architectural beauty.</li>
                </ul>
              </div>
              <div class="qa-dd qa-dd--dont">
                <h4>Avoid This</h4>
                <ul>
                  <li>Over-saturated stock photography containing business teams or artificial smiles.</li>
                  <li>Harsh studio lighting, synthetic plastics, or over-saturated cyan and orange color grading.</li>
                  <li>Text, words, logos, or commercial branding embedded within imagery.</li>
                  <li>Hustle-and-bustle motion blur of busy airports, rushed travelers, and crowded terminals.</li>
                </ul>
              </div>
            </div>
          </div></article>`
  },

  radial: {
    note: '.qa-radial — Chart.js multi-ring doughnut container + custom qa-radial-legend (dot + big number + label); canvas is blank without the Chart.js init script, legend renders standalone',
    minHeight: 420,
    pad: '0',
    bodyClass: 'brief-stack',
    html: `<article class="brief-board"><div class="sec-body">
            <header class="qa-head">
              <p class="qa-eyebrow">Measurement Framework · Results</p>
              <h2 class="qa-h2">Consolidated Framework Target Alignment: 94%</h2>
            </header>
            <div class="qa-chart">
              <div class="qa-radial">
                <div class="qa-radial-canvas"><canvas id="alignRadial"></canvas></div>
                <ul class="qa-radial-legend">
                  <li><span class="dot" style="--dot:#1858ee"></span><div class="meta"><b>98</b><span>Approved Accounts</span></div></li>
                  <li><span class="dot" style="--dot:#5681f0"></span><div class="meta"><b>94</b><span>Blended CPA Index</span></div></li>
                  <li><span class="dot" style="--dot:#86a5f5"></span><div class="meta"><b>101</b><span>Early Activation Rate</span></div></li>
                  <li><span class="dot" style="--dot:#b3c5fa"></span><div class="meta"><b>96</b><span>Active Traveler Reach</span></div></li>
                </ul>
              </div>
            </div>
          </div></article>`
  }
};
