import { CallObserver } from "./call-observer";
import type { CallQueryParameters } from "../app/app-routing.module";

declare var self: ServiceWorkerGlobalScope;

importScripts("./ngsw-worker.js");

self.addEventListener("install", (event) => console.log("SW: Install Event", event));

const callObserver = new CallObserver();

callObserver.watchForInvitations().subscribe((invite) => {
  console.log("SW: Invitation", invite);
  const url = new URL(self.location.origin);
  url.pathname = "/call";
  const parameters: CallQueryParameters = { "is-video": Number(invite.isVideo), "their-uid": invite.sender, polite: 0 };
  Object.entries(parameters).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  self.registration.showNotification(`Incoming ${invite.isVideo ? "Video" : "Audio"} Call.`, {
    body: `Call from ${invite.sender}`,
    icon: "./assets/icons/icon-192x192.png",
    data: url.toString(),
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  console.log("SW: Notification Click", event.notification.data);
  const callUrlString = event.notification.data;
  if (typeof callUrlString !== "string") throw TypeError("Notification must be url String.");
  const callUrlObject = new URL(callUrlString);
  const openWindowPromise = self.clients.matchAll({ type: "window" }).then((windows) => {
    const alreadyOpened = windows.some((window) => {
      const windowUrlObject = new URL(window.url);
      const uidIsEqual = windowUrlObject.searchParams.get("their-uid") === callUrlObject.searchParams.get("their-uid");
      return uidIsEqual && windowUrlObject.pathname === "/call";
    });
    console.log("SW: Notification, already opened?", alreadyOpened);
  });
  event.waitUntil(openWindowPromise);
});
