import { useEffect } from 'react';
import type { SessionMode, TimerState } from '../domain/types';

interface KeyboardShortcutsOptions {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSetMode: (mode: SessionMode) => void;
  onToggleZenMode?: () => void;
  onExitZenMode?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  timerState,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  onSetMode,
  onToggleZenMode,
  onExitZenMode,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape funciona mesmo se estiver em tela cheia/Zen Mode
      if (e.key === 'Escape') {
        onExitZenMode?.();
      }

      // Ignora demais atalhos se estiver digitando em campo de texto
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Espaço: inicia / pausa / continua
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerState === 'idle' || timerState === 'finished') {
          onStart();
        } else if (timerState === 'running') {
          onPause();
        } else if (timerState === 'paused') {
          onResume();
        }
        return;
      }

      // R ou r: reinicia
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (timerState === 'running' || timerState === 'paused' || timerState === 'finished') {
          onReset();
        }
        return;
      }

      // S ou s: pula
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (timerState === 'running' || timerState === 'paused') {
          onSkip();
        }
        return;
      }

      // F ou f: alterna Modo Zen (tela cheia)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onToggleZenMode?.();
        return;
      }

      // 1, 2, 3: troca de modo (apenas se não estiver rodando)
      if (timerState !== 'running') {
        if (e.key === '1') {
          e.preventDefault();
          onSetMode('focus');
        } else if (e.key === '2') {
          e.preventDefault();
          onSetMode('shortBreak');
        } else if (e.key === '3') {
          e.preventDefault();
          onSetMode('longBreak');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    timerState,
    onStart,
    onPause,
    onResume,
    onReset,
    onSkip,
    onSetMode,
    onToggleZenMode,
    onExitZenMode,
    enabled,
  ]);
}
