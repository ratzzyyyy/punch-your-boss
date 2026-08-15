// Same simple localStorage pattern as highScoreService — everything
// stored as a string, so we convert going in and out.
const MUTED_KEY = 'punchYourBoss:settings:muted';

export function getMutedSetting(): boolean {
  return localStorage.getItem(MUTED_KEY) === 'true';
}

export function setMutedSetting(muted: boolean): void {
  localStorage.setItem(MUTED_KEY, String(muted));
}