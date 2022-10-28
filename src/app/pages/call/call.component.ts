import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CallInvitation, CallService } from "@services/call.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-call",
  templateUrl: "./call.component.html",
  styleUrls: ["./call.component.css"],
})
export class CallComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  private isVideo = false;
  private isCaller = false;
  public myMediaStream = new MediaStream();
  public theirMediaStream = new MediaStream();
  private peerConnection = new RTCPeerConnection();
  public dataChannel: RTCDataChannel | null = null;
  private theirUid?: string;
  @ViewChild("myVideo")
  private myVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("theirVideo")
  private theirVideo!: ElementRef<HTMLVideoElement>;

  constructor(private callService: CallService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    [this.myVideo.nativeElement, this.theirVideo.nativeElement].forEach((video) =>
      video.addEventListener("loadedmetadata", () => video.play()),
    );
    this.myVideo.nativeElement.srcObject = this.myMediaStream;
    const paramsSub = this.route.queryParams.subscribe((params) => {
      this.isVideo = Boolean(Number(params["is-video"]));
      this.isCaller = !Boolean(Number(params["polite"]));
      this.preparePeerConnection();
    });
    const callSub = this.callService.watch().subscribe((invitation) => {
      if (this.isCaller) {
        this.theirUid = invitation.sender;
        this.makeOffer();
      }
      this.handleMessage(invitation.value, invitation.sender);
    });
    this.subscriptions.push(paramsSub, callSub);
  }

  ngOnDestroy(): void {
    this.peerConnection.close();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    [this.myMediaStream, this.theirMediaStream].forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    if (this.theirUid) this.callService.cleanUp(this.theirUid);
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

  private handleMessage: (invitation: CallInvitation["value"], theirUid: string) => Promise<void> = async (
    { candidate, description, offer, answer },
    theirUid,
  ) => {
    this.theirUid = theirUid;
    console.log("data received, ", candidate, description, offer, answer);
    if (offer) {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const desciption = this.peerConnection.localDescription;
      if (!desciption) throw TypeError("Local Description not set.");
      return this.callService.send(this.theirUid, { description, answer });
    }
    if (answer) {
      await this.peerConnection.setRemoteDescription(answer);
    }
    if (candidate) {
      await this.peerConnection.addIceCandidate(candidate);
    }
  };

  public async makeOffer() {
    if (!this.theirUid) throw TypeError("Their ID must be defined before making an Offer.");
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
    return this.getVideoStream().then((stream) => {
      this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
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
    this.theirVideo.nativeElement.srcObject ||= this.theirMediaStream;
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
