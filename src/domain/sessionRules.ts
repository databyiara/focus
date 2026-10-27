import type { SessionMode, SessionRecord, SessionStatus } from './types';

export const MIN_DURATION_FOR_INTERRUPTED_SEC = 60;

/**
 * Determina o status de uma sessão encerrada antes do término previsto.
 * - Concluída: chegou ao fim previsto.
 * - Interrompida: foco encerrado antes do fim com 60 segundos ou mais de tempo efetivo.
 * - Cancelada: foco encerrado com menos de 60 segundos de tempo efetivo.
 */
export function determineEarlyExitStatus(actualDurationSec: number): SessionStatus {
  if (actualDurationSec >= MIN_DURATION_FOR_INTERRUPTED_SEC) {
    return 'interrupted';
  }
  return 'cancelled';
}

/**
 * Retorna se a sessão deve ser contabilizada nas estatísticas de foco.
 * Sessões de foco concluídas ou interrompidas (≥ 60s) contam.
 * Canceladas (< 60s) e pausas nunca contam.
 */
export function countsTowardsFocusStats(session: Pick<SessionRecord, 'mode' | 'status'>): boolean {
  if (session.mode !== 'focus') {
    return false;
  }
  return session.status === 'completed' || session.status === 'interrupted';
}

/**
 * Retorna se a sessão conta como um Pomodoro concluído.
 * Apenas sessões de foco concluídas contam.
 */
export function countsAsCompletedPomodoro(session: Pick<SessionRecord, 'mode' | 'status'>): boolean {
  return session.mode === 'focus' && session.status === 'completed';
}

/**
 * Retorna a chave de data local no formato YYYY-MM-DD.
 * Uma sessão pertence ao dia da sua hora de início (data local do dispositivo),
 * mesmo que cruze a meia-noite.
 */
export function getSessionLocalDateKey(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CycleNextState {
  nextMode: SessionMode;
  nextCycleCount: number;
}

/**
 * Calcula o próximo modo e a contagem de ciclo após a finalização de uma sessão.
 * Regras:
 * - O contador do ciclo só avança quando um foco é CONCLUÍDO.
 * - Zera após uma pausa longa (reiniciando em 1 no próximo foco).
 * - Pausa longa a cada X focos concluídos (padrão 4).
 */
export function getNextCycleState(
  currentMode: SessionMode,
  currentCycleCount: number,
  longBreakInterval: number,
  wasCompleted: boolean = true
): CycleNextState {
  if (currentMode === 'focus') {
    const nextMode = currentCycleCount >= longBreakInterval ? 'longBreak' : 'shortBreak';
    return {
      nextMode,
      nextCycleCount: currentCycleCount,
    };
  }

  if (currentMode === 'shortBreak') {
    return {
      nextMode: 'focus',
      nextCycleCount: wasCompleted ? currentCycleCount + 1 : currentCycleCount,
    };
  }

  // Se terminou longBreak, zera e reinicia no ciclo 1
  return {
    nextMode: 'focus',
    nextCycleCount: 1,
  };
}
