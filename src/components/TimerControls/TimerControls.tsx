import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import type { TimerState } from '../../domain/types';
import styles from './TimerControls.module.css';

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  state,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}) => {
  return (
    <div className={styles.controlsContainer} role="group" aria-label="Controles do temporizador">
      {state === 'idle' && (
        <button
          type="button"
          className={`${styles.buttonBase} ${styles.primaryButton}`}
          onClick={onStart}
          aria-label="Iniciar temporizador"
        >
          <span className={styles.iconSlot} key="idle-play">
            <Play size={15} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span>Iniciar</span>
        </button>
      )}

      {state === 'running' && (
        <>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.primaryButton}`}
            onClick={onPause}
            aria-label="Pausar temporizador"
          >
            <span className={styles.iconSlot} key="running-pause">
              <Pause size={15} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span>Pausar</span>
          </button>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            onClick={onReset}
            aria-label="Reiniciar temporizador"
          >
            <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            onClick={onSkip}
            aria-label="Pular sessão atual"
          >
            <SkipForward size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Pular</span>
          </button>
        </>
      )}

      {state === 'paused' && (
        <>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.primaryButton}`}
            onClick={onResume}
            aria-label="Continuar temporizador"
          >
            <span className={styles.iconSlot} key="paused-resume">
              <Play size={15} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span>Continuar</span>
          </button>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            onClick={onReset}
            aria-label="Reiniciar temporizador"
          >
            <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            onClick={onSkip}
            aria-label="Pular sessão atual"
          >
            <SkipForward size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Pular</span>
          </button>
        </>
      )}

      {state === 'finished' && (
        <>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.primaryButton}`}
            onClick={onStart}
            aria-label="Iniciar próxima sessão"
          >
            <span className={styles.iconSlot} key="finished-start">
              <Play size={15} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span>Iniciar Próximo</span>
          </button>
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            onClick={onReset}
            aria-label="Reiniciar ciclo"
          >
            <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </>
      )}
    </div>
  );
};
