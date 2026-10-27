class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  private shouldBeActive = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.shouldBeActive) {
          this.acquire();
        }
      });
    }
  }

  public async acquire(): Promise<boolean> {
    this.shouldBeActive = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      if (!this.sentinel || this.sentinel.released) {
        this.sentinel = await navigator.wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
        });
      }
      return true;
    } catch {
      // Navegadores podem rejeitar wake lock por nível baixo de bateria ou janela não ativa
      return false;
    }
  }

  public release(): void {
    this.shouldBeActive = false;
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {
        // noop
      }
      this.sentinel = null;
    }
  }
}

export const wakeLockService = new WakeLockService();
