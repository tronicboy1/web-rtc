import { Injectable } from "@angular/core";
import { FirebaseDatabase } from "@custom-firebase/inheritables/database";
import { set, ref as getRef, onValue } from "firebase/database";
import { filter, map, mergeMap, Observable, OperatorFunction, take } from "rxjs";
import { AuthService } from "./auth.service";
import { CallService } from "./call.service";

type Message = { sender: string; value: string; isVideo: boolean };
type ParsedMessage = {
  value: Content;
  sender: string;
  isVideo: boolean;
};
type Content = {
  description?: RTCSessionDescription;
  candidate?: RTCIceCandidate | null;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
};

@Injectable({
  providedIn: "root",
})
export class RtcService extends FirebaseDatabase {
  public myMediaStream!: MediaStream;
  public theirMediaStream!: MediaStream;
  private peerConnection!: RTCPeerConnection;
  public dataChannel: RTCDataChannel | null = null;
  private theirUid?: string;
  private isVideo = false;
  private controller = new AbortController();

  static path = "rtc";

  constructor(private callService: CallService, private authService: AuthService) {
    super();
    this.watch().subscribe((data) => {
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
    this.controller.abort();
    if (this.theirUid) {
      this.callService.cleanUp(this.theirUid).subscribe();
    }
    this.peerConnection.close();
    [this.myMediaStream, this.theirMediaStream].forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    this.callService.setMyReadyState(false).subscribe();
  }

  private observeRtcData() {
    return this.authService.getUid().pipe(
      filter((user) => user !== null) as OperatorFunction<string | null, string>,
      mergeMap(
        (uid) =>
          new Observable<Message | null>((observer) => {
            const ref = getRef(this.db, `${RtcService.path}/${uid}`);
            let unsubscribe = onValue(ref, (snapshot) => {
              const data = snapshot.val() as Message | null;
              observer.next(data);
            });
            return unsubscribe;
          }),
      ),
    );
  }

  /** Observers RTCPeerConnection Data sent to user through Firebase. */
  private watch(): Observable<ParsedMessage> {
    return this.observeRtcData().pipe(
      filter((message) => Boolean(message)) as OperatorFunction<Message | null, Message>,
      map((data) => {
        const parsedValue = JSON.parse(data.value) as Content;
        return { ...data, value: parsedValue };
      }),
    );
  }

  public watchForEndOfCall() {
    return this.observeRtcData().pipe(filter((message) => !Boolean(message)) as OperatorFunction<Message | null, null>);
  }

  /** Sends RTCPeerConnection Data through Firebase. */
  private send(theirUid: string, value: Content, isVideo: boolean) {
    if (!theirUid || typeof theirUid !== "string" || theirUid.length < 4)
      throw TypeError("Recipient must have an Id greater than 4 characters.");
    return this.authService
      .getUid()
      .pipe(take(1))
      .subscribe((uid) => {
        const message: Message = { sender: uid, value: JSON.stringify(value), isVideo };
        const ref = getRef(this.db, `${RtcService.path}/${theirUid}`);
        set(ref, message);
      });
  }

  private handleMessage = async (data: ParsedMessage) => {
    const { value, isVideo, sender } = data;
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
      this.send(this.theirUid, { description, answer }, this.isVideo);
      return;
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
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event), {
      signal: this.controller.signal,
    });
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening, { signal: this.controller.signal });
    await this.callService.send(theirUid, isVideo);
    this.callService
      .watchTheirReadyState(theirUid)
      .pipe(
        filter((state) => Boolean(state)),
        take(1),
      )
      .subscribe(async (_state) => {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.send(theirUid, { description: this.peerConnection.localDescription!, offer }, this.isVideo);
      });
  }

  private handleDataChannelOpening: EventListener = () => {
    console.log("Data Channel Opened");
  };

  private addTracks() {
    return this.getVideoStream().then((stream) => {
      const tracks = stream.getTracks();
      tracks.forEach((track) => this.peerConnection.addTrack(track, stream));
      this.peerConnection.addEventListener("track", this.handleTrackEvent, { signal: this.controller.signal });
      this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent, {
        signal: this.controller.signal,
      });
      this.peerConnection.addEventListener(
        "iceconnectionstatechange",
        () => console.log("Candidate state ", this.peerConnection.iceConnectionState),
        { signal: this.controller.signal },
      );
      this.peerConnection.addEventListener("datachannel", this.handleDataChannel, { signal: this.controller.signal });
    });
  }

  private getVideoStream() {
    return navigator.mediaDevices.getUserMedia({ video: this.isVideo, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => this.myMediaStream.addTrack(track));
      return stream;
    });
  }

  public async preparePeerConnection() {
    this.myMediaStream = new MediaStream();
    this.theirMediaStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnection.addEventListener("track", this.handleTrackEvent, { signal: this.controller.signal });
    this.peerConnection.addEventListener("icecandidate", this.handleIceCandidateEvent, {
      signal: this.controller.signal,
    });
    this.peerConnection.addEventListener("datachannel", this.handleDataChannel, { signal: this.controller.signal });
    this.callService.setMyReadyState(true).subscribe();
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
    this.send(this.theirUid, { candidate }, this.isVideo);
  };

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    this.dataChannel = event.channel;
    this.dataChannel.addEventListener("error", (event) => console.error("Data Channel Error", event), {
      signal: this.controller.signal,
    });
    this.dataChannel.addEventListener("open", this.handleDataChannelOpening, { signal: this.controller.signal });
  };
}
