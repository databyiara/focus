import React, { useState, useRef } from 'react';
import { Download, Upload, Volume2 } from 'lucide-react';
import type { SettingsData } from '../../config/defaults';
import { SETTINGS_LIMITS } from '../../config/defaults';
import { notificationService } from '../../services/notificationService';
import { soundService } from '../../services/soundService';
import { backupService } from '../../services/backupService';
import { PHRASE_CATEGORIES_INFO } from '../../data/phrases';
import styles from './Settings.module.css';

interface SettingsProps {
  settings: SettingsData;
  isSessionRunning: boolean;
  onUpdateSettings: (newSettings: Partial<SettingsData>) => void;
  onImportSuccess?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  isSessionRunning,
  onUpdateSettings,
  onImportSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const permission = notificationService.getPermission();
  const isNotificationDenied = permission === 'denied';

  const handleDurationChange = (field: keyof SettingsData, rawVal: string) => {
    setErrorMessage(null);
    const val = parseInt(rawVal, 10);
    if (Number.isNaN(val)) return;

    if (field === 'focusDurationMin') {
      if (val < SETTINGS_LIMITS.focusDurationMin.min || val > SETTINGS_LIMITS.focusDurationMin.max) {
        setErrorMessage(`Duração de foco deve estar entre ${SETTINGS_LIMITS.focusDurationMin.min} e ${SETTINGS_LIMITS.focusDurationMin.max} minutos.`);
        return;
      }
    } else if (field === 'shortBreakDurationMin') {
      if (val < SETTINGS_LIMITS.shortBreakDurationMin.min || val > SETTINGS_LIMITS.shortBreakDurationMin.max) {
        setErrorMessage(`Pausa curta deve estar entre ${SETTINGS_LIMITS.shortBreakDurationMin.min} e ${SETTINGS_LIMITS.shortBreakDurationMin.max} minutos.`);
        return;
      }
    } else if (field === 'longBreakDurationMin') {
      if (val < SETTINGS_LIMITS.longBreakDurationMin.min || val > SETTINGS_LIMITS.longBreakDurationMin.max) {
        setErrorMessage(`Pausa longa deve estar entre ${SETTINGS_LIMITS.longBreakDurationMin.min} e ${SETTINGS_LIMITS.longBreakDurationMin.max} minutos.`);
        return;
      }
    } else if (field === 'longBreakInterval') {
      if (val < SETTINGS_LIMITS.longBreakInterval.min || val > SETTINGS_LIMITS.longBreakInterval.max) {
        setErrorMessage(`Intervalo do ciclo deve estar entre ${SETTINGS_LIMITS.longBreakInterval.min} e ${SETTINGS_LIMITS.longBreakInterval.max} focos.`);
        return;
      }
    } else if (field === 'dailyGoalMin') {
      if (val < SETTINGS_LIMITS.dailyGoalMin.min || val > SETTINGS_LIMITS.dailyGoalMin.max) {
        setErrorMessage(`Meta diária deve estar entre 15 minutos e 16 horas (960 min).`);
        return;
      }
    }

    onUpdateSettings({ [field]: val });
  };

