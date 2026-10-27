import { describe, it, expect, beforeEach } from 'vitest';
import { PhraseEngine } from '../src/domain/phraseEngine';
import { PHRASES, type PhraseCategory } from '../src/data/phrases';

describe('PhraseEngine', () => {
  let engine: PhraseEngine;

  beforeEach(() => {
    engine = new PhraseEngine();
    engine.resetState();
  });

  it('possui pelo menos 12 frases em cada uma das 8 categorias', () => {
    const categories: PhraseCategory[] = [
      'antes_de_iniciar',
      'durante_foco',
      'fim_de_foco',
      'pausa_curta',
      'pausa_longa',
      'meta_batida',
      'retorno_apos_ausencia',
      'dia_dificil',
    ];

    expect(categories).toHaveLength(8);

    for (const cat of categories) {
      const phrases = PHRASES[cat];
      expect(phrases).toBeDefined();
      expect(phrases.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('percorre toda a lista de uma categoria sem repetições até esgotar', () => {
    const category: PhraseCategory = 'antes_de_iniciar';
    const totalPhrases = PHRASES[category].length;
    const drawn: string[] = [];

    for (let i = 0; i < totalPhrases; i++) {
      drawn.push(engine.getNextPhrase(category));
    }

    // Todas as frases do primeiro ciclo devem ser únicas
    const uniqueSet = new Set(drawn);
    expect(uniqueSet.size).toBe(totalPhrases);
  });

  it('nunca repete a mesma frase duas vezes seguidas, mesmo na transição de sacolas', () => {
    const category: PhraseCategory = 'durante_foco';
    const totalPhrases = PHRASES[category].length;
    let prevPhrase = '';

    // Roda múltiplos ciclos completos
    for (let i = 0; i < totalPhrases * 4; i++) {
      const current = engine.getNextPhrase(category);
      expect(current).not.toBe(prevPhrase);
      prevPhrase = current;
    }
  });
});
