// Namespacing our localStorage keys like this avoids ever colliding with
// some other key an unrelated part of the app (or even another website's
// leftover data, in some edge cases) might use.
const STORAGE_KEY_PREFIX = 'punchYourBoss:highscore:';

function keyFor(bossName: string): string {
  return `${STORAGE_KEY_PREFIX}${bossName}`;
}

export function getHighScore(bossName: string): number {
  // Everything in localStorage is stored as a string — getItem returns
  // either that string or null if the key has never been set.
  const raw = localStorage.getItem(keyFor(bossName));
  return raw ? parseInt(raw, 10) : 0;
}

// Saves the new score only if it beats the existing best, and returns
// whichever value IS now correct to display — the caller doesn't need to
// separately check "did it improve," this function already decided that.
export function saveHighScoreIfBetter(bossName: string, score: number): number {
  const currentBest = getHighScore(bossName);
  if (score > currentBest) {
    localStorage.setItem(keyFor(bossName), String(score));
    return score;
  }
  return currentBest;
}