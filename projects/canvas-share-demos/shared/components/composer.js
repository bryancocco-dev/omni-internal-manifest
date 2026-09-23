/**
 * Rich comment composer — a contenteditable input with a Figma-style toolbar:
 * emoji picker, @-mention people search, and image attach, plus a send button.
 * Built in the OMNI light palette. Emits plain text (mentions serialize as
 * "@Name", emoji as their unicode char) plus any attachments on submit.
 */

const RECENT_EMOJI_KEY = 'canvas-share:emoji-recent';

// Curated emoji set — "char name(s)" per entry (names power search).
const EMOJI = [
  { key: 'smileys', label: 'Smileys & People', icon: iconSmiley(), items: `
    😀 grinning 😃 smiley 😄 laughing happy 😁 grin 😆 laugh 😅 sweat 🤣 rofl 😂 joy tears
    🙂 slight smile 🙃 upside down 😉 wink 😊 blush 😇 innocent halo 🥰 love 😍 heart eyes
    🤩 star struck 😘 kiss 😋 yum tongue 😛 tongue 😜 wink tongue 🤪 zany 🤑 money mouth
    🤗 hug 🤭 giggle 🤔 thinking 😐 neutral 😑 expressionless 😶 no mouth 😏 smirk 😒 unamused
    🙄 eye roll 😬 grimace 😔 pensive sad 😴 sleep 😷 mask 🤒 sick 🥳 party celebrate
    😎 cool sunglasses 🤓 nerd 🧐 monocle 😕 confused 🙁 frown 😮 wow open mouth 😯 hushed
    😲 astonished 😳 flushed 🥺 pleading 😨 fearful 😰 anxious 😥 sad 😢 cry 😭 sob crying
    😱 scream 😖 confounded 😞 disappointed 😩 weary 😫 tired 🥱 yawn 😤 triumph frustrated
    😡 rage angry 😠 angry 🤬 cursing 🥴 woozy 🤯 mind blown 😈 devil 👻 ghost 💀 skull
    👍 thumbs up like 👎 thumbs down dislike 👌 ok 👏 clap 🙌 raised hands 🙏 pray thanks
    👀 eyes 💪 muscle strong 🫶 heart hands 👋 wave hi 🤝 handshake deal 👆 point 🤞 fingers crossed` },
  { key: 'nature', label: 'Animals & Nature', icon: iconLeaf(), items: `
    🔥 fire hot 🌈 rainbow ☀️ sun ⭐ star 🌟 glowing star ✨ sparkles ⚡ zap 🌙 moon ☁️ cloud
    🌊 wave water 🌸 blossom 🌼 flower 🌵 cactus 🌲 tree 🍀 clover luck 🐶 dog 🐱 cat 🦊 fox
    🦁 lion 🐢 turtle 🦋 butterfly 🐝 bee 🐙 octopus 🦉 owl 🐬 dolphin 🌻 sunflower 🍁 leaf` },
  { key: 'food', label: 'Food & Drink', icon: iconApple(), items: `
    🍎 apple 🍕 pizza 🍔 burger 🍟 fries 🌮 taco 🍣 sushi 🍩 donut 🍪 cookie 🎂 cake birthday
    🍰 shortcake 🍫 chocolate 🍿 popcorn ☕ coffee 🍵 tea 🍺 beer cheers 🥂 champagne 🍷 wine
    🥗 salad 🍓 strawberry 🍊 orange 🍇 grapes 🥑 avocado 🍞 bread 🧀 cheese 🍦 ice cream` },
  { key: 'activity', label: 'Activity', icon: iconBall(), items: `
    ⚽ soccer ball 🏀 basketball 🏈 football 🎾 tennis 🏆 trophy win 🥇 gold medal 🎯 target bullseye
    🎮 game 🎲 dice 🎨 art paint 🎬 movie film 🎧 headphones music 🎸 guitar 🎹 piano 🚀 rocket launch
    🏁 finish race 🎉 party popper 🎊 confetti 🎈 balloon 🎁 gift present 🏅 medal` },
  { key: 'travel', label: 'Travel & Places', icon: iconCar(), items: `
    🚗 car ✈️ plane flight 🚆 train 🚢 ship boat 🗺️ map 🏔️ mountain 🏕️ camping tent 🏖️ beach
    🌍 globe world earth 🗼 tower 🏙️ city 🌃 night city 🏝️ island 🛣️ road 🧭 compass 🏠 house home` },
  { key: 'objects', label: 'Objects', icon: iconClip(), items: `
    💡 idea bulb light 📱 phone mobile 💻 laptop computer ⌨️ keyboard 🖥️ desktop 📷 camera 📎 clip attach
    📌 pin 📝 memo note 📁 folder 📊 chart bar 📈 chart up growth 💰 money bag 💵 dollar cash 🔑 key
    🔒 lock 🔔 bell notification ⏰ clock alarm ✏️ pencil write 📖 book 🖊️ pen 🔍 search magnify` },
  { key: 'symbols', label: 'Symbols', icon: iconHeart(), items: `
    ❤️ red heart love 🧡 orange heart 💛 yellow heart 💚 green heart 💙 blue heart 💜 purple heart
    🖤 black heart 🤍 white heart 💯 hundred perfect 💢 anger ✅ check yes done ❌ cross no ❗ exclamation
    ❓ question ⚠️ warning 💬 speech comment 💭 thought bubble ➕ plus add ♻️ recycle ⭕ circle 🔴 red dot` },
  { key: 'flags', label: 'Flags', icon: iconFlag(), items: `
    🏁 checkered flag 🚩 triangular flag 🏳️ white flag 🏴 black flag 🏳️‍🌈 rainbow pride flag 🎌 crossed flags` },
];

