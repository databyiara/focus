import { useState, useEffect, useCallback, useMemo } from 'react';
import { Minimize2 } from 'lucide-react';
import { Sidebar, type NavTab } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { Greeting } from './components/Greeting/Greeting';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { SessionSelector } from './components/SessionSelector/SessionSelector';
import { MotivationalQuote } from './components/MotivationalQuote/MotivationalQuote';
import { Timer } from './components/Timer/Timer';
import { TimerControls } from './components/TimerControls/TimerControls';
import { DailySummary } from './components/DailySummary/DailySummary';
import { SessionIntention } from './components/SessionIntention/SessionIntention';
import { EarlyExitModal } from './components/EarlyExitModal/EarlyExitModal';
import { TaskList } from './components/TaskList/TaskList';
import { SessionHistory } from './components/SessionHistory/SessionHistory';
import { Statistics } from './components/Statistics/Statistics';
import { Settings } from './components/Settings/Settings';
import { useTimer } from './hooks/useTimer';
import { useTasks } from './hooks/useTasks';
import { useSessions } from './hooks/useSessions';
import { useSettings } from './hooks/useSettings';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDynamicFaviconAndTitle } from './hooks/useDynamicFaviconAndTitle';
import { onStorageError } from './services/storage';
import { soundService } from './services/soundService';
import { notificationService } from './services/notificationService';
import { wakeLockService } from './services/wakeLockService';
import type { SessionRecord } from './domain/types';
import styles from './App.module.css';

