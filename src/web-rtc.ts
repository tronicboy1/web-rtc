import { SignalingChannel } from "./signaling-channel";

export class WebRTC {
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
    const { track } = event;
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
}
