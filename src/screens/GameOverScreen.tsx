import { useEffect, useRef } from 'react';
import { SoundEngine } from '../game/SoundEngine';
import { getMutedSetting } from '../services/settingsService';
import './GameOverScreen.css';

interface GameOverScreenProps {
  bossName: string;
  totalPunches: number;
  bestScore: number;
  onPlayAgain: () => void;
  onChangeBoss: () => void;
}

function GameOverScreen({
  bossName,
  totalPunches,
  bestScore,
  onPlayAgain,
  onChangeBoss,
}: GameOverScreenProps) {
  const isNewBest = totalPunches > 0 && totalPunches === bestScore;

  // This screen owns its own, independent SoundEngine — the one from
  // BossCharacterScreen was already disposed the instant that component
  // unmounted, which happens right as this screen appears.
  const soundEngineRef = useRef<SoundEngine | null>(null);
  if (soundEngineRef.current === null) {
    soundEngineRef.current = new SoundEngine();
  }

  // Runs once, right when this screen first appears. We read the mute
  // setting directly here since this screen has no ongoing isMuted state
  // of its own to sync from — just a one-time check at the moment we
  // might play a sound.
  useEffect(() => {
    soundEngineRef.current?.setMuted(getMutedSetting());
    if (isNewBest) {
      soundEngineRef.current?.playNewBest();
    }

    return () => {
      soundEngineRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-over-screen">
      <h1 className="game-over-title">TIME'S UP!</h1>

      <div className="results-card">
        <p className="result-line">
          <span className="result-label">TARGET</span>
          <span>{bossName}</span>
        </p>
        <p className="result-line">
          <span className="result-label">TOTAL PUNCHES</span>
          <span>{totalPunches}</span>
        </p>
        <p className="result-line">
          <span className="result-label">BEST SCORE</span>
          <span>
            {bestScore}
            {isNewBest && <span className="new-best-badge">NEW BEST!</span>}
          </span>
        </p>
      </div>

      <div className="game-over-buttons">
        <button className="status-button" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="status-button secondary" onClick={onChangeBoss}>
          Change Boss
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;