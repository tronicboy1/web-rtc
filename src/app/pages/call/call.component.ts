import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RtcService } from "@services/rtc.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-call",
  templateUrl: "./call.component.html",
  styleUrls: ["./call.component.css"],
})
export class CallComponent implements OnInit {
  public isVideo = false;
  private subscriptions: Subscription[] = [];
  @ViewChild("myVideo")
  private myVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("theirVideo")
  private theirVideo!: ElementRef<HTMLVideoElement>;

  constructor(private route: ActivatedRoute, private rtcService: RtcService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    [this.myVideo.nativeElement, this.theirVideo.nativeElement].forEach((video) =>
      video.addEventListener("loadedmetadata", () => video.play()),
    );
    this.myVideo.nativeElement.srcObject = this.rtcService.myMediaStream;
    this.theirVideo.nativeElement.srcObject = this.rtcService.theirMediaStream;
    const paramsSub = this.route.queryParams.subscribe((params) => {
      this.isVideo = Boolean(Number(params["is-video"]));
      const isCaller = !Boolean(Number(params["polite"]));
      const theirUid = params["their-uid"];
      if (isCaller) {
        this.rtcService.makeOffer(theirUid, this.isVideo);
      }
    });
    this.subscriptions.push(paramsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.rtcService.close();
  }
}
