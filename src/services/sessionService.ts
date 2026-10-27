import { getStorage } from './storage';
import type { SessionRecord } from '../domain/types';
import { getSessionLocalDateKey } from '../domain/sessionRules';

export const sessionService = {
  async getAll(): Promise<SessionRecord[]> {
    const storage = await getStorage();
    return storage.getSessions();
  },

  async save(session: SessionRecord): Promise<void> {
    const storage = await getStorage();
    await storage.saveSession(session);
  },

  async getByDate(dateKey: string): Promise<SessionRecord[]> {
    const storage = await getStorage();
    const all = await storage.getSessions();
    return all.filter((s) => getSessionLocalDateKey(s.startedAt) === dateKey);
  },
};
