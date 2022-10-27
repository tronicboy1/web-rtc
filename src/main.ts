import { SignalingChannel } from "./signaling-channel";
import "./style.css";
import "./components/register-username";
import "./components/invite-form";
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
  private theirMediaStream = new MediaStream();
  private peerConnection = new RTCPeerConnection();
  private signalingChannel: SignalingChannel;
  private ignoreOffer = false;
  //@ts-ignore
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
    { candidate, description, offer, answer },
    theirUsername
  ) => {
    this.theirUsername = theirUsername;
    console.log("Message received: ", candidate, description)
    if (offer) {
      console.log("Offer received", offer);
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const desciption = this.peerConnection.localDescription;
      if (!desciption) throw TypeError("Local Description not set.");
      return this.signalingChannel.send(this.theirUsername, { description, answer });
    }
    if (answer) {
      await this.peerConnection.setRemoteDescription(answer);
    }
    // if (description) {
    //   const offerCollision =
    //     description.type === "offer" && (this.makingOffer || this.peerConnection.signalingState !== "stable");
    //   console.log("offerCollision: ", offerCollision);
    //   this.ignoreOffer = !this.polite && offerCollision;
    //   if (this.ignoreOffer) return;

    //   console.log("Remote desciption");
    //   await this.peerConnection.setRemoteDescription(description);

    // }
    if (candidate) {
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
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signalingChannel.send(this.theirUsername, { description: this.peerConnection.localDescription!, offer });
    } catch (err) {
      console.error(err);
    } finally {
      this.makingOffer = false;
    }
  }

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  private preparePeerConnection() {
    return this.getVideoStream().then((stream) => {
      this.myVideo.srcObject = stream;
      this.theirVideo.srcObject = this.theirMediaStream;
      this.peerConnection = new RTCPeerConnection({ iceServers: WebRTC.iceServers });
      const tracks = stream.getTracks();
      tracks.forEach((track) => this.peerConnection.addTrack(track, stream));
      this.peerConnection.addEventListener("track", this.handleTrackEvent);
      this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent);
      this.peerConnection.addEventListener("signalingstatechange", () =>
        console.log("Signalling State: ", this.peerConnection.signalingState)
      );
    });
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    const { track, streams } = event;
    console.log("RTC Track added: ", track, streams);
    // track is initially muted, but becomes unmuted automatically when packets are received
    //track.addEventListener("unmute", () => {
    this.theirMediaStream.addTrack(track);
    //});
  };

  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    const { candidate } = event;
    if (!candidate) return;
    console.log("RTC - handleIceCandidate: ", event);
    if (!this.theirUsername) throw TypeError("Their username was undefined.");
    this.signalingChannel.send(this.theirUsername, { candidate });
  };
}

new Promise<string>((resolve) => {
  const username = window.localStorage.getItem("username");
  if (username) return resolve(username);
  window.addEventListener("username-registered", (event) => resolve(event.detail), { once: true });
}).then((username) => {
  const webRTC = new WebRTC(username);
  const inviteForm = document.querySelector("invite-form")!;
  inviteForm.addEventListener("invitation-sent", (event) => {
    webRTC.makeOffer(event.detail);
    webRTC.polite = false;
  });
});
