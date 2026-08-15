import { useEffect, useRef, useState } from 'react';
import type { BossProfile } from '../types/boss';
import { BoxingCharacter, CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/BoxingCharacter';
import type { PunchSide } from '../game/BoxingCharacter';
import { ScreenShake } from '../game/ScreenShake';
import { SoundEngine } from '../game/SoundEngine';
import { drawRingBackground } from '../game/ringBackground';
import TouchControls from '../components/TouchControls';
import { getMutedSetting, setMutedSetting } from '../services/settingsService';
import { SPECIAL_MOVES, MAX_SPECIAL_MOVE_LENGTH } from '../data/specialMoves';
import {
  TIMER_DURATION_SECONDS,
  CONTROLS,
  COMBO_WINDOW_MS,
  TAUNT_CHANCE,
  TAUNT_DISPLAY_MS,
  SPECIAL_MOVE_WINDOW_MS,
} from '../config/gameConfig';
import './BossCharacterScreen.css';

type Phase = 'ready' | 'countdown' | 'fighting';

const SHAKE_BASE_MAGNITUDE = 4;
const SHAKE_PER_COMBO = 2;
const SHAKE_MAX_COMBO_FOR_SCALING = 5;
const SPECIAL_MOVE_SHAKE_BONUS = 14;
const SPECIAL_MOVE_DISPLAY_MS = 1400;

interface BossCharacterScreenProps {
  boss: BossProfile;
  onGameOver: (totalPunches: number) => void;
  onExit: () => void;
}

function BossCharacterScreen({ boss, onGameOver, onExit }: BossCharacterScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<BoxingCharacter | null>(null);
  const screenShakeRef = useRef<ScreenShake | null>(null);

  const soundEngineRef = useRef<SoundEngine | null>(null);
  if (soundEngineRef.current === null) {
    soundEngineRef.current = new SoundEngine();
  }

  const punchCountRef = useRef(0);
  const isGameOverRef = useRef(false);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const [phase, setPhase] = useState<Phase>('ready');
  const [countdownValue, setCountdownValue] = useState(3);
  const [punchCount, setPunchCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION_SECONDS);

  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const lastPunchTimeRef = useRef<number | null>(null);
  const comboCountRef = useRef(0);
  const comboResetTimeoutRef = useRef<number | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [comboPopupId, setComboPopupId] = useState(0);

  const tauntTimeoutRef = useRef<number | null>(null);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [tauntId, setTauntId] = useState(0);

  // --- Special move sequence detection ---
  // A rolling buffer of recent punches (side + timestamp), trimmed to only
  // what's still fresh and never longer than the longest known pattern.
  // Same rolling-window idea fighting games use to detect input sequences.
  const punchHistoryRef = useRef<{ side: PunchSide; time: number }[]>([]);
  const specialMoveTimeoutRef = useRef<number | null>(null);
  const [specialMoveName, setSpecialMoveName] = useState<string | null>(null);
  const [specialMoveId, setSpecialMoveId] = useState(0);

  const [isMuted, setIsMuted] = useState(() => getMutedSetting());

  useEffect(() => {
    soundEngineRef.current?.setMuted(isMuted);
    setMutedSetting(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx;

    const character = new BoxingCharacter(boss.avatar);
    characterRef.current = character;

    const shake = new ScreenShake();
    screenShakeRef.current = shake;

    let animationFrameId: number;
    const startTime = performance.now();

    function renderLoop(now: number) {
      const elapsedMs = now - startTime;
      const offset = shake.getOffset(now);

      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Drawn WITHOUT the shake offset — the ring stays fixed while the
      // character shakes on top of it. Translating the background too
      // would leave visible gaps at the canvas edges once it's nudged
      // away from its normal position.
      drawRingBackground(context, CANVAS_WIDTH, CANVAS_HEIGHT);

      context.save();
      context.translate(offset.x, offset.y);
      character.draw(context, elapsedMs);
      context.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      characterRef.current = null;
      screenShakeRef.current = null;
    };
  }, [boss]);

  useEffect(() => {
    return () => {
      soundEngineRef.current?.dispose();
    };
  }, []);

  function performPunch(side: PunchSide) {
    if (phaseRef.current !== 'fighting') return;
    if (isGameOverRef.current) return;

    const now = performance.now();
    const previousPunchTime = lastPunchTimeRef.current;
    lastPunchTimeRef.current = now;

    const withinComboWindow =
      previousPunchTime !== null && now - previousPunchTime <= COMBO_WINDOW_MS;
    const newCombo = withinComboWindow ? comboCountRef.current + 1 : 1;
    comboCountRef.current = newCombo;
    setComboCount(newCombo);
    setComboPopupId((id) => id + 1);

    if (comboResetTimeoutRef.current !== null) {
      window.clearTimeout(comboResetTimeoutRef.current);
    }
    comboResetTimeoutRef.current = window.setTimeout(() => {
      comboCountRef.current = 0;
      setComboCount(0);
    }, COMBO_WINDOW_MS);

    characterRef.current?.triggerPunchReaction(side, newCombo);
    soundEngineRef.current?.playPunch(newCombo);

    const shakeMagnitude =
      SHAKE_BASE_MAGNITUDE + Math.min(newCombo, SHAKE_MAX_COMBO_FOR_SCALING) * SHAKE_PER_COMBO;
    screenShakeRef.current?.trigger(shakeMagnitude);

if (taunt === null && Math.random() < TAUNT_CHANCE && boss.taunts.length > 0) {
      const randomTaunt = boss.taunts[Math.floor(Math.random() * boss.taunts.length)];
      setTaunt(randomTaunt);
      setTauntId((id) => id + 1);

      if (tauntTimeoutRef.current !== null) {
        window.clearTimeout(tauntTimeoutRef.current);
      }
      tauntTimeoutRef.current = window.setTimeout(() => setTaunt(null), TAUNT_DISPLAY_MS);
    }

    // --- Special move sequence check ---
    punchHistoryRef.current.push({ side, time: now });
    punchHistoryRef.current = punchHistoryRef.current.filter(
      (entry) => now - entry.time <= SPECIAL_MOVE_WINDOW_MS
    );
    if (punchHistoryRef.current.length > MAX_SPECIAL_MOVE_LENGTH) {
      punchHistoryRef.current = punchHistoryRef.current.slice(-MAX_SPECIAL_MOVE_LENGTH);
    }

    const recentSides = punchHistoryRef.current.map((entry) => entry.side);
    let bonusFromSpecialMove = 0;

    for (const move of SPECIAL_MOVES) {
      const tail = recentSides.slice(-move.sequence.length);
      const isMatch =
        tail.length === move.sequence.length && tail.every((s, i) => s === move.sequence[i]);

      if (isMatch) {
        // Clear history so this same run of punches can't immediately
        // re-trigger another move on the very next punch — the player has
        // to freshly build up a new sequence from here.
        punchHistoryRef.current = [];
        bonusFromSpecialMove = move.bonusPunches;

        characterRef.current?.triggerSpecialMoveBurst();
        soundEngineRef.current?.playSpecialMove();
        screenShakeRef.current?.trigger(SHAKE_BASE_MAGNITUDE + SPECIAL_MOVE_SHAKE_BONUS);

        setSpecialMoveName(move.name);
        setSpecialMoveId((id) => id + 1);

        if (specialMoveTimeoutRef.current !== null) {
          window.clearTimeout(specialMoveTimeoutRef.current);
        }
        specialMoveTimeoutRef.current = window.setTimeout(
          () => setSpecialMoveName(null),
          SPECIAL_MOVE_DISPLAY_MS
        );

        break; // only the first matching pattern counts per punch
      }
    }

    // One combined update for the base punch AND any special-move bonus —
    // simpler and cheaper than calling setPunchCount twice.
    setPunchCount((count) => {
      const newCount = count + 1 + bonusFromSpecialMove;
      punchCountRef.current = newCount;
      return newCount;
    });
  }

  const performPunchRef = useRef(performPunch);
  useEffect(() => {
    performPunchRef.current = performPunch;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      if (key !== CONTROLS.leftPunch && key !== CONTROLS.rightPunch) return;

      const side: PunchSide = key === CONTROLS.leftPunch ? 'left' : 'right';
      performPunchRef.current(side);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (comboResetTimeoutRef.current !== null) {
        window.clearTimeout(comboResetTimeoutRef.current);
      }
      if (tauntTimeoutRef.current !== null) {
        window.clearTimeout(tauntTimeoutRef.current);
      }
      if (specialMoveTimeoutRef.current !== null) {
        window.clearTimeout(specialMoveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;

    soundEngineRef.current?.playCountdownBeep();

    const timeoutIds = [
      window.setTimeout(() => {
        setCountdownValue(2);
        soundEngineRef.current?.playCountdownBeep();
      }, 1000),
      window.setTimeout(() => {
        setCountdownValue(1);
        soundEngineRef.current?.playCountdownBeep();
      }, 2000),
      window.setTimeout(() => {
        setPhase('fighting');
        soundEngineRef.current?.playFightStart();
      }, 3000),
    ];

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fighting') return undefined;

    const endTime = performance.now() + TIMER_DURATION_SECONDS * 1000;
    let lastDisplayedSeconds = TIMER_DURATION_SECONDS;

    const intervalId = setInterval(() => {
      const remainingMs = Math.max(0, endTime - performance.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      if (remainingSeconds !== lastDisplayedSeconds) {
        lastDisplayedSeconds = remainingSeconds;
        setTimeLeft(remainingSeconds);
      }

      if (remainingMs <= 0) {
        clearInterval(intervalId);
        isGameOverRef.current = true;
        soundEngineRef.current?.playGameOver();

        window.setTimeout(() => {
          onGameOverRef.current(punchCountRef.current);
        }, 450);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [phase]);

  return (
    <div className="boss-character-screen">
      <h2 className="boss-name">{boss.name}</h2>

      {phase === 'fighting' && (
        <div className="punch-hud">
          <span className="punch-count">Punches: {punchCount}</span>
          <span className={timeLeft <= 3 ? 'timer timer-warning' : 'timer'}>
            Time: {timeLeft}s
          </span>
        </div>
      )}

      <div className="canvas-wrapper">
        <button
          type="button"
          className="mute-button"
          onClick={() => setIsMuted((m) => !m)}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="boss-canvas"
        />

        {phase === 'fighting' && comboCount >= 2 && (
          <div
            key={comboPopupId}
            className="combo-popup"
            style={{ animationDuration: `${COMBO_WINDOW_MS}ms` }}
          >
            {comboCount}x COMBO!
          </div>
        )}

        {phase === 'fighting' && specialMoveName && (
          <div key={specialMoveId} className="special-move-popup">
            <span className="special-move-text">{specialMoveName}</span>
          </div>
        )}

        {phase === 'fighting' && taunt && (
          <div key={tauntId} className="speech-bubble">
            {taunt}
          </div>
        )}

        {phase === 'ready' && (
          <div className="canvas-overlay">
            <p className="overlay-title">Ready to fight?</p>
            <p className="overlay-hint">
              {CONTROLS.leftPunch.toUpperCase()} = Left Punch &nbsp;•&nbsp;{' '}
              {CONTROLS.rightPunch.toUpperCase()} = Right Punch
            </p>
            <div className="overlay-buttons">
              <button className="status-button" onClick={() => setPhase('countdown')}>
                Fight!
              </button>
              <button className="status-button secondary" onClick={onExit}>
                Exit
              </button>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="canvas-overlay">
            <span className="countdown-number">{countdownValue}</span>
          </div>
        )}
      </div>

      {phase === 'fighting' && (
        <>
          <p className="key-hint">
            {CONTROLS.leftPunch.toUpperCase()} = Left Punch &nbsp;•&nbsp;{' '}
            {CONTROLS.rightPunch.toUpperCase()} = Right Punch
            <br />
            Try: L-R-L, R-L-R, L-L-L, or R-R-R for a special move!
          </p>
          <TouchControls
            onLeftPunch={() => performPunch('left')}
            onRightPunch={() => performPunch('right')}
          />
        </>
      )}
    </div>
  );
}

export default BossCharacterScreen;