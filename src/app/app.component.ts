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
