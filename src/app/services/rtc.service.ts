import { Injectable } from "@angular/core";
import { CallInvitation, CallService } from "./call.service";

@Injectable({
  providedIn: "root",
})
export class RtcService {
  public myMediaStream = new MediaStream();
  public theirMediaStream = new MediaStream();
  private peerConnection = new RTCPeerConnection();
  public dataChannel: RTCDataChannel | null = null;
  private theirUid?: string;
  private isVideo = false;

  constructor(private callService: CallService) {
    this.preparePeerConnection();
    this.callService.watch().subscribe((data) => {
      this.handleMessage(data);
    });
  }

  /**
   * source: https://www.metered.ca/tools/openrelay/
   * The TURN servers are not necessary in most cases.
   */
  private iceServers = [
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

  public close() {
    if (this.theirUid) this.callService.cleanUp(this.theirUid);
    this.peerConnection.close();
    [this.myMediaStream, this.theirMediaStream].forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    this.preparePeerConnection();
  }

  private handleMessage: (data: CallInvitation) => Promise<void> = async ({ value, isVideo, sender }) => {
    this.theirUid = sender;
    this.isVideo = isVideo;
    const { offer, answer, candidate, description } = value;
    if (offer) {
      await this.addTracks();
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const desciption = this.peerConnection.localDescription;
      if (!desciption) throw TypeError("Local Description not set.");
      return this.callService.send(this.theirUid, { description, answer }, this.isVideo);
    }
    if (answer) {
      await this.peerConnection.setRemoteDescription(answer);
    }
    if (candidate) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch {
        console.log("Add ice candidate error was ignored.");
      }
    }
  };

  public async makeOffer(theirUid: string, isVideo: boolean) {
    this.theirUid = theirUid;
    this.isVideo = isVideo;
    await this.addTracks();
    this.dataChannel = this.peerConnection.createDataChannel("messages", { negotiated: false });
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event));
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening);
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.callService.send(this.theirUid, { description: this.peerConnection.localDescription!, offer }, this.isVideo);
  }

  private handleDataChannelOpening: EventListener = () => {
    console.log("Data Channel Opened");
  };

  private addTracks() {
    return this.getVideoStream().then((stream) => {
      const tracks = stream.getTracks();
      tracks.forEach((track) => this.peerConnection.addTrack(track, stream));
      this.peerConnection.addEventListener("track", this.handleTrackEvent);
      this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent);
      this.peerConnection.addEventListener("iceconnectionstatechange", () =>
        console.log("Candidate state ", this.peerConnection.iceConnectionState),
      );
      this.peerConnection.addEventListener("datachannel", this.handleDataChannel);
    });
  }

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: this.isVideo, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => this.myMediaStream.addTrack(track));
      return stream;
    });
  }

  private preparePeerConnection() {
    this.myMediaStream = new MediaStream();
    this.theirMediaStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnection.addEventListener("track", this.handleTrackEvent);
    this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent);
    this.peerConnection.addEventListener("iceconnectionstatechange", () =>
      console.log("Candidate state ", this.peerConnection.iceConnectionState),
    );
    this.peerConnection.addEventListener("datachannel", this.handleDataChannel);
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
    if (!this.theirUid) throw TypeError("Their username was undefined.");
    this.callService.send(this.theirUid, { candidate }, this.isVideo);
  };

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    this.dataChannel = event.channel;
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event));
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening);
  };
}
