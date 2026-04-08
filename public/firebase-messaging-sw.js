/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

// Hardcoded web config (public values)
const firebaseConfig = {
  apiKey: "AIzaSyBH9ZPxmj6lxZEnoOHhVpihQIgiFBJoP_U",
  authDomain: "ebumenyi.firebaseapp.com",
  projectId: "ebumenyi",
  storageBucket: "ebumenyi.firebasestorage.app",
  messagingSenderId: "371691500641",
  appId: "1:371691500641:web:f52d597897b8bdd1be2620",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Ukwibutsa';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const type = payload.data?.type || '';

  const showNotification = () => {
    const notificationOptions = {
      body: notificationBody,
      icon: '/chw.png',
      badge: '/chw.png',
      tag: payload.data?.entityId || 'notification',
      renotify: true,
      requireInteraction: type === 'calendar_reminder',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: type === 'calendar_reminder' ? [
        { action: 'view', title: 'View Event' },
        { action: 'dismiss', title: 'Dismiss' }
      ] : [],
    };
    // Signal the page that FCM is handling this notification
    try {
      const channel = new BroadcastChannel('fcm_notification_channel');
      channel.postMessage({ type: 'FCM_HANDLED', entityId: payload.data?.entityId || 'notification' });
      channel.close();
    } catch (_) {}

    return self.registration.showNotification(notificationTitle, notificationOptions);
  };

  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (
        (client.url.includes('localhost') || client.url.includes('ebumenyi.online')) &&
        client.focused === true
      ) {
        // Tab is open and focused — socket handles this, skip OS notification
        return;
      }
    }
    // Tab is closed or hidden — show OS notification
    return showNotification();
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }
  
  const data = event.notification?.data || {};
  const deepLink = data.deepLink || data.link || data.actionUrl;
  
  let url = 'https://www.ebumenyi.online/dashboard/calendar';
  
  if (deepLink) {
    url = 'https://www.ebumenyi.online/dashboard' + deepLink;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app tab is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('ebumenyi.online') && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(url);
          }
          return;
        }
      }
      // Otherwise open new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});