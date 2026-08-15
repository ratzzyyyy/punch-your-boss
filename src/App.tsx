import { useState } from 'react';
import ProfileInputScreen from './screens/ProfileInputScreen';
import BossCharacterScreen from './screens/BossCharacterScreen';
import GameOverScreen from './screens/GameOverScreen';
import type { ProfileFormState } from './types/profile';
import type { BossProfile } from './types/boss';
import { createBossProfile } from './services/profileService';
import { saveHighScoreIfBetter } from './services/highScoreService';
import './App.css';

type AppScreen =
  | { name: 'input' }
  | { name: 'loading' }
  | { name: 'playing'; boss: BossProfile; instanceId: string }
  | { name: 'gameover'; boss: BossProfile; totalPunches: number; bestScore: number }
  | { name: 'error'; message: string };

function App() {
  const [screen, setScreen] = useState<AppScreen>({ name: 'input' });

  const handleProfileSubmit = async (formData: ProfileFormState) => {
    setScreen({ name: 'loading' });

    try {
      const boss = await createBossProfile(formData);
      setScreen({ name: 'playing', boss, instanceId: crypto.randomUUID() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setScreen({ name: 'error', message });
    }
  };

  const handleGameOver = (boss: BossProfile, totalPunches: number) => {
    const bestScore = saveHighScoreIfBetter(boss.name, totalPunches);
    setScreen({ name: 'gameover', boss, totalPunches, bestScore });
  };

  const handlePlayAgain = (boss: BossProfile) => {
    setScreen({ name: 'playing', boss, instanceId: crypto.randomUUID() });
  };

  if (screen.name === 'input') {
    return <ProfileInputScreen onSubmit={handleProfileSubmit} />;
  }

  if (screen.name === 'loading') {
    return (
      <div className="status-screen">
        <p className="status-message">Loading your boss...</p>
      </div>
    );
  }

  if (screen.name === 'error') {
    return (
      <div className="status-screen">
        <p className="status-message">⚠️ {screen.message}</p>
        <button className="status-button" onClick={() => setScreen({ name: 'input' })}>
          Try Again
        </button>
      </div>
    );
  }

if (screen.name === 'playing') {
    return (
      <BossCharacterScreen
        key={screen.instanceId}
        boss={screen.boss}
        onGameOver={(totalPunches) => handleGameOver(screen.boss, totalPunches)}
        onExit={() => setScreen({ name: 'input' })}
      />
    );
  }

  // Only 'gameover' remains here.
  return (
    <GameOverScreen
      bossName={screen.boss.name}
      totalPunches={screen.totalPunches}
      bestScore={screen.bestScore}
      onPlayAgain={() => handlePlayAgain(screen.boss)}
      onChangeBoss={() => setScreen({ name: 'input' })}
    />
  );
}

export default App;