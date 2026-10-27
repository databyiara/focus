import { getStorage } from './storage';
import type { Task } from '../domain/types';
import { parseTaskQuickInput } from '../domain/taskParser';

export const taskService = {
  async getAll(): Promise<Task[]> {
    const storage = await getStorage();
    return storage.getTasks();
  },

  async create(
    rawTitle: string,
    explicitEstimate?: number,
    note?: string,
    isToday: boolean = true
  ): Promise<Task> {
    const parsed = parseTaskQuickInput(rawTitle);
    const finalTitle = parsed.title;
    if (!finalTitle) {
      throw new Error('O título da tarefa não pode ser vazio.');
    }

    // Estimativa explicitamente passada ou extraída via /N
    const rawEstimate = explicitEstimate ?? parsed.estimatedPomodoros;
    let validEstimate: number | undefined = undefined;
    if (rawEstimate !== undefined && !Number.isNaN(rawEstimate)) {
      validEstimate = Math.min(8, Math.max(1, Math.round(rawEstimate)));
    }

    const storage = await getStorage();
    const existing = await storage.getTasks();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) + 1 : 1;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: finalTitle,
      estimatedPomodoros: validEstimate,
      completedPomodoros: 0,
      isCompleted: false,
      order: nextOrder,
      createdAt: Date.now(),
      note: note?.trim() || undefined,
      isToday,
    };

    await storage.saveTask(newTask);
    return newTask;
  },

  async update(updatedTask: Task): Promise<void> {
    const trimmedTitle = updatedTask.title.trim();
    if (!trimmedTitle) {
      throw new Error('O título da tarefa não pode ser vazio.');
    }

    let validEstimate: number | undefined = undefined;
    if (
      updatedTask.estimatedPomodoros !== undefined &&
      !Number.isNaN(updatedTask.estimatedPomodoros)
    ) {
      validEstimate = Math.min(8, Math.max(1, Math.round(updatedTask.estimatedPomodoros)));
    }

    const storage = await getStorage();
    await storage.saveTask({
      ...updatedTask,
      title: trimmedTitle,
      estimatedPomodoros: validEstimate,
      note: updatedTask.note?.trim() || undefined,
    });
  },

  async toggleComplete(id: string): Promise<Task | null> {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      isCompleted: !task.isCompleted,
    };

    await storage.saveTask(updated);
    return updated;
  },

  async toggleToday(id: string): Promise<Task | null> {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      isToday: !task.isToday,
    };

    await storage.saveTask(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const storage = await getStorage();
    await storage.deleteTask(id);
  },

  /**
   * Restaura uma tarefa excluída (usado no Desfazer)
   */
  async restore(task: Task): Promise<void> {
    const storage = await getStorage();
    await storage.saveTask(task);
  },

  /**
   * Reordena as tarefas atualizando o campo `order` conforme o novo arranjo
   */
  async reorder(orderedIds: string[]): Promise<void> {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const task = taskMap.get(id);
      if (task) {
        task.order = i + 1;
        await storage.saveTask(task);
      }
    }
  },

  async incrementCompletedPomodoros(id: string): Promise<Task | null> {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      completedPomodoros: task.completedPomodoros + 1,
    };

    await storage.saveTask(updated);
    return updated;
  },
};
