export function triggerDesktopNotification(title, body, options = {}) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, ...options });
    } catch (e) {
      console.warn('Failed to trigger notification', e);
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        try {
          new Notification(title, { body, ...options });
        } catch (e) {
          console.warn('Failed to trigger notification', e);
        }
      }
    });
  }
}