function formatDailyFocusTime(totalSec: number): string {
  if (totalSec <= 0) return '00:00';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes} min`;
}

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('pomodoro');
  const [storageAlert, setStorageAlert] = useState<string | null>(null);
  const [sessionIntention, setSessionIntention] = useState<string>('');
  const [earlyExitAction, setEarlyExitAction] = useState<'skip' | 'reset' | null>(null);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Módulos de dados persistidos via IndexedDB
  const {
    tasks,
    filteredTasks,
    selectedTask,
    selectedTaskId,
    currentTab,
    setCurrentTab,
    filter,
    setFilter,
    lastDeletedTask,
    undoDelete,
    dismissUndo,
    selectTask,
    addTask,
    editTask,
    toggleComplete,
    toggleToday,
    deleteTask,
    reorderTasks,
    incrementTaskPomodoros,
    refreshTasks,
  } = useTasks();

  const { sessions, todayStats, recordSession, refreshSessions } = useSessions();
  const { settings, isLoading, updateSettings, refreshSettings } = useSettings();

  // Escuta avisos de falha no armazenamento local (IndexedDB)
  useEffect(() => {
    const unsubscribe = onStorageError((msg) => {
      setStorageAlert(msg);
    });
    return unsubscribe;
  }, []);

  // Configuração passada ao motor
  const timerConfig = useMemo(
    () => ({
      focusDurationMin: settings.focusDurationMin,
      shortBreakDurationMin: settings.shortBreakDurationMin,
      longBreakDurationMin: settings.longBreakDurationMin,
      longBreakInterval: settings.longBreakInterval,
    }),
    [
      settings.focusDurationMin,
      settings.shortBreakDurationMin,
      settings.longBreakDurationMin,
      settings.longBreakInterval,
    ]
  );

  // Referência para auto-start ao terminar sessão
  const handleSessionFinished = useCallback(
    (session: SessionRecord) => {
      recordSession(session);

      if (session.status === 'completed') {
        // Toca som suave com volume configurado se habilitado
        if (settings.soundEnabled) {
          soundService.playSessionEndBeep(settings.soundVolume);
        }

        // Emite notificação de sistema se configurada
        if (settings.notificationsEnabled) {
          const modeName =
            session.mode === 'focus'
              ? 'Foco concluído!'
              : session.mode === 'shortBreak'
                ? 'Pausa curta concluída!'
                : 'Pausa longa concluída!';
          notificationService.notifySessionFinished(
            'FOCUS',
            `${modeName} Excelente progresso.`
          );
        }

        // Se era foco, incrementa a contagem de pomodoros na tarefa
        if (session.mode === 'focus' && session.taskId) {
          incrementTaskPomodoros(session.taskId);
        }

        // Lógica de Autoinício
        if (session.mode === 'focus' && settings.autoStartBreaks) {
          setTimeout(() => startNext(), 100);
        } else if (
          (session.mode === 'shortBreak' || session.mode === 'longBreak') &&
          settings.autoStartFocus
        ) {
          setTimeout(() => startNext(), 100);
        }
      }
    },
    [
      recordSession,
      incrementTaskPomodoros,
      settings.soundEnabled,
      settings.soundVolume,
      settings.notificationsEnabled,
      settings.autoStartBreaks,
      settings.autoStartFocus,
    ]
  );

  // Integração com o motor do temporizador (usa intenção digitada ou nome da tarefa selecionada)
  const currentTaskLabel = sessionIntention || selectedTask?.title;

  const {
    state,
    mode,
    formattedTime,
    progressPercent,
    cycleCurrent,
    cycleTotal,
    recoveryAlert,
    start,
    pause,
    resume,
    reset,
    skip,
    startNext,
    setMode,
    clearRecoveryAlert,
  } = useTimer({
    config: timerConfig,
    taskId: selectedTask?.id,
    taskName: currentTaskLabel,
    onSessionFinished: handleSessionFinished,
  });

  // Título da aba e Favicon dinâmicos em tempo real
  useDynamicFaviconAndTitle({
    formattedTime,
    mode,
    state,
    progressPercent,
  });

  // Screen Wake Lock: impede que a tela apague durante o foco ativo
  useEffect(() => {
    if (state === 'running' && mode === 'focus' && settings.wakeLockEnabled) {
      wakeLockService.acquire();
    } else {
      wakeLockService.release();
    }
    return () => {
      wakeLockService.release();
    };
  }, [state, mode, settings.wakeLockEnabled]);

  // Sincroniza saída de tela cheia nativa com o Modo Zen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isZenMode) {
        setIsZenMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isZenMode]);

  const toggleZenMode = useCallback(() => {
    setIsZenMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  const exitZenMode = useCallback(() => {
    setIsZenMode(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Confirmação leve ao pular ou reiniciar ciclo em andamento
  const handleRequestSkip = useCallback(() => {
    if (state === 'running' || state === 'paused') {
      setEarlyExitAction('skip');
    } else {
      skip();
    }
  }, [state, skip]);

  const handleRequestReset = useCallback(() => {
    if (state === 'running' || state === 'paused') {
      setEarlyExitAction('reset');
    } else {
      reset();
    }
  }, [state, reset]);

  const handleConfirmEarlyExit = useCallback(
    (recordAsInterrupted: boolean) => {
      const overrideStatus = recordAsInterrupted ? 'interrupted' : 'cancelled';
      if (earlyExitAction === 'skip') {
        skip(overrideStatus);
      } else if (earlyExitAction === 'reset') {
        reset(overrideStatus);
      }
      setEarlyExitAction(null);
    },
    [earlyExitAction, skip, reset]
  );

  // Atalhos de teclado globais (Espaço, R, S, 1, 2, 3, F, Esc)
  useKeyboardShortcuts({
    timerState: state,
    onStart: state === 'finished' ? startNext : start,
    onPause: pause,
    onResume: resume,
    onReset: handleRequestReset,
    onSkip: handleRequestSkip,
    onSetMode: setMode,
    onToggleZenMode: toggleZenMode,
    onExitZenMode: exitZenMode,
  });

  const handleImportSuccess = useCallback(() => {
    refreshTasks();
    refreshSessions();
    refreshSettings();
  }, [refreshTasks, refreshSessions, refreshSettings]);

  // Meta diária em segundos e ciclos para a barra de progresso da tela Foco
  const dailyGoalSec = settings.dailyGoalMin * 60;
  const goalCycles = Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin));
  const goalProgressPercent = Math.min(
    100,
    Math.round((todayStats.focusTimeSec / dailyGoalSec) * 100)
  );
  const isGoalAchieved =
    todayStats.focusTimeSec >= dailyGoalSec || todayStats.completedPomodoros >= goalCycles;

  return (
    <div className={styles.appRoot}>
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      <div className={styles.mainWrapper}>
        <Header
          activeTab={activeTab}
          onOpenSettings={() => setActiveTab('settings')}
        />

        <main className={styles.contentArea} id="main-content">
          {/* Aviso de armazenamento (IndexedDB com fallback para memória) */}
          {storageAlert && (
            <aside className={styles.discreetAlert} role="alert">
              <span className={styles.alertTag}>Aviso</span>
              <span className={styles.alertMessage}>{storageAlert}</span>
              <button
                type="button"
                className={styles.alertCloseButton}
                onClick={() => setStorageAlert(null)}
                aria-label="Fechar aviso"
              >
                Fechar
              </button>
            </aside>
          )}

          {activeTab === 'pomodoro' && (
            <div className={styles.pomodoroContainer}>
              {/* Aviso discreto caso tenha havido recuperação de sessão */}
              {recoveryAlert && (
                <aside className={styles.discreetAlert} role="status" aria-live="polite">
                  <span className={styles.alertTag}>Aviso</span>
                  <span className={styles.alertMessage}>{recoveryAlert}</span>
                  <button
                    type="button"
                    className={styles.alertCloseButton}
                    onClick={clearRecoveryAlert}
                    aria-label="Fechar aviso"
                  >
                    Fechar
                  </button>
                </aside>
              )}

              {/* Saudação no topo da tela Foco */}
              <Greeting
                userName={settings.userName}
                todayStats={todayStats}
                dailyGoalMin={settings.dailyGoalMin}
                focusDurationMin={settings.focusDurationMin}
                sessions={sessions}
              />

              {/* Barra fina de progresso da meta diária com frase ao bater */}
              <div className={styles.goalBarWrapper} aria-label="Progresso da meta diária">
                <div className={styles.goalBarHeader}>
                  <span className={styles.goalBarLabel}>
                    {isGoalAchieved ? (
                      <span className={styles.goalCelebrationPhrase}>
                        ✨ Meta diária batida! Parabéns pelo foco hoje.
                      </span>
                    ) : (
                      <span>
                        Meta diária: <strong>{todayStats.completedPomodoros}/{goalCycles} ciclos</strong>
                      </span>
                    )}
                  </span>
                  <span className={styles.goalBarPct}>{goalProgressPercent}%</span>
                </div>
                <div
                  className={styles.goalBarTrack}
                  role="progressbar"
                  aria-valuenow={goalProgressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`${styles.goalBarFill} ${
                      isGoalAchieved ? styles.goalBarFillAchieved : ''
                    }`}
                    style={{ width: `${goalProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Campo opcional de intenção da sessão antes de iniciar */}
              {state === 'idle' && (
                <SessionIntention
                  intention={sessionIntention}
                  onChangeIntention={setSessionIntention}
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={(task) => {
                    selectTask(task ? task.id : null);
                    if (task) {
                      setSessionIntention(task.title);
                    }
                  }}
                />
              )}

              <SessionSelector
                currentMode={mode}
                onSelectMode={setMode}
                disabled={state === 'running'}
              />

              <Timer
                mode={mode}
                formattedTime={formattedTime}
                progressPercent={progressPercent}
                cycleCurrent={cycleCurrent}
                cycleTotal={cycleTotal}
                taskName={currentTaskLabel}
              />

              {/* Frase motivacional discreta logo abaixo do timer */}
              <MotivationalQuote
                sessionMode={mode}
                timerState={state}
                cycleCurrent={cycleCurrent}
                motivationalQuotesEnabled={settings.motivationalQuotesEnabled}
                quotesFrequency={settings.quotesFrequency}
                todayStats={todayStats}
                dailyGoalMin={settings.dailyGoalMin}
                focusDurationMin={settings.focusDurationMin}
                sessions={sessions}
              />

              <TimerControls
                state={state}
                onStart={state === 'finished' ? startNext : start}
                onPause={pause}
                onResume={resume}
                onReset={handleRequestReset}
                onSkip={handleRequestSkip}
              />

              {/* Resumo do dia alimentado por dados reais do histórico */}
              <DailySummary
                focusTimeFormatted={formatDailyFocusTime(todayStats.focusTimeSec)}
                completedPomodoros={todayStats.completedPomodoros}
                dailyGoalCycles={Math.max(1, Math.round(settings.dailyGoalMin / settings.focusDurationMin))}
              />

              {/* Dica discreta de atalhos rápidos de teclado */}
              <div className={styles.shortcutsHintBar} title="Atalhos rápidos do teclado">
                <span className={styles.shortcutPill}><kbd className={styles.shortcutBadge}>Espaço</kbd> Iniciar/Pausar</span>
                <span>·</span>
                <span className={styles.shortcutPill}><kbd className={styles.shortcutBadge}>R</kbd> Reiniciar</span>
                <span>·</span>
                <span className={styles.shortcutPill}><kbd className={styles.shortcutBadge}>S</kbd> Pular</span>
                <span>·</span>
                <span className={styles.shortcutPill}><kbd className={styles.shortcutBadge}>1/2/3</kbd> Modos</span>
                <span>·</span>
                <span className={styles.shortcutPill}><kbd className={styles.shortcutBadge}>F</kbd> Modo Zen</span>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className={styles.viewContainer} key="tasks">
              <TaskList
                tasks={filteredTasks}
                selectedTaskId={selectedTaskId}
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                filter={filter}
                onFilterChange={setFilter}
                onAddTask={addTask}
                onEditTask={editTask}
                onToggleComplete={toggleComplete}
                onToggleToday={toggleToday}
                onDeleteTask={deleteTask}
                onSelectTask={(id) => {
                  selectTask(id);
                  const clickedTask = tasks.find((t) => t.id === id);
                  if (clickedTask) {
                    setSessionIntention(clickedTask.title);
                  }
                  // Retorna suavemente para o Pomodoro após selecionar a tarefa
                  setActiveTab('pomodoro');
                }}
                onReorderTasks={reorderTasks}
                lastDeletedTask={lastDeletedTask}
                onUndoDelete={undoDelete}
                onDismissUndo={dismissUndo}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.viewContainer} key="history">
              <SessionHistory sessions={sessions} />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={styles.viewContainer} key="stats">
              <Statistics sessions={sessions} dailyGoalMin={settings.dailyGoalMin} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.viewContainer} key="settings">
              <Settings
                settings={settings}
                isSessionRunning={state === 'running'}
                onUpdateSettings={updateSettings}
                onImportSuccess={handleImportSuccess}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modo Zen (tela cheia): esconde sidebar e topo, deixa só timer, intenção e frase */}
      {isZenMode && (
        <div className={styles.zenModeRoot} role="region" aria-label="Modo Zen">
          <button
            type="button"
            className={styles.zenExitButton}
            onClick={exitZenMode}
            title="Sair do Modo Zen (Esc)"
          >
            <Minimize2 size={14} />
            <span>Sair do Modo Zen (Esc)</span>
          </button>

          <div className={styles.zenContent}>
            <Timer
              mode={mode}
              formattedTime={formattedTime}
              progressPercent={progressPercent}
              cycleCurrent={cycleCurrent}
              cycleTotal={cycleTotal}
              taskName={currentTaskLabel}
            />

            <MotivationalQuote
              sessionMode={mode}
              timerState={state}
              cycleCurrent={cycleCurrent}
              motivationalQuotesEnabled={settings.motivationalQuotesEnabled}
              quotesFrequency={settings.quotesFrequency}
              todayStats={todayStats}
              dailyGoalMin={settings.dailyGoalMin}
              focusDurationMin={settings.focusDurationMin}
              sessions={sessions}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmação leve ao pular ou reiniciar ciclo em andamento */}
      <EarlyExitModal
        isOpen={earlyExitAction !== null}
        actionType={earlyExitAction || 'skip'}
        onConfirmRecord={() => handleConfirmEarlyExit(true)}
        onDiscard={() => handleConfirmEarlyExit(false)}
        onCancel={() => setEarlyExitAction(null)}
      />

      {/* Modal de primeiro uso para nome opcional */}
      <OnboardingModal
        isOpen={!isLoading && !settings.hasCompletedOnboarding}
        onConfirm={(userName) => {
          updateSettings({ userName, hasCompletedOnboarding: true });
        }}
        onSkip={() => {
          updateSettings({ hasCompletedOnboarding: true });
        }}
      />
    </div>
  );
}

export default App;
