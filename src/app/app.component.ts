import { Component, HostListener } from "@angular/core";
import { ChildrenOutletContexts, Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { CallService } from "@services/call.service";
import { UserService } from "@services/user.service";
import type { Subscription } from "rxjs";
import { CallQueryParameters } from "./app-routing.module";
import "@web-components/base-modal";
import { RtcService } from "@services/rtc.service";
import { slideInAnimation } from "./animations";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  animations: [slideInAnimation],
})
export class AppComponent {
  title = "angular";
  public isAuth = false;
  private subscritions: Subscription[] = [];
  /** Displays email in nav bar. */
  public email?: string;
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
        /** set user status to online */
        this.userService.setOnlineStatus(user.uid, "online");
        this.email = user.email!;
      }),
    );
    this.subscritions.push(
      this.callService.watchWithDetailsWhileIgnoringUnknownCallers().subscribe((invitation) => {
        this.incomingCall = {
          "their-uid": invitation.sender,
          "is-video": Number(invitation.isVideo),
          polite: 1,
          email: invitation.email,
        };
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscritions.forEach((sub) => sub.unsubscribe());
  }

  /** beforeunload does not work on iOS */
  @HostListener("window:beforeunload", ["$event"])
  @HostListener("window:unload", ["$event"])
  public unloadHandler(event: Event) {
    /** Set user status to offline */
    const uid = this.authService.user?.uid;
    if (!uid) return;
    this.userService.setOnlineStatus(uid, "away");
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
  public getRouteAnimationData() {
    return this.contexts.getContext("primary")?.route?.snapshot?.data?.["animation"];
  }
}
