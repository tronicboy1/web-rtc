import { CallObserver } from "./call-observer";

declare var self: ServiceWorkerGlobalScope;

importScripts("./ngsw-worker.js");

self.addEventListener("install", (event) => console.log("SW: Install Event", event));

const callObserver = new CallObserver();

callObserver.watchForInvitations().subscribe((invite) => {
  console.log("SW: Invitation", invite);
});
