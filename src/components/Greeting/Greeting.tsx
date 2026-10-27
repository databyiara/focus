import React, { useState, useEffect, useMemo } from 'react';
import type { SessionRecord } from '../../domain/types';
import type { DailyStats } from '../../domain/stats';
import {
  calculateStreakDays,
  getDaysSinceLastFocusSession,
  getGreetingTimeOfDay,
  formatGreetingHeader,
  getGreetingContextLine,
} from '../../domain/stats';
import { getSessionLocalDateKey } from '../../domain/sessionRules';
import styles from './Greeting.module.css';

interface GreetingProps {
  userName?: string | null;
  todayStats: DailyStats;
  dailyGoalMin: number;
  focusDurationMin: number;
  sessions: SessionRecord[];
}

export const Greeting: React.FC<GreetingProps> = ({
  userName,
  todayStats,
  dailyGoalMin,
  focusDurationMin,
  sessions,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Atualiza relógio interno a cada minuto para viradas de turno e hora
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeOfDay = useMemo(() => getGreetingTimeOfDay(currentDate), [currentDate]);

  const greetingHeader = useMemo(
    () => formatGreetingHeader(timeOfDay, userName),
    [timeOfDay, userName]
  );

  const contextLine = useMemo(() => {
    const dailyGoalCycles = Math.max(1, Math.round(dailyGoalMin / focusDurationMin));
    const streakDays = calculateStreakDays(sessions, currentDate);
    const daysSinceLastSession = getDaysSinceLastFocusSession(sessions, currentDate);

    const todayKey = getSessionLocalDateKey(currentDate.getTime());
    const todaySessions = sessions.filter(
      (s) => getSessionLocalDateKey(s.startedAt) === todayKey
    );

    return getGreetingContextLine({
      todayStats,
      dailyGoalCycles,
      dailyGoalMin,
      streakDays,
      todaySessions,
      daysSinceLastSession,
      nowMs: currentDate.getTime(),
    });
  }, [sessions, currentDate, todayStats, dailyGoalMin, focusDurationMin]);

  return (
    <div className={styles.greetingWrapper} aria-label="Saudação inicial">
      <h1 className={styles.greetingTitle}>{greetingHeader}</h1>
      <p className={styles.contextLine}>{contextLine}</p>
    </div>
  );
};
