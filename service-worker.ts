/// <reference lib="webworker" />
/// <reference lib="dom" />

// Define interfaces for our custom events
interface ExtendedInstallEvent extends ExtendableEvent {
    waitUntil(fn: Promise<any>): void;
  }
  
  interface ExtendedActivateEvent extends ExtendableEvent {
    waitUntil(fn: Promise<any>): void;
  }
  
  interface ExtendedPushEvent extends PushEvent {
      waitUntil(fn: Promise<any>): void;
      data: PushMessageData | null;
    }
  
  interface ExtendedNotificationEvent extends NotificationEvent {
    waitUntil(fn: Promise<any>): void;
    notification: Notification;
  }
  
  // Make sure we're in a service worker environment
  declare const self: ServiceWorkerGlobalScope;
  
  // Install event handler
  self.addEventListener('install', ((event: ExtendedInstallEvent) => {
    event.waitUntil(
      Promise.resolve(self.skipWaiting())
    );
  }) as EventListener);
  
  // Activate event handler
  self.addEventListener('activate', ((event: ExtendedActivateEvent) => {
    event.waitUntil(
      Promise.resolve(self.clients.claim())
    );
  }) as EventListener);
  
  // Push event handler
  self.addEventListener('push', ((event: ExtendedPushEvent) => {
    const defaultData = {
      title: 'QBank Update',
      body: 'New activity recorded',
      icon: '/assets/marrow.png'
    };
  
    const data = event.data?.json() ?? defaultData;
  
    const options: NotificationOptions = {
      ...data,
      icon: data.icon || '/assets/marrow.png',
      badge: '/assets/marrow.png',
      vibrate: [200, 100, 200]
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }) as EventListener);
  
  // Notification click event handler
  self.addEventListener('notificationclick', ((event: ExtendedNotificationEvent) => {
    event.notification.close();
  
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clientList: readonly WindowClient[]) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return self.clients.openWindow('/');
        })
    );
  }) as EventListener);
  
  // Export empty object to satisfy TypeScript module requirements
  export {};