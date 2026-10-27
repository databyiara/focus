class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Reproduz um sino suave de conclusão de ciclo usando Web Audio API.
   * @param volumePercent Volume de 0 a 100
   */
  public playSessionEndBeep(volumePercent = 70): void {
    if (volumePercent <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterScale = Math.max(0.01, Math.min(1, volumePercent / 100));

      // Frequência fundamental suave (528 Hz - tom meditativo)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      gain1.gain.setValueAtTime(0.25 * masterScale, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.85);

      // Segundo tom harmônico suave (792 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(792, now + 0.08);
      gain2.gain.setValueAtTime(0.18 * masterScale, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.95);

      // Terceiro tom cristalino para brilho e clareza (1056 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1056, now + 0.16);
      gain3.gain.setValueAtTime(0.12 * masterScale, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 1.1);
    } catch (err) {
      console.warn('Não foi possível reproduzir som de notificação:', err);
    }
  }

  /**
   * Teste de áudio para tela de Ajustes
   */
  public playTestSound(volumePercent = 70): void {
    this.playSessionEndBeep(volumePercent);
  }
}

export const soundService = new SoundService();
