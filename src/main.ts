import "./style.css";
import "./components/register-username";
import "./components/invite-form";
import "./web-rtc";
import { WebRTC } from "./web-rtc";
import { MessageBox } from "./components/message-box";

new Promise<string>((resolve) => {
  const username = window.localStorage.getItem("username");
  if (username) return resolve(username);
  window.addEventListener("username-registered", (event) => resolve(event.detail), { once: true });
}).then((username) => {
  const webRTC = new WebRTC(username);

  const body = document.querySelector("body")!;
  body.append(webRTC);
  const inviteForm = document.querySelector("invite-form")!;
  inviteForm.myUsername = username;
  inviteForm.show = true;
  inviteForm.addEventListener("invitation-sent", (event) => {
    webRTC.makeOffer(event.detail);
  });

  let messageBox: MessageBox;
  webRTC.addEventListener("datachannelopen", () => {
    const { dataChannel } = webRTC;
    if (!dataChannel) throw TypeError("Data Channel should not be null.");
    if (messageBox) {
      body.removeChild(messageBox);
    }
    messageBox = new MessageBox(username, dataChannel);
    body.append(messageBox);
  });
});
