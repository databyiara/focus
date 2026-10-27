import { useEffect } from 'react';
import type { SessionMode, TimerState } from '../domain/types';

interface UseDynamicFaviconAndTitleOptions {
  formattedTime: string;
  mode: SessionMode;
  state: TimerState;
  progressPercent: number;
}

const MODE_LABELS: Record<SessionMode, string> = {
  focus: 'Foco',
  shortBreak: 'Pausa Curta',
  longBreak: 'Pausa Longa',
};

function generateFaviconDataUrl(
  mode: SessionMode,
  progressPercent: number,
  state: TimerState
): string {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  // O anel esvazia conforme o tempo passa (de 100% até 0%)
  const remainingFraction = Math.max(0, Math.min(1, (100 - progressPercent) / 100));
  const strokeDashoffset = circumference * (1 - remainingFraction);

  const ringColor = mode === 'focus' ? '#ffffff' : '#a0a0a0';
  const trackColor = '#282828';
  const bgColor = '#0a0a0a';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill="${bgColor}" stroke="#1e1e1e" stroke-width="1"/>
    <circle cx="16" cy="16" r="${radius}" fill="none" stroke="${trackColor}" stroke-width="3"/>
    <circle cx="16" cy="16" r="${radius}" fill="none" stroke="${ringColor}" stroke-width="3" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" transform="rotate(-90 16 16)"/>
    ${state === 'paused' ? '<circle cx="16" cy="16" r="3" fill="#888888"/>' : ''}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function useDynamicFaviconAndTitle({
  formattedTime,
  mode,
  state,
  progressPercent,
}: UseDynamicFaviconAndTitleOptions) {
  useEffect(() => {
    // 1. Atualiza Título da aba
    if (state === 'running' || state === 'paused') {
      const modeLabel = MODE_LABELS[mode];
      const prefix = state === 'paused' ? '⏸ ' : '';
      document.title = `${prefix}${formattedTime} · ${modeLabel}`;
    } else if (state === 'finished') {
      document.title = `00:00 · Concluído! - Focus`;
    } else {
      document.title = 'Focus';
    }

    // 2. Atualiza Favicon dinamicamente
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (state === 'idle') {
      link.href = generateFaviconDataUrl('focus', 0, 'idle');
    } else {
      link.href = generateFaviconDataUrl(mode, progressPercent, state);
    }
  }, [formattedTime, mode, state, progressPercent]);
}
