import { describe, it, expect } from 'vitest';
import {
  calculateDailyStats,
  calculateGoalProgress,
  calculateLast7DaysStats,
  calculateTaskDistribution,
  calculateStreakDays,
  getGreetingTimeOfDay,
  formatGreetingHeader,
  getGreetingContextLine,
} from '../src/domain/stats';
import type { SessionRecord } from '../src/domain/types';

describe('Stats domain calculations', () => {
  const targetDate = '2026-10-14';
  const baseTime = new Date('2026-10-14T12:00:00').getTime();

  it('calcula estatísticas diárias considerando apenas focos válidos', () => {
    const sessions: SessionRecord[] = [
      // 1. Foco concluído (25 min = 1500s)
      {
        id: 's1',
        mode: 'focus',
        startedAt: baseTime,
        endedAt: baseTime + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
      // 2. Foco interrompido aos 10 min (600s >= 60s) -> CONTA no tempo de foco, NÃO conta em pomodoros concluídos
      {
        id: 's2',
        mode: 'focus',
        startedAt: baseTime + 2000 * 1000,
        endedAt: baseTime + 2600 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 600,
        status: 'interrupted',
        cycleIndex: 2,
      },
      // 3. Foco cancelado aos 45s (< 60s) -> NÃO CONTA em nada
      {
        id: 's3',
        mode: 'focus',
        startedAt: baseTime + 3000 * 1000,
        endedAt: baseTime + 3045 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 45,
        status: 'cancelled',
        cycleIndex: 2,
      },
      // 4. Pausa curta (300s) -> NUNCA soma em tempo de foco nem pomodoros
      {
        id: 's4',
        mode: 'shortBreak',
        startedAt: baseTime + 4000 * 1000,
        endedAt: baseTime + 4300 * 1000,
        targetDurationSec: 300,
        actualDurationSec: 300,
        status: 'completed',
        cycleIndex: 2,
      },
      // 5. Sessão de outro dia -> não entra no targetDate
      {
        id: 's5',
        mode: 'focus',
        startedAt: baseTime - 24 * 60 * 60 * 1000,
        endedAt: baseTime - 24 * 60 * 60 * 1000 + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
    ];

    const stats = calculateDailyStats(sessions, targetDate);

    // Tempo de foco = 1500 (s1) + 600 (s2) = 2100s (35 minutos)
    expect(stats.focusTimeSec).toBe(2100);
    // Apenas s1 é foco concluído
    expect(stats.completedPomodoros).toBe(1);
    // Média = 2100 / 2 = 1050s (17.5 min)
    expect(stats.averageDurationSec).toBe(1050);
  });

  it('calcula progresso da meta diária com precisão', () => {
    // Meta de 4h (240 min = 14400s), acumulado 1h (3600s)
    const progress = calculateGoalProgress(3600, 240);
    expect(progress.goalMin).toBe(240);
    expect(progress.accumulatedSec).toBe(3600);
    expect(progress.remainingSec).toBe(10800); // 3h restantes
    expect(progress.percent).toBe(25);
  });

  it('calcula dados para o gráfico de barras dos últimos 7 dias', () => {
    const today = new Date('2026-10-14T15:00:00');
    const sessions: SessionRecord[] = [
      {
        id: 's-today',
        mode: 'focus',
        startedAt: today.getTime(),
        endedAt: today.getTime() + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
    ];

    const last7Days = calculateLast7DaysStats(sessions, today);
    expect(last7Days).toHaveLength(7);
    expect(last7Days[6].dateKey).toBe('2026-10-14');
    expect(last7Days[6].focusTimeSec).toBe(1500);
    expect(last7Days[0].focusTimeSec).toBe(0);
  });

  it('calcula distribuição de foco por tarefa ordenado pelo maior tempo', () => {
    const sessions: SessionRecord[] = [
      {
        id: 's1',
        mode: 'focus',
        startedAt: 1000,
        endedAt: 2500,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        taskName: 'Tarefa A',
        cycleIndex: 1,
      },
      {
        id: 's2',
        mode: 'focus',
        startedAt: 3000,
        endedAt: 6000,
        targetDurationSec: 3000,
        actualDurationSec: 3000,
        status: 'completed',
        taskName: 'Tarefa B',
        cycleIndex: 2,
      },
      {
        id: 's3',
        mode: 'focus',
        startedAt: 7000,
        endedAt: 8500,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'interrupted',
        taskName: 'Tarefa A',
        cycleIndex: 3,
      },
    ];

    const dist = calculateTaskDistribution(sessions);
    expect(dist).toHaveLength(2);
    // Tarefa A = 1500 + 1500 = 3000s (50%)
    // Tarefa B = 3000s (50%)
    expect(dist[0].focusTimeSec).toBe(3000);
    expect(dist[0].percentage).toBe(50);
  });

  it('calcula streak de dias consecutivos corretamente', () => {
    const today = new Date('2026-10-14T10:00:00');
    const dayMs = 24 * 3600 * 1000;

    // Sessões em 14/10 (hoje), 13/10 (ontem) e 12/10 (anteontem) -> 3 dias seguidos
    const sessions: SessionRecord[] = [
      {
        id: 's-today',
        mode: 'focus',
        startedAt: today.getTime(),
        endedAt: today.getTime() + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
      {
        id: 's-yesterday',
        mode: 'focus',
        startedAt: today.getTime() - dayMs,
        endedAt: today.getTime() - dayMs + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
      {
        id: 's-day-before',
        mode: 'focus',
        startedAt: today.getTime() - 2 * dayMs,
        endedAt: today.getTime() - 2 * dayMs + 1500 * 1000,
        targetDurationSec: 1500,
        actualDurationSec: 1500,
        status: 'completed',
        cycleIndex: 1,
      },
    ];

    expect(calculateStreakDays(sessions, today)).toBe(3);

    // Se hoje ainda não fez foco, mas ontem fez, o streak preserva os dias até ontem
    const sessionsWithoutToday = sessions.slice(1);
    expect(calculateStreakDays(sessionsWithoutToday, today)).toBe(2);

    // Se nem hoje nem ontem fizeram foco, streak é zero
    const sessionsOlder = [sessions[2]];
    expect(calculateStreakDays(sessionsOlder, today)).toBe(0);
  });

  it('determina saudação por horário (5-11h, 12-17h, 18-4h) e nome', () => {
    const morningDate = new Date('2026-10-14T08:30:00');
    const afternoonDate = new Date('2026-10-14T14:00:00');
    const nightDate = new Date('2026-10-14T21:00:00');
    const lateNightDate = new Date('2026-10-14T02:00:00');

    expect(getGreetingTimeOfDay(morningDate)).toBe('morning');
    expect(getGreetingTimeOfDay(afternoonDate)).toBe('afternoon');
    expect(getGreetingTimeOfDay(nightDate)).toBe('night');
    expect(getGreetingTimeOfDay(lateNightDate)).toBe('night');

    // Com nome
    expect(formatGreetingHeader('morning', 'Lucas')).toBe('Bom dia, Lucas');
    expect(formatGreetingHeader('afternoon', 'Mariana')).toBe('Boa tarde, Mariana');
    expect(formatGreetingHeader('night', 'Alex')).toBe('Boa noite, Alex');

    // Sem nome (ou vazio)
    expect(formatGreetingHeader('morning', '')).toBe('Bom dia');
    expect(formatGreetingHeader('afternoon', null)).toBe('Boa tarde');
    expect(formatGreetingHeader('night', '   ')).toBe('Boa noite');
  });

  it('determina linha de contexto conforme as situações', () => {
    // 1. Primeira sessão do dia (sem sessões hoje)
    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 0, completedPomodoros: 0, averageDurationSec: 0 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 0,
        todaySessions: [],
        daysSinceLastSession: 0,
      })
    ).toBe('Vamos começar o dia?');

    // 2. Primeira sessão com sequência de dias
    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 0, completedPomodoros: 0, averageDurationSec: 0 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 3,
        todaySessions: [],
        daysSinceLastSession: 0,
      })
    ).toBe('3 dias seguidos. Vamos começar o dia?');

    // 3. Retornando após ausência de 2+ dias
    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 0, completedPomodoros: 0, averageDurationSec: 0 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 0,
        todaySessions: [],
        daysSinceLastSession: 2,
      })
    ).toBe('Que bom ter você de volta. Um passo de cada vez.');

    // 4. Retornando depois de horas (mais de 2h da última sessão)
    const now = 10000000;
    const sessionEndedHoursAgo: SessionRecord = {
      id: 's1',
      mode: 'focus',
      startedAt: now - 3 * 3600 * 1000 - 1500 * 1000,
      endedAt: now - 3 * 3600 * 1000,
      targetDurationSec: 1500,
      actualDurationSec: 1500,
      status: 'completed',
      cycleIndex: 1,
    };

    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 1500, completedPomodoros: 1, averageDurationSec: 1500 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 1,
        todaySessions: [sessionEndedHoursAgo],
        daysSinceLastSession: 0,
        nowMs: now,
      })
    ).toBe('Retomando o foco depois de uma pausa.');

    // 5. Meta quase batida (falta 1 ciclo)
    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 4500, completedPomodoros: 3, averageDurationSec: 1500 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 1,
        todaySessions: [sessionEndedHoursAgo],
        daysSinceLastSession: 0,
        nowMs: sessionEndedHoursAgo.endedAt + 10 * 60 * 1000, // 10 min depois
      })
    ).toBe('Falta 1 ciclo para a meta de hoje.');

    // 6. Meta batida
    expect(
      getGreetingContextLine({
        todayStats: { focusTimeSec: 6000, completedPomodoros: 4, averageDurationSec: 1500 },
        dailyGoalCycles: 4,
        dailyGoalMin: 240,
        streakDays: 1,
        todaySessions: [sessionEndedHoursAgo],
        daysSinceLastSession: 0,
      })
    ).toBe('Meta de hoje batida! Parabéns pelo foco.');
  });
});
