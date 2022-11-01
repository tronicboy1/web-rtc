import { Component, HostListener } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { CallService } from "@services/call.service";
import { UserService } from "@services/user.service";
import type { Subscription } from "rxjs";
import { CallQueryParameters } from "./app-routing.module";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular";
  public isAuth = false;
  private subscritions: Subscription[] = [];
  public email?: string;

  constructor(
    private authService: AuthService,
    private router: Router,
    private callService: CallService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    /** Get permission for notifications */
    if ("serviceWorker" in navigator && typeof Notification !== "undefined") {
      Notification.requestPermission();
    }
    /** navigate back to contacts on end of call */
    this.subscritions.push(this.callService.watchForCallEnd().subscribe(() => this.router.navigateByUrl("/contacts")));
    this.authService.getAuthState().subscribe((user) => {
      this.isAuth = Boolean(user);
      if (!user) return this.handleSignOut();
      /** set user status to online */
      this.userService.setOnlineStatus(user.uid, "online");
      this.email = user.email!;
      this.subscritions.push(
        this.callService.watchForInvitations().subscribe((invitation) => {
          const queryParams: CallQueryParameters = {
            "their-uid": invitation.sender,
            "is-video": Number(invitation.isVideo),
            polite: 1,
          };
          this.router.navigate(["/call"], {
            queryParams,
          });
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.subscritions.forEach((sub) => sub.unsubscribe());
  }

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
}
