import { css, html, LitElement } from "lit";
import { query, customElement } from "lit/decorators.js";
import { globalStyles } from "./components/shared";
import { SignalingChannel } from "./signaling-channel";

export const tagName = "web-rtc";

@customElement(tagName)
export class WebRTC extends LitElement {
  /**
   * source: https://www.metered.ca/tools/openrelay/
   * The TURN servers are not necessary in most cases.
   */
  static iceServers = [
    // {
    //   urls: "stun:openrelay.metered.ca:80",
    // },
    // {
    //   urls: "turn:openrelay.metered.ca:80",
    //   username: "openrelayproject",
    //   credential: "openrelayproject",
    // },
    // {
    //   urls: "turn:openrelay.metered.ca:443",
    //   username: "openrelayproject",
    //   credential: "openrelayproject",
    // },
    // {
    //   urls: "turn:openrelay.metered.ca:443?transport=tcp",
    //   username: "openrelayproject",
    //   credential: "openrelayproject",
    // },
  ];

  private myMediaStream = new MediaStream();
  private theirMediaStream = new MediaStream();
  private peerConnection = new RTCPeerConnection();
  private signalingChannel: SignalingChannel;
  public theirUsername: string | undefined;
  @query("video#my-video")
  private myVideo!: HTMLVideoElement;
  @query("video#their-video")
  private theirVideo!: HTMLVideoElement;

  constructor(private username: string) {
    super();
    this.signalingChannel = new SignalingChannel(this.username);
    this.preparePeerConnection();
    this.signalingChannel.subscribe(this.handleMessage);
  }

  firstUpdated() {
    this.myVideo.srcObject = this.myMediaStream;
    [this.myVideo, this.theirVideo].forEach((video) => video.addEventListener("loadedmetadata", () => video.play()));
  }

  private handleMessage: Parameters<InstanceType<typeof SignalingChannel>["subscribe"]>[0] = async (
    { candidate, description, offer, answer },
    theirUsername
  ) => {
    this.theirUsername = theirUsername;
    if (offer) {
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
    if (candidate) {
      await this.peerConnection.addIceCandidate(candidate);
    }
  };

  public async makeOffer(theirUsername: string) {
    this.theirUsername = theirUsername;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalingChannel.send(this.theirUsername, { description: this.peerConnection.localDescription!, offer });
  }

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => this.myMediaStream.addTrack(track));
      return stream;
    });
  }

  private preparePeerConnection() {
    return this.getVideoStream().then((stream) => {
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
    const { track } = event;
    this.theirVideo.srcObject ||= this.theirMediaStream;
    // track is initially muted, but becomes unmuted automatically when packets are received
    track.addEventListener("unmute", () => {
      this.theirMediaStream.addTrack(track);
    });
  };

  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    const { candidate } = event;
    if (!candidate) return;
    if (!this.theirUsername) throw TypeError("Their username was undefined.");
    this.signalingChannel.send(this.theirUsername, { candidate });
  };

  static styles = [
    globalStyles,
    css`
      video {
        height: auto;
        width: auto;
        max-width: 100%;
      }

      #their-box {
        flex: 0 0 80%;
      }

      #my-box {
        flex: 1 1;
      }

      #video-box {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        margin: 1rem auto;
        max-height: 80vh;
        padding: 1rem;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.112);
        border-radius: 4px;
      }
    `,
  ];

  render() {
    return html`<div id="video-box">
      <div id="their-box">
        <p>Their Video</p>
        <video id="their-video" playsinline autoplay></video>
      </div>
      <div id="my-box">
        <p>My Video</p>
        <video id="my-video" muted playsinline autoplay></video>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: WebRTC;
  }
}
