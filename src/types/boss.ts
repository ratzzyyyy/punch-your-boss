// A boss's avatar can come from two different sources depending on how the
// player created it: an uploaded image file, or a stock emoji from an
// archetype. This is a "discriminated union" — each variant has a different
// shape, but they share a `type` field we can check to know which one we
// have. TypeScript uses that field to "narrow" what's safe to access —
// inside an `if (avatar.type === 'image')` check, TypeScript knows `.url`
// exists; it won't let you reach for `.symbol` in that branch.
export type BossAvatar =
  | { type: 'image'; url: string }
  | { type: 'emoji'; symbol: string };

// The finished, ready-to-play boss data, regardless of how it was created.
// This is the shape our profile service always produces — everything
// downstream (character rendering, the game engine) only ever needs to
// know about THIS shape, never about raw forms or archetype-matching.
export interface BossProfile {
  name: string;
  avatar: BossAvatar;
  taunts: string[];
}