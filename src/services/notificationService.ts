class NotificationService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  public notifySessionFinished(title: string, body: string): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
        silent: true, // Já reproduzimos o som pelo soundService para controle preciso
      });
    } catch (err) {
      console.warn('Falha ao emitir notificação de sistema:', err);
    }
  }
}

export const notificationService = new NotificationService();
