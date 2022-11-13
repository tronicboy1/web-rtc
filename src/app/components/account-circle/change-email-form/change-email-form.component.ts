import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AuthService } from "@services/auth.service";

@Component({
  selector: "app-change-email-form",
  templateUrl: "./change-email-form.component.html",
  styleUrls: ["./change-email-form.component.css"],
})
export class ChangeEmailFormComponent implements OnInit {
  public loading = false;
  @Output()
  public submitted = new EventEmitter<null>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  public handleSubmit: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("Listener must be used with form.");
    const formData = new FormData(form);
    const newEmail = formData.get("new-email")!.toString().trim();
    this.loading = true;
    this.authService
      .changeEmail(newEmail).then(() => this.submitted.emit(null))
      .catch(console.error)
      .finally(() => (this.loading = false));
  };
}
