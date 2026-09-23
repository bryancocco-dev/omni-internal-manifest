// AUTO-EXTRACTED verbatim markup from themes/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_themeeditor: {
    note: '.ch-te-overlay / .ch-te-panel — "Create your own" theme editor: name, light/dark base, accent swatch grid, custom hex, icon picker trigger',
    minHeight: 660,
    html: `<div class="ch-te-overlay is-open" style="position:static;display:flex;opacity:1;visibility:visible;">
      <div class="ch-te-panel" role="dialog" aria-label="Create your own theme" aria-modal="true">
        <div class="ch-te-head">
          <span class="ch-te-title">Create your own</span>
          <button class="ch-te-close" type="button" aria-label="Close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>
        </div>
        <div class="ch-te-label">Name</div>
        <input class="ch-te-name" type="text" maxlength="40" placeholder="My theme" value="" aria-label="Theme name">
        <div class="ch-te-label">Base</div>
        <div class="ch-te-seg" role="group" aria-label="Base mode">
          <button class="ch-te-seg-btn is-active" type="button" data-base="light"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.06 1.06M4.46 11.54L3.4 12.6M12.6 12.6l-1.06-1.06M4.46 4.46L3.4 3.4"/></svg><span>Light</span></button>
          <button class="ch-te-seg-btn" type="button" data-base="dark"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4 4 0 0 0 7 7z"/></svg><span>Dark</span></button>
        </div>
        <div class="ch-te-label">Accent color</div>
        <div class="ch-te-swatches">
          <button class="ch-te-swatch is-active" type="button" data-accent="#1858ee" style="--sw:#1858ee" aria-label="#1858ee"></button>
          <button class="ch-te-swatch" type="button" data-accent="#4f46e5" style="--sw:#4f46e5" aria-label="#4f46e5"></button>
          <button class="ch-te-swatch" type="button" data-accent="#8b5cf6" style="--sw:#8b5cf6" aria-label="#8b5cf6"></button>
          <button class="ch-te-swatch" type="button" data-accent="#0de0e1" style="--sw:#0de0e1" aria-label="#0de0e1"></button>
          <button class="ch-te-swatch" type="button" data-accent="#14b8a6" style="--sw:#14b8a6" aria-label="#14b8a6"></button>
          <button class="ch-te-swatch" type="button" data-accent="#16a34a" style="--sw:#16a34a" aria-label="#16a34a"></button>
          <button class="ch-te-swatch" type="button" data-accent="#f59e0b" style="--sw:#f59e0b" aria-label="#f59e0b"></button>
          <button class="ch-te-swatch" type="button" data-accent="#f97316" style="--sw:#f97316" aria-label="#f97316"></button>
          <button class="ch-te-swatch" type="button" data-accent="#f43f5e" style="--sw:#f43f5e" aria-label="#f43f5e"></button>
          <button class="ch-te-swatch" type="button" data-accent="#ec4899" style="--sw:#ec4899" aria-label="#ec4899"></button>
          <button class="ch-te-swatch" type="button" data-accent="#64748b" style="--sw:#64748b" aria-label="#64748b"></button>
        </div>
        <div class="ch-te-custom">
          <label class="ch-te-picker"><span class="ch-te-picker-dot" style="background:#1858ee"></span><span class="ch-te-picker-txt">Custom</span><input class="ch-te-color" type="color" value="#1858ee" aria-label="Custom accent color"></label>
          <input class="ch-te-hex" type="text" spellcheck="false" maxlength="7" value="#1858ee" aria-label="Accent hex value">
        </div>
        <div class="ch-te-label">Icon</div>
        <button class="ch-te-iconbtn" type="button" data-x="pick-icon">
          <i class="bx bx-palette"></i>
          <span class="ch-te-iconbtn-name">palette</span>
          <span class="ch-te-iconbtn-chev" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg></span>
        </button>
        <div class="ch-te-foot">
          <button class="ch-te-reset" type="button" data-x="reset">Reset to default</button>
          <button class="ch-te-done" type="button" data-x="save">Save theme</button>
        </div>
      </div>
    </div>`
  },

  card_themeswatch: {
    note: '.ch-saved-row--ws / .ch-saved-apply — workspace brand-reskin swatch list (accent dot + name; real markup swaps in masked brand logo/wordmark art, omitted here — see caveats)',
    minHeight: 320,
    html: `<div class="ch-profile-workspace">
      <div class="ch-saved-head">Workspace themes</div>
      <div class="ch-saved-row ch-saved-row--ws">
        <button class="ch-saved-apply is-active" type="button" role="menuitem" aria-label="BMW">
          <span class="ch-saved-dot" style="background:#1C69D4"></span>
          <span class="ch-saved-name">BMW</span>
        </button>
      </div>
      <div class="ch-saved-row ch-saved-row--ws">
        <button class="ch-saved-apply" type="button" role="menuitem" aria-label="Porsche">
          <span class="ch-saved-dot" style="background:#D5001C"></span>
          <span class="ch-saved-name">Porsche</span>
        </button>
      </div>
      <div class="ch-saved-row ch-saved-row--ws">
        <button class="ch-saved-apply" type="button" role="menuitem" aria-label="Hermès">
          <span class="ch-saved-dot" style="background:#FF6900"></span>
          <span class="ch-saved-name">Hermès</span>
        </button>
      </div>
      <div class="ch-saved-row ch-saved-row--ws">
        <button class="ch-saved-apply" type="button" role="menuitem" aria-label="Spotify">
          <span class="ch-saved-dot" style="background:#1DB954"></span>
          <span class="ch-saved-name">Spotify</span>
        </button>
      </div>
      <div class="ch-saved-row ch-saved-row--ws">
        <button class="ch-saved-apply" type="button" role="menuitem" aria-label="Nike">
          <span class="ch-saved-dot" style="background:#FA5400"></span>
          <span class="ch-saved-name">Nike</span>
        </button>
      </div>
    </div>`
  },

  menu_thememode: {
    note: '.ch-profile-theme-row — profile-menu Themes panel: Default Omni Dark/Light rows (light/dark toggle chrome) + Create-your-own action',
    minHeight: 340,
    html: `<div class="ch-profile-menu is-themes" style="position:static;opacity:1;visibility:visible;transform:none;">
      <div class="ch-profile-stack">
        <div class="ch-profile-view ch-profile-view-themes is-visible">
          <div class="ch-profile-themes-head">
            <span class="ch-profile-themes-title">Themes</span>
            <button class="ch-profile-themes-close" type="button" aria-label="Close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>
          </div>
          <div class="ch-profile-divider" aria-hidden="true"></div>
          <div class="ch-saved-head">Default</div>
          <div class="ch-profile-theme-list">
            <button class="ch-profile-theme-row" type="button" data-theme="dark" role="menuitem"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4 4 0 0 0 7 7z"/></svg><span>Omni Dark</span></button>
            <button class="ch-profile-theme-row is-active" type="button" data-theme="light" role="menuitem"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.06 1.06M4.46 11.54L3.4 12.6M12.6 12.6l-1.06-1.06M4.46 4.46L3.4 3.4"/></svg><span>Omni Light</span></button>
          </div>
          <button class="ch-profile-theme-row ch-profile-theme-row--custom" type="button" data-action="open-editor" role="menuitem"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5v9M3.5 8h9"/></svg><span>Create your own</span></button>
        </div>
      </div>
    </div>`
  }
};
