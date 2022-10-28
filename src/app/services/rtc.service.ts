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

  constructor(private callService: CallService) {
    this.preparePeerConnection();
    this.callService.watch().subscribe((data) => {
      this.handleMessage(data.value, data.sender);
    });
    console.log("Rtc Service Started");
  }

  /**
   * source: https://www.metered.ca/tools/openrelay/
   * The TURN servers are not necessary in most cases.
   */
  private iceServers = [
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

  public close() {
    if (this.theirUid) this.callService.cleanUp(this.theirUid);
    this.peerConnection.close();
    [this.myMediaStream, this.theirMediaStream].forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    this.preparePeerConnection();
  }

  private handleMessage: (invitation: CallInvitation["value"], theirUid: string) => Promise<void> = async (
    { candidate, description, offer, answer },
    theirUid,
  ) => {
    this.theirUid = theirUid;
    console.log("RTC SERVICE: Message", this.peerConnection.connectionState);
    if (offer) {
      console.log("RTC SERVICE: Offer", offer);
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const desciption = this.peerConnection.localDescription;
      if (!desciption) throw TypeError("Local Description not set.");
      return this.callService.send(this.theirUid, { description, answer });
    }
    if (answer) {
      console.log("RTC SERVICE: Answer", answer);
      await this.peerConnection.setRemoteDescription(answer);
    }
    if (candidate) {
      console.log("RTC SERVICE: Candidate", candidate);
      await this.peerConnection.addIceCandidate(candidate);
    }
  };

  public async makeOffer(theirUid: string) {
    this.theirUid = theirUid;
    this.dataChannel = this.peerConnection.createDataChannel("messages", { negotiated: false });
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event));
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening);
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.callService.send(this.theirUid, { description: this.peerConnection.localDescription!, offer });
  }

  private handleDataChannelOpening: EventListener = () => {
    console.log("Data Channel Opened");
  };

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => this.myMediaStream.addTrack(track));
      return stream;
    });
  }

  private preparePeerConnection() {
    this.myMediaStream = new MediaStream();
    this.theirMediaStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
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
    this.callService.send(this.theirUid, { candidate });
  };

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    console.log("DataChannel Event", event);
    this.dataChannel = event.channel;
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event));
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening);
  };
}
