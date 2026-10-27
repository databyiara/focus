import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import type { SessionMode } from '../../domain/types';
import styles from './SessionSelector.module.css';

interface SessionSelectorProps {
  currentMode: SessionMode;
  onSelectMode: (mode: SessionMode) => void;
  disabled?: boolean;
}

interface ModeDef {
  id: SessionMode;
  label: string;
}

const MODES: ModeDef[] = [
  { id: 'focus', label: 'Foco' },
  { id: 'shortBreak', label: 'Pausa curta' },
  { id: 'longBreak', label: 'Pausa longa' },
];

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<SessionMode, HTMLButtonElement | null>>({
    focus: null,
    shortBreak: null,
    longBreak: null,
  });

  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = React.useCallback(() => {
    const activeButton = buttonRefs.current[currentMode];
    if (activeButton) {
      setIndicator({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
        ready: true,
      });
    }
  }, [currentMode]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div className={styles.selectorContainer} role="region" aria-label="Seletor de modo">
      <div
        ref={containerRef}
        className={`${styles.selectorList} ${disabled ? styles.selectorDisabled : ''}`}
        role="tablist"
      >
        {/* Indicador deslizante animado */}
        <span
          className={`${styles.slidingIndicator} ${indicator.ready ? styles.indicatorReady : ''}`}
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: `${indicator.width}px`,
          }}
          aria-hidden="true"
        />

        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              ref={(el) => {
                buttonRefs.current[mode.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="timer-display"
              className={`${styles.optionButton} ${isActive ? styles.optionButtonActive : ''}`}
              onClick={() => onSelectMode(mode.id)}
              disabled={disabled}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
