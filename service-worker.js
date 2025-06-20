// Make sure we're in a service worker environment
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.resolve(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.resolve(self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  const defaultData = {
    title: 'QBank Update',
    body: 'New activity recorded',
    icon: '/MarrowLeaderboard/images/marrow.png'
  };

  const data = event.data?.json() ?? defaultData;

  const options = {
    ...data,
    icon: data.icon || '/MarrowLeaderboard/images/marrow.png',
    badge: '/MarrowLeaderboard/images/marrow.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
