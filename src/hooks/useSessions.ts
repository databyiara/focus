import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SessionRecord } from '../domain/types';
import { sessionService } from '../services/sessionService';
import { calculateDailyStats, type DailyStats } from '../domain/stats';
import { getSessionLocalDateKey } from '../domain/sessionRules';

export function useSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await sessionService.getAll();
      setSessions(loaded);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const recordSession = useCallback(async (session: SessionRecord) => {
    try {
      await sessionService.save(session);
      setSessions((prev) => [session, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar sessão:', err);
    }
  }, []);

  const todayKey = useMemo(() => {
    return getSessionLocalDateKey(Date.now());
  }, []);

  const todayStats: DailyStats = useMemo(() => {
    return calculateDailyStats(sessions, todayKey);
  }, [sessions, todayKey]);

  return {
    sessions,
    todayStats,
    isLoading,
    recordSession,
    refreshSessions,
  };
}