  const handleToggleNotifications = async () => {
    if (isNotificationDenied) return;

    if (!settings.notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        onUpdateSettings({ notificationsEnabled: true });
      } else {
        onUpdateSettings({ notificationsEnabled: false });
      }
    } else {
      onUpdateSettings({ notificationsEnabled: false });
    }
  };

  const handleExport = async () => {
    const json = await backupService.exportData();
    backupService.downloadBackupFile(json);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'Tem certeza de que deseja importar este arquivo? Todos os dados atuais (tarefas, histórico e configurações) serão substituídos.'
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await backupService.importData(content);
      if (res.success) {
        setImportStatus('Dados restaurados com sucesso.');
        onImportSuccess?.();
      } else {
        setErrorMessage(res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className={styles.container} aria-label="Painel de Configurações">
      <div>
        <h1 className={styles.title}>Configurações</h1>
      </div>

      {/* Alerta de erro objetivo */}
      {errorMessage && (
        <aside className={styles.errorBox} role="alert">
          <span className={styles.errorTag}>Erro:</span>
          <span>{errorMessage}</span>
        </aside>
      )}

      {/* Aviso de sessão em curso */}
      {isSessionRunning && (
        <aside className={styles.noticeBox} role="status">
          Aviso: Há uma sessão em andamento. Novas durações serão aplicadas a partir da próxima sessão.
        </aside>
      )}

      {/* 0. Perfil e Saudação */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Perfil e Saudação</span>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="userNameInput">
            Como devemos te chamar?
          </label>
          <input
            id="userNameInput"
            type="text"
            maxLength={40}
            className={styles.inputText}
            value={settings.userName || ''}
            onChange={(e) => onUpdateSettings({ userName: e.target.value })}
            placeholder="Seu nome ou apelido (opcional)"
          />
          <span className={styles.fieldLimit}>
            Personaliza a saudação no topo do modo Foco (ex: "Bom dia, {settings.userName || '...'}")
          </span>
        </div>
      </div>

      {/* 1. Durações & Ciclo */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Durações e Ciclo</span>

        <div className={styles.durationsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="focusDuration">Foco (min)</label>
            <input
              id="focusDuration"
              type="number"
              className={styles.inputNumber}
              min={SETTINGS_LIMITS.focusDurationMin.min}
              max={SETTINGS_LIMITS.focusDurationMin.max}
              value={settings.focusDurationMin}
              onChange={(e) => handleDurationChange('focusDurationMin', e.target.value)}
            />
            <span className={styles.fieldLimit}>1–180 min</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="shortBreakDuration">Pausa curta (min)</label>
            <input
              id="shortBreakDuration"
              type="number"
              className={styles.inputNumber}
              min={SETTINGS_LIMITS.shortBreakDurationMin.min}
              max={SETTINGS_LIMITS.shortBreakDurationMin.max}
              value={settings.shortBreakDurationMin}
              onChange={(e) => handleDurationChange('shortBreakDurationMin', e.target.value)}
            />
            <span className={styles.fieldLimit}>1–60 min</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="longBreakDuration">Pausa longa (min)</label>
            <input
              id="longBreakDuration"
              type="number"
              className={styles.inputNumber}
              min={SETTINGS_LIMITS.longBreakDurationMin.min}
              max={SETTINGS_LIMITS.longBreakDurationMin.max}
              value={settings.longBreakDurationMin}
              onChange={(e) => handleDurationChange('longBreakDurationMin', e.target.value)}
            />
            <span className={styles.fieldLimit}>1–120 min</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="longBreakInterval">Ciclo (focos)</label>
            <input
              id="longBreakInterval"
              type="number"
              className={styles.inputNumber}
              min={SETTINGS_LIMITS.longBreakInterval.min}
              max={SETTINGS_LIMITS.longBreakInterval.max}
              value={settings.longBreakInterval}
              onChange={(e) => handleDurationChange('longBreakInterval', e.target.value)}
            />
            <span className={styles.fieldLimit}>2–12 focos</span>
          </div>
        </div>
      </div>

      {/* 2. Autoinício */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Autoinício</span>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Iniciar pausas automaticamente</span>
            <span className={styles.toggleDescription}>Inicia a pausa curta ou longa assim que o foco terminar</span>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${settings.autoStartBreaks ? styles.toggleButtonActive : ''}`}
            onClick={() => onUpdateSettings({ autoStartBreaks: !settings.autoStartBreaks })}
            aria-pressed={settings.autoStartBreaks}
          >
            {settings.autoStartBreaks ? 'SIM' : 'NÃO'}
          </button>
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Iniciar próximo foco automaticamente</span>
            <span className={styles.toggleDescription}>Inicia o próximo foco assim que a pausa terminar</span>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${settings.autoStartFocus ? styles.toggleButtonActive : ''}`}
            onClick={() => onUpdateSettings({ autoStartFocus: !settings.autoStartFocus })}
            aria-pressed={settings.autoStartFocus}
          >
            {settings.autoStartFocus ? 'SIM' : 'NÃO'}
          </button>
        </div>
      </div>

      {/* 3. Sons e Alertas */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Áudio e Notificações</span>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Alerta sonoro ao término</span>
            <span className={styles.toggleDescription}>Sinal sonoro suave com Web Audio ao completar uma sessão</span>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${settings.soundEnabled ? styles.toggleButtonActive : ''}`}
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            aria-pressed={settings.soundEnabled}
          >
            {settings.soundEnabled ? 'SIM' : 'NÃO'}
          </button>
        </div>

        {settings.soundEnabled && (
          <div className={styles.field} style={{ marginTop: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.fieldLabel} htmlFor="soundVolumeSlider">
                Volume do som: {settings.soundVolume}%
              </label>
              <button
                type="button"
                className={styles.secondaryAction}
                style={{ padding: '4px 10px', height: '32px', fontSize: '12px' }}
                onClick={() => soundService.playTestSound(settings.soundVolume)}
                title="Ouvir som de teste"
              >
                <Volume2 size={14} />
                <span>Testar som</span>
              </button>
            </div>
            <input
              id="soundVolumeSlider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.soundVolume}
              onChange={(e) => onUpdateSettings({ soundVolume: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--white)', marginTop: '4px' }}
              aria-label="Volume do alerta sonoro"
            />
            <span className={styles.fieldLimit}>
              {settings.soundVolume === 0 ? 'Som no modo silencioso' : 'Volume ajustável para maior conforto'}
            </span>
          </div>
        )}

        <div className={styles.toggleRow} style={{ marginTop: 'var(--space-12)' }}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Notificações do navegador</span>
            <span className={styles.toggleDescription}>
              {isNotificationDenied
                ? 'Permissão negada no navegador. Habilite nas configurações do navegador para ativar.'
                : 'Aviso visual no sistema operacional ao término de cada ciclo'}
            </span>
          </div>
          <button
            type="button"
            disabled={isNotificationDenied}
            className={`${styles.toggleButton} ${settings.notificationsEnabled ? styles.toggleButtonActive : ''} ${isNotificationDenied ? styles.toggleButtonDisabled : ''}`}
            onClick={handleToggleNotifications}
            aria-pressed={settings.notificationsEnabled}
          >
            {settings.notificationsEnabled ? 'SIM' : 'NÃO'}
          </button>
        </div>
        <p className={styles.noticeBox}>
          Aviso: Navegadores exigem interação prévia para permissão de áudio e notificações. A contagem de tempo do motor permanece sempre exata.
        </p>
      </div>

      {/* Prevenção de Suspensão de Tela (Wake Lock) */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Tela e Energia</span>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Impedir que a tela apague no foco (Wake Lock)</span>
            <span className={styles.toggleDescription}>
              Mantém a tela ativa durante o ciclo de foco para não interromper sua visão do timer
            </span>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${settings.wakeLockEnabled ? styles.toggleButtonActive : ''}`}
            onClick={() => onUpdateSettings({ wakeLockEnabled: !settings.wakeLockEnabled })}
            aria-pressed={settings.wakeLockEnabled}
          >
            {settings.wakeLockEnabled ? 'SIM' : 'NÃO'}
          </button>
        </div>
      </div>

      {/* 4. Frases Motivacionais */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Frases Motivacionais</span>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabelGroup}>
            <span className={styles.toggleTitle}>Exibir frases motivacionais</span>
            <span className={styles.toggleDescription}>
              Frases acolhedoras e honestas baseadas no contexto de uso
            </span>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${settings.motivationalQuotesEnabled ? styles.toggleButtonActive : ''}`}
            onClick={() => {
              const nextEnabled = !settings.motivationalQuotesEnabled;
              onUpdateSettings({
                motivationalQuotesEnabled: nextEnabled,
                quotesFrequency: nextEnabled
                  ? settings.quotesFrequency === 'never'
                    ? 'always'
                    : settings.quotesFrequency
                  : 'never',
              });
            }}
            aria-pressed={settings.motivationalQuotesEnabled}
          >
            {settings.motivationalQuotesEnabled ? 'SIM' : 'NÃO'}
          </button>
        </div>

        {settings.motivationalQuotesEnabled && (
          <div className={styles.field} style={{ marginTop: 'var(--space-8)' }}>
            <label className={styles.fieldLabel}>Frequência de exibição</label>
            <div className={styles.frequencyGroup} role="radiogroup" aria-label="Frequência das frases">
              <button
                type="button"
                className={`${styles.frequencyButton} ${settings.quotesFrequency === 'always' ? styles.frequencyButtonActive : ''}`}
                onClick={() => onUpdateSettings({ quotesFrequency: 'always' })}
                role="radio"
                aria-checked={settings.quotesFrequency === 'always'}
              >
                Sempre
              </button>
              <button
                type="button"
                className={`${styles.frequencyButton} ${settings.quotesFrequency === 'start_and_end' ? styles.frequencyButtonActive : ''}`}
                onClick={() => onUpdateSettings({ quotesFrequency: 'start_and_end' })}
                role="radio"
                aria-checked={settings.quotesFrequency === 'start_and_end'}
              >
                Só no início e no fim
              </button>
              <button
                type="button"
                className={`${styles.frequencyButton} ${settings.quotesFrequency === 'never' ? styles.frequencyButtonActive : ''}`}
                onClick={() => onUpdateSettings({ motivationalQuotesEnabled: false, quotesFrequency: 'never' })}
                role="radio"
                aria-checked={settings.quotesFrequency === 'never'}
              >
                Nunca
              </button>
            </div>
            <span className={styles.fieldLimit}>
              {settings.quotesFrequency === 'start_and_end'
                ? 'Durante o foco nenhuma frase é exibida (foco sem distrações).'
                : settings.quotesFrequency === 'always'
                  ? 'Exibe frases em todos os momentos e faz rotações a cada ~8 min no foco.'
                  : 'Nenhuma frase motivacional será exibida.'}
            </span>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <span className={styles.fieldLimit}>
            Banco de frases: {PHRASE_CATEGORIES_INFO.reduce((acc, c) => acc + c.count, 0)} frases cadastradas em {PHRASE_CATEGORIES_INFO.length} categorias (mínimo de 12 por categoria).
          </span>
        </div>
      </div>

      {/* 5. Meta Diária */}
      <div className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span className={styles.sectionTitle}>Meta Diária</span>

          {/* Alternador de unidade: Ciclos vs Minutos */}
          <div className={styles.unitToggleGroup} role="radiogroup" aria-label="Unidade da meta diária">
            <button
              type="button"
              className={`${styles.unitToggleButton} ${settings.dailyGoalUnit !== 'minutes' ? styles.unitToggleButtonActive : ''}`}
              onClick={() => onUpdateSettings({ dailyGoalUnit: 'cycles' })}
              role="radio"
              aria-checked={settings.dailyGoalUnit !== 'minutes'}
            >
              Ciclos
            </button>
            <button
              type="button"
              className={`${styles.unitToggleButton} ${settings.dailyGoalUnit === 'minutes' ? styles.unitToggleButtonActive : ''}`}
              onClick={() => onUpdateSettings({ dailyGoalUnit: 'minutes' })}
              role="radio"
              aria-checked={settings.dailyGoalUnit === 'minutes'}
            >
              Minutos
            </button>
          </div>
        </div>

        {settings.dailyGoalUnit !== 'minutes' ? (
          <div>
            <div className={styles.goalRow}>
              <div className={styles.shortcutGroup} role="group" aria-label="Atalhos de ciclos diários">
                {[4, 6, 8, 10].map((cycleCount) => (
                  <button
                    key={cycleCount}
                    type="button"
                    className={`${styles.shortcutButton} ${
                      Math.round(settings.dailyGoalMin / settings.focusDurationMin) === cycleCount
                        ? styles.shortcutButtonActive
                        : ''
                    }`}
                    onClick={() =>
                      onUpdateSettings({ dailyGoalMin: cycleCount * settings.focusDurationMin })
                    }
                  >
                    {cycleCount} ciclos
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="32"
                  className={styles.inputNumber}
                  style={{ width: '80px' }}
                  value={Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin))}
                  onChange={(e) => {
                    const c = parseInt(e.target.value, 10);
                    if (!Number.isNaN(c) && c >= 1 && c <= 32) {
                      onUpdateSettings({ dailyGoalMin: c * settings.focusDurationMin });
                    }
                  }}
                  aria-label="Ciclos da meta diária"
                />
                <span style={{ color: 'var(--gray-text)', fontSize: '13px' }}>ciclos</span>
              </div>
            </div>
            <span className={styles.fieldLimit} style={{ marginTop: 'var(--space-6)', display: 'block' }}>
              {Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin))} ciclos de{' '}
              {settings.focusDurationMin} min ={' '}
              {Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin)) *
                settings.focusDurationMin}{' '}
              min (
              {Math.floor(
                (Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin)) *
                  settings.focusDurationMin) /
                  60
              )}
              h{' '}
              {(Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin)) *
                settings.focusDurationMin) %
                60}
              m de foco por dia)
            </span>
          </div>
        ) : (
          <div>
            <div className={styles.goalRow}>
              <div className={styles.shortcutGroup} role="group" aria-label="Atalhos de meta diária">
                <button
                  type="button"
                  className={`${styles.shortcutButton} ${settings.dailyGoalMin === 120 ? styles.shortcutButtonActive : ''}`}
                  onClick={() => onUpdateSettings({ dailyGoalMin: 120 })}
                >
                  2h
                </button>
                <button
                  type="button"
                  className={`${styles.shortcutButton} ${settings.dailyGoalMin === 240 ? styles.shortcutButtonActive : ''}`}
                  onClick={() => onUpdateSettings({ dailyGoalMin: 240 })}
                >
                  4h
                </button>
                <button
                  type="button"
                  className={`${styles.shortcutButton} ${settings.dailyGoalMin === 360 ? styles.shortcutButtonActive : ''}`}
                  onClick={() => onUpdateSettings({ dailyGoalMin: 360 })}
                >
                  6h
                </button>
                <button
                  type="button"
                  className={`${styles.shortcutButton} ${settings.dailyGoalMin === 480 ? styles.shortcutButtonActive : ''}`}
                  onClick={() => onUpdateSettings({ dailyGoalMin: 480 })}
                >
                  8h
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min={SETTINGS_LIMITS.dailyGoalMin.min}
                  max={SETTINGS_LIMITS.dailyGoalMin.max}
                  className={styles.inputNumber}
                  style={{ width: '90px' }}
                  value={settings.dailyGoalMin}
                  onChange={(e) => handleDurationChange('dailyGoalMin', e.target.value)}
                  aria-label="Minutos da meta diária"
                />
                <span style={{ color: 'var(--gray-text)', fontSize: '13px' }}>minutos</span>
              </div>
            </div>
            <span className={styles.fieldLimit} style={{ marginTop: 'var(--space-6)', display: 'block' }}>
              {settings.dailyGoalMin} minutos equivalem a cerca de{' '}
              {Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin))} ciclos de foco.
            </span>
          </div>
        )}
      </div>

      {/* 5. Exportar / Importar Dados */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Dados e Backup</span>

        {importStatus && (
          <aside className={styles.noticeBox} role="status">
            {importStatus}
          </aside>
        )}

        <div className={styles.actionButtonsRow}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={handleExport}
            aria-label="Exportar todos os dados em formato JSON"
          >
            <Download size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>Exportar Dados (JSON)</span>
          </button>

          <label className={styles.secondaryAction} htmlFor="import-file-input">
            <Upload size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>Importar Dados (JSON)</span>
            <input
              id="import-file-input"
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>

      {/* 6. Atalhos de Teclado */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Atalhos de Teclado</span>

        <table className={styles.shortcutsTable}>
          <tbody>
            <tr>
              <td><span className={styles.shortcutKey}>Espaço</span></td>
              <td className={styles.shortcutDesc}>Iniciar / Pausar / Continuar</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>R</span></td>
              <td className={styles.shortcutDesc}>Reiniciar sessão atual</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>S</span></td>
              <td className={styles.shortcutDesc}>Pular para a próxima etapa</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>1</span></td>
              <td className={styles.shortcutDesc}>Selecionar Modo Foco</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>2</span></td>
              <td className={styles.shortcutDesc}>Selecionar Modo Pausa Curta</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>3</span></td>
              <td className={styles.shortcutDesc}>Selecionar Modo Pausa Longa</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>F</span></td>
              <td className={styles.shortcutDesc}>Alternar Modo Zen (tela cheia)</td>
            </tr>
            <tr>
              <td><span className={styles.shortcutKey}>Esc</span></td>
              <td className={styles.shortcutDesc}>Sair do Modo Zen</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
