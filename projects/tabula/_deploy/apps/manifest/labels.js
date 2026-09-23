/* labels.js — the language seam for the OMNI Manifest prototype.
   Owned by the orchestrator. Surfaces CONSUME this file; they never edit it.
   Extra per-surface keys go through extendLabels() in the surface's own script.

   Contract (see PLAN.md):
   - Every user-facing string that differs between the team metaphor and neutral
     product language renders through L(key) or data-l attributes.
   - Toggle: omniLang.set('team'|'neutral') / omniLang.toggle(). Persists to
     localStorage ('omniManifestLang'), stamps <html data-lang="...">, re-applies
     all data-l bindings, and dispatches 'omni:lang' on window for JS-built strings. */
(function () {
  var DICT = {
    team: {
      mode_full: "Team",
      mode_basic: "Quick chat",
      mode_full_long: "Full team session",
      mode_basic_long: "Quick chat — one teammate, fast",
      orchestrator: "Coach",
      orchestrator_lc: "coach",
      subagent: "Teammate",
      subagent_lc: "teammate",
      subagents: "Teammates",
      subagents_lc: "teammates",
      canvas_noun: "Team space",
      add_subagent: "Add a teammate",
      switch_orchestrator: "Change coach",
      switch_agent: "Switch teammate",
      upgrade_cta: "Bring in the team",
      downgrade_cta: "Switch to quick chat",
      builder_basic: "A teammate",
      builder_basic_sub: "One worker. A single system prompt that can also work alone.",
      builder_canvas: "A coach",
      builder_canvas_sub: "Runs a team: picks teammates, uses skills, works the team space.",
      only_in_full: "Only available with the full team",
      solo_agent: "Working solo"
    },
    neutral: {
      mode_full: "Canvas",
      mode_basic: "Quick chat",
      mode_full_long: "Canvas session",
      mode_basic_long: "Quick chat — basic agent, fast",
      orchestrator: "Orchestrator",
      orchestrator_lc: "orchestrator",
      subagent: "Sub-agent",
      subagent_lc: "sub-agent",
      subagents: "Sub-agents",
      subagents_lc: "sub-agents",
      canvas_noun: "Canvas",
      add_subagent: "Add a sub-agent",
      switch_orchestrator: "Switch orchestrator",
      switch_agent: "Switch agent",
      upgrade_cta: "Upgrade to Canvas",
      downgrade_cta: "Switch to quick chat",
      builder_basic: "A basic agent",
      builder_basic_sub: "A single agent. One system prompt; runs on its own.",
      builder_canvas: "A Canvas agent",
      builder_canvas_sub: "An orchestrator with sub-agents, skills, and the Canvas surface.",
      only_in_full: "Only available in Canvas",
      solo_agent: "Basic session"
    }
  };

  var KEY = "omniManifestLang";

  function current() {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    return v === "neutral" ? "neutral" : "team";
  }

  function L(key) {
    var lang = current();
    if (DICT[lang] && key in DICT[lang]) return DICT[lang][key];
    if (key in DICT.team) return DICT.team[key];
    return key;
  }

  function applyLabels(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-l]").forEach(function (el) {
      el.textContent = L(el.getAttribute("data-l"));
    });
    scope.querySelectorAll("[data-l-title]").forEach(function (el) {
      el.setAttribute("title", L(el.getAttribute("data-l-title")));
    });
    scope.querySelectorAll("[data-l-aria]").forEach(function (el) {
      el.setAttribute("aria-label", L(el.getAttribute("data-l-aria")));
    });
  }

  function set(lang) {
    if (lang !== "team" && lang !== "neutral") return;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.documentElement.setAttribute("data-lang", lang);
    applyLabels();
    window.dispatchEvent(new CustomEvent("omni:lang", { detail: { lang: lang } }));
  }

  function extendLabels(extra) {
    if (!extra) return;
    ["team", "neutral"].forEach(function (lang) {
      if (extra[lang]) {
        Object.keys(extra[lang]).forEach(function (k) { DICT[lang][k] = extra[lang][k]; });
      }
    });
    applyLabels();
  }

  window.L = L;
  window.applyLabels = applyLabels;
  window.extendLabels = extendLabels;
  window.omniLang = {
    get: current,
    set: set,
    toggle: function () { set(current() === "team" ? "neutral" : "team"); }
  };

  document.documentElement.setAttribute("data-lang", current());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { applyLabels(); });
  } else {
    applyLabels();
  }
})();
