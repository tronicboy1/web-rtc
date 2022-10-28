import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { CallService } from "@services/call.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular";
  public isAuth = false;
  private callSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router, private callService: CallService) {}

  ngOnInit() {
    this.authService.getAuthState().subscribe((user) => {
      this.isAuth = Boolean(user);
      if (!this.isAuth) return this.handleSignOut();
      if (this.isAuth && !this.callSubscription) {
        this.callSubscription = this.callService.watchForInvitations().subscribe((invitation) => {
          this.router.navigate(["/call"], {
            queryParams: { email: invitation.sender, isVideo: invitation.isVideo, polite: true },
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
