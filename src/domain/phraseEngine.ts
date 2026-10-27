import { PHRASES, type PhraseCategory } from '../data/phrases';

interface CategoryPoolState {
  remainingIndices: number[];
  lastPhrase: string | null;
}

const STORAGE_KEY = 'focus_phrase_engine_state_v1';

export class PhraseEngine {
  private state: Partial<Record<PhraseCategory, CategoryPoolState>> = {};

  constructor(initialState?: Partial<Record<PhraseCategory, CategoryPoolState>>) {
    if (initialState) {
      this.state = initialState;
    } else {
      this.loadState();
    }
  }

  private loadState(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.state = JSON.parse(raw);
        }
      }
    } catch {
      this.state = {};
    }
  }

  private saveState(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Falha silenciosa caso o armazenamento esteja restrito
    }
  }

  /**
   * Embaralha um array de índices de forma determinística/aleatória
   */
  private shuffleArray(array: number[]): number[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Obtém a próxima frase da categoria respeitando:
   * 1. Sem repetição até esgotar a lista (shuffle bag)
   * 2. Nunca repete a mesma frase duas vezes seguidas na transição de sacola
   */
  public getNextPhrase(category: PhraseCategory): string {
    const phrases = PHRASES[category];
    if (!phrases || phrases.length === 0) {
      return '';
    }

    let catState = this.state[category];
    if (!catState) {
      catState = {
        remainingIndices: [],
        lastPhrase: null,
      };
      this.state[category] = catState;
    }

    // Se a sacola esvaziou, reabastece e embaralha
    if (catState.remainingIndices.length === 0) {
      const allIndices = phrases.map((_, i) => i);
      let shuffled = this.shuffleArray(allIndices);

      // Garante que a primeira da nova sacola não seja idêntica à última exibida
      if (
        phrases.length > 1 &&
        catState.lastPhrase !== null &&
        phrases[shuffled[0]] === catState.lastPhrase
      ) {
        // Troca a primeira com a última ou penúltima posição
        const swapTarget = shuffled.length - 1;
        [shuffled[0], shuffled[swapTarget]] = [shuffled[swapTarget], shuffled[0]];
      }

      catState.remainingIndices = shuffled;
    }

    const nextIndex = catState.remainingIndices.shift()!;
    const chosenPhrase = phrases[nextIndex];

    catState.lastPhrase = chosenPhrase;
    this.saveState();

    return chosenPhrase;
  }

  /**
   * Retorna a última frase obtida da categoria ou sorteia a primeira
   */
  public getCurrentOrNext(category: PhraseCategory): string {
    const catState = this.state[category];
    if (catState?.lastPhrase) {
      return catState.lastPhrase;
    }
    return this.getNextPhrase(category);
  }

  /**
   * Reseta o histórico de sacolas (útil para testes ou limpeza)
   */
  public resetState(): void {
    this.state = {};
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // noop
    }
  }
}

// Instância singleton padrão para a aplicação
export const phraseEngine = new PhraseEngine();
