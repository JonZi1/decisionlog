const NOTIFICATIONS_KEY = 'decision-log-notifications-enabled';

export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function areNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_KEY) === 'true';
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_KEY, enabled ? 'true' : 'false');
}

export function showNotification(title: string, body: string, onClick?: () => void): void {
  if (!areNotificationsSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/vite.svg',
    tag: 'decision-log-review',
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}

export function checkAndNotifyDueReviews(dueCount: number): void {
  if (!areNotificationsEnabled()) return;
  if (dueCount === 0) return;

  showNotification(
    'Decision Reviews Due',
    `You have ${dueCount} decision${dueCount > 1 ? 's' : ''} ready for review.`,
    () => {
      window.location.href = '/';
    }
  );
}
