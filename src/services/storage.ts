import { openDB, type IDBPDatabase } from 'idb';
import type { Task, SessionRecord } from '../domain/types';
import type { TimerSnapshot } from '../domain/timerEngine';
import { SETTINGS_DEFAULTS, type SettingsData } from '../config/defaults';

const DB_NAME = 'focus_db';
const DB_VERSION = 1;

export interface AppStorage {
  isInMemoryFallback: boolean;
  init(): Promise<void>;
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  getSessions(): Promise<SessionRecord[]>;
  saveSession(session: SessionRecord): Promise<void>;
  getSettings(): Promise<SettingsData>;
  saveSettings(settings: SettingsData): Promise<void>;
  getTimerSnapshot(): Promise<TimerSnapshot | null>;
  saveTimerSnapshot(snapshot: TimerSnapshot | null): Promise<void>;
  clearAll(): Promise<void>;
}

class InMemoryStorage implements AppStorage {
  public isInMemoryFallback = true;
  private tasks: Map<string, Task> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private settings: SettingsData = { ...SETTINGS_DEFAULTS };
  private timerSnapshot: TimerSnapshot | null = null;

  public async init(): Promise<void> {}

  public async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => a.order - b.order);
  }

  public async saveTask(task: Task): Promise<void> {
    this.tasks.set(task.id, { ...task });
  }

  public async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  public async getSessions(): Promise<SessionRecord[]> {
    return Array.from(this.sessions.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  public async saveSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  public async getSettings(): Promise<SettingsData> {
    return { ...this.settings };
  }

  public async saveSettings(settings: SettingsData): Promise<void> {
    this.settings = { ...settings };
  }

  public async getTimerSnapshot(): Promise<TimerSnapshot | null> {
    return this.timerSnapshot ? { ...this.timerSnapshot } : null;
  }

  public async saveTimerSnapshot(snapshot: TimerSnapshot | null): Promise<void> {
    this.timerSnapshot = snapshot ? { ...snapshot } : null;
  }

  public async clearAll(): Promise<void> {
    this.tasks.clear();
    this.sessions.clear();
    this.settings = { ...SETTINGS_DEFAULTS };
    this.timerSnapshot = null;
  }
}

class IndexedDBStorage implements AppStorage {
  public isInMemoryFallback = false;
  private db: IDBPDatabase | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store de Tarefas
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by_order', 'order');
        }

        // Store de Sessões
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by_startedAt', 'startedAt');
          sessionStore.createIndex('by_taskId', 'taskId');
        }

        // Store de Configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }

  public async getTasks(): Promise<Task[]> {
    await this.ensureReady();
    const tasks = await this.db!.getAll('tasks');
    return tasks.sort((a: Task, b: Task) => a.order - b.order);
  }

  public async saveTask(task: Task): Promise<void> {
    await this.ensureReady();
    await this.db!.put('tasks', task);
  }

  public async deleteTask(id: string): Promise<void> {
    await this.ensureReady();
    await this.db!.delete('tasks', id);
  }

  public async getSessions(): Promise<SessionRecord[]> {
    await this.ensureReady();
    const sessions = await this.db!.getAll('sessions');
    return sessions.sort((a: SessionRecord, b: SessionRecord) => b.startedAt - a.startedAt);
  }

  public async saveSession(session: SessionRecord): Promise<void> {
    await this.ensureReady();
    await this.db!.put('sessions', session);
  }

  public async getSettings(): Promise<SettingsData> {
    await this.ensureReady();
    const saved = await this.db!.get('settings', 'user_settings');
    if (!saved) {
      return { ...SETTINGS_DEFAULTS };
    }
    return { ...SETTINGS_DEFAULTS, ...saved };
  }

  public async saveSettings(settings: SettingsData): Promise<void> {
    await this.ensureReady();
    await this.db!.put('settings', settings, 'user_settings');
  }

  public async getTimerSnapshot(): Promise<TimerSnapshot | null> {
    await this.ensureReady();
    const saved = await this.db!.get('settings', 'timer_snapshot');
    return saved || null;
  }

  public async saveTimerSnapshot(snapshot: TimerSnapshot | null): Promise<void> {
    await this.ensureReady();
    if (snapshot === null) {
      await this.db!.delete('settings', 'timer_snapshot');
    } else {
      await this.db!.put('settings', snapshot, 'timer_snapshot');
    }
  }

  public async clearAll(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(['tasks', 'sessions', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('tasks').clear(),
      tx.objectStore('sessions').clear(),
      tx.objectStore('settings').clear(),
      tx.done,
    ]);
  }

  private async ensureReady(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

// Fábrica resiliente de armazenamento: cria IndexedDB com fallback automático para InMemory
let currentStorage: AppStorage | null = null;
let storageErrorListeners: Array<(errorMsg: string) => void> = [];

export function onStorageError(listener: (errorMsg: string) => void): () => void {
  storageErrorListeners.push(listener);
  return () => {
    storageErrorListeners = storageErrorListeners.filter((l) => l !== listener);
  };
}

function notifyStorageError(msg: string) {
  for (const listener of storageErrorListeners) {
    listener(msg);
  }
}

export async function getStorage(): Promise<AppStorage> {
  if (currentStorage) {
    return currentStorage;
  }

  // Verifica se IndexedDB existe no ambiente
  if (typeof indexedDB === 'undefined') {
    currentStorage = new InMemoryStorage();
    notifyStorageError('IndexedDB indisponível no navegador. Os dados funcionarão apenas em memória temporária.');
    return currentStorage;
  }

  try {
    const idbStorage = new IndexedDBStorage();
    await idbStorage.init();
    currentStorage = idbStorage;
    return currentStorage;
  } catch (error) {
    console.error('Falha ao abrir IndexedDB, operando em memória temporária:', error);
    currentStorage = new InMemoryStorage();
    notifyStorageError('Falha ao acessar armazenamento local. Operando temporariamente em memória.');
    return currentStorage;
  }
}
