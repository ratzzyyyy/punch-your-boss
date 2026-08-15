import type { PunchSide } from '../game/BoxingCharacter';

export interface SpecialMove {
  id: string;
  name: string;
  sequence: PunchSide[];
  bonusPunches: number;
}

// Each pattern is a specific ORDER of punches, not just a count. Feel free
// to add your own here later — id just needs to be unique.
export const SPECIAL_MOVES: SpecialMove[] = [
  { id: 'hook-combo', name: 'HOOK COMBO!', sequence: ['left', 'right', 'left'], bonusPunches: 3 },
  { id: 'cross-combo', name: 'CROSS COMBO!', sequence: ['right', 'left', 'right'], bonusPunches: 3 },
  { id: 'left-flurry', name: 'LEFT FLURRY!', sequence: ['left', 'left', 'left'], bonusPunches: 4 },
  { id: 'right-flurry', name: 'RIGHT FLURRY!', sequence: ['right', 'right', 'right'], bonusPunches: 4 },
];

// The longest sequence across all patterns — tells us the maximum amount
// of punch history we ever need to keep around, so we can safely discard
// anything older than that.
export const MAX_SPECIAL_MOVE_LENGTH = Math.max(...SPECIAL_MOVES.map((m) => m.sequence.length));