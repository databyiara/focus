import type { SessionRecord } from './types';
import {
  countsTowardsFocusStats,
  countsAsCompletedPomodoro,
  getSessionLocalDateKey,
} from './sessionRules';

export interface DailyStats {
  focusTimeSec: number;
  completedPomodoros: number;
  averageDurationSec: number;
}

export interface DayBarData {
  dateKey: string; // YYYY-MM-DD
  dayLabel: string; // Seg, Ter, Qua...
  focusTimeSec: number;
}

export interface GoalProgress {
  goalMin: number;
  accumulatedSec: number;
  remainingSec: number;
  percent: number;
}

/**
 * Calcula estatísticas diárias com base nos registros reais.
 * Uma sessão pertence ao dia da sua hora de início (data local do dispositivo).
 */
export function calculateDailyStats(sessions: SessionRecord[], targetDateKey: string): DailyStats {
  let focusTimeSec = 0;
  let completedPomodoros = 0;
  let focusSessionCount = 0;

  for (const session of sessions) {
    const sessionDateKey = getSessionLocalDateKey(session.startedAt);
    if (sessionDateKey !== targetDateKey) continue;

    if (countsTowardsFocusStats(session)) {
      focusTimeSec += session.actualDurationSec;
      focusSessionCount += 1;
    }

    if (countsAsCompletedPomodoro(session)) {
      completedPomodoros += 1;
    }
  }

  const averageDurationSec =
    focusSessionCount > 0 ? Math.round(focusTimeSec / focusSessionCount) : 0;

  return {
    focusTimeSec,
    completedPomodoros,
    averageDurationSec,
  };
}

/**
 * Calcula o progresso em relação à meta diária.
 */
export function calculateGoalProgress(accumulatedSec: number, goalMin: number): GoalProgress {
  const goalSec = goalMin * 60;
  const remainingSec = Math.max(0, goalSec - accumulatedSec);
  const percent = goalSec > 0 ? Math.min(100, Math.round((accumulatedSec / goalSec) * 100)) : 0;

  return {
    goalMin,
    accumulatedSec,
    remainingSec,
    percent,
  };
}

/**
 * Gera os dados dos últimos 7 dias (terminando na data de referência).
 */
export function calculateLast7DaysStats(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): DayBarData[] {
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const result: DayBarData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateKey = getSessionLocalDateKey(d.getTime());
    const dayLabel = dayLabels[d.getDay()];

    let dayFocusSec = 0;
    for (const session of sessions) {
      if (getSessionLocalDateKey(session.startedAt) === dateKey && countsTowardsFocusStats(session)) {
        dayFocusSec += session.actualDurationSec;
      }
    }

    result.push({
      dateKey,
      dayLabel,
      focusTimeSec: dayFocusSec,
    });
  }

  return result;
}

export interface TaskDistributionItem {
  taskName: string;
  focusTimeSec: number;
  percentage: number;
}

/**
 * Calcula a distribuição de foco por tarefa.
 */
export function calculateTaskDistribution(sessions: SessionRecord[]): TaskDistributionItem[] {
  const map: Map<string, number> = new Map();
  let totalFocusSec = 0;

  for (const session of sessions) {
    if (countsTowardsFocusStats(session)) {
      const name = session.taskName?.trim() || 'Sem tarefa';
      const current = map.get(name) || 0;
      map.set(name, current + session.actualDurationSec);
      totalFocusSec += session.actualDurationSec;
    }
  }

  const result: TaskDistributionItem[] = [];
  for (const [taskName, focusTimeSec] of map.entries()) {
    const percentage =
      totalFocusSec > 0 ? Math.round((focusTimeSec / totalFocusSec) * 100) : 0;
    result.push({
      taskName,
      focusTimeSec,
      percentage,
    });
  }

  return result.sort((a, b) => b.focusTimeSec - a.focusTimeSec);
}

/**
 * Calcula a sequência de dias consecutivos com foco (streak).
 * Começa a checar a partir de hoje (ou ontem se hoje ainda não tem sessões).
 */