function parseItems(str) {
  const tokens = str.trim().split(/\s+/);
  const out = [];
  let cur = null;
  tokens.forEach((t) => {
    // A token that contains a non-letter (emoji) starts a new entry.
    if (/[^a-z]/i.test(t) && !/^[a-z]+$/i.test(t)) {
      cur = { char: t, names: [] };
      out.push(cur);
    } else if (cur) {
      cur.names.push(t.toLowerCase());
    }
  });
  return out;
}
EMOJI.forEach((c) => { c.parsed = parseItems(c.items); });

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_EMOJI_KEY) || '[]'); } catch { return []; }
}
function pushRecent(char) {
  const recent = [char, ...loadRecent().filter((c) => c !== char)].slice(0, 24);
  localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(recent));
}

function initialsOf(name) {
  return name.replace(/\(.*\)/, '').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/* ── SVG icons (toolbar + emoji tabs) ─────────────────────────────────────── */
function iconSmiley() { return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8.5 14.5a4 4 0 0 0 7 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconAt() { return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.6"/><path d="M15.4 9v4a2 2 0 0 0 4 0v-1a7.5 7.5 0 1 0-3 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconImage() { return `<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="9.5" r="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M4 16.5 9 12l4 3.5L16 13l4 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconSend() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 19V6M6 11l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconClock() { return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconLeaf() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M20 4C9 4 4 9 4 17c0 1 0 3 0 3s2 0 3 0C15 20 20 15 20 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 16C11 12 14 10 18 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconApple() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 8c-1.5-2-5-2-6.5 0-2 2.5-1 8 2 10 1.5 1 3 .5 4.5.5s3 .5 4.5-.5c3-2 4-7.5 2-10-1.5-2-5-2-6.5 0Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 8c0-2 1-3.5 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`; }
function iconBall() { return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.2"/></svg>`; }
function iconCar() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 13l1.5-4.5A2 2 0 0 1 7.4 7h9.2a2 2 0 0 1 1.9 1.5L20 13v4.5h-2V19a1 1 0 0 1-2 0v-1.5H8V19a1 1 0 0 1-2 0v-1.5H4V13Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 13h16" stroke="currentColor" stroke-width="1.5"/></svg>`; }
function iconClip() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M18 8.5 10 16.5a3 3 0 0 1-4.2-4.2l8-8a4.5 4.5 0 0 1 6.4 6.4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconHeart() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.3-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.7 12 20 12 20Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`; }
function iconFlag() { return `<svg viewBox="0 0 24 24" fill="none"><path d="M6 21V4m0 1h11l-2 3.5L17 12H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }

/* ── selection helpers (contenteditable) ──────────────────────────────────── */
function insertNodeAtCaret(input, node) {
  input.focus();
  const sel = window.getSelection();
  let range;
  if (sel.rangeCount && input.contains(sel.anchorNode)) {
    range = sel.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(input);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * @param {{placeholder?:string, people?:Array, onSubmit:(text, attachments)=>void, autofocus?:boolean}}
 * @returns {{root:HTMLElement}}
 */
export function createComposer({ placeholder = 'Add a comment…', people = [], onSubmit }) {
  const root = document.createElement('div');
  root.className = 'composer';
  root.innerHTML = `
    <div class="composer__input" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="${placeholder}"></div>
    <div class="composer__attachments"></div>
    <div class="composer__bar">
      <div class="composer__tools">
        <button class="composer__tool" type="button" data-act="emoji" aria-label="Emoji">${iconSmiley()}</button>
        <button class="composer__tool" type="button" data-act="mention" aria-label="Mention someone">${iconAt()}</button>
        <button class="composer__tool" type="button" data-act="image" aria-label="Add image">${iconImage()}</button>
      </div>
      <button class="composer__send" type="button" aria-label="Send">${iconSend()}</button>
    </div>
    <input type="file" accept="image/*" class="composer__file" hidden />`;

  const input = root.querySelector('.composer__input');
  const attachRow = root.querySelector('.composer__attachments');
  const fileInput = root.querySelector('.composer__file');
  const sendBtn = root.querySelector('.composer__send');
  const attachments = [];

  /* ── serialize + submit ── */
  function getText() { return input.textContent.replace(/ /g, ' ').trim(); }
  function refreshSend() { root.classList.toggle('has-content', !!getText() || attachments.length > 0); }
  function clear() { input.innerHTML = ''; attachRow.innerHTML = ''; attachments.length = 0; refreshSend(); }

  function submit() {
    const text = getText();
    if (!text && !attachments.length) return;
    onSubmit(text, attachments.slice());
    clear();
  }
  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !mentionEl) { e.preventDefault(); submit(); }
  });
  input.addEventListener('input', () => { refreshSend(); handleMentionTyping(); });

  /* ── emoji picker ── */
  let pickerEl = null;
  function closePicker() { if (pickerEl) { pickerEl.remove(); pickerEl = null; } }
  function openPicker() {
    if (pickerEl) { closePicker(); return; }
    pickerEl = buildEmojiPicker((char) => { pushRecent(char); insertNodeAtCaret(input, document.createTextNode(char)); refreshSend(); });
    root.appendChild(pickerEl);
  }

  /* ── mention autocomplete ── */
  let mentionEl = null;
  let mentionAnchor = null; // { node, atOffset }
  function closeMention() { if (mentionEl) { mentionEl.remove(); mentionEl = null; mentionAnchor = null; } }

  function currentMentionQuery() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const node = sel.anchorNode;
    if (node.nodeType !== Node.TEXT_NODE || !input.contains(node)) return null;
    const before = node.textContent.slice(0, sel.anchorOffset);
    const m = before.match(/@([\w.\-]*)$/);
    if (!m) return null;
    return { node, atOffset: sel.anchorOffset - m[1].length - 1, query: m[1] };
  }

  function insertMention(person) {
    if (!mentionAnchor) return;
    const { node, atOffset } = mentionAnchor;
    const sel = window.getSelection();
    const caret = sel.anchorOffset;
    // remove the "@query" from the text node
    node.textContent = node.textContent.slice(0, atOffset) + node.textContent.slice(caret);
    const range = document.createRange();
    range.setStart(node, atOffset);
    range.collapse(true);
    const chip = document.createElement('span');
    chip.className = 'composer__mention';
    chip.contentEditable = 'false';
    chip.dataset.email = person.email || '';
    chip.textContent = `@${person.name}`;
    range.insertNode(chip);
    const space = document.createTextNode(' ');
    chip.after(space);
    range.setStartAfter(space);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    closeMention();
    refreshSend();
  }

  function handleMentionTyping() {
    const ctx = currentMentionQuery();
    if (!ctx) { closeMention(); return; }
    mentionAnchor = { node: ctx.node, atOffset: ctx.atOffset };
    const q = ctx.query.toLowerCase();
    const matches = people.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)).slice(0, 6);
    if (!matches.length) { closeMention(); return; }
    if (!mentionEl) { mentionEl = document.createElement('div'); mentionEl.className = 'composer__mention-list'; root.appendChild(mentionEl); }
    mentionEl.innerHTML = matches.map((p, i) => `
      <button class="composer__mention-item${i === 0 ? ' is-active' : ''}" type="button" data-i="${people.indexOf(p)}">
        <span class="composer__mention-avatar">${p.avatar ? `<img src="${p.avatar}" alt="" />` : initialsOf(p.name)}</span>
        <span class="composer__mention-text"><strong>${p.name}</strong><span>${p.email || ''}</span></span>
      </button>`).join('');
    mentionEl.querySelectorAll('.composer__mention-item').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); insertMention(people[Number(btn.dataset.i)]); });
    });
  }

  /* ── image attach ── */
  function addAttachment(file) {
    const url = URL.createObjectURL(file);
    const chip = document.createElement('div');
    chip.className = 'composer__attach';
    chip.innerHTML = `<img src="${url}" alt="${file.name}" /><button type="button" aria-label="Remove">&times;</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      const idx = attachments.indexOf(file);
      if (idx >= 0) attachments.splice(idx, 1);
      chip.remove();
      URL.revokeObjectURL(url);
      refreshSend();
    });
    attachments.push(file);
    attachRow.appendChild(chip);
    refreshSend();
  }
  fileInput.addEventListener('change', () => { Array.from(fileInput.files).forEach(addAttachment); fileInput.value = ''; });

  /* ── toolbar ── */
  root.querySelector('[data-act="emoji"]').addEventListener('click', (e) => { e.stopPropagation(); closeMention(); openPicker(); });
  root.querySelector('[data-act="image"]').addEventListener('click', () => fileInput.click());
  root.querySelector('[data-act="mention"]').addEventListener('click', () => {
    closePicker();
    insertNodeAtCaret(input, document.createTextNode('@'));
    handleMentionTyping();
  });

  // Close popovers when clicking outside the composer.
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) { closePicker(); closeMention(); } });

  refreshSend();
  return { root, focus: () => input.focus(), clear };
}

/** Read image File attachments into self-contained data URLs (so they survive
    object-URL revocation and the in-memory comment store). */
export function filesToDataUrls(files) {
  return Promise.all((files || []).map((file) => new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  }))).then((urls) => urls.filter(Boolean));
}

/* ── emoji picker element ─────────────────────────────────────────────────── */
function buildEmojiPicker(onPick) {
  const el = document.createElement('div');
  el.className = 'emoji-picker';
  el.addEventListener('click', (e) => e.stopPropagation());

  const recent = loadRecent();
  const cats = [
    ...(recent.length ? [{ key: 'recent', label: 'Frequently used', icon: iconClock(), chars: recent }] : []),
    ...EMOJI.map((c) => ({ key: c.key, label: c.label, icon: c.icon, parsed: c.parsed })),
  ];

  el.innerHTML = `
    <div class="emoji-tabs">${cats.map((c, i) => `<button class="emoji-tab${i === 0 ? ' is-active' : ''}" type="button" data-key="${c.key}" title="${c.label}">${c.icon}</button>`).join('')}</div>
    <div class="emoji-search"><span>${searchIcon()}</span><input type="search" placeholder="Search" aria-label="Search emoji" /></div>
    <div class="emoji-scroll"></div>`;

  const scroll = el.querySelector('.emoji-scroll');
  const searchInput = el.querySelector('.emoji-search input');

  function cell(char) {
    return `<button class="emoji-cell" type="button" aria-label="${char}">${char}</button>`;
  }
  function section(label, chars) {
    return `<div class="emoji-section"><div class="emoji-heading">${label}</div><div class="emoji-grid">${chars.map(cell).join('')}</div></div>`;
  }

  function renderAll() {
    scroll.innerHTML = cats.map((c) => {
      const chars = c.chars || c.parsed.map((p) => p.char);
      return `<div data-cat="${c.key}">${section(c.label, chars)}</div>`;
    }).join('');
    bindCells();
  }
  function renderSearch(q) {
    const hits = [];
    EMOJI.forEach((c) => c.parsed.forEach((p) => { if (p.names.some((n) => n.includes(q))) hits.push(p.char); }));
    scroll.innerHTML = hits.length ? section('Results', [...new Set(hits)]) : `<p class="emoji-empty">No emoji found.</p>`;
    bindCells();
  }
  function bindCells() {
    scroll.querySelectorAll('.emoji-cell').forEach((b) => b.addEventListener('click', () => onPick(b.textContent)));
  }

  el.querySelectorAll('.emoji-tab').forEach((tab) => tab.addEventListener('click', () => {
    el.querySelectorAll('.emoji-tab').forEach((t) => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    searchInput.value = '';
    renderAll();
    const target = scroll.querySelector(`[data-cat="${tab.dataset.key}"]`);
    if (target) scroll.scrollTop = target.offsetTop - scroll.offsetTop;
  }));

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q) renderSearch(q); else renderAll();
  });

  renderAll();
  return el;
}

function searchIcon() { return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`; }
