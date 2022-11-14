import { Component, OnDestroy, OnInit } from "@angular/core";
import { AuthService } from "@services/auth.service";
import { UserData, UserService } from "@services/user.service";
import "@web-components/base-modal";
import { mergeMap, Subscription } from "rxjs";

@Component({
  selector: "app-account-circle",
  templateUrl: "./account-circle.component.html",
  styleUrls: ["./account-circle.component.css"],
})
export class AccountCircleComponent implements OnInit, OnDestroy {
  public showAccountMenu = false;
  public showChangeEmailModal = false;
  public showAccountDetailsModal = false;
  public userData?: UserData;

  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService
        .getUid()
        .pipe(mergeMap((uid) => this.userService.watchUserDoc(uid)))
        .subscribe((userData) => {
          this.userData = userData;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public toggleAccountMenu = (force?: boolean) => (this.showAccountMenu = force ?? !this.showAccountMenu);
  public toggleChangeEmailModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showChangeEmailModal = force ?? !this.showChangeEmailModal;
  };
  public toggleAccountDetailsModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showAccountDetailsModal = force ?? !this.showAccountDetailsModal;
  };
}
