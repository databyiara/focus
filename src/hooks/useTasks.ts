import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task } from '../domain/types';
import { taskService } from '../services/taskService';

const SELECTED_TASK_KEY = 'focus_selected_task_id';

export type TaskTab = 'today' | 'all';
export type TaskFilter = 'all' | 'pending' | 'completed';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_TASK_KEY);
    } catch {
      return null;
    }
  });
  const [currentTab, setCurrentTab] = useState<TaskTab>('today');
  const [filter, setFilter] = useState<TaskFilter>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estado para Toast de "Desfazer exclusão" (5 segundos)
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega tarefas do IndexedDB
  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await taskService.getAll();
      setTasks(loaded);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Se a tarefa selecionada foi concluída ou deletada, desseleciona
  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find((t) => t.id === selectedTaskId);
      if (!found || found.isCompleted) {
        setSelectedTaskId(null);
        try {
          localStorage.removeItem(SELECTED_TASK_KEY);
        } catch {
          // ignore
        }
      }
    }
  }, [tasks, selectedTaskId]);

  const selectTask = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSelectedTaskId(null);
        try {
          localStorage.removeItem(SELECTED_TASK_KEY);
        } catch {
          // ignore
        }
        return;
      }

      const task = tasks.find((t) => t.id === id);
      if (task && !task.isCompleted) {
        setSelectedTaskId(id);
        try {
          localStorage.setItem(SELECTED_TASK_KEY, id);
        } catch {
          // ignore
        }
      }
    },
    [tasks]
  );

  const addTask = useCallback(
    async (title: string, estimatedPomodoros?: number, note?: string): Promise<Task> => {
      // Por padrão, tarefas criadas entram em "Hoje" se estiver na aba "today"
      const isToday = currentTab === 'today';
      const created = await taskService.create(title, estimatedPomodoros, note, isToday);
      setTasks((prev) => [...prev, created]);
      return created;
    },
    [currentTab]
  );

  const editTask = useCallback(async (task: Task): Promise<void> => {
    await taskService.update(task);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, []);

  const toggleComplete = useCallback(async (id: string): Promise<void> => {
    const updated = await taskService.toggleComplete(id);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }, []);

  const toggleToday = useCallback(async (id: string): Promise<void> => {
    const updated = await taskService.toggleToday(id);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }, []);

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      const taskToDelete = tasks.find((t) => t.id === id);
      if (!taskToDelete) return;

      await taskService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));

      if (selectedTaskId === id) {
        setSelectedTaskId(null);
        try {
          localStorage.removeItem(SELECTED_TASK_KEY);
        } catch {
          // ignore
        }
      }

      // Ativa o Toast de Desfazer por 5 segundos
      setLastDeletedTask(taskToDelete);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setLastDeletedTask(null);
      }, 5000);
    },
    [tasks, selectedTaskId]
  );

  const undoDelete = useCallback(async (): Promise<void> => {
    if (!lastDeletedTask) return;
    const taskToRestore = lastDeletedTask;
    setLastDeletedTask(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    await taskService.restore(taskToRestore);
    setTasks((prev) => [...prev, taskToRestore].sort((a, b) => a.order - b.order));
  }, [lastDeletedTask]);

  const dismissUndo = useCallback(() => {
    setLastDeletedTask(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  }, []);

  const reorderTasks = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      // Atualização otimista
      const taskMap = new Map(tasks.map((t) => [t.id, t]));
      const newOrderedList: Task[] = [];
      orderedIds.forEach((id, index) => {
        const item = taskMap.get(id);
        if (item) {
          newOrderedList.push({ ...item, order: index + 1 });
        }
      });

      // Inclui tarefas que não faziam parte da lista filtrada
      const unincluded = tasks.filter((t) => !orderedIds.includes(t.id));
      const fullList = [...newOrderedList, ...unincluded];

      setTasks(fullList);
      await taskService.reorder(orderedIds);
    },
    [tasks]
  );

  const incrementTaskPomodoros = useCallback(async (id: string): Promise<void> => {
    const updated = await taskService.incrementCompletedPomodoros(id);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }, []);

  // Tarefa selecionada ativa
  const selectedTask = tasks.find((t) => t.id === selectedTaskId && !t.isCompleted) || null;

  // Filtragem composta: Tab ("Hoje" vs "Todas") + Status ("Pendentes" / "Concluídas" / "Todas")
  const filteredTasks = tasks.filter((t) => {
    // 1. Filtro da Aba
    if (currentTab === 'today') {
      // Mostra tarefas explicitamente marcadas para hoje ou criadas hoje
      const isMarkedToday = t.isToday !== false;
      if (!isMarkedToday) return false;
    }

    // 2. Filtro de Status
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  return {
    tasks,
    filteredTasks,
    selectedTask,
    selectedTaskId,
    currentTab,
    setCurrentTab,
    filter,
    setFilter,
    isLoading,
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
  };
}
