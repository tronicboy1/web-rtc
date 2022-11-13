import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { AuthService } from "@services/auth.service";
import type { User } from "firebase/auth";
import { Subscription } from "rxjs";
import "@web-components/loading-spinner";

@Component({
  selector: "app-account-details-form",
  templateUrl: "./account-details-form.component.html",
  styleUrls: ["./account-details-form.component.css", "../../../styles/basic-form.css"],
})
export class AccountDetailsFormComponent implements OnInit, OnDestroy {
  public loading = false;
  @Output()
  public submitted = new EventEmitter<null>();
  public user?: User;

  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.waitForUser().subscribe((user) => {
        this.user = user;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public handleSubmit: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("Listener must be used with form.");
    const formData = new FormData(form);
    const displayName = formData.get("display-name")!.toString().trim();
    this.loading = true;
    this.authService
      .updateAccount({ displayName })
      .then(() => this.submitted.emit(null))
      .catch(console.error)
      .finally(() => (this.loading = false));
  };
}
