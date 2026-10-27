import React, { useState, useRef } from 'react';
import { Plus, CheckSquare, RotateCcw, X, Calendar, Layers } from 'lucide-react';
import type { Task } from '../../domain/types';
import type { TaskFilter, TaskTab } from '../../hooks/useTasks';
import { TaskItem } from '../TaskItem/TaskItem';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  currentTab: TaskTab;
  onTabChange: (tab: TaskTab) => void;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onAddTask: (title: string, estimatedPomodoros?: number, note?: string) => void;
  onEditTask: (task: Task) => void;
  onToggleComplete: (id: string) => void;
  onToggleToday: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onReorderTasks: (orderedIds: string[]) => void;
  lastDeletedTask: Task | null;
  onUndoDelete: () => void;
  onDismissUndo: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  currentTab,
  onTabChange,
  filter,
  onFilterChange,
  onAddTask,
  onEditTask,
  onToggleComplete,
  onToggleToday,
  onDeleteTask,
  onSelectTask,
  onReorderTasks,
  lastDeletedTask,
  onUndoDelete,
  onDismissUndo,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    onAddTask(trimmed);
    setNewTitle('');
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...tasks];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);

    setDraggedIndex(null);
    onReorderTasks(updated.map((t) => t.id));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section className={styles.taskListContainer} aria-label="Gerenciador de Tarefas">
      {/* Cabeçalho com Abas Principais: Hoje / Todas */}
      <div className={styles.headerRow}>
        <div className={styles.tabsContainer} role="tablist" aria-label="Abas de tarefas">
          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'today'}
            className={`${styles.mainTabButton} ${
              currentTab === 'today' ? styles.mainTabButtonActive : ''
            }`}
            onClick={() => onTabChange('today')}
          >
            <Calendar size={15} />
            <span>Hoje</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'all'}
            className={`${styles.mainTabButton} ${
              currentTab === 'all' ? styles.mainTabButtonActive : ''
            }`}
            onClick={() => onTabChange('all')}
          >
            <Layers size={15} />
            <span>Todas</span>
          </button>
        </div>

        {/* Filtros secundários: Pendentes / Concluídas / Todas */}
        <div className={styles.filterGroup} role="group" aria-label="Filtrar por status">
          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === 'pending' ? styles.filterButtonActive : ''
            }`}
            onClick={() => onFilterChange('pending')}
          >
            Pendentes
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === 'completed' ? styles.filterButtonActive : ''
            }`}
            onClick={() => onFilterChange('completed')}
          >
            Concluídas
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === 'all' ? styles.filterButtonActive : ''
            }`}
            onClick={() => onFilterChange('all')}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Entrada rápida: Sempre visível, aceita Enter e comando "/3" no fim */}
      <form className={styles.inputForm} onSubmit={handleAdd}>
        <input
          ref={inputRef}
          type="text"
          className={styles.taskInput}
          placeholder='Adicionar tarefa (ex: "Relatório /3" para 3 ciclos)...'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          aria-label="Adicionar tarefa rápida"
        />
        <button
          type="submit"
          className={styles.addButton}
          aria-label="Criar tarefa"
          disabled={!newTitle.trim()}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Lista de tarefas ou Estado Vazio */}
      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <CheckSquare size={22} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className={styles.emptyTitle}>Nada por aqui.</p>
          <p className={styles.emptySubtitle}>
            {filter === 'completed'
              ? 'Nenhuma tarefa concluída neste filtro.'
              : 'Adicione a primeira tarefa e comece por ela.'}
          </p>
          {filter === 'completed' ? (
            <button
              type="button"
              className={styles.emptyActionButton}
              onClick={() => onFilterChange('pending')}
            >
              Ver pendentes
            </button>
          ) : (
            <button
              type="button"
              className={styles.emptyActionButton}
              onClick={() => inputRef.current?.focus()}
            >
              Criar tarefa
            </button>
          )}
        </div>
      ) : (
        <ul className={styles.list} aria-label="Lista de tarefas">
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              isSelected={task.id === selectedTaskId}
              onSelect={onSelectTask}
              onToggleComplete={onToggleComplete}
              onToggleToday={onToggleToday}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          ))}
        </ul>
      )}

      {/* Toast com "Desfazer" ao excluir por 5 segundos */}
      {lastDeletedTask && (
        <aside className={styles.undoToast} role="alert" aria-live="assertive">
          <div className={styles.undoContent}>
            <span className={styles.undoText}>
              Tarefa excluída: <strong>{lastDeletedTask.title}</strong>
            </span>
            <button
              type="button"
              className={styles.undoButton}
              onClick={onUndoDelete}
              aria-label="Desfazer exclusão da tarefa"
            >
              <RotateCcw size={14} />
              <span>Desfazer</span>
            </button>
          </div>
          <button
            type="button"
            className={styles.closeUndoButton}
            onClick={onDismissUndo}
            title="Fechar"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
          <div className={styles.undoProgressBar} />
        </aside>
      )}
    </section>
  );
};
