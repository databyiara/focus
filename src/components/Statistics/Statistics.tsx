import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { SessionRecord } from '../../domain/types';
import {
  calculateDailyStats,
  calculateGoalProgress,
  calculateLast7DaysStats,
  calculateTaskDistribution,
} from '../../domain/stats';
import { getSessionLocalDateKey } from '../../domain/sessionRules';
import styles from './Statistics.module.css';

interface StatisticsProps {
  sessions: SessionRecord[];
  dailyGoalMin: number;
}

function formatDuration(sec: number): string {
  if (sec <= 0) return '0 min';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes} min`;
}

function formatShortTime(sec: number): string {
  if (sec <= 0) return '0';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export const Statistics: React.FC<StatisticsProps> = ({
  sessions,
  dailyGoalMin,
}) => {
  const todayKey = getSessionLocalDateKey(Date.now());
  const dailyStats = calculateDailyStats(sessions, todayKey);
  const goalProgress = calculateGoalProgress(dailyStats.focusTimeSec, dailyGoalMin);
  const last7Days = calculateLast7DaysStats(sessions, new Date());
  const taskDistribution = calculateTaskDistribution(sessions);

  // Determina a altura máxima para escala do gráfico dos últimos 7 dias
  const maxDaySec = Math.max(...last7Days.map((d) => d.focusTimeSec), 1);

  return (
    <section className={styles.container} aria-label="Estatísticas de Foco">
      <h1 className={styles.title}>Estatísticas</h1>

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <BarChart2 size={24} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className={styles.emptyTitle}>Sem dados suficientes ainda</p>
          <p className={styles.emptySubtitle}>
            Suas métricas diárias, gráficos semanais e tempo de foco por tarefa aparecerão aqui conforme você completa sessões.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Métricas Principais Hoje */}
          <div className={styles.metricsGrid}>
        <div className={styles.metricColumn}>
          <span className={styles.metricLabel}>Foco Hoje</span>
          <span className={styles.metricValue}>{formatDuration(dailyStats.focusTimeSec)}</span>
        </div>

        <div className={styles.metricDivider} aria-hidden="true" />

        <div className={styles.metricColumn}>
          <span className={styles.metricLabel}>Pomodoros Hoje</span>
          <span className={styles.metricValue}>{dailyStats.completedPomodoros}</span>
        </div>

        <div className={styles.metricDivider} aria-hidden="true" />

        <div className={styles.metricColumn}>
          <span className={styles.metricLabel}>Média Duração</span>
          <span className={styles.metricValue}>{formatDuration(dailyStats.averageDurationSec)}</span>
        </div>
      </div>

      {/* 2. Meta Diária */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Meta Diária</span>
          <span className={styles.sectionSubtitle}>
            {goalProgress.percent}% ({formatDuration(goalProgress.accumulatedSec)} / {formatDuration(goalProgress.goalMin * 60)})
          </span>
        </div>

        <div
          className={styles.goalBarTrack}
          role="progressbar"
          aria-valuenow={goalProgress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da meta diária"
        >
          <div
            className={styles.goalBarFill}
            style={{ width: `${goalProgress.percent}%` }}
          />
        </div>

        <div className={styles.goalMetaRow}>
          <span>Acumulado: {formatDuration(goalProgress.accumulatedSec)}</span>
          <span>Restante: {formatDuration(goalProgress.remainingSec)}</span>
        </div>
      </div>

      {/* 3. Gráfico dos Últimos 7 Dias */}
      <div className={styles.chartContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Últimos 7 Dias</span>
        </div>

        <div className={styles.chartBars} role="region" aria-label="Gráfico de foco nos últimos 7 dias">
          {last7Days.map((day) => {
            const isToday = day.dateKey === todayKey;
            const fillHeightPercent = (day.focusTimeSec / maxDaySec) * 100;
            return (
              <div key={day.dateKey} className={styles.barCol}>
                <span className={styles.barTimeText}>
                  {day.focusTimeSec > 0 ? formatShortTime(day.focusTimeSec) : ''}
                </span>

                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${isToday ? styles.barFillToday : ''}`}
                    style={{ height: `${Math.max(day.focusTimeSec > 0 ? 4 : 0, fillHeightPercent)}%` }}
                    title={`${day.dayLabel}: ${formatDuration(day.focusTimeSec)}`}
                  />
                </div>

                <span className={`${styles.barLabel} ${isToday ? styles.barLabelToday : ''}`}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Distribuição por Tarefa */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Distribuição por Tarefa</span>
        </div>

        {taskDistribution.length === 0 ? (
          <div className={styles.emptyNotice}>Nenhuma sessão vinculada a tarefas.</div>
        ) : (
          <ul className={styles.taskListDistribution}>
            {taskDistribution.map((item) => (
              <li key={item.taskName} className={styles.taskDistItem}>
                <div className={styles.taskDistHeader}>
                  <span className={styles.taskDistName} title={item.taskName}>
                    {item.taskName}
                  </span>
                  <span className={styles.taskDistStats}>
                    {formatDuration(item.focusTimeSec)} · {item.percentage}%
                  </span>
                </div>
                <div className={styles.taskDistBarTrack} aria-hidden="true">
                  <div
                    className={styles.taskDistBarFill}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        </>
      )}
    </section>
  );
};
