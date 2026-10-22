// Must be registered BEFORE importScripts, so it runs before the Beams click handler
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const path = event.notification.data?.path || "/messages";

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    if (windows.length > 0) {
      await windows[0].focus();
      windows[0].postMessage({action: "open", path});
    } else {
      await self.clients.openWindow(new URL(path, self.location.origin).href);
    }
  })());
});

// proper initialization
if ('function' === typeof importScripts) {
  /* eslint-disable no-undef */
  importScripts("https://js.pusher.com/beams/service-worker.js");
}

PusherPushNotifications.onNotificationReceived = ({pushEvent, payload}) => {
  console.log("worker got : " + JSON.stringify(payload));

  // Tell the open tabs to refresh their data
  self.clients.matchAll().then((matchedClient) => matchedClient.forEach(client => {
    client.postMessage(payload.data);
  }));

  // We show the notification ourselves, so that its data contains the path to open on click
  const {title, body, icon} = payload.notification;
  pushEvent.waitUntil(self.registration.showNotification(title, {
    body,
    icon,
    data: {path: payload.data.path},
  }));
};
