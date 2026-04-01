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
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/chw.png',
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const link = event.notification?.data?.link || event.notification?.data?.actionUrl;
  if (link) {
    event.waitUntil(self.clients.openWindow(link));
  }
});
