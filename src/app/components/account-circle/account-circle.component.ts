import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AuthService } from "@services/auth.service";
import { UserService } from "@services/user.service";
import "@web-components/base-modal";
import { fromEvent, map, mergeMap, Subscription, take } from "rxjs";

@Component({
  selector: "app-account-circle",
  templateUrl: "./account-circle.component.html",
  styleUrls: ["./account-circle.component.css"],
})
export class AccountCircleComponent implements OnInit, OnDestroy, AfterViewInit {
  public showAccountMenu = false;
  public showChangeEmailModal = false;
  public showChangeAvatarModal = false;
  public showAccountDetailsModal = false;
  public photoSrc?: string;
  public photoLoaded = false;

  @ViewChild("avatar")
  private avatarElement!: ElementRef<HTMLImageElement>;
  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService
        .getUid()
        .pipe(
          take(1),
          mergeMap((uid) => this.userService.watchUserDoc(uid)),
          map((userData) => userData.photoURL),
        )
        .subscribe((photoURL) => {
          if (!photoURL) {
            this.photoLoaded = false;
            this.photoSrc = undefined;
            return;
          }
          this.photoSrc = photoURL;
        }),
    );
  }

  ngAfterViewInit(): void {
    if (!this.avatarElement) throw Error("Avatar image element not found.");
    this.subscriptions.push(
      fromEvent(this.avatarElement.nativeElement, "load").subscribe(() => (this.photoLoaded = true)),
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
  public toggleChangeAvatarModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showChangeAvatarModal = force ?? !this.showChangeAvatarModal;
  };
  public toggleAccountDetailsModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showAccountDetailsModal = force ?? !this.showAccountDetailsModal;
  };
}
