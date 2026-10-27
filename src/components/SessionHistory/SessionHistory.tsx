import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  History,
} from 'lucide-react';
import type { SessionMode, SessionRecord, SessionStatus } from '../../domain/types';
import { getSessionLocalDateKey } from '../../domain/sessionRules';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  sessions: SessionRecord[];
}

type TypeFilter = 'all' | 'focus' | 'breaks';
type PeriodFilter = 'today' | '7days' | '30days' | 'all';

function formatTime24h(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDurationSec(sec: number): string {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPlannedMin(sec: number): string {
  return `${Math.round(sec / 60)} min`;
}

function formatGroupDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  const todayKey = getSessionLocalDateKey(Date.now());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = getSessionLocalDateKey(yesterdayDate.getTime());

  if (dateKey === todayKey) {
    return `${day}/${month}/${year} — Hoje`;
  }
  if (dateKey === yesterdayKey) {
    return `${day}/${month}/${year} — Ontem`;
  }
  return `${day}/${month}/${year}`;
}

const MODE_LABELS: Record<SessionMode, string> = {
  focus: 'Foco',
  shortBreak: 'Pausa Curta',
  longBreak: 'Pausa Longa',
};

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }> }
> = {
  completed: { label: 'Concluída', icon: CheckCircle2 },
  interrupted: { label: 'Interrompida', icon: AlertCircle },
  cancelled: { label: 'Cancelada', icon: XCircle },
};

export const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  // Filtra as sessões conforme filtros selecionados
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const todayKey = getSessionLocalDateKey(now);

    return sessions.filter((session) => {
      // 1. Filtro de tipo
      if (typeFilter === 'focus' && session.mode !== 'focus') return false;
      if (typeFilter === 'breaks' && session.mode === 'focus') return false;

      // 2. Filtro de período
      if (periodFilter === 'today') {
        if (getSessionLocalDateKey(session.startedAt) !== todayKey) return false;
      } else if (periodFilter === '7days') {
        const diffDays = (now - session.startedAt) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (periodFilter === '30days') {
        const diffDays = (now - session.startedAt) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      }

      return true;
    });
  }, [sessions, typeFilter, periodFilter]);

  // Agrupa sessões filtradas por data local
  const groupedSessions = useMemo(() => {
    const groups: Map<string, SessionRecord[]> = new Map();
    for (const session of filteredSessions) {
      const key = getSessionLocalDateKey(session.startedAt);
      const list = groups.get(key) || [];
      list.push(session);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [filteredSessions]);

  return (
    <section className={styles.container} aria-label="Histórico de Sessões">
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Histórico</h1>

        <div className={styles.filtersRow}>
          {/* Filtro por Tipo */}
          <div className={styles.filterGroup} role="tablist" aria-label="Filtrar por tipo">
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'all'}
              className={`${styles.filterButton} ${typeFilter === 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'focus'}
              className={`${styles.filterButton} ${typeFilter === 'focus' ? styles.filterButtonActive : ''}`}
              onClick={() => setTypeFilter('focus')}
            >
              Foco
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'breaks'}
              className={`${styles.filterButton} ${typeFilter === 'breaks' ? styles.filterButtonActive : ''}`}
              onClick={() => setTypeFilter('breaks')}
            >
              Pausas
            </button>
          </div>

          {/* Filtro por Período */}
          <div className={styles.filterGroup} role="tablist" aria-label="Filtrar por período">
            <button
              type="button"
              role="tab"
              aria-selected={periodFilter === 'today'}
              className={`${styles.filterButton} ${periodFilter === 'today' ? styles.filterButtonActive : ''}`}
              onClick={() => setPeriodFilter('today')}
            >
              Hoje
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={periodFilter === '7days'}
              className={`${styles.filterButton} ${periodFilter === '7days' ? styles.filterButtonActive : ''}`}
              onClick={() => setPeriodFilter('7days')}
            >
              7 dias
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={periodFilter === '30days'}
              className={`${styles.filterButton} ${periodFilter === '30days' ? styles.filterButtonActive : ''}`}
              onClick={() => setPeriodFilter('30days')}
            >
              30 dias
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={periodFilter === 'all'}
              className={`${styles.filterButton} ${periodFilter === 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setPeriodFilter('all')}
            >
              Tudo
            </button>
          </div>
        </div>
      </div>

      {groupedSessions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <History size={24} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className={styles.emptyTitle}>Nenhuma sessão registrada</p>
          <p className={styles.emptySubtitle}>
            {periodFilter !== 'all' || typeFilter !== 'all'
              ? 'Nenhuma sessão encontrada para os filtros selecionados.'
              : 'Complete seu primeiro ciclo de foco para acompanhar seu histórico aqui.'}
          </p>
          {(periodFilter !== 'all' || typeFilter !== 'all') && (
            <button
              type="button"
              className={styles.emptyActionButton}
              onClick={() => {
                setPeriodFilter('all');
                setTypeFilter('all');
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        groupedSessions.map(([dateKey, items]) => (
          <div key={dateKey} className={styles.dateGroup}>
            <div className={styles.dateHeader}>{formatGroupDate(dateKey)}</div>

            <ul className={styles.sessionList}>
              {items.map((session) => {
                const StatusIcon = STATUS_CONFIG[session.status].icon;
                const statusLabel = STATUS_CONFIG[session.status].label;
                const timeRange = `${formatTime24h(session.startedAt)} – ${formatTime24h(session.endedAt)}`;

                return (
                  <li key={session.id} className={styles.sessionItem}>
                    <span className={styles.timeCol}>{timeRange}</span>

                    <span className={styles.modeCol}>{MODE_LABELS[session.mode]}</span>

                    <span
                      className={`${styles.taskCol} ${!session.taskName ? styles.taskColEmpty : ''}`}
                      title={session.taskName || 'Sem tarefa vinculada'}
                    >
                      {session.taskName || '—'}
                    </span>

                    <span className={styles.plannedCol} title="Duração planejada">
                      {formatPlannedMin(session.targetDurationSec)}
                    </span>

                    <span className={styles.actualCol} title="Duração efetiva">
                      {formatDurationSec(session.actualDurationSec)}
                    </span>

                    {/* Rótulo de status: texto + ícone, sem cor */}
                    <div className={styles.statusBadge}>
                      <StatusIcon size={16} strokeWidth={1.5} className={styles.statusIcon} />
                      <span>{statusLabel}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
};
