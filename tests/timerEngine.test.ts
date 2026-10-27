import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerEngine, type TimerSnapshot } from '../src/domain/timerEngine';
import {
  determineEarlyExitStatus,
  countsTowardsFocusStats,
  countsAsCompletedPomodoro,
  getSessionLocalDateKey,
  getNextCycleState,
} from '../src/domain/sessionRules';
import type { SessionRecord } from '../src/domain/types';

describe('TimerEngine & Domain Rules (Etapa 2)', () => {
  const defaultConfig = {
    focusDurationMin: 25,
    shortBreakDurationMin: 5,
    longBreakDurationMin: 15,
    longBreakInterval: 4,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Iniciar / pausar / continuar sem perder tempo
  it('1. deve iniciar, pausar e continuar sem perder tempo', () => {
    const onTick = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onTick });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.start(startTime);
    expect(engine.getState()).toBe('running');
    expect(engine.getRemainingMs(startTime)).toBe(25 * 60 * 1000);

    // Avança 5 minutos (300 segundos)
    const after5min = startTime + 5 * 60 * 1000;
    vi.setSystemTime(after5min);
    expect(engine.getRemainingMs(after5min)).toBe(20 * 60 * 1000);

    // Pausa o temporizador
    engine.pause(after5min);
    expect(engine.getState()).toBe('paused');
    expect(engine.getRemainingMs(after5min)).toBe(20 * 60 * 1000);

    // Passam-se 10 minutos enquanto pausado
    const after15min = after5min + 10 * 60 * 1000;
    vi.setSystemTime(after15min);
    // Tempo restante DEVE continuar 20 minutos
    expect(engine.getRemainingMs(after15min)).toBe(20 * 60 * 1000);

    // Continua
    engine.resume(after15min);
    expect(engine.getState()).toBe('running');

    // Avança mais 2 minutos
    const after17min = after15min + 2 * 60 * 1000;
    vi.setSystemTime(after17min);
    // Deve restar exatamente 18 minutos (20 - 2)
    expect(engine.getRemainingMs(after17min)).toBe(18 * 60 * 1000);
  });

  // 2. Reiniciar
  it('2. deve reiniciar e registrar foco com mais de 60s como interrompido', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.start(startTime);

    // Avança 75 segundos (>= 60s)
    const resetTime = startTime + 75 * 1000;
    vi.setSystemTime(resetTime);

    engine.reset(resetTime);

    expect(engine.getState()).toBe('idle');
    expect(engine.getRemainingMs()).toBe(25 * 60 * 1000);
    expect(onSessionFinished).toHaveBeenCalledTimes(1);

    const recorded: SessionRecord = onSessionFinished.mock.calls[0][0];
    expect(recorded.status).toBe('interrupted');
    expect(recorded.actualDurationSec).toBe(75);
    expect(recorded.mode).toBe('focus');
  });

  // 3. Pular
  it('3. deve pular foco e avançar para o próximo modo do ciclo', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.start(startTime);

    // Avança 30s (< 60s) e pula
    const skipTime = startTime + 30 * 1000;
    vi.setSystemTime(skipTime);

    engine.skip(skipTime);

    // O status deve ser 'cancelled' pois teve menos de 60s
    expect(onSessionFinished).toHaveBeenCalledTimes(1);
    const recorded: SessionRecord = onSessionFinished.mock.calls[0][0];
    expect(recorded.status).toBe('cancelled');
    expect(recorded.actualDurationSec).toBe(30);

    // Modo deve ter avançado para pausa curta
    expect(engine.getMode()).toBe('shortBreak');
    expect(engine.getState()).toBe('idle');
    expect(engine.getRemainingMs()).toBe(5 * 60 * 1000);
  });

  // 4. Ciclo de 4 focos até a pausa longa e reset após ela
  it('4. deve completar ciclo de 4 focos até a pausa longa e reiniciar ciclo após ela', () => {
    let currentMode = 'focus' as const;
    let cycleCount = 1;
    const interval = 4;

    // Foco 1
    let next = getNextCycleState(currentMode, cycleCount, interval, true);
    expect(next.nextMode).toBe('shortBreak');
    expect(next.nextCycleCount).toBe(1);

    // Pausa 1
    next = getNextCycleState('shortBreak', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('focus');
    expect(next.nextCycleCount).toBe(2);

    // Foco 2
    next = getNextCycleState('focus', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('shortBreak');
    expect(next.nextCycleCount).toBe(2);

    // Pausa 2
    next = getNextCycleState('shortBreak', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('focus');
    expect(next.nextCycleCount).toBe(3);

    // Foco 3
    next = getNextCycleState('focus', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('shortBreak');
    expect(next.nextCycleCount).toBe(3);

    // Pausa 3
    next = getNextCycleState('shortBreak', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('focus');
    expect(next.nextCycleCount).toBe(4);

    // Foco 4 (deve levar à PAUSA LONGA)
    next = getNextCycleState('focus', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('longBreak');
    expect(next.nextCycleCount).toBe(4);

    // Pausa Longa concluída (deve zerar / reiniciar no ciclo 1)
    next = getNextCycleState('longBreak', next.nextCycleCount, interval, true);
    expect(next.nextMode).toBe('focus');
    expect(next.nextCycleCount).toBe(1);
  });

  // 5. Idempotência: término processado duas vezes gera apenas um registro
  it('5. deve garantir idempotência: término processado duas vezes gera exatamente 1 registro', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.start(startTime);

    // Conclui naturalmente
    const endTime = startTime + 25 * 60 * 1000;
    vi.setSystemTime(endTime);

    engine.finish(endTime);
    expect(onSessionFinished).toHaveBeenCalledTimes(1);

    // Tentativa duplicada de chamar finish() com mesmo id
    engine.finish(endTime);
    expect(onSessionFinished).toHaveBeenCalledTimes(1);
  });

  // 6. Recuperação nos três cenários
  describe('6. Recuperação de estado após recarregar página', () => {
    it('Cenário A: running e ainda não passou do tempo previsto -> continua rodando', () => {
      const engine = new TimerEngine(defaultConfig);
      const startTime = new Date('2026-10-14T10:00:00Z').getTime();
      const targetDurationMs = 25 * 60 * 1000;
      const endsAt = startTime + targetDurationMs;

      const snapshot: TimerSnapshot = {
        id: 'test-uuid-a',
        mode: 'focus',
        state: 'running',
        startedAt: startTime,
        targetDurationMs,
        endsAt,
        cycleCount: 2,
      };

      // Simula recarregamento 10 minutos após o início (restam 15 min)
      const reloadTime = startTime + 10 * 60 * 1000;
      vi.setSystemTime(reloadTime);

      engine.recover(snapshot, reloadTime);

      expect(engine.getState()).toBe('running');
      expect(engine.getRemainingMs(reloadTime)).toBe(15 * 60 * 1000);
      expect(engine.getCycleCount()).toBe(2);
    });

    it('Cenário B: running e já passou do tempo previsto -> registra como concluída com término em endsAt', () => {
      const onSessionFinished = vi.fn();
      const onRecoveryAlert = vi.fn();
      const engine = new TimerEngine(defaultConfig, { onSessionFinished, onRecoveryAlert });

      const startTime = new Date('2026-10-14T10:00:00Z').getTime();
      const targetDurationMs = 25 * 60 * 1000;
      const endsAt = startTime + targetDurationMs;

      const snapshot: TimerSnapshot = {
        id: 'test-uuid-b',
        mode: 'focus',
        state: 'running',
        startedAt: startTime,
        targetDurationMs,
        endsAt,
        cycleCount: 1,
      };

      // Simula recarregamento 40 minutos após o início (passou 15 min do fim)
      const reloadTime = startTime + 40 * 60 * 1000;
      vi.setSystemTime(reloadTime);

      engine.recover(snapshot, reloadTime);

      expect(engine.getState()).toBe('finished');
      expect(onSessionFinished).toHaveBeenCalledTimes(1);

      const session: SessionRecord = onSessionFinished.mock.calls[0][0];
      expect(session.status).toBe('completed');
      expect(session.endedAt).toBe(endsAt); // Término exatamente em endsAt
      expect(session.actualDurationSec).toBe(25 * 60);
      expect(onRecoveryAlert).toHaveBeenCalledWith('Sessão concluída durante a sua ausência.');
    });

    it('Cenário C: paused -> continua pausada sem limite de tempo', () => {
      const engine = new TimerEngine(defaultConfig);
      const startTime = new Date('2026-10-14T10:00:00Z').getTime();
      const targetDurationMs = 25 * 60 * 1000;
      const remainingMs = 12 * 60 * 1000; // 12 min restantes

      const snapshot: TimerSnapshot = {
        id: 'test-uuid-c',
        mode: 'focus',
        state: 'paused',
        startedAt: startTime,
        targetDurationMs,
        remainingMs,
        cycleCount: 3,
      };

      // Simula recarregamento 2 horas depois
      const reloadTime = startTime + 2 * 60 * 60 * 1000;
      vi.setSystemTime(reloadTime);

      engine.recover(snapshot, reloadTime);

      expect(engine.getState()).toBe('paused');
      expect(engine.getRemainingMs()).toBe(remainingMs);
      expect(engine.getCycleCount()).toBe(3);
    });
  });

  // 7. Sessão que cruza a meia-noite
  it('7. sessão que cruza meia-noite pertence ao dia da sua hora de início', () => {
    // Início em 2026-10-14 às 23:50
    const startTimestamp = new Date(2026, 9, 14, 23, 50, 0).getTime();
    // Término em 2026-10-15 às 00:15 (25 minutos depois)
    const endTimestamp = new Date(2026, 9, 15, 0, 15, 0).getTime();

    const dateKey = getSessionLocalDateKey(startTimestamp);
    expect(dateKey).toBe('2026-10-14');

    const session: SessionRecord = {
      id: 'session-midnight',
      mode: 'focus',
      startedAt: startTimestamp,
      endedAt: endTimestamp,
      targetDurationSec: 25 * 60,
      actualDurationSec: 25 * 60,
      status: 'completed',
      cycleIndex: 1,
    };

    // A sessão deve ser atribuída ao dia 14/10/2026
    expect(getSessionLocalDateKey(session.startedAt)).toBe('2026-10-14');
    expect(countsTowardsFocusStats(session)).toBe(true);
    expect(countsAsCompletedPomodoro(session)).toBe(true);
  });

  // 8. Sessão de 59s vs 60s (cancelada vs interrompida)
  it('8. sessão de 59s é cancelada (sem estatísticas) vs 60s é interrompida (entra nas estatísticas)', () => {
    // 59 segundos
    const status59s = determineEarlyExitStatus(59);
    expect(status59s).toBe('cancelled');

    const session59s: Pick<SessionRecord, 'mode' | 'status'> = {
      mode: 'focus',
      status: status59s,
    };
    expect(countsTowardsFocusStats(session59s)).toBe(false);
    expect(countsAsCompletedPomodoro(session59s)).toBe(false);

    // 60 segundos
    const status60s = determineEarlyExitStatus(60);
    expect(status60s).toBe('interrupted');

    const session60s: Pick<SessionRecord, 'mode' | 'status'> = {
      mode: 'focus',
      status: status60s,
    };
    expect(countsTowardsFocusStats(session60s)).toBe(true);
    // Mas não conta como pomodoro concluído (apenas foco concluído conta)
    expect(countsAsCompletedPomodoro(session60s)).toBe(false);
  });

  // 9. Visibility change recalculates immediately
  it('9. deve recalcular imediatamente no visibilitychange e finalizar sessão se endsAt já passou', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.start(startTime);

    // Usuário sai da aba e volta 30 minutos depois (endsAt era 25 min)
    const returnTime = startTime + 30 * 60 * 1000;
    vi.setSystemTime(returnTime);

    engine.handleVisibilityChange(returnTime);

    expect(engine.getState()).toBe('finished');
    expect(onSessionFinished).toHaveBeenCalledTimes(1);
    const session: SessionRecord = onSessionFinished.mock.calls[0][0];
    expect(session.status).toBe('completed');
  });

  // 10. Transições inválidas são tratadas com segurança
  it('10. transições inválidas não quebram o estado interno', () => {
    const engine = new TimerEngine(defaultConfig);
    expect(engine.getState()).toBe('idle');

    // Chamar pause enquanto idle não altera o estado
    engine.pause();
    expect(engine.getState()).toBe('idle');

    // Chamar resume enquanto idle não altera o estado
    engine.resume();
    expect(engine.getState()).toBe('idle');
  });

  // 11. Mudar tarefa durante foco em andamento só vale para a próxima sessão
  it('11. mudar a tarefa durante um foco em andamento só vale para a próxima sessão', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.setTask('task-1', 'Tarefa Inicial');
    engine.start(startTime);

    // Durante o foco em andamento, o usuário troca para a Tarefa Secundária
    engine.setTask('task-2', 'Tarefa Secundária');

    // Ao terminar o primeiro foco, a sessão registrada DEVE manter a Tarefa Inicial
    const endTime = startTime + 25 * 60 * 1000;
    vi.setSystemTime(endTime);
    engine.finish(endTime);

    expect(onSessionFinished).toHaveBeenCalledTimes(1);
    const recorded1: SessionRecord = onSessionFinished.mock.calls[0][0];
    expect(recorded1.taskId).toBe('task-1');
    expect(recorded1.taskName).toBe('Tarefa Inicial');

    // Na próxima sessão iniciada, a Tarefa Secundária deve entrar em vigor
    engine.start(endTime + 1000);
    const snapshot = engine.getSnapshot();
    expect(snapshot.taskId).toBe('task-2');
    expect(snapshot.taskName).toBe('Tarefa Secundária');
  });

  // 12. Sessão guarda taskId e taskName (snapshot), preservando histórico
  it('12. sessão preserva snapshot taskName mesmo se tarefa for modificada ou excluída', () => {
    const onSessionFinished = vi.fn();
    const engine = new TimerEngine(defaultConfig, { onSessionFinished });

    const startTime = new Date('2026-10-14T10:00:00Z').getTime();
    vi.setSystemTime(startTime);

    engine.setTask('task-deleted', 'Tarefa Que Será Deletada');
    engine.start(startTime);

    const endTime = startTime + 25 * 60 * 1000;
    vi.setSystemTime(endTime);
    engine.finish(endTime);

    const session: SessionRecord = onSessionFinished.mock.calls[0][0];
    expect(session.taskId).toBe('task-deleted');
    expect(session.taskName).toBe('Tarefa Que Será Deletada');
  });
});
