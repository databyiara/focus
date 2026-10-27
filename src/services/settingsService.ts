import { getStorage } from './storage';
import { SETTINGS_DEFAULTS, type SettingsData } from '../config/defaults';

export const settingsService = {
  async get(): Promise<SettingsData> {
    const storage = await getStorage();
    return storage.getSettings();
  },

  async save(settings: SettingsData): Promise<void> {
    const storage = await getStorage();
    await storage.saveSettings(settings);
  },

  async reset(): Promise<SettingsData> {
    const storage = await getStorage();
    await storage.saveSettings(SETTINGS_DEFAULTS);
    return { ...SETTINGS_DEFAULTS };
  },
};
