import { SignalingChannel } from "./signaling-channel";
import "./style.css";
import "./components/register-username";
import "webrtc-adapter";

class WebRTC {
  /** source: https://www.metered.ca/tools/openrelay/ */
  static iceServers = [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  private myVideo = document.createElement("video");
  private theirVideo = document.createElement("video");
  private peerConnection = new RTCPeerConnection();
  private signalingChannel: SignalingChannel;
  private ignoreOffer = false;
  private makingOffer = false;
  public polite = true;
  public theirUsername: string | undefined;

  constructor(private username: string) {
    this.signalingChannel = new SignalingChannel(this.username);
    this.myVideo = document.querySelector<HTMLVideoElement>("video#my-video")!;
    this.theirVideo = document.querySelector<HTMLVideoElement>("video#their-video")!;
    [this.myVideo, this.theirVideo].forEach((video) => video.addEventListener("loadedmetadata", () => video.play()));
    this.preparePeerConnection();
    this.signalingChannel.subscribe(this.handleMessage);
  }

  private handleMessage: Parameters<InstanceType<typeof SignalingChannel>["subscribe"]>[0] = async (
    { candidate, description },
    theirUsername
  ) => {
    this.theirUsername = theirUsername;
    if (description) {
      const offerCollision =
        description.type === "offer" && (this.makingOffer || this.peerConnection.signalingState !== "stable");
      console.log("offerCollision: ", offerCollision);
      this.ignoreOffer = !this.polite && offerCollision;
      if (this.ignoreOffer) return;

      console.log("Remote desciption");
      await this.peerConnection.setRemoteDescription(description);
      if (description.type === "offer") {
        await this.peerConnection.setLocalDescription();
        console.log("Offer received");
        const desciption = this.peerConnection.localDescription;
        if (!desciption) throw TypeError("Local Description not set.");
        this.signalingChannel.send(this.theirUsername, { description });
      }
    } else if (candidate) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err) {
        if (!this.ignoreOffer) {
          throw err;
        }
      }
    }
  };

  public async makeOffer(theirUsername: string) {
    this.theirUsername = theirUsername;
    try {
      this.makingOffer = true;
      await this.peerConnection.setLocalDescription();
      this.signalingChannel.send(this.theirUsername, { description: this.peerConnection.localDescription! });
    } catch (err) {
      console.error(err);
    } finally {
      this.makingOffer = false;
    }
  }

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  private preparePeerConnection() {
    return this.getVideoStream().then((stream) => {
      this.myVideo.srcObject = stream;
      this.peerConnection = new RTCPeerConnection({ iceServers: WebRTC.iceServers });
      const tracks = stream.getTracks();
      tracks.forEach((track) => this.peerConnection.addTrack(track));
      this.peerConnection.addEventListener("track", this.handleTrackEvent);
      this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent);
      console.log("Peer Connection prepped.", this.peerConnection);
    });
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    const { track, streams } = event;
    console.log("RTC Track added: ", track, streams);
    // track is initially muted, but becomes unmuted automatically when packets are received
    track.addEventListener("unmute", () => {
      if (this.theirVideo.srcObject) return;
      this.theirVideo.srcObject = streams[0];
    });
  };

  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    const { candidate } = event;
    console.log("RTC - handleIceCandidate: ", event);
    if (!this.theirUsername) throw TypeError("Their username was undefined.");
    this.signalingChannel.send(this.theirUsername, { candidate });
  };
}

const button = document.querySelector("button")!;
new Promise<string>((resolve) => {
  const username = window.localStorage.getItem("username");
  if (username) return resolve(username);
  window.addEventListener("username-registered", (event) => resolve(event.detail), { once: true });
}).then((username) => {
  const webRTC = new WebRTC(username);
  button.addEventListener("click", () => {
    webRTC.makeOffer("test");
    webRTC.polite = false;
  });
});