export function calculateStreakDays(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): number {
  const dayKeyToHasFocus = new Set<string>();

  for (const session of sessions) {
    if (countsTowardsFocusStats(session)) {
      dayKeyToHasFocus.add(getSessionLocalDateKey(session.startedAt));
    }
  }

  const todayKey = getSessionLocalDateKey(referenceDate.getTime());
  const hasToday = dayKeyToHasFocus.has(todayKey);

  // Se hoje tem foco, começamos de hoje. Se não, mas ontem tem foco, começamos de ontem.
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getSessionLocalDateKey(yesterday.getTime());
  const hasYesterday = dayKeyToHasFocus.has(yesterdayKey);

  if (!hasToday && !hasYesterday) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(hasToday ? referenceDate : yesterday);

  while (true) {
    const key = getSessionLocalDateKey(cursor.getTime());
    if (dayKeyToHasFocus.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Retorna quantos dias corridos se passaram desde a última sessão de foco.
 * 0 = hoje, 1 = ontem, 2+ = ausência prolongada.
 */
export function getDaysSinceLastFocusSession(
  sessions: SessionRecord[],
  referenceDate: Date = new Date()
): number {
  let latestFocusTime: number | null = null;

  for (const session of sessions) {
    if (countsTowardsFocusStats(session)) {
      if (latestFocusTime === null || session.startedAt > latestFocusTime) {
        latestFocusTime = session.startedAt;
      }
    }
  }

  if (latestFocusTime === null) {
    return 0;
  }

  const todayKey = getSessionLocalDateKey(referenceDate.getTime());
  const lastKey = getSessionLocalDateKey(latestFocusTime);

  if (todayKey === lastKey) {
    return 0;
  }

  const todayDate = new Date(todayKey + 'T00:00:00');
  const lastDate = new Date(lastKey + 'T00:00:00');
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (24 * 3600 * 1000));

  return Math.max(0, diffDays);
}

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

/**
 * Determina o período do dia conforme a hora local (5–11h, 12–17h, 18–4h).
 */
export function getGreetingTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning'; // 5–11h
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon'; // 12–17h
  }
  return 'night'; // 18–4h
}

/**
 * Formata a saudação principal: "Bom dia / Boa tarde / Boa noite, {nome}".
 * Sem nome, retorna apenas a saudação.
 */
export function formatGreetingHeader(timeOfDay: TimeOfDay, userName?: string | null): string {
  const salutation =
    timeOfDay === 'morning'
      ? 'Bom dia'
      : timeOfDay === 'afternoon'
        ? 'Boa tarde'
        : 'Boa noite';

  const cleanName = userName?.trim();
  if (cleanName) {
    return `${salutation}, ${cleanName}`;
  }
  return salutation;
}

export interface GreetingContextParams {
  todayStats: DailyStats;
  dailyGoalCycles: number;
  dailyGoalMin: number;
  streakDays: number;
  todaySessions: SessionRecord[];
  daysSinceLastSession: number;
  nowMs?: number;
}

/**
 * Determina a linha de contexto abaixo da saudação:
 * 1. Meta batida
 * 2. Meta quase batida (falta 1 ciclo)
 * 3. Sequência de dias mantida (ex: 3 dias seguidos)
 * 4. Retornando depois de horas (pausa longa no mesmo dia)
 * 5. Retornando após ausência de dias
 * 6. Primeira sessão do dia ("Vamos começar o dia?")
 */
export function getGreetingContextLine(params: GreetingContextParams): string {
  const {
    todayStats,
    dailyGoalCycles,
    dailyGoalMin,
    streakDays,
    todaySessions,
    daysSinceLastSession,
    nowMs = Date.now(),
  } = params;

  const goalSec = dailyGoalMin * 60;
  const isGoalAchieved =
    (dailyGoalCycles > 0 && todayStats.completedPomodoros >= dailyGoalCycles) ||
    (goalSec > 0 && todayStats.focusTimeSec >= goalSec);

  if (isGoalAchieved && todayStats.completedPomodoros > 0) {
    return 'Meta de hoje batida! Parabéns pelo foco.';
  }

  const isAlmostGoal =
    dailyGoalCycles > 1 &&
    dailyGoalCycles - todayStats.completedPomodoros === 1;

  if (isAlmostGoal) {
    return 'Falta 1 ciclo para a meta de hoje.';
  }

  // Se já fez alguma sessão hoje
  if (todaySessions.length > 0) {
    // Verifica se a última sessão terminou há mais de 2 horas
    const sortedToday = [...todaySessions].sort((a, b) => b.endedAt - a.endedAt);
    const lastSession = sortedToday[0];
    const diffHours = (nowMs - lastSession.endedAt) / (1000 * 3600);

    if (diffHours >= 2) {
      return 'Retomando o foco depois de uma pausa.';
    }

    if (streakDays >= 2) {
      return `${streakDays} dias seguidos mantendo o foco.`;
    }

    return 'Mantenha o ritmo no seu próprio tempo.';
  }

  // Primeira sessão do dia (0 sessões hoje)
  if (daysSinceLastSession >= 2) {
    return 'Que bom ter você de volta. Um passo de cada vez.';
  }

  if (streakDays >= 2) {
    return `${streakDays} dias seguidos. Vamos começar o dia?`;
  }

  return 'Vamos começar o dia?';
}

