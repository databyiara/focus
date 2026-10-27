import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ListFilter, X, Check, Calendar, Layers } from 'lucide-react';
import type { Task } from '../../domain/types';
import styles from './SessionIntention.module.css';

interface SessionIntentionProps {
  intention: string;
  onChangeIntention: (val: string) => void;
  tasks: Task[];
  selectedTaskId?: string | null;
  onSelectTask: (task: Task | null) => void;
  disabled?: boolean;
}

export const SessionIntention: React.FC<SessionIntentionProps> = ({
  intention,
  onChangeIntention,
  tasks,
  selectedTaskId,
  onSelectTask,
  disabled = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownTab, setDropdownTab] = useState<'today' | 'all'>('today');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);

  const displayedTasks = useMemo(() => {
    if (dropdownTab === 'today') {
      const todayList = activeTasks.filter((t) => t.isToday !== false);
      // Se não houver tarefas em "Hoje", mas houver em "Todas", pode mostrar
      return todayList;
    }
    return activeTasks;
  }, [activeTasks, dropdownTab]);

  const handlePickTask = (task: Task) => {
    onSelectTask(task);
    onChangeIntention(task.title);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onChangeIntention('');
    onSelectTask(null);
  };

  return (
    <div className={styles.container} ref={containerRef} aria-label="Intenção da sessão">
      <div className={styles.inputWrapper}>
        <input
          type="text"
          maxLength={80}
          className={styles.input}
          placeholder="No que você vai focar?"
          value={intention}
          disabled={disabled}
          onChange={(e) => {
            onChangeIntention(e.target.value);
            if (selectedTaskId) {
              onSelectTask(null);
            }
          }}
          aria-label="No que você vai focar nesta sessão"
        />

        {intention && !disabled && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            title="Limpar intenção"
            aria-label="Limpar intenção"
          >
            <X size={14} />
          </button>
        )}

        {activeTasks.length > 0 && !disabled && (
          <button
            type="button"
            className={`${styles.taskPickerButton} ${selectedTaskId ? styles.taskPickerButtonActive : ''}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            title="Vincular a uma tarefa"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <ListFilter size={14} />
            <span>{selectedTaskId ? 'Vinculada' : 'Tarefas'}</span>
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <div className={styles.dropdown} role="listbox">
          {/* Abas do Dropdown: Hoje e Todas */}
          <div className={styles.dropdownTabs}>
            <button
              type="button"
              className={`${styles.dropdownTabBtn} ${
                dropdownTab === 'today' ? styles.dropdownTabBtnActive : ''
              }`}
              onClick={() => setDropdownTab('today')}
            >
              <Calendar size={12} />
              <span>Hoje ({activeTasks.filter((t) => t.isToday !== false).length})</span>
            </button>
            <button
              type="button"
              className={`${styles.dropdownTabBtn} ${
                dropdownTab === 'all' ? styles.dropdownTabBtnActive : ''
              }`}
              onClick={() => setDropdownTab('all')}
            >
              <Layers size={12} />
              <span>Todas ({activeTasks.length})</span>
            </button>
          </div>

          <div className={styles.dropdownList}>
            {displayedTasks.length === 0 ? (
              <div className={styles.dropdownEmpty}>
                {dropdownTab === 'today'
                  ? 'Nenhuma tarefa em Hoje. Veja a aba "Todas".'
                  : 'Nenhuma tarefa ativa cadastrada.'}
              </div>
            ) : (
              displayedTasks.map((task) => {
                const countDisplay =
                  task.estimatedPomodoros !== undefined
                    ? `${task.completedPomodoros}/${task.estimatedPomodoros}`
                    : `${task.completedPomodoros}`;

                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      selectedTaskId === task.id ? styles.dropdownItemActive : ''
                    }`}
                    onClick={() => handlePickTask(task)}
                    role="option"
                    aria-selected={selectedTaskId === task.id}
                  >
                    <span className={styles.dropdownItemTitle}>{task.title}</span>
                    <div className={styles.dropdownItemRight}>
                      <span className={styles.pomodoroBadge}>{countDisplay}</span>
                      {selectedTaskId === task.id && <Check size={14} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
