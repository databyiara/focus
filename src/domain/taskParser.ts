export interface ParsedTaskInput {
  title: string;
  estimatedPomodoros?: number;
}

/**
 * Faz o parsing inteligente da entrada rápida de tarefas:
 * Suporta título normal ou com comando de estimativa no final (ex: "Ler capitulo /3" -> title: "Ler capitulo", estimatedPomodoros: 3).
 * Limita a estimativa entre 1 e 8 ciclos conforme especificação.
 */
export function parseTaskQuickInput(rawInput: string): ParsedTaskInput {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { title: '' };
  }

  // Detecta "/N" no final da string
  const match = trimmed.match(/^(.*?)\s*\/(\d+)\s*$/);
  if (match) {
    const titlePart = match[1].trim();
    const estNumber = parseInt(match[2], 10);
    if (titlePart && !Number.isNaN(estNumber)) {
      const clamped = Math.min(8, Math.max(1, estNumber));
      return {
        title: titlePart,
        estimatedPomodoros: clamped,
      };
    }
  }

  return { title: trimmed };
}
