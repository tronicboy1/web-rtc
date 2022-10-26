import { SignalingChannel } from "./signaling-channel";
import "./style.css";

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
  private signalingChannel = new SignalingChannel();
  private ignoreOffer = false;
  private makingOffer = false;
  private polite = true;

  constructor() {
    this.myVideo = document.querySelector<HTMLVideoElement>("video#my-video")!;
    this.theirVideo = document.querySelector<HTMLVideoElement>("video#their-video")!;
    [this.myVideo, this.theirVideo].forEach((video) => video.addEventListener("loadedmetadata", () => video.play()));
    this.preparePeerConnection();
    this.signalingChannel.subscribe(this.handleMessage);
    this.makeOffer();
  }

  private handleMessage: Parameters<InstanceType<typeof SignalingChannel>["subscribe"]>[0] = async ({
    candidate,
    description,
  }) => {
    try {
      if (description) {
        const offerCollision =
          description.type === "offer" && (this.makingOffer || this.peerConnection.signalingState !== "stable");

        this.ignoreOffer = !this.polite && offerCollision;
        if (this.ignoreOffer) return;

        await this.peerConnection.setRemoteDescription(description);
        if (description.type === "offer") {
          await this.peerConnection.setLocalDescription();
          this.signalingChannel.send({ description: this.peerConnection.localDescription! });
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
    } catch (err) {
      console.error(err);
    }
  };

  private async makeOffer() {
    try {
      this.makingOffer = true;
      await this.peerConnection.setLocalDescription();
      this.signalingChannel.send({ description: this.peerConnection.localDescription! });
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
    console.log("RTC Track added: ", track);
    // track is initially muted, but becomes unmuted automatically when packets are received
    track.addEventListener("unmute", () => {
      if (this.theirVideo.srcObject) return;
      this.theirVideo.srcObject = streams[0];
    });
  };

  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    const { candidate } = event;
    if (!candidate) throw TypeError();
    this.signalingChannel.send({ candidate });
  };
}

new WebRTC();
