import "./style.css";
import "./components/register-username";
import "./components/invite-form";
import "webrtc-adapter";
import { WebRTC } from "./web-rtc";

new Promise<string>((resolve) => {
  const username = window.localStorage.getItem("username");
  if (username) return resolve(username);
  window.addEventListener("username-registered", (event) => resolve(event.detail), { once: true });
}).then((username) => {
  const webRTC = new WebRTC(username);
  const inviteForm = document.querySelector("invite-form")!;
  inviteForm.addEventListener("invitation-sent", (event) => {
    webRTC.makeOffer(event.detail);
  });
});
