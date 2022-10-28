import { Component, OnInit } from "@angular/core";
import { AuthService } from "@services/auth.service";
import "@web-components/base-modal";
import "@web-components/loading-spinner";
import "@web-components/google-icon";

type AuthNavModes = "LOGIN" | "REGISTER";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.css"],
})
export class AuthComponent implements OnInit {
  public showSendEmailModal = false;
  public showResetPasswordModal = false;
  public mode: AuthNavModes = "LOGIN";
  public error = "";
  public loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  public handleLoginSubmit: EventListener = (event) => {
    const formData = this.getFormData(event);
    const email = formData.get("email")!.toString().trim();
    const password = formData.get("password")!.toString().trim();
  };

  public handleSendEmailSubmit: EventListener = (event) => {
    const formData = this.getFormData(event);
    const email = formData.get("email")!.toString().trim();
  };

  public handleResetPasswordSubmit: EventListener = (event) => {
    const formData = this.getFormData(event);
    const email = formData.get("email")!.toString().trim();
  };

  private getFormData(event: Event) {
    event.preventDefault();
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) throw TypeError("Must be used with HTMLFormElement.");
    return new FormData(target);
  }

  private setLoading(promise: Promise<any>) {
    this.loading = true;
    return Promise.resolve(promise).finally(() => (this.loading = false));
  }

  public handleAuthNavClick(mode: AuthNavModes) {
    this.mode = mode;
  }
  public toggleSendEmailModal = (value?: boolean) => (this.showSendEmailModal = value ?? !this.showSendEmailModal);
  public toggleResetPasswordModal = (value?: boolean) =>
    (this.showResetPasswordModal = value ?? !this.showResetPasswordModal);
}
