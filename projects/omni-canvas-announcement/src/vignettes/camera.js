/* ------------------------------------------------------------------
   CAMERA EASING — bespoke GSAP CustomEase curves shared by every
   camera move so the whole piece flies with one consistent, high-end
   motion signature.

   • CAMERA_GLIDE  — fly-between two sections. A soft, weighted
     ease-in-out: gentle pickup, smooth mid, then a long luxurious
     deceleration that floats onto its mark (no abrupt stop).
   • CAMERA_SETTLE — entrance/landing. Decelerates onto its mark from
     the first frame, so the app eases in rather than snapping.

   Both are deterministic under timeline scrub (safe for MP4 capture).
------------------------------------------------------------------ */

import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

export const CAMERA_GLIDE  = CustomEase.create('cameraGlide',  'M0,0 C0.66,0 0.16,1 1,1');
export const CAMERA_SETTLE = CustomEase.create('cameraSettle', 'M0,0 C0.16,1 0.3,1 1,1');
