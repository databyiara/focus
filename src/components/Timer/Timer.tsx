import React from 'react';
import type { SessionMode } from '../../domain/types';
import styles from './Timer.module.css';

interface TimerProps {
  mode: SessionMode;
  formattedTime: string; // e.g. "25:00"
  progressPercent: number; // 0 to 100
  cycleCurrent: number;
  cycleTotal: number;
  taskName?: string | null;
}

const MODE_LABELS: Record<SessionMode, string> = {
  focus: 'FOCO',
  shortBreak: 'PAUSA CURTA',
  longBreak: 'PAUSA LONGA',
};

// Geometria do anel SVG
const RING_RADIUS = 134;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const Timer: React.FC<TimerProps> = ({
  mode,
  formattedTime,
  progressPercent,
  cycleCurrent,
  cycleTotal,
  taskName,
}) => {
  const [minutes, seconds] = formattedTime.split(':');
  const accessibleTime = `${minutes} minutos e ${seconds} segundos`;

  // O anel esvazia conforme o tempo passa (progressPercent vai de 0% a 100%)
  const remainingFraction = Math.max(0, Math.min(1, (100 - progressPercent) / 100));
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - remainingFraction);

  // Array de ciclos (preenchido = concluído, anel = atual, vazio = pendente)
  const dotsCount = Math.max(cycleTotal, 4);
  const cycleDots = Array.from({ length: dotsCount }, (_, index) => {
    const cycleIndex = index + 1;
    if (cycleIndex < cycleCurrent) {
      return 'completed'; // preenchido
    }
    if (cycleIndex === cycleCurrent) {
      return 'current'; // anel
    }
    return 'pending'; // vazio
  });

  return (
    <div className={styles.timerContainer} id="timer-display">
      <div className={styles.ringWrapper}>
        <svg
          className={styles.progressRing}
          viewBox="0 0 280 280"
          aria-hidden="true"
        >
          {/* Anel de fundo cinza escuro */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            className={styles.ringTrack}
          />
          {/* Anel de progresso fino em branco que esvazia */}
          <circle
            cx="140"
            cy="140"
            r={RING_RADIUS}
            className={styles.ringProgress}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 140 140)"
          />
        </svg>

        <div className={styles.innerContent}>
          <div className={styles.modeBadge}>{MODE_LABELS[mode]}</div>

          <div
            className={styles.timeDisplay}
            aria-label={accessibleTime}
            role="timer"
          >
            {formattedTime}
          </div>

          {/* Ciclos representados por 4 pontinhos */}
          <div
            className={styles.cycleDots}
            role="group"
            aria-label={`Ciclo ${cycleCurrent} de ${cycleTotal}`}
          >
            {cycleDots.map((status, idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${
                  status === 'completed'
                    ? styles.dotCompleted
                    : status === 'current'
                    ? styles.dotCurrent
                    : styles.dotPending
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div
            className={`${styles.taskInfo} ${taskName ? styles.taskInfoSelected : ''}`}
            title={taskName || 'Foco livre'}
          >
            {taskName ? taskName : 'Foco livre'}
          </div>
        </div>
      </div>
    </div>
  );
};
