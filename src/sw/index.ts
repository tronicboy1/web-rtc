export default null;
declare var self: ServiceWorkerGlobalScope;

importScripts

self.addEventListener("install", (event) => console.log("SW: Install Event", event));
