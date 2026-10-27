import type { SessionMode, SessionRecord, SessionStatus, TimerState } from './types';
import { determineEarlyExitStatus, getNextCycleState } from './sessionRules';

export interface TimerEngineConfig {
  focusDurationMin: number;
  shortBreakDurationMin: number;
  longBreakDurationMin: number;
  longBreakInterval: number;
}

export interface TimerSnapshot {
  id: string;
  mode: SessionMode;
  state: TimerState;
  startedAt: number;
  targetDurationMs: number;
  endsAt?: number;
  remainingMs?: number;
  taskId?: string;
  taskName?: string;
  cycleCount: number;
}

export interface TimerEngineEvents {
  onTick?: (remainingMs: number, progressPercent: number) => void;
  onStateChange?: (state: TimerState, snapshot: TimerSnapshot) => void;
  onSessionFinished?: (session: SessionRecord) => void;
  onRecoveryAlert?: (message: string) => void;
}

export function formatTimeMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export class TimerEngine {
  private state: TimerState = 'idle';
  private mode: SessionMode = 'focus';
  private currentSessionId: string = '';
  private startedAt: number = 0;
  private endsAt: number = 0;
  private remainingMs: number = 0;
  private targetDurationMs: number = 0;
  private cycleCount: number = 1;
  private taskId?: string;
  private taskName?: string;
  private nextTaskId?: string;
  private nextTaskName?: string;

  private config: TimerEngineConfig;
  private events: TimerEngineEvents;
  private processedSessionIds: Set<string> = new Set();
  private intervalTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    config: TimerEngineConfig,
    events: TimerEngineEvents = {}
  ) {
    this.config = { ...config };
    this.events = events;
    this.resetDurationForCurrentMode();
  }

  // --- Getters ---
  public getState(): TimerState {
    return this.state;
  }

  public getMode(): SessionMode {
    return this.mode;
  }

  public getCycleCount(): number {
    return this.cycleCount;
  }

  public getTargetDurationMs(): number {
    return this.targetDurationMs;
  }

  public getRemainingMs(now: number = Date.now()): number {
    if (this.state === 'running') {
      return Math.max(0, this.endsAt - now);
    }
    return this.remainingMs;
  }

  public getProgressPercent(now: number = Date.now()): number {
    if (this.targetDurationMs <= 0) return 0;
    const remaining = this.getRemainingMs(now);
    const elapsed = this.targetDurationMs - remaining;
    return Math.min(100, Math.max(0, (elapsed / this.targetDurationMs) * 100));
  }

  public getFormattedTime(now: number = Date.now()): string {
    return formatTimeMs(this.getRemainingMs(now));
  }

  public getSnapshot(): TimerSnapshot {
    return {
      id: this.currentSessionId,
      mode: this.mode,
      state: this.state,
      startedAt: this.startedAt,
      targetDurationMs: this.targetDurationMs,
      endsAt: this.state === 'running' ? this.endsAt : undefined,
      remainingMs: this.remainingMs,
      taskId: this.taskId,
      taskName: this.taskName,
      cycleCount: this.cycleCount,
    };
  }

  // --- Configuration & Mode Updates ---
  public updateConfig(newConfig: Partial<TimerEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (this.state === 'idle') {
      this.resetDurationForCurrentMode();
    }
  }

  public setTask(taskId?: string, taskName?: string): void {
    if (this.state === 'running') {
      // Regra de negócio: mudar tarefa durante foco em andamento só vale para a próxima sessão
      this.nextTaskId = taskId;
      this.nextTaskName = taskName;
      return;
    }
    this.taskId = taskId;
    this.taskName = taskName;
  }

  public setMode(mode: SessionMode): void {
    if (this.state === 'running') {
      this.handleInvalidTransition(`Não é possível trocar de modo enquanto o temporizador está rodando.`);
      return;
    }
    this.mode = mode;
    this.resetDurationForCurrentMode();
    this.emitTick();
    this.emitStateChange();
  }

  // --- Máquina de Estados e Transições ---

  /**
   * Transição: idle / finished -> running
   */
  public start(now: number = Date.now()): void {
    if (this.state !== 'idle' && this.state !== 'finished') {
      this.handleInvalidTransition(`Transição inválida: start chamado no estado "${this.state}"`);
      return;
    }

    // Aplica tarefa pendente para a próxima sessão se houver
    if (this.nextTaskId !== undefined || this.nextTaskName !== undefined) {
      this.taskId = this.nextTaskId;
      this.taskName = this.nextTaskName;
      this.nextTaskId = undefined;
      this.nextTaskName = undefined;
    }

    this.currentSessionId = crypto.randomUUID();
    this.startedAt = now;
    this.targetDurationMs = this.getDurationForMode(this.mode);
    this.remainingMs = this.targetDurationMs;
    this.endsAt = now + this.remainingMs;
    this.state = 'running';

    this.startTicker();
    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Transição: running -> paused
   */
  public pause(now: number = Date.now()): void {
    if (this.state !== 'running') {
      this.handleInvalidTransition(`Transição inválida: pause chamado no estado "${this.state}"`);
      return;
    }

    this.stopTicker();
    this.remainingMs = Math.max(0, this.endsAt - now);
    this.state = 'paused';

    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Transição: paused -> running
   */
  public resume(now: number = Date.now()): void {
    if (this.state !== 'paused') {
      this.handleInvalidTransition(`Transição inválida: resume chamado no estado "${this.state}"`);
      return;
    }

    this.endsAt = now + this.remainingMs;
    this.state = 'running';

    this.startTicker();
    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Transição: running -> finished (término natural)
   */
  public finish(now: number = Date.now()): void {
    if (this.state !== 'running') {
      // Se já terminou, garante idempotência e retorna
      if (this.state === 'finished' && this.processedSessionIds.has(this.currentSessionId)) {
        return;
      }
      this.handleInvalidTransition(`Transição inválida: finish chamado no estado "${this.state}"`);
      return;
    }

    this.stopTicker();
    this.state = 'finished';
    this.remainingMs = 0;

    this.recordSession(now, 'completed');
    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Transição: running / paused / finished -> idle (Reiniciar)
   * Se estava em andamento com foco, registra interrupção ou cancelamento conforme overrideStatus.
   */
  public reset(now: number = Date.now(), overrideStatus?: SessionStatus): void {
    if (this.state === 'running' || this.state === 'paused') {
      const actualElapsedMs = this.targetDurationMs - this.getRemainingMs(now);
      const actualDurationSec = Math.floor(Math.max(0, actualElapsedMs) / 1000);
      const status = overrideStatus ?? determineEarlyExitStatus(actualDurationSec);
      this.recordSession(now, status, actualDurationSec);
    }

    this.stopTicker();
    this.state = 'idle';
    this.resetDurationForCurrentMode();

    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Pular sessão atual:
   * Registra a sessão como interrompida/cancelada (se em andamento)
   * e avança imediatamente para o próximo modo do ciclo.
   */
  public skip(now: number = Date.now(), overrideStatus?: SessionStatus): void {
    if (this.state === 'running' || this.state === 'paused') {
      const actualElapsedMs = this.targetDurationMs - this.getRemainingMs(now);
      const actualDurationSec = Math.floor(Math.max(0, actualElapsedMs) / 1000);
      const status = overrideStatus ?? determineEarlyExitStatus(actualDurationSec);
      this.recordSession(now, status, actualDurationSec);
    }

    this.stopTicker();

    // Avança para o próximo modo
    const next = getNextCycleState(
      this.mode,
      this.cycleCount,
      this.config.longBreakInterval,
      false // Pular não conta como conclusão
    );

    this.mode = next.nextMode;
    this.cycleCount = next.nextCycleCount;
    this.state = 'idle';
    this.resetDurationForCurrentMode();

    this.emitTick(now);
    this.emitStateChange();
  }

  /**
   * Iniciar próximo modo após o término de uma sessão.
   */
  public startNext(autoStart: boolean = false, now: number = Date.now()): void {
    const next = getNextCycleState(
      this.mode,
      this.cycleCount,
      this.config.longBreakInterval,
      true
    );

    this.mode = next.nextMode;
    this.cycleCount = next.nextCycleCount;
    this.state = 'idle';
    this.resetDurationForCurrentMode();

    if (autoStart) {
      this.start(now);
    } else {
      this.emitTick(now);
      this.emitStateChange();
    }
  }

  /**
   * Recálculo imediato para visibilidade de aba (visibilitychange)
   */
  public handleVisibilityChange(now: number = Date.now()): void {
    if (this.state === 'running') {
      if (now >= this.endsAt) {
        this.finish(this.endsAt);
      } else {
        this.emitTick(now);
      }
    }
  }

  /**
   * Recuperação de estado após recarregar página / fechar aba
   */
  public recover(snapshot: TimerSnapshot, now: number = Date.now()): void {
    this.currentSessionId = snapshot.id;
    this.mode = snapshot.mode;
    this.startedAt = snapshot.startedAt;
    this.targetDurationMs = snapshot.targetDurationMs;
    this.cycleCount = snapshot.cycleCount;
    this.taskId = snapshot.taskId;
    this.taskName = snapshot.taskName;

    if (snapshot.state === 'running') {
      const endsAt = snapshot.endsAt || (snapshot.startedAt + snapshot.targetDurationMs);
      this.endsAt = endsAt;

      if (now < endsAt) {
        // Cenário 1: running e ainda não passou do tempo previsto -> continua
        this.remainingMs = endsAt - now;
        this.state = 'running';
        this.startTicker();
        this.emitTick(now);
        this.emitStateChange();
      } else {
        // Cenário 2: running e já passou do tempo previsto -> conclui com término em endsAt
        this.state = 'finished';
        this.remainingMs = 0;
        this.recordSession(endsAt, 'completed', Math.round(this.targetDurationMs / 1000));
        this.events.onRecoveryAlert?.('Sessão concluída durante a sua ausência.');
        this.emitTick(now);
        this.emitStateChange();
      }
    } else if (snapshot.state === 'paused') {
      // Cenário 3: paused -> permanece pausada sem limite de tempo
      this.state = 'paused';
      this.remainingMs = snapshot.remainingMs ?? this.targetDurationMs;
      this.emitTick(now);
      this.emitStateChange();
    } else {
      this.state = 'idle';
      this.resetDurationForCurrentMode();
      this.emitTick(now);
      this.emitStateChange();
    }
  }

  // --- Métodos Internos ---

  private recordSession(
    endedAt: number,
    status: 'completed' | 'interrupted' | 'cancelled',
    customDurationSec?: number
  ): void {
    if (!this.currentSessionId) return;

    // Idempotência garantida: processar término duas vezes não cria dois registros
    if (this.processedSessionIds.has(this.currentSessionId)) {
      return;
    }
    this.processedSessionIds.add(this.currentSessionId);

    const actualDurationSec =
      customDurationSec !== undefined
        ? customDurationSec
        : Math.round((endedAt - this.startedAt) / 1000);

    const sessionRecord: SessionRecord = {
      id: this.currentSessionId,
      mode: this.mode,
      startedAt: this.startedAt,
      endedAt: endedAt,
      targetDurationSec: Math.round(this.targetDurationMs / 1000),
      actualDurationSec: Math.max(0, actualDurationSec),
      status: status,
      taskId: this.taskId,
      taskName: this.taskName,
      cycleIndex: this.cycleCount,
    };

    this.events.onSessionFinished?.(sessionRecord);
  }

  private resetDurationForCurrentMode(): void {
    this.targetDurationMs = this.getDurationForMode(this.mode);
    this.remainingMs = this.targetDurationMs;
  }

  private getDurationForMode(mode: SessionMode): number {
    switch (mode) {
      case 'focus':
        return this.config.focusDurationMin * 60 * 1000;
      case 'shortBreak':
        return this.config.shortBreakDurationMin * 60 * 1000;
      case 'longBreak':
        return this.config.longBreakDurationMin * 60 * 1000;
    }
  }

  private startTicker(): void {
    this.stopTicker();
    this.intervalTimerId = setInterval(() => {
      const now = Date.now();
      if (now >= this.endsAt) {
        this.finish(this.endsAt);
      } else {
        this.emitTick(now);
      }
    }, 250);
  }

  public stopTicker(): void {
    if (this.intervalTimerId !== null) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
  }

  private emitTick(now: number = Date.now()): void {
    const remaining = this.getRemainingMs(now);
    const progress = this.getProgressPercent(now);
    this.events.onTick?.(remaining, progress);
  }

  private emitStateChange(): void {
    this.events.onStateChange?.(this.state, this.getSnapshot());
  }

  private handleInvalidTransition(message: string): void {
    const isDev =
      typeof globalThis !== 'undefined' &&
      'process' in globalThis &&
      (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.NODE_ENV !== 'production';
    if (isDev) {
      console.error(`[TimerEngine] ${message}`);
    }
  }
}
