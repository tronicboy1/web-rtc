import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { CallService } from "@services/call.service";
import { RtcService } from "@services/rtc.service";
import { Subscription } from "rxjs";
import { CallQueryParameters } from "./app-routing.module";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular";
  public isAuth = false;
  private callSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private callService: CallService,
    private rtcService: RtcService,
  ) {}

  ngOnInit() {
    /** Get permission for notifications */
    if ("serviceWorker" in navigator && typeof Notification !== "undefined") {
      Notification.requestPermission().then((value) => {
        if (value !== "granted") return Promise.resolve();
        return navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("Notifications enabled.", {
            body: "Notifications will be displayed when you receive a call.",
            icon: './assets/icons/icon-192x192.png',
          });
        });
      });
    }
    this.callService.watchForCallEnd().subscribe(() => this.router.navigateByUrl("/contacts"));
    this.authService.getAuthState().subscribe((user) => {
      this.isAuth = Boolean(user);
      if (!this.isAuth) return this.handleSignOut();
      if (this.isAuth && !this.callSubscription) {
        this.callSubscription = this.callService.watchForInvitations().subscribe((invitation) => {
          const queryParams: CallQueryParameters = {
            "their-uid": invitation.sender,
            "is-video": Number(invitation.isVideo),
            polite: 1,
          };
          this.router.navigate(["/call"], {
            queryParams,
          });
        });
      }
    });
  }

  private handleSignOut() {
    this.router.navigateByUrl("/auth");
  }

  public handleLogoutClick = () => this.authService.signOutUser();
}
