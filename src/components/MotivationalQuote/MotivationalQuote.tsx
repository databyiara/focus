import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { SessionMode, TimerState, SessionRecord } from '../../domain/types';
import type { DailyStats } from '../../domain/stats';
import type { QuotesFrequency } from '../../config/defaults';
import { type PhraseCategory } from '../../data/phrases';
import { phraseEngine } from '../../domain/phraseEngine';
import { getDaysSinceLastFocusSession } from '../../domain/stats';
import { getSessionLocalDateKey } from '../../domain/sessionRules';
import styles from './MotivationalQuote.module.css';

interface MotivationalQuoteProps {
  sessionMode: SessionMode;
  timerState: TimerState;
  cycleCurrent: number;
  motivationalQuotesEnabled?: boolean;
  quotesFrequency?: QuotesFrequency;
  todayStats: DailyStats;
  dailyGoalMin: number;
  focusDurationMin: number;
  sessions: SessionRecord[];
}

// 8 minutos em milissegundos para rotação durante foco
const FOCUS_QUOTE_ROTATION_MS = 8 * 60 * 1000;

export const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({
  sessionMode,
  timerState,
  cycleCurrent,
  motivationalQuotesEnabled = true,
  quotesFrequency = 'always',
  todayStats,
  dailyGoalMin,
  focusDurationMin,
  sessions,
}) => {
  // 1. Determina a categoria ativa conforme o contexto atual
  const activeCategory = useMemo<PhraseCategory>(() => {
    const dailyGoalCycles = Math.max(1, Math.round(dailyGoalMin / focusDurationMin));
    const goalSec = dailyGoalMin * 60;
    const isGoalAchieved =
      (dailyGoalCycles > 0 && todayStats.completedPomodoros >= dailyGoalCycles) ||
      (goalSec > 0 && todayStats.focusTimeSec >= goalSec);

    // Se a sessão acabou de finalizar
    if (timerState === 'finished') {
      if (isGoalAchieved) {
        return 'meta_batida';
      }
      if (sessionMode === 'focus') {
        return 'fim_de_foco';
      }
      return sessionMode === 'shortBreak' ? 'pausa_curta' : 'pausa_longa';
    }

    // Modo de pausas
    if (sessionMode === 'shortBreak') {
      return 'pausa_curta';
    }
    if (sessionMode === 'longBreak') {
      return 'pausa_longa';
    }

    // Modo foco em andamento
    if (timerState === 'running' || timerState === 'paused') {
      return 'durante_foco';
    }

    // Modo foco parado (idle): analisa histórico de hoje para tom adequado
    const nowTime = new Date().getTime();
    const todayKey = getSessionLocalDateKey(nowTime);
    const todaySessions = sessions.filter(
      (s) => getSessionLocalDateKey(s.startedAt) === todayKey
    );

    // Dia difícil: 2 ou mais sessões interrompidas/canceladas hoje
    const interruptedToday = todaySessions.filter(
      (s) => (s.status === 'interrupted' || s.status === 'cancelled') && s.mode === 'focus'
    );
    if (interruptedToday.length >= 2) {
      return 'dia_dificil';
    }

    // Meta já batida hoje
    if (isGoalAchieved && todayStats.completedPomodoros > 0) {
      return 'meta_batida';
    }

    // Retorno após 1+ dia sem foco (primeira sessão do dia)
    const daysSinceLast = getDaysSinceLastFocusSession(sessions);
    if (daysSinceLast >= 2 && todaySessions.length === 0) {
      return 'retorno_apos_ausencia';
    }

    return 'antes_de_iniciar';
  }, [
    sessionMode,
    timerState,
    todayStats,
    dailyGoalMin,
    focusDurationMin,
    sessions,
  ]);

  // Se estiver desativado pelo usuário ou frequency === 'never'
  const isEnabled = motivationalQuotesEnabled && quotesFrequency !== 'never';

  // Se a frequência for 'start_and_end', não exibe frases durante o foco
  const shouldDisplay = useMemo(() => {
    if (!isEnabled) return false;
    if (quotesFrequency === 'start_and_end' && activeCategory === 'durante_foco') {
      return false;
    }
    return true;
  }, [isEnabled, quotesFrequency, activeCategory]);

  const [quote, setQuote] = useState<string>(() =>
    phraseEngine.getCurrentOrNext(activeCategory)
  );
  const [isFading, setIsFading] = useState<boolean>(false);

  const prevCategoryRef = useRef<PhraseCategory>(activeCategory);
  const prevCycleRef = useRef<number>(cycleCurrent);

  // Função para transição suave de frase
  const transitionToNextPhrase = (category: PhraseCategory) => {
    setIsFading(true);
    setTimeout(() => {
      const next = phraseEngine.getNextPhrase(category);
      setQuote(next);
      setIsFading(false);
    }, 180);
  };

  // Atualiza a frase quando a categoria ou ciclo mudar
  useEffect(() => {
    if (
      prevCategoryRef.current !== activeCategory ||
      prevCycleRef.current !== cycleCurrent
    ) {
      prevCategoryRef.current = activeCategory;
      prevCycleRef.current = cycleCurrent;
      transitionToNextPhrase(activeCategory);
    }
  }, [activeCategory, cycleCurrent]);

  // Rotação periódica a cada ~8 minutos durante o foco (sem animação chamativa)
  useEffect(() => {
    if (activeCategory !== 'durante_foco' || timerState !== 'running' || !shouldDisplay) {
      return;
    }

    const interval = setInterval(() => {
      transitionToNextPhrase('durante_foco');
    }, FOCUS_QUOTE_ROTATION_MS);

    return () => clearInterval(interval);
  }, [activeCategory, timerState, shouldDisplay]);

  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className={styles.quoteWrapper} aria-label="Frase inspiradora">
      <p className={`${styles.quoteText} ${isFading ? styles.fading : ''}`}>
        “{quote}”
      </p>
    </div>
  );
};
