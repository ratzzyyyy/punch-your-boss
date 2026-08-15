// Single source of truth for gameplay tuning. Change a number here and it
// takes effect everywhere it's used — no hunting through multiple files.
export const TIMER_DURATION_SECONDS = 15;

export const CONTROLS = {
  leftPunch: 'a',
  rightPunch: 'd',
} as const;

// Combo system: punches landed within this many milliseconds of each other
// count as the same streak. Wait longer than this, and it resets.
export const COMBO_WINDOW_MS = 600;

// Chance (0 to 1) that any given punch triggers a random taunt bubble,
// and how long that bubble stays visible before fading out.
export const TAUNT_CHANCE = 0.35;
export const TAUNT_DISPLAY_MS = 1500;

// How long a punch sequence stays "alive" for special-move detection —
// deliberately longer than COMBO_WINDOW_MS, since a sequence doesn't need
// to be lightning-fast, just thrown out in the right order.
export const SPECIAL_MOVE_WINDOW_MS = 1500;