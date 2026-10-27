import { describe, it, expect } from 'vitest';
import { TimerEngine, type TimerSnapshot } from '../src/domain/timerEngine';
import { getStorage } from '../src/services/storage';
import { SETTINGS_DEFAULTS } from '../src/config/defaults';

describe('ETAPA 3 - Timer Experience & Persistence', () => {
  it('permite overrideStatus explícito ao interromper com reset ou skip', () => {
    let recordedStatus = '';
    const engine = new TimerEngine(
      {
        focusDurationMin: 25,
        shortBreakDurationMin: 5,
        longBreakDurationMin: 15,
        longBreakInterval: 4,
      },
      {
        onSessionFinished: (session) => {
          recordedStatus = session.status;
        },
      }
    );

    const now = 1000000;
    engine.start(now);

    // Reinicia com override explícito 'interrupted'
    engine.reset(now + 10000, 'interrupted');
    expect(recordedStatus).toBe('interrupted');
    expect(engine.getState()).toBe('idle');

    // Inicia nova sessão e pula com override 'cancelled'
    engine.start(now + 20000);
    engine.skip(now + 25000, 'cancelled');
    expect(recordedStatus).toBe('cancelled');
    expect(engine.getState()).toBe('idle');
  });

  it('armazena e recupera TimerSnapshot no armazenamento com persistência', async () => {
    const storage = await getStorage();
    const testSnapshot: TimerSnapshot = {
      id: 'snap-123',
      mode: 'focus',
      state: 'running',
      startedAt: Date.now(),
      targetDurationMs: 1500 * 1000,
      endsAt: Date.now() + 1500 * 1000,
      remainingMs: 1500 * 1000,
      taskName: 'Estudo de Anatomia',
      cycleCount: 2,
    };

    await storage.saveTimerSnapshot(testSnapshot);
    const retrieved = await storage.getTimerSnapshot();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('snap-123');
    expect(retrieved?.taskName).toBe('Estudo de Anatomia');
    expect(retrieved?.state).toBe('running');

    // Limpeza
    await storage.saveTimerSnapshot(null);
    const cleaned = await storage.getTimerSnapshot();
    expect(cleaned).toBeNull();
  });

  it('possui volume de áudio padrão e suporte a wake lock nas configurações', () => {
    expect(SETTINGS_DEFAULTS.soundVolume).toBe(70);
    expect(SETTINGS_DEFAULTS.wakeLockEnabled).toBe(true);
    expect(SETTINGS_DEFAULTS.focusDurationMin).toBe(25);
    expect(SETTINGS_DEFAULTS.shortBreakDurationMin).toBe(5);
    expect(SETTINGS_DEFAULTS.longBreakDurationMin).toBe(15);
    expect(SETTINGS_DEFAULTS.longBreakInterval).toBe(4);
  });
});
