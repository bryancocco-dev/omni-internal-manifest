/* ------------------------------------------------------------------
   VIGNETTE — announce-stub (scaffold for new announcement cuts).
   A working, capture-safe hold on the freshly-revealed app shell so a
   new cut (?cut=storyboard, ?cut=workflows, …) plays end-to-end from
   day one: logo → launch → this hold → reset. Replace this cue with
   the cut's real beats; STYLE-announcement-formula.md carries the
   house recipe (camera vocabulary, blur-in, butter curves, ending).
------------------------------------------------------------------ */

export function announceStubVignette(tl, ctx) {
  // Nothing moves yet — the establishing shot simply holds so the
  // loop has a stable body while the cut's story is being built.
  tl.to({}, { duration: 2.4 }, 0);
}
