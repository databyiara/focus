import { useState, useEffect, useCallback } from 'react';
import { SETTINGS_DEFAULTS, type SettingsData } from '../config/defaults';
import { settingsService } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData>(SETTINGS_DEFAULTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await settingsService.get();
      setSettings(loaded);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<SettingsData>): Promise<void> => {
    const merged: SettingsData = { ...settings, ...newSettings };
    await settingsService.save(merged);
    setSettings(merged);
  }, [settings]);

  const resetSettings = useCallback(async (): Promise<void> => {
    const resetted = await settingsService.reset();
    setSettings(resetted);
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    refreshSettings,
  };
}
