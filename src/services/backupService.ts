import { getStorage } from './storage';
import { taskService } from './taskService';
import { sessionService } from './sessionService';
import { settingsService } from './settingsService';
import type { Task, SessionRecord } from '../domain/types';
import type { SettingsData } from '../config/defaults';

export interface BackupPayload {
  schemaVersion: 1;
  appName: 'FOCUS';
  exportedAt: string;
  tasks: Task[];
  sessions: SessionRecord[];
  settings: SettingsData;
}

export const backupService = {
  async exportData(): Promise<string> {
    const tasks = await taskService.getAll();
    const sessions = await sessionService.getAll();
    const settings = await settingsService.get();

    const payload: BackupPayload = {
      schemaVersion: 1,
      appName: 'FOCUS',
      exportedAt: new Date().toISOString(),
      tasks,
      sessions,
      settings,
    };

    return JSON.stringify(payload, null, 2);
  },

  downloadBackupFile(jsonString: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  validatePayload(parsed: unknown): parsed is BackupPayload {
    if (!parsed || typeof parsed !== 'object') return false;
    const candidate = parsed as Partial<BackupPayload>;
    if (candidate.schemaVersion !== 1) return false;
    if (candidate.appName !== 'FOCUS') return false;
    if (!Array.isArray(candidate.tasks)) return false;
    if (!Array.isArray(candidate.sessions)) return false;
    if (!candidate.settings || typeof candidate.settings !== 'object') return false;
    return true;
  },

  async importData(jsonString: string): Promise<{ success: boolean; message: string }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { success: false, message: 'Arquivo JSON inválido ou corrompido.' };
    }

    if (!this.validatePayload(parsed)) {
      return { success: false, message: 'O arquivo não corresponde ao formato de backup compatível com FOCUS (schema v1).' };
    }

    try {
      const storage = await getStorage();
      await storage.clearAll();

      for (const task of parsed.tasks) {
        await storage.saveTask(task);
      }
      for (const session of parsed.sessions) {
        await storage.saveSession(session);
      }
      await storage.saveSettings(parsed.settings);

      return { success: true, message: 'Dados importados com sucesso.' };
    } catch (err) {
      console.error('Erro na importação:', err);
      return { success: false, message: 'Falha técnica ao gravar os dados importados.' };
    }
  },
};
