import React from 'react';
import styles from './DailySummary.module.css';

interface DailySummaryProps {
  focusTimeFormatted: string; // e.g. "0h 00m" or "00:00"
  completedPomodoros: number;
  dailyGoalCycles?: number;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  focusTimeFormatted,
  completedPomodoros,
  dailyGoalCycles = 4,
}) => {
  return (
    <section className={styles.summaryContainer} aria-label="Resumo do dia">
      <div className={styles.column}>
        <span className={styles.label}>Foco hoje</span>
        <span className={styles.value}>{focusTimeFormatted}</span>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.column}>
        <span className={styles.label}>Concluídos</span>
        <span className={styles.value}>{completedPomodoros}</span>
        <span className={styles.goalText}>Meta: {dailyGoalCycles} ciclos</span>
      </div>
    </section>
  );
};
