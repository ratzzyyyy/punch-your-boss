// Same decay technique as the hit-reaction fade: strength starts at 1 and
// falls to 0 over a fixed duration, purely as a function of elapsed time.
const SHAKE_DURATION_MS = 220;

export class ScreenShake {
  private startTime: number | null = null;
  private magnitude = 0;

  /** Call whenever something should shake the screen — bigger `magnitude`
   * shakes harder. Calling again mid-shake simply restarts it. */
  trigger(magnitude: number) {
    this.startTime = performance.now();
    this.magnitude = magnitude;
  }

  /** Returns how far to offset drawing this frame. Call once per frame,
   * before drawing anything else. */
  getOffset(now: number): { x: number; y: number } {
    if (this.startTime === null) return { x: 0, y: 0 };

    const elapsed = now - this.startTime;
    if (elapsed > SHAKE_DURATION_MS) return { x: 0, y: 0 };

    const progress = elapsed / SHAKE_DURATION_MS;
    const strength = (1 - progress) * this.magnitude;

    // A random direction each frame is what reads as a "shake" rather
    // than a smooth slide in one direction.
    return {
      x: (Math.random() - 0.5) * strength,
      y: (Math.random() - 0.5) * strength,
    };
  }
}