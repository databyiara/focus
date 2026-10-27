export type QuotesFrequency = 'always' | 'start_and_end' | 'never';

export interface SettingsData {
  focusDurationMin: number; // 1 - 180 min
  shortBreakDurationMin: number; // 1 - 60 min
  longBreakDurationMin: number; // 1 - 120 min
  longBreakInterval: number; // 2 - 12 focos
  autoStartBreaks: boolean; // default false
  autoStartFocus: boolean; // default false
  soundEnabled: boolean; // default true
  soundVolume: number; // 0 - 100% (default 70)
  wakeLockEnabled: boolean; // default true (impede que a tela apague no foco)
  notificationsEnabled: boolean; // default false
  dailyGoalMin: number; // 15 - 960 min (16h)
  dailyGoalUnit?: 'cycles' | 'minutes'; // unidade de preferência para configurar a meta
  userName: string; // nome personalizado para saudações
  hasCompletedOnboarding: boolean; // true após definir nome ou pular
  motivationalQuotesEnabled: boolean; // default true
  quotesFrequency: QuotesFrequency; // 'always' | 'start_and_end' | 'never'
}

export const SETTINGS_DEFAULTS: SettingsData = {
  focusDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 70,
  wakeLockEnabled: true,
  notificationsEnabled: false,
  dailyGoalMin: 240, // 4 horas
  dailyGoalUnit: 'cycles',
  userName: '',
  hasCompletedOnboarding: false,
  motivationalQuotesEnabled: true,
  quotesFrequency: 'always',
};

export const SETTINGS_LIMITS = {
  focusDurationMin: { min: 1, max: 180 },
  shortBreakDurationMin: { min: 1, max: 60 },
  longBreakDurationMin: { min: 1, max: 120 },
  longBreakInterval: { min: 2, max: 12 },
  dailyGoalMin: { min: 15, max: 960 },
} as const;
