import { describe, it, expect, beforeEach } from 'vitest';
import { backupService, type BackupPayload } from '../src/services/backupService';
import { taskService } from '../src/services/taskService';
import { sessionService } from '../src/services/sessionService';
import { settingsService } from '../src/services/settingsService';
import { getStorage } from '../src/services/storage';

describe('BackupService (Etapa 5)', () => {
  beforeEach(async () => {
    const storage = await getStorage();
    await storage.clearAll();
  });

  it('deve exportar payload válido com schemaVersion 1 e appName FOCUS', async () => {
    await taskService.create('Tarefa de Backup', 3);
    const jsonStr = await backupService.exportData();
    const parsed = JSON.parse(jsonStr) as BackupPayload;

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.appName).toBe('FOCUS');
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].title).toBe('Tarefa de Backup');
    expect(parsed.settings).toBeDefined();
    expect(parsed.sessions).toBeDefined();
  });

  it('deve validar corretamente o payload de backup', () => {
    const validPayload: BackupPayload = {
      schemaVersion: 1,
      appName: 'FOCUS',
      exportedAt: new Date().toISOString(),
      tasks: [],
      sessions: [],
      settings: {
        focusDurationMin: 25,
        shortBreakDurationMin: 5,
        longBreakDurationMin: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartFocus: false,
        soundEnabled: true,
        notificationsEnabled: false,
        dailyGoalMin: 240,
      },
    };

    expect(backupService.validatePayload(validPayload)).toBe(true);
    expect(backupService.validatePayload({ schemaVersion: 2 })).toBe(false);
    expect(backupService.validatePayload({ schemaVersion: 1, appName: 'OTHER' })).toBe(false);
    expect(backupService.validatePayload(null)).toBe(false);
    expect(backupService.validatePayload('string')).toBe(false);
  });

  it('deve importar dados e substituir tarefas, histórico e configurações', async () => {
    const payload: BackupPayload = {
      schemaVersion: 1,
      appName: 'FOCUS',
      exportedAt: new Date().toISOString(),
      tasks: [
        {
          id: 'imported-task-1',
          title: 'Tarefa Importada',
          completedPomodoros: 2,
          isCompleted: false,
          order: 1,
          createdAt: 1000,
        },
      ],
      sessions: [
        {
          id: 'imported-session-1',
          mode: 'focus',
          startedAt: 1000,
          endedAt: 2500,
          targetDurationSec: 1500,
          actualDurationSec: 1500,
          status: 'completed',
          cycleIndex: 1,
        },
      ],
      settings: {
        focusDurationMin: 50,
        shortBreakDurationMin: 10,
        longBreakDurationMin: 20,
        longBreakInterval: 6,
        autoStartBreaks: true,
        autoStartFocus: true,
        soundEnabled: false,
        notificationsEnabled: false,
        dailyGoalMin: 360,
      },
    };

    const res = await backupService.importData(JSON.stringify(payload));
    expect(res.success).toBe(true);

    const tasks = await taskService.getAll();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('imported-task-1');

    const sessions = await sessionService.getAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('imported-session-1');

    const settings = await settingsService.get();
    expect(settings.focusDurationMin).toBe(50);
    expect(settings.autoStartBreaks).toBe(true);
  });
});
