import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, Trash2, Crosshair, GripVertical, CheckCheck, X } from 'lucide-react';
import type { Task } from '../../domain/types';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleToday: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLLIElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void;
  isDragging?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleToday,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editEstimate, setEditEstimate] = useState<number | undefined>(task.estimatedPomodoros);
  const [editNote, setEditNote] = useState(task.note || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Sincroniza se a tarefa externa mudar
  useEffect(() => {
    setEditTitle(task.title);
    setEditEstimate(task.estimatedPomodoros);
    setEditNote(task.note || '');
  }, [task]);

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle) {
      let clampedEstimate = editEstimate;
      if (clampedEstimate !== undefined && !Number.isNaN(clampedEstimate)) {
        clampedEstimate = Math.min(8, Math.max(1, Math.round(clampedEstimate)));
      }
      onEdit({
        ...task,
        title: trimmedTitle,
        estimatedPomodoros: clampedEstimate,
        note: editNote.trim() || undefined,
      });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditEstimate(task.estimatedPomodoros);
    setEditNote(task.note || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const pomodoroDisplay =
    task.estimatedPomodoros !== undefined
      ? `${task.completedPomodoros}/${task.estimatedPomodoros}`
      : `${task.completedPomodoros}`;

  return (
    <li
      className={`${styles.taskItem} ${task.isCompleted ? styles.taskItemCompleted : ''} ${
        isDragging ? styles.taskItemDragging : ''
      }`}
      aria-label={`Tarefa: ${task.title}`}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className={styles.leftGroup}>
        {/* Alça de arrastar para reordenar */}
        <div
          className={styles.dragHandle}
          title="Arrastar para reordenar"
          aria-hidden="true"
        >
          <GripVertical size={16} strokeWidth={1.5} />
        </div>

        {/* Checkbox monocromático com área de toque mínima de 44px */}
        <button
          type="button"
          className={styles.checkboxButton}
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
          aria-checked={task.isCompleted}
          role="checkbox"
        >
          <div
            className={`${styles.checkboxBox} ${
              task.isCompleted ? styles.checkboxBoxChecked : ''
            }`}
          >
            {task.isCompleted && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
          </div>
        </button>

        {/* Conteúdo / Modo de Edição */}
        <div className={styles.contentArea}>
          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.editRow}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.editTitleInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Título da tarefa"
                  aria-label="Editar nome da tarefa"
                />
                <input
                  type="number"
                  min="1"
                  max="8"
                  className={styles.editEstimateInput}
                  value={editEstimate ?? ''}
                  placeholder="Ciclos (1-8)"
                  title="Estimativa em ciclos (1 a 8)"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setEditEstimate(Number.isNaN(val) ? undefined : val);
                  }}
                  onKeyDown={handleKeyDown}
                  aria-label="Editar estimativa de ciclos (1-8)"
                />
              </div>

              <input
                type="text"
                maxLength={120}
                className={styles.editNoteInput}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Observação curta (opcional)"
                aria-label="Editar observação curta"
              />

              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.saveEditButton}
                  onClick={handleSaveEdit}
                  title="Salvar alterações"
                >
                  <CheckCheck size={14} />
                  <span>Salvar</span>
                </button>
                <button
                  type="button"
                  className={styles.cancelEditButton}
                  onClick={handleCancelEdit}
                  title="Cancelar edição"
                >
                  <X size={14} />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.textContainer}>
              <span
                className={styles.taskTitle}
                onClick={() => setIsEditing(true)}
                title="Clique para editar"
              >
                {task.title}
              </span>
              {task.note && (
                <span className={styles.taskNote} title={task.note}>
                  {task.note}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grupo de Metadados e Ações da direita */}
      <div className={styles.rightGroup}>
        {/* Badge da contagem de ciclos ("2/4" ou "2") */}
        <span
          className={styles.pomodoroBadge}
          title={`Ciclos: ${pomodoroDisplay} (concluídos / meta)`}
          aria-label={`Ciclos de foco: ${pomodoroDisplay}`}
        >
          {pomodoroDisplay}
        </span>

        {/* Botão de alternar exibição em "Hoje" */}
        <button
          type="button"
          className={`${styles.todayButton} ${task.isToday ? styles.todayButtonActive : ''}`}
          onClick={() => onToggleToday(task.id)}
          title={task.isToday ? 'Remover de Hoje' : 'Marcar para Hoje'}
          aria-label={task.isToday ? 'Na lista Hoje' : 'Adicionar a Hoje'}
        >
          {task.isToday ? 'Hoje' : '+ Hoje'}
        </button>

        {/* Botão de Vincular / Selecionar para a sessão */}
        {!task.isCompleted && (
          <button
            type="button"
            className={`${styles.actionButton} ${isSelected ? styles.actionButtonSelected : ''}`}
            onClick={() => onSelect(task.id)}
            aria-label={
              isSelected ? 'Tarefa vinculada ao timer' : 'Vincular tarefa ao timer'
            }
            title={isSelected ? 'Vinculada ao timer' : 'Focar nesta tarefa'}
          >
            <Crosshair size={15} strokeWidth={1.5} aria-hidden="true" />
            <span className={styles.actionLabel}>{isSelected ? 'Ativa' : 'Focar'}</span>
          </button>
        )}

        {/* Botão de Editar */}
        {!isEditing && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setIsEditing(true)}
            aria-label="Editar tarefa"
            title="Editar tarefa"
          >
            <Edit2 size={15} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}

        {/* Excluir diretamente (aciona Toast Desfazer por 5 segundos) */}
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onDelete(task.id)}
          aria-label="Excluir tarefa"
          title="Excluir tarefa"
        >
          <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
};
