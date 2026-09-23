// AUTO-EXTRACTED verbatim markup from translations/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
//
// The two table snippets below are captured from the LIVE DOM after switching
// the app's language picker to Arabic / Hindi — the markup you see is exactly
// what the project's own runtime localization pass (regex + Intl.NumberFormat
// digit-set mapping, ~line 41335 of index.html) produces, not hand-typed digits.
export default {
  dropdown_language: {
    note: '.ch-profile-menu.is-lang — profile-chip language picker: type-ahead combo box (search input + role="listbox" below it) over the same 10 endonym-labeled languages, reached via the "me" chip → Language row. Typing filters live against each language\'s native name AND its English exonym (e.g. "ar" matches Arabic even though its native label "العربية" has no latin letters); Arrow keys + Enter walk and confirm the filtered results, click selects directly, and Esc bubbles up to the existing close-on-Escape handler. The active language keeps the same checkmark affordance as before (now paired with aria-selected). Selecting a row still flips <html dir> + rail/menu mirroring for rtl:true languages, unchanged.',
    minHeight: 660,
    html: `<div class="ch-profile-menu is-lang" style="position:static;">
  <div class="ch-profile-stack">
    <div class="ch-profile-view ch-profile-view-lang is-visible">
      <div class="ch-profile-themes-head">
        <span class="ch-profile-themes-title" data-i18n="profileLanguageRow">Language</span>
        <button class="ch-profile-themes-close" type="button" data-action="close-lang" aria-label="Close" data-i18n-aria-label="labelClose">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"></path></svg>
        </button>
      </div>
      <div class="ch-profile-divider" aria-hidden="true"></div>
      <div class="ch-lang-combo">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4.5"></circle><line x1="10.4" y1="10.4" x2="13.5" y2="13.5"></line></svg>
        <input type="text" class="ch-lang-search-input" id="chLangSearchInput" role="combobox" aria-expanded="true" aria-controls="chLangListbox" aria-autocomplete="list" aria-haspopup="listbox" autocomplete="off" spellcheck="false" placeholder="Search" aria-label="Search languages" data-i18n-placeholder="labelSearch">
        <button class="ch-lang-combo-clear" type="button" aria-label="Clear search"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"></path></svg></button>
      </div>
      <div class="ch-profile-theme-list" id="chLangListbox" role="listbox" aria-label="Languages">
        <button class="ch-profile-theme-row ch-profile-lang-row is-active" type="button" id="chLangOpt-en" data-lang="en" role="option" aria-selected="true"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>English</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-es" data-lang="es" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>Español</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-fr" data-lang="fr" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>Français</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-de" data-lang="de" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>Deutsch</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-fi" data-lang="fi" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>Suomi</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-ru" data-lang="ru" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>Русский</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-ar" data-lang="ar" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>العربية</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-ja" data-lang="ja" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>日本語</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-th" data-lang="th" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>ไทย</span></button>
        <button class="ch-profile-theme-row ch-profile-lang-row" type="button" id="chLangOpt-hi" data-lang="hi" role="option" aria-selected="false"><span class="ch-lang-check"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"></path></svg></span><span>हिन्दी</span></button>
      </div>
      <div class="img-picker-empty" hidden></div>
    </div>
  </div>
</div>`
  },

  table_rtl: {
    note: '[dir="rtl"] .scope-table — funnel-cascade board table under Arabic. Column order + cell text-align mirror via the dir attribute; the sortable-header carets and the row accent strip (default anchored to physical left:0) both flip to the reading edge — hover a row to see the strip land on the right and the wash fade toward it.',
    minHeight: 520,
    html: `<div dir="rtl" lang="ar">
  <div class="scope-table-wrap">
    <table class="scope-table" data-qa-scope="" aria-label="سلسلة المسار">
      <thead><tr>
        <th><button class="scope-sort-btn" type="button" data-col="0" data-type="text"><span>مرحلة المسار</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="1" data-type="text"><span>نطاق القيمة المتوقع</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="2" data-type="text"><span>مؤشر التحويل / الكفاءة</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="3" data-type="text"><span>مستوى البيانات / الأساس</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
      </tr></thead>
      <tbody>
        <tr><td>١. الإنفاق الاستثماري</td><td>$٧٥٫٠&nbsp;مليون USD موحّدة</td><td>US: $٥٠٫٠&nbsp;مليون / FR: $٢٥٫٠&nbsp;مليون</td><td>مؤكَّد · P4</td></tr>
        <tr><td>٢. مرات الظهور</td><td>١٫٢&nbsp;مليار – ١٫٥&nbsp;مليار ظهور</td><td>CPM مدمج: $٥٠٫٠٠–٦٢٫٥٠</td><td>إرشادي · مرجعي</td></tr>
        <tr><td>٣. الوصول (المسافرون النشطون)</td><td>٥٫٤&nbsp;مليون – ٦٫٢&nbsp;مليون تم الوصول إليهم</td><td>٧٤٪ – ٨٤٪ من إجمالي المجموعة القابلة للاستهداف</td><td>مُنمذج</td></tr>
        <tr><td>٤. التكرار</td><td>تكرار ٢٫٢x – ٢٫٨x</td><td>مثالي لبناء العلامة والثقة</td><td>مُنمذج</td></tr>
        <tr><td>٥. النقرات / الزيارات</td><td>١٨٫٠&nbsp;مليون – ٢٤٫٠&nbsp;مليون نقرة</td><td>CTR مدمج: ١٫٥٪ – ١٫٦٪</td><td>إرشادي · مرجعي</td></tr>
        <tr><td>٦. الطلبات المبدوءة</td><td>١٫٨&nbsp;مليون – ٢٫٢&nbsp;مليون بداية</td><td>معدل النقر إلى البدء: ١٠٫٠٪ – ١١٫٠٪</td><td>إرشادي · مرجعي</td></tr>
        <tr><td>٧. الطلبات المكتملة</td><td>١٫١&nbsp;مليون – ١٫٣&nbsp;مليون اكتمال</td><td>معدل الإكمال: ٥٨٫٠٪ – ٦١٫٠٪</td><td>إرشادي · مرجعي</td></tr>
        <tr><td>٨. الحسابات المعتمدة</td><td>٨٢٠&nbsp;ألف – ٩٤٠&nbsp;ألف معتمد</td><td>معدل الموافقة الائتمانية: ٥٥٫٠٪ – ٦٥٫٠٪</td><td>إرشادي</td></tr>
      </tbody>
    </table>
  </div>
</div>`
  },

  table_numerals: {
    note: '.scope-table — same funnel-cascade table under Hindi (LTR script, kept apart from the RTL case above). Every quantity — currency, ranges, percents, the K/M/B scale words — is re-rendered digit-for-digit into Devanagari via Intl.NumberFormat(\'hi-IN-u-nu-deva\'), not just the labels; hex codes and IDs are explicitly skipped so they never get "translated" into non-numbers.',
    minHeight: 520,
    html: `<div lang="hi">
  <div class="scope-table-wrap">
    <table class="scope-table" data-qa-scope="" aria-label="फ़नल शृंखला">
      <thead><tr>
        <th><button class="scope-sort-btn" type="button" data-col="0" data-type="text"><span>फ़नल चरण</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="1" data-type="text"><span>अनुमानित मूल्य परास</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="2" data-type="text"><span>रूपांतरण / दक्षता मापक</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
        <th><button class="scope-sort-btn" type="button" data-col="3" data-type="text"><span>डेटा स्तर / आधार</span><span class="scope-sort-icons" aria-hidden="true"><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"></path></svg><svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"></path></svg></span></button></th>
      </tr></thead>
      <tbody>
        <tr><td>१. निवेश व्यय</td><td>$७५.०&nbsp;मिलियन USD समेकित</td><td>US: $५०.०&nbsp;मिलियन / FR: $२५.०&nbsp;मिलियन</td><td>पुष्ट · P4</td></tr>
        <tr><td>२. इंप्रेशन</td><td>१.२&nbsp;अरब – १.५&nbsp;अरब इंप्रेशन</td><td>मिश्रित CPM: $५०.००–६२.५०</td><td>संकेतात्मक · मानक</td></tr>
        <tr><td>३. पहुँच (सक्रिय यात्री)</td><td>५.४&nbsp;मिलियन – ६.२&nbsp;मिलियन तक पहुँच</td><td>कुल लक्षित समूह का ७४% – ८४%</td><td>मॉडल आधारित</td></tr>
        <tr><td>४. आवृत्ति</td><td>आवृत्ति २.२x – २.८x</td><td>ब्रांड निर्माण और विश्वास के लिए उपयुक्त</td><td>मॉडल आधारित</td></tr>
        <tr><td>५. क्लिक / विज़िट</td><td>१८.०&nbsp;मिलियन – २४.०&nbsp;मिलियन क्लिक</td><td>मिश्रित CTR: १.५% – १.६%</td><td>संकेतात्मक · मानक</td></tr>
        <tr><td>६. आरंभ किए गए आवेदन</td><td>१.८&nbsp;मिलियन – २.२&nbsp;मिलियन आरंभ</td><td>क्लिक से आरंभ दर: १०.०% – ११.०%</td><td>संकेतात्मक · मानक</td></tr>
        <tr><td>७. पूर्ण किए गए आवेदन</td><td>१.१&nbsp;मिलियन – १.३&nbsp;मिलियन पूर्ण</td><td>पूर्णता दर: ५८.०% – ६१.०%</td><td>संकेतात्मक · मानक</td></tr>
        <tr><td>८. स्वीकृत खाते</td><td>८२०&nbsp;हज़ार – ९४०&nbsp;हज़ार स्वीकृत</td><td>ऋण स्वीकृति दर: ५५.०% – ६५.०%</td><td>संकेतात्मक</td></tr>
      </tbody>
    </table>
  </div>
</div>`
  }
};
