/* ------------------------------------------------------------------
   TIMELINE — a tiny wrapper around a GSAP master timeline that
   gives us named cues, easy retiming, and a clean loop seam.

   Vignettes register themselves as cue blocks. The master timeline
   is built once, then looped or scrubbed.
------------------------------------------------------------------ */

import { gsap } from 'gsap';

export class Timeline {
  constructor({ onTick } = {}) {
    this.master = gsap.timeline({
      paused: true,
      repeat: -1,
      onUpdate: () => onTick && onTick(this.master.time(), this._currentCue()),
    });
    this.cues = []; // [{name, start, end}]
  }

  /** Register a cue block. `builder` receives a child timeline and
   *  the start time, and should populate it with GSAP tweens. */
  cue(name, builder) {
    const start = this.master.duration();
    const tl = gsap.timeline();
    builder(tl, start);
    this.master.add(tl, start);
    const end = this.master.duration();
    this.cues.push({ name, start, end });
    return this;
  }

  /** Insert an explicit gap (held frame) between cues. */
  hold(seconds) {
    this.master.to({}, { duration: seconds });
    return this;
  }

  _currentCue() {
    const t = this.master.time();
    for (const c of this.cues) {
      if (t >= c.start && t < c.end) return c.name;
    }
    return '—';
  }

  play()    { this.master.play();  }
  pause()   { this.master.pause(); }
  restart() { this.master.restart(); }
  timeScale(s) { this.master.timeScale(s); }
  duration() { return this.master.duration(); }
}
