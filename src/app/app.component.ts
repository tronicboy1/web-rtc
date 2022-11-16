import { Component, OnDestroy, OnInit } from "@angular/core";
import { ChildrenOutletContexts, Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { CallService } from "@services/call.service";
import { UserService, UserStatus } from "@services/user.service";
import { mergeMap, Subscription, take } from "rxjs";
import { CallQueryParameters } from "./app-routing.module";
import "@web-components/base-modal";
import { RtcService } from "@services/rtc.service";
// import { slideInAnimation } from "./animations";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  /** Not sure animations are any good here. Will keep for reference. */
  // animations: [slideInAnimation],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "angular";
  public isAuth = false;
  private subscritions: Subscription[] = [];
  private incomingCallSubscription = new Subscription();
  /** Opens modal if has incoming call. */
  public incomingCall?: CallQueryParameters & { email: string };
  get incomingCallTitle(): string {
    if (!this.incomingCall) return "";
    return `Accept ${this.incomingCall?.["is-video"] ? "video" : "audio"} call from ${this.incomingCall.email}?`;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private callService: CallService,
    private userService: UserService,
    private rtcService: RtcService,
    private contexts: ChildrenOutletContexts,
  ) {}

  ngOnInit() {
    /** Set ready state to false */
    this.callService.setMyReadyState(false).subscribe();
    /** Get permission for notifications */
    if ("serviceWorker" in navigator && typeof Notification !== "undefined") {
      Notification.requestPermission();
    }
    /** navigate back to contacts on end of call */
    this.subscritions.push(
      this.rtcService.watchForEndOfCall().subscribe(() => {
        this.incomingCall = undefined;
        this.router.navigateByUrl("/contacts");
      }),
    );
    this.subscritions.push(
      this.authService.getAuthState().subscribe((user) => {
        this.isAuth = Boolean(user);
        if (!user) return this.handleSignOut();
      }),
    );
    this.subscribeToIncomingCalls();

    /** Set user status to online */
    this.setUserStatus("online");
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.subscritions.forEach((sub) => sub.unsubscribe());
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    const { visibilityState } = document;
    switch (visibilityState) {
      case "hidden":
        this.setUserStatus("away");
        this.incomingCallSubscription.unsubscribe();
        break;
      case "visible":
        this.setUserStatus("online");
        this.subscribeToIncomingCalls();
        break;
    }
  };

  private setUserStatus(status: UserStatus) {
    this.authService
      .getUid()
      .pipe(
        take(1),
        mergeMap((uid) => this.userService.setOnlineStatus(uid, status)),
      )
      .subscribe();
  }

  private subscribeToIncomingCalls() {
    this.incomingCallSubscription = this.callService
      .watchWithDetailsWhileIgnoringUnknownCallers()
      .subscribe((invitation) => {
        this.incomingCall = {
          "their-uid": invitation.sender,
          "is-video": Number(invitation.isVideo),
          polite: 1,
          email: invitation.email,
        };
      });
  }

  private handleSignOut() {
    this.router.navigateByUrl("/auth");
  }

  public handleLogoutClick = () => this.authService.signOutUser();
  public handleModalClose = () => {
    if (!this.incomingCall) return;
    this.callService.cleanUp(this.incomingCall["their-uid"]);
    this.incomingCall = undefined;
  };
  public handleCallAnswer = () => {
    this.router.navigate(["/call"], {
      queryParams: this.incomingCall,
    });
    this.incomingCall = undefined;
  };
  /**
   * Keep for reference in using animations with Angular.
   * public getRouteAnimationData() {
   *  return this.contexts.getContext("primary")?.route?.snapshot?.data?.["animation"];
   * }
  */
}
