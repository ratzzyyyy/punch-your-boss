// All sounds here are SYNTHESIZED using the Web Audio API — generated from
// raw waveforms in the browser, rather than loaded from audio files. No
// external assets, no licensing concerns, works anywhere this project runs.
export class SoundEngine {
  private audioContext: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  // Browsers block audio from starting until the page has received a real
  // user gesture (click, keypress, tap) — meant to stop sites autoplaying
  // sound. We can't create the AudioContext until we're INSIDE a handler
  // triggered by one of those gestures, so we create it lazily, the first
  // time any sound is actually requested — never eagerly on mount.
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    // Some browsers still create it in a "suspended" state even after a
    // gesture — resume() is harmless to call even if already running.
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * A short percussive "thwack": an oscillator's pitch sweeps down very
   * quickly, shaped by a volume envelope that starts loud and decays to
   * near-silence — avoiding the click/pop of an abrupt start/stop.
   */
  playPunch(comboLevel: number = 1) {
    if (this.muted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // Slightly higher pitch on bigger combos — a rising, satisfying feel
    // as a streak builds, with no extra audio files needed.
    const basePitch = 220 + Math.min(comboLevel, 8) * 15;
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(basePitch, now);
    oscillator.frequency.exponentialRampToValueAtTime(basePitch * 0.4, now + 0.08);

    // exponentialRampToValueAtTime can never target exactly 0 (a quirk of
    // the API) — 0.001 is the conventional "close enough to silent" target.
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // oscillator -> gain -> speakers. Every sound is its own independent
    // chain — exactly why overlapping combo punches don't cut each other off.
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  /** A short beep for each countdown tick. */
  playCountdownBeep() {
    if (this.muted) return;
    this.playTone(440, 0.1, 'sine');
  }

  /** A brighter, higher tone for when the fight actually begins. */
  playFightStart() {
    if (this.muted) return;
    this.playTone(660, 0.15, 'square');
    setTimeout(() => this.playTone(880, 0.25, 'square'), 100);
  }

  /** A low buzzer for when time runs out. */
  playGameOver() {
    if (this.muted) return;
    this.playTone(140, 0.4, 'sawtooth');
  }

    /** A quick three-note ascending run — distinct from every other sound
   * in the game, so it reads unmistakably as "achievement," not just
   * another beep. */
  playNewBest() {
    if (this.muted) return;
    this.playTone(523, 0.12, 'square'); // C
    setTimeout(() => this.playTone(659, 0.12, 'square'), 120); // E
    setTimeout(() => this.playTone(784, 0.25, 'square'), 240); // G
  }

  /** A short, punchy two-tone stab for landing a special move sequence —
   * deliberately more aggressive-sounding than playNewBest's melodic run,
   * since this fires mid-fight rather than at a moment of celebration. */
  playSpecialMove() {
    if (this.muted) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Two oscillators firing together = a simple "chord," which reads as
    // punchier than any single tone, using nothing but two extra node chains.
    [220, 330].forEach((frequency) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    });
  }

  private playTone(frequency: number, duration: number, type: OscillatorType) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /** Releases the AudioContext entirely. Call this on unmount — browsers
   * cap how many un-closed AudioContexts can exist per tab, and since a
   * fresh SoundEngine is created every round (via our key={instanceId}
   * remount trick), skipping this would eventually hit that cap. */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}