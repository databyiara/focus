import { describe, it, expect, beforeEach } from 'vitest';
import { taskService } from '../src/services/taskService';
import { getStorage } from '../src/services/storage';

describe('TaskService & Storage (Etapa 4)', () => {
  beforeEach(async () => {
    const storage = await getStorage();
    await storage.clearAll();
  });

  it('deve criar uma tarefa com estimativa válida e recuperar do armazenamento', async () => {
    const created = await taskService.create('Implementar testes unitários', 4);
    expect(created.id).toBeDefined();
    expect(created.title).toBe('Implementar testes unitários');
    expect(created.estimatedPomodoros).toBe(4);
    expect(created.completedPomodoros).toBe(0);
    expect(created.isCompleted).toBe(false);
    expect(created.isToday).toBe(true);

    const all = await taskService.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('deve limitar a estimativa de ciclos entre 1 e 8', async () => {
    const taskMax = await taskService.create('Tarefa Grande', 50);
    expect(taskMax.estimatedPomodoros).toBe(8);

    const taskMin = await taskService.create('Tarefa Pequena', 0);
    expect(taskMin.estimatedPomodoros).toBe(1);
  });

  it('suporta parsing rápido de /N no título', async () => {
    const task = await taskService.create('Revisar capítulo 4 /3');
    expect(task.title).toBe('Revisar capítulo 4');
    expect(task.estimatedPomodoros).toBe(3);
  });

  it('deve alternar status concluído/reaberto e Hoje/Todas', async () => {
    const task = await taskService.create('Tarefa para alternar');
    expect(task.isCompleted).toBe(false);

    const completed = await taskService.toggleComplete(task.id);
    expect(completed?.isCompleted).toBe(true);

    const reopened = await taskService.toggleComplete(task.id);
    expect(reopened?.isCompleted).toBe(false);

    const toggledToday = await taskService.toggleToday(task.id);
    expect(toggledToday?.isToday).toBe(false);
  });

  it('deve atualizar o nome, estimativa e observação de uma tarefa', async () => {
    const task = await taskService.create('Nome original', 2);
    await taskService.update({
      ...task,
      title: 'Nome atualizado',
      estimatedPomodoros: 3,
      note: 'Revisar seções A e B',
    });

    const all = await taskService.getAll();
    expect(all[0].title).toBe('Nome atualizado');
    expect(all[0].estimatedPomodoros).toBe(3);
    expect(all[0].note).toBe('Revisar seções A e B');
  });

  it('deve excluir e restaurar (Desfazer) uma tarefa', async () => {
    const task = await taskService.create('Tarefa a ser deletada');
    await taskService.delete(task.id);

    let all = await taskService.getAll();
    expect(all).toHaveLength(0);

    // Desfazer / restaurar
    await taskService.restore(task);
    all = await taskService.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(task.id);
  });

  it('deve reordenar tarefas preservando nova ordem', async () => {
    const t1 = await taskService.create('Tarefa 1');
    const t2 = await taskService.create('Tarefa 2');
    const t3 = await taskService.create('Tarefa 3');

    // Reordena para t3, t1, t2
    await taskService.reorder([t3.id, t1.id, t2.id]);
    const all = await taskService.getAll();

    expect(all[0].id).toBe(t3.id);
    expect(all[1].id).toBe(t1.id);
    expect(all[2].id).toBe(t2.id);
  });
});
