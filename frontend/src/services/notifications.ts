/**
 * Notification Service for Habito
 * Handles push notifications, browser notifications, and notification scheduling
 */

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current notification permission state
   */
  getPermissionState(): NotificationPermissionState {
    if (!this.isSupported()) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      await this.initialize();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Convert subscription to format for backend
      const subscriptionJson = subscription.toJSON();
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        return null;
      }

      return {
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys.p256dh || '',
        auth: subscriptionJson.keys.auth || '',
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show a local notification (not push)
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = this.getPermissionState();
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }

  /**
   * Show a habit reminder notification
   */
  async showHabitReminder(habitName: string, message?: string): Promise<void> {
    await this.showNotification(`Reminder: ${habitName}`, {
      body: message || `Time to complete your "${habitName}" habit!`,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: `habit-reminder-${habitName}`,
      requireInteraction: false,
      actions: [
        { action: 'complete', title: 'Mark Complete' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Show daily summary notification
   */
  async showDailySummary(completedCount: number, totalCount: number): Promise<void> {
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    await this.showNotification('Daily Habit Summary', {
      body: `You've completed ${completedCount}/${totalCount} habits today (${percentage}%)`,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'daily-summary',
      requireInteraction: false,
    });
  }

  /**
   * Show streak break warning
   */
  async showStreakBreakWarning(habitName: string, streakLength: number): Promise<void> {
    await this.showNotification(`Streak at Risk! 🔥`, {
      body: `Your ${streakLength}-day streak for "${habitName}" is about to break. Complete it now!`,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: `streak-warning-${habitName}`,
      requireInteraction: true,
      actions: [
        { action: 'complete', title: 'Complete Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    });
  }

  /**
   * Schedule a notification (browser-based, not persisted)
   */
  scheduleNotification(
    title: string,
    options: NotificationOptions,
    delayMs: number
  ): number {
    return window.setTimeout(() => {
      this.showNotification(title, options);
    }, delayMs);
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(timerId: number): void {
    window.clearTimeout(timerId);
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();
