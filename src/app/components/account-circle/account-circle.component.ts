import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { AuthService } from "@services/auth.service";
import "@web-components/base-modal";
import { fromEvent, map, Subscription, take } from "rxjs";

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

  constructor(private authService: AuthService, private santizer: DomSanitizer) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService
        .waitForUser()
        .pipe(map((user) => user.photoURL))
        .subscribe((photoURL) => {
          if (!photoURL) {
            this.photoSrc = undefined;
            this.photoLoaded = false;
            return;
          }
          this.photoSrc = photoURL;
        }),
    );
  }

  ngAfterViewInit(): void {
    if (!this.avatarElement) throw Error("Avatar image element not found.");
    fromEvent(this.avatarElement.nativeElement, "load")
      .pipe(take(1))
      .subscribe(() => (this.photoLoaded = true));
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
