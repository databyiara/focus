import { useEffect, useRef, useState, useCallback } from 'react';
import {
  TimerEngine,
  type TimerEngineConfig,
  type TimerSnapshot,
} from '../domain/timerEngine';
import type { SessionMode, SessionRecord, SessionStatus, TimerState } from '../domain/types';
import { SETTINGS_DEFAULTS } from '../config/defaults';
import { getStorage } from '../services/storage';

const TIMER_SNAPSHOT_KEY = 'focus_timer_snapshot_v1';

interface UseTimerOptions {
  config?: TimerEngineConfig;
  taskId?: string;
  taskName?: string;
  onSessionFinished?: (session: SessionRecord) => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const {
    config = {
      focusDurationMin: SETTINGS_DEFAULTS.focusDurationMin,
      shortBreakDurationMin: SETTINGS_DEFAULTS.shortBreakDurationMin,
      longBreakDurationMin: SETTINGS_DEFAULTS.longBreakDurationMin,
      longBreakInterval: SETTINGS_DEFAULTS.longBreakInterval,
    },
    taskId,
    taskName,
    onSessionFinished,
  } = options;

  const [state, setState] = useState<TimerState>('idle');
  const [mode, setModeState] = useState<SessionMode>('focus');
  const [formattedTime, setFormattedTime] = useState<string>('25:00');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [cycleCurrent, setCycleCurrent] = useState<number>(1);
  const [recoveryAlert, setRecoveryAlert] = useState<string | null>(null);

  const engineRef = useRef<TimerEngine | null>(null);
  const onSessionFinishedRef = useRef(onSessionFinished);
  onSessionFinishedRef.current = onSessionFinished;

  // Inicializa o TimerEngine uma única vez
  if (!engineRef.current) {
    engineRef.current = new TimerEngine(config, {
      onTick: (_remainingMs, progress) => {
        if (engineRef.current) {
          setFormattedTime(engineRef.current.getFormattedTime());
          setProgressPercent(progress);
        }
      },
      onStateChange: (newState, snapshot) => {
        setState(newState);
        setModeState(snapshot.mode);
        setCycleCurrent(snapshot.cycleCount);

        // Persiste snapshot no IndexedDB e localStorage para resistir a recarga
        if (newState === 'running' || newState === 'paused') {
          try {
            localStorage.setItem(TIMER_SNAPSHOT_KEY, JSON.stringify(snapshot));
          } catch {
            // noop
          }
          getStorage()
            .then((s) => s.saveTimerSnapshot(snapshot))
            .catch(() => {});
        } else if (newState === 'idle') {
          try {
            localStorage.removeItem(TIMER_SNAPSHOT_KEY);
          } catch {
            // noop
          }
          getStorage()
            .then((s) => s.saveTimerSnapshot(null))
            .catch(() => {});
        }
      },
      onSessionFinished: (session) => {
        onSessionFinishedRef.current?.(session);
      },
      onRecoveryAlert: (message) => {
        setRecoveryAlert(message);
      },
    });
  }

  const engine = engineRef.current;

  // Atualiza tarefas no motor
  useEffect(() => {
    engine.setTask(taskId, taskName);
  }, [engine, taskId, taskName]);

  // Atualiza configurações no motor
  useEffect(() => {
    engine.updateConfig(config);
    if (engine.getState() === 'idle') {
      setFormattedTime(engine.getFormattedTime());
    }
  }, [engine, config.focusDurationMin, config.shortBreakDurationMin, config.longBreakDurationMin, config.longBreakInterval]);

  // Recuperação inicial de snapshot persistido (localStorage imediato + IndexedDB persistente)
  useEffect(() => {
    let isCancelled = false;

    const recover = async () => {
      // 1. Tenta localStorage síncrono para hidratação imediata sem salto visual
      try {
        const saved = localStorage.getItem(TIMER_SNAPSHOT_KEY);
        if (saved) {
          const snapshot: TimerSnapshot = JSON.parse(saved);
          if (snapshot?.id && (snapshot.state === 'running' || snapshot.state === 'paused')) {
            engine.recover(snapshot, Date.now());
            setState(engine.getState());
            setModeState(engine.getMode());
            setCycleCurrent(engine.getCycleCount());
            setFormattedTime(engine.getFormattedTime());
            setProgressPercent(engine.getProgressPercent());
          }
        }
      } catch {
        // Fallback para IndexedDB
      }

      // 2. Confirma ou recupera do IndexedDB
      try {
        const storage = await getStorage();
        const idbSnapshot = await storage.getTimerSnapshot();
        if (
          !isCancelled &&
          idbSnapshot?.id &&
          (idbSnapshot.state === 'running' || idbSnapshot.state === 'paused')
        ) {
          engine.recover(idbSnapshot, Date.now());
          setState(engine.getState());
          setModeState(engine.getMode());
          setCycleCurrent(engine.getCycleCount());
          setFormattedTime(engine.getFormattedTime());
          setProgressPercent(engine.getProgressPercent());
        }
      } catch (err) {
        console.warn('Erro ao carregar timer do IndexedDB:', err);
      }
    };

    recover();
    return () => {
      isCancelled = true;
    };
  }, [engine]);

  // Ouvinte de visibilidade de aba (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        engine.handleVisibilityChange(Date.now());
        setFormattedTime(engine.getFormattedTime());
        setProgressPercent(engine.getProgressPercent());
        setState(engine.getState());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [engine]);

  // Métodos de controle
  const start = useCallback(() => {
    engine.start();
    setState(engine.getState());
    setFormattedTime(engine.getFormattedTime());
  }, [engine]);

  const pause = useCallback(() => {
    engine.pause();
    setState(engine.getState());
    setFormattedTime(engine.getFormattedTime());
  }, [engine]);

  const resume = useCallback(() => {
    engine.resume();
    setState(engine.getState());
    setFormattedTime(engine.getFormattedTime());
  }, [engine]);

  const reset = useCallback(
    (overrideStatus?: SessionStatus) => {
      engine.reset(Date.now(), overrideStatus);
      setState(engine.getState());
      setFormattedTime(engine.getFormattedTime());
      setProgressPercent(0);
    },
    [engine]
  );

  const skip = useCallback(
    (overrideStatus?: SessionStatus) => {
      engine.skip(Date.now(), overrideStatus);
      setState(engine.getState());
      setModeState(engine.getMode());
      setCycleCurrent(engine.getCycleCount());
      setFormattedTime(engine.getFormattedTime());
      setProgressPercent(0);
    },
    [engine]
  );

  const startNext = useCallback(() => {
    engine.startNext(false);
    setState(engine.getState());
    setModeState(engine.getMode());
    setCycleCurrent(engine.getCycleCount());
    setFormattedTime(engine.getFormattedTime());
    setProgressPercent(0);
  }, [engine]);

  const setMode = useCallback(
    (newMode: SessionMode) => {
      engine.setMode(newMode);
      setModeState(newMode);
      setState(engine.getState());
      setFormattedTime(engine.getFormattedTime());
      setProgressPercent(0);
    },
    [engine]
  );

  const clearRecoveryAlert = useCallback(() => {
    setRecoveryAlert(null);
  }, []);

  return {
    state,
    mode,
    formattedTime,
    progressPercent,
    cycleCurrent,
    cycleTotal: config.longBreakInterval,
    recoveryAlert,
    start,
    pause,
    resume,
    reset,
    skip,
    startNext,
    setMode,
    clearRecoveryAlert,
  };
}
