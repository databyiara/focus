export type SessionMode = 'focus' | 'shortBreak' | 'longBreak';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export type SessionStatus = 'completed' | 'interrupted' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros?: number;
  completedPomodoros: number;
  isCompleted: boolean;
  order: number;
  createdAt: number;
  note?: string; // observação curta opcional
  isToday?: boolean; // exibição na lista "Hoje"
}

export interface SessionRecord {
  id: string;
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  targetDurationSec: number;
  actualDurationSec: number;
  status: SessionStatus;
  taskId?: string;
  taskName?: string;
  cycleIndex: number;
}
