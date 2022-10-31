import { CallObserver } from "./call-observer";

declare var self: ServiceWorkerGlobalScope;

importScripts("./ngsw-worker.js");

self.addEventListener("install", (event) => console.log("SW: Install Event", event));

const callObserver = new CallObserver();

callObserver.watchForInvitations().subscribe((invite) => {
  console.log("SW: Invitation", invite);
  self.registration.showNotification(`Incoming ${invite.isVideo ? "Video" : "Audio"} Call.`, {
    body: `Call from ${invite.sender}`,
    icon: "./assets/icons/icon-192x192.png",
  });
});
