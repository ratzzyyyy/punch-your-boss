import type { BossAvatar } from '../types/boss';

// Each archetype is a pre-made comedy character. `keywords` are phrases we
// search for in the player's description to judge if this archetype fits —
// a simple, transparent technique (NOT real AI), just counting how many
// keyword phrases show up in what the player typed.
interface BossArchetype {
  id: string;
  name: string;
  keywords: string[];
  avatar: BossAvatar;
  taunts: string[];
}

const ARCHETYPES: BossArchetype[] = [
  {
    id: 'micromanager',
    name: 'Micromanager Mike',
    keywords: ['micromanage', 'checks in', 'checking in', 'hover', 'watch', 'control'],
    avatar: { type: 'emoji', symbol: '🧐' },
    taunts: ['Did you CC me on that punch?', "I'd like a status update on this fight."],
  },
  {
    id: 'meeting-maximizer',
    name: 'Meeting Maximizer Monica',
    keywords: ['meeting', "could've been an email", 'could have been an email', 'calendar', 'schedule', 'zoom'],
    avatar: { type: 'emoji', symbol: '📅' },
    taunts: ["Let's take this fight offline.", "I'll send a follow-up invite for round two."],
  },
  {
    id: 'credit-stealer',
    name: 'Credit-Stealing Carl',
    keywords: ['credit', 'my idea', 'took credit', 'stole', 'presented my'],
    avatar: { type: 'emoji', symbol: '🏆' },
    taunts: ['Actually, this punch was MY idea.', "I'll be presenting your black eye to the board."],
  },
  {
    id: 'reply-all',
    name: 'Reply-All Randy',
    keywords: ['reply all', 'reply-all', 'cc', 'inbox', 'spam'],
    avatar: { type: 'emoji', symbol: '📧' },
    taunts: ['Replying all to this punch.', "CC'ing HR on that hit."],
  },
  {
    id: 'know-it-all',
    name: 'Know-It-All Keith',
    keywords: ['best', 'always right', 'know it all', 'my way', 'approach', 'methodology'],
    avatar: { type: 'emoji', symbol: '🙄' },
    taunts: ['My methodology is flawless.', 'Have you considered doing it MY way?'],
  },
];

// Used when nothing matches even a single keyword — every boss deserves a
// fallback, so the game never ends up with "no result."
const FALLBACK_ARCHETYPE: BossArchetype = {
  id: 'generic',
  name: 'The Nightmare Boss',
  keywords: [],
  avatar: { type: 'emoji', symbol: '😤' },
  taunts: ["I'm not mad, I'm just disappointed.", 'This is going in your performance review.'],
};

// Scores every archetype by counting keyword matches, returns whichever
// scores highest. Zero matches across the board falls back to the generic.
export function matchArchetype(description: string): BossArchetype {
  const text = description.toLowerCase();

  let bestMatch = FALLBACK_ARCHETYPE;
  let bestScore = 0;

  for (const archetype of ARCHETYPES) {
    const score = archetype.keywords.filter((keyword) => text.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = archetype;
    }
  }

  return bestMatch;
}